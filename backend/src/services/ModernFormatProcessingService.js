/**
 * Modern Format Processing Service
 * Support for WebP, AVIF, APNG, JXL and other modern image/animation formats
 * 
 * Libraries used:
 * - sharp: WebP, AVIF support
 * - imagemin-webp: WebP optimization
 * - custom implementations for other formats
 * 
 * @author Media Converter Team
 */

import sharp from 'sharp';
import imagemin from 'imagemin';
import imageminWebp from 'imagemin-webp';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuid } from 'uuid';
import { outputDir, tempDir } from '../utils/FilePathUtils.js';
import { imageMagickService } from './index.js';

export class ModernFormatProcessor {
  constructor() {
    this.supportedInputFormats = [
      '.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif', '.tiff', '.bmp', '.svg'
    ];
    this.supportedOutputFormats = [
      '.webp', '.avif', '.jxl', '.apng', '.heif'
    ];
  }

  /**
   * Convert image to WebP format
   */
  async toWebP(inputPath, options = {}) {
    const {
      quality = 80,
      lossless = false,
      method = 6, // 0-6, higher is slower but better compression
      resize = null,
      animated = null // Auto-detect from input
    } = options;

    const outputId = uuid();
    const outputName = `webp_${outputId}.webp`;
    const outputPath = path.join(outputDir, outputName);

    try {
      let pipeline = sharp(inputPath);

      // Handle resizing
      if (resize && resize.width && resize.height) {
        pipeline = pipeline.resize(resize.width, resize.height, {
          fit: resize.fit || 'contain',
          background: resize.background || { r: 255, g: 255, b: 255, alpha: 0 }
        });
      }

      // WebP conversion with options
      const webpOptions = {
        quality: lossless ? 100 : quality,
        lossless,
        method,
        effort: 6 // Maximum compression effort
      };

      // Handle animated WebP for GIF inputs
      const inputExt = path.extname(inputPath).toLowerCase();
      if (inputExt === '.gif' || animated === true) {
        webpOptions.animated = true;
      }

      await pipeline.webp(webpOptions).toFile(outputPath);

      const stats = await fs.stat(outputPath);
      return {
        success: true,
        outputName,
        outputPath,
        size: stats.size,
        format: 'webp',
        downloadUrl: `/api/output/${outputName}`
      };

    } catch (error) {
      throw new Error(`WebP conversion failed: ${error.message}`);
    }
  }

  /**
   * Convert image to AVIF format (next-gen format)
   */
  async toAVIF(inputPath, options = {}) {
    const {
      quality = 50, // AVIF works well with lower quality settings
      speed = 8,    // 0-10, higher is faster but larger files
      resize = null
    } = options;

    const outputId = uuid();
    const outputName = `avif_${outputId}.avif`;
    const outputPath = path.join(outputDir, outputName);

    try {
      let pipeline = sharp(inputPath);

      // Handle resizing
      if (resize && resize.width && resize.height) {
        pipeline = pipeline.resize(resize.width, resize.height, {
          fit: resize.fit || 'contain',
          background: resize.background || { r: 255, g: 255, b: 255, alpha: 0 }
        });
      }

      await pipeline.avif({
        quality,
        speed,
        effort: 9 // Maximum compression effort
      }).toFile(outputPath);

      const stats = await fs.stat(outputPath);
      return {
        success: true,
        outputName,
        outputPath,
        size: stats.size,
        format: 'avif',
        downloadUrl: `/api/output/${outputName}`
      };

    } catch (error) {
      throw new Error(`AVIF conversion failed: ${error.message}`);
    }
  }

  /**
   * Convert image to HEIF format
   */
  async toHEIF(inputPath, options = {}) {
    const {
      quality = 80,
      compression = 'av1', // 'av1' or 'hevc'
      resize = null
    } = options;

    const outputId = uuid();
    const outputName = `heif_${outputId}.heif`;
    const outputPath = path.join(outputDir, outputName);

    try {
      let pipeline = sharp(inputPath);

      // Handle resizing
      if (resize && resize.width && resize.height) {
        pipeline = pipeline.resize(resize.width, resize.height, {
          fit: resize.fit || 'contain',
          background: resize.background || { r: 255, g: 255, b: 255, alpha: 0 }
        });
      }

      await pipeline.heif({
        quality,
        compression
      }).toFile(outputPath);

      const stats = await fs.stat(outputPath);
      return {
        success: true,
        outputName,
        outputPath,
        size: stats.size,
        format: 'heif',
        downloadUrl: `/api/output/${outputName}`
      };

    } catch (error) {
      throw new Error(`HEIF conversion failed: ${error.message}`);
    }
  }

