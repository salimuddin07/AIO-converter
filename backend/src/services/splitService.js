import sharp from 'sharp';
import fs from 'fs/promises';
import { createWriteStream } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import archiver from 'archiver';
import { v4 as uuid } from 'uuid';
import { outputDir, tempDir } from '../lib/file-paths.js';
import { EventEmitter } from 'events';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Enhanced GIF Splitter Service
 * Provides robust GIF frame extraction with multiple output formats,
 * batch processing, and comprehensive error handling
 */
export class SplitService extends EventEmitter {
  constructor() {
    super();
    this.supportedFormats = ['.gif', '.webp', '.apng', '.mng', '.avif', '.jxl'];
    this.outputFormats = ['png', 'jpeg', 'webp', 'bmp', 'tiff'];
    this.activeJobs = new Map();
  }
  /**
   * Enhanced GIF splitting with multiple output formats and options
   */
  async splitAnimatedImage(inputPath, options = {}) {
    const jobId = uuid();
    
    try {
      const {
        outputFormat = 'png',
        quality = 90,
        resize = null, // {width, height} or null
        frameRange = null, // {start, end} or null for all frames
        skipDuplicates = false,
        createZip = true,
        outputDir: customOutputDir = null
      } = options;

      // Validate inputs
      this.validateInputFile(inputPath);
      this.validateOutputFormat(outputFormat);
      
      const targetOutputDir = customOutputDir || path.join(outputDir, `gif_split_${jobId}`);
      await fs.mkdir(targetOutputDir, { recursive: true });
      
      const inputBuffer = await fs.readFile(inputPath);
      const metadata = await sharp(inputBuffer).metadata();
      
      if (!metadata.pages || metadata.pages <= 1) {
        throw new Error('This image does not contain multiple frames or is not animated');
      }

      // Initialize job tracking
      this.activeJobs.set(jobId, {
        status: 'processing',
        totalFrames: metadata.pages,
        processedFrames: 0,
        startTime: Date.now(),
        inputFile: path.basename(inputPath),
        options: options
      });
      
      const frames = [];
      const frameDelay = metadata.delay || [];
      let duplicateCount = 0;
      let previousFrameHash = null;
      
      // Determine frame range
      const startFrame = frameRange?.start || 0;
      const endFrame = Math.min(frameRange?.end || metadata.pages - 1, metadata.pages - 1);
      
      // Extract each frame
      for (let i = startFrame; i <= endFrame; i++) {
        try {
          let frameBuffer = await sharp(inputBuffer, { page: i })
            .toFormat(outputFormat === 'jpeg' ? 'jpeg' : outputFormat, {
              quality: outputFormat === 'jpeg' ? quality : undefined,
              compression: outputFormat === 'png' ? 9 : undefined
            })
            .toBuffer();

          // Apply resize if specified
          if (resize && (resize.width || resize.height)) {
            frameBuffer = await sharp(frameBuffer)
              .resize(resize.width, resize.height, {
                fit: 'inside',
                withoutEnlargement: true
              })
              .toBuffer();
          }

          // Check for duplicates if requested
          if (skipDuplicates && previousFrameHash) {
            const currentHash = await this.calculateFrameHash(frameBuffer);
            if (currentHash === previousFrameHash) {
              duplicateCount++;
              continue;
            }
            previousFrameHash = currentHash;
          } else if (skipDuplicates) {
            previousFrameHash = await this.calculateFrameHash(frameBuffer);
          }
          
          const filename = `frame_${String(i + 1).padStart(4, '0')}.${outputFormat}`;
          const framePath = path.join(targetOutputDir, filename);
          
          await fs.writeFile(framePath, frameBuffer);
          
          // Get frame dimensions
          const frameMetadata = await sharp(frameBuffer).metadata();
          
          const frameInfo = {
            filename,
            path: framePath,
            width: frameMetadata.width,
            height: frameMetadata.height,
            delay: frameDelay[i] || 100,
            index: i,
            size: frameBuffer.length,
            format: outputFormat,
            downloadUrl: `/api/split/gif/download/${jobId}/${filename}`,
            previewUrl: `/api/split/gif/preview/${jobId}/${filename}`
          };
          
          frames.push(frameInfo);
          
          // Update progress
          const job = this.activeJobs.get(jobId);
          job.processedFrames = frames.length;
          
          this.emit('progress', {
            jobId,
            progress: ((i - startFrame + 1) / (endFrame - startFrame + 1)) * 100,
            processedFrames: frames.length,
            totalFrames: endFrame - startFrame + 1,
            currentFrame: frameInfo
          });
          
        } catch (frameError) {
          console.warn(`Error processing frame ${i}:`, frameError.message);
          // Continue with other frames
        }
      }

      const result = {
        jobId,
        success: true,
        totalFrames: frames.length,
        skippedDuplicates: duplicateCount,
        frames,
        outputFormat,
        outputDirectory: targetOutputDir,
        originalWidth: metadata.width,
        originalHeight: metadata.height,
        originalFormat: metadata.format,
        processingTime: Date.now() - this.activeJobs.get(jobId).startTime
      };

      // Create ZIP archive if requested
      if (createZip && frames.length > 0) {
        const zipPath = await this.createZipArchive(frames, targetOutputDir, `frames_${jobId}.zip`);
        result.zipUrl = `/api/split/gif/download-zip/${jobId}`;
        result.zipPath = zipPath;
      }

      // Update job status
      this.activeJobs.set(jobId, {
        ...this.activeJobs.get(jobId),
        status: 'completed',
        result
      });

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
      console.error('Split error:', error);
      throw new Error(`Failed to split animated image: ${error.message}`);
    }
  }

