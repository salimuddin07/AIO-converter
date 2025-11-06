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
    return safeElectronCall('addTextToImage', { file, text, options });
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
    return safeElectronCall('addTextToImage', { file, text, options });
  },

  /**
   * Convert to WebP Advanced - DESKTOP ONLY
   */
  async convertToWebpAdvanced(file, options = {}) {
    ensureDesktop('convertToWebpAdvanced');
    return safeElectronCall('convertToWebpAdvanced', { file, options });
  },

  /**
   * Batch convert images - DESKTOP ONLY
   */
  async batchConvertImages(files, options = {}) {
    ensureDesktop('batchConvertImages');
    return safeElectronCall('batchConvertImages', { files, options });
  },

  /**
   * Create APNG sequence - DESKTOP ONLY
   */
  async createApngSequence(files, options = {}) {
    ensureDesktop('createApngSequence');
    return safeElectronCall('createApngSequence', { files, options });
  },

  /**
   * Convert to AVIF Modern - DESKTOP ONLY
   */
  async convertToAvifModern(file, options = {}) {
    ensureDesktop('convertToAvifModern');
    return safeElectronCall('convertToAvifModern', { file, options });
  },

  /**
   * Convert to JXL - DESKTOP ONLY
   */
  async convertToJxl(file, options = {}) {
    ensureDesktop('convertToJxl');
    return safeElectronCall('convertToJxl', { file, options });
  },

  /**
   * Compare modern formats - DESKTOP ONLY
   */
  async compareModernFormats(file, options = {}) {
    ensureDesktop('compareModernFormats');
    return safeElectronCall('compareModernFormats', { file, options });
  },

  /**
   * Get video info - DESKTOP ONLY
   */
  async getVideoInfo(file) {
    ensureDesktop('getVideoInfo');
    return safeElectronCall('getVideoInfo', { file });
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
    return safeElectronCall('splitGif', { file, options });
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
    return safeElectronCall('splitVideo', { file, options });
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
    return safeElectronCall('extractVideoFrames', { file, options });
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
    return safeElectronCall('extractGifFrames', { file, options });
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
    return safeElectronCall('convertToWebp', { file, options });
  },

  /**
   * Decode WebP - DESKTOP ONLY
   */
  async decodeWebp(file, options = {}) {
    ensureDesktop('decodeWebp');
    return safeElectronCall('decodeWebp', { file, options });
  },

  /**
   * Describe image - DESKTOP ONLY
   */
  async describeImage(file, options = {}) {
    ensureDesktop('describeImage');
    return safeElectronCall('describeImage', { file, options });
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