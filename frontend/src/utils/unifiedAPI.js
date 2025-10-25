/**
 * UNIFIED API CLIENT - Automatically uses Electron IPC or HTTP based on environment
 * This replaces the old apiConfig.js system completely
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

// Fallback HTTP API base URL (for browser mode)
const HTTP_API_BASE = 'http://localhost:3003';

/**
 * Safe Electron API caller with error handling
 */
const safeElectronCall = async (method, ...args) => {
  try {
    if (!isElectron() || !window.electronAPI || typeof window.electronAPI[method] !== 'function') {
      throw new Error(`Electron API method ${method} not available`);
    }
    return await window.electronAPI[method](...args);
  } catch (error) {
    console.error(`Electron API call failed for ${method}:`, error);
    throw error;
  }
};

/**
 * Unified API that works in both Electron and browser environments
 */
export const api = {
  
  // Environment detection
  isElectron: isElectron(),
  
  /**
   * Create GIF from images
   */
  async createGifFromImages(files, options = {}) {
    console.log('🎬 Creating GIF from', files.length, 'images');
    
    if (isElectron()) {
      // Electron mode - use IPC
      console.log('📱 Using Electron IPC for GIF creation');
      
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
            const tempResult = await window.electronAPI.writeFile({
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
        const result = await window.electronAPI.createGifFromImages({
          inputPaths: imagePaths,
          outputPath: outputFileName,
          options: {
            width: options.width || 500,
            height: options.height || 300,
            quality: options.quality || 80,
            fps: options.fps || 10,
            loop: options.loop !== false
          }
        });
        
        console.log('✅ GIF created successfully via Electron:', result);
        return result;
        
      } catch (error) {
        console.error('❌ Electron GIF creation failed:', error);
        throw new Error(`GIF creation failed: ${error.message}`);
      }
      
    } else {
      // Browser mode - use HTTP API
      console.log('🌐 Using HTTP API for GIF creation');
      
      try {
        const formData = new FormData();
        
        // Add files
        files.forEach((file, index) => {
          formData.append('images', file);
        });
        
        // Add options
        Object.entries(options).forEach(([key, value]) => {
          formData.append(key, value);
        });
        
        const response = await fetch(`${HTTP_API_BASE}/api/enhanced-gif/images-to-gif`, {
          method: 'POST',
          body: formData
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.blob();
        console.log('✅ GIF created successfully via HTTP API');
        return result;
        
      } catch (error) {
        console.error('❌ HTTP GIF creation failed:', error);
        throw new Error(`GIF creation failed: ${error.message}`);
      }
    }
  },

  /**
   * Convert image
   */
  async convertImage(file, options = {}) {
    console.log('🖼️ Converting image:', file.name || 'unknown');
    
    if (isElectron()) {
      // Electron mode
      console.log('📱 Using Electron IPC for image conversion');
      
      try {
        let inputPath;
        if (file instanceof File) {
          const arrayBuffer = await file.arrayBuffer();
          const tempResult = await window.electronAPI.writeFile({
            filePath: `temp_convert_${Date.now()}_${file.name}`,
            data: arrayBuffer
          });
          inputPath = tempResult.filePath;
        } else {
          inputPath = file;
        }
        
        const result = await window.electronAPI.convertImage({
          inputPath,
          outputPath: `converted_${Date.now()}.${options.format || 'png'}`,
          format: options.format || 'png',
          quality: options.quality || 80,
          width: options.width,
          height: options.height
        });
        
        console.log('✅ Image converted successfully via Electron');
        return result;
        
      } catch (error) {
        console.error('❌ Electron image conversion failed:', error);
        throw new Error(`Image conversion failed: ${error.message}`);
      }
      
    } else {
      // Browser mode
      console.log('🌐 Using HTTP API for image conversion');
      
      try {
        const formData = new FormData();
        formData.append('file', file);
        
        Object.entries(options).forEach(([key, value]) => {
          if (value !== undefined) {
            formData.append(key, value);
          }
        });
        
        const response = await fetch(`${HTTP_API_BASE}/api/convert`, {
          method: 'POST',
          body: formData
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.blob();
        console.log('✅ Image converted successfully via HTTP API');
        return result;
        
      } catch (error) {
        console.error('❌ HTTP image conversion failed:', error);
        throw new Error(`Image conversion failed: ${error.message}`);
      }
    }
  },

  /**
   * Convert video
   */
  async convertVideo(file, options = {}) {
    console.log('🎥 Converting video:', file.name || 'unknown');
    
    if (isElectron()) {
      // Electron mode
      console.log('📱 Using Electron IPC for video conversion');
      
      try {
        let inputPath;
        if (file instanceof File) {
          const arrayBuffer = await file.arrayBuffer();
          const tempResult = await window.electronAPI.writeFile({
            filePath: `temp_video_${Date.now()}_${file.name}`,
            data: arrayBuffer
          });
          inputPath = tempResult.filePath;
        } else {
          inputPath = file;
        }
        
        const result = await window.electronAPI.convertVideo({
          inputPath,
          outputPath: `converted_video_${Date.now()}.${options.format || 'mp4'}`,
          format: options.format || 'mp4',
          quality: options.quality || 'medium'
        });
        
        console.log('✅ Video converted successfully via Electron');
        return result;
        
      } catch (error) {
        console.error('❌ Electron video conversion failed:', error);
        throw new Error(`Video conversion failed: ${error.message}`);
      }
      
    } else {
      // Browser mode
      console.log('🌐 Using HTTP API for video conversion');
      
      try {
        const formData = new FormData();
        formData.append('file', file);
        
        Object.entries(options).forEach(([key, value]) => {
          if (value !== undefined) {
            formData.append(key, value);
          }
        });
        
        const response = await fetch(`${HTTP_API_BASE}/api/video/convert`, {
          method: 'POST',
          body: formData
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.blob();
        console.log('✅ Video converted successfully via HTTP API');
        return result;
        
      } catch (error) {
        console.error('❌ HTTP video conversion failed:', error);
        throw new Error(`Video conversion failed: ${error.message}`);
      }
    }
  },

  /**
   * Show file picker
   */
  async openFileDialog(options = {}) {
    if (isElectron()) {
      return await window.electronAPI.openDialog(options);
    } else {
      // Browser file input fallback
      return new Promise((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        if (options.filters) {
          input.accept = options.filters.map(f => f.extensions.map(e => `.${e}`).join(',')).join(',');
        }
        input.multiple = options.properties?.includes('multiSelections');
        
        input.onchange = (e) => {
          const files = Array.from(e.target.files || []);
          resolve({
            canceled: files.length === 0,
            filePaths: files.map(f => URL.createObjectURL(f)),
            files: files
          });
        };
        
        input.click();
      });
    }
  },

  /**
   * Create GIF from video
   */
  async createGifFromVideo(file, options = {}) {
    console.log('🎬 Creating GIF from video:', file.name);
    
    if (isElectron()) {
      // Use the general convertVideo method
      return await this.convertVideo(file, {
        ...options,
        outputFormat: 'gif'
      });
    } else {
      // Browser mode - use HTTP API
      const formData = new FormData();
      formData.append('video', file);
      
      Object.keys(options).forEach(key => {
        formData.append(key, options[key]);
      });
      
      const response = await fetch(`${HTTP_API_BASE}/api/gif/create-from-video`, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`Video to GIF creation failed: ${response.statusText}`);
      }
      
      return await response.json();
    }
  },

  /**
   * General convert method (for backward compatibility)
   */
  async convert(file, format, quality = 0.9) {
    return await this.convertImage(file, {
      outputFormat: format,
      quality: quality
    });
  },

  /**
   * Resize image
   */
  async resize(file, width, height, maintainAspectRatio = true) {
    return await this.convertImage(file, {
      width: width,
      height: height,
      fit: maintainAspectRatio ? 'inside' : 'fill'
    });
  },

  /**
   * Rotate image
   */
  async rotate(file, degrees) {
    return await this.convertImage(file, {
      rotate: degrees
    });
  },

  /**
   * Add text to image
   */
  async addText(file, text, options = {}) {
    if (isElectron()) {
      // Text addition not implemented in desktop mode yet
      throw new Error('Text addition feature is not available in desktop mode yet');
    } else {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('text', text);
      
      Object.keys(options).forEach(key => {
        formData.append(key, options[key]);
      });
      
      const response = await fetch(`${HTTP_API_BASE}/api/text/add-to-image`, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`Text addition failed: ${response.statusText}`);
      }
      
      return await response.json();
    }
  },

  /**
   * Create APNG sequence
   */
  async createApngSequence(files, options = {}) {
    if (isElectron()) {
      // APNG creation not implemented in desktop mode yet
      throw new Error('APNG creation feature is not available in desktop mode yet');
    } else {
      const formData = new FormData();
      files.forEach((file, index) => {
        formData.append(`images`, file);
      });
      
      Object.keys(options).forEach(key => {
        formData.append(key, options[key]);
      });
      
      const response = await fetch(`${HTTP_API_BASE}/api/modern/create-apng`, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`APNG creation failed: ${response.statusText}`);
      }
      
      return await response.json();
    }
  },

  /**
   * Convert to AVIF modern format
   */
  async convertToAvifModern(files, options = {}) {
    if (isElectron()) {
      // Use general convertImage method for each file
      const results = [];
      for (const file of files) {
        const result = await this.convertImage(file, {
          ...options,
          outputFormat: 'avif'
        });
        results.push(result);
      }
      return { results };
    } else {
      const formData = new FormData();
      files.forEach((file, index) => {
        formData.append(`images`, file);
      });
      
      Object.keys(options).forEach(key => {
        formData.append(key, options[key]);
      });
      
      const response = await fetch(`${HTTP_API_BASE}/api/modern/convert-to-avif`, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`AVIF conversion failed: ${response.statusText}`);
      }
      
      return await response.json();
    }
  },

  /**
   * Convert to JXL format
   */
  async convertToJxl(files, options = {}) {
    if (isElectron()) {
      // JXL conversion not implemented in desktop mode yet
      throw new Error('JXL conversion feature is not available in desktop mode yet');
    } else {
      const formData = new FormData();
      files.forEach((file, index) => {
        formData.append(`images`, file);
      });
      
      Object.keys(options).forEach(key => {
        formData.append(key, options[key]);
      });
      
      const response = await fetch(`${HTTP_API_BASE}/api/modern/convert-to-jxl`, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`JXL conversion failed: ${response.statusText}`);
      }
      
      return await response.json();
    }
  },

  /**
   * Compare modern formats
   */
  async compareModernFormats(file) {
    if (isElectron()) {
      // Modern format comparison not implemented in desktop mode yet
      throw new Error('Modern format comparison feature is not available in desktop mode yet');
    } else {
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await fetch(`${HTTP_API_BASE}/api/modern/compare-formats`, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`Format comparison failed: ${response.statusText}`);
      }
      
      return await response.json();
    }
  },

  /**
   * Get video info
   */
  async getVideoInfo(videoId) {
    if (isElectron()) {
      // Video info not implemented in desktop mode yet
      throw new Error('Video info feature is not available in desktop mode yet');
    } else {
      const response = await fetch(`${HTTP_API_BASE}/api/video/info/${videoId}`);
      
      if (!response.ok) {
        throw new Error(`Video info failed: ${response.statusText}`);
      }
      
      return await response.json();
    }
  },

  /**
   * Convert video to GIF (with settings)
   */
  async convertVideoToGif(videoId, settings = {}) {
    if (isElectron()) {
      // Video to GIF conversion not implemented in desktop mode yet
      throw new Error('Video to GIF conversion feature is not available in desktop mode yet');
    } else {
      const response = await fetch(`${HTTP_API_BASE}/api/video/convert-to-gif/${videoId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      
      if (!response.ok) {
        throw new Error(`Video to GIF conversion failed: ${response.statusText}`);
      }
      
      return await response.json();
    }
  },

  /**
   * Convert video to GIF
   */
  async videoToGif(file, options = {}) {
    console.log('🎬 Converting video to GIF:', file.name);
    
    if (isElectron()) {
      // Use the general convertVideo method
      return await this.convertVideo(file, {
        ...options,
        outputFormat: 'gif'
      });
    } else {
      // Browser mode - use HTTP API
      const formData = new FormData();
      formData.append('video', file);
      
      Object.keys(options).forEach(key => {
        formData.append(key, options[key]);
      });
      
      const response = await fetch(`${HTTP_API_BASE}/api/video/convert-to-gif`, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`Video to GIF conversion failed: ${response.statusText}`);
      }
      
      return await response.json();
    }
  },

  /**
   * Upload video from URL
   */
  async uploadVideoFromUrl(url, options = {}) {
    if (isElectron()) {
      throw new Error('uploadVideoFromUrl not supported in Electron mode');
    } else {
      const response = await fetch(`${HTTP_API_BASE}/api/video/upload-from-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, ...options })
      });
      
      if (!response.ok) {
        throw new Error(`Video upload from URL failed: ${response.statusText}`);
      }
      
      return await response.json();
    }
  },

  /**
   * Split GIF into frames
   */
  async splitGif(file, options = {}) {
    console.log('✂️ Splitting GIF:', file.name);
    
    if (isElectron()) {
      // Convert File to temp file for Electron
      const arrayBuffer = await file.arrayBuffer();
      const tempFileName = `temp_gif_${Date.now()}.gif`;
      
      const tempResult = await window.electronAPI.writeFile({
        filePath: tempFileName,
        data: arrayBuffer
      });
      
      if (!tempResult.success) {
        throw new Error('Failed to save temp file for GIF splitting');
      }
      
      // Call Electron API to split GIF
      const result = await window.electronAPI.splitGif({
        inputPath: tempResult.filePath,
        options: options
      });
      
      return result;
    } else {
      // Browser mode - use HTTP API
      const formData = new FormData();
      formData.append('gif', file);
      
      Object.keys(options).forEach(key => {
        formData.append(key, options[key]);
      });
      
      const response = await fetch(`${HTTP_API_BASE}/api/split/gif`, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`GIF splitting failed: ${response.statusText}`);
      }
      
      return await response.json();
    }
  },

  /**
   * Split GIF from URL
   */
  async splitGifFromUrl(url, options = {}) {
    if (isElectron()) {
      throw new Error('splitGifFromUrl not supported in Electron mode');
    } else {
      const response = await fetch(`${HTTP_API_BASE}/api/split/gif-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, ...options })
      });
      
      if (!response.ok) {
        throw new Error(`GIF splitting from URL failed: ${response.statusText}`);
      }
      
      return await response.json();
    }
  },

  /**
   * Split video into segments
   */
  async splitVideo(file, options = {}) {
    console.log('✂️ Splitting video:', file.name);
    
    if (isElectron()) {
      // Convert File to temp file for Electron
      const arrayBuffer = await file.arrayBuffer();
      const ext = file.name.split('.').pop() || 'mp4';
      const tempFileName = `temp_video_${Date.now()}.${ext}`;
      
      const tempResult = await window.electronAPI.writeFile({
        filePath: tempFileName,
        data: arrayBuffer
      });
      
      if (!tempResult.success) {
        throw new Error('Failed to save temp file for video splitting');
      }
      
      // Call Electron API to split video
      console.log('🎬 Calling electron splitVideo with options:', options);
      const result = await window.electronAPI.splitVideo({
        inputPath: tempResult.filePath,
        options: options
      });
      
      console.log('🎬 Electron splitVideo result:', result);
      console.log('🎬 Result segments count:', result?.segments?.length || 0);
      
      return result;
    } else {
      // Browser mode - use HTTP API
      const formData = new FormData();
      formData.append('video', file);
      
      Object.keys(options).forEach(key => {
        formData.append(key, options[key]);
      });
      
      const response = await fetch(`${HTTP_API_BASE}/api/split/video`, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`Video splitting failed: ${response.statusText}`);
      }
      
      return await response.json();
    }
  },

  /**
   * Split video from URL
   */
  async splitVideoFromUrl(url, options = {}) {
    if (isElectron()) {
      throw new Error('splitVideoFromUrl not supported in Electron mode');
    } else {
      const response = await fetch(`${HTTP_API_BASE}/api/split/video-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, ...options })
      });
      
      if (!response.ok) {
        throw new Error(`Video splitting from URL failed: ${response.statusText}`);
      }
      
      return await response.json();
    }
  },

  /**
   * Convert to WebP format
   */
  async convertToWebp(files, options = {}) {
    console.log('🔄 Converting to WebP:', files.length, 'files');
    
    if (isElectron()) {
      // In Electron, use the general convertImage method
      const results = [];
      for (const file of files) {
        const result = await this.convertImage(file, {
          ...options,
          outputFormat: 'webp'
        });
        results.push(result);
      }
      return { results };
    } else {
      // Browser mode - use HTTP API
      const formData = new FormData();
      files.forEach((file, index) => {
        formData.append(`images`, file);
      });
      
      Object.keys(options).forEach(key => {
        formData.append(key, options[key]);
      });
      
      const response = await fetch(`${HTTP_API_BASE}/api/webp/convert`, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`WebP conversion failed: ${response.statusText}`);
      }
      
      return await response.json();
    }
  },

  /**
   * Decode WebP format
   */
  async decodeWebp(files, options = {}) {
    console.log('🔄 Decoding WebP:', files.length, 'files');
    
    if (isElectron()) {
      // In Electron, use the general convertImage method
      const results = [];
      for (const file of files) {
        const result = await this.convertImage(file, {
          ...options,
          outputFormat: options.outputFormat || 'png'
        });
        results.push(result);
      }
      return { results };
    } else {
      // Browser mode - use HTTP API
      const formData = new FormData();
      files.forEach((file, index) => {
        formData.append(`images`, file);
      });
      
      Object.keys(options).forEach(key => {
        formData.append(key, options[key]);
      });
      
      const response = await fetch(`${HTTP_API_BASE}/api/webp/decode`, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`WebP decoding failed: ${response.statusText}`);
      }
      
      return await response.json();
    }
  },

  /**
   * Download file from endpoint or path
   */
  async downloadFile(endpoint) {
    if (isElectron()) {
      // In Electron, files should be handled directly without HTTP requests
      // This method shouldn't be used in Electron mode - files should be saved directly
      throw new Error('downloadFile not supported in Electron mode - use saveFile instead');
    } else {
      // Browser mode - use HTTP API
      const url = `${HTTP_API_BASE}${endpoint}`;
      const response = await fetch(url, { mode: 'cors' });
      
      if (!response.ok) {
        throw new Error(`Download failed: ${response.status}`);
      }
      
      const blob = await response.blob();
      return { blob, url };
    }
  },

  /**
   * Save file
   */
  async saveFile(data, filename) {
    if (isElectron()) {
      return await window.electronAPI.writeFile({
        filePath: filename,
        data: data
      });
    } else {
      // Browser download
      const blob = new Blob([data]);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      return { success: true, filePath: filename };
    }
  },

  /**
   * Copy file (Electron only)
   */
  async copyFile(sourcePath, destPath) {
    if (isElectron()) {
      return await window.electronAPI.copyFile({
        sourcePath: sourcePath,
        destPath: destPath
      });
    } else {
      throw new Error('copyFile is only available in Electron mode');
    }
  },

  /**
   * Describe image (AI feature)
   */
  async describeImage(imageName) {
    if (isElectron()) {
      // AI features not supported in desktop mode
      throw new Error('Image description feature is not available in desktop mode');
    } else {
      const response = await fetch(`${HTTP_API_BASE}/api/ai/describe-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageName })
      });
      
      if (!response.ok) {
        throw new Error(`Image description failed: ${response.statusText}`);
      }
      
      return await response.json();
    }
  },

  /**
   * Get app info
   */
  async getAppInfo() {
    if (isElectron()) {
      return await window.electronAPI.getAppInfo();
    } else {
      return {
        name: 'AIO Converter',
        version: '1.0.1',
        mode: 'browser',
        isElectron: false
      };
    }
  },

  /**
   * Convert text to Markdown
   */
  async convertTextToMd(file, options = {}) {
    console.log('📝 Converting text to Markdown:', file.name);
    
    if (isElectron()) {
      // Electron mode - not implemented yet
      throw new Error('Text to Markdown conversion is not available in desktop mode yet');
    } else {
      // Browser mode - use HTTP API
      const formData = new FormData();
      formData.append('textFile', file);
      
      Object.keys(options).forEach(key => {
        formData.append(key, options[key]);
      });
      
      const response = await fetch(`${HTTP_API_BASE}/api/text/text-to-md`, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`Text to Markdown conversion failed: ${response.statusText}`);
      }
      
      return await response.json();
    }
  }
};

// Export legacy compatibility
export const realAPI = api;

/**
 * Get API URL - Updated to handle Electron mode properly
 */
export const getApiUrl = (endpoint) => {
  if (isElectron()) {
    // In Electron mode, most API endpoints don't make sense as URLs
    // Return empty string to prevent trying to fetch them
    console.warn('⚠️ getApiUrl called in Electron mode with endpoint:', endpoint);
    return '';
  }
  return `${HTTP_API_BASE}${endpoint}`;
};

/**
 * Resolve URL for display purposes (images, videos, etc.)
 */
export const resolveDisplayUrl = (path) => {
  console.log('🔗 resolveDisplayUrl called with:', path);
  
  if (!path) return '';
  if (path.startsWith('data:')) return path;
  if (path.startsWith('file://')) {
    console.log('🔗 Already file:// URL:', path);
    return path;
  }
  if (path.startsWith('http')) return path;
  
  // In Electron mode, handle file paths properly
  if (isElectron()) {
    // If it's a full file path (contains \ or /), convert to file:// URL
    if ((path.includes('\\') || path.includes('/')) && !path.startsWith('blob:')) {
      // Normalize path separators and ensure proper file:// format
      const normalizedPath = path.replace(/\\/g, '/');
      let fileUrl;
      
      if (!normalizedPath.startsWith('/')) {
        fileUrl = `file:///${normalizedPath}`;
      } else {
        fileUrl = `file://${normalizedPath}`;
      }
      
      console.log('🔗 Converted to file URL:', path, '→', fileUrl);
      return fileUrl;
    }
    
    // If it's an API endpoint path, return empty string
    return '';
  }
  
  return `${HTTP_API_BASE}${path}`;
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
  convertToWebp,
  decodeWebp,
  describeImage,
  openFileDialog,
  downloadFile,
  saveFile,
  getAppInfo
} = api;

export default api;