// Import consolidated services and utilities
import { serviceFactory } from '../services/index.js';
import path from 'path';
import fs from 'fs/promises';
import archiver from 'archiver';
import { v4 as uuid } from 'uuid';
import { outputDir, tempDir, ensureDirectories } from '../utils/FilePathUtils.js';

// Get WebP service from factory
const webpService = serviceFactory.legacyServices.webp;

/**
 * WebP Conversion Controller
 * Handles WebP conversion requests with batch processing and zip downloads
 */
class WebPController {
  /**
   * Convert single or multiple files to WebP
   */
  static async convertToWebP(req, res) {
    try {
      const files = req.files;
      if (!files || files.length === 0) {
        return res.status(400).json({ 
          error: 'No files uploaded' 
        });
      }

      const {
        quality = 85,
        lossless = false,
        method = 4,
        preset = 'default',
        alphaQuality = 100,
        autoFilter = true,
        sharpness = 0,
        filterStrength = 60,
        downloadAsZip = false
      } = req.body;

      const options = {
        quality: parseInt(quality),
        lossless: lossless === 'true',
        method: parseInt(method),
        preset,
        alphaQuality: parseInt(alphaQuality),
        autoFilter: autoFilter !== 'false',
        sharpness: parseInt(sharpness),
        filterStrength: parseInt(filterStrength)
      };

      // Single file conversion
      if (files.length === 1) {
        const file = files[0];
        const result = await webpService.convertToWebP(file.path, options);
        
        return res.json({
          success: true,
          file: {
            original: file.originalname,
            converted: result.outName,
            size: result.size,
            originalSize: result.originalSize,
            compression: result.compression,
            quality: result.quality,
            downloadUrl: `/download/${result.outName}`
          }
        });
      }

      // Batch conversion
      const filePaths = files.map(file => file.path);
      const batchResult = await webpService.batchConvertToWebP(filePaths, options);

      if (downloadAsZip === 'true' && batchResult.successful > 0) {
        // Create ZIP file with all converted images
        const zipResult = await this.createZipDownload(
          batchResult.results.filter(r => r.success),
          'webp-converted'
        );

        return res.json({
          success: true,
          batch: true,
          total: batchResult.total,
          successful: batchResult.successful,
          failed: batchResult.failed,
          totalSavings: `${(batchResult.totalSavings / batchResult.successful).toFixed(1)}%`,
          zipDownload: {
            filename: zipResult.filename,
            downloadUrl: `/download/${zipResult.filename}`,
            size: zipResult.size
          },
          results: batchResult.results.map(result => ({
            success: result.success,
            original: result.imagePath ? path.basename(result.imagePath) : 'unknown',
            converted: result.outName,
            compression: result.compression,
            error: result.error,
            downloadUrl: result.success ? `/download/${result.outName}` : null
          }))
        });
      }

      // Return individual file results
      return res.json({
        success: true,
        batch: true,
        total: batchResult.total,
        successful: batchResult.successful,
        failed: batchResult.failed,
        totalSavings: `${(batchResult.totalSavings / batchResult.successful).toFixed(1)}%`,
        results: batchResult.results.map(result => ({
          success: result.success,
          original: result.imagePath ? path.basename(result.imagePath) : 'unknown',
          converted: result.outName,
          compression: result.compression,
          error: result.error,
          downloadUrl: result.success ? `/download/${result.outName}` : null
        }))
      });

    } catch (error) {
      console.error('WebP conversion error:', error);
      return res.status(500).json({
        error: 'WebP conversion failed',
        message: error.message
      });
    }
  }

  /**
   * Convert WebP files to other formats
   */
  static async convertFromWebP(req, res) {
    try {
      const files = req.files;
      if (!files || files.length === 0) {
        return res.status(400).json({ 
          error: 'No WebP files uploaded' 
        });
      }

      const {
        targetFormat = 'png',
        quality = 90,
        downloadAsZip = false
      } = req.body;

      const options = {
        quality: parseInt(quality)
      };

      const results = [];

      // Process each WebP file
      for (const file of files) {
        try {
          const result = await webpService.convertFromWebP(
            file.path, 
            targetFormat, 
            options
          );
          results.push({
            success: true,
            original: file.originalname,
            converted: result.outName,
            format: result.format,
            size: result.size,
            downloadUrl: `/download/${result.outName}`
          });
        } catch (error) {
          results.push({
            success: false,
            original: file.originalname,
            error: error.message
          });
        }
      }

      const successful = results.filter(r => r.success);
      
      if (downloadAsZip === 'true' && successful.length > 0) {
        // Create ZIP file with converted images
        const zipResult = await this.createZipDownload(
          successful,
          `webp-to-${targetFormat}`
        );

        return res.json({
          success: true,
          total: files.length,
          successful: successful.length,
          failed: files.length - successful.length,
          targetFormat: targetFormat.toUpperCase(),
          zipDownload: {
            filename: zipResult.filename,
            downloadUrl: `/download/${zipResult.filename}`,
            size: zipResult.size
          },
          results: results
        });
      }

      return res.json({
        success: true,
        total: files.length,
        successful: successful.length,
        failed: files.length - successful.length,
        targetFormat: targetFormat.toUpperCase(),
        results: results
      });

    } catch (error) {
      console.error('WebP decode error:', error);
      return res.status(500).json({
        error: 'WebP decode failed',
        message: error.message
      });
    }
  }

