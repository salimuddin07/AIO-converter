/**
 * DESKTOP-ONLY API CLIENT - Pure Electron IPC (NO HTTP/WEB SUPPORT)
 * This app is DESKTOP ONLY - all functionality requires Electron
 */

// Check if we're running in Electron
const isElectron = () => {
  try {
    return typeof window !== 'undefined' && 
           window.electronAPI !== undefined && 
           typeof window.electronAPI === 'object';
  } catch (error) {
    console.warn('Error checking Electron environment:', error);
    return false;
  }
};

// Desktop-only error thrower
const ensureDesktop = (functionName) => {
  if (!isElectron()) {
    throw new Error(`❌ ${functionName} requires the desktop app. This is NOT a web application.`);
  }
};

/**
 * Safe Electron API caller with error handling
 */
const safeElectronCall = async (method, ...args) => {
  ensureDesktop(method);
  
  try {
    if (!window.electronAPI || typeof window.electronAPI[method] !== 'function') {
      throw new Error(`Electron API method ${method} not available`);
    }
    return await window.electronAPI[method](...args);
  } catch (error) {
    console.error(`❌ Electron API call failed for ${method}:`, error);
    throw error;
  }
};

/**
 * Helper function to handle File/Blob objects for Electron IPC
 * Converts File/Blob to temporary file path that can be serialized
 */
const prepareFileForElectron = async (file, prefix = 'temp') => {
  if (file instanceof File || file instanceof Blob) {
    // Convert File/Blob to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    
    // Create temp filename with proper extension
    const ext = file.name ? file.name.split('.').pop() : (file.type ? file.type.split('/')[1] : 'bin');
    const tempFileName = `${prefix}_${Date.now()}.${ext}`;
    
    // Save file via Electron
    const tempResult = await safeElectronCall('writeFile', {
      filePath: tempFileName,
      data: arrayBuffer
    });
    
    if (tempResult.success && tempResult.filePath) {
      console.log(`✅ Temp file saved:`, tempResult.filePath);
      return tempResult.filePath;
    } else {
      throw new Error(`Failed to save temp file: ${file.name || 'unknown'}`);
    }
  } else {
    // Assume it's already a path
    return file;
  }
};

/**
 * DESKTOP-ONLY API - No web fallbacks
 */
