import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import ffprobeStatic from 'ffprobe-static';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuid } from 'uuid';
import { outputDir, tempDir } from '../utils/FilePathUtils.js';
import { EventEmitter } from 'events';

// Configure FFmpeg with static binaries
ffmpeg.setFfmpegPath(ffmpegStatic);
ffmpeg.setFfprobePath(ffprobeStatic);

/**
 * Enhanced Video Splitter Service
 * Provides robust video splitting functionality with progress tracking,
 * error handling, and support for multiple video formats
 */
class VideoSplitterService extends EventEmitter {
  constructor() {
    super();
    this.supportedFormats = [
      '.mp4', '.avi', '.mov', '.mkv', '.wmv', '.flv', 
      '.webm', '.m4v', '.3gp', '.ogv', '.m2v', '.ts'
    ];
    
    this.activeJobs = new Map();
  }

  /**
   * Split video into multiple segments based on time ranges
   */
  async splitVideo(inputPath, segments, options = {}) {
    const jobId = uuid();
    const jobOutputDir = path.join(outputDir, `split_${jobId}`);
    
    try {
      const {
        outputFormat = 'mp4',
        quality = 'medium',
        preserveAudio = true,
        deleteOriginal = false
      } = options;

      // Validate input file
      await this.validateVideoFile(inputPath);
      
      // Get video metadata
      const metadata = await this.getVideoMetadata(inputPath);
      
      // Validate and process segments
      const validatedSegments = await this.validateSegments(segments, metadata.duration);
      
      // Create job tracking
      this.activeJobs.set(jobId, {
        status: 'processing',
        totalSegments: validatedSegments.length,
        completedSegments: 0,
        startTime: Date.now(),
        inputFile: path.basename(inputPath),
        outputDirectory: jobOutputDir,
        segments: []
      });

      const outputSegments = [];
      
      for (let i = 0; i < validatedSegments.length; i++) {
        const segment = validatedSegments[i];
        
        try {
          const segmentResult = await this.createSegment(
            inputPath, 
            segment, 
            i + 1, 
            outputFormat,
            quality,
            preserveAudio,
            jobId
          );
          
          outputSegments.push(segmentResult);
          
          // Update progress
          const job = this.activeJobs.get(jobId);
          job.completedSegments = i + 1;
          job.segments.push(segmentResult);
          
          this.emit('progress', {
            jobId,
            progress: (i + 1) / validatedSegments.length * 100,
            completedSegments: i + 1,
            totalSegments: validatedSegments.length,
            currentSegment: segmentResult
          });
          
        } catch (error) {
          console.error(`Error creating segment ${i + 1}:`, error);
          throw new Error(`Failed to create segment ${i + 1}: ${error.message}`);
        }
      }

      // Final result
      const result = {
        jobId,
        success: true,
        inputFile: path.basename(inputPath),
        totalSegments: outputSegments.length,
        segments: outputSegments,
        outputDirectory: jobOutputDir,
        metadata: metadata,
        processingTime: Date.now() - this.activeJobs.get(jobId).startTime
      };

      // Update job status
      this.activeJobs.set(jobId, {
        ...this.activeJobs.get(jobId),
        status: 'completed',
        result
      });

      // Clean up original file if requested
      if (deleteOriginal) {
        try {
          await fs.unlink(inputPath);
        } catch (error) {
          console.warn('Failed to delete original file:', error.message);
        }
      }

      this.emit('completed', result);
      
      return result;
      
    } catch (error) {
      // Update job status to failed
      if (this.activeJobs.has(jobId)) {
        this.activeJobs.set(jobId, {
          ...this.activeJobs.get(jobId),
          status: 'failed',
          error: error.message
        });
      }
      
      this.emit('error', { jobId, error: error.message });
      throw error;
    }
  }

  /**
   * Split video by scenes using FFmpeg scene detection
   */
  async splitVideoByScenes(inputPath, options = {}) {
    const jobId = uuid();
    
    try {
      const {
        sensitivity = 0.3, // Scene change sensitivity (0.1 - 1.0)
        minSceneDuration = 1, // Minimum scene duration in seconds
        maxScenes = 50, // Maximum number of scenes
        outputFormat = 'mp4',
        quality = 'medium'
      } = options;

      await this.validateVideoFile(inputPath);
      const metadata = await this.getVideoMetadata(inputPath);
      
      // Detect scene changes
      const sceneTimestamps = await this.detectScenes(inputPath, sensitivity, minSceneDuration);
      
      // Limit number of scenes
      const limitedScenes = sceneTimestamps.slice(0, maxScenes);
      
      // Convert timestamps to segments
      const segments = [];
      for (let i = 0; i < limitedScenes.length; i++) {
        const startTime = limitedScenes[i];
        const endTime = limitedScenes[i + 1] || metadata.duration;
        
        segments.push({
          name: `scene_${i + 1}`,
          startTime,
          endTime,
          duration: endTime - startTime
        });
      }

      // Process segments using the regular split method
      return await this.splitVideo(inputPath, segments, {
        outputFormat,
        quality,
        preserveAudio: true
      });
      
    } catch (error) {
      this.emit('error', { jobId, error: error.message });
      throw error;
    }
  }

