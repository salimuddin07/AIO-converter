/**
 * Core Image Processing Service
 * Unified service that intelligently selects the best image processing library
 * for each operation to provide optimal performance and quality.
 * 
 * Replaces: JimpService, EnhancedJimpService, SharpService, ImageMagickService
 * 
 * @author Media Converter Team
 */

import sharp from 'sharp';
import { Jimp } from 'jimp';
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs/promises';
import { createCanvas } from 'canvas';
import { v4 as uuid } from 'uuid';
import { outputDir, tempDir } from '../utils/FilePathUtils.js';

/**
 * Core image processing service with intelligent library selection
 */
export class ImageProcessor {
  constructor() {
    this.supportedFormats = {
      input: ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.tiff', '.avif'],
      output: ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.tiff', '.avif', '.pdf']
    };
  }

  /**
   * Convert image with automatic optimal library selection
   * @param {string} inputPath - Input file path
   * @param {Object} options - Conversion options
   */
  async convertImage(inputPath, options = {}) {
    const {
      outputFormat = 'png',
      quality = 90,
      width,
      height,
      maintainAspectRatio = true,
      outputName = `converted_${uuid()}.${outputFormat}`
    } = options;

    const outputPath = path.join(outputDir, outputName);

    try {
      // Use Sharp for most operations (fastest and most reliable)
      if (this.isSharpOptimal(inputPath, outputFormat)) {
        return await this.convertWithSharp(inputPath, outputPath, options);
      }
      
      // Use Jimp for complex manipulations or when Sharp isn't suitable
      if (this.isJimpOptimal(inputPath, outputFormat)) {
        return await this.convertWithJimp(inputPath, outputPath, options);
      }
      
      // Fallback to ImageMagick for edge cases
      return await this.convertWithImageMagick(inputPath, outputPath, options);
      
    } catch (error) {
      console.error(`Image conversion failed: ${error.message}`);
      throw new Error(`Failed to convert image: ${error.message}`);
    }
  }

