/**
 * Electron API Helper
 * Provides a unified interface for Electron-specific features
 * Falls back to browser APIs when not in Electron
 */

class ElectronAPI {
  constructor() {
    this.isElectron = typeof window !== 'undefined' && window.electronAPI?.isElectron;
    this.platform = this.isElectron ? window.electronAPI.platform : navigator.platform;
  }

  /**
   * Check if running in Electron
   */
  isElectronApp() {
    return this.isElectron;
  }

  /**
   * Get platform information
   */
  getPlatform() {
    return this.platform;
  }

  /**
   * Open file selection dialog
   * @param {Object} options - Dialog options
   * @returns {Promise<{canceled: boolean, files: Array}>}
   */
  async selectFiles(options = {}) {
    if (!this.isElectron) {
      // Fallback to browser file input
      return this._browserFileSelect(options);
    }

    try {
      return await window.electronAPI.dialog.openFile(options);
    } catch (error) {
      console.error('Error selecting files:', error);
      return { canceled: true, files: [] };
    }
  }

  /**
   * Browser fallback for file selection
   */
  _browserFileSelect(options) {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.multiple = true;
      
      if (options.filters) {
        const extensions = options.filters
          .flatMap(f => f.extensions)
          .map(ext => `.${ext}`)
          .join(',');
        input.accept = extensions;
      }

      input.onchange = async (e) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) {
          resolve({ canceled: true, files: [] });
          return;
        }

        const processedFiles = await Promise.all(
          files.map(async (file) => {
            const buffer = await file.arrayBuffer();
            const base64 = this._arrayBufferToBase64(buffer);
            
            return {
              name: file.name,
              path: file.name,
              data: base64,
              size: file.size,
              type: file.type
            };
          })
        );

        resolve({ canceled: false, files: processedFiles });
      };

      input.click();
    });
  }

  /**
   * Convert ArrayBuffer to Base64
   */
  _arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  /**
   * Save file dialog
   * @param {Object} options - Save dialog options
   * @returns {Promise<{canceled: boolean, filePath: string}>}
   */
  async saveFile(options = {}) {
    if (!this.isElectron) {
      return { canceled: false, filePath: options.defaultPath || 'download' };
    }

    try {
      return await window.electronAPI.dialog.saveFile(options);
    } catch (error) {
      console.error('Error saving file:', error);
      return { canceled: true, filePath: null };
    }
  }

  /**
   * Save file with content
   * @param {string} filePath - Path to save file
   * @param {string} data - Base64 encoded data
   * @param {string} encoding - Data encoding (default: base64)
   */
  async writeFile(filePath, data, encoding = 'base64') {
    if (!this.isElectron) {
      // Browser download fallback
      this._browserDownload(filePath, data, encoding);
      return { success: true, path: filePath };
    }

    try {
      return await window.electronAPI.file.save({ filePath, data, encoding });
    } catch (error) {
      console.error('Error writing file:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Browser fallback for file download
   */
  _browserDownload(filename, data, encoding = 'base64') {
    const blob = encoding === 'base64' 
      ? this._base64ToBlob(data)
      : new Blob([data]);
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Convert Base64 to Blob
   */
  _base64ToBlob(base64) {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray]);
  }

  /**
   * Open path in system default application
   * @param {string} path - File path to open
   */
  async openPath(path) {
    if (!this.isElectron) {
      console.log('Open path not available in browser mode');
      return { success: false };
    }

    try {
      return await window.electronAPI.shell.openPath(path);
    } catch (error) {
      console.error('Error opening path:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Open external URL in default browser
   * @param {string} url - URL to open
   */
  async openExternal(url) {
    if (!this.isElectron) {
      window.open(url, '_blank');
      return { success: true };
    }

    try {
      return await window.electronAPI.shell.openExternal(url);
    } catch (error) {
      console.error('Error opening external URL:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Show native notification
   * @param {Object} options - Notification options {title, body}
   */
  async showNotification({ title, body }) {
    if (!this.isElectron) {
      // Browser notification API
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, { body });
      }
      return { success: true };
    }

    try {
      return await window.electronAPI.notification.show({ title, body });
    } catch (error) {
      console.error('Error showing notification:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get application info
   */
  async getAppInfo() {
    if (!this.isElectron) {
      return {
        name: 'AIO Converter (Web)',
        version: '1.0.0',
        platform: navigator.platform,
        isDev: false
      };
    }

    try {
      return await window.electronAPI.app.getInfo();
    } catch (error) {
      console.error('Error getting app info:', error);
      return null;
    }
  }

  /**
   * Get current theme
   */
  async getTheme() {
    if (!this.isElectron) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    try {
      return await window.electronAPI.theme.get();
    } catch (error) {
      console.error('Error getting theme:', error);
      return 'light';
    }
  }

  /**
   * Set theme
   * @param {string} theme - 'light', 'dark', or 'system'
   */
  async setTheme(theme) {
    if (!this.isElectron) {
      console.log('Theme setting not available in browser mode');
      return { success: false };
    }

    try {
      return await window.electronAPI.theme.set(theme);
    } catch (error) {
      console.error('Error setting theme:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Request browser notification permission (non-Electron)
   */
  async requestNotificationPermission() {
    if (this.isElectron || !('Notification' in window)) {
      return true;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  }
}

// Export singleton instance
export const electronAPI = new ElectronAPI();

// Export class for testing
export default ElectronAPI;
