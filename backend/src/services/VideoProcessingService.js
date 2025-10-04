/**
 * Core Video Processing Service
 * Unified service for all video operations including conversion, splitting, and analysis.
 * 
 * Replaces: VideoSplitterService, videoService, VideoJSService, ffmpegService
 * 
 * @author Media Converter Team
 */

import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import ffprobePath from 'ffprobe-static';
import path from 'path';
import fs from 'fs/promises';
import { EventEmitter } from 'events';
import { v4 as uuid } from 'uuid';
import { outputDir, tempDir, formatFileSize } from '../utils/FilePathUtils.js';

// Configure ffmpeg paths
ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath.path);

/**
 * Core video processing service with comprehensive functionality
 */
export class VideoProcessor extends EventEmitter {
  constructor() {
    super();
    this.activeJobs = new Map();
    this.supportedFormats = {
      input: ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.mkv', '.m4v', '.3gp'],
      output: ['.mp4', '.avi', '.mov', '.webm', '.gif', '.mp3', '.wav']
    };
  }

  /**
   * Convert video to different format
   */
  async convertVideo(inputPath, options = {}) {
    const {
      outputFormat = 'mp4',
      quality = 'medium',
      width,
      height,
      fps,
      bitrate,
      outputName = `converted_${uuid()}.${outputFormat}`
    } = options;

    const outputPath = path.join(outputDir, outputName);
    const jobId = uuid();

    return new Promise((resolve, reject) => {
      let command = ffmpeg(inputPath);

      // Apply quality settings
      switch (quality) {
        case 'low':
          command = command.videoBitrate('500k').audioBitrate('64k');
          break;
        case 'medium':
          command = command.videoBitrate('1000k').audioBitrate('128k');
          break;
        case 'high':
          command = command.videoBitrate('2000k').audioBitrate('192k');
          break;
        case 'ultra':
          command = command.videoBitrate('4000k').audioBitrate('256k');
          break;
      }

      // Apply custom settings
      if (width && height) {
        command = command.size(`${width}x${height}`);
      }
      if (fps) {
        command = command.fps(fps);
      }
      if (bitrate) {
        command = command.videoBitrate(bitrate);
      }

      // Format-specific optimizations
      switch (outputFormat.toLowerCase()) {
        case 'mp4':
          command = command.videoCodec('libx264').audioCodec('aac');
          break;
        case 'webm':
          command = command.videoCodec('libvpx-vp9').audioCodec('libvorbis');
          break;
        case 'avi':
          command = command.videoCodec('libxvid').audioCodec('mp3');
          break;
      }

      this.activeJobs.set(jobId, {
        status: 'processing',
        progress: 0,
        startTime: Date.now()
      });

      command
        .on('progress', (progress) => {
          const jobInfo = this.activeJobs.get(jobId);
          if (jobInfo) {
            jobInfo.progress = Math.round(progress.percent || 0);
            this.activeJobs.set(jobId, jobInfo);
            this.emit(`progress-${jobId}`, jobInfo.progress);
          }
        })
        .on('end', async () => {
          try {
            const stats = await fs.stat(outputPath);
            const originalStats = await fs.stat(inputPath);
            
            const result = {
              jobId,
              outputPath,
              outputName,
              size: stats.size,
              originalSize: originalStats.size,
              compression: `${((originalStats.size - stats.size) / originalStats.size * 100).toFixed(1)}%`,
              duration: Date.now() - this.activeJobs.get(jobId).startTime
            };

            this.activeJobs.set(jobId, {
              status: 'completed',
              progress: 100,
              result
            });

            this.emit(`complete-${jobId}`, result);
            resolve(result);
          } catch (error) {
            reject(error);
          }
        })
        .on('error', (error) => {
          this.activeJobs.set(jobId, {
            status: 'failed',
            error: error.message
          });
          this.emit(`error-${jobId}`, error);
          reject(error);
        })
        .save(outputPath);
    });
  }