  /**
   * Create APNG (Animated PNG) from images sequence
   * Note: This is a simplified implementation using Sharp
   */
  async createAPNG(imagePaths = [], options = {}) {
    const {
      fps = 12,
      loop = 0,
      resize = null
    } = options;

    const frames = Array.isArray(imagePaths)
      ? imagePaths.filter(Boolean)
      : [imagePaths].filter(Boolean);

    if (frames.length === 0) {
      throw new Error('At least one frame is required to build an APNG');
    }

    const outputId = uuid();
    const outputName = `apng_${outputId}.png`;
    const outputPath = path.join(outputDir, outputName);

    const cleanupPaths = [];

    try {
      const processedFrames = [];

      for (const framePath of frames) {
        if (resize && resize.width && resize.height) {
          const resizedPath = path.join(tempDir, `apng_frame_${uuid()}.png`);
          await sharp(framePath)
            .resize(resize.width, resize.height, {
              fit: resize.fit || 'contain',
              background: resize.background || { r: 0, g: 0, b: 0, alpha: 0 }
            })
            .png()
            .toFile(resizedPath);
          processedFrames.push(resizedPath);
          cleanupPaths.push(resizedPath);
        } else {
          processedFrames.push(framePath);
        }
      }

      const delay = Math.max(1, Math.round(100 / Math.max(1, fps)));
      const loopValue = typeof loop === 'number' ? loop : (loop ? 0 : 1);

      const convertArgs = [
        ...processedFrames,
        '-delay',
        `${delay}`,
        '-loop',
        `${loopValue}`,
        outputPath
      ];

      await imageMagickService.convert(convertArgs);

      const stats = await fs.stat(outputPath);
      return {
        success: true,
        outputName,
        outputPath,
        size: stats.size,
        format: 'apng',
        downloadUrl: `/api/output/${outputName}`,
        frameCount: processedFrames.length,
        note: loopValue === 0 ? 'Loops infinitely' : `Loops ${loopValue} time(s)`
      };

    } catch (error) {
      throw new Error(`APNG creation failed: ${error.message}`);
    } finally {
      for (const tempPath of cleanupPaths) {
        try {
          await fs.unlink(tempPath);
        } catch (cleanupError) {
          // Ignore cleanup errors
        }
      }
    }
  }

  async toJXL(inputPath, options = {}) {
    const {
      quality = 90,
      effort = 7,
      lossless = false,
      resize = null
    } = options;

    const outputId = uuid();
    const outputName = `jxl_${outputId}.jxl`;
    const outputPath = path.join(outputDir, outputName);

    const cleanupPaths = [];

    try {
      let workingPath = inputPath;

      if (resize && resize.width && resize.height) {
        const resizedPath = path.join(tempDir, `jxl_resized_${uuid()}.png`);
        await sharp(inputPath)
          .resize(resize.width, resize.height, {
            fit: resize.fit || 'contain',
            background: resize.background || { r: 0, g: 0, b: 0, alpha: 0 }
          })
          .png()
          .toFile(resizedPath);
        workingPath = resizedPath;
        cleanupPaths.push(resizedPath);
      }

      const convertArgs = [workingPath];

      if (lossless) {
        convertArgs.push('-define', 'jxl:distance=0');
      } else {
        convertArgs.push('-quality', `${quality}`);
      }

      convertArgs.push('-define', `jxl:effort=${Math.min(9, Math.max(1, effort))}`);
      convertArgs.push(outputPath);

      await imageMagickService.convert(convertArgs);

      const stats = await fs.stat(outputPath);
      return {
        success: true,
        outputName,
        outputPath,
        size: stats.size,
        format: 'jxl',
        downloadUrl: `/api/output/${outputName}`
      };

    } catch (error) {
      throw new Error(`JXL conversion failed: ${error.message}`);
    } finally {
      for (const tempPath of cleanupPaths) {
        try {
          await fs.unlink(tempPath);
        } catch (cleanupError) {
          // Ignore cleanup errors
        }
      }
    }
  }

