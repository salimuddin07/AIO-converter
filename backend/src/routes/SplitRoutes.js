/**
 * Split Routes
 * Handles video and GIF splitting operations
 */
import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import fsPromises from 'fs/promises';
import crypto from 'crypto';
import archiver from 'archiver';

import { videoProcessor } from '../services/index.js';
import { splitService } from '../services/SplitService.js';
import { tempDir, outputDir, getSafeFilename, ensureDirectories } from '../utils/FilePathUtils.js';

const router = Router();

const activeSplitJobs = new Map();

const SUPPORTED_VIDEO_EXTENSIONS = ['.mp4', '.mov', '.avi', '.webm', '.mkv', '.flv', '.wmv', '.m4v'];
const SUPPORTED_GIF_EXTENSIONS = ['.gif'];

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    try {
      ensureDirectories();
    } catch (error) {
      console.error('Failed to ensure directories for split upload:', error.message);
    }
    cb(null, tempDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const safeFilename = getSafeFilename(`upload_${Date.now()}_${crypto.randomBytes(8).toString('hex')}${ext}`);
    cb(null, safeFilename);
  }
});

const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (SUPPORTED_VIDEO_EXTENSIONS.includes(ext) || SUPPORTED_GIF_EXTENSIONS.includes(ext)) {
      cb(null, true);
      return;
    }
    cb(new Error('Invalid file type. Please upload a GIF or supported video file.'), false);
  }
});

function parseBoolean(value, defaultValue = false) {
  if (value === undefined || value === null || value === '') return defaultValue;
  if (typeof value === 'boolean') return value;
  return ['true', '1', 'yes', 'on'].includes(String(value).toLowerCase());
}

async function downloadRemoteAsset(url) {
  const safeUrl = String(url || '').trim();
  if (!safeUrl) {
    throw new Error('No URL provided');
  }

  const httpsModule = await import('node:https');
  const httpModule = await import('node:http');

  const protocol = safeUrl.startsWith('https') ? httpsModule : httpModule;
  const urlObj = new URL(safeUrl);
  const ext = path.extname(urlObj.pathname) || '.bin';
  const tempFilename = getSafeFilename(`remote_${Date.now()}_${crypto.randomBytes(6).toString('hex')}${ext}`);
  const destinationPath = path.join(tempDir, tempFilename);

  try {
    ensureDirectories();
  } catch (error) {
    console.error('Failed to ensure directories for remote asset:', error.message);
  }

  return new Promise((resolve, reject) => {
    const fileStream = fs.createWriteStream(destinationPath);
    protocol.get(safeUrl, (response) => {
      if (response.statusCode && response.statusCode >= 400) {
        fileStream.close(() => fsPromises.unlink(destinationPath).catch(() => {}));
        reject(new Error(`Failed to download asset. HTTP ${response.statusCode}`));
        return;
      }
      response.pipe(fileStream);
      fileStream.on('finish', () => fileStream.close(() => resolve(destinationPath)));
    }).on('error', (error) => {
      fileStream.close(() => fsPromises.unlink(destinationPath).catch(() => {}));
      reject(error);
    });
  });
}

async function createZipArchive(jobId, frames, destinationDir, prefix = 'frames') {
  const zipFilename = `${prefix}_${jobId}.zip`;
  const zipPath = path.join(destinationDir, zipFilename);

  await fsPromises.mkdir(destinationDir, { recursive: true });

  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => resolve(zipPath));
    archive.on('warning', (err) => {
      if (err.code === 'ENOENT') {
        console.warn('Split zip warning:', err.message);
      } else {
        reject(err);
      }
    });
    archive.on('error', reject);

    archive.pipe(output);

    frames.forEach((frame) => {
      try {
        archive.file(frame.path, { name: frame.filename });
      } catch (error) {
        console.warn(`Failed to add frame to zip: ${frame.filename}`, error.message);
      }
    });

    archive.finalize();
  });
}

function sanitizeFrameForClient(frame, jobId, type) {
  return {
    filename: frame.filename,
    frameNumber: frame.frameNumber,
    size: frame.size,
    width: frame.width,
    height: frame.height,
    delay: frame.delay,
    previewUrl: `/api/split/${type}/preview/${jobId}/${encodeURIComponent(frame.filename)}`,
    downloadUrl: `/api/split/${type}/download/${jobId}/${encodeURIComponent(frame.filename)}`
  };
}

router.get('/', (_req, res) => {
  res.json({
    success: true,
    service: 'Split Processing Service',
    supported: {
      video: SUPPORTED_VIDEO_EXTENSIONS,
      gif: SUPPORTED_GIF_EXTENSIONS
    }
  });
});

router.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'split' });
});

