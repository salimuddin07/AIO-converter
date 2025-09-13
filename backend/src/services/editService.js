import sharp from 'sharp';
import { v4 as uuid } from 'uuid';
import path from 'path';
import fs from 'fs/promises';
import { outputDir } from '../lib/file-paths.js';

export async function resizeImage(filePath, options = {}) {
  const { width, height, fit = 'inside' } = options;
  const id = uuid();
  const ext = path.extname(filePath);
  const outName = `${id}${ext}`;
  const outPath = path.join(outputDir, outName);
  
  let pipeline = sharp(filePath);
  if (width || height) {
    pipeline = pipeline.resize(width, height, { fit });
  }
  
  await pipeline.toFile(outPath);
  const stat = await fs.stat(outPath);
  return { outName, outPath, size: stat.size };
}

export async function rotateImage(filePath, angle) {
  const id = uuid();
  const ext = path.extname(filePath);
  const outName = `${id}${ext}`;
  const outPath = path.join(outputDir, outName);
  
  await sharp(filePath).rotate(angle).toFile(outPath);
  const stat = await fs.stat(outPath);
  return { outName, outPath, size: stat.size };
}

export async function adjustImage(filePath, options = {}) {
  const { brightness = 1, contrast = 1, saturation = 1, hue = 0 } = options;
  const id = uuid();
  const ext = path.extname(filePath);
  const outName = `${id}${ext}`;
  const outPath = path.join(outputDir, outName);
  
  await sharp(filePath)
    .modulate({ brightness, saturation, hue })
    .linear(contrast, -(128 * contrast) + 128)
    .toFile(outPath);
  
  const stat = await fs.stat(outPath);
  return { outName, outPath, size: stat.size };
}

export async function cropImage(filePath, options = {}) {
  const { left = 0, top = 0, width, height } = options;
  const id = uuid();
  const ext = path.extname(filePath);
  const outName = `${id}${ext}`;
  const outPath = path.join(outputDir, outName);
  
  await sharp(filePath)
    .extract({ left, top, width, height })
    .toFile(outPath);
  
  const stat = await fs.stat(outPath);
  return { outName, outPath, size: stat.size };
}
