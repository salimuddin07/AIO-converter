import path from 'path';
import fs from 'fs/promises';
import sharp from 'sharp';
import { enhancedGifProcessor } from '../src/services/EnhancedGifProcessingService.js';
import { tempDir, ensureDirectories } from '../src/utils/FilePathUtils.js';

async function createTestImage(filePath, color) {
  const [r, g, b] = color;
  await sharp({
    create: {
      width: 120,
      height: 90,
      channels: 4,
      background: { r, g, b, alpha: 1 }
    }
  }).png().toFile(filePath);
}

async function run() {
  await ensureDirectories();

  const imagePaths = [
    path.join(tempDir, 'test_gif_frame1.png'),
    path.join(tempDir, 'test_gif_frame2.png')
  ];

  await createTestImage(imagePaths[0], [255, 0, 0]);
  await createTestImage(imagePaths[1], [0, 0, 255]);

  try {
    const result = await enhancedGifProcessor.imagesToGif(imagePaths, {
      fps: 10,
      quality: 'high',
      loop: true,
      delay: 120,
      frameDelays: [120, 200]
    });

    console.log('GIF created:', result);

    if (result.outputPath) {
      const buffer = await fs.readFile(result.outputPath);
      const base64 = buffer.toString('base64');
      console.log('Base64 length:', base64.length);
    }
  } catch (error) {
    console.error('imagesToGif failed:', error);
  } finally {
    await Promise.all(imagePaths.map(async (filePath) => {
      try {
        await fs.unlink(filePath);
      } catch (err) {
        if (err.code !== 'ENOENT') {
          console.warn('Cleanup error:', err.message);
        }
      }
    }));
  }
}

run();
