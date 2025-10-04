/**
 * Modern Format Routes
 * Handles conversion to modern image formats (WebP, AVIF, HEIF, APNG)
 * 
 * @author Media Converter Team
 */

import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuid } from 'uuid';
import { modernFormatProcessor } from '../services/ModernFormatProcessingService.js';
import { tempDir, getSafeFilename, ensureDirectories } from '../utils/FilePathUtils.js';

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    await ensureDirectories(tempDir);
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const safeFilename = getSafeFilename(`upload_${Date.now()}_${uuid()}${ext}`);
    cb(null, safeFilename);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100GB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 
      'image/webp', 'image/avif', 'image/tiff', 'image/bmp'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only image files are allowed.'));
    }
  }
});

/**
 * Convert image to WebP
 * POST /api/modern/to-webp
 */
router.post('/to-webp', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded' });
    }

    const {
      quality = 80,
      lossless = false,
      method = 6,
      animated = null
    } = req.body;

    // Parse resize options if provided
    let resize = null;
    if (req.body.resize) {
      try {
        resize = JSON.parse(req.body.resize);
      } catch (e) {
        console.warn('Invalid resize JSON:', req.body.resize);
      }
    }

    console.log(`Converting to WebP: ${req.file.originalname}`);

    const result = await modernFormatProcessor.toWebP(req.file.path, {
      quality: parseInt(quality),
      lossless: lossless === 'true' || lossless === true,
      method: parseInt(method),
      animated: animated === 'true' || animated === true,
      resize
    });

    // Clean up uploaded file
    try {
      await fs.unlink(req.file.path);
    } catch (e) {
      console.warn('Failed to clean up uploaded file:', e.message);
    }

    res.json({
      success: true,
      message: 'Image converted to WebP successfully',
      result: {
        ...result,
        originalName: req.file.originalname,
        originalSize: req.file.size,
        compression: `${((req.file.size - result.size) / req.file.size * 100).toFixed(1)}%`
      }
    });

  } catch (error) {
    console.error('WebP conversion error:', error);

    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (e) {
        // Ignore cleanup errors
      }
    }

    res.status(500).json({
      error: 'Failed to convert to WebP',
      details: error.message
    });
  }
});

/**
 * Convert image to AVIF
 * POST /api/modern/to-avif
 */
router.post('/to-avif', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded' });
    }

    const {
      quality = 50,
      speed = 8
    } = req.body;

    let resize = null;
    if (req.body.resize) {
      try {
        resize = JSON.parse(req.body.resize);
      } catch (e) {
        console.warn('Invalid resize JSON:', req.body.resize);
      }
    }

    console.log(`Converting to AVIF: ${req.file.originalname}`);

    const result = await modernFormatProcessor.toAVIF(req.file.path, {
      quality: parseInt(quality),
      speed: parseInt(speed),
      resize
    });

    // Clean up uploaded file
    try {
      await fs.unlink(req.file.path);
    } catch (e) {
      console.warn('Failed to clean up uploaded file:', e.message);
    }

    res.json({
      success: true,
      message: 'Image converted to AVIF successfully',
      result: {
        ...result,
        originalName: req.file.originalname,
        originalSize: req.file.size,
        compression: `${((req.file.size - result.size) / req.file.size * 100).toFixed(1)}%`
      }
    });

  } catch (error) {
    console.error('AVIF conversion error:', error);

    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (e) {
        // Ignore cleanup errors
      }
    }

    res.status(500).json({
      error: 'Failed to convert to AVIF',
      details: error.message
    });
  }
});

/**
 * Create animated PNG from image sequence
 * POST /api/modern/create-apng
 */
