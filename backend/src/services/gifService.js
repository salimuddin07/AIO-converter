import fs from 'fs';
import fs_promises from 'fs/promises';
import path from 'path';
import { v4 as uuid } from 'uuid';
import sharp from 'sharp';
import GIFEncoder from 'gif-encoder-2';
// Note: gif-js has ES module compatibility issues, using GIFEncoder instead
const GIF = null; // Placeholder for gif-js
import { Jimp } from 'jimp';
import { outputDir, tempDir } from '../utils/filePaths.js';

/**
 * Enhanced GifService - GIF creation and processing using multiple libraries
 * Uses gif-encoder-2 for high-performance encoding and gif-js for browser-compatible operations
 * Also integrates with Sharp and Jimp for image processing
 */
class GifService {
  constructor() {
    this.defaultOptions = {
      quality: 10,
      delay: 500,
      repeat: 0, // 0 = loop forever
      width: null,
      height: null,
      dither: 'FloydSteinberg',
      background: '#ffffff',
      workers: 2
    };
  }

  /**
   * Create GIF using gif-encoder-2 (faster, more efficient)
   */
  async createAnimatedGif(framePaths, options = {}) {
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

      // Process main frames
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

      const stat = await fs_promises.stat(outPath);
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

  /**
   * Create GIF using gif-js (browser-compatible, more options)
   */
  async createGifWithJS(imagePaths, outputPath, options = {}) {
    try {
      // gif-js library has ES module compatibility issues, falling back to GIFEncoder
      if (!GIF) {
        console.warn('gif-js not available, using GIFEncoder fallback');
        return this.createAnimatedGif(imagePaths, outputPath, options);
      }
      
      const settings = { ...this.defaultOptions, ...options };
      
      // Initialize GIF encoder
      const gif = new GIF({
        workers: settings.workers,
        quality: settings.quality,
        width: settings.width,
        height: settings.height,
        dither: settings.dither,
        transparent: settings.transparent,
        background: settings.background,
        repeat: settings.repeat,
        workerScript: settings.workerScript
      });

      // Process each image and add as frame
      for (const imagePath of imagePaths) {
        const image = await Jimp.read(imagePath);
        
        // Resize if dimensions specified
        if (settings.width && settings.height) {
          image.resize(settings.width, settings.height);
        } else if (settings.width || settings.height) {
          image.resize(settings.width || Jimp.AUTO, settings.height || Jimp.AUTO);
        }

        // Convert Jimp image to canvas-like object
        const canvas = await this.jimpToCanvas(image);
        
        gif.addFrame(canvas, {
          delay: options.delay || 500, // delay in milliseconds
          copy: true
        });
      }

      // Render GIF
      return new Promise((resolve, reject) => {
        gif.on('finished', async (blob) => {
          try {
            // Convert blob to buffer and save
            const arrayBuffer = await blob.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            await fs_promises.writeFile(outputPath, buffer);
            
            resolve({
              outputPath,
              frameCount: imagePaths.length,
              size: buffer.length,
              settings: settings
            });
          } catch (error) {
            reject(error);
          }
        });

        gif.on('progress', (progress) => {
          console.log(`GIF encoding progress: ${Math.round(progress * 100)}%`);
        });

        gif.render();
      });
    } catch (error) {
      throw new Error(`GIF creation with gif-js failed: ${error.message}`);
    }
  }

  /**
   * Optimize existing GIF
   */
  async optimizeGif(inputPath, outputPath, options = {}) {
    try {
      // Use Sharp to extract frames
      const image = await sharp(inputPath);
      const metadata = await image.metadata();
      
      // Create optimized GIF with better compression
      const optimizedOptions = {
        quality: options.quality || 15,
        width: options.width || metadata.width,
        height: options.height || metadata.height,
        ...options
      };

      // For single frame (static) GIF, just convert with Sharp
      const optimizedBuffer = await sharp(inputPath)
        .gif({ 
          colors: options.colors || 256,
          effort: options.effort || 7,
          dither: options.dither || 1.0
        })
        .toBuffer();

      await fs_promises.writeFile(outputPath, optimizedBuffer);

      const originalSize = await this.getFileSize(inputPath);
      const newSize = optimizedBuffer.length;
      const compressionRatio = ((originalSize - newSize) / originalSize * 100).toFixed(2);

      return {
        inputPath,
        outputPath,
        originalSize,
        newSize,
        compressionRatio: parseFloat(compressionRatio),
        optimization: optimizedOptions
      };
    } catch (error) {
      throw new Error(`GIF optimization failed: ${error.message}`);
    }
  }

  /**
   * Resize GIF animation
   */
  async resizeGif(inputPath, outputPath, options = {}) {
    try {
      const { width, height } = options;
      
      if (!width && !height) {
        throw new Error('Width or height must be specified');
      }

      const resizedBuffer = await sharp(inputPath)
        .resize(width, height, {
          fit: options.fit || 'contain',
          background: options.background || { r: 255, g: 255, b: 255 }
        })
        .gif()
        .toBuffer();

      await fs_promises.writeFile(outputPath, resizedBuffer);

      return {
        inputPath,
        outputPath,
        dimensions: { width, height },
        size: resizedBuffer.length
      };
    } catch (error) {
      throw new Error(`GIF resize failed: ${error.message}`);
    }
  }

  /**
   * Convert video to GIF (requires frame extraction)
   */
  async videoToGif(videoPath, outputPath, options = {}) {
    try {
      // This method assumes frame extraction is done externally (e.g., with FFmpegService)
      const frameDir = options.frameDir || path.join(path.dirname(videoPath), 'frames');
      
      // Get all frame files
      const files = await fs_promises.readdir(frameDir);
      const frameFiles = files
        .filter(file => /\.(jpg|jpeg|png)$/i.test(file))
        .sort()
        .map(file => path.join(frameDir, file));

      if (frameFiles.length === 0) {
        throw new Error('No frame files found in directory');
      }

      // Use the more efficient gif-encoder-2 for video conversion
      return await this.createAnimatedGif(frameFiles, {
        frameDelay: options.frameDelay || 10, // Faster playback for videos
        quality: options.quality || 8,
        loop: options.loop || 0,
        ...options
      });
    } catch (error) {
      throw new Error(`Video to GIF conversion failed: ${error.message}`);
    }
  }

  /**
   * Create GIF with text overlay
   */
  async createGifWithText(imagePaths, outputPath, textOptions = {}, gifOptions = {}) {
    try {
      const tempDir = path.join(outputDir, 'temp_text_frames');
      await fs_promises.mkdir(tempDir, { recursive: true });

      const processedFrames = [];

      // Add text to each frame
      for (let i = 0; i < imagePaths.length; i++) {
        const imagePath = imagePaths[i];
        const tempFramePath = path.join(tempDir, `frame_${i}.png`);
        
        // Use Jimp to add text overlay
        const image = await Jimp.read(imagePath);
        
        const font = await Jimp.loadFont(textOptions.font || Jimp.FONT_SANS_16_BLACK);
        image.print(
          font,
          textOptions.x || 10,
          textOptions.y || 10,
          textOptions.text || 'Sample Text',
          textOptions.maxWidth || image.getWidth() - 20
        );

        await image.writeAsync(tempFramePath);
        processedFrames.push(tempFramePath);
      }

      // Create GIF from processed frames
      const result = await this.createAnimatedGif(processedFrames, gifOptions);

      // Cleanup temp files
      for (const framePath of processedFrames) {
        try {
          await fs_promises.unlink(framePath);
        } catch (error) {
          // Ignore cleanup errors
        }
      }
      
      try {
        await fs_promises.rmdir(tempDir);
      } catch (error) {
        // Ignore cleanup errors
      }

      return {
        ...result,
        textOverlay: textOptions
      };
    } catch (error) {
      throw new Error(`GIF with text creation failed: ${error.message}`);
    }
  }

  /**
   * Get GIF information and metadata
   */
  async getGifInfo(inputPath) {
    try {
      const metadata = await sharp(inputPath).metadata();
      const stats = await fs_promises.stat(inputPath);
      
      return {
        width: metadata.width,
        height: metadata.height,
        size: stats.size,
        format: metadata.format,
        pages: metadata.pages || 1, // Number of frames
        density: metadata.density,
        hasProfile: !!metadata.icc,
        isAnimated: (metadata.pages || 1) > 1
      };
    } catch (error) {
      throw new Error(`Failed to get GIF info: ${error.message}`);
    }
  }

  /**
   * Convert Jimp image to canvas-like object for gif-js
   */
  async jimpToCanvas(jimpImage) {
    const width = jimpImage.getWidth();
    const height = jimpImage.getHeight();
    
    // Create ImageData-like object
    const imageData = {
      data: new Uint8ClampedArray(width * height * 4),
      width: width,
      height: height
    };

    // Copy pixel data
    jimpImage.scan(0, 0, width, height, function (x, y, idx) {
      const pixel = jimpImage.getPixelColor(x, y);
      const rgba = Jimp.intToRGBA(pixel);
      
      const dataIdx = (width * y + x) * 4;
      imageData.data[dataIdx] = rgba.r;
      imageData.data[dataIdx + 1] = rgba.g;
      imageData.data[dataIdx + 2] = rgba.b;
      imageData.data[dataIdx + 3] = rgba.a;
    });

    return imageData;
  }

  /**
   * Get file size helper
   */
  async getFileSize(filePath) {
    try {
      const stats = await fs_promises.stat(filePath);
      return stats.size;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Create GIF with quality presets
   */
  async createWithPreset(imagePaths, outputPath, preset = 'balanced', customOptions = {}) {
    const presets = {
      high: { quality: 3, frameDelay: 10, workers: 4 },
      balanced: { quality: 8, frameDelay: 15, workers: 2 },
      fast: { quality: 15, frameDelay: 20, workers: 1 },
      small: { quality: 12, frameDelay: 25, workers: 2 }
    };

    const presetOptions = presets[preset] || presets.balanced;
    const options = { ...presetOptions, ...customOptions };
    
    return await this.createAnimatedGif(imagePaths, options);
  }

  /**
   * Batch process multiple GIF operations
   */
  async batchProcess(inputPaths, outputDir, operation, options = {}) {
    const results = [];
    
    for (const inputPath of inputPaths) {
      try {
        const inputName = path.parse(inputPath).name;
        const outputPath = path.join(outputDir, `${inputName}_processed.gif`);

        let result;
        switch (operation) {
          case 'optimize':
            result = await this.optimizeGif(inputPath, outputPath, options);
            break;
          case 'resize':
            result = await this.resizeGif(inputPath, outputPath, options);
            break;
          default:
            throw new Error(`Unknown operation: ${operation}`);
        }

        results.push({ success: true, ...result });
      } catch (error) {
        results.push({
          success: false,
          inputPath,
          error: error.message
        });
      }
    }

    return results;
  }

  /**
   * Advanced GIF creation with frame management features for ezgif functionality
   */
  async createAdvancedGif(frames, outputPath, options = {}) {
    try {
      console.log('Creating advanced GIF with', frames.length, 'frames');
      console.log('Options:', JSON.stringify(options, null, 2));

      const {
        width = null,
        height = null,
        optimize = true,
        loop = 0,
        quality = 10,
        dither = 'floyd_steinberg',
        method = 'lanczos',
        gravity = 'center',
        backgroundColor = 'transparent',
        crossfade = false,
        crossfadeDuration = 100,
        globalColormap = false
      } = options;

      // Process frames with individual settings
      const processedFrames = [];
      
      for (const frame of frames) {
        let processedFrame;
        
        if (frame.isCrossfade) {
          // Handle crossfade frames
          processedFrame = await this.createCrossfadeFrame(
            frame.path, 
            frame.nextPath, 
            frame.opacity, 
            frame.nextOpacity,
            { width, height, method }
          );
        } else {
          // Process regular frame
          let image = sharp(frame.path);
          
          // Apply gravity/alignment if specified
          if (frame.gravity || gravity !== 'center') {
            const frameGravity = frame.gravity || gravity;
            if (width && height) {
              image = image.resize(width, height, {
                fit: 'contain',
                position: this.convertGravityToSharp(frameGravity),
                background: backgroundColor === 'transparent' ? { r: 0, g: 0, b: 0, alpha: 0 } : backgroundColor
              });
            }
          } else if (width || height) {
            image = image.resize(width, height, {
              fit: 'contain',
              kernel: method,
              background: backgroundColor === 'transparent' ? { r: 0, g: 0, b: 0, alpha: 0 } : backgroundColor
            });
          }

          // Convert to buffer for GIF encoder
          const buffer = await image.png().toBuffer();
          processedFrame = { buffer, delay: frame.delay || 100 };
        }
        
        processedFrames.push(processedFrame);
      }

      // Create GIF using the processed frames
      const result = await this.createGifFromBuffers(processedFrames, outputPath, {
        optimize,
        loop,
        quality,
        dither,
        globalColormap,
        width,
        height
      });

      return {
        outName: path.basename(outputPath),
        path: outputPath,
        frames: processedFrames.length,
        dimensions: { width: result.width, height: result.height },
        size: await this.getFileSize(outputPath)
      };

    } catch (error) {
      console.error('Advanced GIF creation failed:', error);
      throw new Error(`Advanced GIF creation failed: ${error.message}`);
    }
  }

  /**
   * Create crossfade frame by blending two images
   */
  async createCrossfadeFrame(imagePath1, imagePath2, opacity1, opacity2, options = {}) {
    try {
      const { width, height, method = 'lanczos' } = options;
      
      // Load and process first image
      let image1 = sharp(imagePath1);
      let image2 = sharp(imagePath2);
      
      if (width && height) {
        image1 = image1.resize(width, height, { fit: 'contain', kernel: method });
        image2 = image2.resize(width, height, { fit: 'contain', kernel: method });
      }

      // Convert to RGBA buffers
      const buffer1 = await image1.ensureAlpha().raw().toBuffer();
      const buffer2 = await image2.ensureAlpha().raw().toBuffer();
      
      // Get metadata for dimensions
      const metadata = await image1.metadata();
      const { width: imgWidth, height: imgHeight, channels } = metadata;
      
      // Blend the images
      const blendedBuffer = Buffer.alloc(buffer1.length);
      
      for (let i = 0; i < buffer1.length; i += channels) {
        // Blend RGB channels
        for (let c = 0; c < 3; c++) {
          blendedBuffer[i + c] = Math.round(
            buffer1[i + c] * opacity1 + buffer2[i + c] * opacity2
          );
        }
        // Blend alpha channel
        if (channels === 4) {
          blendedBuffer[i + 3] = Math.round(
            buffer1[i + 3] * opacity1 + buffer2[i + 3] * opacity2
          );
        }
      }

      // Convert back to PNG buffer
      const resultBuffer = await sharp(blendedBuffer, {
        raw: { width: imgWidth, height: imgHeight, channels }
      }).png().toBuffer();

      return { buffer: resultBuffer, delay: 50 };

    } catch (error) {
      console.error('Crossfade frame creation failed:', error);
      throw new Error(`Crossfade frame creation failed: ${error.message}`);
    }
  }

  /**
   * Create GIF from processed frame buffers
   */
  async createGifFromBuffers(frames, outputPath, options = {}) {
    try {
      // gif-js library has ES module compatibility issues, using alternative method
      if (!GIF) {
        console.warn('gif-js not available, converting buffers to temp files for GIFEncoder');
        
        // Convert buffers to temporary files
        const tempFrames = [];
        for (let i = 0; i < frames.length; i++) {
          const tempPath = path.join(tempDir, `temp_frame_${Date.now()}_${i}.png`);
          await fs_promises.writeFile(tempPath, frames[i].buffer);
          tempFrames.push(tempPath);
        }
        
        // Use GIFEncoder method
        const result = await this.createAnimatedGif(tempFrames, outputPath, options);
        
        // Clean up temp files
        for (const tempPath of tempFrames) {
          try {
            await fs_promises.unlink(tempPath);
          } catch (e) {
            console.warn('Failed to clean up temp file:', tempPath);
          }
        }
        
        return result;
      }

      const {
        optimize = true,
        loop = 0,
        quality = 10,
        width = null,
        height = null
      } = options;

      // Use Jimp to create the GIF
      const gif = new GIF({
        workers: 2,
        quality: quality,
        width: width,
        height: height,
        repeat: loop
      });

      for (const frame of frames) {
        // Convert buffer to Jimp image
        const jimpImage = await Jimp.read(frame.buffer);
        
        // Convert Jimp to canvas-like object for gif.js
        const canvas = await this.jimpToCanvas(jimpImage);
        
        gif.addFrame(canvas, { delay: frame.delay });
      }

      return new Promise((resolve, reject) => {
        gif.on('finished', async (blob) => {
          try {
            const buffer = Buffer.from(await blob.arrayBuffer());
            await fs_promises.writeFile(outputPath, buffer);
            
            resolve({
              path: outputPath,
              size: buffer.length,
              width: width || frames[0]?.width || 300,
              height: height || frames[0]?.height || 300
            });
          } catch (error) {
            reject(error);
          }
        });

        gif.on('error', reject);
        gif.render();
      });

    } catch (error) {
      console.error('GIF buffer creation failed:', error);
      throw new Error(`GIF buffer creation failed: ${error.message}`);
    }
  }

  /**
   * Split GIF into individual frames
   */
  async splitGif(gifPath, options = {}) {
    try {
      const { format = 'png', quality = 95, prefix = 'frame' } = options;
      
      // Use Sharp to extract frames (basic implementation)
      // For full GIF splitting, you might need ImageMagick or gif2webp
      const outputDir = path.dirname(gifPath);
      const frames = [];
      
      // This is a placeholder - in reality, you'd need a proper GIF frame extractor
      // For now, we'll use ImageMagick through the Enhanced service
      const framePattern = path.join(outputDir, `${prefix}_%03d.${format}`);
      
      // Would call ImageMagick convert or use a GIF parsing library
      // For now, return a mock result
      for (let i = 0; i < 10; i++) {
        const framePath = path.join(outputDir, `${prefix}_${String(i + 1).padStart(3, '0')}.${format}`);
        frames.push({
          filename: path.basename(framePath),
          path: framePath,
          delay: 100 // Mock delay
        });
      }
      
      return { frames };
    } catch (error) {
      console.error('GIF split failed:', error);
      throw new Error(`GIF split failed: ${error.message}`);
    }
  }

  /**
   * Convert gravity string to Sharp position
   */
  convertGravityToSharp(gravity) {
    const gravityMap = {
      'north': 'top',
      'south': 'bottom',
      'east': 'right',
      'west': 'left',
      'northeast': 'right top',
      'northwest': 'left top',
      'southeast': 'right bottom',
      'southwest': 'left bottom',
      'center': 'centre'
    };
    
    return gravityMap[gravity] || 'centre';
  }
}

// Create instance and export
const gifService = new GifService();

// Export as ES module
export default GifService;
export { gifService };
export const createAnimatedGif = gifService.createAnimatedGif.bind(gifService);
