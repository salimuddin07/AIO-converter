import fs from 'fs/promises';
import sharp from 'sharp';
import path from 'path';
import { v4 as uuid } from 'uuid';
import { outputDir } from '../utils/filePaths.js';
import { config } from '../config/index.js';

export async function convertSingle(filePath, targetFormat) {
  const id = uuid();
  const outName = `${id}.${targetFormat}`;
  const outPath = path.join(outputDir, outName);
  // Special-case SVG output: either copy SVG or embed raster as data URI
  if (targetFormat === 'svg') {
    const meta = await sharp(filePath).metadata().catch(() => ({}));
    if (meta?.format === 'svg' || path.extname(filePath).toLowerCase() === '.svg') {
      await fs.copyFile(filePath, outPath);
      const stat = await fs.stat(outPath);
      return { outName, outPath, size: stat.size };
    }
    // Raster -> SVG (embedded raster to ensure fidelity)
    const pngBuf = await sharp(filePath).png().toBuffer();
    const dim = await sharp(pngBuf).metadata();
    const width = dim.width || 0;
    const height = dim.height || 0;
    const base64 = pngBuf.toString('base64');
    const svg = `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">\n  <image href="data:image/png;base64,${base64}" width="${width}" height="${height}"/>\n</svg>`;
    await fs.writeFile(outPath, svg, 'utf8');
    const stat = await fs.stat(outPath);
    return { outName, outPath, size: stat.size };
  }

  let pipeline = sharp(filePath);

  switch (targetFormat) {
    case 'jpg':
    case 'jpeg':
      pipeline = pipeline.jpeg({ quality: config.jpegQuality });
      break;
    case 'png':
      pipeline = pipeline.png();
      break;
    case 'gif':
  // sharp can output gif (static). Animated GIFs are handled in gifService.
  pipeline = pipeline.gif();
      break;
    default:
      throw new Error(`Unsupported target format: ${targetFormat}`);
  }
  await pipeline.toFile(outPath);
  const stat = await fs.stat(outPath);
  return { outName, outPath, size: stat.size };
}
