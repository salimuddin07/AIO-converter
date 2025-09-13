import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';
import { tempDir, outputDir } from '../utils/filePaths.js';
import VideoSplitterService from '../services/VideoSplitterService.js';
import SplitService from '../services/splitService.js';

const router = Router();

// Create service instances
const videoSplitterService = new VideoSplitterService();
const splitService = new SplitService();

// Storage configuration for video files
const videoStorage = multer.diskStorage({
  destination: async (req, file, cb) => {
    await fs.mkdir(tempDir, { recursive: true });
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Storage configuration for animated images
const imageStorage = multer.diskStorage({
  destination: async (req, file, cb) => {
    await fs.mkdir(tempDir, { recursive: true });
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filters
const videoFileFilter = (req, file, cb) => {
  const allowedMimes = [
    'video/mp4', 'video/avi', 'video/quicktime', 'video/x-msvideo',
    'video/webm', 'video/ogg', 'video/3gpp', 'video/x-flv'
  ];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only video files are allowed.'), false);
  }
};

const gifFileFilter = (req, file, cb) => {
  if (file.mimetype === 'image/gif') {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only GIF files are allowed.'), false);
  }
};

// Configure multer instances
const videoUpload = multer({ 
  storage: videoStorage,
  fileFilter: videoFileFilter,
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit
});

const gifUpload = multer({ 
  storage: imageStorage,
  fileFilter: gifFileFilter,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

/**
 * @route POST /video
 * @desc Split video into segments
 */
router.post('/video', videoUpload.single('video'), async (req, res) => {
  try {
    const { file } = req;
    if (!file) {
      return res.status(400).json({ error: 'No video file uploaded' });
    }

    const { segments, splitType = 'manual' } = req.body;
    
    if (splitType === 'scenes') {
      // Scene-based splitting
      const jobId = await videoSplitterService.splitVideoByScenes(
        file.path, 
        {
          threshold: parseFloat(req.body.threshold) || 0.3,
          minDuration: parseFloat(req.body.minDuration) || 2
        }
      );

      return res.json({
        success: true,
        jobId: jobId,
        message: 'Scene-based video splitting started',
        statusEndpoint: `/api/split/status/${jobId}`
      });
    } else {
      // Manual time-based splitting
      if (!segments || !Array.isArray(segments)) {
        return res.status(400).json({ 
          error: 'Segments array is required for manual splitting' 
        });
      }

      const jobId = await videoSplitterService.splitVideo(file.path, segments);

      return res.json({
        success: true,
        jobId: jobId,
        segments: segments.length,
        message: 'Video splitting started',
        statusEndpoint: `/api/split/status/${jobId}`
      });
    }

  } catch (error) {
    console.error('Video splitting error:', error);
    return res.status(500).json({
      error: 'Video splitting failed',
      message: error.message
    });
  }
});

/**
 * @route POST /gif  
 * @desc Split GIF into frames or segments
 */
router.post('/gif', gifUpload.single('gif'), async (req, res) => {
  try {
    const { file } = req;
    if (!file) {
      return res.status(400).json({ error: 'No GIF file uploaded' });
    }

    const { 
      extractionType = 'all_frames',
      sceneThreshold = 0.3,
      minSceneDuration = 500
    } = req.body;

    const jobId = crypto.randomBytes(16).toString('hex');

    // Start splitting process
    splitService.once(`job-complete-${jobId}`, (result) => {
      console.log(`GIF splitting job ${jobId} completed:`, result);
    });

    splitService.once(`job-error-${jobId}`, (error) => {
      console.error(`GIF splitting job ${jobId} failed:`, error);
    });

    if (extractionType === 'scene_based') {
      splitService.extractSceneBasedFrames(file.path, {
        outputDir,
        jobId,
        threshold: parseFloat(sceneThreshold),
        minDuration: parseInt(minSceneDuration)
      });
    } else {
      splitService.extractAllFrames(file.path, {
        outputDir,
        jobId
      });
    }

    return res.json({
      success: true,
      jobId: jobId,
      extractionType: extractionType,
      message: 'GIF splitting started',
      statusEndpoint: `/api/split/status/${jobId}`
    });

  } catch (error) {
    console.error('GIF splitting error:', error);
    return res.status(500).json({
      error: 'GIF splitting failed',
      message: error.message
    });
  }
});

/**
 * @route GET /status/:jobId
 * @desc Get splitting job status
 */
router.get('/status/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    
    // Check video splitter status first
    const videoJob = videoSplitterService.getJobStatus(jobId);
    if (videoJob) {
      return res.json({
        success: true,
        jobId: jobId,
        type: 'video',
        ...videoJob
      });
    }

    // Check split service status
    const splitJob = splitService.getJobStatus(jobId);
    if (splitJob) {
      return res.json({
        success: true,
        jobId: jobId,
        type: 'gif',
        ...splitJob
      });
    }

    return res.status(404).json({
      error: 'Job not found',
      jobId: jobId
    });

  } catch (error) {
    console.error('Status check error:', error);
    return res.status(500).json({
      error: 'Status check failed',
      message: error.message
    });
  }
});

/**
 * @route GET /results/:jobId
 * @desc Get splitting results
 */
router.get('/results/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    
    // Check video splitter results first
    const videoResults = videoSplitterService.getJobResults(jobId);
    if (videoResults) {
      return res.json({
        success: true,
        jobId: jobId,
        type: 'video',
        results: videoResults.map(result => ({
          ...result,
          downloadUrl: `/api/output/${path.basename(result.path)}`
        }))
      });
    }

    // Check split service results
    const splitResults = splitService.getJobResults(jobId);
    if (splitResults) {
      return res.json({
        success: true,
        jobId: jobId,
        type: 'gif',
        results: splitResults.map(result => ({
          ...result,
          downloadUrl: `/api/output/${path.basename(result.path)}`
        }))
      });
    }

    return res.status(404).json({
      error: 'Results not found',
      jobId: jobId
    });

  } catch (error) {
    console.error('Results retrieval error:', error);
    return res.status(500).json({
      error: 'Results retrieval failed',
      message: error.message
    });
  }
});

export default router;