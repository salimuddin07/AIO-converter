/**
 * Enhanced GIF Processing Service
 * Uses modern libraries for advanced GIF creation and optimization
 * 
 * Libraries used:
 * - gif-encoder-2: High-quality GIF encoding
 * - imagemin-gifsicle: GIF optimization
 * - sharp: Image processing
 * - ffmpeg: Video processing
 * 
 * @author Media Converter Team
 */

import GIFEncoder from 'gif-encoder-2';
import sharp from 'sharp';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import imagemin from 'imagemin';
import imageminGifsicle from 'imagemin-gifsicle';
import imageminWebp from 'imagemin-webp';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuid } from 'uuid';
import { outputDir, tempDir } from '../utils/FilePathUtils.js';

// Configure ffmpeg paths
ffmpeg.setFfmpegPath(ffmpegPath);

const sanitizeFrameDelay = (value, fallback) => {
  const numeric = parseInt(value, 10);
  if (Number.isNaN(numeric)) {
    return fallback;
  }
  const clamped = Math.max(10, Math.min(2000, numeric));
  return clamped;
};

export class EnhancedGifProcessor {
  constructor() {
    this.supportedFormats = {
      input: ['.mp4', '.avi', '.mov', '.webm', '.mkv', '.jpg', '.jpeg', '.png', '.webp'],
      output: ['.gif', '.webp']
    };
  }

  /**
   * Create GIF from video with advanced options
   */
  async videoToGif(videoPath, options = {}) {
    const {
      startTime = 0,
      duration = 3,
      width = null,
      height = null,
      fps = 15,
      quality = 'high',
      optimization = 'medium',
      effects = []
    } = options;

    const outputId = uuid();
    const outputName = `gif_${outputId}.gif`;
    const outputPath = path.join(outputDir, outputName);
    const tempFramesDir = path.join(tempDir, `frames_${outputId}`);

    try {
      // Create frames directory
      await fs.mkdir(tempFramesDir, { recursive: true });

      // Extract frames from video
      const framePattern = path.join(tempFramesDir, 'frame_%04d.png');
      
      await new Promise((resolve, reject) => {
        let command = ffmpeg(videoPath)
          .seekInput(startTime)
          .duration(duration)
          .fps(fps);

        // Apply size constraints
        if (width && height) {
          command = command.size(`${width}x${height}`);
        } else if (width || height) {
          const size = width ? `${width}x?` : `?x${height}`;
          command = command.size(size);
        }

        // Apply effects
        const filters = [];
        effects.forEach(effect => {
          switch (effect.type) {
            case 'grayscale':
              filters.push('colorchannelmixer=.3:.4:.3:0:.3:.4:.3:0:.3:.4:.3');
              break;
            case 'reverse':
              filters.push('reverse');
              break;
            case 'speed':
              const speed = effect.value || 1;
              filters.push(`setpts=${1/speed}*PTS`);
              break;
            case 'brightness':
              const brightness = effect.value || 0;
              filters.push(`eq=brightness=${brightness}`);
              break;
            case 'contrast':
              const contrast = effect.value || 1;
              filters.push(`eq=contrast=${contrast}`);
              break;
          }
        });

        if (filters.length > 0) {
          command = command.videoFilters(filters);
        }

        command
          .output(framePattern)
          .on('end', resolve)
          .on('error', reject)
          .run();
      });

      // Get extracted frames
      const frameFiles = await fs.readdir(tempFramesDir);
      const sortedFrames = frameFiles
        .filter(f => f.endsWith('.png'))
        .sort()
        .map(f => path.join(tempFramesDir, f));

      // Create GIF from frames using gif-encoder-2
      const gif = await this.createGifFromFrames(sortedFrames, {
        width,
        height,
        fps,
        quality
      });

      await fs.writeFile(outputPath, gif);

      // Optimize the GIF
      if (optimization !== 'none') {
        await this.optimizeGif(outputPath, optimization);
      }

      // Cleanup temp files
      await fs.rmdir(tempFramesDir, { recursive: true });

      const stats = await fs.stat(outputPath);
      return {
        success: true,
        outputName,
        outputPath,
        size: stats.size,
        downloadUrl: `/api/output/${outputName}`
      };

    } catch (error) {
      // Cleanup on error
      try {
        await fs.rmdir(tempFramesDir, { recursive: true });
      } catch (e) {
        // Ignore cleanup errors
      }
      throw error;
    }
  }

