/**
 * Core GIF Processing Service
 * Unified service for all GIF operations including creation, editing, and optimization.
 * 
 * Replaces: gifService, splitService (GIF parts), and parts of conversionService
 * 
 * @author Media Converter Team
 */

import GIFEncoder from 'gif-encoder-2';
import { createCanvas, loadImage } from 'canvas';
import Jimp from 'jimp';
import fs from 'fs/promises';
import path from 'path';
import { EventEmitter } from 'events';
import { v4 as uuid } from 'uuid';
import { outputDir, tempDir } from '../lib/file-paths.js';
import archiver from 'archiver';

/**
 * Core GIF processing service with comprehensive functionality
 */
export class GifProcessor extends EventEmitter {
  constructor() {
    super();
    this.activeJobs = new Map();
  }

  /**
   * Create animated GIF from image sequence
   */
  async createAnimatedGif(imagePaths, options = {}) {
    const {
      width = 500,
      height = 500,
      delay = 500,
      repeat = 0,
      quality = 10,
      outputName = `animated_${uuid()}.gif`
    } = options;

    const outputPath = path.join(outputDir, outputName);
    const jobId = uuid();

    try {
      this.activeJobs.set(jobId, {
        status: 'processing',
        progress: 0,
        startTime: Date.now()
      });

      const encoder = new GIFEncoder(width, height, 'octree', false, imagePaths.length);
      encoder.setDelay(delay);
      encoder.setRepeat(repeat);
      encoder.setQuality(quality);
      encoder.writeHeader();

      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext('2d');

      for (let i = 0; i < imagePaths.length; i++) {
        const image = await loadImage(imagePaths[i]);
        
        // Clear canvas and draw image
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(image, 0, 0, width, height);
        
        // Add frame to GIF
        encoder.addFrame(ctx);
        
        // Update progress
        const progress = Math.round(((i + 1) / imagePaths.length) * 100);
        this.activeJobs.get(jobId).progress = progress;
        this.emit(`progress-${jobId}`, progress);
      }

      encoder.finish();
      const buffer = encoder.out.getData();
      await fs.writeFile(outputPath, buffer);

      const stats = await fs.stat(outputPath);
      const result = {
        jobId,
        outputPath,
        outputName,
        size: stats.size,
        frames: imagePaths.length,
        width,
        height,
        delay,
        quality
      };

      this.activeJobs.set(jobId, {
        status: 'completed',
        progress: 100,
        result
      });

      this.emit(`complete-${jobId}`, result);
      return result;

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
   * Extract frames from animated GIF
   */
  async extractFrames(gifPath, options = {}) {
    const { 
      outputFormat = 'png',
      extractionType = 'all_frames',
      sceneThreshold = 0.3
    } = options;

    const jobId = uuid();

    try {
      this.activeJobs.set(jobId, {
        status: 'processing',
        progress: 0,
        startTime: Date.now()
      });

      const gif = await Jimp.read(gifPath);
      const frames = [];
      let frameIndex = 0;

      // Extract all frames
      while (true) {
        try {
          const frame = gif.clone();
          const outputName = `frame_${frameIndex + 1}_${uuid()}.${outputFormat}`;
          const outputPath = path.join(outputDir, outputName);

          await frame.writeAsync(outputPath);
          
          const stats = await fs.stat(outputPath);
          frames.push({
            frameIndex: frameIndex + 1,
            outputPath,
            outputName,
            size: stats.size
          });

          frameIndex++;
          this.emit(`progress-${jobId}`, Math.min((frameIndex / 30) * 100, 90));

          // Try to get next frame
          gif.frame = frameIndex;
        } catch (error) {
          // No more frames
          break;
        }
      }

      // Apply scene-based filtering if requested
      if (extractionType === 'scene_based') {
        const sceneFrames = await this.filterSceneFrames(frames, sceneThreshold);
        
        // Remove non-scene frames
        const framesToKeep = new Set(sceneFrames.map(f => f.frameIndex));
        for (const frame of frames) {
          if (!framesToKeep.has(frame.frameIndex)) {
            await fs.unlink(frame.outputPath).catch(() => {}); // Ignore errors
          }
        }
        
        frames.splice(0, frames.length, ...sceneFrames);
      }

      const result = {
        jobId,
        total: frames.length,
        results: frames,
        extractionType,
        originalGif: path.basename(gifPath)
      };

      this.activeJobs.set(jobId, {
        status: 'completed',
        progress: 100,
        result
      });

      this.emit(`complete-${jobId}`, result);
      return result;

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
   * Optimize GIF file
   */
  async optimizeGif(gifPath, options = {}) {
    const {
      quality = 10,
      colors = 256,
      width,
      height,
      compress = true,
      outputName = `optimized_${uuid()}.gif`
    } = options;

    try {
      const gif = await Jimp.read(gifPath);
      
      // Resize if dimensions provided
      if (width || height) {
        gif.resize(width || Jimp.AUTO, height || Jimp.AUTO);
      }

      // Apply color quantization
      if (colors < 256) {
        gif.color([
          { apply: 'desaturate', params: [10] }
        ]);
      }

      const outputPath = path.join(outputDir, outputName);
      await gif.quality(quality).writeAsync(outputPath);

      const stats = await fs.stat(outputPath);
      const originalStats = await fs.stat(gifPath);

      return {
        outputPath,
        outputName,
        size: stats.size,
        originalSize: originalStats.size,
        compression: `${((originalStats.size - stats.size) / originalStats.size * 100).toFixed(1)}%`,
        quality,
        colors
      };

    } catch (error) {
      throw new Error(`GIF optimization failed: ${error.message}`);
    }
  }

  /**
   * Resize animated GIF
   */
  async resizeGif(gifPath, options = {}) {
    const { width, height, maintainAspectRatio = true } = options;
    
    if (!width && !height) {
      throw new Error('Either width or height must be specified');
    }

    try {
      const gif = await Jimp.read(gifPath);
      
      if (maintainAspectRatio) {
        gif.resize(width || Jimp.AUTO, height || Jimp.AUTO);
      } else {
        gif.resize(width, height);
      }

      const outputName = `resized_${uuid()}.gif`;
      const outputPath = path.join(outputDir, outputName);
      await gif.writeAsync(outputPath);

      const stats = await fs.stat(outputPath);
      const originalStats = await fs.stat(gifPath);

      return {
        outputPath,
        outputName,
        size: stats.size,
        originalSize: originalStats.size,
        width: gif.getWidth(),
        height: gif.getHeight()
      };

    } catch (error) {
      throw new Error(`GIF resize failed: ${error.message}`);
    }
  }

  /**
   * Add text overlay to GIF
   */
  async addTextToGif(gifPath, textOptions = {}) {
    const {
      text,
      fontSize = 24,
      fontColor = '#FFFFFF',
      position = 'bottom-center',
      backgroundColor = 'rgba(0,0,0,0.5)',
      outputName = `text_overlay_${uuid()}.gif`
    } = textOptions;

    if (!text) {
      throw new Error('Text is required for overlay');
    }

    try {
      const gif = await Jimp.read(gifPath);
      const font = await Jimp.loadFont(Jimp.FONT_SANS_32_WHITE);
      
      // Calculate text position
      const textWidth = Jimp.measureText(font, text);
      const textHeight = Jimp.measureTextHeight(font, text, textWidth);
      
      let x, y;
      switch (position) {
        case 'top-left':
          x = 10; y = 10;
          break;
        case 'top-center':
          x = (gif.getWidth() - textWidth) / 2; y = 10;
          break;
        case 'top-right':
          x = gif.getWidth() - textWidth - 10; y = 10;
          break;
        case 'bottom-left':
          x = 10; y = gif.getHeight() - textHeight - 10;
          break;
        case 'bottom-center':
          x = (gif.getWidth() - textWidth) / 2; y = gif.getHeight() - textHeight - 10;
          break;
        case 'bottom-right':
          x = gif.getWidth() - textWidth - 10; y = gif.getHeight() - textHeight - 10;
          break;
        default:
          x = (gif.getWidth() - textWidth) / 2; y = gif.getHeight() - textHeight - 10;
      }

      // Add background rectangle if specified
      if (backgroundColor !== 'transparent') {
        // Create semi-transparent background
        const bgColor = Jimp.cssColorToHex(backgroundColor.replace(/rgba?\(|\)/g, '').split(',').slice(0, 3).join(','));
        gif.scan(x - 5, y - 5, textWidth + 10, textHeight + 10, function (x, y, idx) {
          this.bitmap.data[idx] = parseInt(bgColor.slice(1, 3), 16);
          this.bitmap.data[idx + 1] = parseInt(bgColor.slice(3, 5), 16);
          this.bitmap.data[idx + 2] = parseInt(bgColor.slice(5, 7), 16);
        });
      }

      // Add text
      gif.print(font, x, y, text);

      const outputPath = path.join(outputDir, outputName);
      await gif.writeAsync(outputPath);

      const stats = await fs.stat(outputPath);

      return {
        outputPath,
        outputName,
        size: stats.size,
        text,
        position,
        fontSize
      };

    } catch (error) {
      throw new Error(`Text overlay failed: ${error.message}`);
    }
  }

  /**
   * Filter frames based on scene detection
   */
  async filterSceneFrames(frames, threshold = 0.3) {
    if (frames.length <= 1) return frames;

    const sceneFrames = [frames[0]]; // Always include first frame
    
    for (let i = 1; i < frames.length; i++) {
      try {
        const currentFrame = await Jimp.read(frames[i].outputPath);
        const previousFrame = await Jimp.read(frames[i - 1].outputPath);
        
        // Simple pixel difference calculation
        const diff = Jimp.diff(currentFrame, previousFrame);
        
        if (diff.percent > threshold) {
          sceneFrames.push(frames[i]);
        }
      } catch (error) {
        console.warn(`Scene detection failed for frame ${i}: ${error.message}`);
        // Include frame on error to be safe
        sceneFrames.push(frames[i]);
      }
    }

    return sceneFrames;
  }

  /**
   * Create ZIP archive of results
   */
  async createZipArchive(results, archiveName = `gif_results_${uuid()}.zip`) {
    const zipPath = path.join(outputDir, archiveName);

    return new Promise((resolve, reject) => {
      const output = require('fs').createWriteStream(zipPath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      output.on('close', async () => {
        const stats = await fs.stat(zipPath);
        resolve({
          zipPath,
          zipName: archiveName,
          size: stats.size,
          totalFiles: results.length
        });
      });

      archive.on('error', reject);
      archive.pipe(output);

      // Add files to archive
      results.forEach(result => {
        if (result.outputPath && require('fs').existsSync(result.outputPath)) {
          archive.file(result.outputPath, { name: result.outputName });
        }
      });

      archive.finalize();
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
}

// Export singleton instance
export const gifProcessor = new GifProcessor();
export default GifProcessor;