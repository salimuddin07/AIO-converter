import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import ffprobeStatic from 'ffprobe-static';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuid } from 'uuid';
import { tempDir, outputDir } from '../lib/file-paths.js';

// Configure FFmpeg with static binaries
ffmpeg.setFfmpegPath(ffmpegStatic);
ffmpeg.setFfprobePath(ffprobeStatic.path);

/**
 * Enhanced FFmpeg Service for AIO Convert
 * Provides comprehensive media processing capabilities
 */
export class FFmpegService {
  /**
   * Get media information using FFprobe
   */
  static async getMediaInfo(inputPath) {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(inputPath, (err, metadata) => {
        if (err) {
          reject(new Error(`FFprobe failed: ${err.message}`));
          return;
        }
        resolve(metadata);
      });
    });
  }

  /**
   * Convert video to GIF with advanced options
   */
  static async videoToGif(inputPath, options = {}) {
    const outputFilename = `${uuid()}.gif`;
    const outputPath = path.join(outputDir, outputFilename);

    const {
      width = 480,
      height = -1, // Maintain aspect ratio
      fps = 15,
      startTime = 0,
      duration = null,
      quality = 'medium', // low, medium, high
      loop = 0, // 0 = infinite loop
      colors = 256
    } = options;

    return new Promise((resolve, reject) => {
      let command = ffmpeg(inputPath)
        .output(outputPath)
        .format('gif')
        .fps(fps)
        .size(`${width}x${height}`)
        .loop(loop);

      // Add start time if specified
      if (startTime > 0) {
        command = command.seekInput(startTime);
      }

      // Add duration if specified
      if (duration) {
        command = command.duration(duration);
      }

      // Quality settings
      const qualitySettings = {
        low: ['-vf', 'palettegen=reserve_transparent=1', '-vf', 'paletteuse=dither=bayer'],
        medium: ['-vf', `fps=${fps},scale=${width}:${height}:flags=lanczos,palettegen`, '-vf', `fps=${fps},scale=${width}:${height}:flags=lanczos,paletteuse`],
        high: ['-vf', `fps=${fps},scale=${width}:${height}:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=${colors}:reserve_transparent=1[p];[s1][p]paletteuse=dither=bayer:bayer_scale=5:diff_mode=rectangle`]
      };

      if (quality === 'high') {
        // High quality two-pass conversion
        const paletteFile = path.join(tempDir, `${uuid()}-palette.png`);
        
        // First pass: generate palette
        ffmpeg(inputPath)
          .output(paletteFile)
          .videoFilters(`fps=${fps},scale=${width}:${height}:flags=lanczos,palettegen=max_colors=${colors}:reserve_transparent=1`)
          .on('end', () => {
            // Second pass: use palette
            ffmpeg(inputPath)
              .input(paletteFile)
              .output(outputPath)
              .videoFilters(`fps=${fps},scale=${width}:${height}:flags=lanczos[x];[x][1:v]paletteuse=dither=bayer:bayer_scale=5:diff_mode=rectangle`)
              .format('gif')
              .loop(loop)
              .on('end', async () => {
                try {
                  await fs.unlink(paletteFile); // Clean up palette file
                  const stats = await fs.stat(outputPath);
                  resolve({
                    filename: outputFilename,
                    path: outputPath,
                    size: stats.size,
                    originalName: path.basename(inputPath),
                    convertedName: outputFilename,
                    type: 'image'
                  });
                } catch (cleanupErr) {
                  console.warn('Cleanup warning:', cleanupErr);
                  resolve({
                    filename: outputFilename,
                    path: outputPath,
                    originalName: path.basename(inputPath),
                    convertedName: outputFilename,
                    type: 'image'
                  });
                }
              })
              .on('error', reject)
              .run();
          })
          .on('error', reject)
          .run();
      } else {
        // Standard quality conversion
        command
          .on('end', async () => {
            try {
              const stats = await fs.stat(outputPath);
              resolve({
                filename: outputFilename,
                path: outputPath,
                size: stats.size,
                originalName: path.basename(inputPath),
                convertedName: outputFilename,
                type: 'image'
              });
            } catch (statErr) {
              reject(new Error(`Failed to get output file stats: ${statErr.message}`));
            }
          })
          .on('error', reject)
          .on('progress', (progress) => {
            console.log(`Processing: ${progress.percent}% done`);
          })
          .run();
      }
    });
  }

  /**
   * Convert GIF to video (MP4/WebM)
   */
  static async gifToVideo(inputPath, options = {}) {
    const {
      format = 'mp4',
      quality = 'medium',
      fps = 30,
      scale = null
    } = options;

    const outputFilename = `${uuid()}.${format}`;
    const outputPath = path.join(outputDir, outputFilename);

    return new Promise((resolve, reject) => {
      let command = ffmpeg(inputPath)
        .output(outputPath)
        .format(format)
        .fps(fps);

      // Video codec settings
      if (format === 'mp4') {
        command = command.videoCodec('libx264').audioCodec('aac');
        
        // Quality presets for H.264
        const qualitySettings = {
          low: ['-crf', '28', '-preset', 'fast'],
          medium: ['-crf', '23', '-preset', 'medium'],
          high: ['-crf', '18', '-preset', 'slow']
        };
        
        command = command.outputOptions(qualitySettings[quality]);
      } else if (format === 'webm') {
        command = command.videoCodec('libvpx-vp9');
        
        const qualitySettings = {
          low: ['-b:v', '500k'],
          medium: ['-b:v', '1M'],
          high: ['-b:v', '2M']
        };
        
        command = command.outputOptions(qualitySettings[quality]);
      }

      // Apply scaling if specified
      if (scale) {
        command = command.size(scale);
      }

      command
        .on('end', async () => {
          try {
            const stats = await fs.stat(outputPath);
            resolve({
              filename: outputFilename,
              path: outputPath,
              size: stats.size,
              originalName: path.basename(inputPath),
              convertedName: outputFilename,
              type: 'video'
            });
          } catch (statErr) {
            reject(new Error(`Failed to get output file stats: ${statErr.message}`));
          }
        })
        .on('error', reject)
        .on('progress', (progress) => {
          console.log(`Processing: ${progress.percent}% done`);
        })
        .run();
    });
  }

  /**
   * Resize media (images, videos, GIFs)
   */
  static async resizeMedia(inputPath, options = {}) {
    const { width, height, maintainAspectRatio = true, format = null } = options;
    
    const inputExt = path.extname(inputPath).toLowerCase();
    const outputExt = format || inputExt;
    const outputFilename = `${uuid()}${outputExt}`;
    const outputPath = path.join(outputDir, outputFilename);

    let scaleFilter;
    if (maintainAspectRatio) {
      scaleFilter = width && height 
        ? `scale=${width}:${height}:force_original_aspect_ratio=decrease`
        : width 
          ? `scale=${width}:-1`
          : `scale=-1:${height}`;
    } else {
      scaleFilter = `scale=${width || -1}:${height || -1}`;
    }

    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .output(outputPath)
        .videoFilters(scaleFilter)
        .on('end', async () => {
          try {
            const stats = await fs.stat(outputPath);
            resolve({
              filename: outputFilename,
              path: outputPath,
              size: stats.size,
              originalName: path.basename(inputPath),
              convertedName: outputFilename,
              type: inputExt.includes('gif') ? 'image' : 'video'
            });
          } catch (statErr) {
            reject(new Error(`Failed to get output file stats: ${statErr.message}`));
          }
        })
        .on('error', reject)
        .run();
    });
  }

  /**
   * Crop media
   */
  static async cropMedia(inputPath, options = {}) {
    const { width, height, x = 0, y = 0, format = null } = options;
    
    const inputExt = path.extname(inputPath).toLowerCase();
    const outputExt = format || inputExt;
    const outputFilename = `${uuid()}${outputExt}`;
    const outputPath = path.join(outputDir, outputFilename);

    const cropFilter = `crop=${width}:${height}:${x}:${y}`;

    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .output(outputPath)
        .videoFilters(cropFilter)
        .on('end', async () => {
          try {
            const stats = await fs.stat(outputPath);
            resolve({
              filename: outputFilename,
              path: outputPath,
              size: stats.size,
              originalName: path.basename(inputPath),
              convertedName: outputFilename,
              type: inputExt.includes('gif') ? 'image' : 'video'
            });
          } catch (statErr) {
            reject(new Error(`Failed to get output file stats: ${statErr.message}`));
          }
        })
        .on('error', reject)
        .run();
    });
  }

  /**
   * Add text overlay to media
   */
  static async addTextOverlay(inputPath, options = {}) {
    const {
      text,
      fontSize = 24,
      fontColor = 'white',
      backgroundColor = 'black@0.5',
      position = { x: 10, y: 10 },
      duration = null,
      format = null
    } = options;

    const inputExt = path.extname(inputPath).toLowerCase();
    const outputExt = format || inputExt;
    const outputFilename = `${uuid()}${outputExt}`;
    const outputPath = path.join(outputDir, outputFilename);

    const textFilter = `drawtext=text='${text}':fontsize=${fontSize}:fontcolor=${fontColor}:box=1:boxcolor=${backgroundColor}:x=${position.x}:y=${position.y}`;

    return new Promise((resolve, reject) => {
      let command = ffmpeg(inputPath)
        .output(outputPath)
        .videoFilters(textFilter);

      if (duration) {
        command = command.duration(duration);
      }

      command
        .on('end', async () => {
          try {
            const stats = await fs.stat(outputPath);
            resolve({
              filename: outputFilename,
              path: outputPath,
              size: stats.size,
              originalName: path.basename(inputPath),
              convertedName: outputFilename,
              type: inputExt.includes('gif') ? 'image' : 'video'
            });
          } catch (statErr) {
            reject(new Error(`Failed to get output file stats: ${statErr.message}`));
          }
        })
        .on('error', reject)
        .run();
    });
  }

  /**
   * Convert between different formats
   */
  static async convertFormat(inputPath, targetFormat, options = {}) {
    const outputFilename = `${uuid()}.${targetFormat}`;
    const outputPath = path.join(outputDir, outputFilename);

    const { quality = 'medium', ...otherOptions } = options;

    return new Promise((resolve, reject) => {
      let command = ffmpeg(inputPath).output(outputPath);

      // Format-specific settings
      switch (targetFormat.toLowerCase()) {
        case 'webp':
          command = command
            .format('webp')
            .outputOptions([
              '-vcodec', 'libwebp',
              '-quality', quality === 'high' ? '90' : quality === 'low' ? '50' : '70',
              '-preset', 'default',
              '-loop', '0'
            ]);
          break;

        case 'avif':
          command = command
            .format('avif')
            .outputOptions([
              '-vcodec', 'libaom-av1',
              '-crf', quality === 'high' ? '15' : quality === 'low' ? '35' : '25'
            ]);
          break;

        case 'apng':
          command = command
            .format('apng')
            .outputOptions([
              '-plays', '0' // Infinite loop
            ]);
          break;

        case 'mp4':
          command = command
            .format('mp4')
            .videoCodec('libx264')
            .outputOptions([
              '-crf', quality === 'high' ? '18' : quality === 'low' ? '28' : '23',
              '-preset', 'medium'
            ]);
          break;

        case 'webm':
          command = command
            .format('webm')
            .videoCodec('libvpx-vp9')
            .outputOptions([
              '-b:v', quality === 'high' ? '2M' : quality === 'low' ? '500k' : '1M'
            ]);
          break;

        default:
          command = command.format(targetFormat);
      }

      command
        .on('end', async () => {
          try {
            const stats = await fs.stat(outputPath);
            resolve({
              filename: outputFilename,
              path: outputPath,
              size: stats.size,
              originalName: path.basename(inputPath),
              convertedName: outputFilename,
              type: ['mp4', 'webm', 'avi', 'mov'].includes(targetFormat) ? 'video' : 'image'
            });
          } catch (statErr) {
            reject(new Error(`Failed to get output file stats: ${statErr.message}`));
          }
        })
        .on('error', reject)
        .on('progress', (progress) => {
          console.log(`Converting: ${progress.percent}% done`);
        })
        .run();
    });
  }

  /**
   * Extract frames from video/GIF
   */
  static async extractFrames(inputPath, options = {}) {
    const { 
      startTime = 0, 
      frameCount = 10, 
      format = 'png',
      quality = 'high'
    } = options;

    const outputDir = path.join(tempDir, `frames-${uuid()}`);
    await fs.mkdir(outputDir, { recursive: true });

    const outputPattern = path.join(outputDir, `frame_%03d.${format}`);

    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .seekInput(startTime)
        .outputOptions([
          '-vf', `select=not(mod(n\\,${Math.max(1, Math.floor(30/frameCount))}))`,
          '-vsync', 'vfr',
          '-frames:v', frameCount.toString()
        ])
        .output(outputPattern)
        .on('end', async () => {
          try {
            const files = await fs.readdir(outputDir);
            const frameFiles = files
              .filter(file => file.startsWith('frame_'))
              .map(file => ({
                filename: file,
                path: path.join(outputDir, file),
                originalName: path.basename(inputPath),
                convertedName: file,
                type: 'image'
              }));

            resolve({
              frames: frameFiles,
              frameCount: frameFiles.length,
              outputDirectory: outputDir
            });
          } catch (readErr) {
            reject(new Error(`Failed to read extracted frames: ${readErr.message}`));
          }
        })
        .on('error', reject)
        .run();
    });
  }
}

export default FFmpegService;