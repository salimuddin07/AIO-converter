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

import { videoSplitterService } from '../services/index.js';
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

function formatSeconds(value) {
  if (!Number.isFinite(value)) return null;
  const totalSeconds = Math.max(0, Math.floor(Number(value)));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds]
    .map((unit) => unit.toString().padStart(2, '0'))
    .join(':');
}

function sanitizeAssetForClient(type, asset, jobId) {
  if (type === 'video') {
    const filename = asset.filename || `${asset.name || 'segment'}_${jobId}.mp4`;
    const encodedFilename = encodeURIComponent(filename);
    const startTime = Number.isFinite(asset.startTime) ? asset.startTime : null;
    const endTime = Number.isFinite(asset.endTime) ? asset.endTime : null;
    const duration = Number.isFinite(asset.duration)
      ? asset.duration
      : startTime !== null && endTime !== null
        ? endTime - startTime
        : null;

    return {
      name: asset.name || path.parse(filename).name,
      filename,
      size: asset.size,
      format: asset.format || path.extname(filename).replace('.', '') || 'mp4',
      startTime,
      endTime,
      duration,
      startTimeFormatted: formatSeconds(startTime),
      endTimeFormatted: formatSeconds(endTime),
      durationFormatted: formatSeconds(duration),
      previewUrl: asset.previewUrl || `/api/split/video/preview/${jobId}/${encodedFilename}`,
      downloadUrl: asset.downloadUrl || `/api/split/video/download/${jobId}/${encodedFilename}`
    };
  }

  const filename = asset.filename;
  const encodedFilename = encodeURIComponent(filename);
  return {
    filename,
    frameNumber: asset.frameNumber ?? asset.index ?? null,
    size: asset.size,
    width: asset.width,
    height: asset.height,
    delay: asset.delay,
    previewUrl: `/api/split/${type}/preview/${jobId}/${encodedFilename}`,
    downloadUrl: `/api/split/${type}/download/${jobId}/${encodedFilename}`
  };
}

function parseTimeValue(value, label, segmentIndex) {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed === '') {
      return null;
    }

    if (/^\d+(\.\d+)?$/.test(trimmed)) {
      return Number(trimmed);
    }

    const parts = trimmed.split(':').map((part) => Number(part));
    if (parts.some((part) => Number.isNaN(part))) {
      throw new Error(`Invalid ${label} provided for segment ${segmentIndex + 1}`);
    }

    if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    if (parts.length === 2) {
      return parts[0] * 60 + parts[1];
    }
    if (parts.length === 1) {
      return parts[0];
    }
  }

  throw new Error(`Invalid ${label} provided for segment ${segmentIndex + 1}`);
}

function normalizeSegments(rawSegments) {
  if (!rawSegments) return [];

  let segmentsPayload = rawSegments;
  if (typeof segmentsPayload === 'string') {
    segmentsPayload = JSON.parse(segmentsPayload);
  }

  if (!Array.isArray(segmentsPayload) || segmentsPayload.length === 0) {
    return [];
  }

  return segmentsPayload.map((segment, index) => {
    const name = segment.name || segment.label || `segment_${index + 1}`;
    const startTime = parseTimeValue(segment.startTime ?? segment.start ?? segment.startSeconds, 'startTime', index);
    const endTimeRaw = segment.endTime ?? segment.end ?? segment.stop ?? null;
    const durationRaw = segment.duration ?? segment.length ?? null;

    let endTime = endTimeRaw !== null ? parseTimeValue(endTimeRaw, 'endTime', index) : null;
    const duration = durationRaw !== null ? parseTimeValue(durationRaw, 'duration', index) : null;

    if (!Number.isFinite(startTime)) {
      throw new Error(`Segment ${index + 1} is missing a valid start time`);
    }

    if (!Number.isFinite(endTime) && Number.isFinite(duration)) {
      endTime = startTime + duration;
    }

    if (!Number.isFinite(endTime)) {
      throw new Error(`Segment ${index + 1} requires an end time or duration`);
    }

    if (endTime <= startTime) {
      throw new Error(`Segment ${index + 1} must end after it starts`);
    }

    return {
      name,
      startTime,
      endTime,
      duration: endTime - startTime
    };
  });
}

