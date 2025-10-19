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
  try {
    console.log('✂️ Splitting GIF:', inputPath);
    
    const inputFilePath = path.isAbsolute(inputPath) ? inputPath : path.join(tempDir, inputPath);
    
    if (!fsSync.existsSync(inputFilePath)) {
      throw new Error(`Input GIF file not found: ${inputFilePath}`);
    }
    
    // Create output directory for frames
    const outputDir = path.join(tempDir, `gif_frames_${Date.now()}`);
    await fs.mkdir(outputDir, { recursive: true });
    
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
                  '-c', 'copy', // Copy without re-encoding for speed
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
          
          const command = ffmpeg(inputFilePath)
            .outputOptions([
              '-c', 'copy', // Copy without re-encoding for speed
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
              } catch (readError) {
                throw new Error(`Failed to read split segments: ${readError.message}`);
              }
            })
            .on('error', (err) => {
              console.error('❌ FFmpeg error:', err);
              reject(new Error(`Video splitting failed: ${err.message}`));
            });
          
          // Start the FFmpeg process
          command.run();
          
          // Wait for completion before resolving
          await new Promise((resolveCommand, rejectCommand) => {
            command.on('end', resolveCommand);
            command.on('error', rejectCommand);
          });
        }
        
        resolve({
          success: true,
          segments: segments,
          outputDir: outputDir,
          segmentCount: segments.length,
          message: `Video successfully split into ${segments.length} segments`
        });
        
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
            await fs.rmdir(filePath, { recursive: true });
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
