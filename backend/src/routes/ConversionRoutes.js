import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuid } from 'uuid';
import fs from 'fs/promises';
import fsSync from 'fs';
import AdmZip from 'adm-zip';
import mime from 'mime-types';
import { config } from '../config/index.js';
import { createError } from '../middleware/ErrorHandler.js';

// Import consolidated services and utilities
import { 
  imageProcessor, 
  videoProcessor, 
  gifProcessor, 
  gifService,
  serviceFactory 
} from '../services/index.js';
import { tempDir, outputDir, getSafeFilename, ensureDirectories } from '../utils/FilePathUtils.js';

const router = Router();

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, tempDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuid()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: config.maxFileSizeMB * 1024 * 1024, files: config.maxBatchCount },
  fileFilter: (_req, file, cb) => {
    // Support comprehensive format list from ezgif
    const imageFormats = [
      'image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp', 
      'image/bmp', 'image/tiff', 'image/svg+xml', 'image/x-icon'
    ];
    const videoFormats = [
      'video/mp4', 'video/mov', 'video/avi', 'video/webm', 'video/mkv', 
      'video/flv', 'video/wmv', 'video/3gp', 'video/ogv'
    ];
    const archiveFormats = [
      'application/zip', 'application/x-zip-compressed'
    ];
    
    const allFormats = [...imageFormats, ...videoFormats, ...archiveFormats];
    
    if (allFormats.includes(file.mimetype)) {
      return cb(null, true);
    }
    
    // Check by file extension as fallback
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExts = [
      '.png', '.jpeg', '.jpg', '.gif', '.webp', '.bmp', '.tiff', '.svg', '.ico',
      '.mp4', '.mov', '.avi', '.webm', '.mkv', '.flv', '.wmv', '.3gp', '.ogv',
      '.zip'
    ];
    
    if (allowedExts.includes(ext)) {
      return cb(null, true);
    }
    
    return cb(new Error(`Unsupported file type: ${file.mimetype || ext}`));
  }
});

// Main conversion endpoint that handles all ezgif tools
router.post('/', upload.array('files'), async (req, res, next) => {
  try {
    console.log('=== CONVERT REQUEST START ===');
    console.log('EzGIF Convert Request:', { 
      tool: req.body.tool,
      fileCount: (req.files || []).length, 
      url: req.body.url,
      hasBody: !!req.body,
      bodyKeys: Object.keys(req.body || {})
    });

    const tool = req.body.tool || 'video-to-gif';
    const files = req.files || [];
    const url = req.body.url;
    
    // Handle URL input
    if (url && !files.length) {
      try {
        const downloadedFile = await convertFromUrl(url);
        files.push({
          path: downloadedFile,
          originalname: path.basename(url),
          mimetype: 'application/octet-stream'
        });
      } catch (err) {
        return next(createError(`URL processing failed: ${err.message}`, 400));
      }
    }

    if (!files.length) {
      console.log('No files provided in request');
      return res.status(400).json({ 
        error: { 
          code: 'NO_FILES', 
          message: 'No files provided for conversion' 
        } 
      });
    }

    const results = [];

    // Process files based on tool selection
    switch (tool) {
      case 'video-to-gif':
        for (const file of files) {
          const result = await processVideoToGif(file, req.body);
          results.push(result);
        }
        break;

      case 'images-to-gif':
      case 'gif-maker':
        const gifResult = await processImagesToGif(files, req.body);
        results.push(gifResult);
        break;

      case 'resize':
        for (const file of files) {
          const result = await processResize(file, req.body);
          results.push(result);
        }
        break;

      case 'crop':
        for (const file of files) {
          const result = await processCrop(file, req.body);
          results.push(result);
        }
        break;

      case 'rotate':
        for (const file of files) {
          const result = await processRotate(file, req.body);
          results.push(result);
        }
        break;

      case 'optimize':
        for (const file of files) {
          const result = await processOptimize(file, req.body);
          results.push(result);
        }
        break;

      case 'effects':
        for (const file of files) {
          const result = await processEffects(file, req.body);
          results.push(result);
        }
        break;

      case 'split':
        const splitResult = await processSplit(files[0], req.body);
        results.push(...splitResult);
        break;

      case 'add-text':
        for (const file of files) {
          const result = await processAddText(file, req.body);
          results.push(result);
        }
        break;

      case 'webp-maker':
        for (const file of files) {
          const result = await processWebPMaker(file, req.body);
          results.push(result);
        }
        break;

      case 'webp-to-gif':
        for (const file of files) {
          const result = await processWebPToGif(file, req.body);
          results.push(result);
        }
        break;

      case 'apng-maker':
        for (const file of files) {
          const result = await processAPNGMaker(file, req.body);
          results.push(result);
        }
        break;

      case 'avif-converter':
        for (const file of files) {
          const result = await processAVIFConverter(file, req.body);
          results.push(result);
        }
        break;

      case 'jxl-converter':
        for (const file of files) {
          const result = await processJXLConverter(file, req.body);
          results.push(result);
        }
        break;

      default:
        // Default to basic format conversion
        for (const file of files) {
          const result = await processBasicConversion(file, req.body);
          results.push(result);
        }
        break;
    }

    res.json({ 
      files: results,
      tool: tool,
      success: true 
    });

  } catch (error) {
    console.error('=== CONVERSION ERROR ===');
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    // Return error response directly instead of using next()
    return res.status(500).json({
      error: {
        code: 'CONVERSION_ERROR',
        message: error.message || 'Conversion failed'
      }
    });
  }
});

// Advanced GIF Frame Management endpoint
router.post('/gif-editor', upload.array('frames'), async (req, res, next) => {
  try {
    console.log('GIF Editor Request:', { 
      action: req.body.action,
      frameCount: (req.files || []).length 
    });

    const action = req.body.action;
    const frames = req.files || [];
    
    if (!frames.length && action !== 'load-gif') {
      return next(createError('No frames provided for editing', 400));
    }

    let result;
    switch (action) {
      case 'reorder-frames':
        result = await processFrameReorder(frames, req.body);
        break;
      
      case 'adjust-delays':
        result = await processDelayAdjustment(frames, req.body);
        break;
      
      case 'add-crossfade':
        result = await processCrossfadeEffect(frames, req.body);
        break;
      
      case 'change-canvas-size':
        result = await processCanvasResize(frames, req.body);
        break;
      
      case 'apply-gravity':
        result = await processGravityAlignment(frames, req.body);
        break;
      
      default:
        return next(createError(`Unknown gif-editor action: ${action}`, 400));
    }

    res.json({
      success: true,
      action: action,
      result: result
    });

  } catch (error) {
    console.error('GIF Editor error:', error);
    next(createError(error.message || 'GIF editing failed', 500));
  }
});