function buildSegmentsFromInterval(totalDuration, segmentDuration, prefix = 'segment') {
  if (!Number.isFinite(segmentDuration) || segmentDuration <= 0) {
    throw new Error('segmentDuration must be greater than zero');
  }

  const segments = [];
  let index = 0;
  let cursor = 0;

  const safeTotalDuration = Number(totalDuration) || 0;

  while (cursor < safeTotalDuration) {
    const startTime = cursor;
    const endTime = Math.min(safeTotalDuration, cursor + segmentDuration);

    if (endTime - startTime < 0.1) {
      break;
    }

    segments.push({
      name: `${prefix}_${index + 1}`,
      startTime,
      endTime,
      duration: endTime - startTime
    });

    cursor = endTime;
    index += 1;
  }

  return segments;
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
  frames: splitResult.frames.map((frame) => sanitizeAssetForClient('gif', frame, splitResult.jobId)),
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
  let downloadedRemote = false;

  try {
    if (!inputPath && req.body?.url) {
      inputPath = await downloadRemoteAsset(req.body.url);
      downloadedRemote = true;
    }

    if (!inputPath) {
      return res.status(400).json({
        success: false,
        error: 'No video file provided'
      });
    }

    const createZip = parseBoolean(req.body?.createZip, true);
    const outputFormat = (req.body?.outputFormat || req.body?.format || 'mp4').toLowerCase();
    const quality = (req.body?.quality || 'medium').toLowerCase();
    const preserveAudio = parseBoolean(req.body?.preserveAudio, true);

    let segmentDefinitions = [];
    try {
      segmentDefinitions = normalizeSegments(req.body?.segments);
    } catch (parseError) {
      return res.status(400).json({
        success: false,
        error: parseError.message
      });
    }

    let segmentDuration = null;
    if (req.body?.segmentDuration !== undefined) {
      try {
        segmentDuration = parseTimeValue(req.body.segmentDuration, 'segmentDuration', 0);
      } catch (parseError) {
        return res.status(400).json({ success: false, error: parseError.message });
      }
    }

    let metadataForInterval = null;
    if ((!segmentDefinitions || segmentDefinitions.length === 0) && Number.isFinite(segmentDuration)) {
      metadataForInterval = await videoSplitterService.getVideoMetadata(inputPath);
      segmentDefinitions = buildSegmentsFromInterval(metadataForInterval.duration, segmentDuration, 'clip');
    }

    if (!segmentDefinitions || segmentDefinitions.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Please provide segment definitions or a segmentDuration value.'
      });
    }

    const splitResult = await videoSplitterService.splitVideo(inputPath, segmentDefinitions, {
      outputFormat,
      quality,
      preserveAudio,
      deleteOriginal: false
    });

    const jobOutputDirectory = splitResult.outputDirectory || path.join(outputDir, `split_${splitResult.jobId}`);

    let zipPath = null;
    if (createZip && splitResult.segments?.length) {
      zipPath = await createZipArchive(splitResult.jobId, splitResult.segments, jobOutputDirectory, 'video-segments');
    }

    const jobData = {
      type: 'video',
  outputDirectory: jobOutputDirectory,
      frames: splitResult.segments,
      segments: splitResult.segments,
      metadata: splitResult.metadata || metadataForInterval,
      zipPath,
      createdAt: Date.now()
    };
    activeSplitJobs.set(splitResult.jobId, jobData);

    res.json({
      success: true,
      jobId: splitResult.jobId,
      totalSegments: splitResult.totalSegments,
      metadata: splitResult.metadata || metadataForInterval,
      segments: splitResult.segments.map((segment) => sanitizeAssetForClient('video', segment, splitResult.jobId)),
      zipUrl: zipPath ? `/api/split/video/download-zip/${splitResult.jobId}` : null
    });
  } catch (error) {
    console.error('Video split request error:', error);
    const statusCode = /segment|duration|start/i.test(error.message) ? 400 : 500;
    res.status(statusCode).json({
      success: false,
      error: error.message
    });
  } finally {
    if (inputPath && (downloadedRemote || req.file)) {
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
    segments: job.segments?.length || (job.type === 'video' ? job.frames?.length || 0 : 0),
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
      const zipPrefix = type === 'video' ? 'video-segments' : `${type}-frames`;
      job.zipPath = await createZipArchive(jobId, job.frames, job.outputDirectory, zipPrefix);
      activeSplitJobs.set(jobId, job);
    }

    return res.download(job.zipPath, path.basename(job.zipPath));
  } catch (error) {
    console.error('Split zip download error:', error);
    return res.status(500).json({ success: false, error: 'Failed to create zip archive' });
  }
});
export default router;
