/**
 * Electron Main Process
 * Handles window management, IPC communication, and native OS features
 */

const { app, BrowserWindow, ipcMain, dialog, Menu, Tray, shell, nativeTheme } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs').promises;
const http = require('http');

// Keep a global reference to prevent garbage collection
let mainWindow = null;
let backendProcess = null;
let tray = null;
const BACKEND_PORT = 3003;
const isDev = process.env.NODE_ENV === 'development';

/**
 * Create the main application window
 */
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    icon: path.join(__dirname, '../public/icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      enableRemoteModule: false,
      sandbox: true,
    },
    backgroundColor: '#1a1a2e',
    show: false, // Don't show until ready
    frame: true,
    titleBarStyle: 'default',
  });

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    if (isDev) {
      mainWindow.webContents.openDevTools();
    }
  });

  // Load the app
  if (isDev) {
    mainWindow.loadURL('http://localhost:3001');
    
    // Hot reload for development
    mainWindow.webContents.on('did-fail-load', () => {
      setTimeout(() => {
        mainWindow.loadURL('http://localhost:3001');
      }, 1000);
    });
  } else {
    mainWindow.loadFile(path.join(__dirname, '../frontend/dist/index.html'));
  }

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Create application menu
  createMenu();

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Handle minimize to tray (optional)
  mainWindow.on('minimize', (event) => {
    if (process.platform === 'win32') {
      event.preventDefault();
      mainWindow.hide();
    }
  });
}

/**
 * Create application menu
 */
function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Open Files',
          accelerator: 'CmdOrCtrl+O',
          click: () => {
            selectFiles();
          }
        },
        { type: 'separator' },
        {
          label: 'Exit',
          accelerator: 'CmdOrCtrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'delete' },
        { type: 'separator' },
        { role: 'selectAll' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
        { type: 'separator' },
        { role: 'toggleDevTools' }
      ]
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        { type: 'separator' },
        { role: 'close' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Documentation',
          click: () => {
            shell.openExternal('https://github.com/salimuddin07/GIF-converter');
          }
        },
        {
          label: 'Report Issue',
          click: () => {
            shell.openExternal('https://github.com/salimuddin07/GIF-converter/issues');
          }
        },
        { type: 'separator' },
        {
          label: 'About',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About AIO Converter',
              message: 'AIO Converter',
              detail: `Version: ${app.getVersion()}\nA comprehensive media conversion tool\n\nCreated by Salimuddin\nhttps://github.com/salimuddin07`,
              buttons: ['OK']
            });
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

/**
 * Create system tray icon (Windows)
 */
function createTray() {
  if (process.platform !== 'win32') return;

  const iconPath = path.join(__dirname, '../public/icon.png');
  tray = new Tray(iconPath);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show App',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
        }
      }
    },
    {
      label: 'Quit',
      click: () => {
        app.quit();
      }
    }
  ]);

  tray.setToolTip('AIO Converter');
  tray.setContextMenu(contextMenu);

  tray.on('click', () => {
    if (mainWindow) {
      mainWindow.show();
    }
  });
}

/**
 * Start the backend server
 */
async function startBackend() {
  return new Promise((resolve, reject) => {
    const backendPath = isDev
      ? path.join(__dirname, '../backend/server.js')
      : path.join(process.resourcesPath, 'backend/server.js');

    const env = {
      ...process.env,
      PORT: BACKEND_PORT.toString(),
      NODE_ENV: isDev ? 'development' : 'production',
      ELECTRON_MODE: 'true',
      // Set paths for resources in production
      FFMPEG_PATH: isDev
        ? undefined
        : path.join(process.resourcesPath, 'ffmpeg', 'ffmpeg.exe'),
      FFPROBE_PATH: isDev
        ? undefined
        : path.join(process.resourcesPath, 'ffmpeg', 'ffprobe.exe'),
    };

    backendProcess = spawn('node', [backendPath], {
      env,
      stdio: 'inherit',
      windowsHide: true,
    });

    backendProcess.on('error', (err) => {
      console.error('Failed to start backend:', err);
      reject(err);
    });

    backendProcess.on('exit', (code) => {
      console.log(`Backend process exited with code ${code}`);
      backendProcess = null;
    });

    // Wait for backend to be ready
    const checkBackend = setInterval(() => {
      http
        .get(`http://localhost:${BACKEND_PORT}/health`, (res) => {
          if (res.statusCode === 200) {
            clearInterval(checkBackend);
            console.log('Backend server is ready');
            resolve();
          }
        })
        .on('error', () => {
          // Keep checking
        });
    }, 500);

    // Timeout after 30 seconds
    setTimeout(() => {
      clearInterval(checkBackend);
      reject(new Error('Backend failed to start within 30 seconds'));
    }, 30000);
  });
}

