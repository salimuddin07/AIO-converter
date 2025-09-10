import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuid } from 'uuid';
import fs from 'fs/promises';
import { tempDir } from '../utils/filePaths.js';
import { config, convertibleTargets } from '../config/index.js';
import validateFiles from '../middleware/validateFiles.js';
import { createError } from '../middleware/errorHandler.js';
import { convertSingle } from '../services/conversionService.js';
import { createAnimatedGif } from '../services/gifService.js';

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
  limits: { fileSize: config.maxFileSizeMB * 1024 * 1024, files: config.maxBatchCount },
  fileFilter: (_req, file, cb) => {
    const allowed = [/png$/i, /jpeg$/i, /jpg$/i, /gif$/i, /svg\+xml$/i, /bmp$/i, /tiff$/i];
    if (allowed.some(r => r.test(file.mimetype))) return cb(null, true);
    return cb(new Error('Unsupported mimetype'));
  }
});

router.post('/', upload.array('files'), validateFiles, async (req, res, next) => {
  try {
  console.log('Incoming convert request', { fileCount: (req.files||[]).length, body: req.body });
  const targetFormat = (req.body.targetFormat || '').toLowerCase();
  if (!targetFormat) return next(createError('targetFormat required', 400, 'NO_TARGET_FORMAT'));
  if (!convertibleTargets.includes(targetFormat)) return next(createError('Unsupported targetFormat', 400, 'UNSUPPORTED_TARGET_FORMAT'));

    const gifOptions = {
      frameDelay: req.body['gif.frameDelay'] ? parseInt(req.body['gif.frameDelay'], 10) : undefined,
      loop: req.body['gif.loop'] ? parseInt(req.body['gif.loop'], 10) : undefined
    };

    const files = req.files || [];

    let results = [];
    if (targetFormat === 'gif') {
      const forceSingle = req.body.singleGif === 'true' || req.body.singleGif === true;
      if (files.length > 1) {
        const framePaths = files.map(f => f.path);
        const gif = await createAnimatedGif(framePaths, gifOptions);
        results.push({
          originalName: files.map(f => f.originalname).join(','),
          convertedName: gif.outName,
          url: `/api/files/${gif.outName}`,
          sizeBytes: gif.size,
          mimeType: 'image/gif',
          animated: true,
          frames: files.length
        });
      } else if (forceSingle) {
        // Create a 1-frame GIF via encoder to avoid platform-specific sharp.gif() issues
        const gif = await createAnimatedGif([files[0].path], gifOptions);
        results.push({
          originalName: files[0].originalname,
          convertedName: gif.outName,
          url: `/api/files/${gif.outName}`,
          sizeBytes: gif.size,
          mimeType: 'image/gif',
          animated: false,
          frames: 1
        });
      } else {
        // If single image requested as gif without flag, just passthrough conversion to PNG (default) or JPEG? We'll convert to PNG to keep transparency.
        const { outName, size } = await convertSingle(files[0].path, 'png');
        results.push({
          originalName: files[0].originalname,
          convertedName: outName,
          url: `/api/files/${outName}`,
          sizeBytes: size,
          mimeType: 'image/png',
          note: 'Single image GIF not generated unless singleGif=true; returned PNG instead'
        });
      }
    } else {
      for (const f of files) {
        const { outName, size } = await convertSingle(f.path, targetFormat);
        const mime = (t => {
          if (t === 'jpg' || t === 'jpeg') return 'image/jpeg';
          if (t === 'png') return 'image/png';
          if (t === 'gif') return 'image/gif';
          if (t === 'svg') return 'image/svg+xml';
          return `image/${t}`;
        })(targetFormat);
        results.push({
          originalName: f.originalname,
          convertedName: outName,
          url: `/api/files/${outName}`,
          sizeBytes: size,
          mimeType: mime
        });
      }
    }

    res.json({ results });
  } catch (e) {
    next(e);
  } finally {
    // Do not delete originals immediately if you want debugging; here we keep them for TTL.
    // Could optionally remove: await Promise.all((req.files||[]).map(f=>fs.unlink(f.path)));
  }
});

export default router;
