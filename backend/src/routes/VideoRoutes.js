import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Import consolidated services and utilities
import { videoProcessor } from '../services/index.js';
import { tempDir, getSafeFilename, ensureDirectories } from '../utils/FilePathUtils.js';

const router = express.Router();

// Configure multer for video uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    await ensureDirectories(tempDir);
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    const safeFilename = getSafeFilename(`upload_${Date.now()}_${file.originalname}`);
    cb(null, safeFilename);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 200 * 1024 * 1024 // 200MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'video/mp4',
      'video/webm',
      'video/avi',
      'video/quicktime',
      'video/x-msvideo',
      'video/x-flv',
      'video/ogg',
      'video/x-ms-wmv',
      'video/3gpp',
      'video/x-matroska'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Please upload a valid video file.'));
    }
  }
});

// Upload video endpoint
router.post('/upload', upload.single('video'), async (req, res) => {
  try {
    let result;
    
    if (req.file) {
      // Handle file upload
      result = await videoProcessor.processVideo(req.file.path, req.file.originalname);
    } else if (req.body.url) {
      // Handle URL upload
      result = await videoProcessor.processVideoFromUrl(req.body.url);
    } else {
      return res.status(400).json({ error: 'No file or URL provided' });
    }
    
    res.json({
      success: true,
      videoId: result.videoId,
      originalFilename: result.originalFilename,
      duration: result.duration,
      width: result.width,
      height: result.height,
      fps: result.fps,
      codec: result.codec,
      fileSize: result.fileSize
    });
  } catch (error) {
    console.error('Video upload error:', error);
    res.status(500).json({ 
      error: 'Failed to process video',
      details: error.message 
    });
  }
});

// Get video info endpoint
router.get('/info/:videoId', async (req, res) => {
  try {
    const { videoId } = req.params;
    const videoPath = await videoProcessor.getVideoPreviewPath(videoId);
    const videoInfo = await videoProcessor.getVideoInfo(videoPath);
    
    res.json({
      success: true,
      videoId,
      ...videoInfo
    });
  } catch (error) {
    console.error('Get video info error:', error);
    res.status(404).json({ 
      error: 'Video not found',
      details: error.message 
    });
  }
});

// Convert video to GIF endpoint
router.post('/convert', async (req, res) => {
  try {
    const {
      videoId,
      startTime = 0,
      endTime = 5,
      width,
      height,
      fps = 10,
      quality = 90,
      method = 'ffmpeg'
    } = req.body;
    
    if (!videoId) {
      return res.status(400).json({ error: 'Video ID is required' });
    }
    
    // Validate time range
    if (endTime <= startTime) {
      return res.status(400).json({ error: 'End time must be greater than start time' });
    }
    
    // Validate duration limits based on fps
    const duration = endTime - startTime;
    const maxDuration = fps <= 5 ? 60 : fps <= 10 ? 30 : fps <= 15 ? 20 : fps <= 20 ? 15 : 10;
    
    if (duration > maxDuration) {
      return res.status(400).json({ 
        error: `Duration too long. Maximum duration at ${fps} fps is ${maxDuration} seconds` 
      });
    }
    
    const result = await videoProcessor.convertToGif(videoId, {
      startTime: parseFloat(startTime),
      endTime: parseFloat(endTime),
      width: width ? parseInt(width) : undefined,
      height: height ? parseInt(height) : undefined,
      fps: parseInt(fps),
      quality: parseInt(quality),
      method
    });
    
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Video conversion error:', error);
    res.status(500).json({ 
      error: 'Failed to convert video to GIF',
      details: error.message 
    });
  }
});

// Serve video previews
router.get('/preview/:videoId', async (req, res) => {
  try {
    const { videoId } = req.params;
    const videoPath = await videoProcessor.getVideoPreviewPath(videoId);
    
    if (!fs.existsSync(videoPath)) {
      return res.status(404).json({ error: 'Video not found' });
    }
    
    const stat = fs.statSync(videoPath);
    const fileSize = stat.size;
    const range = req.headers.range;
    
    if (range) {
      // Handle range requests for video streaming
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;
      const file = fs.createReadStream(videoPath, { start, end });
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'video/mp4',
      };
      res.writeHead(206, head);
      file.pipe(res);
    } else {
      // Serve entire file
      const head = {
        'Content-Length': fileSize,
        'Content-Type': 'video/mp4',
      };
      res.writeHead(200, head);
      fs.createReadStream(videoPath).pipe(res);
    }
  } catch (error) {
    console.error('Video preview error:', error);
    res.status(404).json({ error: 'Video not found' });
  }
});

// Serve GIF previews
router.get('/gif-preview/:gifPath', async (req, res) => {
  try {
    const { gifPath } = req.params;
    const fullPath = await videoProcessor.getGifPath(gifPath);
    
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ error: 'GIF not found' });
    }
    
    res.setHeader('Content-Type', 'image/gif');
    fs.createReadStream(fullPath).pipe(res);
  } catch (error) {
    console.error('GIF preview error:', error);
    res.status(404).json({ error: 'GIF not found' });
  }
});

// Download GIF endpoint
router.get('/download/:gifPath', async (req, res) => {
  try {
    const { gifPath } = req.params;
    const fullPath = await videoProcessor.getGifPath(gifPath);
    
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ error: 'GIF not found' });
    }
    
    const filename = `converted_${Date.now()}.gif`;
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'image/gif');
    
    fs.createReadStream(fullPath).pipe(res);
  } catch (error) {
    console.error('GIF download error:', error);
    res.status(404).json({ error: 'GIF not found' });
  }
});

// Cleanup endpoint (optional)
router.delete('/cleanup/:videoId', async (req, res) => {
  try {
    const { videoId } = req.params;
    await videoProcessor.cleanup(videoId);
    res.json({ success: true, message: 'Cleanup completed' });
  } catch (error) {
    console.error('Cleanup error:', error);
    res.status(500).json({ 
      error: 'Cleanup failed',
      details: error.message 
    });
  }
});

export default router;