export const api = {
  
  // Environment detection
  get isElectron() {
    return isElectron();
  },
  
  /**
   * Create GIF from images - DESKTOP ONLY
   */
  async createGifFromImages(files, options = {}) {
    ensureDesktop('createGifFromImages');
    console.log('🎬 Creating GIF from', files.length, 'images');
    
    try {
      // Convert File objects to temporary files for Electron
      const imagePaths = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file instanceof File) {
          console.log(`💾 Saving temp file ${i + 1}/${files.length}:`, file.name);
          
          // Convert to ArrayBuffer
          const arrayBuffer = await file.arrayBuffer();
          
          // Create temp filename with proper extension
          const ext = file.name.split('.').pop() || 'jpg';
          const tempFileName = `temp_gif_${Date.now()}_${i}.${ext}`;
          
          // Save file via Electron
          const tempResult = await safeElectronCall('writeFile', {
            filePath: tempFileName,
            data: arrayBuffer
          });
          
          if (tempResult.success && tempResult.filePath) {
            imagePaths.push(tempResult.filePath);
            console.log(`✅ Temp file saved:`, tempResult.filePath);
          } else {
            throw new Error(`Failed to save temp file: ${file.name}`);
          }
        } else {
          // Assume it's already a path
          imagePaths.push(file);
        }
      }
      
      if (imagePaths.length === 0) {
        throw new Error('No valid image files provided');
      }
      
      console.log('📂 Temp files created:', imagePaths);
      
      // Create output filename
      const outputFileName = `gif_output_${Date.now()}.gif`;
      
      // Create GIF via Electron
      const result = await safeElectronCall('createGifFromImages', {
        inputPaths: imagePaths,
        outputPath: outputFileName,
        options: {
          width: options.width ? parseInt(options.width) : undefined,
          height: options.height ? parseInt(options.height) : undefined,
          quality: parseInt(options.quality) || 80,
          fps: parseInt(options.fps) || 10,
          loop: options.loop !== false,
          delay: options.delay ? parseInt(options.delay) : undefined,
          frameDelay: options.frameDelay ? parseInt(options.frameDelay) : undefined,
          frameDelays: options.frameDelays ? JSON.parse(options.frameDelays) : null,
          fit: options.fit || 'inside'
        }
      });
      
      console.log('✅ GIF created successfully via Electron:', result);
      return result;
      
    } catch (error) {
      console.error('❌ Electron GIF creation failed:', error);
      throw new Error(`GIF creation failed: ${error.message}`);
    }
  },

  /**
   * Create GIF from video - DESKTOP ONLY
   */
  async createGifFromVideo(file, options = {}) {
    ensureDesktop('createGifFromVideo');
    console.log('🎬 Creating GIF from video:', file.name || 'unknown');
    
    try {
      // Save video file temporarily if it's a File object
      let videoPath;
      
      if (file instanceof File) {
        const arrayBuffer = await file.arrayBuffer();
        const ext = file.name.split('.').pop() || 'mp4';
        const tempFileName = `temp_video_${Date.now()}.${ext}`;
        
        const tempResult = await safeElectronCall('writeFile', {
          filePath: tempFileName,
          data: arrayBuffer
        });
        
        if (tempResult.success && tempResult.filePath) {
          videoPath = tempResult.filePath;
        } else {
          throw new Error(`Failed to save temp video file: ${file.name}`);
        }
      } else {
        videoPath = file;
      }
      
      const result = await safeElectronCall('createGifFromVideo', {
        inputPath: videoPath,
        outputPath: `gif_from_video_${Date.now()}.gif`,
        options
      });
      
      console.log('✅ GIF from video created successfully:', result);
      return result;
      
    } catch (error) {
      console.error('❌ Video to GIF conversion failed:', error);
      throw new Error(`Video to GIF conversion failed: ${error.message}`);
    }
  },

  /**
   * Convert image - DESKTOP ONLY
   */
  async convertImage(file, options = {}) {
    ensureDesktop('convertImage');
    console.log('🖼️ Converting image:', file.name || 'unknown');
    
    try {
      // Save image file temporarily if it's a File object
      let imagePath;
      
      if (file instanceof File) {
        const arrayBuffer = await file.arrayBuffer();
        const ext = file.name.split('.').pop() || 'jpg';
        const tempFileName = `temp_image_${Date.now()}.${ext}`;
        
        const tempResult = await safeElectronCall('writeFile', {
          filePath: tempFileName,
          data: arrayBuffer
        });
        
        if (tempResult.success && tempResult.filePath) {
          imagePath = tempResult.filePath;
        } else {
          throw new Error(`Failed to save temp image file: ${file.name}`);
        }
      } else {
        imagePath = file;
      }
      
      const result = await safeElectronCall('convertImage', {
        inputPath: imagePath,
        outputPath: `converted_image_${Date.now()}.${options.format || 'jpg'}`,
        options
      });
      
      console.log('✅ Image converted successfully:', result);
      return result;
      
    } catch (error) {
      console.error('❌ Image conversion failed:', error);
      throw new Error(`Image conversion failed: ${error.message}`);
    }
  },

  /**
   * Convert video - DESKTOP ONLY
   */
  async convertVideo(file, options = {}) {
    ensureDesktop('convertVideo');
    console.log('🎥 Converting video:', file.name || 'unknown');
    
    try {
      // Save video file temporarily if it's a File object
      let videoPath;
      
      if (file instanceof File) {
        const arrayBuffer = await file.arrayBuffer();
        const ext = file.name.split('.').pop() || 'mp4';
        const tempFileName = `temp_video_${Date.now()}.${ext}`;
        
        const tempResult = await safeElectronCall('writeFile', {
          filePath: tempFileName,
          data: arrayBuffer
        });
        
        if (tempResult.success && tempResult.filePath) {
          videoPath = tempResult.filePath;
        } else {
          throw new Error(`Failed to save temp video file: ${file.name}`);
        }
      } else {
        videoPath = file;
      }
      
      const result = await safeElectronCall('convertVideo', {
        inputPath: videoPath,
        outputPath: `converted_video_${Date.now()}.${options.format || 'mp4'}`,
        options
      });
      
      console.log('✅ Video converted successfully:', result);
      return result;
      
    } catch (error) {
      console.error('❌ Video conversion failed:', error);
      throw new Error(`Video conversion failed: ${error.message}`);
    }
  },

  /**
   * Generic convert function - DESKTOP ONLY
   */
  async convert(file, options = {}) {
    ensureDesktop('convert');
    
    // Determine if it's image or video based on file type
    const fileName = file.name || file;
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    
    const imageFormats = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'tiff'];
    const videoFormats = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv'];
    
    if (imageFormats.includes(ext)) {
      return this.convertImage(file, options);
    } else if (videoFormats.includes(ext)) {
      return this.convertVideo(file, options);
    } else {
      throw new Error(`Unsupported file format: ${ext}`);
    }
  },

  /**
   * Resize image - DESKTOP ONLY
   */
  async resize(file, options = {}) {
    ensureDesktop('resize');
    return this.convertImage(file, { ...options, operation: 'resize' });
  },

  /**
   * Rotate image - DESKTOP ONLY
   */
  async rotate(file, options = {}) {
    ensureDesktop('rotate');
    return this.convertImage(file, { ...options, operation: 'rotate' });
  },

  /**
   * Add text to image - DESKTOP ONLY
   */
  async addText(file, text, options = {}) {
    ensureDesktop('addText');
    
    try {
      console.log('✍️ Adding text to image...');
      
      const inputPath = await prepareFileForElectron(file, 'temp_image');
      console.log('📂 Input image path:', inputPath);
      
      // Add text via Electron
      const result = await safeElectronCall('addTextToImage', {
        inputPath: inputPath,
        text: text,
        options: {
          fontSize: options.fontSize ? parseInt(options.fontSize) : 24,
          fontColor: options.fontColor || '#ffffff',
          position: options.position || 'center',
          ...options
        }
      });
      
      if (result.success) {
        console.log('✅ Text added to image:', result);
      } else {
        console.error('❌ Text addition failed:', result.message);
      }
      
      return result;
      
    } catch (error) {
      console.error('❌ Text addition error:', error);
      throw error;
    }
  },

  /**
   * Text to image - DESKTOP ONLY
   */
  async textToImage(text, options = {}) {
    ensureDesktop('textToImage');
    return safeElectronCall('textToImage', { text, options });
  },

  /**
   * Add text to image - DESKTOP ONLY
   */
  async addTextToImage(file, text, options = {}) {
    ensureDesktop('addTextToImage');
    
    try {
      console.log('✍️ Adding text to image...');
      
      const inputPath = await prepareFileForElectron(file, 'temp_image');
      console.log('📂 Input image path:', inputPath);
      
      // Add text via Electron
      const result = await safeElectronCall('addTextToImage', {
        inputPath: inputPath,
        text: text,
        options: {
          fontSize: options.fontSize ? parseInt(options.fontSize) : 24,
          fontColor: options.fontColor || '#ffffff',
          position: options.position || 'center',
          ...options
        }
      });
      
      if (result.success) {
        console.log('✅ Text added to image:', result);
      } else {
        console.error('❌ Text addition failed:', result.message);
      }
      
      return result;
      
    } catch (error) {
      console.error('❌ Text addition error:', error);
      throw error;
    }
  },

  /**
   * Convert to WebP (Advanced) - DESKTOP ONLY
   */
  async convertToWebpAdvanced(file, options = {}) {
    ensureDesktop('convertToWebpAdvanced');
    
    try {
      console.log('🎨 Starting WebP advanced conversion...');
      
      const inputPath = await prepareFileForElectron(file, 'temp_image');
      console.log('📂 Input image path:', inputPath);
      
      // Convert via Electron
      const result = await safeElectronCall('convertToWebpAdvanced', {
        inputPath: inputPath,
        options: {
          quality: options.quality ? parseInt(options.quality) : 80,
          lossless: options.lossless || false,
          preset: options.preset || 'default',
          ...options
        }
      });
      
      if (result.success) {
        console.log('✅ WebP advanced conversion completed:', result);
      } else {
        console.error('❌ WebP advanced conversion failed:', result.message);
      }
      
      return result;
      
    } catch (error) {
      console.error('❌ WebP advanced conversion error:', error);
      throw error;
    }
  },

  /**
   * Batch convert images - DESKTOP ONLY
   */
  async batchConvertImages(files, options = {}) {
    ensureDesktop('batchConvertImages');
    
    try {
      console.log('🎨 Starting batch image conversion...');
      
      // Convert all files to paths
      const inputPaths = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const inputPath = await prepareFileForElectron(file, `temp_batch_${i}`);
        inputPaths.push(inputPath);
      }
      
      console.log('📂 Input image paths:', inputPaths);
      
      // Convert via Electron
      const result = await safeElectronCall('batchConvertImages', {
        inputPaths: inputPaths,
        options: {
          format: options.format || 'webp',
          quality: options.quality ? parseInt(options.quality) : 80,
          ...options
        }
      });
      
      if (result.success) {
        console.log('✅ Batch conversion completed:', result);
      } else {
        console.error('❌ Batch conversion failed:', result.message);
      }
      
      return result;
      
    } catch (error) {
      console.error('❌ Batch conversion error:', error);
      throw error;
    }
  },

  /**
   * Create APNG sequence - DESKTOP ONLY
   */
  async createApngSequence(files, options = {}) {
    ensureDesktop('createApngSequence');
    
    try {
      console.log('🎞️ Starting APNG sequence creation...');
      
      // Convert all files to paths
      const inputPaths = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const inputPath = await prepareFileForElectron(file, `temp_apng_${i}`);
        inputPaths.push(inputPath);
      }
      
      console.log('📂 Input image paths:', inputPaths);
      
      // Create APNG via Electron
      const result = await safeElectronCall('createApngSequence', {
        inputPaths: inputPaths,
        options: {
          delay: options.delay ? parseInt(options.delay) : 100,
          loop: options.loop !== false,
          ...options
        }
      });
      
      if (result.success) {
        console.log('✅ APNG sequence creation completed:', result);
      } else {
        console.error('❌ APNG sequence creation failed:', result.message);
      }
      
      return result;
      
    } catch (error) {
      console.error('❌ APNG sequence creation error:', error);
      throw error;
    }
  },

  /**
   * Convert to AVIF (Modern) - DESKTOP ONLY
   */
  async convertToAvifModern(file, options = {}) {
    ensureDesktop('convertToAvifModern');
    
    try {
      console.log('🎨 Starting AVIF conversion...');
      
      const inputPath = await prepareFileForElectron(file, 'temp_image');
      console.log('📂 Input image path:', inputPath);
      
      // Convert via Electron
      const result = await safeElectronCall('convertToAvifModern', {
        inputPath: inputPath,
        options: {
          quality: options.quality ? parseInt(options.quality) : 80,
          speed: options.speed ? parseInt(options.speed) : 6,
          ...options
        }
      });
      
      if (result.success) {
        console.log('✅ AVIF conversion completed:', result);
      } else {
        console.error('❌ AVIF conversion failed:', result.message);
      }
      
      return result;
      
    } catch (error) {
      console.error('❌ AVIF conversion error:', error);
      throw error;
    }
  },

  /**
   * Convert to JXL - DESKTOP ONLY
   */
  async convertToJxl(file, options = {}) {
    ensureDesktop('convertToJxl');
    
    try {
      console.log('🎨 Starting JPEG XL conversion...');
      
      const inputPath = await prepareFileForElectron(file, 'temp_image');
      console.log('📂 Input image path:', inputPath);
      
      // Convert via Electron
      const result = await safeElectronCall('convertToJxl', {
        inputPath: inputPath,
        options: {
          quality: options.quality ? parseInt(options.quality) : 80,
          effort: options.effort ? parseInt(options.effort) : 7,
          ...options
        }
      });
      
      if (result.success) {
        console.log('✅ JPEG XL conversion completed:', result);
      } else {
        console.error('❌ JPEG XL conversion failed:', result.message);
      }
      
      return result;
      
    } catch (error) {
      console.error('❌ JPEG XL conversion error:', error);
      throw error;
    }
  },

  /**
   * Compare modern formats - DESKTOP ONLY
   */
  async compareModernFormats(file, options = {}) {
    ensureDesktop('compareModernFormats');
    
    try {
      console.log('🎨 Starting modern format comparison...');
      
      const inputPath = await prepareFileForElectron(file, 'temp_image');
      console.log('📂 Input image path:', inputPath);
      
      // Compare via Electron
      const result = await safeElectronCall('compareModernFormats', {
        inputPath: inputPath,
        options: {
          formats: options.formats || ['webp', 'avif', 'jxl'],
          quality: options.quality ? parseInt(options.quality) : 80,
          ...options
        }
      });
      
      if (result.success) {
        console.log('✅ Modern format comparison completed:', result);
      } else {
        console.error('❌ Modern format comparison failed:', result.message);
      }
      
      return result;
      
    } catch (error) {
      console.error('❌ Modern format comparison error:', error);
      throw error;
    }
  },

  /**
   * Get video information - DESKTOP ONLY
   */
  async getVideoInfo(file) {
    ensureDesktop('getVideoInfo');
    
    try {
      console.log('🎬 Getting video info...');
      
      let inputPath;
      
      if (file instanceof File || file instanceof Blob) {
        // Convert File/Blob to ArrayBuffer
        const arrayBuffer = await file.arrayBuffer();
        
        // Create temp filename with proper extension
        const ext = file.name ? file.name.split('.').pop() : 'mp4';
        const tempFileName = `temp_video_${Date.now()}.${ext}`;
        
        // Save file via Electron
        const tempResult = await safeElectronCall('writeFile', {
          filePath: tempFileName,
          data: arrayBuffer
        });
        
        if (tempResult.success && tempResult.filePath) {
          inputPath = tempResult.filePath;
          console.log(`✅ Temp video file saved:`, tempResult.filePath);
        } else {
          throw new Error(`Failed to save temp video file: ${file.name || 'unknown'}`);
        }
      } else {
        // Assume it's already a path
        inputPath = file;
      }
      
      console.log('📂 Input video path:', inputPath);
      
      // Get video info via Electron
      const result = await safeElectronCall('getVideoInfo', {
        inputPath: inputPath
      });
      
      if (result.success) {
        console.log('✅ Video info retrieved:', result);
      } else {
        console.error('❌ Video info failed:', result.message);
      }
      
      return result;
      
    } catch (error) {
      console.error('❌ Video info error:', error);
      throw error;
    }
  },

  /**
   * Convert video to GIF - DESKTOP ONLY
   */
  async convertVideoToGif(file, options = {}) {
    ensureDesktop('convertVideoToGif');
    return this.createGifFromVideo(file, options);
  },

  /**
   * Video to GIF - DESKTOP ONLY
   */
  async videoToGif(file, options = {}) {
    ensureDesktop('videoToGif');
    return this.createGifFromVideo(file, options);
  },

  /**
   * Upload video from URL - DESKTOP ONLY (Not implemented - no web support)
   */
  async uploadVideoFromUrl() {
    throw new Error('URL uploads are not supported in desktop-only mode');
  },

  /**
   * Split GIF - DESKTOP ONLY
   */
  async splitGif(file, options = {}) {
    ensureDesktop('splitGif');
    
    try {
      console.log('✂️ Starting GIF split...');
      
      const inputPath = await prepareFileForElectron(file, 'temp_gif');
      console.log('📂 Input GIF path:', inputPath);
      
      // Split GIF via Electron
      const result = await safeElectronCall('splitGif', {
        inputPath: inputPath,
        options: {
          maxFrames: options.maxFrames ? parseInt(options.maxFrames) : undefined,
          startFrame: options.startFrame ? parseInt(options.startFrame) : 0,
          endFrame: options.endFrame ? parseInt(options.endFrame) : undefined,
          ...options
        }
      });
      
      if (result.success) {
        console.log('✅ GIF split completed:', result);
      } else {
        console.error('❌ GIF split failed:', result.message);
      }
      
      return result;
      
    } catch (error) {
      console.error('❌ GIF split error:', error);
      throw error;
    }
  },

  /**
   * Split GIF from URL - DESKTOP ONLY (Not implemented - no web support)
   */
  async splitGifFromUrl() {
    throw new Error('URL uploads are not supported in desktop-only mode');
  },

  /**
   * Split video - DESKTOP ONLY
   */
  async splitVideo(file, options = {}) {
    ensureDesktop('splitVideo');
    
    try {
      console.log('🎬 Starting video split...');
      
      let inputPath;
      
      if (file instanceof File || file instanceof Blob) {
        // Convert File/Blob to ArrayBuffer
        const arrayBuffer = await file.arrayBuffer();
        
        // Create temp filename with proper extension
        const ext = file.name ? file.name.split('.').pop() : 'mp4';
        const tempFileName = `temp_video_${Date.now()}.${ext}`;
        
        // Save file via Electron
        const tempResult = await safeElectronCall('writeFile', {
          filePath: tempFileName,
          data: arrayBuffer
        });
        
        if (tempResult.success && tempResult.filePath) {
          inputPath = tempResult.filePath;
          console.log(`✅ Temp video file saved:`, tempResult.filePath);
        } else {
          throw new Error(`Failed to save temp video file: ${file.name || 'unknown'}`);
        }
      } else {
        // Assume it's already a path
        inputPath = file;
      }
      
      console.log('📂 Input video path:', inputPath);
      
      // Split video via Electron
      const result = await safeElectronCall('splitVideo', {
        inputPath: inputPath,
        options: {
          duration: options.duration ? parseFloat(options.duration) : undefined,
          startTime: options.startTime ? parseFloat(options.startTime) : 0,
          segmentLength: options.segmentLength ? parseFloat(options.segmentLength) : 10,
          ...options
        }
      });
      
      if (result.success) {
        console.log('✅ Video split completed:', result);
      } else {
        console.error('❌ Video split failed:', result.message);
      }
      
      return result;
      
    } catch (error) {
      console.error('❌ Video split error:', error);
      throw error;
    }
  },

  /**
   * Split video from URL - DESKTOP ONLY (Not implemented - no web support)
   */
  async splitVideoFromUrl() {
    throw new Error('URL uploads are not supported in desktop-only mode');
  },

  /**
   * Extract video frames - DESKTOP ONLY
   */
  async extractVideoFrames(file, options = {}) {
    ensureDesktop('extractVideoFrames');
    
    try {
      console.log('🎬 Starting video frame extraction...');
      
      let inputPath;
      
      if (file instanceof File || file instanceof Blob) {
        // Convert File/Blob to ArrayBuffer
        const arrayBuffer = await file.arrayBuffer();
        
        // Create temp filename with proper extension
        const ext = file.name ? file.name.split('.').pop() : 'mp4';
        const tempFileName = `temp_video_${Date.now()}.${ext}`;
        
        // Save file via Electron
        const tempResult = await safeElectronCall('writeFile', {
          filePath: tempFileName,
          data: arrayBuffer
        });
        
        if (tempResult.success && tempResult.filePath) {
          inputPath = tempResult.filePath;
          console.log(`✅ Temp video file saved:`, tempResult.filePath);
        } else {
          throw new Error(`Failed to save temp video file: ${file.name || 'unknown'}`);
        }
      } else {
        // Assume it's already a path
        inputPath = file;
      }
      
      console.log('📂 Input video path:', inputPath);
      
      // Extract frames via Electron
      const result = await safeElectronCall('extract-video-frames', {
        inputPath: inputPath,
        options: {
          fps: options.fps ? parseFloat(options.fps) : 1,
          startTime: options.startTime ? parseFloat(options.startTime) : 0,
          duration: options.duration ? parseFloat(options.duration) : undefined,
          outputFormat: options.outputFormat || 'png',
          createZip: options.createZip,
          maxFrames: options.maxFrames,
          extractionMode: options.extractionMode,
          intervalMs: options.intervalMs,
          quality: options.quality,
          ...options
        }
      });
      
      if (result.success) {
        console.log('✅ Video frame extraction completed:', result);
      } else {
        console.error('❌ Video frame extraction failed:', result.message);
      }
      
      return result;
      
    } catch (error) {
      console.error('❌ Video frame extraction error:', error);
      throw error;
    }
  },

  /**
   * Extract video frames from URL - DESKTOP ONLY (Not implemented - no web support)
   */
  async extractVideoFramesFromUrl() {
    throw new Error('URL uploads are not supported in desktop-only mode');
  },

  /**
   * Extract GIF frames - DESKTOP ONLY
   */
  async extractGifFrames(file, options = {}) {
    ensureDesktop('extractGifFrames');
    
    try {
      console.log('🎬 Starting GIF frame extraction...');
      
      const inputPath = await prepareFileForElectron(file, 'temp_gif');
      console.log('📂 Input GIF path:', inputPath);
      
      // Extract frames via Electron
      const result = await safeElectronCall('extractGifFrames', {
        inputPath: inputPath,
        options: {
          maxFrames: options.maxFrames ? parseInt(options.maxFrames) : undefined,
          startFrame: options.startFrame ? parseInt(options.startFrame) : 0,
          endFrame: options.endFrame ? parseInt(options.endFrame) : undefined,
          outputFormat: options.outputFormat || 'png',
          ...options
        }
      });
      
      if (result.success) {
        console.log('✅ GIF frame extraction completed:', result);
      } else {
        console.error('❌ GIF frame extraction failed:', result.message);
      }
      
      return result;
      
    } catch (error) {
      console.error('❌ GIF frame extraction error:', error);
      throw error;
    }
  },

  /**
   * Extract GIF frames from URL - DESKTOP ONLY (Not implemented - no web support)
   */
  async extractGifFramesFromUrl() {
    throw new Error('URL uploads are not supported in desktop-only mode');
  },

  /**
   * Convert to WebP - DESKTOP ONLY
   */
  async convertToWebp(file, options = {}) {
    ensureDesktop('convertToWebp');
    
    try {
      console.log('🎨 Starting WebP conversion...');
      
      const inputPath = await prepareFileForElectron(file, 'temp_image');
      console.log('📂 Input image path:', inputPath);
      
      // Convert via Electron
      const result = await safeElectronCall('convertToWebp', {
        inputPath: inputPath,
        options: {
          quality: options.quality ? parseInt(options.quality) : 80,
          ...options
        }
      });
      
      if (result.success) {
        console.log('✅ WebP conversion completed:', result);
      } else {
        console.error('❌ WebP conversion failed:', result.message);
      }
      
      return result;
      
    } catch (error) {
      console.error('❌ WebP conversion error:', error);
      throw error;
    }
  },

  /**
   * Decode WebP - DESKTOP ONLY
   */
  async decodeWebp(file, options = {}) {
    ensureDesktop('decodeWebp');
    
    try {
      console.log('🎨 Starting WebP decode...');
      
      const inputPath = await prepareFileForElectron(file, 'temp_webp');
      console.log('📂 Input WebP path:', inputPath);
      
      // Decode via Electron
      const result = await safeElectronCall('decodeWebp', {
        inputPath: inputPath,
        options: {
          outputFormat: options.outputFormat || 'png',
          ...options
        }
      });
      
      if (result.success) {
        console.log('✅ WebP decode completed:', result);
      } else {
        console.error('❌ WebP decode failed:', result.message);
      }
      
      return result;
      
    } catch (error) {
      console.error('❌ WebP decode error:', error);
      throw error;
    }
  },

  /**
   * Describe image - DESKTOP ONLY
   */
  async describeImage(file, options = {}) {
    ensureDesktop('describeImage');
    
    try {
      console.log('🤖 Starting image description...');
      
      const inputPath = await prepareFileForElectron(file, 'temp_image');
      console.log('📂 Input image path:', inputPath);
      
      // Describe via Electron
      const result = await safeElectronCall('describeImage', {
        inputPath: inputPath,
        options: {
          language: options.language || 'en',
          detail: options.detail || 'standard',
          ...options
        }
      });
      
      if (result.success) {
        console.log('✅ Image description completed:', result);
      } else {
        console.error('❌ Image description failed:', result.message);
      }
      
      return result;
      
    } catch (error) {
      console.error('❌ Image description error:', error);
      throw error;
    }
  },

  /**
   * Open file dialog - DESKTOP ONLY
   */
  async openFileDialog(options = {}) {
    ensureDesktop('openFileDialog');
    return safeElectronCall('openDialog', options);
  },

  /**
   * Download file - DESKTOP ONLY (Save file to user's preferred location)
   */
  async downloadFile(data, filename) {
    ensureDesktop('downloadFile');
    return safeElectronCall('saveFileDialog', { data, filename });
  },

  /**
   * Save file - DESKTOP ONLY
   */
  async saveFile(data, filename) {
    ensureDesktop('saveFile');
    return safeElectronCall('saveFileDialog', { data, filename });
  },

  /**
   * Get app info - DESKTOP ONLY
   */
  async getAppInfo() {
    ensureDesktop('getAppInfo');
    return safeElectronCall('getAppInfo');
  }
};