/**
 * Stop the backend server
 */
function stopBackend() {
  if (backendProcess) {
    backendProcess.kill();
    backendProcess = null;
  }
}

/**
 * IPC Handlers
 */

// File selection dialog
ipcMain.handle('dialog:openFile', async (event, options = {}) => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile', 'multiSelections'],
    filters: options.filters || [
      { name: 'All Files', extensions: ['*'] },
      { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'] },
      { name: 'Videos', extensions: ['mp4', 'avi', 'mov', 'webm', 'mkv'] },
      { name: 'Documents', extensions: ['pdf', 'md'] }
    ]
  });

  if (!result.canceled && result.filePaths.length > 0) {
    // Read file contents and return as base64
    const files = await Promise.all(
      result.filePaths.map(async (filePath) => {
        const buffer = await fs.readFile(filePath);
        const name = path.basename(filePath);
        const ext = path.extname(filePath).toLowerCase();
        
        return {
          name,
          path: filePath,
          data: buffer.toString('base64'),
          size: buffer.length,
          type: getMimeType(ext)
        };
      })
    );
    
    return { canceled: false, files };
  }

  return { canceled: true, files: [] };
});

// Save file dialog
ipcMain.handle('dialog:saveFile', async (event, options = {}) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: options.defaultPath || 'converted-file',
    filters: options.filters || [
      { name: 'All Files', extensions: ['*'] }
    ]
  });

  return result;
});

// Save file with content
ipcMain.handle('file:save', async (event, { filePath, data, encoding = 'base64' }) => {
  try {
    const buffer = Buffer.from(data, encoding);
    await fs.writeFile(filePath, buffer);
    return { success: true, path: filePath };
  } catch (error) {
    console.error('Error saving file:', error);
    return { success: false, error: error.message };
  }
});

// Open file in system default app
ipcMain.handle('shell:openPath', async (event, filePath) => {
  const error = await shell.openPath(filePath);
  return { success: !error, error };
});

// Open external URL
ipcMain.handle('shell:openExternal', async (event, url) => {
  await shell.openExternal(url);
  return { success: true };
});

// Get app info
ipcMain.handle('app:getInfo', () => {
  return {
    name: app.getName(),
    version: app.getVersion(),
    platform: process.platform,
    arch: process.arch,
    isDev
  };
});

// Show notification
ipcMain.handle('notification:show', (event, { title, body }) => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('notification', { title, body });
  }
  return { success: true };
});

// Theme management
ipcMain.handle('theme:get', () => {
  return nativeTheme.shouldUseDarkColors ? 'dark' : 'light';
});

ipcMain.handle('theme:set', (event, theme) => {
  nativeTheme.themeSource = theme;
  return { success: true };
});

/**
 * Helper function to get MIME type from extension
 */
function getMimeType(ext) {
  const mimeTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.bmp': 'image/bmp',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.mp4': 'video/mp4',
    '.avi': 'video/x-msvideo',
    '.mov': 'video/quicktime',
    '.webm': 'video/webm',
    '.mkv': 'video/x-matroska',
    '.pdf': 'application/pdf',
    '.md': 'text/markdown'
  };

  return mimeTypes[ext] || 'application/octet-stream';
}

/**
 * App Event Handlers
 */

app.whenReady().then(async () => {
  try {
    // Start backend server
    await startBackend();
    
    // Create main window
    createWindow();
    
    // Create system tray (Windows only)
    createTray();

    // macOS specific - recreate window when dock icon is clicked
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  } catch (error) {
    console.error('Failed to start application:', error);
    dialog.showErrorBox('Startup Error', `Failed to start the application:\n\n${error.message}`);
    app.quit();
  }
});

// Quit when all windows are closed (except macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Cleanup before quitting
app.on('before-quit', () => {
  stopBackend();
});

// Handle shutdown
app.on('will-quit', () => {
  stopBackend();
});

// Prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

// Security: Disable navigation to external sites
app.on('web-contents-created', (event, contents) => {
  contents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    
    // Allow localhost in dev mode
    if (isDev && parsedUrl.host === 'localhost:3001') {
      return;
    }
    
    // Prevent navigation to external sites
    if (parsedUrl.protocol !== 'file:') {
      event.preventDefault();
    }
  });
});