  /**
   * Optimize WebP using imagemin
   */
  async optimizeWebP(webpPath, options = {}) {
    const {
      quality = 75,
      method = 6,
      autoFilter = true
    } = options;

    try {
      const optimized = await imagemin([webpPath], {
        plugins: [
          imageminWebp({
            quality,
            method,
            autoFilter
          })
        ]
      });

      if (optimized && optimized[0]) {
        await fs.writeFile(webpPath, optimized[0].data);
        return {
          success: true,
          message: 'WebP optimized successfully',
          size: optimized[0].data.length
        };
      }

      throw new Error('Optimization failed - no output generated');

    } catch (error) {
      throw new Error(`WebP optimization failed: ${error.message}`);
    }
  }

  /**
   * Batch convert multiple files to modern formats
   */
  async batchConvert(inputPaths, outputFormat, options = {}) {
    const results = [];
    const conversionMethod = this.getConversionMethod(outputFormat);

    if (!conversionMethod) {
      throw new Error(`Unsupported output format: ${outputFormat}`);
    }

    for (const inputPath of inputPaths) {
      try {
        const result = await conversionMethod.call(this, inputPath, options);
        results.push({
          success: true,
          inputPath,
          result
        });
      } catch (error) {
        results.push({
          success: false,
          inputPath,
          error: error.message
        });
      }
    }

    const successful = results.filter(r => r.success).length;
    const failed = results.length - successful;

    return {
      results,
      summary: {
        total: results.length,
        successful,
        failed,
        outputFormat
      }
    };
  }

  /**
   * Get conversion method for format
   */
  getConversionMethod(format) {
    const formatMap = {
      'webp': this.toWebP,
      'avif': this.toAVIF,
      'heif': this.toHEIF,
      'apng': this.createAPNG,
      'jxl': this.toJXL
    };

    return formatMap[format.toLowerCase()];
  }

  /**
   * Get format information and capabilities
   */
  getFormatInfo(format) {
    const formatInfo = {
      webp: {
        name: 'WebP',
        description: 'Modern image format with excellent compression',
        supports: ['static', 'animated', 'transparency'],
        browserSupport: '94%+',
        advantages: ['25-35% smaller than JPEG', 'Lossless and lossy modes', 'Animation support']
      },
      avif: {
        name: 'AVIF',
        description: 'Next-generation image format based on AV1 video codec',
        supports: ['static', 'transparency', 'high dynamic range'],
        browserSupport: '85%+',
        advantages: ['50%+ smaller than JPEG', 'Superior quality', 'HDR support']
      },
      heif: {
        name: 'HEIF',
        description: 'High Efficiency Image Format used by Apple',
        supports: ['static', 'sequences', 'transparency'],
        browserSupport: 'Limited (Safari)',
        advantages: ['50% smaller than JPEG', 'Better quality', 'Metadata support']
      },
      jxl: {
        name: 'JPEG XL',
        description: 'Cutting-edge JPEG replacement with superior compression',
        supports: ['static', 'animation', 'high dynamic range'],
        browserSupport: 'In progress (Chrome flag, tools support growing)',
        advantages: ['Better quality at lower bitrates', 'Lossless and lossy modes', 'Progressive decoding']
      },
      apng: {
        name: 'Animated PNG',
        description: 'PNG with animation support',
        supports: ['animated', 'transparency'],
        browserSupport: '95%+',
        advantages: ['Better than GIF quality', 'True color support', 'Alpha transparency']
      }
    };

    return formatInfo[format.toLowerCase()] || null;
  }

  /**
   * Compare formats and recommend best option
   */
  recommendFormat(inputPath, useCase = 'web') {
    const recommendations = {
      web: {
        primary: 'webp',
        fallback: 'avif',
        reason: 'Best balance of compression and browser support'
      },
      mobile: {
        primary: 'avif',
        fallback: 'webp',
        reason: 'Maximum compression for mobile bandwidth'
      },
      print: {
        primary: 'heif',
        fallback: 'png',
        reason: 'High quality preservation for print'
      },
      animation: {
        primary: 'webp',
        fallback: 'apng',
        reason: 'Better compression than GIF with wide support'
      }
    };

    return recommendations[useCase] || recommendations.web;
  }
}

// Export singleton instance
export const modernFormatProcessor = new ModernFormatProcessor();
export default ModernFormatProcessor;