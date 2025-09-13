import path from 'path';
import { createError } from './ErrorHandler.js';
import { config, supportedExtensions } from '../config/index.js';

const MAX_BYTES = config.maxFileSizeMB * 1024 * 1024;
const MAX_COUNT = config.maxBatchCount;

export default function validateFiles(req, _res, next) {
  const files = req.files || [];
  if (!files.length) {
    return next(createError('No files uploaded', 400, 'NO_FILES'));
  }
  if (files.length > MAX_COUNT) {
    return next(createError(`Too many files. Max ${MAX_COUNT}`, 400, 'TOO_MANY_FILES'));
  }
  const problems = [];
  files.forEach(f => {
    const ext = path.extname(f.originalname).toLowerCase();
  if (!supportedExtensions.includes(ext)) problems.push(`${f.originalname}: unsupported format`);
  if (f.size > MAX_BYTES) problems.push(`${f.originalname}: exceeds ${config.maxFileSizeMB}MB`);
  });
  if (problems.length) {
    return next(createError('Validation failed', 400, 'VALIDATION_ERROR', problems));
  }
  next();
}