router.post('/gif', upload.single('gif'), async (req, res) => {
  let inputPath = req.file?.path;
  let shouldCleanupInput = false;

  try {
    if (!inputPath && req.body?.url) {
      inputPath = await downloadRemoteAsset(req.body.url);
      shouldCleanupInput = true;
    }

    if (!inputPath) {
      return res.status(400).json({
        success: false,
        error: 'No GIF or animated image provided'
      });
    }

    const outputFormat = (req.body?.outputFormat || 'png').toLowerCase();
    const quality = req.body?.quality ? Number(req.body.quality) : 90;
    const skipDuplicates = parseBoolean(req.body?.skipDuplicates, false);
    const createZip = parseBoolean(req.body?.createZip, true);

    const splitResult = await splitService.splitAnimatedImage(inputPath, {
      outputFormat,
      quality,
      skipDuplicates,
      createZip
    });

    const jobData = {
      type: 'gif',
      outputDirectory: splitResult.outputDirectory,
      frames: splitResult.frames,
      zipPath: splitResult.zipPath || null,
      createdAt: Date.now()
    };

    activeSplitJobs.set(splitResult.jobId, jobData);

    const responsePayload = {
      success: true,
      jobId: splitResult.jobId,
      totalFrames: splitResult.totalFrames,
      outputFormat: splitResult.outputFormat,
      original: {
        width: splitResult.originalWidth,
        height: splitResult.originalHeight,
        format: splitResult.originalFormat
      },
      frames: splitResult.frames.map((frame) => sanitizeFrameForClient(frame, splitResult.jobId, 'gif')),
      zipUrl: splitResult.zipUrl || (createZip ? `/api/split/gif/download-zip/${splitResult.jobId}` : null)
    };

    res.json(responsePayload);
  } catch (error) {
    console.error('GIF split request error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  } finally {
    if (shouldCleanupInput && inputPath) {
      fsPromises.unlink(inputPath).catch(() => {});
    }
  }
});

router.post('/video', upload.single('video'), async (req, res) => {
  let inputPath = req.file?.path;
  let shouldCleanupInput = false;

  try {
    if (!inputPath && req.body?.url) {
      inputPath = await downloadRemoteAsset(req.body.url);
      shouldCleanupInput = true;
    }

    if (!inputPath) {
      return res.status(400).json({
        success: false,
        error: 'No video file provided'
      });
    }

    const fps = req.body?.fps ? Number(req.body.fps) : 5;
    const format = (req.body?.format || 'png').toLowerCase();
    const width = req.body?.width ? Number(req.body.width) : undefined;
    const height = req.body?.height ? Number(req.body.height) : undefined;
    const startTime = req.body?.startTime ? Number(req.body.startTime) : 0;
    const endTime = req.body?.endTime ? Number(req.body.endTime) : undefined;
    const createZip = parseBoolean(req.body?.createZip, true);

    const outputDirectory = path.join(outputDir, `video_split_${crypto.randomBytes(8).toString('hex')}`);

    const extraction = await videoProcessor.extractFrames(inputPath, {
      fps,
      format,
      width,
      height,
      startTime,
      endTime,
      outputDirectory
    });

    let zipPath = null;
    if (createZip && extraction.frames.length) {
      zipPath = await createZipArchive(extraction.jobId, extraction.frames, outputDirectory, 'video-frames');
    }

    const jobData = {
      type: 'video',
      outputDirectory,
      frames: extraction.frames,
      zipPath,
      createdAt: Date.now()
    };
    activeSplitJobs.set(extraction.jobId, jobData);

    const responsePayload = {
      success: true,
      jobId: extraction.jobId,
      fps: extraction.fps,
      totalFrames: extraction.totalFrames,
      width: extraction.width,
      height: extraction.height,
      duration: extraction.duration,
      frames: extraction.frames.map((frame) => sanitizeFrameForClient(frame, extraction.jobId, 'video')),
      zipUrl: zipPath ? `/api/split/video/download-zip/${extraction.jobId}` : null
    };

    res.json(responsePayload);
  } catch (error) {
    console.error('Video split request error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  } finally {
    if (shouldCleanupInput && inputPath) {
      fsPromises.unlink(inputPath).catch(() => {});
    }
  }
});

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
    type: job.type,
    frames: job.frames?.length || 0,
    hasZip: Boolean(job.zipPath)
  });
});

async function handleAssetResponse(req, res, disposition = 'inline') {
  const { type, jobId, filename } = req.params;
  const job = activeSplitJobs.get(jobId);

  if (!job || job.type !== type) {
    return res.status(404).json({ success: false, error: 'Job not found' });
  }

  const decodedFilename = decodeURIComponent(filename);
  const filePath = path.join(job.outputDirectory, decodedFilename);

  try {
    await fsPromises.access(filePath);
  } catch (_error) {
    return res.status(404).json({ success: false, error: 'File not found' });
  }

  if (disposition === 'attachment') {
    return res.download(filePath, decodedFilename);
  }

  return res.sendFile(filePath);
}

router.get('/:type/preview/:jobId/:filename', (req, res) => {
  handleAssetResponse(req, res, 'inline');
});

router.get('/:type/download/:jobId/:filename', (req, res) => {
  handleAssetResponse(req, res, 'attachment');
});

router.get('/:type/download-zip/:jobId', async (req, res) => {
  const { type, jobId } = req.params;
  const job = activeSplitJobs.get(jobId);

  if (!job || job.type !== type) {
    return res.status(404).json({ success: false, error: 'Job not found' });
  }

  try {
    if (!job.zipPath || !(await fsPromises.stat(job.zipPath).catch(() => null))) {
      job.zipPath = await createZipArchive(jobId, job.frames, job.outputDirectory, `${type}-frames`);
      activeSplitJobs.set(jobId, job);
    }

    return res.download(job.zipPath, path.basename(job.zipPath));
  } catch (error) {
    console.error('Split zip download error:', error);
    return res.status(500).json({ success: false, error: 'Failed to create zip archive' });
  }
});
export default router;