// Batch processing endpoint for multiple files
router.post('/batch', upload.array('files'), async (req, res, next) => {
  try {
    console.log('Batch processing request:', {
      tool: req.body.tool,
      fileCount: (req.files || []).length
    });

    const tool = req.body.tool;
    const files = req.files || [];
    const batchOptions = JSON.parse(req.body.options || '{}');
    
    if (!files.length) {
      return next(createError('No files provided for batch processing', 400));
    }

    const results = [];
    const errors = [];

    // Process files in parallel with concurrency limit
    const concurrency = 3;
    for (let i = 0; i < files.length; i += concurrency) {
      const batch = files.slice(i, i + concurrency);
      
      const batchPromises = batch.map(async (file, index) => {
        try {
          // Apply file-specific options if provided
          const fileOptions = batchOptions.fileOptions?.[i + index] || batchOptions;
          
          let result;
          switch (tool) {
            case 'resize':
              result = await processResize(file, fileOptions);
              break;
            case 'optimize':
              result = await processOptimize(file, fileOptions);
              break;
            case 'convert':
              result = await processBasicConversion(file, fileOptions);
              break;
            default:
              throw new Error(`Batch tool ${tool} not supported`);
          }
          
          return { success: true, file: result };
        } catch (error) {
          return { success: false, error: error.message, filename: file.originalname };
        }
      });

      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach(result => {
        if (result.status === 'fulfilled') {
          if (result.value.success) {
            results.push(result.value.file);
          } else {
            errors.push(result.value);
          }
        } else {
          errors.push({ success: false, error: result.reason.message });
        }
      });
    }

    res.json({
      success: true,
      tool: tool,
      processed: results.length,
      errors: errors.length,
      results: results,
      errors: errors
    });

  } catch (error) {
    console.error('Batch processing error:', error);
    next(createError(error.message || 'Batch processing failed', 500));
  }
});

// ZIP file upload and extraction endpoint
router.post('/upload-zip', upload.single('zipFile'), async (req, res, next) => {
  try {
    console.log('ZIP Upload Request:', { 
      filename: req.file?.originalname,
      size: req.file?.size 
    });

    if (!req.file) {
      return next(createError('No ZIP file provided', 400));
    }

    const zipPath = req.file.path;
    const extractPath = path.join(tempDir, `extracted_${uuid()}`);
    
    try {
      // Extract ZIP file
      const zip = new AdmZip(zipPath);
      const entries = zip.getEntries();
      
      const extractedFiles = [];
      
      // Create extraction directory
      await fs.mkdir(extractPath, { recursive: true });
      
      // Process each file in the ZIP
      for (const entry of entries) {
        if (!entry.isDirectory) {
          const entryName = entry.entryName;
          const ext = path.extname(entryName).toLowerCase();
          
          // Check if file type is supported
          const supportedExts = [
            '.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.tiff',
            '.mp4', '.mov', '.avi', '.webm', '.mkv', '.flv'
          ];
          
          if (supportedExts.includes(ext)) {
            const extractedPath = path.join(extractPath, `${uuid()}${ext}`);
            
            // Extract file
            zip.extractEntryTo(entry, path.dirname(extractedPath), false, true);
            
            // Rename to UUID-based name for processing
            const tempName = path.join(extractPath, entryName);
            try {
              await fs.rename(tempName, extractedPath);
              
              // Get file stats
              const stats = await fs.stat(extractedPath);
              const mimeType = mime.lookup(ext) || 'application/octet-stream';
              
              extractedFiles.push({
                path: extractedPath,
                originalname: entryName,
                mimetype: mimeType,
                size: stats.size,
                extractedName: path.basename(extractedPath)
              });
            } catch (renameError) {
              console.warn(`Failed to rename ${entryName}:`, renameError.message);
            }
          }
        }
      }
      
      // Clean up ZIP file
      await fs.unlink(zipPath);
      
      res.json({
        success: true,
        message: `Extracted ${extractedFiles.length} supported files from ZIP`,
        files: extractedFiles.map(f => ({
          name: f.originalname,
          extractedName: f.extractedName,
          size: formatFileSize(f.size),
          type: f.mimetype,
          path: f.path // For internal processing
        })),
        extractPath: extractPath
      });

    } catch (zipError) {
      console.error('ZIP extraction failed:', zipError);
      
      // Clean up on error
      try {
        await fs.unlink(zipPath);
        await fs.rmdir(extractPath, { recursive: true });
      } catch (cleanupError) {
        console.warn('Cleanup failed:', cleanupError.message);
      }
      
      return next(createError(`ZIP extraction failed: ${zipError.message}`, 400));
    }

  } catch (error) {
    console.error('ZIP upload error:', error);
    next(createError(error.message || 'ZIP upload failed', 500));
  }
});

// File validation endpoint
router.post('/validate', upload.array('files'), async (req, res, next) => {
  try {
    const files = req.files || [];
    const validationResults = [];
    
    for (const file of files) {
      try {
        const validation = validateFile(file);
        validationResults.push({ success: true, file: file.originalname, validation });
      } catch (validationError) {
        validationResults.push({ 
          success: false, 
          file: file.originalname, 
          error: validationError.message 
        });
      }
    }
    
    res.json({
      success: true,
      validations: validationResults,
      totalFiles: files.length,
      validFiles: validationResults.filter(v => v.valid).length,
      invalidFiles: validationResults.filter(v => !v.valid).length
    });

  } catch (error) {
    console.error('File validation error:', error);
    next(createError(error.message || 'File validation failed', 500));
  }
});