router.post('/create-apng', upload.array('images', 60), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No image files uploaded' });
    }

    const {
      fps = 12,
      loop = 0
    } = req.body;

    let resize = null;
    if (req.body.resize) {
      try {
        resize = JSON.parse(req.body.resize);
      } catch (e) {
        console.warn('Invalid resize JSON:', req.body.resize);
      }
    }

    const loopValue = typeof loop === 'string'
      ? (loop === 'true' ? true : loop === 'false' ? false : Number(loop))
      : loop;

    console.log(`Creating APNG from ${req.files.length} frames`);

    const imagePaths = req.files.map((file) => file.path);
    const result = await modernFormatProcessor.createAPNG(imagePaths, {
      fps: parseInt(fps),
      loop: Number.isNaN(loopValue) ? 0 : loopValue,
      resize
    });

    for (const file of req.files) {
      try {
        await fs.unlink(file.path);
      } catch (cleanupError) {
        console.warn('Failed to clean up uploaded file:', cleanupError.message);
      }
    }

    res.json({
      success: true,
      message: 'APNG built successfully',
      result: {
        ...result,
        frameSources: req.files.map((file) => ({
          originalName: file.originalname,
          size: file.size
        }))
      }
    });

  } catch (error) {
    console.error('APNG creation error:', error);

    if (req.files) {
      for (const file of req.files) {
        try {
          await fs.unlink(file.path);
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    }

    res.status(500).json({
      error: 'Failed to create APNG sequence',
      details: error.message
    });
  }
});

/**
 * Convert image to HEIF
 * POST /api/modern/to-heif
 */
router.post('/to-heif', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded' });
    }

    const {
      quality = 80,
      compression = 'av1'
    } = req.body;

    let resize = null;
    if (req.body.resize) {
      try {
        resize = JSON.parse(req.body.resize);
      } catch (e) {
        console.warn('Invalid resize JSON:', req.body.resize);
      }
    }

    console.log(`Converting to HEIF: ${req.file.originalname}`);

    const result = await modernFormatProcessor.toHEIF(req.file.path, {
      quality: parseInt(quality),
      compression,
      resize
    });

    // Clean up uploaded file
    try {
      await fs.unlink(req.file.path);
    } catch (e) {
      console.warn('Failed to clean up uploaded file:', e.message);
    }

    res.json({
      success: true,
      message: 'Image converted to HEIF successfully',
      result: {
        ...result,
        originalName: req.file.originalname,
        originalSize: req.file.size,
        compression: `${((req.file.size - result.size) / req.file.size * 100).toFixed(1)}%`
      }
    });

  } catch (error) {
    console.error('HEIF conversion error:', error);

    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (e) {
        // Ignore cleanup errors
      }
    }

    res.status(500).json({
      error: 'Failed to convert to HEIF',
      details: error.message
    });
  }
});

/**
 * Convert image to JPEG XL
 * POST /api/modern/to-jxl
 */
router.post('/to-jxl', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded' });
    }

    const {
      quality = 90,
      effort = 7,
      lossless = false
    } = req.body;

    let resize = null;
    if (req.body.resize) {
      try {
        resize = JSON.parse(req.body.resize);
      } catch (e) {
        console.warn('Invalid resize JSON:', req.body.resize);
      }
    }

    console.log(`Converting to JXL: ${req.file.originalname}`);

    const result = await modernFormatProcessor.toJXL(req.file.path, {
      quality: parseInt(quality),
      effort: parseInt(effort),
      lossless: lossless === 'true' || lossless === true,
      resize
    });

    try {
      await fs.unlink(req.file.path);
    } catch (e) {
      console.warn('Failed to clean up uploaded file:', e.message);
    }

    res.json({
      success: true,
      message: 'Image converted to JXL successfully',
      result: {
        ...result,
        originalName: req.file.originalname,
        originalSize: req.file.size,
        compression: `${((req.file.size - result.size) / req.file.size * 100).toFixed(1)}%`
      }
    });

  } catch (error) {
    console.error('JXL conversion error:', error);

    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (e) {
        // Ignore cleanup errors
      }
    }

    res.status(500).json({
      error: 'Failed to convert to JXL',
      details: error.message
    });
  }
});

/**
 * Batch convert multiple images to modern format
 * POST /api/modern/batch-convert
 */