  /**
   * Split video into segments
   */
  async splitVideo(inputPath, segments = []) {
    if (!segments.length) {
      throw new Error('No segments provided for splitting');
    }

    const jobId = uuid();
    const results = [];

    try {
      for (let i = 0; i < segments.length; i++) {
        const segment = segments[i];
        const outputName = `segment_${i + 1}_${uuid()}.mp4`;
        const outputPath = path.join(outputDir, outputName);

        await new Promise((resolve, reject) => {
          ffmpeg(inputPath)
            .seekInput(segment.start)
            .duration(segment.duration)
            .output(outputPath)
            .on('end', () => resolve())
            .on('error', reject)
            .run();
        });

        const stats = await fs.stat(outputPath);
        results.push({
          segmentIndex: i + 1,
          outputPath,
          outputName,
          size: stats.size,
          start: segment.start,
          duration: segment.duration
        });

        // Update progress
        const progress = Math.round(((i + 1) / segments.length) * 100);
        this.emit(`progress-${jobId}`, progress);
      }

      const jobResult = {
        jobId,
        total: segments.length,
        results
      };

      this.activeJobs.set(jobId, {
        status: 'completed',
        progress: 100,
        result: jobResult
      });

      this.emit(`complete-${jobId}`, jobResult);
      return jobResult;

    } catch (error) {
      this.activeJobs.set(jobId, {
        status: 'failed',
        error: error.message
      });
      this.emit(`error-${jobId}`, error);
      throw error;
    }
  }

  /**
   * Split video by scene detection
   */
  async splitByScenes(inputPath, options = {}) {
    const { threshold = 0.3, minDuration = 2 } = options;
    const jobId = uuid();

    return new Promise((resolve, reject) => {
      const tempOutput = path.join(tempDir, `scenes_${uuid()}`);
      
      ffmpeg(inputPath)
        .videoFilters(`select='gt(scene,${threshold})',metadata=print:file=${tempOutput}.log`)
        .output(`${tempOutput}_%03d.mp4`)
        .on('end', async () => {
          try {
            // Process the generated scene files
            const files = await fs.readdir(tempDir);
            const sceneFiles = files.filter(f => f.startsWith(path.basename(tempOutput)));
            
            const results = await Promise.all(
              sceneFiles.map(async (file, index) => {
                const filePath = path.join(tempDir, file);
                const stats = await fs.stat(filePath);
                const outputName = `scene_${index + 1}_${uuid()}.mp4`;
                const finalPath = path.join(outputDir, outputName);
                
                await fs.rename(filePath, finalPath);
                
                return {
                  sceneIndex: index + 1,
                  outputPath: finalPath,
                  outputName,
                  size: stats.size
                };
              })
            );

            const jobResult = {
              jobId,
              total: results.length,
              results,
              method: 'scene-detection',
              threshold
            };

            this.activeJobs.set(jobId, {
              status: 'completed',
              progress: 100,
              result: jobResult
            });

            this.emit(`complete-${jobId}`, jobResult);
            resolve(jobResult);
          } catch (error) {
            reject(error);
          }
        })
        .on('error', (error) => {
          this.activeJobs.set(jobId, {
            status: 'failed',
            error: error.message
          });
          reject(error);
        })
        .run();
    });
  }