  /**
   * Split GIF into scenes based on frame similarity
   */
  async splitGifByScenes(inputPath, options = {}) {
    const {
      threshold = 0.1, // Similarity threshold (0-1)
      minSceneDuration = 3, // Minimum frames per scene
      outputFormat = 'png',
      createZip = true
    } = options;

    const jobId = uuid();
    
    try {
      // First extract all frames
      const allFramesResult = await this.splitAnimatedImage(inputPath, {
        outputFormat: 'png', // Use PNG for analysis
        createZip: false
      });

      const scenes = await this.detectSceneChanges(allFramesResult.frames, threshold, minSceneDuration);
      
      const targetOutputDir = path.join(outputDir, `gif_scenes_${jobId}`);
      await fs.mkdir(targetOutputDir, { recursive: true });

      const sceneFrames = [];
      
      for (let sceneIndex = 0; sceneIndex < scenes.length; sceneIndex++) {
        const scene = scenes[sceneIndex];
        const sceneDir = path.join(targetOutputDir, `scene_${sceneIndex + 1}`);
        await fs.mkdir(sceneDir, { recursive: true });
        
        for (let frameIndex = scene.startFrame; frameIndex <= scene.endFrame; frameIndex++) {
          const sourceFrame = allFramesResult.frames[frameIndex];
          const newFilename = `scene_${sceneIndex + 1}_frame_${frameIndex - scene.startFrame + 1}.${outputFormat}`;
          const newPath = path.join(sceneDir, newFilename);
          
          // Convert format if needed
          if (outputFormat !== 'png') {
            const buffer = await fs.readFile(sourceFrame.path);
            const convertedBuffer = await sharp(buffer)
              .toFormat(outputFormat)
              .toBuffer();
            await fs.writeFile(newPath, convertedBuffer);
          } else {
            await fs.copyFile(sourceFrame.path, newPath);
          }
          
          sceneFrames.push({
            filename: newFilename,
            path: newPath,
            sceneIndex: sceneIndex + 1,
            frameIndexInScene: frameIndex - scene.startFrame + 1,
            originalFrameIndex: frameIndex,
            downloadUrl: `/api/split/gif/scene-download/${jobId}/${sceneIndex + 1}/${newFilename}`
          });
        }
      }

      // Clean up temporary frames
      await this.cleanup(allFramesResult.outputDirectory);

      const result = {
        jobId,
        success: true,
        totalScenes: scenes.length,
        totalFrames: sceneFrames.length,
        scenes: scenes.map((scene, index) => ({
          sceneNumber: index + 1,
          startFrame: scene.startFrame,
          endFrame: scene.endFrame,
          frameCount: scene.endFrame - scene.startFrame + 1,
          duration: scene.duration
        })),
        frames: sceneFrames,
        outputFormat
      };

      if (createZip) {
        const zipPath = await this.createZipArchive(sceneFrames, targetOutputDir, `scenes_${jobId}.zip`);
        result.zipUrl = `/api/split/gif/scenes-zip/${jobId}`;
      }

      return result;
      
    } catch (error) {
      throw new Error(`Failed to split GIF by scenes: ${error.message}`);
    }
  }

  /**
   * Calculate frame hash for duplicate detection
   */
  async calculateFrameHash(frameBuffer) {
    const { createHash } = await import('crypto');
    return createHash('md5').update(frameBuffer).digest('hex');
  }