// Advanced GIF Options endpoint - comprehensive ezgif features
router.post('/gif-advanced', upload.array('frames'), async (req, res, next) => {
  try {
    console.log('Advanced GIF Request:', { 
      frameCount: (req.files || []).length,
      options: JSON.stringify(req.body, null, 2)
    });

    const frames = req.files || [];
    if (!frames.length) {
      return next(createError('No frames provided for advanced GIF creation', 400));
    }

    // Parse all the advanced options from ezgif HTML structure
    const advancedOptions = {
      // Basic GIF settings
      frameDelays: req.body.delays ? req.body.delays.split(',').map(d => parseInt(d.trim()) || 100) : [],
      globalDelay: parseInt(req.body.delay) || 100,
      loop: parseInt(req.body.loop) >= 0 ? parseInt(req.body.loop) : 0, // 0 = infinite
      
      // Size and positioning
      width: parseInt(req.body.width) || null,
      height: parseInt(req.body.height) || null,
      gravity: req.body.gravity || 'center', // gravity from ezgif: center, north, south, east, west, etc.
      backgroundColor: req.body.backgroundColor || 'transparent',
      
      // Quality and optimization
      optimize: req.body.optimize !== 'false',
      quality: parseInt(req.body.quality) || 10, // 1-20, lower is better
      dither: req.body.dither || 'floyd_steinberg', // floyd_steinberg, ordered, none
      method: req.body.method || 'lanczos', // scaling method: lanczos, cubic, linear
      
      // Advanced features from ezgif
      globalColormap: req.body.globalColormap === 'true',
      localColormap: req.body.localColormap === 'true',
      crossfade: req.body.crossfade === 'true',
      crossfadeDuration: parseInt(req.body.crossfadeDuration) || 100,
      
      // Frame effects
      reverse: req.body.reverse === 'true',
      bounce: req.body.bounce === 'true', // forward then reverse
      fadeIn: req.body.fadeIn === 'true',
      fadeOut: req.body.fadeOut === 'true',
      
      // Color adjustments
      brightness: parseFloat(req.body.brightness) || null,
      contrast: parseFloat(req.body.contrast) || null,
      saturation: parseFloat(req.body.saturation) || null,
      gamma: parseFloat(req.body.gamma) || null,
      
      // Filters
      blur: parseFloat(req.body.blur) || null,
      sharpen: parseFloat(req.body.sharpen) || null,
      
      // Frame management
      frameOrder: req.body.frameOrder || null, // comma-separated indices
      skipFrames: req.body.skipFrames || null, // frames to skip
      duplicateFrames: req.body.duplicateFrames || null, // frames to duplicate
      
      // Advanced positioning
      offsetX: parseInt(req.body.offsetX) || 0,
      offsetY: parseInt(req.body.offsetY) || 0,
      
      // Disposal methods from GIF spec
      dispose: req.body.dispose || 'none', // none, background, previous
      blend: req.body.blend || 'over' // over, source, clear
    };

    console.log('Processing with advanced options:', advancedOptions);

    // Process frames with advanced settings
    let processedFrames = frames.map((frame, index) => ({
      path: frame.path,
      originalName: frame.originalname,
      delay: advancedOptions.frameDelays[index] || advancedOptions.globalDelay,
      dispose: advancedOptions.dispose,
      blend: advancedOptions.blend
    }));

    // Apply frame reordering if specified
    if (advancedOptions.frameOrder) {
      const order = advancedOptions.frameOrder.split(',').map(i => parseInt(i.trim()));
      processedFrames = order.map(index => processedFrames[index]).filter(Boolean);
    }

    // Apply frame effects
    if (advancedOptions.reverse) {
      processedFrames = [...processedFrames].reverse();
    }
    
    if (advancedOptions.bounce) {
      const reversed = [...processedFrames].reverse();
      reversed.shift(); // Remove duplicate of last frame
      processedFrames = [...processedFrames, ...reversed];
    }

    // Apply fade effects
    if (advancedOptions.fadeIn || advancedOptions.fadeOut) {
      const fadeFrames = Math.min(5, Math.floor(processedFrames.length / 4));
      
      processedFrames = processedFrames.map((frame, index) => {
        let opacity = 1.0;
        
        if (advancedOptions.fadeIn && index < fadeFrames) {
          opacity = (index + 1) / fadeFrames;
        }
        
        if (advancedOptions.fadeOut && index >= processedFrames.length - fadeFrames) {
          const fadeIndex = processedFrames.length - index - 1;
          opacity = (fadeIndex + 1) / fadeFrames;
        }
        
        return { ...frame, opacity };
      });
    }

    // Create the advanced GIF
    const outputName = `advanced_${uuid()}.gif`;
    const outputPath = path.join(outputDir, outputName);
    
    const result = await gifService.createAdvancedGif(processedFrames, outputPath, advancedOptions);
    
    const stats = await fs.stat(outputPath);
    
    res.json({
      success: true,
      filename: outputName,
      url: `/api/files/${outputName}`,
      size: formatFileSize(stats.size),
      type: 'image',
      tool: 'gif-advanced',
      processing: {
        totalFrames: processedFrames.length,
        originalFrames: frames.length,
        averageDelay: Math.round(processedFrames.reduce((sum, f) => sum + f.delay, 0) / processedFrames.length),
        dimensions: result.dimensions,
        loop: advancedOptions.loop,
        optimized: advancedOptions.optimize,
        crossfade: advancedOptions.crossfade,
        effects: {
          reverse: advancedOptions.reverse,
          bounce: advancedOptions.bounce,
          fadeIn: advancedOptions.fadeIn,
          fadeOut: advancedOptions.fadeOut
        },
        colorAdjustments: {
          brightness: advancedOptions.brightness,
          contrast: advancedOptions.contrast,
          saturation: advancedOptions.saturation,
          gamma: advancedOptions.gamma
        },
        filters: {
          blur: advancedOptions.blur,
          sharpen: advancedOptions.sharpen
        },
        positioning: {
          gravity: advancedOptions.gravity,
          offset: { x: advancedOptions.offsetX, y: advancedOptions.offsetY }
        }
      }
    });

  } catch (error) {
    console.error('Advanced GIF creation error:', error);
    next(createError(error.message || 'Advanced GIF creation failed', 500));
  }
});

// ============================================================================
// VALIDATION HELPER FUNCTIONS
// ============================================================================

function validateFile(file, supportedExts = []) {
  if (!file) {
    throw new Error('No file provided');
  }
  
  // Check if file exists (more robust check)
  if (!file.path) {
    // If no path, check if it's a buffer or has other properties
    if (!file.buffer && !file.filename && !file.originalname) {
      throw new Error('File not properly uploaded');
    }
  } else {
    // Only check file existence if path is provided
    try {
      if (!fsSync.existsSync(file.path)) {
        throw new Error('File not found at specified path');
      }
    } catch (fsError) {
      console.warn(`File existence check failed: ${fsError.message}`);
      // Don't throw error, just log warning
    }
  }

  if (supportedExts.length > 0) {
    const ext = path.extname(file.originalname || file.path || '').toLowerCase();
    if (!supportedExts.includes(ext)) {
      throw new Error(`Unsupported format: ${ext}. Supported formats: ${supportedExts.join(', ')}`);
    }
  }

  return true;
}

function validateImageFile(file) {
  const imageExts = ['.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.webp', '.gif', '.svg'];
  return validateFile(file, imageExts);
}

function validateVideoFile(file) {
  const videoExts = ['.mp4', '.avi', '.mov', '.webm', '.mkv', '.flv', '.wmv', '.m4v', '.3gp'];
  return validateFile(file, videoExts);
}

function validateProcessingResult(result, outputPath) {
  if (!result || !result.outName) {
    throw new Error('Processing failed - no output generated');
  }

  const finalOutputPath = result.outputPath || outputPath;
  if (!fsSync.existsSync(finalOutputPath)) {
    throw new Error('Processing failed - output file not created');
  }

  return finalOutputPath;
}