  /**
   * Extract frames from video
   */
  async extractFrames(inputPath, options = {}) {
    const {
      fps = 1,
      format = 'png',
      quality = 90,
      width,
      height,
      startTime = 0,
      endTime,
      outputDirectory = path.join(outputDir, `video_split_${uuid()}`)
    } = options;

    const jobId = uuid();
    const frameToken = uuid().replace(/-/g, '');
    const fileExtension = format.replace(/^\./, '').toLowerCase();
    const framePattern = `frame_${frameToken}_%04d.${fileExtension}`;
    const outputPattern = path.join(outputDirectory, framePattern);

    await fs.mkdir(outputDirectory, { recursive: true });

    return new Promise((resolve, reject) => {
      let command = ffmpeg(inputPath)
        .fps(fps);

      if (startTime) {
        command = command.seekInput(startTime);
      }

      if (endTime && endTime > startTime) {
        command = command.duration(endTime - startTime);
      }

      const filters = [];
      if (width && height) {
        filters.push(`scale=${Math.round(width)}:${Math.round(height)}:flags=lanczos`);
      } else if (width) {
        filters.push(`scale=${Math.round(width)}:-1:flags=lanczos`);
      } else if (height) {
        filters.push(`scale=-1:${Math.round(height)}:flags=lanczos`);
      }

      if (filters.length) {
        command = command.videoFilters(filters.join(','));
      }

      // Adjust quality for jpeg outputs
      if (['jpg', 'jpeg'].includes(fileExtension)) {
        const qscale = Math.max(2, Math.min(31, Math.round((100 - quality) / 3)));
        command = command.outputOptions(['-qscale:v', String(qscale)]);
      }

      command
        .output(outputPattern)
        .on('end', async () => {
          try {
            const files = await fs.readdir(outputDirectory);
            const frameFiles = files
              .filter((file) => file.startsWith(`frame_${frameToken}_`))
              .sort();

            const frames = await Promise.all(
              frameFiles.map(async (filename, index) => {
                const framePath = path.join(outputDirectory, filename);
                const stats = await fs.stat(framePath);
                return {
                  filename,
                  path: framePath,
                  frameNumber: index + 1,
                  size: stats.size
                };
              })
            );

            let metadata = null;
            try {
              metadata = await this.getVideoInfo(inputPath);
            } catch (metaError) {
              console.warn('Failed to collect video metadata for split frames:', metaError.message);
            }

            const inferredWidth = metadata?.video?.width || (width ? Number(width) : null);
            const inferredHeight = metadata?.video?.height || (height ? Number(height) : null);

            const framesWithDimensions = frames.map((frame) => ({
              ...frame,
              width: inferredWidth,
              height: inferredHeight,
              delay: null
            }));

            const duration = endTime && endTime > startTime
              ? endTime - startTime
              : metadata?.duration || null;

            const jobResult = {
              jobId,
              success: true,
              frames: framesWithDimensions,
              totalFrames: framesWithDimensions.length,
              outputDirectory,
              fps,
              format: fileExtension,
              startTime,
              endTime: endTime || null,
              duration,
              width: inferredWidth,
              height: inferredHeight
            };

            this.activeJobs.set(jobId, {
              status: 'completed',
              progress: 100,
              result: jobResult
            });

            resolve(jobResult);
          } catch (error) {
            reject(error);
          }
        })
        .on('error', (error) => {
          this.activeJobs.set(jobId, {
            status: 'failed',
            error: error.message
          });
          reject(error);
        })
        .run();
    });
  }

