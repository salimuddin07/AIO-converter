/**
 * Enhanced GIF Routes
 * Advanced GIF processing with modern libraries and effects
 * 
 * @author Media Converter Team
 */

import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuid } from 'uuid';
import { enhancedGifProcessor } from '../services/EnhancedGifProcessingService.js';
import { tempDir, outputDir, getSafeFilename, ensureDirectories } from '../utils/FilePathUtils.js';

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
    fileSize: 500 * 1024 * 1024 // 500GB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'video/mp4', 'video/avi', 'video/mov', 'video/webm', 'video/mkv',
      'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only video and image files are allowed.'));
    }
  }
});

/**
 * Create GIF from video with advanced options
 * POST /api/gif/video-to-gif
 */
router.post('/video-to-gif', upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No video file uploaded' });
    }

    const {
      startTime = 0,
      duration = 3,
      width,
      height,
      fps = 15,
      quality = 'high',
      optimization = 'medium'
    } = req.body;

    // Parse effects if provided
    let effects = [];
    if (req.body.effects) {
      try {
        effects = JSON.parse(req.body.effects);
      } catch (e) {
        console.warn('Invalid effects JSON:', req.body.effects);
      }
    }

    console.log(`Creating GIF from video: ${req.file.originalname}`);
    console.log(`Options:`, {
      startTime: parseFloat(startTime),
      duration: parseFloat(duration),
      width: width ? parseInt(width) : null,
      height: height ? parseInt(height) : null,
      fps: parseInt(fps),
      quality,
      optimization,
      effects
    });

    const result = await enhancedGifProcessor.videoToGif(req.file.path, {
      startTime: parseFloat(startTime),
      duration: parseFloat(duration),
      width: width ? parseInt(width) : null,
      height: height ? parseInt(height) : null,
      fps: parseInt(fps),
      quality,
      optimization,
      effects
    });

    // Clean up uploaded file
    try {
      await fs.unlink(req.file.path);
    } catch (e) {
      console.warn('Failed to clean up uploaded file:', e.message);
    }

    res.json({
      success: true,
      message: 'GIF created successfully',
      result: {
        filename: result.outputName,
        size: result.size,
        downloadUrl: result.downloadUrl,
        originalName: req.file.originalname
      }
    });

  } catch (error) {
    console.error('Video to GIF error:', error);
    
    // Clean up uploaded file on error
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (e) {
        // Ignore cleanup errors
      }
    }

    res.status(500).json({
      error: 'Failed to create GIF from video',
      details: error.message
    });
  }
});

/**
 * Create GIF from multiple images
 * POST /api/gif/images-to-gif
 */
router.post('/images-to-gif', upload.array('images', 50), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No image files uploaded' });
    }

    const {
      fps = 10,
      quality = 'high',
      width,
      height,
      loop = true,
      delay,
      loopCount,
      frameDelays,
      fit
    } = req.body;

    console.log(`Creating GIF from ${req.files.length} images`);

    const imagePaths = req.files.map(file => file.path);
    
    const parsedDelay = delay !== undefined && delay !== null && delay !== ''
      ? parseInt(delay, 10)
      : null;
    const sanitizedDelay = Number.isNaN(parsedDelay) ? null : parsedDelay;

    const parsedLoopCount = loopCount !== undefined && loopCount !== null && loopCount !== '' && loopCount !== 'infinite'
      ? parseInt(loopCount, 10)
      : null;
    const sanitizedLoopCount = Number.isNaN(parsedLoopCount) ? null : parsedLoopCount;

    let parsedFrameDelays = [];
    if (frameDelays) {
      try {
        const raw = JSON.parse(frameDelays);
        if (Array.isArray(raw)) {
          parsedFrameDelays = raw.map((value) => {
            const numeric = parseInt(value, 10);
            if (Number.isNaN(numeric)) {
              return null;
            }
            return Math.max(10, Math.min(2000, numeric));
          });
        }
      } catch (parseError) {
        console.warn('Unable to parse frameDelays payload:', parseError.message);
      }
    }

    const allowedFits = new Set(['contain', 'cover', 'fill']);
    const sanitizedFit = allowedFits.has(fit) ? fit : undefined;

    const result = await enhancedGifProcessor.imagesToGif(imagePaths, {
      fps: parseInt(fps),
      quality,
      width: width ? parseInt(width) : null,
      height: height ? parseInt(height) : null,
      loop: loop === 'true' || loop === true,
      delay: sanitizedDelay,
      loopCount: sanitizedLoopCount,
      frameDelays: parsedFrameDelays,
      fit: sanitizedFit
    });

    let dataUrl = null;
    try {
      if (result.outputPath) {
        const buffer = await fs.readFile(result.outputPath);
        const base64 = buffer.toString('base64');
        dataUrl = `data:image/gif;base64,${base64}`;
      } else {
        throw new Error('GIF output path missing from processor result.');
      }
    } catch (readError) {
      console.error('Failed to build GIF data URL:', readError);
      throw new Error('Unable to prepare GIF data for download.');
    } finally {
      if (result.outputPath) {
        try {
          await fs.unlink(result.outputPath);
        } catch (cleanupError) {
          console.warn('Failed to remove temporary GIF output:', cleanupError.message);
        }
      }
    }

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
      message: 'GIF created successfully from images',
      result: {
        filename: result.outputName,
        size: result.size,
        frameCount: req.files.length,
        dataUrl,
        previewUrl: dataUrl,
        downloadUrl: dataUrl
      }
    });

  } catch (error) {
    console.error('Images to GIF error:', error);

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
      error: 'Failed to create GIF from images',
      details: error.message
    });
  }
});