// Export for backwards compatibility
export const realAPI = api;

// No web URLs in desktop-only mode
export const getApiUrl = () => {
  throw new Error('❌ API URLs are not supported in desktop-only mode');
};

export const resolveDisplayUrl = (path) => {
  if (!path) return '';
  
  // In desktop mode, convert file paths to file:// URLs for display
  if (isElectron()) {
    // If it's already a URL, return as-is
    if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('blob:') || path.startsWith('data:')) {
      return path;
    }
    
    // If it's already a file:// URL, return as-is
    if (path.startsWith('file://')) {
      return path;
    }
    
    // Convert local path to file:// URL
    const normalizedPath = path.replace(/\\/g, '/');
    return normalizedPath.startsWith('/') ? `file://${normalizedPath}` : `file:///${normalizedPath}`;
  }
  
  // Fallback for non-Electron environments
  return path;
};

// Export individual functions for convenience
export const {
  createGifFromImages,
  createGifFromVideo,
  convertImage,
  convertVideo,
  convert,
  resize,
  rotate,
  addText,
  textToImage,
  addTextToImage,
  convertToWebpAdvanced,
  batchConvertImages,
  createApngSequence,
  convertToAvifModern,
  convertToJxl,
  compareModernFormats,
  getVideoInfo,
  convertVideoToGif,
  videoToGif,
  uploadVideoFromUrl,
  splitGif,
  splitGifFromUrl,
  splitVideo,
  splitVideoFromUrl,
  extractVideoFrames,
  extractVideoFramesFromUrl,
  extractGifFrames,
  extractGifFramesFromUrl,
  convertToWebp,
  decodeWebp,
  describeImage,
  openFileDialog,
  downloadFile,
  saveFile,
  getAppInfo
} = api;

export default api;