  /**
   * Detect scene changes based on frame similarity
   */
  async detectSceneChanges(frames, threshold = 0.1, minSceneDuration = 3) {
    const scenes = [];
    let currentSceneStart = 0;
    
    for (let i = 1; i < frames.length; i++) {
      const similarity = await this.compareFrames(frames[i - 1].path, frames[i].path);
      
      if (similarity < (1 - threshold)) { // Significant change detected
        if (i - currentSceneStart >= minSceneDuration) {
          scenes.push({
            startFrame: currentSceneStart,
            endFrame: i - 1,
            duration: frames[i - 1].delay * (i - currentSceneStart)
          });
          currentSceneStart = i;
        }
      }
    }
    
    // Add final scene
    if (frames.length - currentSceneStart >= minSceneDuration) {
      scenes.push({
        startFrame: currentSceneStart,
        endFrame: frames.length - 1,
        duration: frames[frames.length - 1].delay * (frames.length - currentSceneStart)
      });
    }
    
    return scenes.length > 0 ? scenes : [{ startFrame: 0, endFrame: frames.length - 1, duration: 0 }];
  }

  /**
   * Compare two frames for similarity
   */
  async compareFrames(frame1Path, frame2Path) {
    try {
      const [buffer1, buffer2] = await Promise.all([
        sharp(frame1Path).resize(64, 64).greyscale().raw().toBuffer(),
        sharp(frame2Path).resize(64, 64).greyscale().raw().toBuffer()
      ]);
      
      let difference = 0;
      for (let i = 0; i < buffer1.length; i++) {
        difference += Math.abs(buffer1[i] - buffer2[i]);
      }
      
      const maxDifference = buffer1.length * 255;
      return 1 - (difference / maxDifference);
      
    } catch (error) {
      console.warn('Frame comparison error:', error.message);
      return 0; // Assume different if comparison fails
    }
  }

  /**
   * Validate input file
   */
  validateInputFile(inputPath) {
    const ext = path.extname(inputPath).toLowerCase();
    if (!this.supportedFormats.includes(ext)) {
      throw new Error(`Unsupported format: ${ext}. Supported formats: ${this.supportedFormats.join(', ')}`);
    }
  }

  /**
   * Validate output format
   */
  validateOutputFormat(format) {
    if (!this.outputFormats.includes(format.toLowerCase())) {
      throw new Error(`Unsupported output format: ${format}. Supported formats: ${this.outputFormats.join(', ')}`);
    }
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
  
  async createZipArchive(frames, outputDir, zipFilename = 'frames.zip') {
    const zipPath = path.join(outputDir, zipFilename);
    
    return new Promise((resolve, reject) => {
      const output = createWriteStream(zipPath);
      const archive = archiver('zip', { zlib: { level: 9 } });
      
      output.on('close', () => {
        console.log(`ZIP archive created: ${zipPath} (${archive.pointer()} bytes)`);
        resolve(zipPath);
      });
      
      archive.on('warning', (err) => {
        if (err.code === 'ENOENT') {
          console.warn('ZIP warning:', err);
        } else {
          reject(err);
        }
      });
      
      archive.on('error', (err) => {
        reject(err);
      });
      
      archive.pipe(output);
      
      // Add each frame to the zip
      frames.forEach(frame => {
        try {
          archive.file(frame.path, { name: frame.filename });
        } catch (error) {
          console.warn(`Failed to add frame to ZIP: ${frame.filename}`, error.message);
        }
      });
      
      archive.finalize();
    });
  }
  
  async extractGifInfo(inputPath) {
    try {
      const inputBuffer = await fs.readFile(inputPath);
      
      // For GIF files, we can extract more detailed information
      if (inputPath.toLowerCase().endsWith('.gif')) {
        return await this.extractDetailedGifInfo(inputBuffer);
      }
      
      // For other formats, use Sharp
      const metadata = await sharp(inputBuffer).metadata();
      return {
        width: metadata.width,
        height: metadata.height,
        pages: metadata.pages || 1,
        format: metadata.format,
        delay: metadata.delay || []
      };
      
    } catch (error) {
      console.error('Error extracting GIF info:', error);
      throw new Error(`Failed to extract image information: ${error.message}`);
    }
  }
  
  async extractDetailedGifInfo(buffer) {
    // This is a simplified GIF parser - in production you'd want a more robust solution
    // For now, we'll use Sharp which handles most cases
    const metadata = await sharp(buffer).metadata();
    return {
      width: metadata.width,
      height: metadata.height,
      pages: metadata.pages || 1,
      format: 'gif',
      delay: metadata.delay || [],
      hasAnimation: (metadata.pages || 1) > 1
    };
  }
  
  async cleanup(directory) {
    try {
      await fs.rm(directory, { recursive: true, force: true });
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }
}