  /**
   * Create GIF from image sequence
   */
  async imagesToGif(imagePaths, options = {}) {
    const {
      width = null,
      height = null,
      fps = 10,
      quality = 'high',
      loop = true,
      delay = null,
      loopCount = null,
      frameDelays = [],
      fit = 'contain'
    } = options;

    const outputId = uuid();
    const outputName = `gif_${outputId}.gif`;
    const outputPath = path.join(outputDir, outputName);

    // Process and resize images if needed
    const processedFrames = [];
    for (const imagePath of imagePaths) {
      let pipeline = sharp(imagePath);

      if (width || height) {
        const fitOption = ['cover', 'fill'].includes(fit) ? fit : 'contain';
        const resizeOptions = {
          fit: fitOption
        };

        if (fitOption === 'contain') {
          resizeOptions.background = { r: 255, g: 255, b: 255, alpha: 0 };
        }

        pipeline = pipeline.resize(width || null, height || null, resizeOptions);
      }

      const buffer = await pipeline.png().toBuffer();
      processedFrames.push(buffer);
    }

    // Create GIF
    const gif = await this.createGifFromBuffers(processedFrames, {
      fps,
      quality,
      loop,
      delay,
      loopCount,
      frameDelays
    });

    await fs.writeFile(outputPath, gif);

    const stats = await fs.stat(outputPath);
    return {
      success: true,
      outputName,
      outputPath,
      size: stats.size,
      downloadUrl: `/api/output/${outputName}`
    };
  }

  /**
   * Create GIF from frame files using gif-encoder-2
   */
  async createGifFromFrames(framePaths, options = {}) {
    const { width = 800, height = 600, fps = 15, quality = 'high' } = options;

    // Load first frame to get dimensions
    const firstFrame = await sharp(framePaths[0]).metadata();
    const gifWidth = width || firstFrame.width;
    const gifHeight = height || firstFrame.height;

    const encoder = new GIFEncoder(gifWidth, gifHeight, 'octree', true);
    encoder.setDelay(Math.round(1000 / fps));
    encoder.setRepeat(0); // Loop forever
    
    // Set quality based on option
    const qualityValue = quality === 'high' ? 1 : quality === 'medium' ? 10 : 20;
    encoder.setQuality(qualityValue);

    encoder.start();

    // Process each frame
    for (const framePath of framePaths) {
      const { data, info } = await sharp(framePath)
        .resize(gifWidth, gifHeight, { fit: 'contain' })
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

      // Convert RGBA to RGB (gif-encoder-2 expects RGB)
      const rgbData = new Uint8Array(info.width * info.height * 3);
      for (let i = 0, j = 0; i < data.length; i += 4, j += 3) {
        rgbData[j] = data[i];     // R
        rgbData[j + 1] = data[i + 1]; // G
        rgbData[j + 2] = data[i + 2]; // B
        // Skip alpha channel
      }

      encoder.addFrame(rgbData);
    }

    encoder.finish();
    return encoder.out.getData();
  }