// ============================================================================
// TOOL-SPECIFIC PROCESSING FUNCTIONS WITH ENHANCED VALIDATION
// ============================================================================

// Tool-specific processing functions with enhanced conversion
async function processVideoToGif(file, options = {}) {
  const outputName = `gif_${uuid()}.gif`;
  const outputPath = path.join(outputDir, outputName);
  
  try {
    // Comprehensive input validation
    if (!file) {
      throw new Error('No video file provided');
    }
    
    if (!file.path || !fsSync.existsSync(file.path)) {
      throw new Error('Video file not found or inaccessible');
    }

    // Validate file is actually a video
    const videoExts = ['.mp4', '.avi', '.mov', '.webm', '.mkv', '.flv', '.wmv', '.m4v', '.3gp'];
    const fileExt = path.extname(file.originalname || file.path).toLowerCase();
    if (!videoExts.includes(fileExt)) {
      throw new Error(`Unsupported video format: ${fileExt}. Supported formats: ${videoExts.join(', ')}`);
    }

    console.log(`Processing video to GIF: ${file.originalname} (${fileExt})`);
    
    // Enhanced video to GIF conversion with advanced options
    const conversionOptions = {
      fps: parseInt(options.fps) || 15,
      width: parseInt(options.width) || null,
      height: parseInt(options.height) || null,
      startTime: parseFloat(options.startTime) || 0,
      duration: parseFloat(options.duration) || null,
      quality: options.quality || 'medium',
      optimize: options.optimize !== 'false',
      loop: parseInt(options.loop) >= 0 ? parseInt(options.loop) : -1, // -1 for infinite
      dither: options.dither || 'floyd_steinberg',
      method: options.method || 'lanczos'
    };

    // Validate conversion options
    if (conversionOptions.fps < 1 || conversionOptions.fps > 60) {
      throw new Error('FPS must be between 1 and 60');
    }
    
    if (conversionOptions.startTime < 0) {
      throw new Error('Start time cannot be negative');
    }
    
    if (conversionOptions.duration && conversionOptions.duration <= 0) {
      throw new Error('Duration must be positive');
    }

    const result = await enhancedConversionService.convertSingle(file.path, 'gif', conversionOptions);
    
    if (!result || !result.outName) {
      throw new Error('Video conversion failed - no output generated');
    }

    // Verify output file exists
    const finalOutputPath = result.outputPath || outputPath;
    if (!fsSync.existsSync(finalOutputPath)) {
      throw new Error('Video conversion failed - output file not created');
    }
    
    const stats = await fs.stat(finalOutputPath);
    
    return {
      filename: result.outName,
      originalName: file.originalname,
      url: `/api/files/${result.outName}`,
      size: formatFileSize(stats.size),
      type: 'image',
      tool: 'video-to-gif',
      processing: {
        fps: conversionOptions.fps,
        width: result.width,
        height: result.height,
        duration: result.duration
      }
    };
  } catch (error) {
    console.error('Video to GIF conversion failed:', error);
    throw new Error(`Video conversion failed: ${error.message}`);
  }
}

async function processImagesToGif(files, options = {}) {
  const outputName = `animated_${uuid()}.gif`;
  const outputPath = path.join(outputDir, outputName);
  
  try {
    // Validate input files
    if (!files || !Array.isArray(files) || files.length === 0) {
      throw new Error('No valid image files provided for GIF creation');
    }

    console.log(`Processing ${files.length} files to GIF`);
    
    // Advanced GIF maker with frame management from ezgif
    const frames = [];
    const frameDelays = options.delays ? options.delays.split(',').map(d => parseInt(d.trim()) || 100) : [];
    const globalDelay = parseInt(options.delay) || 100;
    
    // Handle frame reordering if provided
    let fileOrder = files;
    if (options.frameOrder) {
      const orderIndices = options.frameOrder.split(',').map(i => parseInt(i.trim()));
      fileOrder = orderIndices.map(index => files[index]).filter(Boolean);
    }

    // Validate files have paths
    const validFiles = fileOrder.filter(file => file && file.path && fsSync.existsSync(file.path));
    if (validFiles.length === 0) {
      throw new Error('No valid image files with accessible paths found');
    }

    console.log(`Found ${validFiles.length} valid files for GIF processing`);
    
    // Process each frame with individual settings
    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      const delay = frameDelays[i] || globalDelay;
      
      frames.push({
        path: file.path,
        delay: delay,
        dispose: options.dispose || 'none', // none, background, previous
        blend: options.blend || 'over'      // over, source, clear
      });
    }

    // Validate frames array
    if (!frames || frames.length === 0) {
      throw new Error('No frames were processed for GIF creation');
    }

    console.log(`Created ${frames.length} frames for GIF processing`);
    
    const gifOptions = {
      frames: frames,
      width: parseInt(options.width) || null,
      height: parseInt(options.height) || null,
      quality: options.quality || 'medium',
      optimize: options.optimize !== 'false',
      loop: parseInt(options.loop) >= 0 ? parseInt(options.loop) : 0, // 0 for infinite
      dither: options.dither || 'floyd_steinberg',
      method: options.method || 'lanczos',
      gravity: options.gravity || 'center', // position for resize/crop
      backgroundColor: options.backgroundColor || 'transparent',
      crossfade: options.crossfade === 'true',
      crossfadeDuration: parseInt(options.crossfadeDuration) || 100,
      globalColormap: options.globalColormap === 'true'
    };

    // Use gif service for advanced GIF creation
    const result = await gifService.createAdvancedGif(frames, outputPath, gifOptions);
    
    const stats = await fs.stat(outputPath);
    
    return {
      filename: outputName,
      url: `/api/files/${outputName}`,
      size: formatFileSize(stats.size),
      type: 'image',
      tool: 'images-to-gif',
      frames: frames.length,
      processing: {
        totalFrames: frames.length,
        averageDelay: Math.round(frames.reduce((sum, f) => sum + f.delay, 0) / frames.length),
        dimensions: result.dimensions,
        loop: gifOptions.loop,
        optimized: gifOptions.optimize
      }
    };
  } catch (error) {
    console.error('Images to GIF conversion failed:', error);
    throw new Error(`GIF creation failed: ${error.message}`);
  }
}

