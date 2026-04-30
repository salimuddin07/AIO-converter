/**
 * SIMPLE ELECTRON MAIN PROCESS
 * Pure desktop app - NO backend server, NO Express
 * All processing happens directly in Electron main process
 */

const { app, BrowserWindow, ipcMain, dialog, Menu, shell } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs');
const archiver = require('archiver'); // For ZIP creation
const os = require('os'); // For getting Downloads folder

// Import processing libraries directly
let sharp, ffmpeg, Canvas, pdfParse;

// Try to load libraries (with fallbacks)
try {
  sharp = require('sharp');
} catch (e) {
  console.log('Sharp not available:', e.message);
}

try {
  pdfParse = require('pdf-parse');
  console.log('📄 PDF-Parse loaded successfully');
} catch (e) {
  console.log('PDF-Parse not available:', e.message);
}

try {
  let ffmpegPath;
  
  // Check if we're in a packaged app
  if (app.isPackaged) {
    // For packaged apps, FFmpeg should be in the app directory (no-asar build)
    ffmpegPath = path.join(__dirname, '..', 'node_modules', 'ffmpeg-static', 'ffmpeg.exe');
    
    // Check if the binary exists
    if (!fsSync.existsSync(ffmpegPath)) {
      // Try alternative paths
      const altPaths = [
        path.join(process.resourcesPath, 'app', 'node_modules', 'ffmpeg-static', 'ffmpeg.exe'),
        path.join(path.dirname(process.execPath), 'resources', 'app', 'node_modules', 'ffmpeg-static', 'ffmpeg.exe'),
        path.join(__dirname, 'node_modules', 'ffmpeg-static', 'ffmpeg.exe')
      ];
      
      for (const altPath of altPaths) {
        if (fsSync.existsSync(altPath)) {
          ffmpegPath = altPath;
          break;
        }
      }
      
      // Final fallback - use the original path from ffmpeg-static
      if (!fsSync.existsSync(ffmpegPath)) {
        ffmpegPath = require('ffmpeg-static');
      }
    }
  } else {
    // For development, use the normal ffmpeg-static path
    ffmpegPath = require('ffmpeg-static');
  }
  
  const ffmpeg_lib = require('fluent-ffmpeg');
  ffmpeg_lib.setFfmpegPath(ffmpegPath);
  ffmpeg = ffmpeg_lib;
  
  console.log('🎬 FFmpeg path:', ffmpegPath);
  console.log('🎬 FFmpeg exists:', fsSync.existsSync(ffmpegPath));
} catch (e) {
  console.log('FFmpeg not available:', e.message);
}

try {
  Canvas = require('canvas');
} catch (e) {
  console.log('Canvas not available:', e.message);
}

// Define temp directory for file operations - will be set when app is ready
let tempDir;

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
      webSecurity: true, // Enable web security for production
      allowRunningInsecureContent: false,
      experimentalFeatures: false,
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
    const safeFilePath = path.resolve(tempDir, path.basename(filePath));
    
    // Create temp directory if it doesn't exist
    const tempDirPath = path.dirname(safeFilePath);
    await fs.mkdir(tempDirPath, { recursive: true });
    
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

  try {
    const outputFilePath = path.isAbsolute(outputPath) ? outputPath : path.join(tempDir, outputPath);
    
    // Ensure output directory exists
    await fs.mkdir(path.dirname(outputFilePath), { recursive: true });

    console.log('🎥 Converting video:', inputPath, 'to', format);
    console.log('📁 Output path:', outputFilePath);
    console.log('⚙️ Options:', options);

    return new Promise((resolve, reject) => {
      let command = ffmpeg(inputPath);

      // Handle GIF conversion specially
      if (format.toLowerCase() === 'gif') {
        console.log('🎞️ Converting to GIF format');
        
        // Apply timing options first
        if (options.startTime !== undefined) {
          command = command.seekInput(options.startTime);
        }
        if (options.duration !== undefined) {
          command = command.duration(options.duration);
        }

        const fps = options.fps || 10;
        const width = options.width || 480;

        // Two-pass palette GIF using a single filter_complex string.
        // split → palettegen → paletteuse produces a full-colour, properly-sized GIF.
        const filterComplex =
          `[0:v]fps=${fps},scale=${width}:-2:flags=lanczos,split[s0][s1];` +
          `[s0]palettegen=reserve_transparent=0[p];` +
          `[s1][p]paletteuse=dither=bayer:bayer_scale=5[out]`;

        command = command
          .complexFilter(filterComplex)
          .outputOptions(['-map [out]', '-y'])
          .toFormat('gif');
      } else {
        // Regular video conversion
        command = command.toFormat(format);
        
        // Apply timing options
        if (options.startTime !== undefined) {
          command = command.seekInput(options.startTime);
        }
        if (options.duration !== undefined) {
          command = command.duration(options.duration);
        }

        // Apply other options
        if (options.videoBitrate) {
          command = command.videoBitrate(options.videoBitrate);
        }
        if (options.width && options.height) {
          command = command.size(`${options.width}x${options.height}`);
        }
      }

      command
        .on('start', (commandLine) => {
          console.log('🚀 FFmpeg command:', commandLine);
        })
        .on('progress', (progress) => {
          console.log('📊 Progress:', Math.round(progress.percent || 0) + '% done');
        })
        .on('end', async () => {
          try {
            console.log('✅ Video conversion completed');
            
            // Verify file exists and get stats
            const stats = await fs.stat(outputFilePath);
            
            resolve({
              success: true,
              outputPath: outputFilePath,
              filename: path.basename(outputFilePath),
              size: stats.size,
              format: format,
              message: `Video converted to ${format.toUpperCase()} successfully`
            });
          } catch (error) {
            reject(new Error(`Conversion completed but failed to verify output: ${error.message}`));
          }
        })
        .on('error', (err) => {
          console.error('❌ FFmpeg error:', err);
          reject(new Error(`Video conversion failed: ${err.message}`));
        })
        .save(outputFilePath);
    });
  } catch (error) {
    console.error('❌ Video conversion setup failed:', error);
    throw new Error(`Video conversion failed: ${error.message}`);
  }
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

// Show item in folder (highlights the file in explorer)
ipcMain.handle('shell:showItemInFolder', async (event, path) => {
  shell.showItemInFolder(path);
  return { success: true };
});

// Get Downloads folder path
function getDownloadsFolder() {
  return path.join(os.homedir(), 'Downloads');
}

// Direct download to Downloads folder
ipcMain.handle('download:direct', async (event, { data, filename, showProgress = true }) => {
  try {
    const downloadsPath = getDownloadsFolder();
    
    // Ensure Downloads folder exists
    await fs.mkdir(downloadsPath, { recursive: true });
    
    // Generate unique filename if file already exists
    let finalFilename = filename;
    let counter = 1;
    const ext = path.extname(filename);
    const name = path.basename(filename, ext);
    
    while (fsSync.existsSync(path.join(downloadsPath, finalFilename))) {
      finalFilename = `${name} (${counter})${ext}`;
      counter++;
    }
    
    const filePath = path.join(downloadsPath, finalFilename);
    
    // Emit progress start
    if (showProgress) {
      event.sender.send('download:progress', { status: 'starting', filename: finalFilename });
    }
    
    // Write file with progress simulation
    if (data instanceof ArrayBuffer) {
      await fs.writeFile(filePath, Buffer.from(data));
    } else if (Buffer.isBuffer(data)) {
      await fs.writeFile(filePath, data);
    } else if (typeof data === 'string') {
      // Handle base64 data URLs
      if (data.startsWith('data:')) {
        const base64 = data.split(',')[1];
        const buffer = Buffer.from(base64, 'base64');
        await fs.writeFile(filePath, buffer);
      } else {
        // Regular string content
        await fs.writeFile(filePath, data, 'utf8');
      }
    } else {
      throw new Error('Unsupported data type for download');
    }
    
    // Emit progress complete
    if (showProgress) {
      event.sender.send('download:progress', { 
        status: 'complete', 
        filename: finalFilename,
        filePath: filePath 
      });
    }
    
    return {
      success: true,
      filePath: filePath,
      filename: finalFilename,
      message: `File downloaded to Downloads folder`
    };
    
  } catch (error) {
    console.error('❌ Direct download failed:', error);
    
    if (showProgress) {
      event.sender.send('download:progress', { 
        status: 'error', 
        filename: filename,
        error: error.message 
      });
    }
    
    return {
      success: false,
      message: `Download failed: ${error.message}`
    };
  }
});

