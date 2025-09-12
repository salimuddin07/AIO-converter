import fs from 'fs/promises';
import sharp from 'sharp';
import path from 'path';
import https from 'https';
import http from 'http';
import { v4 as uuid } from 'uuid';
import { outputDir, tempDir } from '../utils/filePaths.js';
import { config } from '../config/index.js';

// Function to download image from URL
async function downloadImageFromUrl(imageUrl) {
  return new Promise((resolve, reject) => {
    const id = uuid();
    const tempPath = path.join(tempDir, `url-${id}`);
    const protocol = imageUrl.startsWith('https') ? https : http;
    
    const request = protocol.get(imageUrl, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download image: HTTP ${response.statusCode}`));
        return;
      }
      
      const contentType = response.headers['content-type'];
      if (!contentType || !contentType.startsWith('image/')) {
        reject(new Error('URL does not point to a valid image'));
        return;
      }
      
      const file = fs.createWriteStream(tempPath);
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        resolve(tempPath);
      });
      
      file.on('error', (err) => {
        fs.unlink(tempPath).catch(() => {});
        reject(err);
      });
    });
    
    request.on('error', (err) => {
      reject(new Error(`Failed to download image: ${err.message}`));
    });
    
    // Set timeout
    request.setTimeout(30000, () => {
      request.abort();
      reject(new Error('Download timeout'));
    });
  });
}

export async function convertSingle(filePath, targetFormat, options = {}) {
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
    case 'webp':
      const webpOptions = {
        quality: options.quality || 80,
        method: options.method || 6,
        lossless: options.lossless || false
      };
      pipeline = pipeline.webp(webpOptions);
      break;
    case 'avif':
      pipeline = pipeline.avif({ quality: options.quality || 80 });
      break;
    case 'tiff':
      pipeline = pipeline.tiff();
      break;
    default:
      throw new Error(`Unsupported target format: ${targetFormat}`);
  }
  await pipeline.toFile(outPath);
  const stat = await fs.stat(outPath);
  return { outName, outPath, size: stat.size };
}

export async function convertFromUrl(imageUrl, targetFormat, options = {}) {
  console.log(`\n=== URL CONVERSION START ===`);
  console.log(`URL: ${imageUrl}`);
  console.log(`Format: ${targetFormat}`);
  console.log(`============================`);
  
  let tempPath;
  try {
    // Download image from URL
    tempPath = await downloadImageFromUrl(imageUrl);
    console.log(`Downloaded to temp: ${tempPath}`);
    
    // Convert the downloaded file
    const result = await convertSingle(tempPath, targetFormat, options);
    
    // Clean up temp file
    await fs.unlink(tempPath).catch(() => {});
    
    return result;
  } catch (error) {
    // Clean up temp file if exists
    if (tempPath) {
      await fs.unlink(tempPath).catch(() => {});
    }
    throw error;
  }
}
