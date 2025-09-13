import express from 'express';
import multer from 'multer';
import path from 'path';
import WebPController from '../controllers/webpController.js';
import validateFiles from '../middleware/FileValidator.js';

// Import consolidated file utilities
import { tempDir, getSafeFilename, ensureDirectories } from '../utils/FilePathUtils.js';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    await ensureDirectories(tempDir);
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const safeFilename = getSafeFilename(`upload-${uniqueSuffix}${path.extname(file.originalname)}`);
    cb(null, safeFilename);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    // Accept images for WebP conversion
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

const webpUpload = multer({ 
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    // Accept only WebP files for decoding
    if (file.mimetype === 'image/webp') {
      cb(null, true);
    } else {
      cb(new Error('Only WebP files are allowed'), false);
    }
  }
});

/**
 * @route POST /webp/convert
 * @desc Convert images to WebP format
 * @access Public
 */
router.post('/convert', 
  upload.array('images', 50), // Allow up to 50 files
  validateFiles,
  WebPController.convertToWebP
);

/**
 * @route POST /webp/decode
 * @desc Convert WebP files to other formats
 * @access Public
 */
router.post('/decode',
  webpUpload.array('webp_files', 50),
  validateFiles,
  WebPController.convertFromWebP
);

/**
 * @route POST /webp/animate
 * @desc Create animated WebP from multiple images
 * @access Public
 */
router.post('/animate',
  upload.array('images', 100), // Allow more files for animation
  validateFiles,
  WebPController.createAnimatedWebP
);

/**
 * @route POST /webp/info
 * @desc Get WebP file information
 * @access Public
 */
router.post('/info',
  webpUpload.single('webp_file'),
  WebPController.getWebPInfo
);

/**
 * @route POST /webp/optimize
 * @desc Optimize WebP files for better compression
 * @access Public
 */
router.post('/optimize',
  webpUpload.array('webp_files', 50),
  validateFiles,
  WebPController.optimizeWebP
);

// Error handling middleware for multer errors
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'File too large',
        message: 'File size must be less than 50MB'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        error: 'Too many files',
        message: 'Maximum 50 files allowed per upload'
      });
    }
  }
  
  if (error.message === 'Only image files are allowed' || 
      error.message === 'Only WebP files are allowed') {
    return res.status(400).json({
      error: 'Invalid file type',
      message: error.message
    });
  }

  console.error('WebP route error:', error);
  return res.status(500).json({
    error: 'Upload failed',
    message: error.message
  });
});

export default router;
