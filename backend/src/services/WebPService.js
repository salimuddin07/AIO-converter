import path from 'path';
import fs from 'fs/promises';
import sharp from 'sharp';
import { v4 as uuid } from 'uuid';
import { outputDir, tempDir } from '../utils/FilePathUtils.js';

/**
 * WebP Service - Specialized WebP encoding/decoding
 * Specializes in: High-quality WebP conversion, advanced WebP features, batch WebP operations
 * Best for: Modern web optimization, animated WebP creation, WebP-specific features
 */
class WebPService {
  constructor() {
    this.webp = null;
    this.useSharp = false;
    this.isInitialized = false;
    this.defaultOptions = {
      quality: 85,
      method: 4, // 0-6, higher = slower but better compression
      preset: 'default', // default, photo, picture, drawing, icon, text
      lossless: false,
      alphaQuality: 100,
      autoFilter: true,
      sharpness: 0, // 0-7
      filterStrength: 60
    };
  }

  /**
   * Initialize WebP binaries (lazy loading)
   */
  async initialize() {
    if (this.isInitialized) return;
    
    try {
      const webpModule = await import('node-webp');
      this.webp = webpModule.default;
      this.useSharp = false;
      console.log('WebP binaries loaded successfully');
    } catch (error) {
      console.warn('WebP binaries not found, using Sharp as fallback:', error.message);
      this.webp = null;
      this.useSharp = true;
    }
    this.isInitialized = true;
  }

  /**
   * Check if WebP is available (either via node-webp or Sharp)
   */
  async ensureWebPAvailable() {
    await this.initialize();
    // WebP is always available via Sharp fallback
    return true;
  }

  /**
   * Convert image to WebP with advanced options
   */
  async convertToWebP(imagePath, options = {}) {
    try {
      await this.ensureWebPAvailable();

      const config = { ...this.defaultOptions, ...options };
      const outputName = `webp_${uuid()}.webp`;
      const outputPath = path.join(outputDir, outputName);

      console.log('Converting to WebP:', { imagePath, outputPath, config, useSharp: this.useSharp });

      let result;
      if (this.useSharp) {
        // Use Sharp as fallback
        await sharp(imagePath)
          .webp({ 
            quality: config.quality,
            lossless: config.lossless,
            alphaQuality: config.alphaQuality
          })
          .toFile(outputPath);
        result = { success: true };
      } else {
        // Use node-webp for conversion
        result = await this.webp.cwebp(imagePath, outputPath, `-q ${config.quality} -m ${config.method} -preset ${config.preset}${config.lossless ? ' -lossless' : ''} -alpha_q ${config.alphaQuality}${config.autoFilter ? ' -auto_filter' : ''} -sharpness ${config.sharpness} -f ${config.filterStrength}`);
      }

      const stats = await fs.stat(outputPath);
      const originalStats = await fs.stat(imagePath);
      const compression = ((originalStats.size - stats.size) / originalStats.size * 100).toFixed(1);

      return {
        outName: outputName,
        path: outputPath,
        size: stats.size,
        originalSize: originalStats.size,
        compression: `${compression}%`,
        quality: config.quality,
        lossless: config.lossless,
        method: this.useSharp ? 'Sharp' : 'node-webp'
      };
    } catch (error) {
      console.error('WebP conversion failed:', error);
      throw new Error(`WebP conversion failed: ${error.message}`);
    }
  }

  /**
   * Convert WebP to other formats
   */
  async convertFromWebP(webpPath, targetFormat = 'png', options = {}) {
    try {
      const outputName = `converted_${uuid()}.${targetFormat}`;
      const outputPath = path.join(outputDir, outputName);

      console.log('Converting from WebP:', { webpPath, outputPath, targetFormat });

      // Use node-webp for decoding
      await webp.dwebp(webpPath, outputPath, options.quality ? `-q ${options.quality}` : '');

      const stats = await fs.stat(outputPath);

      return {
        outName: outputName,
        path: outputPath,
        size: stats.size,
        format: targetFormat.toUpperCase()
      };
    } catch (error) {
      console.error('WebP decode failed:', error);
      throw new Error(`WebP decode failed: ${error.message}`);
    }
  }