  /**
   * Batch convert multiple images
   */
  async batchConvert(imagePaths, options = {}) {
    const results = [];
    const concurrency = options.concurrency || 3;
    
    for (let i = 0; i < imagePaths.length; i += concurrency) {
      const batch = imagePaths.slice(i, i + concurrency);
      const batchPromises = batch.map(async (imagePath, index) => {
        try {
          const result = await this.convertImage(imagePath, {
            ...options,
            outputName: options.outputNames?.[i + index] || undefined
          });
          return { success: true, ...result };
        } catch (error) {
          return { 
            success: false, 
            error: error.message, 
            inputPath: imagePath 
          };
        }
      });

      const batchResults = await Promise.allSettled(batchPromises);
      batchResults.forEach(result => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          results.push({ 
            success: false, 
            error: result.reason?.message || 'Unknown error' 
          });
        }
      });
    }

    return {
      total: imagePaths.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results
    };
  }

  /**
   * Resize image maintaining aspect ratio
   */
  async resizeImage(inputPath, options = {}) {
    const { width, height, fit = 'inside', quality = 90 } = options;
    
    if (!width && !height) {
      throw new Error('Either width or height must be specified');
    }

    return await this.convertWithSharp(inputPath, null, {
      width,
      height,
      fit,
      quality,
      resize: true
    });
  }

  /**
   * Apply effects and filters to image
   */
  async applyEffects(inputPath, effects = {}) {
    const {
      blur,
      brightness = 1,
      contrast = 1,
      saturation = 1,
      hue = 0,
      grayscale = false,
      sepia = false,
      invert = false
    } = effects;

    return await this.convertWithJimp(inputPath, null, {
      effects: {
        blur, brightness, contrast, saturation, hue,
        grayscale, sepia, invert
      }
    });
  }

  /**
   * Convert with Sharp (optimal for most operations)
   */
  async convertWithSharp(inputPath, outputPath = null, options = {}) {
    const { quality = 90, width, height, fit = 'inside', outputFormat } = options;
    
    if (!outputPath) {
      const ext = outputFormat || path.extname(inputPath).slice(1);
      outputPath = path.join(outputDir, `sharp_${uuid()}.${ext}`);
    }

    let pipeline = sharp(inputPath);

    // Resize if dimensions provided
    if (width || height) {
      pipeline = pipeline.resize(width, height, { fit });
    }

    // Apply format-specific optimizations
    const format = outputFormat || path.extname(outputPath).slice(1);
    switch (format.toLowerCase()) {
      case 'jpg':
      case 'jpeg':
        pipeline = pipeline.jpeg({ quality });
        break;
      case 'png':
        pipeline = pipeline.png({ quality });
        break;
      case 'webp':
        pipeline = pipeline.webp({ quality });
        break;
      case 'avif':
        pipeline = pipeline.avif({ quality });
        break;
    }

    await pipeline.toFile(outputPath);

    const stats = await fs.stat(outputPath);
    const originalStats = await fs.stat(inputPath);

    return {
      outputPath,
      outputName: path.basename(outputPath),
      size: stats.size,
      originalSize: originalStats.size,
      compression: `${((originalStats.size - stats.size) / originalStats.size * 100).toFixed(1)}%`,
      library: 'Sharp'
    };
  }

  /**
   * Convert with Jimp (optimal for complex manipulations)
   */
  async convertWithJimp(inputPath, outputPath = null, options = {}) {
    const { quality = 90, width, height, effects = {}, outputFormat } = options;
    
    if (!outputPath) {
      const ext = outputFormat || path.extname(inputPath).slice(1);
      outputPath = path.join(outputDir, `jimp_${uuid()}.${ext}`);
    }

    const image = await Jimp.read(inputPath);

    // Resize if dimensions provided
    if (width || height) {
      image.resize(width || Jimp.AUTO, height || Jimp.AUTO);
    }

    // Apply effects
    if (effects.brightness !== undefined) {
      image.brightness(effects.brightness - 1);
    }
    if (effects.contrast !== undefined) {
      image.contrast(effects.contrast - 1);
    }
    if (effects.blur) {
      image.blur(effects.blur);
    }
    if (effects.grayscale) {
      image.greyscale();
    }
    if (effects.sepia) {
      image.sepia();
    }
    if (effects.invert) {
      image.invert();
    }

    // Set quality and save
    await image.quality(quality).writeAsync(outputPath);

    const stats = await fs.stat(outputPath);
    const originalStats = await fs.stat(inputPath);

    return {
      outputPath,
      outputName: path.basename(outputPath),
      size: stats.size,
      originalSize: originalStats.size,
      compression: `${((originalStats.size - stats.size) / originalStats.size * 100).toFixed(1)}%`,
      library: 'Jimp'
    };
  }

  /**
   * Convert with ImageMagick (fallback for edge cases)
   */
  async convertWithImageMagick(inputPath, outputPath = null, options = {}) {
    const { quality = 90, width, height, outputFormat } = options;
    
    if (!outputPath) {
      const ext = outputFormat || path.extname(inputPath).slice(1);
      outputPath = path.join(outputDir, `magick_${uuid()}.${ext}`);
    }

    let command = `magick "${inputPath}"`;
    
    if (width && height) {
      command += ` -resize ${width}x${height}`;
    } else if (width) {
      command += ` -resize ${width}x`;
    } else if (height) {
      command += ` -resize x${height}`;
    }

    command += ` -quality ${quality} "${outputPath}"`;

    try {
      execSync(command);
      
      const stats = await fs.stat(outputPath);
      const originalStats = await fs.stat(inputPath);

      return {
        outputPath,
        outputName: path.basename(outputPath),
        size: stats.size,
        originalSize: originalStats.size,
        compression: `${((originalStats.size - stats.size) / originalStats.size * 100).toFixed(1)}%`,
        library: 'ImageMagick'
      };
    } catch (error) {
      throw new Error(`ImageMagick conversion failed: ${error.message}`);
    }
  }

  /**
   * Determine if Sharp is optimal for this operation
   */
  isSharpOptimal(inputPath, outputFormat) {
    const inputExt = path.extname(inputPath).toLowerCase();
    const sharpFormats = ['.jpg', '.jpeg', '.png', '.webp', '.avif', '.tiff'];
    
    return sharpFormats.includes(inputExt) && 
           (!outputFormat || sharpFormats.includes(`.${outputFormat.toLowerCase()}`));
  }

  /**
   * Determine if Jimp is optimal for this operation
   */
  isJimpOptimal(inputPath, outputFormat) {
    const inputExt = path.extname(inputPath).toLowerCase();
    const jimpFormats = ['.jpg', '.jpeg', '.png', '.bmp', '.gif'];
    
    return jimpFormats.includes(inputExt);
  }

  /**
   * Get image metadata
   */
  async getImageInfo(imagePath) {
    try {
      const metadata = await sharp(imagePath).metadata();
      const stats = await fs.stat(imagePath);
      
      return {
        filename: path.basename(imagePath),
        format: metadata.format,
        width: metadata.width,
        height: metadata.height,
        channels: metadata.channels,
        density: metadata.density,
        hasAlpha: metadata.hasAlpha,
        size: stats.size,
        sizeFormatted: this.formatFileSize(stats.size)
      };
    } catch (error) {
      throw new Error(`Failed to get image info: ${error.message}`);
    }
  }

  /**
   * Format file size for display
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// Export singleton instance
export const imageProcessor = new ImageProcessor();
export default ImageProcessor;
