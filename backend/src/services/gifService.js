import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';
import { v4 as uuid } from 'uuid';
import sharp from 'sharp';
import GIFEncoder from 'gif-encoder-2';
import { outputDir } from '../utils/filePaths.js';

export async function createAnimatedGif(framePaths, options = {}) {
  if (!framePaths.length) throw new Error('No frames provided');
  
  const {
    frameDelays = [], // Array of individual delays in 1/100 seconds
    frameDelay = 20, // Default delay in 1/100 seconds (0.2s)
    loop = 0, // 0 = infinite loop
    quality = 5, // 1-20, lower is better
    globalColormap = false,
    crossfade = false,
    crossfadeFrames = 10,
    crossfadeDelay = 6,
    noStack = false,
    keepFirst = false,
    skipFirst = false
  } = options;

  console.log('Creating GIF with options:', options);

  try {
    // Get dimensions from first frame
    const firstMeta = await sharp(framePaths[0]).metadata();
    const width = firstMeta.width || 1;
    const height = firstMeta.height || 1;

    const id = uuid();
    const outName = `${id}.gif`;
    const outPath = path.join(outputDir, outName);
    const writeStream = fs.createWriteStream(outPath);

    const encoder = new GIFEncoder(width, height, {
      highWaterMark: 64 * 1024 // Memory optimization
    });
    
    encoder.createReadStream().pipe(writeStream);
    encoder.start();
    encoder.setRepeat(loop);
    encoder.setQuality(Math.max(1, Math.min(20, quality)));

    let processedFrames = 0;

    // Process main frames (simplified version first)
    for (let i = 0; i < framePaths.length; i++) {
      const framePath = framePaths[i];
      const currentDelay = frameDelays[i] || frameDelay;
      
      encoder.setDelay(currentDelay * 10); // Convert 1/100s to ms

      // Process frame
      const { data } = await sharp(framePath)
        .resize(width, height, { 
          fit: 'contain',
          background: { r: 255, g: 255, b: 255 } // White background for now
        })
        .raw()
        .toBuffer({ resolveWithObject: true });

      encoder.addFrame(data);
      processedFrames++;
    }

    encoder.finish();

    await new Promise((resolve, reject) => {
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
    });

    const stat = await fsPromises.stat(outPath);
    console.log(`GIF created: ${outName}, ${processedFrames} frames, size: ${stat.size} bytes`);
    
    return { 
      outName, 
      outPath, 
      size: stat.size,
      frames: processedFrames,
      dimensions: { width, height }
    };
  } catch (error) {
    console.error('GIF creation error:', error);
    throw new Error(`Failed to create GIF: ${error.message}`);
  }
}
