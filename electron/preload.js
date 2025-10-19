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
  
  // Dialogs
  openDialog: (options) => ipcRenderer.invoke('dialog:open', options),
  saveDialog: (options) => ipcRenderer.invoke('dialog:save', options),
  showMessage: (options) => ipcRenderer.invoke('dialog:message', options),
  
  // Shell
  openPath: (path) => ipcRenderer.invoke('shell:open', path),
  
  // App info
  getAppInfo: () => ipcRenderer.invoke('app:info'),
  
  // Events
  onFilesSelected: (callback) => {
    ipcRenderer.on('files-selected', (event, files) => callback(files));
  },
  
  // Platform
  platform: process.platform,
  isElectron: true
});

console.log('✅ Preload script loaded - Pure desktop mode');