  /**
   * Create GIF from image buffers
   */
  async createGifFromBuffers(buffers, options = {}) {
    const {
      fps = 10,
      quality = 'high',
      loop = true,
      delay = null,
      loopCount = null,
      frameDelays = []
    } = options;

    // Get dimensions from first buffer
    const firstImage = sharp(buffers[0]);
    const { width, height } = await firstImage.metadata();

    const encoder = new GIFEncoder(width, height, 'octree', true);
    const defaultDelay = sanitizeFrameDelay(delay ?? Math.round(1000 / fps), Math.round(1000 / fps));
    const perFrameDelays = Array.isArray(frameDelays) ? frameDelays : [];

    const repeatValue = typeof loopCount === 'number' && loopCount >= 0
      ? loopCount
      : (loop ? 0 : -1);
    encoder.setRepeat(repeatValue);
    
    const qualityValue = quality === 'high' ? 1 : quality === 'medium' ? 10 : 20;
    encoder.setQuality(qualityValue);

    encoder.start();
    // Process each buffer
    for (let index = 0; index < buffers.length; index += 1) {
      const buffer = buffers[index];
      const frameDelay = sanitizeFrameDelay(perFrameDelays[index], defaultDelay);
      encoder.setDelay(frameDelay);

      const { data, info } = await sharp(buffer)
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

      // Convert RGBA to RGB
      const rgbData = new Uint8Array(info.width * info.height * 3);
      for (let i = 0, j = 0; i < data.length; i += 4, j += 3) {
        rgbData[j] = data[i];
        rgbData[j + 1] = data[i + 1];
        rgbData[j + 2] = data[i + 2];
      }

      encoder.addFrame(rgbData);
    }

    encoder.finish();
    return encoder.out.getData();
  }

  /**
   * Optimize GIF using imagemin and gifsicle
   */
  async optimizeGif(gifPath, level = 'medium') {
    const optimizationLevels = {
      light: { optimizationLevel: 1, colors: 256 },
      medium: { optimizationLevel: 2, colors: 128 },
      heavy: { optimizationLevel: 3, colors: 64 }
    };

    const settings = optimizationLevels[level] || optimizationLevels.medium;

    const optimized = await imagemin([gifPath], {
      plugins: [
        imageminGifsicle({
          optimizationLevel: settings.optimizationLevel,
          colors: settings.colors,
          interlaced: true
        })
      ]
    });

    if (optimized && optimized[0]) {
      await fs.writeFile(gifPath, optimized[0].data);
    }
  }

  /**
   * Convert GIF to WebP animation
   */
  async gifToWebp(gifPath, options = {}) {
    const { quality = 80, method = 6 } = options;
    
    const outputId = uuid();
    const outputName = `webp_${outputId}.webp`;
    const outputPath = path.join(outputDir, outputName);

    const optimized = await imagemin([gifPath], {
      plugins: [
        imageminWebp({
          quality,
          method,
          lossless: false
        })
      ]
    });

    if (optimized && optimized[0]) {
      await fs.writeFile(outputPath, optimized[0].data);
      
      const stats = await fs.stat(outputPath);
      return {
        success: true,
        outputName,
        outputPath,
        size: stats.size,
        downloadUrl: `/api/output/${outputName}`
      };
    }

    throw new Error('WebP conversion failed');
  }

  /**
   * Add text overlay to GIF frames
   */
  async addTextToGif(gifPath, textOptions = {}) {
    const {
      text = 'Sample Text',
      fontSize = 24,
      fontFamily = 'Arial',
      color = 'white',
      position = 'bottom-center',
      backgroundColor = 'rgba(0,0,0,0.5)',
      padding = 10
    } = textOptions;

    // This is a simplified implementation
    // In a full implementation, you'd extract GIF frames, add text to each, and recreate
    throw new Error('Text overlay for GIF not fully implemented yet');
  }

  /**
   * Get GIF information
   */
  async getGifInfo(gifPath) {
    try {
      const metadata = await sharp(gifPath).metadata();
      const stats = await fs.stat(gifPath);

      return {
        width: metadata.width,
        height: metadata.height,
        size: stats.size,
        format: metadata.format,
        hasAlpha: metadata.hasAlpha,
        channels: metadata.channels
      };
    } catch (error) {
      throw new Error(`Failed to get GIF info: ${error.message}`);
    }
  }
}

// Export singleton instance
export const enhancedGifProcessor = new EnhancedGifProcessor();
export default EnhancedGifProcessor;