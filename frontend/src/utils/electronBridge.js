/**
 * Electron Bridge - Automatically detects and uses Electron IPC when available
 * Falls back to HTTP API when running in browser
 */

// Check if we're running in Electron
export const isElectron = () => {
  return typeof window !== 'undefined' && window.electronAPI !== undefined;
};

// Get the API base URL (for browser mode)
const API_BASE_URL = 'http://localhost:3003';

/**
 * Unified API client that works in both Electron and browser
 */
export const apiClient = {
  /**
   * Convert image
   */
  async convertImage({ inputPath, outputPath, format, quality, width, height }) {
    if (isElectron()) {
      // Use Electron IPC
      return await window.electronAPI.convertImage({
        inputPath,
        outputPath,
        format,
        quality,
        width,
        height
      });
    } else {
      // Use HTTP API (browser mode)
      const formData = new FormData();
      formData.append('format', format);
      if (quality) formData.append('quality', quality);
      if (width) formData.append('width', width);
      if (height) formData.append('height', height);
      
      const response = await fetch(`${API_BASE_URL}/api/convert`, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) throw new Error('Conversion failed');
      return await response.blob();
    }
  },

  /**
   * Convert video
   */
  async convertVideo({ inputPath, outputPath, format, quality }) {
    if (isElectron()) {
      // Use Electron IPC
      return await window.electronAPI.convertVideo({
        inputPath,
        outputPath,
        format,
        quality
      });
    } else {
      // Use HTTP API
      const formData = new FormData();
      formData.append('format', format);
      if (quality) formData.append('quality', quality);
      
      const response = await fetch(`${API_BASE_URL}/api/video/convert`, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) throw new Error('Conversion failed');
      return await response.blob();
    }
  },

  /**
   * Open file dialog
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
   * Save file dialog
   */
  async saveFileDialog(options = {}) {
    if (isElectron()) {
      return await window.electronAPI.saveDialog(options);
    } else {
      // Browser download fallback
      return {
        canceled: false,
        filePath: 'download' // Browser will use default download location
      };
    }
  },

  /**
   * Read file
   */
  async readFile(filePath) {
    if (isElectron()) {
      return await window.electronAPI.readFile(filePath);
    } else {
      // Browser fetch
      const response = await fetch(filePath);
      return await response.arrayBuffer();
    }
  },

  /**
   * Write file
   */
  async writeFile({ filePath, data }) {
    if (isElectron()) {
      return await window.electronAPI.writeFile({ filePath, data });
    } else {
      // Browser download
      const blob = new Blob([data]);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filePath.split('/').pop() || 'download';
      a.click();
      URL.revokeObjectURL(url);
      return { success: true };
    }
  },

  /**
   * Show message dialog
   */
  async showMessage(options) {
    if (isElectron()) {
      return await window.electronAPI.showMessage(options);
    } else {
      // Browser alert
      if (options.type === 'error') {
        alert(`Error: ${options.message}`);
      } else {
        alert(options.message);
      }
      return { response: 0 };
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
        version: '1.0.0',
        isElectron: false,
        mode: 'browser'
      };
    }
  },

  /**
   * Process file (generic)
   */
  async processFile(file, options = {}) {
    if (isElectron()) {
      // For Electron, we need the file path
      // If file is a File object, we need to save it first
      if (file instanceof File) {
        const arrayBuffer = await file.arrayBuffer();
        const tempPath = await window.electronAPI.writeFile({
          filePath: `temp_${Date.now()}_${file.name}`,
          data: arrayBuffer
        });
        return tempPath;
      }
      return file;
    } else {
      // For browser, return the file as-is
      return file;
    }
  }
};

// Export individual functions for convenience
export const {
  convertImage,
  convertVideo,
  openFileDialog,
  saveFileDialog,
  readFile,
  writeFile,
  showMessage,
  getAppInfo,
  processFile
} = apiClient;

export default apiClient;