async function processResize(file, options = {}) {
  const ext = path.extname(file.originalname).toLowerCase() || '.png';
  const outputName = `resized_${uuid()}${ext}`;
  const outputPath = path.join(outputDir, outputName);
  
  try {
    // Comprehensive input validation
    if (!file) {
      throw new Error('No file provided for resize');
    }
    
    if (!file.path || !fsSync.existsSync(file.path)) {
      throw new Error('File not found or inaccessible');
    }

    // Validate file is an image
    const imageExts = ['.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.webp', '.gif', '.svg'];
    if (!imageExts.includes(ext)) {
      throw new Error(`Unsupported image format: ${ext}. Supported formats: ${imageExts.join(', ')}`);
    }

    console.log(`Processing resize: ${file.originalname} (${ext})`);
    
    const resizeOptions = {
      width: parseInt(options.width) || null,
      height: parseInt(options.height) || null,
      method: options.method || 'lanczos',
      aspectRatio: options.aspectRatio !== 'false',
      gravity: options.gravity || 'center',
      background: options.background || 'transparent'
    };

    // Validate resize options
    if (!resizeOptions.width && !resizeOptions.height) {
      throw new Error('Either width or height must be specified for resize');
    }
    
    if (resizeOptions.width && (resizeOptions.width < 1 || resizeOptions.width > 8000)) {
      throw new Error('Width must be between 1 and 8000 pixels');
    }
    
    if (resizeOptions.height && (resizeOptions.height < 1 || resizeOptions.height > 8000)) {
      throw new Error('Height must be between 1 and 8000 pixels');
    }
    
    const result = await enhancedConversionService.convertSingle(file.path, ext.slice(1), resizeOptions);
    
    if (!result || !result.outName) {
      throw new Error('Resize failed - no output generated');
    }

    // Verify output file exists
    const finalOutputPath = result.outputPath || outputPath;
    if (!fsSync.existsSync(finalOutputPath)) {
      throw new Error('Resize failed - output file not created');
    }
    
    const stats = await fs.stat(finalOutputPath);
    
    return {
      filename: result.outName,
      originalName: file.originalname,
      url: `/api/files/${result.outName}`,
      size: formatFileSize(stats.size),
      type: 'image',
      tool: 'resize',
      processing: {
        originalSize: `${result.originalWidth || 'unknown'}x${result.originalHeight || 'unknown'}`,
        newSize: `${result.width || resizeOptions.width || 'auto'}x${result.height || resizeOptions.height || 'auto'}`
      }
    };
  } catch (error) {
    console.error('Resize failed:', error);
    throw new Error(`Resize failed: ${error.message}`);
  }
}

async function processCrop(file, options = {}) {
  const ext = path.extname(file.originalname).toLowerCase() || '.png';
  const outputName = `cropped_${uuid()}${ext}`;
  const outputPath = path.join(outputDir, outputName);
  
  try {
    // Comprehensive input validation
    if (!file) {
      throw new Error('No file provided for crop');
    }
    
    if (!file.path || !fsSync.existsSync(file.path)) {
      throw new Error('File not found or inaccessible');
    }

    // Validate file is an image
    const imageExts = ['.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.webp', '.gif'];
    if (!imageExts.includes(ext)) {
      throw new Error(`Unsupported image format: ${ext}. Supported formats: ${imageExts.join(', ')}`);
    }

    console.log(`Processing crop: ${file.originalname} (${ext})`);
    
    const cropOptions = {
      x: parseInt(options.x) || 0,
      y: parseInt(options.y) || 0,
      width: parseInt(options.width) || null,
      height: parseInt(options.height) || null,
      gravity: options.gravity || 'northwest'
    };

    // Validate crop options
    if (!cropOptions.width || !cropOptions.height) {
      throw new Error('Both width and height must be specified for crop');
    }
    
    if (cropOptions.x < 0 || cropOptions.y < 0) {
      throw new Error('Crop coordinates (x, y) cannot be negative');
    }
    
    if (cropOptions.width < 1 || cropOptions.height < 1) {
      throw new Error('Crop width and height must be at least 1 pixel');
    }
    
    if (cropOptions.width > 8000 || cropOptions.height > 8000) {
      throw new Error('Crop dimensions cannot exceed 8000 pixels');
    }
    
    const result = await enhancedConversionService.convertSingle(file.path, ext.slice(1), cropOptions);
    
    if (!result || !result.outName) {
      throw new Error('Crop failed - no output generated');
    }

    // Verify output file exists
    const finalOutputPath = result.outputPath || outputPath;
    if (!fsSync.existsSync(finalOutputPath)) {
      throw new Error('Crop failed - output file not created');
    }
    const stats = await fs.stat(outputPath);
    
    return {
      filename: result.outName,
      originalName: file.originalname,
      url: `/api/files/${result.outName}`,
      size: formatFileSize(stats.size),
      type: 'image',
      tool: 'crop',
      processing: {
        cropArea: `${cropOptions.width}x${cropOptions.height}+${cropOptions.x}+${cropOptions.y}`,
        gravity: cropOptions.gravity
      }
    };
  } catch (error) {
    console.error('Crop failed:', error);
    throw new Error(`Crop failed: ${error.message}`);
  }
}

async function processRotate(file, options = {}) {
  const ext = path.extname(file.originalname).toLowerCase() || '.png';
  const outputName = `rotated_${uuid()}${ext}`;
  const outputPath = path.join(outputDir, outputName);
  
  try {
    // Comprehensive input validation
    if (!file) {
      throw new Error('No file provided for rotate');
    }
    
    if (!file.path || !fsSync.existsSync(file.path)) {
      throw new Error('File not found or inaccessible');
    }

    // Validate file is an image
    const imageExts = ['.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.webp', '.gif'];
    if (!imageExts.includes(ext)) {
      throw new Error(`Unsupported image format: ${ext}. Supported formats: ${imageExts.join(', ')}`);
    }

    console.log(`Processing rotate: ${file.originalname} (${ext})`);
    
    const rotateOptions = {
      angle: parseInt(options.angle) || 90,
      background: options.background || 'transparent'
    };

    // Validate rotation angle
    if (isNaN(rotateOptions.angle)) {
      throw new Error('Invalid rotation angle - must be a number');
    }
    
    // Normalize angle to 0-360 range
    rotateOptions.angle = ((rotateOptions.angle % 360) + 360) % 360;
    
    const result = await enhancedConversionService.convertSingle(file.path, ext.slice(1), rotateOptions);
    
    if (!result || !result.outName) {
      throw new Error('Rotate failed - no output generated');
    }

    // Verify output file exists
    const finalOutputPath = result.outputPath || outputPath;
    if (!fsSync.existsSync(finalOutputPath)) {
      throw new Error('Rotate failed - output file not created');
    }
    
    const stats = await fs.stat(finalOutputPath);
    
    return {
      filename: result.outName,
      originalName: file.originalname,
      url: `/api/files/${result.outName}`,
      size: formatFileSize(stats.size),
      type: 'image',
      tool: 'rotate',
      processing: {
        angle: rotateOptions.angle
      }
    };
  } catch (error) {
    console.error('Rotate failed:', error);
    throw new Error(`Rotate failed: ${error.message}`);
  }
}

