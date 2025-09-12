import fs from 'fs/promises';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import { v4 as uuidv4 } from 'uuid';
import { tempDir, outputDir } from '../utils/filePaths.js';

class VideoService {
  constructor() {
    this.tempDir = tempDir;
    this.outputDir = outputDir;
    this.ensureDirectories();
  }

  async ensureDirectories() {
    try {
      await fs.mkdir(this.tempDir, { recursive: true });
      await fs.mkdir(this.outputDir, { recursive: true });
    } catch (error) {
      console.error('Error creating directories:', error);
    }
  }

  async processVideo(filePath, filename) {
    const videoId = uuidv4();
    const videoPath = path.join(this.tempDir, `${videoId}_${filename}`);
    
    try {
      // Copy uploaded file to temp directory
      await fs.copyFile(filePath, videoPath);
      
      // Get video information
      const videoInfo = await this.getVideoInfo(videoPath);
      
      return {
        videoId,
        videoPath,
        originalFilename: filename,
        ...videoInfo
      };
    } catch (error) {
      console.error('Error processing video:', error);
      throw error;
    }
  }

  async processVideoFromUrl(url) {
    const videoId = uuidv4();
    const filename = `${videoId}_${path.basename(url)}`;
    const videoPath = path.join(this.tempDir, filename);
    
    try {
      // Download video from URL
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to download video: ${response.statusText}`);
      }
      
      const buffer = await response.arrayBuffer();
      await fs.writeFile(videoPath, Buffer.from(buffer));
      
      // Get video information
      const videoInfo = await this.getVideoInfo(videoPath);
      
      return {
        videoId,
        videoPath,
        originalFilename: path.basename(url),
        ...videoInfo
      };
    } catch (error) {
      console.error('Error processing video from URL:', error);
      throw error;
    }
  }

  async getVideoInfo(videoPath) {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(videoPath, (err, metadata) => {
        if (err) {
          reject(err);
          return;
        }
        
        const videoStream = metadata.streams.find(stream => stream.codec_type === 'video');
        if (!videoStream) {
          reject(new Error('No video stream found'));
          return;
        }
        
        resolve({
          duration: metadata.format.duration,
          width: videoStream.width,
          height: videoStream.height,
          fps: this.parseFrameRate(videoStream.r_frame_rate),
          codec: videoStream.codec_name,
          fileSize: metadata.format.size
        });
      });
    });
  }

  parseFrameRate(frameRate) {
    if (typeof frameRate === 'string' && frameRate.includes('/')) {
      const [num, den] = frameRate.split('/').map(Number);
      return Math.round(num / den);
    }
    return Number(frameRate) || 25;
  }

  async convertToGif(videoId, options = {}) {
    const {
      startTime = 0,
      endTime = 5,
      width,
      height,
      fps = 10,
      quality = 90,
      method = 'ffmpeg'
    } = options;

    const outputFilename = `${videoId}_${Date.now()}.gif`;
    const outputPath = path.join(this.outputDir, outputFilename);
    
    try {
      // Find the actual video file
      const files = await fs.readdir(this.tempDir);
      const videoFile = files.find(file => file.startsWith(videoId + '_'));
      
      if (!videoFile) {
        throw new Error('Video file not found');
      }
      
      const actualVideoPath = path.join(this.tempDir, videoFile);
      
      await this.convertWithFFmpeg(actualVideoPath, outputPath, options);
      
      // Get final GIF info
      const stats = await fs.stat(outputPath);
      
      return {
        gifPath: outputFilename,
        fileSize: this.formatFileSize(stats.size),
        width: width || null,
        height: height || null,
        duration: endTime - startTime,
        fps,
        frames: Math.ceil((endTime - startTime) * fps)
      };
    } catch (error) {
      console.error('Error converting to GIF:', error);
      throw error;
    }
  }

  async convertWithFFmpeg(videoPath, outputPath, options) {
    const {
      startTime = 0,
      endTime = 5,
      width,
      height,
      fps = 10
    } = options;

    return new Promise((resolve, reject) => {
      let scaleFilter = '';
      
      // Build scale filter
      if (width && height) {
        scaleFilter = `scale=${width}:${height}:flags=lanczos`;
      } else if (width) {
        scaleFilter = `scale=${width}:-1:flags=lanczos`;
      } else if (height) {
        scaleFilter = `scale=-1:${height}:flags=lanczos`;
      } else {
        scaleFilter = 'scale=-1:-1:flags=lanczos';
      }

      const filterComplex = [
        `[0:v] fps=${fps},${scaleFilter},palettegen=max_colors=256 [palette]`,
        `[0:v] fps=${fps},${scaleFilter} [scaled]`,
        `[scaled][palette] paletteuse=dither=bayer:bayer_scale=3`
      ];

      ffmpeg(videoPath)
        .seekInput(startTime)
        .duration(endTime - startTime)
        .complexFilter(filterComplex)
        .output(outputPath)
        .on('end', resolve)
        .on('error', reject)
        .run();
    });
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  async cleanup(videoId) {
    try {
      const files = await fs.readdir(this.tempDir);
      const videoFiles = files.filter(file => file.startsWith(videoId + '_'));
      
      for (const file of videoFiles) {
        await fs.unlink(path.join(this.tempDir, file));
      }
      
      // Also cleanup old output files (optional)
      const outputFiles = await fs.readdir(this.outputDir);
      const oldGifFiles = outputFiles.filter(file => 
        file.startsWith(videoId + '_') && file.endsWith('.gif')
      );
      
      for (const file of oldGifFiles) {
        await fs.unlink(path.join(this.outputDir, file));
      }
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }

  async getVideoPreviewPath(videoId) {
    try {
      const files = await fs.readdir(this.tempDir);
      const videoFile = files.find(file => file.startsWith(videoId + '_'));
      
      if (!videoFile) {
        throw new Error('Video file not found');
      }
      
      return path.join(this.tempDir, videoFile);
    } catch (error) {
      console.error('Error getting video preview path:', error);
      throw error;
    }
  }

  async getGifPath(filename) {
    return path.join(this.outputDir, filename);
  }
}

export default new VideoService();
