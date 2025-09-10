import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuid } from 'uuid';
import { tempDir, outputDir } from '../utils/filePaths.js';

export async function videoToFrames(videoPath, options = {}) {
  const frameRate = options.frameRate || 10; // frames per second
  const maxFrames = options.maxFrames || 100;
  const outputPattern = path.join(tempDir, `${uuid()}_%03d.png`);
  
  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .outputOptions([
        `-vf fps=${frameRate}`,
        `-frames:v ${maxFrames}`,
        '-y'
      ])
      .output(outputPattern)
      .on('end', async () => {
        try {
          // Find generated frames
          const files = await fs.readdir(tempDir);
          const frameFiles = files
            .filter(f => f.includes(path.basename(outputPattern).split('_')[0]))
            .map(f => path.join(tempDir, f))
            .sort();
          resolve({ frames: frameFiles, count: frameFiles.length });
        } catch (e) {
          reject(e);
        }
      })
      .on('error', reject)
      .run();
  });
}

export async function framesToVideo(framePaths, options = {}) {
  const frameRate = options.frameRate || 10;
  const quality = options.quality || 'medium'; // low, medium, high
  const id = uuid();
  const outName = `${id}.mp4`;
  const outPath = path.join(outputDir, outName);
  
  // Create temporary input list
  const listFile = path.join(tempDir, `${id}_list.txt`);
  const listContent = framePaths.map(fp => `file '${fp.replace(/\\/g, '/')}'`).join('\n');
  await fs.writeFile(listFile, listContent);
  
  return new Promise((resolve, reject) => {
    let cmd = ffmpeg()
      .input(listFile)
      .inputOptions(['-f concat', '-safe 0'])
      .outputOptions([
        `-r ${frameRate}`,
        '-c:v libx264',
        '-pix_fmt yuv420p',
        '-y'
      ]);
    
    // Quality settings
    if (quality === 'high') cmd = cmd.outputOptions(['-crf 18']);
    else if (quality === 'low') cmd = cmd.outputOptions(['-crf 28']);
    else cmd = cmd.outputOptions(['-crf 23']); // medium
    
    cmd
      .output(outPath)
      .on('end', async () => {
        try {
          await fs.unlink(listFile); // cleanup
          const stat = await fs.stat(outPath);
          resolve({ outName, outPath, size: stat.size });
        } catch (e) {
          reject(e);
        }
      })
      .on('error', reject)
      .run();
  });
}