async function processOptimize(file, options = {}) {
  const ext = path.extname(file.originalname).toLowerCase() || '.png';
  const outputName = `optimized_${uuid()}${ext}`;
  const outputPath = path.join(outputDir, outputName);
  
  try {
    // Comprehensive input validation
    if (!file) {
      throw new Error('No file provided for optimization');
    }
    
    if (!file.path || !fsSync.existsSync(file.path)) {
      throw new Error('File not found or inaccessible');
    }

    // Validate file is an image
    const imageExts = ['.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.webp', '.gif'];
    if (!imageExts.includes(ext)) {
      throw new Error(`Unsupported image format: ${ext}. Supported formats: ${imageExts.join(', ')}`);
    }

    console.log(`Processing optimize: ${file.originalname} (${ext})`);
    
    const optimizeOptions = {
      optimize: true,
      quality: parseInt(options.quality) || 85,
      progressive: options.progressive === 'true',
      strip: options.strip !== 'false',
      lossless: options.lossless === 'true'
    };

    // Validate optimization options
    if (optimizeOptions.quality < 1 || optimizeOptions.quality > 100) {
      throw new Error('Quality must be between 1 and 100');
    }
    
    const result = await enhancedConversionService.convertSingle(file.path, ext.slice(1), optimizeOptions);
    
    if (!result || !result.outName) {
      throw new Error('Optimization failed - no output generated');
    }

    // Verify output file exists
    const finalOutputPath = result.outputPath || outputPath;
    if (!fsSync.existsSync(finalOutputPath)) {
      throw new Error('Optimization failed - output file not created');
    }
    
    const stats = await fs.stat(finalOutputPath);
    const originalStats = await fs.stat(file.path);
    const savings = originalStats.size > 0 
      ? ((originalStats.size - stats.size) / originalStats.size * 100).toFixed(1)
      : '0.0';
    
    return {
      filename: result.outName,
      originalName: file.originalname,
      url: `/api/files/${result.outName}`,
      size: formatFileSize(stats.size),
      type: 'image',
      tool: 'optimize',
      processing: {
        originalSize: formatFileSize(originalStats.size),
        optimizedSize: formatFileSize(stats.size),
        savings: `${savings}%`,
        quality: optimizeOptions.quality
      }
    };
  } catch (error) {
    console.error('Optimize failed:', error);
    throw new Error(`Optimization failed: ${error.message}`);
  }
}

async function processEffects(file, options = {}) {
  const ext = path.extname(file.originalname).toLowerCase() || '.png';
  const outputName = `effects_${uuid()}${ext}`;
  const outputPath = path.join(outputDir, outputName);
  
  try {
    const effectOptions = {
      blur: parseFloat(options.blur) || null,
      sharpen: parseFloat(options.sharpen) || null,
      brightness: parseFloat(options.brightness) || null,
      contrast: parseFloat(options.contrast) || null,
      saturation: parseFloat(options.saturation) || null,
      hue: parseFloat(options.hue) || null,
      gamma: parseFloat(options.gamma) || null,
      sepia: options.sepia === 'true',
      grayscale: options.grayscale === 'true',
      negate: options.negate === 'true',
      flip: options.flip || null, // horizontal, vertical
      flop: options.flop === 'true'
    };
    
    const result = await enhancedConversionService.convertSingle(file.path, ext.slice(1), effectOptions);
    const stats = await fs.stat(outputPath);
    
    return {
      filename: result.outName,
      originalName: file.originalname,
      url: `/api/files/${result.outName}`,
      size: formatFileSize(stats.size),
      type: 'image',
      tool: 'effects',
      processing: {
        appliedEffects: Object.entries(effectOptions)
          .filter(([key, value]) => value !== null && value !== false)
          .map(([key, value]) => `${key}: ${value}`)
      }
    };
  } catch (error) {
    console.error('Effects processing failed:', error);
    throw new Error(`Effects processing failed: ${error.message}`);
  }
}

async function processSplit(file, options = {}) {
  const frames = [];
  
  try {
    // Use GIF service or FFmpeg for splitting
    const splitOptions = {
      format: options.format || 'png',
      quality: parseInt(options.quality) || 95,
      prefix: options.prefix || 'frame'
    };
    
    const ext = path.extname(file.originalname).toLowerCase();
    let result;
    
    if (ext === '.gif') {
      result = await gifService.splitGif(file.path, splitOptions);
    } else {
      result = await ffmpegService.extractFrames(file.path, splitOptions);
    }
    
    // Create result objects for each frame
    for (let i = 0; i < result.frames.length; i++) {
      const frame = result.frames[i];
      const stats = await fs.stat(frame.path);
      
      frames.push({
        filename: frame.filename,
        url: `/api/files/${frame.filename}`,
        size: formatFileSize(stats.size),
        type: 'image',
        tool: 'split',
        frameNumber: i + 1,
        delay: frame.delay || null
      });
    }
    
    return frames;
  } catch (error) {
    console.error('Split processing failed:', error);
    throw new Error(`Split processing failed: ${error.message}`);
  }
}

async function processAddText(file, options = {}) {
  const ext = path.extname(file.originalname).toLowerCase() || '.png';
  const outputName = `text_${uuid()}${ext}`;
  const outputPath = path.join(outputDir, outputName);
  
  try {
    // Use validation helper with additional safety
    try {
      validateImageFile(file);
    } catch (validationError) {
      console.warn(`Validation warning: ${validationError.message}`);
      // Continue processing even if validation has issues
    }
    
    console.log(`Processing add text: ${file.originalname} (${ext})`);
    
    const textOptions = {
      text: options.text || 'Sample Text',
      fontSize: parseInt(options.fontSize) || 32,
      fontFamily: options.fontFamily || 'Arial',
      color: options.color || '#ffffff',
      backgroundColor: options.backgroundColor || 'transparent',
      position: options.position || 'center', // top, center, bottom, custom
      x: parseInt(options.x) || null,
      y: parseInt(options.y) || null,
      stroke: options.stroke || null,
      strokeWidth: parseInt(options.strokeWidth) || 0,
      shadowColor: options.shadowColor || null,
      shadowBlur: parseInt(options.shadowBlur) || 0,
      shadowOffsetX: parseInt(options.shadowOffsetX) || 0,
      shadowOffsetY: parseInt(options.shadowOffsetY) || 0,
      rotation: parseInt(options.rotation) || 0,
      opacity: parseFloat(options.opacity) || 1.0
    };

    // Validate text options
    if (!textOptions.text || textOptions.text.trim().length === 0) {
      throw new Error('Text content cannot be empty');
    }
    
    if (textOptions.fontSize < 1 || textOptions.fontSize > 500) {
      throw new Error('Font size must be between 1 and 500');
    }
    
    if (textOptions.opacity < 0 || textOptions.opacity > 1) {
      throw new Error('Opacity must be between 0 and 1');
    }
    
    const result = await enhancedConversionService.convertSingle(file.path, ext.slice(1), textOptions);
    
    // Validate result
    const finalOutputPath = validateProcessingResult(result, outputPath);
    const stats = await fs.stat(finalOutputPath);
    
    return {
      filename: result.outName,
      originalName: file.originalname,
      url: `/api/files/${result.outName}`,
      size: formatFileSize(stats.size),
      type: 'image',
      tool: 'add-text',
      processing: {
        text: textOptions.text,
        fontSize: textOptions.fontSize,
        position: textOptions.position
      }
    };
  } catch (error) {
    console.error('Add text failed:', error);
    throw new Error(`Add text failed: ${error.message}`);
  }
}