  /**
   * Create animated WebP from multiple images
   */
  static async createAnimatedWebP(req, res) {
    try {
      const files = req.files;
      if (!files || files.length < 2) {
        return res.status(400).json({ 
          error: 'At least 2 images required for animation' 
        });
      }

      const {
        frameDelay = 100,
        loop = 0,
        quality = 85,
        method = 4
      } = req.body;

      const options = {
        frameDelay: parseInt(frameDelay),
        loop: parseInt(loop),
        quality: parseInt(quality),
        method: parseInt(method)
      };

      const imagePaths = files.map(file => file.path);
      const result = await webpService.createAnimatedWebP(imagePaths, options);

      return res.json({
        success: true,
        animated: true,
        filename: result.outName,
        size: result.size,
        frames: result.frames,
        frameDelay: result.frameDelay,
        loop: result.loop,
        quality: result.quality,
        downloadUrl: `/download/${result.outName}`
      });

    } catch (error) {
      console.error('Animated WebP creation error:', error);
      return res.status(500).json({
        error: 'Animated WebP creation failed',
        message: error.message
      });
    }
  }

  /**
   * Get WebP file information
   */
  static async getWebPInfo(req, res) {
    try {
      const file = req.file;
      if (!file) {
        return res.status(400).json({ 
          error: 'No WebP file uploaded' 
        });
      }

      const info = await webpService.getWebPInfo(file.path);

      return res.json({
        success: true,
        filename: file.originalname,
        ...info
      });

    } catch (error) {
      console.error('WebP info error:', error);
      return res.status(500).json({
        error: 'WebP info extraction failed',
        message: error.message
      });
    }
  }

  /**
   * Optimize WebP files
   */
  static async optimizeWebP(req, res) {
    try {
      const files = req.files;
      if (!files || files.length === 0) {
        return res.status(400).json({ 
          error: 'No WebP files uploaded' 
        });
      }

      const {
        quality = 85,
        method = 6,
        lossless = false,
        downloadAsZip = false
      } = req.body;

      const options = {
        quality: parseInt(quality),
        method: parseInt(method),
        lossless: lossless === 'true'
      };

      const results = [];

      for (const file of files) {
        try {
          const result = await webpService.optimizeWebP(file.path, options);
          results.push({
            success: true,
            original: file.originalname,
            optimized: result.outName,
            originalSize: result.originalSize,
            optimizedSize: result.optimizedSize,
            improvement: result.improvement,
            quality: result.quality,
            downloadUrl: `/download/${result.outName}`
          });
        } catch (error) {
          results.push({
            success: false,
            original: file.originalname,
            error: error.message
          });
        }
      }

      const successful = results.filter(r => r.success);
      
      if (downloadAsZip === 'true' && successful.length > 0) {
        const zipResult = await this.createZipDownload(
          successful,
          'webp-optimized'
        );

        return res.json({
          success: true,
          total: files.length,
          successful: successful.length,
          failed: files.length - successful.length,
          averageImprovement: `${(successful.reduce((sum, r) => sum + parseFloat(r.improvement.replace('%', '')), 0) / successful.length).toFixed(1)}%`,
          zipDownload: {
            filename: zipResult.filename,
            downloadUrl: `/download/${zipResult.filename}`,
            size: zipResult.size
          },
          results: results
        });
      }

      return res.json({
        success: true,
        total: files.length,
        successful: successful.length,
        failed: files.length - successful.length,
        averageImprovement: `${(successful.reduce((sum, r) => sum + parseFloat(r.improvement.replace('%', '')), 0) / successful.length).toFixed(1)}%`,
        results: results
      });

    } catch (error) {
      console.error('WebP optimization error:', error);
      return res.status(500).json({
        error: 'WebP optimization failed',
        message: error.message
      });
    }
  }

  /**
   * Create ZIP file for download
   */
  static async createZipDownload(results, prefix) {
    const zipFilename = `${prefix}-${uuid()}.zip`;
    const zipPath = path.join(outputDir, zipFilename);

    return new Promise((resolve, reject) => {
      const output = require('fs').createWriteStream(zipPath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      output.on('close', async () => {
        const stats = await fs.stat(zipPath);
        resolve({
          filename: zipFilename,
          path: zipPath,
          size: stats.size
        });
      });

      archive.on('error', (err) => {
        reject(err);
      });

      archive.pipe(output);

      // Add files to ZIP
      results.forEach(result => {
        const filename = result.converted || result.optimized;
        const filePath = path.join(outputDir, filename);
        archive.file(filePath, { name: filename });
      });

      archive.finalize();
    });
  }
}

export { WebPController };
export default WebPController;
