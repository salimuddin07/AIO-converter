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
  
  console.log(`\n=== CONVERSION START ===`);
  console.log(`Input: ${filePath}`);
  console.log(`Format: ${targetFormat}`);
  console.log(`Output: ${outName}`);
  console.log(`========================`);
  
  // Special-case SVG output: copy SVG or create transparent vector
  if (targetFormat === 'svg') {
    console.log('SVG conversion requested');
    const meta = await sharp(filePath).metadata().catch(() => ({}));
    if (meta?.format === 'svg' || path.extname(filePath).toLowerCase() === '.svg') {
      console.log('Input is SVG, copying file');
      await fs.copyFile(filePath, outPath);
      const stat = await fs.stat(outPath);
      return { outName, outPath, size: stat.size };
    }
    // Raster -> SVG with background removal but preserve colors
    console.log('Converting raster to SVG with background removal');
    
    try {
      // Create PNG with transparency - remove white/light backgrounds only
      const { data, info } = await sharp(filePath)
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });
      
      // Process pixel data to make white/light backgrounds transparent
      const pixels = new Uint8Array(data);
      for (let i = 0; i < pixels.length; i += 4) {
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        
        // If pixel is very light (close to white), make it transparent
        if (r > 240 && g > 240 && b > 240) {
          pixels[i + 3] = 0; // Set alpha to 0 (transparent)
        }
      }
      
      // Create PNG with transparency
      const transparentPng = await sharp(pixels, {
        raw: {
          width: info.width,
          height: info.height,
          channels: 4
        }
      }).png().toBuffer();
      
      const width = info.width;
      const height = info.height;
      const base64 = transparentPng.toString('base64');
      
      // Create SVG with transparent background
      const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <image href="data:image/png;base64,${base64}" width="${width}" height="${height}"/>
</svg>`;
      
      await fs.writeFile(outPath, svg, 'utf8');
      const stat = await fs.stat(outPath);
      console.log(`SVG with background removal created: ${outName}, size: ${stat.size}`);
      return { outName, outPath, size: stat.size };
      
    } catch (e) {
      console.log('Background removal failed, creating simple SVG:', e.message);
      // Fallback to simple embedding
      const pngBuf = await sharp(filePath).png().toBuffer();
      const dim = await sharp(pngBuf).metadata();
      const width = dim.width || 0;
      const height = dim.height || 0;
      const base64 = pngBuf.toString('base64');
      const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <image href="data:image/png;base64,${base64}" width="${width}" height="${height}"/>
</svg>`;
      await fs.writeFile(outPath, svg, 'utf8');
      const stat = await fs.stat(outPath);
      console.log(`SVG created: ${outName}, size: ${stat.size}`);
      return { outName, outPath, size: stat.size };
    }
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