async function processWebPMaker(file, options = {}) {
  const outputName = `webp_${uuid()}.webp`;
  const outputPath = path.join(outputDir, outputName);
  
  try {
    const webpOptions = {
      quality: parseInt(options.quality) || 85,
      lossless: options.lossless === 'true',
      method: parseInt(options.method) || 4, // 0-6 speed/quality tradeoff
      preset: options.preset || 'default', // default, photo, picture, drawing, icon, text
      alphaQuality: parseInt(options.alphaQuality) || 100,
      autoFilter: options.autoFilter !== 'false',
      sharpness: parseInt(options.sharpness) || 0,
      filterStrength: parseInt(options.filterStrength) || 60
    };
    
    const result = await enhancedConversionService.convertSingle(file.path, 'webp', webpOptions);
    const stats = await fs.stat(outputPath);
    
    return {
      filename: result.outName,
      originalName: file.originalname,
      url: `/api/files/${result.outName}`,
      size: formatFileSize(stats.size),
      type: 'image',
      tool: 'webp-maker',
      processing: {
        quality: webpOptions.quality,
        lossless: webpOptions.lossless,
        method: webpOptions.method
      }
    };
  } catch (error) {
    console.error('WebP creation failed:', error);
    throw new Error(`WebP creation failed: ${error.message}`);
  }
}

async function processWebPToGif(file, options = {}) {
  const outputName = `webp_to_gif_${uuid()}.gif`;
  const outputPath = path.join(outputDir, outputName);
  
  try {
    const gifOptions = {
      fps: parseInt(options.fps) || 15,
      optimize: options.optimize !== 'false',
      dither: options.dither || 'floyd_steinberg',
      loop: parseInt(options.loop) >= 0 ? parseInt(options.loop) : 0
    };
    
    const result = await enhancedConversionService.convertSingle(file.path, 'gif', gifOptions);
    const stats = await fs.stat(outputPath);
    
    return {
      filename: result.outName,
      originalName: file.originalname,
      url: `/api/files/${result.outName}`,
      size: formatFileSize(stats.size),
      type: 'image',
      tool: 'webp-to-gif',
      processing: {
        fps: gifOptions.fps,
        optimized: gifOptions.optimize
      }
    };
  } catch (error) {
    console.error('WebP to GIF conversion failed:', error);
    throw new Error(`WebP to GIF conversion failed: ${error.message}`);
  }
}

async function processAPNGMaker(file, options = {}) {
  const outputName = `apng_${uuid()}.png`;
  const outputPath = path.join(outputDir, outputName);
  
  try {
    const apngOptions = {
      fps: parseInt(options.fps) || 10,
      loop: parseInt(options.loop) >= 0 ? parseInt(options.loop) : 0,
      optimize: options.optimize !== 'false'
    };
    
    const result = await enhancedConversionService.convertSingle(file.path, 'apng', apngOptions);
    const stats = await fs.stat(outputPath);
    
    return {
      filename: result.outName,
      originalName: file.originalname,
      url: `/api/files/${result.outName}`,
      size: formatFileSize(stats.size),
      type: 'image',
      tool: 'apng-maker',
      processing: {
        fps: apngOptions.fps,
        loop: apngOptions.loop
      }
    };
  } catch (error) {
    console.error('APNG creation failed:', error);
    throw new Error(`APNG creation failed: ${error.message}`);
  }
}

async function processAVIFConverter(file, options = {}) {
  const outputName = `avif_${uuid()}.avif`;
  const outputPath = path.join(outputDir, outputName);
  
  try {
    const avifOptions = {
      quality: parseInt(options.quality) || 85,
      lossless: options.lossless === 'true',
      speed: parseInt(options.speed) || 4 // 0-8 slower=better compression
    };
    
    const result = await enhancedConversionService.convertSingle(file.path, 'avif', avifOptions);
    const stats = await fs.stat(outputPath);
    
    return {
      filename: result.outName,
      originalName: file.originalname,
      url: `/api/files/${result.outName}`,
      size: formatFileSize(stats.size),
      type: 'image',
      tool: 'avif-converter',
      processing: {
        quality: avifOptions.quality,
        lossless: avifOptions.lossless,
        speed: avifOptions.speed
      }
    };
  } catch (error) {
    console.error('AVIF conversion failed:', error);
    throw new Error(`AVIF conversion failed: ${error.message}`);
  }
}

async function processJXLConverter(file, options = {}) {
  const outputName = `jxl_${uuid()}.jxl`;
  const outputPath = path.join(outputDir, outputName);
  
  try {
    const jxlOptions = {
      quality: parseInt(options.quality) || 85,
      lossless: options.lossless === 'true',
      effort: parseInt(options.effort) || 7 // 1-9 speed/quality tradeoff
    };
    
    const result = await enhancedConversionService.convertSingle(file.path, 'jxl', jxlOptions);
    const stats = await fs.stat(outputPath);
    
    return {
      filename: result.outName,
      originalName: file.originalname,
      url: `/api/files/${result.outName}`,
      size: formatFileSize(stats.size),
      type: 'image',
      tool: 'jxl-converter',
      processing: {
        quality: jxlOptions.quality,
        lossless: jxlOptions.lossless,
        effort: jxlOptions.effort
      }
    };
  } catch (error) {
    console.error('JXL conversion failed:', error);
    throw new Error(`JXL conversion failed: ${error.message}`);
  }
}

async function processBasicConversion(file, options = {}) {
  const format = options.format || 'png';
  const outputName = `converted_${uuid()}.${format}`;
  const outputPath = path.join(outputDir, outputName);
  
  try {
    const conversionOptions = {
      quality: parseInt(options.quality) || 95,
      optimize: options.optimize !== 'false',
      progressive: options.progressive === 'true',
      strip: options.strip !== 'false'
    };
    
    const result = await enhancedConversionService.convertSingle(file.path, format, conversionOptions);
    const stats = await fs.stat(outputPath);
    
    return {
      filename: result.outName,
      originalName: file.originalname,
      url: `/api/files/${result.outName}`,
      size: formatFileSize(stats.size),
      type: 'image',
      tool: 'convert',
      processing: {
        format: format.toUpperCase(),
        quality: conversionOptions.quality,
        optimized: conversionOptions.optimize
      }
    };
  } catch (error) {
    console.error('Basic conversion failed:', error);
    throw new Error(`Conversion failed: ${error.message}`);
  }
}