// Copy file directly to Downloads folder
ipcMain.handle('download:copyToDownloads', async (event, { sourcePath, filename, showProgress = true }) => {
  try {
    const downloadsPath = getDownloadsFolder();
    
    // Ensure Downloads folder exists
    await fs.mkdir(downloadsPath, { recursive: true });
    
    // Generate unique filename if file already exists
    let finalFilename = filename;
    let counter = 1;
    const ext = path.extname(filename);
    const name = path.basename(filename, ext);
    
    while (fsSync.existsSync(path.join(downloadsPath, finalFilename))) {
      finalFilename = `${name} (${counter})${ext}`;
      counter++;
    }
    
    const destPath = path.join(downloadsPath, finalFilename);
    
    // Emit progress start
    if (showProgress) {
      event.sender.send('download:progress', { status: 'starting', filename: finalFilename });
    }
    
    // Copy file
    await fs.copyFile(sourcePath, destPath);
    
    // Emit progress complete
    if (showProgress) {
      event.sender.send('download:progress', { 
        status: 'complete', 
        filename: finalFilename,
        filePath: destPath 
      });
    }
    
    return {
      success: true,
      filePath: destPath,
      filename: finalFilename,
      message: `File downloaded to Downloads folder`
    };
    
  } catch (error) {
    console.error('❌ Copy to Downloads failed:', error);
    
    if (showProgress) {
      event.sender.send('download:progress', { 
        status: 'error', 
        filename: filename,
        error: error.message 
      });
    }
    
    return {
      success: false,
      message: `Download failed: ${error.message}`
    };
  }
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
      
      // Create GIF encoder with specified dimensions - ensure numbers
      const width = options.width ? parseInt(options.width) : 500;
      const height = options.height ? parseInt(options.height) : 300;
      const encoder = new GIFEncoder(width, height);
      
      console.log('🎬 GIF dimensions:', { width, height, originalOptions: { width: options.width, height: options.height } });
      
      // Set GIF options
      encoder.setRepeat(options.loop !== false ? 0 : -1); // 0 = infinite loop
      encoder.setQuality(10); // lower is better quality
      
      // Determine delay strategy
      const frameDelays = options.frameDelays; // Array of individual delays
      const globalDelay = options.delay || options.frameDelay || Math.round(1000 / (options.fps || 10));
      
      console.log('🎬 Delay configuration:', {
        frameDelays: frameDelays ? `Array of ${frameDelays.length} delays` : 'None',
        globalDelay: globalDelay,
        fps: options.fps
      });
      
      // Start encoding
      encoder.start();
      
      // Process each image
      for (let i = 0; i < inputPaths.length; i++) {
        const imagePath = inputPaths[i];
        console.log(`🖼️ Processing image ${i + 1}/${inputPaths.length}: ${path.basename(imagePath)}`);
        
        // Determine delay for this frame
        let frameDelay = globalDelay;
        if (frameDelays && frameDelays[i] !== undefined) {
          frameDelay = parseInt(frameDelays[i], 10);
          if (isNaN(frameDelay) || frameDelay < 10) {
            frameDelay = globalDelay;
          }
        }
        
        console.log(`⏱️ Frame ${i + 1} delay: ${frameDelay}ms`);
        
        try {
          // Use Sharp to resize and convert to buffer
          const imageBuffer = await sharp(imagePath)
            .resize(width, height, {
              fit: options.fit || 'inside',
              background: { r: 255, g: 255, b: 255, alpha: 1 }
            })
            .raw()
            .ensureAlpha()
            .toBuffer({ resolveWithObject: true });
          
          // Set delay for this specific frame
          encoder.setDelay(frameDelay);
          
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
      
      // Create proper file:// URL for Windows/cross-platform compatibility
      const normalizedPath = outputFilePath.replace(/\\/g, '/');
      const fileUrl = normalizedPath.startsWith('/') ? `file://${normalizedPath}` : `file:///${normalizedPath}`;
      
      console.log('📁 GIF file created at:', outputFilePath);
      console.log('🔗 File URL:', fileUrl);
      
      return {
        success: true,
        outputPath: outputFilePath,
        url: outputFilePath,
        dataUrl: fileUrl,
        previewUrl: fileUrl,
        downloadUrl: fileUrl,
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
  if (!sharp) {
    throw new Error('Sharp not available');
  }

  try {
    console.log('✂️ Splitting GIF:', inputPath);
    
    const inputFilePath = path.isAbsolute(inputPath) ? inputPath : path.join(tempDir, inputPath);
    
    if (!fsSync.existsSync(inputFilePath)) {
      throw new Error(`Input GIF file not found: ${inputFilePath}`);
    }
    
    // Create output directory for frames
    const outputDir = path.join(tempDir, `gif_split_${Date.now()}`);
    await fs.mkdir(outputDir, { recursive: true });
    
    // Use Sharp to extract frames from GIF
    const gifBuffer = await fs.readFile(inputFilePath);
    const { pages } = await sharp(gifBuffer, { pages: -1 }).metadata();
    
    console.log(`📊 GIF has ${pages} frames to split`);
    
    // Extract each frame
    const frames = [];
    for (let i = 0; i < pages; i++) {
      const frameFilename = `frame_${String(i + 1).padStart(4, '0')}.png`;
      const framePath = path.join(outputDir, frameFilename);
      
      // Extract frame i from the GIF
      await sharp(gifBuffer, { page: i })
        .png()
        .toFile(framePath);
      
      // Generate file URL
      const normalizedPath = framePath.replace(/\\/g, '/');
      const fileUrl = normalizedPath.startsWith('/') ? `file://${normalizedPath}` : `file:///${normalizedPath}`;
      
      frames.push({
        id: i + 1,
        filename: frameFilename,
        path: framePath,
        url: fileUrl,
        downloadUrl: fileUrl,
        size: (await fs.stat(framePath)).size
      });
    }
    
    // Create ZIP if requested
    let zipUrl = null;
    let zipPath = null;
    if (options.createZip && frames.length > 0) {
      const zipFileName = `gif_frames_${Date.now()}.zip`;
      zipPath = path.join(tempDir, zipFileName);
      
      try {
        await new Promise((resolveZip, rejectZip) => {
          const output = fsSync.createWriteStream(zipPath);
          const archive = archiver('zip', { zlib: { level: 9 } });
          
          output.on('close', () => {
            console.log(`📦 ZIP created: ${archive.pointer()} total bytes`);
            resolveZip();
          });
          
          archive.on('error', (err) => {
            console.error('❌ ZIP creation error:', err);
            rejectZip(err);
          });
          
          archive.pipe(output);
          
          // Add all frame files to ZIP
          frames.forEach((frame) => {
            if (fsSync.existsSync(frame.path)) {
              archive.file(frame.path, { name: frame.filename });
              console.log(`📁 Added to ZIP: ${frame.filename}`);
            }
          });
          
          archive.finalize();
        });
        
        const normalizedZipPath = zipPath.replace(/\\/g, '/');
        zipUrl = normalizedZipPath.startsWith('/') ? `file://${normalizedZipPath}` : `file:///${normalizedZipPath}`;
        console.log('📦 ZIP created successfully:', zipPath);
        
      } catch (zipError) {
        console.error('❌ Failed to create ZIP:', zipError);
        // Continue without ZIP if creation fails
      }
    }
    
    console.log('✅ GIF splitting completed');
    
    return {
      success: true,
      frames: frames,
      frameCount: frames.length,
      outputDir: outputDir,
      zipUrl: zipUrl,
      zipPath: zipPath,
      message: `Successfully split GIF into ${frames.length} frames${zipUrl ? ' and created ZIP' : ''}`
    };
    
  } catch (error) {
    console.error('❌ GIF splitting failed:', error);
    throw new Error(`GIF splitting failed: ${error.message}`);
  }
});

// Helper function to parse time string to seconds
function parseTimeToSeconds(timeString) {
  if (typeof timeString === 'number') {
    return timeString; // Already in seconds
  }
  
  if (typeof timeString !== 'string') {
    return NaN;
  }
  
  // Handle formats like "0:30", "1:23", "00:01:30"
  const parts = timeString.split(':').map(part => parseInt(part.trim(), 10));
  
  if (parts.length === 1) {
    // Just seconds: "30"
    return parts[0];
  } else if (parts.length === 2) {
    // Minutes:seconds: "1:30"
    return parts[0] * 60 + parts[1];
  } else if (parts.length === 3) {
    // Hours:minutes:seconds: "01:30:00"
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  
  return NaN;
}

// Split video into segments
ipcMain.handle('split-video', async (event, { inputPath, options = {} }) => {
  try {
    console.log('✂️ Splitting video:', inputPath);
    
    const inputFilePath = path.isAbsolute(inputPath) ? inputPath : path.join(tempDir, inputPath);
    
    if (!fsSync.existsSync(inputFilePath)) {
      throw new Error(`Input video file not found: ${inputFilePath}`);
    }
    
    // Create output directory for segments
    const outputDir = path.join(tempDir, `video_segments_${Date.now()}`);
    await fs.mkdir(outputDir, { recursive: true });
    
    console.log('📁 Output directory created:', outputDir);
    
    // Parse segment options - handle both segmentDuration and custom segments
    let segmentDuration = 30; // Default to 30 seconds (not 10!)
    let customSegments = null;
    
    // Check if custom segments are provided
    if (options.segments && Array.isArray(options.segments) && options.segments.length > 0) {
      customSegments = options.segments;
      console.log('📋 Using custom segments:', customSegments.length, 'segments');
    } else if (options.segmentDuration) {
      // Use provided segment duration
      segmentDuration = Number(options.segmentDuration);
      if (!Number.isFinite(segmentDuration) || segmentDuration <= 0) {
        segmentDuration = 30; // fallback
      }
      console.log('⏱️ Using segment duration:', segmentDuration, 'seconds');
    }
    
    // Default options for video splitting
    const splitOptions = {
      segmentDuration,
      customSegments,
      format: options.format || 'mp4',
      quality: options.quality || 'medium'
    };
    
    console.log('⚙️ Split options:', splitOptions);
    
    // Use FFmpeg to split the video
    if (!ffmpeg) {
      throw new Error('FFmpeg is not available for video splitting');
    }
    
    return new Promise(async (resolve, reject) => {
      try {
        const segments = [];
        
        console.log('🎬 Starting FFmpeg video splitting...');
        
        if (splitOptions.customSegments) {
          // Handle custom segments with specific start/end times
          console.log('📋 Processing custom segments...');
          
          // Check if user wants auto-segmentation (single large segment that should be split)
          if (splitOptions.customSegments.length === 1) {
            const singleSegment = splitOptions.customSegments[0];
            const startTime = parseTimeToSeconds(singleSegment.startTime);
            const endTime = parseTimeToSeconds(singleSegment.endTime);
            const totalDuration = endTime - startTime;
            
            // If the segment is longer than the default duration, auto-split it
            const autoSegmentDuration = splitOptions.segmentDuration || 30;
            if (totalDuration > autoSegmentDuration) {
              console.log(`📏 Large segment detected: ${totalDuration}s duration`);
              console.log(`Large segment detected - use equal-length splitting instead`);
            }
          }
          
          for (let i = 0; i < splitOptions.customSegments.length; i++) {
            const segment = splitOptions.customSegments[i];
            const outputFileName = `${segment.name || `segment_${i + 1}`}.mp4`;
            const outputPath = path.join(outputDir, outputFileName);
            
            console.log(`📹 Creating segment ${i + 1}:`, segment.name || `segment_${i + 1}`, 
                       `(${segment.startTime}s to ${segment.endTime}s)`);
            
            await new Promise((resolveSegment, rejectSegment) => {
              // Validate and parse segment data
              const startTime = parseTimeToSeconds(segment.startTime);
              const endTime = parseTimeToSeconds(segment.endTime);
              
              if (!Number.isFinite(startTime) || !Number.isFinite(endTime)) {
                rejectSegment(new Error(`Invalid segment times: start=${segment.startTime} (parsed: ${startTime}), end=${segment.endTime} (parsed: ${endTime})`));
                return;
              }
              
              const duration = endTime - startTime;
              
              if (duration <= 0) {
                rejectSegment(new Error(`Invalid segment duration: ${duration} seconds (start: ${startTime}s, end: ${endTime}s)`));
                return;
              }
              
              console.log(`📹 Validated segment ${i + 1}: ${startTime}s to ${endTime}s (${duration}s duration)`);
              
              ffmpeg(inputFilePath)
                .seekInput(startTime)
                .duration(duration)
                .outputOptions([
                  '-c:v', 'copy', // Copy video without re-encoding
                  '-c:a', 'aac', // Re-encode audio to ensure compatibility
                  '-avoid_negative_ts', 'make_zero'
                ])
                .output(outputPath)
                .on('start', (commandLine) => {
                  console.log(`🚀 FFmpeg command for segment ${i + 1}:`, commandLine);
                })
                .on('end', async () => {
                  try {
                    const stats = await fs.stat(outputPath);
                    const normalizedPath = outputPath.replace(/\\/g, '/');
                    const fileUrl = normalizedPath.startsWith('/') ? `file://${normalizedPath}` : `file:///${normalizedPath}`;
                    
                    segments.push({
                      name: segment.name || `segment_${i + 1}`,
                      filename: outputFileName,
                      path: outputPath,
                      url: fileUrl,
                      dataUrl: fileUrl,
                      previewUrl: fileUrl,
                      downloadUrl: fileUrl,
                      size: stats.size,
                      startTime: startTime,
                      endTime: endTime,
                      duration: duration
                    });
                    
                    console.log(`✅ Completed segment ${i + 1}: ${outputFileName}`);
                    resolveSegment();
                  } catch (error) {
                    rejectSegment(new Error(`Failed to get segment stats: ${error.message}`));
                  }
                })
                .on('error', (error) => {
                  console.error(`❌ Error creating segment ${i + 1}:`, error);
                  rejectSegment(new Error(`FFmpeg error for segment ${i + 1}: ${error.message}`));
                })
                .run();
            });
          }
          
          console.log('✅ All custom segments completed!');
          
        } else {
          // Handle duration-based splitting (equal-length segments)
          console.log('⏱️ Processing duration-based segments...');
          
          await new Promise((resolveFFmpeg, rejectFFmpeg) => {
            const command = ffmpeg(inputFilePath)
              .outputOptions([
                '-c:v', 'copy', // Copy video without re-encoding for speed
                '-c:a', 'aac', // Re-encode audio to ensure compatibility
                '-map', '0',
                '-segment_time', splitOptions.segmentDuration.toString(),
                '-f', 'segment',
                '-reset_timestamps', '1'
              ])
              .output(path.join(outputDir, 'segment_%03d.mp4'))
              .on('start', (commandLine) => {
                console.log('🚀 FFmpeg command:', commandLine);
              })
              .on('progress', (progress) => {
                console.log('📊 Processing: ' + Math.round(progress.percent || 0) + '% done');
              })
              .on('stderr', (stderrLine) => {
                console.log('📄 FFmpeg log:', stderrLine);
              })
              .on('end', async () => {
                console.log('✅ Video splitting completed!');
                
                try {
                  // Read the output directory to get actual segment files
                  const files = await fs.readdir(outputDir);
                  const segmentFiles = files
                    .filter(file => file.startsWith('segment_') && file.endsWith('.mp4'))
                    .sort();
                  
                  console.log('📁 Created segments:', segmentFiles);
                  
                  // Build segment info
                  for (let i = 0; i < segmentFiles.length; i++) {
                    const file = segmentFiles[i];
                    const segmentPath = path.join(outputDir, file);
                    const stats = await fs.stat(segmentPath);
                    
                    // Create proper file:// URL
                    const normalizedPath = segmentPath.replace(/\\/g, '/');
                    const fileUrl = normalizedPath.startsWith('/') ? `file://${normalizedPath}` : `file:///${normalizedPath}`;
                    
                    segments.push({
                      name: `segment_${i + 1}`,
                      filename: file,
                      path: segmentPath,
                      url: fileUrl,
                      dataUrl: fileUrl,
                      previewUrl: fileUrl,
                      downloadUrl: fileUrl,
                      size: stats.size,
                      startTime: i * splitOptions.segmentDuration,
                      endTime: (i + 1) * splitOptions.segmentDuration,
                      duration: splitOptions.segmentDuration // approximate
                    });
                  }
                  
                  console.log('📊 Final segments array:', segments.length, 'items');
                  console.log('📊 Sample segment:', segments[0]);
                  
                  // Resolve the FFmpeg promise after building segments
                  resolveFFmpeg();
                  
                } catch (readError) {
                  rejectFFmpeg(new Error(`Failed to read split segments: ${readError.message}`));
                }
              })
              .on('error', (err) => {
                console.error('❌ FFmpeg error:', err);
                rejectFFmpeg(new Error(`Video splitting failed: ${err.message}`));
              })
              .run(); // Start the FFmpeg process
          });
        }
        
        // Create ZIP if requested
        let zipUrl = null;
        let zipPath = null;
        if (options.createZip && segments.length > 0) {
          const zipFileName = `video_segments_${Date.now()}.zip`;
          zipPath = path.join(tempDir, zipFileName);
          
          try {
            await new Promise((resolveZip, rejectZip) => {
              const output = fsSync.createWriteStream(zipPath);
              const archive = archiver('zip', { zlib: { level: 9 } });
              
              output.on('close', () => {
                console.log(`📦 ZIP created: ${archive.pointer()} total bytes`);
                resolveZip();
              });
              
              archive.on('warning', (err) => {
                if (err.code === 'ENOENT') {
                  console.warn('⚠️ ZIP warning:', err);
                } else {
                  console.error('❌ ZIP creation error:', err);
                  rejectZip(err);
                }
              });
              
              archive.on('error', (err) => {
                console.error('❌ ZIP creation error:', err);
                rejectZip(err);
              });
              
              archive.pipe(output);
              
              // Add all segment files to ZIP
              for (const segment of segments) {
                if (fsSync.existsSync(segment.path)) {
                  archive.file(segment.path, { name: segment.filename });
                  console.log(`📁 Added to ZIP: ${segment.filename}`);
                }
              }
              
              archive.finalize();
            });
            
            // Create file URL for the ZIP
            const normalizedZipPath = zipPath.replace(/\\/g, '/');
            zipUrl = normalizedZipPath.startsWith('/') ? `file://${normalizedZipPath}` : `file:///${normalizedZipPath}`;
            console.log('📦 ZIP created successfully:', zipPath);
            
          } catch (zipError) {
            console.error('❌ Failed to create ZIP:', zipError);
            // Continue without ZIP if creation fails
          }
        }
        
        const result = {
          success: true,
          segments: segments,
          outputDir: outputDir,
          segmentCount: segments.length,
          zipUrl: zipUrl,
          zipPath: zipPath,
          message: `Video successfully split into ${segments.length} segments`
        };
        
        console.log('📤 Returning result with', segments.length, 'segments');
        console.log('📤 Sample segment structure:', segments[0]);
        console.log('📤 All segment files exist:', segments.map(s => ({ name: s.name, exists: require('fs').existsSync(s.path) })));
        resolve(result);
        
      } catch (error) {
        console.error('❌ Error in video splitting:', error);
        reject(new Error(`Video splitting failed: ${error.message}`));
      }
    });
    
  } catch (error) {
    console.error('❌ Video splitting failed:', error);
    throw new Error(`Video splitting failed: ${error.message}`);
  }
});

// Create GIF from video
ipcMain.handle('createGifFromVideo', async (event, { inputPath, outputPath, options = {} }) => {
  console.log('🎬 Creating GIF from video:', inputPath);
  
  try {
    if (!ffmpeg) {
      throw new Error('FFmpeg not available');
    }

    const outputFilePath = path.isAbsolute(outputPath) ? outputPath : path.join(tempDir, outputPath);
    
    // Ensure output directory exists
    const outputDir = path.dirname(outputFilePath);
    await fs.mkdir(outputDir, { recursive: true });

    return new Promise(async (resolve, reject) => {
      let command = ffmpeg(inputPath);
      
      // Apply options
      if (options.startTime) command = command.seekInput(options.startTime);
      if (options.duration) command = command.duration(options.duration);
      if (options.fps) command = command.fps(options.fps);
      if (options.width && options.height) {
        command = command.size(`${options.width}x${options.height}`);
      }
      
      command
        .output(outputFilePath)
        .on('end', async () => {
          console.log('✅ GIF created from video:', outputFilePath);
          
          try {
            // Get file stats for size info
            const stats = await fs.stat(outputFilePath);
            const filename = path.basename(outputFilePath);
            
            resolve({
              success: true,
              outputPath: outputFilePath,
              filePath: outputFilePath,
              filename: filename,
              size: stats.size,
              url: `file:///${outputFilePath.replace(/\\/g, '/')}`,
              dataUrl: `file:///${outputFilePath.replace(/\\/g, '/')}`,
              previewUrl: `file:///${outputFilePath.replace(/\\/g, '/')}`,
              downloadUrl: `file:///${outputFilePath.replace(/\\/g, '/')}`,
              message: 'GIF created successfully from video'
            });
          } catch (statError) {
            console.error('Error getting file stats:', statError);
            resolve({
              success: true,
              outputPath: outputFilePath,
              filePath: outputFilePath,
              filename: path.basename(outputFilePath),
              url: `file:///${outputFilePath.replace(/\\/g, '/')}`,
              dataUrl: `file:///${outputFilePath.replace(/\\/g, '/')}`,
              previewUrl: `file:///${outputFilePath.replace(/\\/g, '/')}`,
              downloadUrl: `file:///${outputFilePath.replace(/\\/g, '/')}`,
              message: 'GIF created successfully from video'
            });
          }
        })
        .on('error', (error) => {
          console.error('❌ Video to GIF conversion failed:', error);
          reject(new Error(`Video to GIF conversion failed: ${error.message}`));
        })
        .run();
    });
  } catch (error) {
    console.error('❌ Video to GIF conversion error:', error);
    throw new Error(`Video to GIF conversion failed: ${error.message}`);
  }
});

// Convert to WebP
ipcMain.handle('convertToWebp', async (event, { inputPath, options = {} }) => {
  console.log('🔄 Converting to WebP:', inputPath);
  
  try {
    if (!sharp) {
      throw new Error('Sharp not available');
    }

    const inputFilePath = path.isAbsolute(inputPath) ? inputPath : path.join(tempDir, inputPath);
    const outputPath = path.join(tempDir, `converted_webp_${Date.now()}.webp`);
    
    let sharpInstance = sharp(inputFilePath);
    
    // Apply WebP options
    const webpOptions = {
      quality: options.quality || 80,
      effort: options.effort || 4,
      lossless: options.lossless || false
    };
    
    await sharpInstance
      .webp(webpOptions)
      .toFile(outputPath);
    
    console.log('✅ WebP conversion successful:', outputPath);
    return {
      success: true,
      outputPath: outputPath,
      message: 'Image converted to WebP successfully'
    };
  } catch (error) {
    console.error('❌ WebP conversion failed:', error);
    throw new Error(`WebP conversion failed: ${error.message}`);
  }
});

// Decode WebP
ipcMain.handle('decodeWebp', async (event, { inputPath, options = {} }) => {
  console.log('🔄 Decoding WebP:', inputPath);
  
  try {
    if (!sharp) {
      throw new Error('Sharp not available');
    }

  const inputFilePath = path.isAbsolute(inputPath) ? inputPath : path.join(tempDir, inputPath);
  const outputPath = path.join(tempDir, `decoded_webp_${Date.now()}.png`);
    
    await sharp(inputFilePath)
      .png()
      .toFile(outputPath);
    
    console.log('✅ WebP decoded successfully:', outputPath);
    return {
      success: true,
      outputPath: outputPath,
      message: 'WebP decoded successfully'
    };
  } catch (error) {
    console.error('❌ WebP decode failed:', error);
    throw new Error(`WebP decode failed: ${error.message}`);
  }
});

// Describe image (placeholder - would need AI integration)
ipcMain.handle('describeImage', async (event, { inputPath, options = {} }) => {
  console.log('🤖 Describing image:', inputPath);
  
  // Placeholder implementation
  return {
    success: true,
    description: "Image description feature not yet implemented in desktop version",
    message: "AI description requires additional setup"
  };
});

// Save file dialog
ipcMain.handle('saveFileDialog', async (event, { data, filename }) => {
  try {
    const result = await dialog.showSaveDialog(mainWindow, {
      defaultPath: filename,
      filters: [
        { name: 'All Files', extensions: ['*'] }
      ]
    });

    if (!result.canceled && result.filePath) {
      // Write the data to the selected file
      let buffer;
      if (data instanceof ArrayBuffer) {
        buffer = Buffer.from(data);
      } else if (Buffer.isBuffer(data)) {
        buffer = data;
      } else if (typeof data === 'string') {
        buffer = Buffer.from(data, 'base64');
      } else {
        buffer = Buffer.from(data);
      }

      await fs.writeFile(result.filePath, buffer);
      
      return {
        success: true,
        filePath: result.filePath,
        message: 'File saved successfully'
      };
    } else {
      return {
        success: false,
        message: 'Save operation cancelled'
      };
    }
  } catch (error) {
    console.error('❌ Save file dialog failed:', error);
    throw new Error(`Save file failed: ${error.message}`);
  }
});

// Get app info (alias for app:info)
ipcMain.handle('getAppInfo', async (event) => {
  return {
    name: app.getName(),
    version: app.getVersion(),
    electronVersion: process.versions.electron,
    nodeVersion: process.versions.node,
    platform: process.platform,
    arch: process.arch
  };
});

/**
 * File cleanup function
 */
async function cleanupOldFiles() {
  const CLEANUP_TIME_MS = 10 * 60 * 1000; // 10 minutes in milliseconds
  
  try {
    console.log('🧹 Starting file cleanup...');
    const now = Date.now();
    
    // Read temp directory
    const files = await fs.readdir(tempDir);
    let cleanedCount = 0;
    
    for (const file of files) {
      const filePath = path.join(tempDir, file);
      
      try {
        const stats = await fs.stat(filePath);
        const fileAge = now - stats.mtimeMs;
        
        if (fileAge > CLEANUP_TIME_MS) {
          if (stats.isDirectory()) {
            // Remove directory recursively
            await fs.rm(filePath, { recursive: true });
          } else {
            // Remove file
            await fs.unlink(filePath);
          }
          cleanedCount++;
          console.log(`🗑️ Cleaned up: ${file} (${Math.round(fileAge / 60000)} minutes old)`);
        }
      } catch (error) {
        // Ignore errors for individual files (might be in use)
        console.log(`⚠️ Could not clean ${file}:`, error.message);
      }
    }
    
    if (cleanedCount > 0) {
      console.log(`✅ Cleanup completed: ${cleanedCount} files/folders removed`);
    } else {
      console.log('✅ Cleanup completed: No old files to remove');
    }
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
  }
}

// Get app info
ipcMain.handle('app:info', () => {
  return {
    name: app.getName(),
    version: app.getVersion(),
    platform: process.platform
  };
});

// Serve video file for preview
ipcMain.handle('serve-video', async (event, filePath) => {
  try {
    console.log('🎥 Serving video file:', filePath);
    
    // Check if file exists
    const stats = await fs.stat(filePath);
    if (!stats.isFile()) {
      throw new Error('File not found');
    }
    
    // Return file data as buffer for secure access
    const buffer = await fs.readFile(filePath);
    const mimeType = 'video/mp4'; // Assume MP4 for now
    
    // Create data URL for secure preview
    const base64Data = buffer.toString('base64');
    const dataUrl = `data:${mimeType};base64,${base64Data}`;
    
    return {
      success: true,
      dataUrl: dataUrl,
      size: stats.size,
      mimeType: mimeType
    };
  } catch (error) {
    console.error('❌ Error serving video:', error);
    return {
      success: false,
      error: error.message
    };
  }
});

// Rename file
ipcMain.handle('rename-file', async (event, { oldPath, newName }) => {
  try {
    console.log('🏷️ Renaming file:', oldPath, '→', newName);
    
    // Check if file exists
    if (!fsSync.existsSync(oldPath)) {
      throw new Error('File not found');
    }
    
    // Get directory and extension
    const directory = path.dirname(oldPath);
    const extension = path.extname(oldPath);
    
    // Sanitize the new name (remove invalid characters)
    const sanitizedName = newName
      .replace(/[<>:"/\\|?*]/g, '') // Remove invalid filename characters
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .trim();
    
    if (!sanitizedName) {
      throw new Error('Invalid filename');
    }
    
    // Create new file path
    const newPath = path.join(directory, sanitizedName + extension);
    
    // Check if a file with the new name already exists
    if (fsSync.existsSync(newPath)) {
      throw new Error('A file with this name already exists');
    }
    
    // Rename the file
    await fs.rename(oldPath, newPath);
    
    console.log('✅ File renamed successfully:', newPath);
    
    return {
      success: true,
      newPath: newPath,
      newName: sanitizedName
    };
    
  } catch (error) {
    console.error('❌ Error renaming file:', error);
    return {
      success: false,
      error: error.message
    };
  }
});

// Extract frames from video
ipcMain.handle('extract-video-frames', async (event, args) => {
  console.log('🔍 extract-video-frames received args:', args);
  
  const { inputPath, options = {} } = args || {};
  
  if (!ffmpeg) {
    throw new Error('FFmpeg not available');
  }

  try {
    if (!inputPath) {
      throw new Error('inputPath is required but was not provided');
    }
    
    const inputFilePath = path.isAbsolute(inputPath) ? inputPath : path.join(tempDir, inputPath);
    
    if (!fsSync.existsSync(inputFilePath)) {
      throw new Error(`Input video file not found: ${inputFilePath}`);
    }
    
    console.log('🎞️ Extracting frames from video:', inputFilePath);
    console.log('🔍 Frame extraction options:', options);
    
    // Create output directory for frames
    const outputDir = path.join(tempDir, `video_frames_${Date.now()}`);
    await fs.mkdir(outputDir, { recursive: true });
    
    // Determine frame extraction settings based on mode
    let frameFilter = '';
    const extractionMode = options.extractionMode || 'fps';
    
    console.log('🎯 Extraction mode:', extractionMode);
    
    if (extractionMode === 'every-frame') {
      // Extract every frame
      frameFilter = '';
    } else if (extractionMode === 'interval') {
      // Extract frames at specific millisecond intervals
      const intervalMs = options.intervalMs || 1000;
      const intervalSeconds = intervalMs / 1000;
      const fps = 1 / intervalSeconds;
      frameFilter = `fps=${fps}`;
      console.log('🕒 Interval mode:', intervalMs + 'ms', '→', fps, 'fps');
    } else {
      // FPS mode (default)
      const fps = options.fps || 1;
      frameFilter = `fps=${fps}`;
      console.log('🎬 FPS mode:', fps);
    }
    
    // Convert quality preset to numeric value for FFmpeg
    let quality = 2; // Default quality (lower is better, 1-31 scale)
    console.log('🔍 Original quality option:', options.quality, typeof options.quality);
    
    if (options.quality) {
      if (typeof options.quality === 'number') {
        quality = Math.max(1, Math.min(31, options.quality));
        console.log('🔢 Using numeric quality:', quality);
      } else {
        // Convert quality presets to numeric values
        const qualityMap = {
          'low': 10,      // Lower quality, smaller files
          'medium': 5,    // Medium quality
          'high': 2,      // High quality, larger files
          'best': 1       // Best quality, largest files
        };
        quality = qualityMap[options.quality.toLowerCase()] || 2;
        console.log('🎯 Converted quality preset:', options.quality, '→', quality);
      }
    }
    
    console.log('🎯 Final FFmpeg settings:', { frameFilter, quality, outputDir });
    
    const outputPattern = path.join(outputDir, 'frame_%04d.png');
    
    return new Promise((resolve, reject) => {
      let frameCount = 0;
      
      // Build FFmpeg command based on extraction mode
      const command = ffmpeg(inputFilePath);
      
      if (frameFilter) {
        command.outputOptions([
          `-vf`, frameFilter,
          `-q:v`, quality.toString()
        ]);
      } else {
        // Extract every frame
        command.outputOptions([
          `-q:v`, quality.toString()
        ]);
      }
      
      command
        .output(outputPattern)
        .on('start', (commandLine) => {
          console.log('🚀 FFmpeg frame extraction command:', commandLine);
        })
        .on('progress', (progress) => {
          console.log('📊 Frame extraction progress:', Math.round(progress.percent || 0) + '% done');
        })
        .on('end', async () => {
          try {
            console.log('✅ Frame extraction completed');
            
            // Get list of extracted frames
            const files = await fs.readdir(outputDir);
            let frameFiles = files
              .filter(file => file.startsWith('frame_') && file.endsWith('.png'))
              .sort()
              .map(file => path.join(outputDir, file));
            
            // Apply max frames limit if specified
            if (options.maxFrames && options.maxFrames > 0) {
              frameFiles = frameFiles.slice(0, options.maxFrames);
              console.log(`🔢 Limited to ${options.maxFrames} frames (from ${files.length} total)`);
            }
            
            // Generate file URLs for each frame
            const frames = frameFiles.map((framePath, index) => {
              const normalizedPath = framePath.replace(/\\/g, '/');
              const fileUrl = normalizedPath.startsWith('/') ? `file://${normalizedPath}` : `file:///${normalizedPath}`;
              
              return {
                index: index + 1,
                filename: path.basename(framePath),
                path: framePath,
                url: fileUrl,
                downloadUrl: fileUrl,
                previewUrl: fileUrl
              };
            });

            // Create ZIP if requested
            let zipUrl = null;
            let zipPath = null;
            if (options.createZip && frames.length > 0) {
              const zipFileName = `video_frames_${Date.now()}.zip`;
              zipPath = path.join(tempDir, zipFileName);
              
              try {
                await new Promise((resolveZip, rejectZip) => {
                  const output = fsSync.createWriteStream(zipPath);
                  const archive = archiver('zip', { zlib: { level: 9 } });
                  
                  output.on('close', () => {
                    console.log(`📦 ZIP created: ${archive.pointer()} total bytes`);
                    resolveZip();
                  });
                  
                  archive.on('error', (err) => {
                    console.error('❌ ZIP creation error:', err);
                    rejectZip(err);
                  });
                  
                  archive.pipe(output);
                  
                  // Add all frame files to ZIP
                  frameFiles.forEach((framePath) => {
                    archive.file(framePath, { name: path.basename(framePath) });
                  });
                  
                  archive.finalize();
                });
                
                const normalizedZipPath = zipPath.replace(/\\/g, '/');
                zipUrl = normalizedZipPath.startsWith('/') ? `file://${normalizedZipPath}` : `file:///${normalizedZipPath}`;
                console.log('✅ ZIP created successfully:', zipUrl);
              } catch (zipError) {
                console.error('❌ ZIP creation failed:', zipError);
                // Continue without ZIP
              }
            }
            
            resolve({
              success: true,
              frames: frames,
              frameCount: frames.length,
              outputDir: outputDir,
              zipUrl: zipUrl,
              zipPath: zipUrl ? zipPath : null,
              message: `Extracted ${frames.length} frames from video${zipUrl ? ' and created ZIP' : ''}`
            });
            
          } catch (error) {
            reject(new Error(`Frame extraction completed but failed to process results: ${error.message}`));
          }
        })
        .on('error', (err) => {
          console.error('❌ FFmpeg frame extraction error:', err);
          reject(new Error(`Frame extraction failed: ${err.message}`));
        });
      
      command.run();
    });
    
  } catch (error) {
    console.error('❌ Video frame extraction setup failed:', error);
    throw new Error(`Video frame extraction failed: ${error.message}`);
  }
});

// Extract frames from GIF
ipcMain.handle('extract-gif-frames', async (event, { inputPath, options = {} }) => {
  if (!sharp) {
    throw new Error('Sharp not available');
  }

  try {
    const inputFilePath = path.isAbsolute(inputPath) ? inputPath : path.join(tempDir, inputPath);
    
    if (!fsSync.existsSync(inputFilePath)) {
      throw new Error(`Input GIF file not found: ${inputFilePath}`);
    }
    
    console.log('🎞️ Extracting frames from GIF:', inputFilePath);
    
    // Create output directory for frames
    const outputDir = path.join(tempDir, `gif_frames_${Date.now()}`);
    await fs.mkdir(outputDir, { recursive: true });
    
    // Use Sharp to get GIF metadata and extract frames
    const gifBuffer = await fs.readFile(inputFilePath);
    const { pages } = await sharp(gifBuffer, { pages: -1 }).metadata();
    
    console.log(`📊 GIF has ${pages} frames`);
    
    // Extract each frame
    const frames = [];
    for (let i = 0; i < pages; i++) {
      const frameFilename = `frame_${String(i + 1).padStart(4, '0')}.png`;
      const framePath = path.join(outputDir, frameFilename);
      
      // Extract frame i from the GIF
      await sharp(gifBuffer, { page: i })
        .png()
        .toFile(framePath);
      
      // Generate file URL
      const normalizedPath = framePath.replace(/\\/g, '/');
      const fileUrl = normalizedPath.startsWith('/') ? `file://${normalizedPath}` : `file:///${normalizedPath}`;
      
      frames.push({
        index: i + 1,
        filename: frameFilename,
        path: framePath,
        url: fileUrl,
        downloadUrl: fileUrl
      });
    }
    
    // Create ZIP if requested
    let zipUrl = null;
    let zipPath = null;
    if (options.createZip && frames.length > 0) {
      const zipFileName = `gif_frames_${Date.now()}.zip`;
      zipPath = path.join(tempDir, zipFileName);
      
      try {
        await new Promise((resolveZip, rejectZip) => {
          const output = fsSync.createWriteStream(zipPath);
          const archive = archiver('zip', { zlib: { level: 9 } });
          
          output.on('close', () => {
            console.log(`📦 ZIP created: ${archive.pointer()} total bytes`);
            resolveZip();
          });
          
          archive.on('error', (err) => {
            console.error('❌ ZIP creation error:', err);
            rejectZip(err);
          });
          
          archive.pipe(output);
          
          // Add all frame files to ZIP
          frames.forEach((frame) => {
            if (fsSync.existsSync(frame.path)) {
              archive.file(frame.path, { name: frame.filename });
              console.log(`📁 Added to ZIP: ${frame.filename}`);
            }
          });
          
          archive.finalize();
        });
        
        const normalizedZipPath = zipPath.replace(/\\/g, '/');
        zipUrl = normalizedZipPath.startsWith('/') ? `file://${normalizedZipPath}` : `file:///${normalizedZipPath}`;
        console.log('📦 ZIP created successfully:', zipPath);
        
      } catch (zipError) {
        console.error('❌ Failed to create ZIP:', zipError);
        // Continue without ZIP if creation fails
      }
    }
    
    console.log('✅ GIF frame extraction completed');
    
    return {
      success: true,
      frames: frames,
      frameCount: frames.length,
      outputDir: outputDir,
      zipUrl: zipUrl,
      zipPath: zipPath,
      message: `Extracted ${frames.length} frames from GIF${zipUrl ? ' and created ZIP' : ''}`
    };
    
  } catch (error) {
    console.error('❌ GIF frame extraction failed:', error);
    throw new Error(`GIF frame extraction failed: ${error.message}`);
  }
});

// Text to Image conversion
ipcMain.handle('text-to-image', async (event, { text, options = {} }) => {
  if (!Canvas) {
    throw new Error('Canvas not available');
  }

  try {
    const {
      width = 800,
      height = 400,
      fontSize = 48,
      fontFamily = 'Arial',
      textColor = '#000000',
      backgroundColor = '#ffffff',
      textAlign = 'center',
      padding = 50,
      lineHeight = 1.2,
      format = 'png'
    } = options;

    // Create canvas
    const { createCanvas } = Canvas;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Set background
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);

    // Set text properties
    ctx.fillStyle = textColor;
    ctx.font = `${fontSize}px ${fontFamily}`;
    ctx.textAlign = textAlign;
    ctx.textBaseline = 'middle';

    // Word wrap and draw text
    const words = text.split(' ');
    const lines = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const testLine = currentLine + ' ' + word;
      const metrics = ctx.measureText(testLine);
      
      if (metrics.width > width - (padding * 2)) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    lines.push(currentLine);

    // Draw each line
    const lineHeightPx = fontSize * lineHeight;
    const startY = (height - (lines.length * lineHeightPx)) / 2 + lineHeightPx / 2;

    lines.forEach((line, index) => {
      const y = startY + (index * lineHeightPx);
      const x = textAlign === 'center' ? width / 2 : 
                textAlign === 'right' ? width - padding : padding;
      ctx.fillText(line, x, y);
    });

    // Convert to buffer
    const buffer = canvas.toBuffer(`image/${format === 'jpg' ? 'jpeg' : format}`);
    
    // Save to temp file
    const outputFileName = `text_image_${Date.now()}.${format}`;
    const outputPath = path.join(tempDir, outputFileName);
    await fs.writeFile(outputPath, buffer);

    return {
      success: true,
      filePath: outputPath,
      fileName: outputFileName,
      url: `file:///${outputPath.replace(/\\/g, '/')}`
    };

  } catch (error) {
    console.error('❌ Text to image conversion failed:', error);
    throw new Error(`Text to image conversion failed: ${error.message}`);
  }
});

// Add text overlay to existing image
ipcMain.handle('add-text-to-image', async (event, { inputPath, text, options = {} }) => {
  if (!sharp) {
    throw new Error('Sharp not available');
  }

  try {
    const {
      fontSize = 48,
      fontFamily = 'Arial',
      textColor = '#ffffff',
      position = 'center', // top, center, bottom, custom
      x = 0,
      y = 0,
      padding = 20,
      backgroundColor = null,
      strokeColor = null,
      strokeWidth = 2
    } = options;

    // Read original image
    const inputBuffer = await fs.readFile(inputPath);
    const metadata = await sharp(inputBuffer).metadata();
    
    // Create text overlay using Canvas
    const { createCanvas } = Canvas;
    const canvas = createCanvas(metadata.width, metadata.height);
    const ctx = canvas.getContext('2d');

    // Make canvas transparent
    ctx.clearRect(0, 0, metadata.width, metadata.height);

    // Set text properties
    ctx.font = `${fontSize}px ${fontFamily}`;
    ctx.fillStyle = textColor;
    if (strokeColor) {
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = strokeWidth;
    }

    // Calculate text position
    const textMetrics = ctx.measureText(text);
    let textX, textY;

    switch (position) {
      case 'top':
        textX = metadata.width / 2;
        textY = padding + fontSize;
        ctx.textAlign = 'center';
        break;
      case 'bottom':
        textX = metadata.width / 2;
        textY = metadata.height - padding;
        ctx.textAlign = 'center';
        break;
      case 'center':
        textX = metadata.width / 2;
        textY = metadata.height / 2;
        ctx.textAlign = 'center';
        break;
      case 'custom':
        textX = x;
        textY = y;
        break;
      default:
        textX = metadata.width / 2;
        textY = metadata.height / 2;
        ctx.textAlign = 'center';
    }

    ctx.textBaseline = 'middle';

    // Draw background rectangle if specified
    if (backgroundColor) {
      const textWidth = textMetrics.width;
      const textHeight = fontSize;
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(
        textX - textWidth / 2 - padding / 2,
        textY - textHeight / 2 - padding / 2,
        textWidth + padding,
        textHeight + padding
      );
      ctx.fillStyle = textColor;
    }

    // Draw text
    if (strokeColor) {
      ctx.strokeText(text, textX, textY);
    }
    ctx.fillText(text, textX, textY);

    // Convert canvas to buffer
    const overlayBuffer = canvas.toBuffer('image/png');

    // Composite with original image
    const outputFileName = `image_with_text_${Date.now()}.${path.extname(inputPath).slice(1)}`;
    const outputPath = path.join(tempDir, outputFileName);

    await sharp(inputBuffer)
      .composite([{ input: overlayBuffer, top: 0, left: 0 }])
      .toFile(outputPath);

    return {
      success: true,
      filePath: outputPath,
      fileName: outputFileName,
      url: `file:///${outputPath.replace(/\\/g, '/')}`
    };

  } catch (error) {
    console.error('❌ Add text to image failed:', error);
    throw new Error(`Add text to image failed: ${error.message}`);
  }
});

// Advanced WebP conversion with animation support
ipcMain.handle('convert-to-webp-advanced', async (event, { inputPath, options = {} }) => {
  if (!sharp) {
    throw new Error('Sharp not available');
  }

  try {
    const {
      quality = 85,
      effort = 4, // 0-6, higher = better compression but slower
      lossless = false,
      alphaQuality = 100,
      method = 4, // 0-6 compression method
      preset = 'default', // default, photo, picture, drawing, icon, text
      smartSubsample = true,
      progressive = false
    } = options;

    const inputBuffer = await fs.readFile(inputPath);
    const outputFileName = `webp_${Date.now()}.webp`;
    const outputPath = path.join(tempDir, outputFileName);

    const webpOptions = {
      quality: lossless ? undefined : quality,
      lossless,
      alphaQuality,
      effort,
      smartSubsample,
      preset,
      progressive
    };

    await sharp(inputBuffer)
      .webp(webpOptions)
      .toFile(outputPath);

    return {
      success: true,
      filePath: outputPath,
      fileName: outputFileName,
      url: `file:///${outputPath.replace(/\\/g, '/')}`
    };

  } catch (error) {
    console.error('❌ Advanced WebP conversion failed:', error);
    throw new Error(`Advanced WebP conversion failed: ${error.message}`);
  }
});

// Batch image processing
ipcMain.handle('batch-convert-images', async (event, { inputPaths, format, options = {} }) => {
  if (!sharp) {
    throw new Error('Sharp not available');
  }

  try {
    const results = [];
    const batchId = Date.now();

    for (let i = 0; i < inputPaths.length; i++) {
      const inputPath = inputPaths[i];
      const inputFileName = path.basename(inputPath, path.extname(inputPath));
      const outputFileName = `${inputFileName}_converted_${batchId}_${i}.${format}`;
      const outputPath = path.join(tempDir, outputFileName);

      try {
        let sharpInstance = sharp(inputPath);

        // Apply options
        if (options.resize) {
          sharpInstance = sharpInstance.resize(options.resize.width, options.resize.height, {
            fit: options.resize.fit || 'inside',
            withoutEnlargement: options.resize.withoutEnlargement !== false
          });
        }

        if (options.rotate) {
          sharpInstance = sharpInstance.rotate(options.rotate);
        }

        // Format-specific options
        switch (format.toLowerCase()) {
          case 'webp':
            sharpInstance = sharpInstance.webp({ 
              quality: options.quality || 85,
              effort: options.effort || 4,
              lossless: options.lossless || false
            });
            break;
          case 'jpeg':
          case 'jpg':
            sharpInstance = sharpInstance.jpeg({ 
              quality: options.quality || 85,
              progressive: options.progressive || false
            });
            break;
          case 'png':
            sharpInstance = sharpInstance.png({ 
              quality: options.quality || 100,
              progressive: options.progressive || false
            });
            break;
          case 'avif':
            sharpInstance = sharpInstance.avif({ 
              quality: options.quality || 85,
              effort: options.effort || 4
            });
            break;
          default:
            throw new Error(`Unsupported format: ${format}`);
        }

        await sharpInstance.toFile(outputPath);

        results.push({
          success: true,
          originalPath: inputPath,
          filePath: outputPath,
          fileName: outputFileName,
          url: `file:///${outputPath.replace(/\\/g, '/')}`
        });

      } catch (error) {
        results.push({
          success: false,
          originalPath: inputPath,
          error: error.message
        });
      }
    }

    return {
      success: true,
      results,
      processed: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      total: inputPaths.length
    };

  } catch (error) {
    console.error('❌ Batch conversion failed:', error);
    throw new Error(`Batch conversion failed: ${error.message}`);
  }
});

// Convert image format handler
ipcMain.handle('convert-image-format', async (event, { inputPath, format, options = {} }) => {
  if (!sharp) {
    throw new Error('Sharp not available');
  }

  try {
    const inputFileName = path.basename(inputPath, path.extname(inputPath));
    const outputFileName = `${inputFileName}_converted.${format}`;
    const outputPath = path.join(tempDir, outputFileName);

    let sharpInstance = sharp(inputPath);

    // Apply options
    if (options.resize) {
      sharpInstance = sharpInstance.resize(options.resize.width, options.resize.height, {
        fit: options.resize.fit || 'inside',
        withoutEnlargement: options.resize.withoutEnlargement !== false
      });
    }

    if (options.rotate) {
      sharpInstance = sharpInstance.rotate(options.rotate);
    }

    // Format-specific options
    switch (format.toLowerCase()) {
      case 'webp':
        sharpInstance = sharpInstance.webp({ 
          quality: options.quality || 85,
          effort: options.effort || 4,
          lossless: options.lossless || false
        });
        break;
      case 'jpeg':
      case 'jpg':
        sharpInstance = sharpInstance.jpeg({ 
          quality: options.quality || 85,
          progressive: options.progressive || false
        });
        break;
      case 'png':
        sharpInstance = sharpInstance.png({ 
          quality: options.quality || 100,
          progressive: options.progressive || false
        });
        break;
      case 'avif':
        sharpInstance = sharpInstance.avif({ 
          quality: options.quality || 85,
          effort: options.effort || 4
        });
        break;
      default:
        throw new Error(`Unsupported format: ${format}`);
    }

    await sharpInstance.toFile(outputPath);

    return {
      success: true,
      filePath: outputPath,
      fileName: outputFileName,
      url: `file:///${outputPath.replace(/\\/g, '/')}`
    };

  } catch (error) {
    console.error('❌ Image format conversion failed:', error);
    throw new Error(`Image format conversion failed: ${error.message}`);
  }
});

// Markdown to PDF handler
ipcMain.handle('markdown-to-pdf', async (event, { inputPath, options = {} }) => {
  try {
    const fs = require('fs').promises;
    const markdownContent = await fs.readFile(inputPath, 'utf8');
    
    const inputFileName = path.basename(inputPath, path.extname(inputPath));
    const outputFileName = `${inputFileName}_converted.pdf`;
    const outputPath = path.join(tempDir, outputFileName);

    // For now, return a placeholder since full PDF generation requires additional libraries
    // This can be enhanced with libraries like puppeteer or markdown-pdf
    await fs.writeFile(outputPath.replace('.pdf', '.html'), `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Converted Markdown</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          pre { background: #f4f4f4; padding: 10px; border-radius: 4px; }
        </style>
      </head>
      <body>
        <pre>${markdownContent.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
      </body>
      </html>
    `);

    return {
      success: true,
      filePath: outputPath.replace('.pdf', '.html'),
      fileName: outputFileName.replace('.pdf', '.html'),
      url: `file:///${outputPath.replace(/\\/g, '/').replace('.pdf', '.html')}`,
      note: 'Converted to HTML format (PDF generation requires additional setup)'
    };

  } catch (error) {
    console.error('❌ Markdown to PDF conversion failed:', error);
    throw new Error(`Markdown to PDF conversion failed: ${error.message}`);
  }
});

// PDF to Markdown handler
// PDF to Markdown conversion - supports multiple PDFs
ipcMain.handle('pdf-to-markdown', async (event, { inputPaths, options = {} }) => {
  try {
    // Check if pdf-parse is available
    if (!pdfParse) {
      throw new Error('PDF-Parse library is not available. Please install pdf-parse.');
    }
    
    // Ensure inputPaths is an array
    const paths = Array.isArray(inputPaths) ? inputPaths : [inputPaths];
    const results = [];
    
    console.log(`📄 Converting ${paths.length} PDF(s) to Markdown...`);
    
    for (let i = 0; i < paths.length; i++) {
      const inputPath = paths[i];
      const inputFileName = path.basename(inputPath, path.extname(inputPath));
      const outputFileName = `${inputFileName}.md`;
      const outputPath = path.join(tempDir, outputFileName);
      
      try {
        console.log(`Processing PDF ${i + 1}/${paths.length}: ${inputFileName}`);
        
        // Read PDF file
        const dataBuffer = await fs.readFile(inputPath);
        
        // Parse PDF
        const pdfData = await pdfParse(dataBuffer);
        
        // Create markdown content
        let markdownContent = `# ${inputFileName}\n\n`;
        markdownContent += `*Converted from PDF*\n\n`;
        markdownContent += `**Pages:** ${pdfData.numpages}\n\n`;
        markdownContent += `---\n\n`;
        
        // Extract and format text
        let text = pdfData.text;
        
        // Clean up text
        text = text
          .replace(/\r\n/g, '\n')
          .replace(/\n{3,}/g, '\n\n')
          .trim();
        
        // Split into paragraphs and format
        const paragraphs = text.split('\n\n');
        
        paragraphs.forEach(paragraph => {
          const trimmed = paragraph.trim();
          if (trimmed) {
            // Check if it's a potential header (short, all caps or title case)
            if (trimmed.length < 100 && /^[A-Z][A-Z\s]{3,}$/.test(trimmed)) {
              markdownContent += `## ${trimmed}\n\n`;
            } else if (trimmed.length < 80 && /^\d+\./.test(trimmed)) {
              markdownContent += `## ${trimmed}\n\n`;
            } else {
              // Regular paragraph
              markdownContent += `${trimmed}\n\n`;
            }
          }
        });
        
        // Write output file
        await fs.writeFile(outputPath, markdownContent, 'utf8');
        
        console.log(`✅ Successfully converted: ${outputFileName}`);
        
        results.push({
          success: true,
          filePath: outputPath,
          fileName: outputFileName,
          originalName: path.basename(inputPath),
          url: `file:///${outputPath.replace(/\\/g, '/')}`,
          pages: pdfData.numpages,
          content: markdownContent
        });
        
      } catch (pdfError) {
        console.error(`❌ Failed to convert ${inputFileName}:`, pdfError);
        results.push({
          success: false,
          fileName: inputFileName,
          originalName: path.basename(inputPath),
          error: pdfError.message
        });
      }
    }
    
    // If single file, return single result
    if (paths.length === 1) {
      return results[0];
    }
    
    // For multiple files, return all results
    return {
      success: true,
      results: results,
      total: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length
    };

  } catch (error) {
    console.error('❌ PDF to Markdown conversion failed:', error);
    throw new Error(`PDF to Markdown conversion failed: ${error.message}`);
  }
});

// Text to Markdown handler
ipcMain.handle('text-to-markdown', async (event, { inputPath, options = {} }) => {
  try {
    const fs = require('fs').promises;
    const textContent = await fs.readFile(inputPath, 'utf8');
    
    const inputFileName = path.basename(inputPath, path.extname(inputPath));
    const outputFileName = `${inputFileName}_converted.md`;
    const outputPath = path.join(tempDir, outputFileName);

    // Convert text to basic markdown format
    const lines = textContent.split('\n');
    let markdownContent = `# ${inputFileName}\n\n`;
    
    lines.forEach(line => {
      const trimmedLine = line.trim();
      if (trimmedLine) {
        // Simple conversion - each paragraph becomes a markdown paragraph
        markdownContent += `${trimmedLine}\n\n`;
      }
    });

    await fs.writeFile(outputPath, markdownContent);

    return {
      success: true,
      filePath: outputPath,
      fileName: outputFileName,
      url: `file:///${outputPath.replace(/\\/g, '/')}`
    };

  } catch (error) {
    console.error('❌ Text to Markdown conversion failed:', error);
    throw new Error(`Text to Markdown conversion failed: ${error.message}`);
  }
});

// Images to PDF handler
ipcMain.handle('images-to-pdf', async (event, { inputPaths, options = {} }) => {
  try {
    const fs = require('fs').promises;
    
    const outputFileName = `combined_images_${Date.now()}.pdf`;
    const outputPath = path.join(tempDir, outputFileName);

    // For now, create an HTML file that can be converted to PDF
    // This can be enhanced with libraries like jsPDF or puppeteer
    let htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Combined Images</title>
        <style>
          body { margin: 0; padding: 20px; }
          .image-page { page-break-after: always; text-align: center; margin-bottom: 20px; }
          .image-page:last-child { page-break-after: auto; }
          img { max-width: 100%; max-height: 90vh; object-fit: contain; }
          .image-title { margin-bottom: 10px; font-family: Arial, sans-serif; }
        </style>
      </head>
      <body>
    `;

    inputPaths.forEach((imagePath, index) => {
      const fileName = path.basename(imagePath);
      htmlContent += `
        <div class="image-page">
          <h3 class="image-title">${fileName}</h3>
          <img src="file:///${imagePath.replace(/\\/g, '/')}" alt="${fileName}" />
        </div>
      `;
    });

    htmlContent += `
      </body>
      </html>
    `;

    const htmlPath = outputPath.replace('.pdf', '.html');
    await fs.writeFile(htmlPath, htmlContent);

    return {
      success: true,
      filePath: htmlPath,
      fileName: outputFileName.replace('.pdf', '.html'),
      url: `file:///${htmlPath.replace(/\\/g, '/')}`,
      note: 'Converted to HTML format (PDF generation requires additional setup)',
      imageCount: inputPaths.length
    };

  } catch (error) {
    console.error('❌ Images to PDF conversion failed:', error);
    throw new Error(`Images to PDF conversion failed: ${error.message}`);
  }
});

// Create APNG sequence handler
ipcMain.handle('createApngSequence', async (event, { inputPaths, options = {} }) => {
  if (!sharp) {
    throw new Error('Sharp not available');
  }

  try {
    const outputFileName = `apng_sequence_${Date.now()}.png`;
    const outputPath = path.join(tempDir, outputFileName);

    // For now, create the first image as APNG is not fully supported by Sharp
    // This would require specialized APNG libraries
    await sharp(inputPaths[0])
      .png({ quality: options.quality || 100 })
      .toFile(outputPath);

    return {
      success: true,
      filePath: outputPath,
      fileName: outputFileName,
      url: `file:///${outputPath.replace(/\\/g, '/')}`,
      note: 'Created static PNG (APNG animation requires specialized libraries)',
      frameCount: inputPaths.length
    };

  } catch (error) {
    console.error('❌ APNG sequence creation failed:', error);
    throw new Error(`APNG sequence creation failed: ${error.message}`);
  }
});

// Convert to AVIF Modern handler
ipcMain.handle('convertToAvifModern', async (event, { inputPath, options = {} }) => {
  if (!sharp) {
    throw new Error('Sharp not available');
  }

  try {
    const inputFileName = path.basename(inputPath, path.extname(inputPath));
    const outputFileName = `${inputFileName}_avif.avif`;
    const outputPath = path.join(tempDir, outputFileName);

    await sharp(inputPath)
      .avif({
        quality: options.quality || 80,
        effort: options.effort || 4,
        chromaSubsampling: options.chromaSubsampling || '4:2:0'
      })
      .toFile(outputPath);

    return {
      success: true,
      filePath: outputPath,
      fileName: outputFileName,
      url: `file:///${outputPath.replace(/\\/g, '/')}`
    };

  } catch (error) {
    console.error('❌ AVIF conversion failed:', error);
    throw new Error(`AVIF conversion failed: ${error.message}`);
  }
});

// Convert to JXL handler
ipcMain.handle('convertToJxl', async (event, { inputPath, options = {} }) => {
  try {
    const inputFileName = path.basename(inputPath, path.extname(inputPath));
    const outputFileName = `${inputFileName}_jxl.jxl`;
    const outputPath = path.join(tempDir, outputFileName);

    // JXL is not supported by Sharp yet, so we'll create a placeholder
    const fs = require('fs').promises;
    await fs.writeFile(outputPath.replace('.jxl', '.txt'), `
JXL (JPEG XL) Conversion Placeholder

Original file: ${inputPath}
Target format: JXL
Options: ${JSON.stringify(options, null, 2)}

Note: JXL format support requires specialized libraries that are not yet integrated.
Consider using WebP or AVIF for modern compression with current setup.

Created: ${new Date().toISOString()}
`);

    return {
      success: true,
      filePath: outputPath.replace('.jxl', '.txt'),
      fileName: outputFileName.replace('.jxl', '.txt'),
      url: `file:///${outputPath.replace(/\\/g, '/').replace('.jxl', '.txt')}`,
      note: 'JXL format not yet supported - placeholder created'
    };

  } catch (error) {
    console.error('❌ JXL conversion failed:', error);
    throw new Error(`JXL conversion failed: ${error.message}`);
  }
});

// Compare modern formats handler
ipcMain.handle('compareModernFormats', async (event, { inputPath, options = {} }) => {
  if (!sharp) {
    throw new Error('Sharp not available');
  }

  try {
    const inputFileName = path.basename(inputPath, path.extname(inputPath));
    const results = [];

    // Convert to multiple formats for comparison
    const formats = ['webp', 'avif', 'png', 'jpeg'];
    
    for (const format of formats) {
      try {
        const outputFileName = `${inputFileName}_compare.${format}`;
        const outputPath = path.join(tempDir, outputFileName);

        let sharpInstance = sharp(inputPath);

        switch (format) {
          case 'webp':
            sharpInstance = sharpInstance.webp({ quality: options.quality || 85 });
            break;
          case 'avif':
            sharpInstance = sharpInstance.avif({ quality: options.quality || 80 });
            break;
          case 'png':
            sharpInstance = sharpInstance.png({ quality: options.quality || 100 });
            break;
          case 'jpeg':
            sharpInstance = sharpInstance.jpeg({ quality: options.quality || 85 });
            break;
        }

        await sharpInstance.toFile(outputPath);

        const stats = await require('fs').promises.stat(outputPath);
        
        results.push({
          format,
          filePath: outputPath,
          fileName: outputFileName,
          url: `file:///${outputPath.replace(/\\/g, '/')}`,
          size: stats.size,
          sizeKB: Math.round(stats.size / 1024)
        });

      } catch (formatError) {
        results.push({
          format,
          error: formatError.message,
          success: false
        });
      }
    }

    return {
      success: true,
      comparisons: results,
      originalFile: inputPath
    };

  } catch (error) {
    console.error('❌ Format comparison failed:', error);
    throw new Error(`Format comparison failed: ${error.message}`);
  }
});

// Get video info handler
ipcMain.handle('getVideoInfo', async (event, { inputPath }) => {
  if (!ffmpeg) {
    throw new Error('FFmpeg not available');
  }

  try {
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .ffprobe((err, metadata) => {
          if (err) {
            console.error('❌ Video info extraction failed:', err);
            reject(new Error(`Video info extraction failed: ${err.message}`));
            return;
          }

          const videoStream = metadata.streams.find(stream => stream.codec_type === 'video');
          const audioStream = metadata.streams.find(stream => stream.codec_type === 'audio');

          const info = {
            success: true,
            duration: metadata.format.duration,
            size: metadata.format.size,
            bitrate: metadata.format.bit_rate,
            format: metadata.format.format_name,
            video: videoStream ? {
              codec: videoStream.codec_name,
              width: videoStream.width,
              height: videoStream.height,
              fps: eval(videoStream.r_frame_rate) || 0,
              pixelFormat: videoStream.pix_fmt
            } : null,
            audio: audioStream ? {
              codec: audioStream.codec_name,
              sampleRate: audioStream.sample_rate,
              channels: audioStream.channels,
              bitrate: audioStream.bit_rate
            } : null
          };

          resolve(info);
        });
    });

  } catch (error) {
    console.error('❌ Video info extraction failed:', error);
    throw new Error(`Video info extraction failed: ${error.message}`);
  }
});

// Extract video frames handler
ipcMain.handle('extractVideoFrames', async (event, { inputPath, options = {} }) => {
  if (!ffmpeg) {
    throw new Error('FFmpeg not available');
  }

  try {
    const framePrefix = `frames_${Date.now()}`;
    const framePattern = path.join(tempDir, `${framePrefix}_%04d.png`);

    return new Promise((resolve, reject) => {
      let command = ffmpeg(inputPath)
        .output(framePattern)
        .outputOptions(['-vf', `fps=${options.fps || 1}`]);

      if (options.startTime) {
        command = command.seekInput(options.startTime);
      }

      if (options.duration) {
        command = command.duration(options.duration);
      }

      command
        .on('end', async () => {
          try {
            const fs = require('fs').promises;
            const files = await fs.readdir(tempDir);
            const frameFiles = files
              .filter(file => file.startsWith(framePrefix) && file.endsWith('.png'))
              .map(file => {
                const fullPath = path.join(tempDir, file);
                return {
                  fileName: file,
                  filePath: fullPath,
                  url: `file:///${fullPath.replace(/\\/g, '/')}`
                };
              });

            resolve({
              success: true,
              frames: frameFiles,
              frameCount: frameFiles.length
            });

          } catch (error) {
            reject(new Error(`Failed to list extracted frames: ${error.message}`));
          }
        })
        .on('error', (err) => {
          console.error('❌ Video frame extraction failed:', err);
          reject(new Error(`Video frame extraction failed: ${err.message}`));
        })
        .run();
    });

  } catch (error) {
    console.error('❌ Video frame extraction failed:', error);
    throw new Error(`Video frame extraction failed: ${error.message}`);
  }
});

// Extract GIF frames handler
ipcMain.handle('extractGifFrames', async (event, { inputPath, options = {} }) => {
  if (!sharp) {
    throw new Error('Sharp not available');
  }

  try {
    // For GIF frame extraction, we'll use a simpler approach
    // This is a placeholder - full GIF frame extraction requires specialized libraries
    const framePrefix = `gif_frames_${Date.now()}`;
    const outputPath = path.join(tempDir, `${framePrefix}_frame_0.png`);

    // Convert first frame to PNG as placeholder
    await sharp(inputPath)
      .png()
      .toFile(outputPath);

    return {
      success: true,
      frames: [{
        fileName: path.basename(outputPath),
        filePath: outputPath,
        url: `file:///${outputPath.replace(/\\/g, '/')}`
      }],
      frameCount: 1,
      note: 'Single frame extracted (full GIF animation extraction requires specialized libraries)'
    };

  } catch (error) {
    console.error('❌ GIF frame extraction failed:', error);
    throw new Error(`GIF frame extraction failed: ${error.message}`);
  }
});

/**
 * App lifecycle
 */

app.whenReady().then(async () => {
  // Set temp directory to app's user data directory for cross-platform compatibility
  tempDir = path.join(app.getPath('userData'), 'temp');
  
  // Create temp directory if it doesn't exist
  try {
    await fs.mkdir(tempDir, { recursive: true });
    console.log('✅ Temp directory ready:', tempDir);
  } catch (error) {
    console.error('❌ Failed to create temp directory:', error);
  }
  
  // Schedule periodic cleanup every 5 minutes
  setInterval(cleanupOldFiles, 5 * 60 * 1000); // Run cleanup every 5 minutes
  
  // Run initial cleanup
  setTimeout(cleanupOldFiles, 10000); // Run first cleanup after 10 seconds
  
  console.log('🧹 File cleanup scheduled: every 5 minutes, removing files older than 10 minutes');
  
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
