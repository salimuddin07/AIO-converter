import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import archiver from 'archiver';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class SplitService {
  static async splitAnimatedImage(inputPath, outputDir) {
    try {
      await fs.mkdir(outputDir, { recursive: true });
      
      const inputBuffer = await fs.readFile(inputPath);
      const metadata = await sharp(inputBuffer).metadata();
      
      if (!metadata.pages || metadata.pages <= 1) {
        throw new Error('This image does not contain multiple frames or is not animated');
      }
      
      const frames = [];
      const frameDelay = metadata.delay || [];
      
      // Extract each frame
      for (let i = 0; i < metadata.pages; i++) {
        const frameBuffer = await sharp(inputBuffer, { page: i })
          .png()
          .toBuffer();
          
        const filename = `frame_${String(i + 1).padStart(3, '0')}.png`;
        const framePath = path.join(outputDir, filename);
        
        await fs.writeFile(framePath, frameBuffer);
        
        // Get frame dimensions
        const frameMetadata = await sharp(frameBuffer).metadata();
        
        frames.push({
          filename,
          path: framePath,
          width: frameMetadata.width,
          height: frameMetadata.height,
          delay: frameDelay[i] || 100, // Default 100ms if no delay info
          index: i
        });
      }
      
      return {
        totalFrames: frames.length,
        frames,
        originalWidth: metadata.width,
        originalHeight: metadata.height,
        format: metadata.format
      };
      
    } catch (error) {
      console.error('Split error:', error);
      throw new Error(`Failed to split animated image: ${error.message}`);
    }
  }
  
  static async createZipArchive(frames, zipPath) {
    return new Promise((resolve, reject) => {
      const output = fs.createWriteStream(zipPath);
      const archive = archiver('zip', { zlib: { level: 9 } });
      
      output.on('close', () => {
        resolve(zipPath);
      });
      
      archive.on('error', (err) => {
        reject(err);
      });
      
      archive.pipe(output);
      
      // Add each frame to the zip
      frames.forEach(frame => {
        archive.file(frame.path, { name: frame.filename });
      });
      
      archive.finalize();
    });
  }
  
  static async extractGifInfo(inputPath) {
    try {
      const inputBuffer = await fs.readFile(inputPath);
      
      // For GIF files, we can extract more detailed information
      if (inputPath.toLowerCase().endsWith('.gif')) {
        return await this.extractDetailedGifInfo(inputBuffer);
      }
      
      // For other formats, use Sharp
      const metadata = await sharp(inputBuffer).metadata();
      return {
        width: metadata.width,
        height: metadata.height,
        pages: metadata.pages || 1,
        format: metadata.format,
        delay: metadata.delay || []
      };
      
    } catch (error) {
      console.error('Error extracting GIF info:', error);
      throw new Error(`Failed to extract image information: ${error.message}`);
    }
  }
  
  static async extractDetailedGifInfo(buffer) {
    // This is a simplified GIF parser - in production you'd want a more robust solution
    // For now, we'll use Sharp which handles most cases
    const metadata = await sharp(buffer).metadata();
    return {
      width: metadata.width,
      height: metadata.height,
      pages: metadata.pages || 1,
      format: 'gif',
      delay: metadata.delay || [],
      hasAnimation: (metadata.pages || 1) > 1
    };
  }
  
  static async cleanup(directory) {
    try {
      await fs.rm(directory, { recursive: true, force: true });
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }
}
