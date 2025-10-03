/**
 * Split Routes
 * Handles video and GIF splitting operations
 * 
 * @author Media Converter Team
 */

import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';

// Import consolidated services
import { videoProcessor, gifProcessor } from '../services/index.js';
import { tempDir, outputDir, getSafeFilename, ensureDirectories } from '../utils/FilePathUtils.js';

const router = Router();

// Test route
router.get('/', (req, res) => {
    res.json({ 
        success: true, 
        service: 'Split Processing Service',
        message: 'Split processing endpoints are available',
        endpoints: ['/split', '/frames', '/extract']
    });
});

// Health check
router.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'split' });
});

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    await ensureDirectories(tempDir);
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const safeFilename = getSafeFilename(`upload_${Date.now()}_${crypto.randomBytes(8).toString('hex')}${ext}`);
    cb(null, safeFilename);
  }
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 500 * 1024 * 1024 // 500GB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /\.(mp4|avi|mov|webm|mkv|gif)$/i;
    if (allowedTypes.test(file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only video and GIF files are allowed.'), false);
    }
  }
});

// Job tracking for async operations
const activeSplitJobs = new Map();

/**
 * Split video into segments
 * POST /api/split/video
 */
router.post('/video', upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        error: 'No video file provided' 
      });
    }

    const { 
      segmentDuration = 30,
      maxSegments = 20,
      format = 'mp4',
      quality = 'medium'
    } = req.body;

    const jobId = crypto.randomBytes(16).toString('hex');
    
    activeSplitJobs.set(jobId, {
      status: 'processing',
      progress: 0,
      startTime: Date.now(),
      inputFile: req.file.path,
      segments: []
    });

    res.json({
      success: true,
      jobId,
      message: 'Video splitting started'
    });

  } catch (error) {
    console.error('Video split request error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Split GIF into frames
 * POST /api/split/gif
 */
router.post('/gif', upload.single('gif'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        error: 'No GIF file provided' 
      });
    }

    const jobId = crypto.randomBytes(16).toString('hex');
    
    activeSplitJobs.set(jobId, {
      status: 'processing',
      progress: 0,
      startTime: Date.now(),
      inputFile: req.file.path,
      frames: []
    });

    res.json({
      success: true,
      jobId,
      message: 'GIF splitting started'
    });

  } catch (error) {
    console.error('GIF split request error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get split job status
 * GET /api/split/status/:jobId
 */
router.get('/status/:jobId', (req, res) => {
  const { jobId } = req.params;
  const job = activeSplitJobs.get(jobId);

  if (!job) {
    return res.status(404).json({
      success: false,
      error: 'Job not found'
    });
  }

  res.json({
    success: true,
    jobId,
    status: job.status,
    progress: job.progress
  });
});

export default router;
