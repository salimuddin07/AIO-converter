/**
 * SIMPLE ELECTRON MAIN PROCESS
 * Pure desktop app - NO backend server, NO Express
 * All processing happens directly in Electron main process
 */

const { app, BrowserWindow, ipcMain, dialog, Menu, shell } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs');

// Import processing libraries directly
let sharp, ffmpeg, Canvas;

// Try to load libraries (with fallbacks)
try {
  sharp = require('sharp');
} catch (e) {
  console.log('Sharp not available:', e.message);
}

try {
  const ffmpegPath = require('ffmpeg-static');
  const ffmpeg_lib = require('fluent-ffmpeg');
  ffmpeg_lib.setFfmpegPath(ffmpegPath);
  ffmpeg = ffmpeg_lib;
} catch (e) {
  console.log('FFmpeg not available:', e.message);
}

try {
  Canvas = require('canvas');
} catch (e) {
  console.log('Canvas not available:', e.message);
}

// Define temp directory for file operations
const tempDir = path.join(__dirname, '../temp');

let mainWindow = null;
const isDev = process.env.NODE_ENV === 'development'; // Normal dev mode detection

/**
 * Create the main application window
 */
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    icon: path.join(__dirname, '../build/icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true,
    },
    backgroundColor: '#1a1a2e',
    show: false,
    autoHideMenuBar: false,
  });

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    if (isDev) {
      mainWindow.webContents.openDevTools();
    }
  });

  // Load the app - ALWAYS use built version for desktop app
  const startURL = `file://${path.join(__dirname, '../frontend/dist/index.html')}`;
  
  console.log('Loading app from:', startURL);
  mainWindow.loadURL(startURL);

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  createMenu();

  mainWindow.on('closed', () => {
    mainWindow = null;
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
          click: async () => {
            const result = await dialog.showOpenDialog(mainWindow, {
              properties: ['openFile', 'multiSelections'],
              filters: [
                { name: 'All Files', extensions: ['*'] },
                { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'] },
                { name: 'Videos', extensions: ['mp4', 'avi', 'mov', 'webm', 'mkv'] }
              ]
            });
            if (!result.canceled) {
              mainWindow.webContents.send('files-selected', result.filePaths);
            }
          }
        },
        { type: 'separator' },
        { role: 'quit' }
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
        { role: 'paste' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About AIO Converter',
              message: 'AIO Converter',
              detail: `Version: ${app.getVersion()}\n\nA local media converter\nCreated by Salimuddin`
            });
          }
        }
      ]
    }
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

/**
 * IPC HANDLERS - Direct file processing
 */

// Get file info
ipcMain.handle('get-file-info', async (event, filePath) => {
  try {
    const stats = await fs.stat(filePath);
    const ext = path.extname(filePath).toLowerCase();
    
    return {
      name: path.basename(filePath),
      size: stats.size,
      path: filePath,
      ext: ext
    };
  } catch (error) {
    throw new Error(`Failed to get file info: ${error.message}`);
  }
});

// Read file
ipcMain.handle('read-file', async (event, filePath) => {
  try {
    const buffer = await fs.readFile(filePath);
    return buffer.toString('base64');
  } catch (error) {
    throw new Error(`Failed to read file: ${error.message}`);
  }
});

// Write file
ipcMain.handle('write-file', async (event, { filePath, data, encoding = 'base64' }) => {
  try {
    console.log('💾 Writing file:', filePath);
    
    // Ensure the file path is safe and in a writable location
    const safeFilePath = path.resolve(process.cwd(), 'temp', path.basename(filePath));
    
    // Create temp directory if it doesn't exist
    const tempDir = path.dirname(safeFilePath);
    await fs.mkdir(tempDir, { recursive: true });
    
    // Handle different data types
    let buffer;
    if (data instanceof ArrayBuffer) {
      buffer = Buffer.from(data);
    } else if (Buffer.isBuffer(data)) {
      buffer = data;
    } else if (typeof data === 'string') {
      buffer = Buffer.from(data, encoding);
    } else {
      // Assume it's already a buffer-like object
      buffer = Buffer.from(data);
    }
    
    await fs.writeFile(safeFilePath, buffer);
    
    console.log('✅ File written successfully:', safeFilePath);
    return { 
      success: true, 
      filePath: safeFilePath,
      size: buffer.length 
    };
  } catch (error) {
    console.error('❌ File write failed:', error);
    throw new Error(`Failed to write file: ${error.message}`);
  }
});