  /**
   * Create animated WebP from image sequence
   */
  async createAnimatedWebP(imagePaths, options = {}) {
    try {
      const {
        frameDelay = 100, // milliseconds
        loop = 0, // 0 = infinite loop
        quality = 85,
        method = 4
      } = options;

      const outputName = `animated_${uuid()}.webp`;
      const outputPath = path.join(outputDir, outputName);

      // Create temporary list file for img2webp
      const listPath = path.join(tempDir, `webp_list_${uuid()}.txt`);
      const listContent = imagePaths.map(imgPath => `${imgPath} ${frameDelay}`).join('\n');
      await fs.writeFile(listPath, listContent);

      console.log('Creating animated WebP:', { outputPath, frames: imagePaths.length });

      // Use img2webp for animated WebP creation
      const command = `-q ${quality} -m ${method} -loop ${loop} -o ${outputPath}`;
      await webp.img2webp(listPath, outputPath, command);

      // Clean up temporary file
      await fs.unlink(listPath);

      const stats = await fs.stat(outputPath);

      return {
        outName: outputName,
        path: outputPath,
        size: stats.size,
        frames: imagePaths.length,
        frameDelay: frameDelay,
        loop: loop,
        quality: quality
      };
    } catch (error) {
      console.error('Animated WebP creation failed:', error);
      throw new Error(`Animated WebP creation failed: ${error.message}`);
    }
  }

  /**
   * Batch convert multiple images to WebP
   */
  async batchConvertToWebP(imagePaths, options = {}) {
    const results = [];
    const concurrency = options.concurrency || 3;

    // Process in batches to avoid overwhelming the system
    for (let i = 0; i < imagePaths.length; i += concurrency) {
      const batch = imagePaths.slice(i, i + concurrency);
      
      const batchPromises = batch.map(async (imagePath, index) => {
        try {
          const result = await this.convertToWebP(imagePath, {
            ...options,
            // Add batch-specific options if needed
            quality: options.qualities?.[i + index] || options.quality
          });
          return { success: true, ...result };
        } catch (error) {
          return { 
            success: false, 
            error: error.message, 
            imagePath: imagePath 
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
            error: result.reason.message || 'Unknown error' 
          });
        }
      });
    }

    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    return {
      total: imagePaths.length,
      successful: successful.length,
      failed: failed.length,
      results: results,
      totalSavings: successful.reduce((sum, r) => {
        const savings = parseFloat(r.compression?.replace('%', '') || '0');
        return sum + savings;
      }, 0)
    };
  }

  /**
   * Get WebP information
   */
  async getWebPInfo(webpPath) {
    try {
      // Use webpmux to get WebP information
      const info = await webp.webpmux_getinfo(webpPath);
      
      return {
        path: webpPath,
        info: info,
        isAnimated: info.includes('Animation'),
        hasAlpha: info.includes('Alpha'),
        format: 'WebP'
      };
    } catch (error) {
      console.error('WebP info extraction failed:', error);
      throw new Error(`WebP info extraction failed: ${error.message}`);
    }
  }

  /**
   * Optimize WebP file
   */
  async optimizeWebP(webpPath, options = {}) {
    try {
      const {
        quality = 85,
        method = 6, // Use highest quality method for optimization
        lossless = false
      } = options;

      const outputName = `optimized_${uuid()}.webp`;
      const outputPath = path.join(outputDir, outputName);

      // Re-encode with optimization settings
      const tempPngPath = path.join(tempDir, `temp_${uuid()}.png`);
      
      // Decode to PNG first
      await webp.dwebp(webpPath, tempPngPath, '');
      
      // Re-encode with optimization
      await this.convertToWebP(tempPngPath, {
        quality: quality,
        method: method,
        lossless: lossless
      });

      // Clean up temporary file
      await fs.unlink(tempPngPath);

      const originalStats = await fs.stat(webpPath);
      const optimizedStats = await fs.stat(outputPath);
      const improvement = ((originalStats.size - optimizedStats.size) / originalStats.size * 100).toFixed(1);

      return {
        outName: outputName,
        path: outputPath,
        originalSize: originalStats.size,
        optimizedSize: optimizedStats.size,
        improvement: `${improvement}%`,
        quality: quality
      };
    } catch (error) {
      console.error('WebP optimization failed:', error);
      throw new Error(`WebP optimization failed: ${error.message}`);
    }
  }
}

export default WebPService;