  /**
   * Get video information and metadata
   */
  async getVideoInfo(videoPath) {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(videoPath, (err, metadata) => {
        if (err) {
          reject(new Error(`Failed to get video info: ${err.message}`));
          return;
        }

        const videoStream = metadata.streams.find(s => s.codec_type === 'video');
        const audioStream = metadata.streams.find(s => s.codec_type === 'audio');

        resolve({
          filename: path.basename(videoPath),
          duration: parseFloat(metadata.format.duration),
          size: parseInt(metadata.format.size),
          bitrate: parseInt(metadata.format.bit_rate),
          video: videoStream ? {
            codec: videoStream.codec_name,
            width: videoStream.width,
            height: videoStream.height,
            fps: eval(videoStream.r_frame_rate),
            bitrate: parseInt(videoStream.bit_rate)
          } : null,
          audio: audioStream ? {
            codec: audioStream.codec_name,
            sampleRate: parseInt(audioStream.sample_rate),
            channels: audioStream.channels,
            bitrate: parseInt(audioStream.bit_rate)
          } : null
        });
      });
    });
  }

  /**
   * Get job status
   */
  getJobStatus(jobId) {
    return this.activeJobs.get(jobId) || null;
  }

  /**
   * Get job results
   */
  getJobResults(jobId) {
    const job = this.activeJobs.get(jobId);
    return job?.result || null;
  }

  /**
   * Cancel job
   */
  cancelJob(jobId) {
    const job = this.activeJobs.get(jobId);
    if (job && job.status === 'processing') {
      job.status = 'cancelled';
      this.activeJobs.set(jobId, job);
      this.emit(`cancelled-${jobId}`);
      return true;
    }
    return false;
  }

  /**
   * Clean up old jobs
   */
  cleanupJobs(maxAge = 3600000) { // 1 hour default
    const now = Date.now();
    for (const [jobId, job] of this.activeJobs.entries()) {
      if (job.startTime && (now - job.startTime) > maxAge) {
        this.activeJobs.delete(jobId);
      }
    }
  }

  /**
   * Process video and return info (for upload endpoint)
   */
  async processVideo(filePath, originalName) {
    const videoId = uuid();
    const info = await this.getVideoInfo(filePath);
    
    // Store video info for later use
    const videoData = {
      videoId,
      filePath,
      originalFilename: originalName,
      ...info
    };
    
    // Store in memory for now (you might want to use a database)
    this.videoStore = this.videoStore || new Map();
    this.videoStore.set(videoId, videoData);
    
    return videoData;
  }

  /**
   * Process video from URL
   */
  async processVideoFromUrl(url) {
    // Download video from URL first
    const videoId = uuid();
    const tempPath = path.join(tempDir, `video_${videoId}.mp4`);
    
    // Simple URL download implementation (you might want to improve this)
    const https = await import('https');
    const http = await import('http');
    const fs = await import('fs');
    
    return new Promise((resolve, reject) => {
      const protocol = url.startsWith('https') ? https : http;
      const file = fs.createWriteStream(tempPath);
      
      protocol.get(url, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`Failed to download: ${response.statusCode}`));
          return;
        }
        
        response.pipe(file);
        
        file.on('finish', async () => {
          try {
            const result = await this.processVideo(tempPath, path.basename(url));
            resolve(result);
          } catch (error) {
            reject(error);
          }
        });
        
        file.on('error', reject);
      }).on('error', reject);
    });
  }

  /**
   * Get video preview path
   */
  async getVideoPreviewPath(videoId) {
    this.videoStore = this.videoStore || new Map();
    const videoData = this.videoStore.get(videoId);
    
    if (!videoData) {
      throw new Error('Video not found');
    }
    
    return videoData.filePath;
  }

  /**
   * Convert video to GIF
   */
  async convertToGif(videoId, options = {}) {
    const {
      startTime = 0,
      endTime = 5,
      width,
      height,
      fps = 10,
      quality = 90,
      method = 'ffmpeg'
    } = options;

    this.videoStore = this.videoStore || new Map();
    const videoData = this.videoStore.get(videoId);

    if (!videoData) {
      throw new Error('Video not found');
    }

    if (method && method !== 'ffmpeg') {
      console.warn(`Unsupported GIF conversion method "${method}" requested. Falling back to ffmpeg.`);
    }

    const clampNumber = (value, min, max, fallback) => {
      const numeric = Number(value);
      if (!Number.isFinite(numeric)) {
        return fallback;
      }
      return Math.min(max, Math.max(min, numeric));
    };

    const sanitizeDimension = (value) => {
      if (!Number.isFinite(value) || value <= 0) {
        return undefined;
      }
      const rounded = Math.max(2, Math.round(value));
      return rounded % 2 === 0 ? rounded : rounded - 1;
    };

    const startTimeValue = clampNumber(startTime, 0, Number.MAX_SAFE_INTEGER, 0);
    const endTimeValue = clampNumber(endTime, startTimeValue + 0.1, Number.MAX_SAFE_INTEGER, startTimeValue + 5);
    const durationSeconds = Math.max(0.1, endTimeValue - startTimeValue);
    const fpsValue = clampNumber(fps, 1, 60, 10);
    const normalizedQuality = clampNumber(quality, 10, 100, 90);
    const targetWidth = sanitizeDimension(Number(width));
    const targetHeight = sanitizeDimension(Number(height));

    const filters = [`fps=${fpsValue}`];
    if (targetWidth && targetHeight) {
      filters.push(`scale=${targetWidth}:${targetHeight}:flags=lanczos`);
    } else if (targetWidth) {
      filters.push(`scale=${targetWidth}:-1:flags=lanczos`);
    } else if (targetHeight) {
      filters.push(`scale=-1:${targetHeight}:flags=lanczos`);
    }

    const filterBase = filters.join(',');
    const paletteMode = normalizedQuality >= 85 ? 'full' : 'diff';
    const ditherType = normalizedQuality >= 90 ? 'floyd_steinberg' : 'bayer';
    const bayerScale = normalizedQuality >= 90 ? 1 : normalizedQuality >= 75 ? 3 : 5;

    const outputName = `gif_${uuid()}.gif`;
    const outputPath = path.join(outputDir, outputName);
    const palettePath = path.join(tempDir, `palette_${uuid()}.png`);

    const runCommand = (command) => new Promise((resolve, reject) => {
      command
        .on('end', resolve)
        .on('error', reject)
        .run();
    });

    try {
      // Step 1: generate palette for high-quality colors
      await runCommand(
        ffmpeg(videoData.filePath)
          .seekInput(startTimeValue)
          .duration(durationSeconds)
          .outputOptions([
            '-vf', `${filterBase},palettegen=stats_mode=${paletteMode}`,
            '-y'
          ])
          .output(palettePath)
      );

      const ditherOptions = ditherType === 'bayer'
        ? `dither=bayer:bayer_scale=${bayerScale}`
        : `dither=${ditherType}`;
      const filterComplex = `[0:v]${filterBase}[x];[x][1:v]paletteuse=${ditherOptions}`;

      // Step 2: render GIF using the generated palette
      await runCommand(
        ffmpeg(videoData.filePath)
          .seekInput(startTimeValue)
          .duration(durationSeconds)
          .addInput(palettePath)
          .complexFilter(filterComplex)
          .outputOptions([
            '-loop', '0',
            '-y'
          ])
          .output(outputPath)
      );

      const [stats, metadata] = await Promise.all([
        fs.stat(outputPath),
        new Promise((resolve) => {
          ffmpeg.ffprobe(outputPath, (err, probeData) => {
            if (err) {
              resolve(null);
              return;
            }
            const stream = probeData.streams?.find((s) => s.codec_type === 'video');
            resolve({
              width: stream?.width,
              height: stream?.height,
              frames: stream?.nb_frames ? parseInt(stream.nb_frames, 10) : null,
              duration: probeData.format?.duration ? parseFloat(probeData.format.duration) : null
            });
          });
        })
      ]);

      const inferredWidth = metadata?.width || targetWidth || videoData.video?.width;
      const inferredHeight = metadata?.height || targetHeight || videoData.video?.height;
      const inferredDuration = metadata?.duration || durationSeconds;
      const frameCount = metadata?.frames || Math.round(inferredDuration * fpsValue);

      return {
        success: true,
        gifPath: outputName,
        downloadUrl: `/api/video/download/${outputName}`,
        previewUrl: `/api/video/gif-preview/${outputName}`,
        outputPath,
        fileSize: formatFileSize(stats.size),
        fileSizeBytes: stats.size,
        width: inferredWidth,
        height: inferredHeight,
        fps: fpsValue,
        duration: Number(inferredDuration.toFixed(2)),
        frames: frameCount,
        palette: paletteMode,
        dither: ditherType
      };
    } finally {
      await fs.unlink(palettePath).catch(() => {});
    }
  }

  /**
   * Get GIF path from filename
   */
  async getGifPath(gifPath) {
    return path.join(outputDir, gifPath);
  }

  /**
   * Cleanup video and related files
   */
  async cleanup(videoId) {
    this.videoStore = this.videoStore || new Map();
    const videoData = this.videoStore.get(videoId);
    
    if (videoData) {
      // Clean up video file
      try {
        await fs.unlink(videoData.filePath);
      } catch (e) {
        // File might not exist, ignore error
      }
      
      // Remove from store
      this.videoStore.delete(videoId);
    }
    
    return { success: true };
  }
}

// Export singleton instance
export const videoProcessor = new VideoProcessor();
export default VideoProcessor;