// Copy file
ipcMain.handle('copy-file', async (event, { sourcePath, destPath }) => {
  try {
    console.log('📁 Copying file from:', sourcePath, 'to:', destPath);
    
    // Check if source file exists
    const sourceExists = fsSync.existsSync(sourcePath);
    if (!sourceExists) {
      throw new Error(`Source file does not exist: ${sourcePath}`);
    }
    
    // Ensure destination directory exists
    const destDir = path.dirname(destPath);
    await fs.mkdir(destDir, { recursive: true });
    
    // Copy the file
    await fs.copyFile(sourcePath, destPath);
    
    console.log('✅ File copied successfully to:', destPath);
    return { 
      success: true, 
      sourcePath: sourcePath,
      destPath: destPath 
    };
  } catch (error) {
    console.error('❌ File copy failed:', error);
    throw new Error(`Failed to copy file: ${error.message}`);
  }
});

// Convert image using Sharp
ipcMain.handle('convert-image', async (event, { inputPath, outputPath, format, options = {} }) => {
  if (!sharp) {
    throw new Error('Sharp library not available');
  }

  try {
    let pipeline = sharp(inputPath);

    // Resize if specified
    if (options.width || options.height) {
      pipeline = pipeline.resize(options.width, options.height, {
        fit: options.fit || 'inside',
        withoutEnlargement: true
      });
    }

    // Convert to target format
    switch (format.toLowerCase()) {
      case 'jpg':
      case 'jpeg':
        pipeline = pipeline.jpeg({ quality: options.quality || 80 });
        break;
      case 'png':
        pipeline = pipeline.png({ compressionLevel: options.compression || 6 });
        break;
      case 'webp':
        pipeline = pipeline.webp({ quality: options.quality || 80 });
        break;
      case 'gif':
        pipeline = pipeline.gif();
        break;
      default:
        pipeline = pipeline.toFormat(format);
    }

    await pipeline.toFile(outputPath);

    return {
      success: true,
      outputPath: outputPath,
      message: 'Image converted successfully'
    };
  } catch (error) {
    throw new Error(`Image conversion failed: ${error.message}`);
  }
});

// Convert video using FFmpeg
ipcMain.handle('convert-video', async (event, { inputPath, outputPath, format, options = {} }) => {
  if (!ffmpeg) {
    throw new Error('FFmpeg not available');
  }

  return new Promise((resolve, reject) => {
    let command = ffmpeg(inputPath);

    // Set output format
    command = command.toFormat(format);

    // Apply options
    if (options.videoBitrate) {
      command = command.videoBitrate(options.videoBitrate);
    }
    if (options.size) {
      command = command.size(options.size);
    }

    command
      .on('end', () => {
        resolve({
          success: true,
          outputPath: outputPath,
          message: 'Video converted successfully'
        });
      })
      .on('error', (err) => {
        reject(new Error(`Video conversion failed: ${err.message}`));
      })
      .save(outputPath);
  });
});

// Open file dialog
ipcMain.handle('dialog:open', async (event, options) => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile', 'multiSelections'],
    ...options
  });
  return result;
});

// Save file dialog
ipcMain.handle('dialog:save', async (event, options) => {
  const result = await dialog.showSaveDialog(mainWindow, options);
  return result;
});

// Show message
ipcMain.handle('dialog:message', async (event, options) => {
  const result = await dialog.showMessageBox(mainWindow, options);
  return result;
});

// Open in default app
ipcMain.handle('shell:open', async (event, path) => {
  await shell.openPath(path);
  return { success: true };
});