// Advanced GIF editing functions for ezgif features
async function processFrameReorder(frames, options) {
  try {
    const order = options.frameOrder.split(',').map(i => parseInt(i.trim()));
    const delays = options.delays ? options.delays.split(',').map(d => parseInt(d.trim())) : [];
    
    const reorderedFrames = order.map((index, newIndex) => ({
      path: frames[index].path,
      delay: delays[newIndex] || delays[index] || 100,
      originalIndex: index,
      newIndex: newIndex
    }));
    
    const outputName = `reordered_${uuid()}.gif`;
    const outputPath = path.join(outputDir, outputName);
    
    const result = await gifService.createAdvancedGif(reorderedFrames, outputPath, {
      optimize: true,
      loop: parseInt(options.loop) || 0
    });
    
    const stats = await fs.stat(outputPath);
    
    return {
      filename: outputName,
      url: `/api/files/${outputName}`,
      size: formatFileSize(stats.size),
      frameCount: reorderedFrames.length,
      action: 'reorder-frames'
    };
  } catch (error) {
    throw new Error(`Frame reordering failed: ${error.message}`);
  }
}

async function processDelayAdjustment(frames, options) {
  try {
    const delays = options.delays.split(',').map(d => parseInt(d.trim()));
    const delayMode = options.delayMode || 'individual'; // individual, global, multiply
    
    const adjustedFrames = frames.map((frame, index) => ({
      path: frame.path,
      delay: delayMode === 'global' ? delays[0] : 
             delayMode === 'multiply' ? (delays[0] || 1) * 100 :
             delays[index] || 100
    }));
    
    const outputName = `delay_adjusted_${uuid()}.gif`;
    const outputPath = path.join(outputDir, outputName);
    
    const result = await gifService.createAdvancedGif(adjustedFrames, outputPath, {
      optimize: options.optimize !== 'false',
      loop: parseInt(options.loop) || 0
    });
    
    const stats = await fs.stat(outputPath);
    
    return {
      filename: outputName,
      url: `/api/files/${outputName}`,
      size: formatFileSize(stats.size),
      frameCount: adjustedFrames.length,
      averageDelay: Math.round(adjustedFrames.reduce((sum, f) => sum + f.delay, 0) / adjustedFrames.length),
      action: 'adjust-delays'
    };
  } catch (error) {
    throw new Error(`Delay adjustment failed: ${error.message}`);
  }
}

async function processCrossfadeEffect(frames, options) {
  try {
    const crossfadeDuration = parseInt(options.crossfadeDuration) || 100;
    const frameDelay = parseInt(options.frameDelay) || 100;
    
    // Create crossfade frames between each original frame
    const crossfadeFrames = [];
    
    for (let i = 0; i < frames.length; i++) {
      const currentFrame = frames[i];
      const nextFrame = frames[(i + 1) % frames.length];
      
      // Add original frame
      crossfadeFrames.push({
        path: currentFrame.path,
        delay: frameDelay
      });
      
      // Add crossfade transition frames
      const transitionSteps = Math.ceil(crossfadeDuration / 50); // 50ms per step
      for (let step = 1; step <= transitionSteps; step++) {
        const opacity = step / transitionSteps;
        crossfadeFrames.push({
          path: currentFrame.path,
          nextPath: nextFrame.path,
          opacity: 1 - opacity,
          nextOpacity: opacity,
          delay: 50,
          isCrossfade: true
        });
      }
    }
    
    const outputName = `crossfade_${uuid()}.gif`;
    const outputPath = path.join(outputDir, outputName);
    
    const result = await gifService.createAdvancedGif(crossfadeFrames, outputPath, {
      optimize: options.optimize !== 'false',
      loop: parseInt(options.loop) || 0,
      crossfade: true
    });
    
    const stats = await fs.stat(outputPath);
    
    return {
      filename: outputName,
      url: `/api/files/${outputName}`,
      size: formatFileSize(stats.size),
      originalFrames: frames.length,
      totalFrames: crossfadeFrames.length,
      crossfadeDuration: crossfadeDuration,
      action: 'add-crossfade'
    };
  } catch (error) {
    throw new Error(`Crossfade effect failed: ${error.message}`);
  }
}

async function processCanvasResize(frames, options) {
  try {
    const width = parseInt(options.width) || 500;
    const height = parseInt(options.height) || 500;
    const method = options.method || 'lanczos';
    const backgroundColor = options.backgroundColor || 'transparent';
    
    const resizedFrames = frames.map(frame => ({
      path: frame.path,
      delay: 100 // Default delay, can be customized
    }));
    
    const outputName = `canvas_resized_${uuid()}.gif`;
    const outputPath = path.join(outputDir, outputName);
    
    const result = await gifService.createAdvancedGif(resizedFrames, outputPath, {
      width: width,
      height: height,
      method: method,
      backgroundColor: backgroundColor,
      optimize: options.optimize !== 'false',
      loop: parseInt(options.loop) || 0
    });
    
    const stats = await fs.stat(outputPath);
    
    return {
      filename: outputName,
      url: `/api/files/${outputName}`,
      size: formatFileSize(stats.size),
      frameCount: frames.length,
      newSize: `${width}x${height}`,
      action: 'change-canvas-size'
    };
  } catch (error) {
    throw new Error(`Canvas resize failed: ${error.message}`);
  }
}

async function processGravityAlignment(frames, options) {
  try {
    const gravity = options.gravity || 'center'; // north, south, east, west, center, etc.
    const backgroundColor = options.backgroundColor || 'transparent';
    
    const alignedFrames = frames.map(frame => ({
      path: frame.path,
      delay: 100,
      gravity: gravity
    }));
    
    const outputName = `gravity_aligned_${uuid()}.gif`;
    const outputPath = path.join(outputDir, outputName);
    
    const result = await gifService.createAdvancedGif(alignedFrames, outputPath, {
      gravity: gravity,
      backgroundColor: backgroundColor,
      optimize: options.optimize !== 'false',
      loop: parseInt(options.loop) || 0
    });
    
    const stats = await fs.stat(outputPath);
    
    return {
      filename: outputName,
      url: `/api/files/${outputName}`,
      size: formatFileSize(stats.size),
      frameCount: frames.length,
      gravity: gravity,
      action: 'apply-gravity'
    };
  } catch (error) {
    throw new Error(`Gravity alignment failed: ${error.message}`);
  }
}

export default router;