router.post('/batch-convert', upload.array('images', 20), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No image files uploaded' });
    }

    const {
      format = 'webp',
      quality = 80
    } = req.body;

    let options = { quality: parseInt(quality) };
    
    // Parse additional options if provided
    if (req.body.options) {
      try {
        const additionalOptions = JSON.parse(req.body.options);
        options = { ...options, ...additionalOptions };
      } catch (e) {
        console.warn('Invalid options JSON:', req.body.options);
      }
    }

    console.log(`Batch converting ${req.files.length} images to ${format}`);

    const inputPaths = req.files.map(file => file.path);
    const result = await modernFormatProcessor.batchConvert(inputPaths, format, options);

    // Clean up uploaded files
    for (const file of req.files) {
      try {
        await fs.unlink(file.path);
      } catch (e) {
        console.warn('Failed to clean up uploaded file:', e.message);
      }
    }

    res.json({
      success: true,
      message: `Batch conversion completed: ${result.summary.successful}/${result.summary.total} successful`,
      result: {
        ...result,
        files: req.files.map(file => ({
          originalName: file.originalname,
          size: file.size
        }))
      }
    });

  } catch (error) {
    console.error('Batch conversion error:', error);

    // Clean up uploaded files on error
    if (req.files) {
      for (const file of req.files) {
        try {
          await fs.unlink(file.path);
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    }

    res.status(500).json({
      error: 'Failed to batch convert images',
      details: error.message
    });
  }
});

/**
 * Get format information and recommendations
 * GET /api/modern/format-info/:format
 */
router.get('/format-info/:format', (req, res) => {
  try {
    const { format } = req.params;
    const info = modernFormatProcessor.getFormatInfo(format);

    if (!info) {
      return res.status(404).json({ error: 'Format not supported or not found' });
    }

    res.json({
      success: true,
      format: format.toUpperCase(),
      info
    });

  } catch (error) {
    console.error('Format info error:', error);
    res.status(500).json({
      error: 'Failed to get format information',
      details: error.message
    });
  }
});

/**
 * Get format recommendation for use case
 * GET /api/modern/recommend/:useCase
 */
router.get('/recommend/:useCase', (req, res) => {
  try {
    const { useCase } = req.params;
    const recommendation = modernFormatProcessor.recommendFormat(null, useCase);

    res.json({
      success: true,
      useCase,
      recommendation
    });

  } catch (error) {
    console.error('Format recommendation error:', error);
    res.status(500).json({
      error: 'Failed to get format recommendation',
      details: error.message
    });
  }
});

/**
 * Compare file sizes across formats
 * POST /api/modern/compare-formats
 */
router.post('/compare-formats', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded' });
    }

    console.log(`Comparing formats for: ${req.file.originalname}`);

    const formats = ['webp', 'avif', 'heif'];
    const results = {
      original: {
        format: path.extname(req.file.originalname).slice(1).toUpperCase(),
        size: req.file.size
      },
      conversions: {}
    };

    // Test each format
    for (const format of formats) {
      try {
        const conversionMethod = modernFormatProcessor.getConversionMethod(format);
        if (conversionMethod) {
          const result = await conversionMethod.call(modernFormatProcessor, req.file.path, { quality: 80 });
          results.conversions[format] = {
            size: result.size,
            savings: `${((req.file.size - result.size) / req.file.size * 100).toFixed(1)}%`,
            downloadUrl: result.downloadUrl
          };
        }
      } catch (error) {
        results.conversions[format] = {
          error: error.message
        };
      }
    }

    // Clean up uploaded file
    try {
      await fs.unlink(req.file.path);
    } catch (e) {
      console.warn('Failed to clean up uploaded file:', e.message);
    }

    res.json({
      success: true,
      message: 'Format comparison completed',
      originalName: req.file.originalname,
      results
    });

  } catch (error) {
    console.error('Format comparison error:', error);

    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (e) {
        // Ignore cleanup errors
      }
    }

    res.status(500).json({
      error: 'Failed to compare formats',
      details: error.message
    });
  }
});

export default router;