// Create GIF from multiple images
ipcMain.handle('create-gif-from-images', async (event, { inputPaths, outputPath, options = {} }) => {
  console.log('🎬 GIF Creation Request:', { inputPaths, outputPath, options });
  
  try {
    console.log('🎬 Creating GIF from', inputPaths?.length || 0, 'images');
    
    if (!inputPaths || inputPaths.length === 0) {
      throw new Error('No input images provided');
    }

    // Validate input paths
    for (const imagePath of inputPaths) {
      if (!imagePath || typeof imagePath !== 'string') {
        throw new Error(`Invalid input path: ${imagePath}`);
      }
      
      // Check if file exists
      const exists = fsSync.existsSync(imagePath);
      if (!exists) {
        throw new Error(`File does not exist: ${imagePath}`);
      }
    }

    // Create output path
    const outputFilePath = path.isAbsolute(outputPath) ? outputPath : path.join(tempDir, outputPath);
    
    // Ensure output directory exists
    const outputDir = path.dirname(outputFilePath);
    await fs.mkdir(outputDir, { recursive: true });

    console.log('🎬 Using Sharp + GIF Encoder for reliable GIF creation...');
    
    try {
      // Load GIF encoder
      const GIFEncoder = require('gif-encoder-2');
      
      // Create GIF encoder with specified dimensions
      const width = options.width || 500;
      const height = options.height || 300;
      const encoder = new GIFEncoder(width, height);
      
      // Set GIF options
      encoder.setRepeat(options.loop !== false ? 0 : -1); // 0 = infinite loop
      encoder.setDelay(Math.round(1000 / (options.fps || 2))); // delay in ms
      encoder.setQuality(10); // lower is better quality
      
      // Start encoding
      encoder.start();
      
      // Process each image
      for (let i = 0; i < inputPaths.length; i++) {
        const imagePath = inputPaths[i];
        console.log(`🖼️ Processing image ${i + 1}/${inputPaths.length}: ${path.basename(imagePath)}`);
        
        try {
          // Use Sharp to resize and convert to buffer
          const imageBuffer = await sharp(imagePath)
            .resize(width, height, {
              fit: 'inside',
              background: { r: 255, g: 255, b: 255, alpha: 1 }
            })
            .raw()
            .ensureAlpha()
            .toBuffer({ resolveWithObject: true });
          
          // Add frame to GIF
          encoder.addFrame(imageBuffer.data);
          
        } catch (err) {
          console.error(`❌ Error processing image ${imagePath}:`, err.message);
          throw new Error(`Failed to process image ${path.basename(imagePath)}: ${err.message}`);
        }
      }
      
      // Finish encoding
      encoder.finish();
      
      // Get the GIF buffer
      const gifBuffer = encoder.out.getData();
      
      // Write to output file
      await fs.writeFile(outputFilePath, gifBuffer);
      
      console.log('✅ GIF creation completed successfully using Sharp + GIF Encoder');
      
      return {
        success: true,
        outputPath: outputFilePath,
        url: outputFilePath,
        dataUrl: `file://${outputFilePath}`,
        filename: path.basename(outputFilePath),
        frameCount: inputPaths.length,
        message: 'GIF created successfully using Sharp + GIF Encoder'
      };
      
    } catch (innerError) {
      console.error('❌ GIF encoding failed:', innerError);
      throw new Error(`GIF creation failed: ${innerError.message}`);
    }

  } catch (error) {
    console.error('❌ GIF creation failed:', error);
    throw new Error(`GIF creation failed: ${error.message}`);
  }
});

// Split GIF into frames
ipcMain.handle('split-gif', async (event, { inputPath, options = {} }) => {
  try {
    console.log('✂️ Splitting GIF:', inputPath);
    
    const inputFilePath = path.isAbsolute(inputPath) ? inputPath : path.join(tempDir, inputPath);
    
    if (!fs.existsSync(inputFilePath)) {
      throw new Error(`Input GIF file not found: ${inputFilePath}`);
    }
    
    // Create output directory for frames
    const outputDir = path.join(tempDir, `gif_frames_${Date.now()}`);
    await fs.promises.mkdir(outputDir, { recursive: true });
    
    // Use Sharp to extract frames from GIF
    const outputPattern = path.join(outputDir, 'frame_%03d.png');
    
    // For now, return a placeholder result
    // TODO: Implement actual GIF splitting logic
    return {
      success: true,
      frames: [],
      outputDir: outputDir,
      message: 'GIF splitting feature coming soon in desktop mode'
    };
    
  } catch (error) {
    console.error('❌ GIF splitting failed:', error);
    throw new Error(`GIF splitting failed: ${error.message}`);
  }
});

// Split video into segments
ipcMain.handle('split-video', async (event, { inputPath, options = {} }) => {
  try {
    console.log('✂️ Splitting video:', inputPath);
    
    const inputFilePath = path.isAbsolute(inputPath) ? inputPath : path.join(tempDir, inputPath);
    
    if (!fs.existsSync(inputFilePath)) {
      throw new Error(`Input video file not found: ${inputFilePath}`);
    }
    
    // Create output directory for segments
    const outputDir = path.join(tempDir, `video_segments_${Date.now()}`);
    await fs.promises.mkdir(outputDir, { recursive: true });
    
    // For now, return a placeholder result
    // TODO: Implement actual video splitting logic using FFmpeg
    return {
      success: true,
      segments: [],
      outputDir: outputDir,
      message: 'Video splitting feature coming soon in desktop mode'
    };
    
  } catch (error) {
    console.error('❌ Video splitting failed:', error);
    throw new Error(`Video splitting failed: ${error.message}`);
  }
});

// Get app info
ipcMain.handle('app:info', () => {
  return {
    name: app.getName(),
    version: app.getVersion(),
    platform: process.platform
  };
});

/**
 * App lifecycle
 */

app.whenReady().then(async () => {
  // Create temp directory if it doesn't exist
  try {
    await fs.mkdir(tempDir, { recursive: true });
    console.log('✅ Temp directory ready:', tempDir);
  } catch (error) {
    console.error('❌ Failed to create temp directory:', error);
  }
  
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Single instance
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

console.log('✅ AIO Converter Desktop App Started');
console.log('📦 Running in:', isDev ? 'DEVELOPMENT' : 'PRODUCTION', 'mode');
console.log('🔧 Sharp available:', !!sharp);
console.log('🎬 FFmpeg available:', !!ffmpeg);
console.log('🎨 Canvas available:', !!Canvas);
