/**
 * Electron Preload Script
 * Exposes safe IPC APIs to the renderer process with context isolation
 */

const { contextBridge, ipcRenderer } = require('electron');

/**
 * Expose protected methods that allow the renderer process to use
 * the ipcRenderer without exposing the entire object
 */
contextBridge.exposeInMainWorld('electronAPI', {
  // File operations
  dialog: {
    openFile: (options) => ipcRenderer.invoke('dialog:openFile', options),
    saveFile: (options) => ipcRenderer.invoke('dialog:saveFile', options),
  },

  file: {
    save: (data) => ipcRenderer.invoke('file:save', data),
  },

  // Shell operations
  shell: {
    openPath: (path) => ipcRenderer.invoke('shell:openPath', path),
    openExternal: (url) => ipcRenderer.invoke('shell:openExternal', url),
  },

  // App information
  app: {
    getInfo: () => ipcRenderer.invoke('app:getInfo'),
  },

  // Notifications
  notification: {
    show: (options) => ipcRenderer.invoke('notification:show', options),
    onShow: (callback) => {
      ipcRenderer.on('notification', (event, data) => callback(data));
    },
  },

  // Theme management
  theme: {
    get: () => ipcRenderer.invoke('theme:get'),
    set: (theme) => ipcRenderer.invoke('theme:set', theme),
  },

  // Platform detection
  platform: process.platform,
  isElectron: true,
});

/**
 * Expose node process info (read-only)
 */
contextBridge.exposeInMainWorld('nodeProcess', {
  platform: process.platform,
  arch: process.arch,
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron,
  },
});

// Console log for debugging
console.log('Preload script loaded successfully');