  /**
   * Create a single video segment
   */
  async createSegment(inputPath, segment, segmentIndex, outputFormat, quality, preserveAudio, jobId) {
    return new Promise((resolve, reject) => {
      const outputFileName = `${segment.name || `segment_${segmentIndex}`}.${outputFormat}`;
      const outputPath = path.join(outputDir, `split_${jobId}`, outputFileName);
      
      // Ensure output directory exists
      fs.mkdir(path.dirname(outputPath), { recursive: true }).then(() => {
        
        let command = ffmpeg(inputPath)
          .seekInput(segment.startTime)
          .duration(segment.duration || segment.endTime - segment.startTime);

        // Quality settings
        switch (quality) {
          case 'high':
            command = command.videoBitrate('2000k').audioBitrate('192k');
            break;
          case 'medium':
            command = command.videoBitrate('1000k').audioBitrate('128k');
            break;
          case 'low':
            command = command.videoBitrate('500k').audioBitrate('96k');
            break;
        }

        // Audio handling
        if (!preserveAudio) {
          command = command.noAudio();
        }

        // Output format specific settings
        if (outputFormat === 'mp4') {
          command = command
            .videoCodec('libx264')
            .audioCodec('aac')
            .format('mp4')
            .addOption('-movflags', 'faststart');
        } else if (outputFormat === 'webm') {
          command = command
            .videoCodec('libvpx-vp9')
            .audioCodec('libopus')
            .format('webm');
        }

        command
          .on('start', (commandLine) => {
            console.log(`Started segment ${segmentIndex}: ${commandLine}`);
          })
          .on('progress', (progress) => {
            this.emit('segmentProgress', {
              jobId,
              segmentIndex,
              segmentName: segment.name || `segment_${segmentIndex}`,
              progress: progress.percent || 0,
              timemark: progress.timemark,
              currentFps: progress.currentFps,
              targetSize: progress.targetSize
            });
          })
          .on('end', async () => {
            try {
              const stats = await fs.stat(outputPath);
              const segmentResult = {
                name: segment.name || `segment_${segmentIndex}`,
                filename: outputFileName,
                path: outputPath,
                startTime: segment.startTime,
                endTime: segment.endTime,
                duration: segment.duration || segment.endTime - segment.startTime,
                size: stats.size,
                format: outputFormat,
                downloadUrl: `/api/split/video/download/${jobId}/${outputFileName}`,
                previewUrl: `/api/split/video/preview/${jobId}/${outputFileName}`
              };
              
              console.log(`Completed segment ${segmentIndex}: ${outputFileName}`);
              resolve(segmentResult);
            } catch (error) {
              reject(new Error(`Failed to get segment stats: ${error.message}`));
            }
          })
          .on('error', (error) => {
            console.error(`Error processing segment ${segmentIndex}:`, error);
            reject(new Error(`FFmpeg error for segment ${segmentIndex}: ${error.message}`));
          })
          .save(outputPath);
          
      }).catch(reject);
    });
  }

  /**
   * Detect scene changes in video
   */
  async detectScenes(inputPath, sensitivity = 0.3, minDuration = 1) {
    return new Promise((resolve, reject) => {
      const scenes = [];
      
      ffmpeg(inputPath)
        .videoFilters(`select='gt(scene,${sensitivity})',showinfo`)
        .format('null')
        .on('start', () => {
          console.log('Starting scene detection...');
        })
        .on('stderr', (stderrLine) => {
          // Parse scene detection output
          const sceneMatch = stderrLine.match(/pts_time:(\d+\.?\d*)/);
          if (sceneMatch) {
            const timestamp = parseFloat(sceneMatch[1]);
            if (scenes.length === 0 || timestamp - scenes[scenes.length - 1] >= minDuration) {
              scenes.push(timestamp);
            }
          }
        })
        .on('end', () => {
          console.log(`Scene detection completed. Found ${scenes.length} scenes.`);
          resolve(scenes.length > 0 ? scenes : [0]); // At least one scene starting at 0
        })
        .on('error', (error) => {
          console.error('Scene detection error:', error);
          reject(new Error(`Scene detection failed: ${error.message}`));
        })
        .save('-');
    });
  }

