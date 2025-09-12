import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { SplitService } from '../services/splitService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../temp');
    await fs.mkdir(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 200 * 1024 * 1024 }, // 200MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.gif', '.webp', '.apng', '.mng', '.avif', '.jxl'];
    const fileExt = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(fileExt)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type. Please upload GIF, WebP, APNG, MNG, AVIF, or JXL files.'));
    }
  }
});

// Split animated image into frames
router.post('/split', upload.single('file'), async (req, res) => {
  let tempDir = null;
  let inputPath = null;
  
  try {
    const { url } = req.body;
    
    // Handle file upload or URL
    if (req.file) {
      inputPath = req.file.path;
    } else if (url) {
      // Download file from URL
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to download image from URL: ${response.statusText}`);
      }
      
      const buffer = await response.arrayBuffer();
      const fileName = `url-${Date.now()}${path.extname(url) || '.gif'}`;
      inputPath = path.join(__dirname, '../temp', fileName);
      await fs.writeFile(inputPath, Buffer.from(buffer));
    } else {
      return res.status(400).json({ error: 'No file or URL provided' });
    }
    
    // Create output directory for frames
    const outputDirName = `split-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    tempDir = path.join(__dirname, '../output', outputDirName);
    
    // Split the animated image
    const result = await SplitService.splitAnimatedImage(inputPath, tempDir);
    
    // Create URLs for each frame
    const frames = result.frames.map(frame => ({
      ...frame,
      url: `/api/output/${outputDirName}/${frame.filename}`,
      downloadUrl: `/api/split/download/${outputDirName}/${frame.filename}`
    }));
    
    // Create ZIP archive
    const zipPath = path.join(tempDir, 'frames.zip');
    await SplitService.createZipArchive(result.frames, zipPath);
    
    res.json({
      success: true,
      totalFrames: result.totalFrames,
      frames,
      zipUrl: `/api/split/download-zip/${outputDirName}`,
      originalDimensions: {
        width: result.originalWidth,
        height: result.originalHeight
      },
      format: result.format
    });
    
    // Cleanup input file
    if (inputPath) {
      try {
        await fs.unlink(inputPath);
      } catch (e) {
        console.warn('Failed to cleanup input file:', e);
      }
    }
    
    // Schedule cleanup of output directory after 1 hour
    setTimeout(async () => {
      await SplitService.cleanup(tempDir);
    }, 60 * 60 * 1000); // 1 hour
    
  } catch (error) {
    console.error('Split error:', error);
    
    // Cleanup on error
    if (inputPath) {
      try {
        await fs.unlink(inputPath);
      } catch (e) {}
    }
    if (tempDir) {
      await SplitService.cleanup(tempDir);
    }
    
    res.status(500).json({ 
      error: error.message || 'Failed to split animated image',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Download individual frame
router.get('/download/:sessionId/:filename', async (req, res) => {
  try {
    const { sessionId, filename } = req.params;
    const filePath = path.join(__dirname, '../output', sessionId, filename);
    
    // Check if file exists
    await fs.access(filePath);
    
    res.download(filePath, filename);
  } catch (error) {
    res.status(404).json({ error: 'Frame not found or expired' });
  }
});

// Download ZIP archive of all frames
router.get('/download-zip/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const zipPath = path.join(__dirname, '../output', sessionId, 'frames.zip');
    
    // Check if ZIP file exists
    await fs.access(zipPath);
    
    res.download(zipPath, 'frames.zip');
  } catch (error) {
    res.status(404).json({ error: 'ZIP archive not found or expired' });
  }
});

// Get split info (for URL preview)
router.get('/info', async (req, res) => {
  try {
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).json({ error: 'URL parameter required' });
    }
    
    // Download and analyze the image
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.statusText}`);
    }
    
    const buffer = await response.arrayBuffer();
    const tempPath = path.join(__dirname, '../temp', `info-${Date.now()}.gif`);
    await fs.writeFile(tempPath, Buffer.from(buffer));
    
    const info = await SplitService.extractGifInfo(tempPath);
    
    // Cleanup temp file
    await fs.unlink(tempPath);
    
    res.json({
      success: true,
      info: {
        width: info.width,
        height: info.height,
        frames: info.pages,
        format: info.format,
        animated: info.pages > 1,
        delays: info.delay || []
      }
    });
    
  } catch (error) {
    console.error('Info error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to get image information'
    });
  }
});

export default router;
