import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';
import { v4 as uuid } from 'uuid';
import sharp from 'sharp';
import GIFEncoder from 'gif-encoder-2';
import { outputDir } from '../utils/filePaths.js';

export async function createAnimatedGif(framePaths, options = {}) {
  if (!framePaths.length) throw new Error('No frames provided');
  const delay = options.frameDelay || 100; // ms
  const loop = options.loop ?? 0; // 0 infinite

  const firstMeta = await sharp(framePaths[0]).metadata();
  const width = firstMeta.width || 1;
  const height = firstMeta.height || 1;

  const id = uuid();
  const outName = `${id}.gif`;
  const outPath = path.join(outputDir, outName);
  const writeStream = fs.createWriteStream(outPath);

  const encoder = new GIFEncoder(width, height);
  encoder.createReadStream().pipe(writeStream);
  encoder.start();
  encoder.setRepeat(loop);
  encoder.setDelay(delay);
  encoder.setQuality(10);

  for (const fp of framePaths) {
    const { data } = await sharp(fp).resize(width, height).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    encoder.addFrame(data);
  }
  encoder.finish();

  await new Promise((resolve, reject) => {
    writeStream.on('finish', resolve);
    writeStream.on('error', reject);
  });
  const stat = await fsPromises.stat(outPath);
  return { outName, outPath, size: stat.size };
}
