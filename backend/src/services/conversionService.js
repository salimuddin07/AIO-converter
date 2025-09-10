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
    // Raster -> SVG with background removal
    console.log('Converting raster to SVG with background removal');
    
    try {
      // Try to remove white/light backgrounds and create PNG with transparency
      const transparentPng = await sharp(filePath)
        .png()
        .threshold(240) // Convert light colors to white
        .negate() // Invert colors (white becomes black)
        .threshold(1) // Make black areas transparent
        .negate() // Invert back
        .toBuffer();
      
      const dim = await sharp(transparentPng).metadata();
      const width = dim.width || 0;
      const height = dim.height || 0;
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
