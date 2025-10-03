import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuid } from 'uuid';
import fs from 'fs/promises';
import fsSync from 'fs';
import { config } from '../config/index.js';
import { createError } from '../middleware/ErrorHandler.js';
import { tempDir, outputDir, getSafeFilename, ensureDirectories } from '../utils/FilePathUtils.js';

const router = Router();

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, tempDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuid()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: config.maxFileSizeGB * 1024 * 1024, files: config.maxBatchCount },
  fileFilter: (_req, file, cb) => {
    const imageFormats = [
      'image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp', 
      'image/bmp', 'image/tiff', 'image/svg+xml', 'image/x-icon'
    ];
    const videoFormats = [
      'video/mp4', 'video/mov', 'video/avi', 'video/webm', 'video/mkv', 
      'video/flv', 'video/wmv', 'video/3gp', 'video/ogv'
    ];
    const archiveFormats = [
      'application/zip', 'application/x-zip-compressed'
    ];
    
    const allFormats = [...imageFormats, ...videoFormats, ...archiveFormats];
    
    if (allFormats.includes(file.mimetype)) {
      return cb(null, true);
    }
    
    return cb(new Error(`Unsupported file type: ${file.mimetype || 'unknown'}`));
  }
});

router.post('/test', async (req, res) => {
  try {
    console.log('TEST ROUTE HIT:', req.body);
    return res.json({ success: true, message: 'Test route working', body: req.body });
  } catch (error) {
    console.error('TEST ROUTE ERROR:', error);
    return res.status(500).json({ error: error.message });
  }
});

router.post('/', upload.array('files'), async (req, res) => {
  try {
    console.log('=== CONVERT REQUEST START ===');
    const { tool = 'convert', targetFormat = 'png', options = {} } = req.body;
    const files = req.files || [];
    const url = req.body.url;
    
    if (!files.length && !url) {
      return res.status(400).json({ 
        error: { 
          code: 'NO_FILES', 
          message: 'No files or URL provided for conversion' 
        } 
      });
    }

    console.log(`Processing ${files.length} files with tool: ${tool}, format: ${targetFormat}`);

    // Import conversion services
    const { convertSingle, convertFromUrl } = await import('../services/ConversionService.js');
    const results = [];

    // Handle URL conversion
    if (url && !files.length) {
      try {
        const result = await convertFromUrl(url, targetFormat, options);
        results.push({
          success: true,
          originalName: url,
          outputFile: result.outName,
          downloadUrl: `/api/output/${result.outName}`,
          size: result.size,
          format: targetFormat
        });
      } catch (error) {
        console.error('URL conversion error:', error);
        results.push({
          success: false,
          originalName: url,
          error: error.message
        });
      }
    }

    // Handle file conversions
    for (const file of files) {
      try {
        console.log(`Converting: ${file.originalname} -> ${targetFormat}`);
        const result = await convertSingle(file.path, targetFormat, options);
        results.push({
          success: true,
          originalName: file.originalname,
          outputFile: result.outName,
          downloadUrl: `/api/output/${result.outName}`,
          size: result.size,
          format: targetFormat
        });
      } catch (error) {
        console.error(`Conversion error for ${file.originalname}:`, error);
        results.push({
          success: false,
          originalName: file.originalname,
          error: error.message
        });
      }
    }

    const successful = results.filter(r => r.success).length;
    const failed = results.length - successful;

    return res.json({ 
      success: failed === 0,
      message: failed === 0 ? 'All conversions completed successfully' : `${successful} succeeded, ${failed} failed`,
      tool,
      targetFormat,
      results,
      summary: {
        total: results.length,
        successful,
        failed
      }
    });

  } catch (error) {
    console.error('Conversion error:', error);
    return res.status(500).json({
      error: {
        code: 'CONVERSION_ERROR',
        message: error.message || 'Conversion failed'
      }
    });
  }
});

export default router;