/**
 * Convert GIF to WebP
 * POST /api/gif/gif-to-webp
 */
router.post('/gif-to-webp', upload.single('gif'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No GIF file uploaded' });
    }

    const {
      quality = 80,
      method = 6
    } = req.body;

    console.log(`Converting GIF to WebP: ${req.file.originalname}`);

    const result = await enhancedGifProcessor.gifToWebp(req.file.path, {
      quality: parseInt(quality),
      method: parseInt(method)
    });

    // Clean up uploaded file
    try {
      await fs.unlink(req.file.path);
    } catch (e) {
      console.warn('Failed to clean up uploaded file:', e.message);
    }

    res.json({
      success: true,
      message: 'GIF converted to WebP successfully',
      result: {
        filename: result.outputName,
        size: result.size,
        downloadUrl: result.downloadUrl,
        originalName: req.file.originalname
      }
    });

  } catch (error) {
    console.error('GIF to WebP error:', error);

    // Clean up uploaded file on error
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (e) {
        // Ignore cleanup errors
      }
    }

    res.status(500).json({
      error: 'Failed to convert GIF to WebP',
      details: error.message
    });
  }
});

/**
 * Optimize existing GIF
 * POST /api/gif/optimize
 */
router.post('/optimize', upload.single('gif'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No GIF file uploaded' });
    }

    const { level = 'medium' } = req.body;

    console.log(`Optimizing GIF: ${req.file.originalname}`);

    // Get original size
    const originalStats = await fs.stat(req.file.path);
    const originalSize = originalStats.size;

    // Optimize the GIF
    await enhancedGifProcessor.optimizeGif(req.file.path, level);

    // Get optimized size
    const optimizedStats = await fs.stat(req.file.path);
    const optimizedSize = optimizedStats.size;

    // Move optimized file to output directory
    const outputId = uuid();
    const outputName = `optimized_${outputId}.gif`;
    const outputPath = path.join(outputDir, outputName);
    
    await fs.copyFile(req.file.path, outputPath);
    await fs.unlink(req.file.path);

    const savings = ((originalSize - optimizedSize) / originalSize * 100).toFixed(1);

    res.json({
      success: true,
      message: 'GIF optimized successfully',
      result: {
        filename: outputName,
        originalSize,
        optimizedSize,
        savings: `${savings}%`,
        downloadUrl: `/api/output/${outputName}`,
        originalName: req.file.originalname
      }
    });

  } catch (error) {
    console.error('GIF optimization error:', error);

    // Clean up uploaded file on error
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (e) {
        // Ignore cleanup errors
      }
    }

    res.status(500).json({
      error: 'Failed to optimize GIF',
      details: error.message
    });
  }
});

/**
 * Get GIF information
 * POST /api/gif/info
 */
router.post('/info', upload.single('gif'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No GIF file uploaded' });
    }

    const info = await enhancedGifProcessor.getGifInfo(req.file.path);

    // Clean up uploaded file
    try {
      await fs.unlink(req.file.path);
    } catch (e) {
      console.warn('Failed to clean up uploaded file:', e.message);
    }

    res.json({
      success: true,
      info: {
        ...info,
        originalName: req.file.originalname
      }
    });

  } catch (error) {
    console.error('Get GIF info error:', error);

    // Clean up uploaded file on error
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (e) {
        // Ignore cleanup errors
      }
    }

    res.status(500).json({
      error: 'Failed to get GIF information',
      details: error.message
    });
  }
});

export default router;