  /**
   * Get video metadata using FFprobe
   */
  async getVideoMetadata(inputPath) {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(inputPath, (err, metadata) => {
        if (err) {
          reject(new Error(`Failed to get video metadata: ${err.message}`));
          return;
        }

        const videoStream = metadata.streams.find(stream => stream.codec_type === 'video');
        const audioStream = metadata.streams.find(stream => stream.codec_type === 'audio');

        resolve({
          duration: metadata.format.duration,
          size: metadata.format.size,
          format: metadata.format.format_name,
          video: videoStream ? {
            codec: videoStream.codec_name,
            width: videoStream.width,
            height: videoStream.height,
            fps: eval(videoStream.r_frame_rate) || 25,
            bitrate: videoStream.bit_rate
          } : null,
          audio: audioStream ? {
            codec: audioStream.codec_name,
            sampleRate: audioStream.sample_rate,
            channels: audioStream.channels,
            bitrate: audioStream.bit_rate
          } : null
        });
      });
    });
  }

  /**
   * Validate video file
   */
  async validateVideoFile(inputPath) {
    try {
      const stats = await fs.stat(inputPath);
      
      if (!stats.isFile()) {
        throw new Error('Input path is not a file');
      }

      const ext = path.extname(inputPath).toLowerCase();
      if (!this.supportedFormats.includes(ext)) {
        throw new Error(`Unsupported video format: ${ext}. Supported formats: ${this.supportedFormats.join(', ')}`);
      }

      // Check file size (max 2GB for safety)
      if (stats.size > 2 * 1024 * 1024 * 1024) {
        throw new Error('File too large. Maximum supported size is 2GB');
      }

      return true;
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new Error('Video file not found');
      }
      throw error;
    }
  }

  /**
   * Validate and process segment definitions
   */
  async validateSegments(segments, videoDuration) {
    if (!Array.isArray(segments) || segments.length === 0) {
      throw new Error('At least one segment must be specified');
    }

    const validatedSegments = [];

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      
      if (typeof segment.startTime !== 'number' || segment.startTime < 0) {
        throw new Error(`Invalid start time for segment ${i + 1}: must be a positive number`);
      }
      
      if (typeof segment.endTime !== 'number' || segment.endTime <= segment.startTime) {
        throw new Error(`Invalid end time for segment ${i + 1}: must be greater than start time`);
      }
      
      if (segment.endTime > videoDuration) {
        throw new Error(`End time for segment ${i + 1} exceeds video duration (${videoDuration}s)`);
      }

      const duration = segment.endTime - segment.startTime;
      if (duration < 0.1) {
        throw new Error(`Segment ${i + 1} too short: minimum duration is 0.1 seconds`);
      }

      validatedSegments.push({
        name: segment.name || `segment_${i + 1}`,
        startTime: segment.startTime,
        endTime: segment.endTime,
        duration: duration
      });
    }

    return validatedSegments;
  }

  /**
   * Get job status
   */
  getJobStatus(jobId) {
    return this.activeJobs.get(jobId) || null;
  }

  /**
   * Cancel a running job
   */
  cancelJob(jobId) {
    const job = this.activeJobs.get(jobId);
    if (job && job.status === 'processing') {
      job.status = 'cancelled';
      this.emit('cancelled', { jobId });
      return true;
    }
    return false;
  }

  /**
   * Clean up completed jobs older than specified time
   */
  async cleanupOldJobs(maxAgeHours = 24) {
    const maxAge = maxAgeHours * 60 * 60 * 1000;
    const now = Date.now();
    
    for (const [jobId, job] of this.activeJobs.entries()) {
      if (job.status === 'completed' && (now - job.startTime) > maxAge) {
        // Clean up output files
        try {
          const jobOutputDir = path.join(outputDir, `split_${jobId}`);
          await fs.rm(jobOutputDir, { recursive: true, force: true });
        } catch (error) {
          console.warn(`Failed to cleanup job ${jobId}:`, error.message);
        }
        
        this.activeJobs.delete(jobId);
      }
    }
  }

  /**
   * Parse time string (HH:MM:SS or MM:SS or seconds) to seconds
   */
  static parseTimeToSeconds(timeString) {
    if (typeof timeString === 'number') {
      return timeString;
    }
    
    const parts = timeString.toString().split(':').map(Number);
    
    if (parts.length === 1) {
      return parts[0]; // Already in seconds
    } else if (parts.length === 2) {
      return parts[0] * 60 + parts[1]; // MM:SS
    } else if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2]; // HH:MM:SS
    } else {
      throw new Error('Invalid time format. Use HH:MM:SS, MM:SS, or seconds');
    }
  }

  /**
   * Format seconds to HH:MM:SS
   */
  static formatSecondsToTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
}

export default VideoSplitterService;
