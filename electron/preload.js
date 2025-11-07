/**
 * SIMPLE PRELOAD SCRIPT
 * Exposes direct file processing APIs
 */

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // File operations
  getFileInfo: (filePath) => ipcRenderer.invoke('get-file-info', filePath),
  readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
  writeFile: (data) => ipcRenderer.invoke('write-file', data),
  copyFile: (data) => ipcRenderer.invoke('copy-file', data),
  
  // Image conversion
  convertImage: (data) => ipcRenderer.invoke('convert-image', data),
  createGifFromImages: (data) => ipcRenderer.invoke('create-gif-from-images', data),
  
  // Video conversion
  convertVideo: (data) => ipcRenderer.invoke('convert-video', data),
  
  // Splitting operations
  splitGif: (data) => ipcRenderer.invoke('split-gif', data),
  splitVideo: (data) => ipcRenderer.invoke('split-video', data),
  
  // Frame extraction operations
  extractVideoFrames: (data) => ipcRenderer.invoke('extract-video-frames', data),
  extractGifFrames: (data) => ipcRenderer.invoke('extract-gif-frames', data),
  
  // Text operations
  textToImage: (data) => ipcRenderer.invoke('text-to-image', data),
  addTextToImage: (data) => ipcRenderer.invoke('add-text-to-image', data),
  
  // Advanced WebP operations
  convertToWebpAdvanced: (data) => ipcRenderer.invoke('convert-to-webp-advanced', data),
  convertToWebp: (data) => ipcRenderer.invoke('convertToWebp', data),
  decodeWebp: (data) => ipcRenderer.invoke('decodeWebp', data),
  batchConvertImages: (data) => ipcRenderer.invoke('batch-convert-images', data),
  
  // GIF from video
  createGifFromVideo: (data) => ipcRenderer.invoke('createGifFromVideo', data),
  
  // AI features
  describeImage: (data) => ipcRenderer.invoke('describeImage', data),
  
  // Dialogs
  openDialog: (options) => ipcRenderer.invoke('dialog:open', options),
  saveDialog: (options) => ipcRenderer.invoke('dialog:save', options),
  saveFileDialog: (data) => ipcRenderer.invoke('saveFileDialog', data),
  showMessage: (options) => ipcRenderer.invoke('dialog:message', options),
  
  // Shell
  openPath: (path) => ipcRenderer.invoke('shell:open', path),
  showItemInFolder: (path) => ipcRenderer.invoke('shell:showItemInFolder', path),
  
  // Direct Downloads
  downloadDirect: (data) => ipcRenderer.invoke('download:direct', data),
  copyToDownloads: (data) => ipcRenderer.invoke('download:copyToDownloads', data),
  onDownloadProgress: (callback) => {
    ipcRenderer.on('download:progress', (event, data) => callback(data));
  },
  
  // App info
  getAppInfo: () => ipcRenderer.invoke('getAppInfo'),
  
  // Video serving for preview
  serveVideo: (filePath) => ipcRenderer.invoke('serve-video', filePath),
  
  // File renaming
  renameFile: (data) => ipcRenderer.invoke('rename-file', data),
  
  // Events
  onFilesSelected: (callback) => {
    ipcRenderer.on('files-selected', (event, files) => callback(files));
  },
  
  // Platform
  platform: process.platform,
  isElectron: true
});

console.log('✅ Preload script loaded - Pure desktop mode');
