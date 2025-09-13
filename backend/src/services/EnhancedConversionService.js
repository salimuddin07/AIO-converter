import fs from 'fs/promises';
import { createWriteStream } from 'fs';
import sharp from 'sharp';
import path from 'path';
import https from 'https';
import http from 'http';
import { v4 as uuid } from 'uuid';
import { outputDir, tempDir } from '../utils/FilePathUtils.js';
import { config } from '../config/index.js';
import FFmpegService from './FfmpegService.js';
import SharpService from './SharpService.js';
import JimpService from './JimpService.js';
import GifService from './GifService.js';
import ImageMagickService from './ImageMagickService.js';

// Initialize service instances
const ffmpegService = new FFmpegService();
const sharpService = new SharpService();
const jimpService = new JimpService();
const gifService = new GifService();
const imageMagickService = new ImageMagickService();

/**
 * Enhanced Conversion Service - Intelligently selects optimal processing library
 * Integrates: FFmpeg, Sharp, Jimp, GIF-JS, ImageMagick
 */
class EnhancedConversionService {
    constructor() {
        this.supportedFormats = new Set([
            // Image formats
            'jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'tif', 'webp', 'avif', 'svg',
            // Video formats
            'mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv', 'webm', 'm4v', '3gp',
            // Audio formats
            'mp3', 'aac', 'wav', 'ogg', 'flac', 'm4a',
            // Advanced formats
            'eps', 'ps', 'pdf', 'psd', 'ico', 'cur'
        ]);
    }

    /**
     * Determine the best processing library for the conversion task
     */
    selectOptimalProcessor(inputPath, targetFormat, options = {}) {
        const inputExt = path.extname(inputPath).toLowerCase().slice(1);
        
        // For video processing or video-to-gif conversion
        if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv', 'webm', 'm4v', '3gp'].includes(inputExt)) {
            return { service: ffmpegService, library: 'ffmpeg' };
        }
        
        // For animated GIF creation or GIF processing
        if (targetFormat === 'gif' && (options.animated || options.frames)) {
            return { service: gifService, library: 'gif' };
        }
        
        // For formats that require high performance (large images)
        if (options.highPerformance || (options.width && options.width > 2000) || (options.height && options.height > 2000)) {
            return { service: sharpService, library: 'sharp' };
        }
        
        // For complex effects or advanced image manipulation
        if (options.effects && (options.effects.emboss || options.effects.solarize || options.effects.colorMatrix)) {
            return { service: imageMagickService, library: 'imagemagick' };
        }
        
        // For text overlay operations (Jimp has good built-in font support)
        if (options.textOverlay && !options.advancedText) {
            return { service: jimpService, library: 'jimp' };
        }
        
        // For advanced text with typography control
        if (options.textOverlay && options.advancedText) {
            return { service: imageMagickService, library: 'imagemagick' };
        }
        
        // For AVIF/WebP conversion (Sharp excels at these)
        if (['avif', 'webp'].includes(targetFormat)) {
            return { service: sharpService, library: 'sharp' };
        }
        
        // For rare/exotic formats that Sharp might not support
        if (!this.isSharpSupported(inputPath) || !this.isSharpSupported(`dummy.${targetFormat}`, 'output')) {
            if (imageMagickService.isSupported(inputPath)) {
                return { service: imageMagickService, library: 'imagemagick' };
            }
            if (jimpService.isSupported(inputPath)) {
                return { service: jimpService, library: 'jimp' };
            }
        }
        
        // Default to Sharp for most image processing (fastest and most efficient)
        return { service: sharpService, library: 'sharp' };
    }

    /**
     * Check if Sharp supports the format
     */
    isSharpSupported(filePath, type = 'input') {
        const supportedInput = ['jpeg', 'jpg', 'png', 'webp', 'avif', 'tiff', 'tif', 'svg', 'gif'];
        const supportedOutput = ['jpeg', 'jpg', 'png', 'webp', 'avif', 'tiff', 'tif'];
        
        const ext = path.extname(filePath).toLowerCase().slice(1);
        return type === 'input' ? supportedInput.includes(ext) : supportedOutput.includes(ext);
    }

    /**
     * Enhanced single file conversion with intelligent library selection
     */
    async convertSingle(filePath, targetFormat, options = {}) {
        const id = uuid();
        const outName = `${id}.${targetFormat}`;
        const outPath = path.join(outputDir, outName);
        
        console.log(`\n=== ENHANCED CONVERSION START ===`);
        console.log(`Input: ${filePath}`);
        console.log(`Format: ${targetFormat}`);
        console.log(`Output: ${outName}`);
        console.log(`Options:`, JSON.stringify(options, null, 2));
        
        // Select optimal processing library
        const { service, library } = this.selectOptimalProcessor(filePath, targetFormat, options);
        console.log(`Selected processor: ${library}`);
        console.log(`=================================`);
        
        try {
            let result;
            
            // Special handling for specific formats and operations
            if (targetFormat === 'svg') {
                return await this.handleSvgConversion(filePath, outPath, options);
            }
            
            // Use selected service for conversion
            switch (library) {
                case 'ffmpeg':
                    result = await this.processWithFFmpeg(filePath, outPath, targetFormat, options);
                    break;
                
                case 'sharp':
                    result = await this.processWithSharp(filePath, outPath, targetFormat, options);
                    break;
                
                case 'jimp':
                    result = await this.processWithJimp(filePath, outPath, targetFormat, options);
                    break;
                
                case 'imagemagick':
                    result = await this.processWithImageMagick(filePath, outPath, targetFormat, options);
                    break;
                
                case 'gif':
                    result = await this.processWithGif(filePath, outPath, options);
                    break;
                
                default:
                    result = await this.processWithSharp(filePath, outPath, targetFormat, options);
            }
            
            console.log(`Conversion completed using ${library}`);
            console.log(`Output: ${result.outputPath || result.outPath || outPath}, Size: ${result.size} bytes`);
            
            return {
                outName,
                outPath: result.outputPath || result.outPath || outPath,
                size: result.size,
                processor: library,
                processingDetails: result
            };
            
        } catch (error) {
            console.error(`Conversion failed with ${library}:`, error.message);
            
            // Try fallback with Sharp if not already used
            if (library !== 'sharp') {
                console.log('Attempting fallback with Sharp...');
                try {
                    const fallbackResult = await this.sharpFallback(filePath, outPath, targetFormat, options);
                    return {
                        outName,
                        outPath: fallbackResult.outPath,
                        size: fallbackResult.size,
                        processor: 'sharp-fallback'
                    };
                } catch (fallbackError) {
                    console.error('Fallback conversion also failed:', fallbackError.message);
                    throw new Error(`Conversion failed with ${library}: ${error.message}. Fallback also failed: ${fallbackError.message}`);
                }
            } else {
                throw error;
            }
        }
    }

    /**
     * Process with FFmpeg
     */
    async processWithFFmpeg(filePath, outPath, targetFormat, options) {
        if (targetFormat === 'gif') {
            return await ffmpegService.videoToGif(filePath, outPath, {
                fps: options.fps || 10,
                scale: options.scale,
                quality: options.quality || 'medium',
                startTime: options.startTime,
                duration: options.duration
            });
        } else {
            return await ffmpegService.convertFormat(filePath, outPath, {
                quality: options.quality || 'high',
                codec: options.codec,
                bitrate: options.bitrate
            });
        }
    }

    /**
     * Process with Sharp
     */
    async processWithSharp(filePath, outPath, targetFormat, options) {
        if (options.resize) {
            return await sharpService.resizeImage(filePath, outPath, {
                width: options.resize.width,
                height: options.resize.height,
                fit: options.resize.fit || 'cover',
                quality: options.quality || 85,
                outputFormat: targetFormat
            });
        } else if (options.crop) {
            return await sharpService.cropImage(filePath, outPath, {
                x: options.crop.x,
                y: options.crop.y,
                width: options.crop.width,
                height: options.crop.height,
                quality: options.quality || 85
            });
        } else if (options.effects) {
            return await sharpService.applyEffects(filePath, outPath, {
                ...options.effects,
                quality: options.quality || 85
            });
        } else {
            return await sharpService.convertFormat(filePath, outPath, {
                quality: options.quality || 85,
                progressive: options.progressive,
                lossless: options.lossless
            });
        }
    }

    /**
     * Process with Jimp
     */
    async processWithJimp(filePath, outPath, targetFormat, options) {
        if (options.textOverlay) {
            return await jimpService.addTextOverlay(filePath, outPath, {
                text: options.textOverlay.text,
                x: options.textOverlay.x || 10,
                y: options.textOverlay.y || 10,
                fontName: options.textOverlay.font || 'FONT_SANS_16_BLACK',
                quality: options.quality || 85
            });
        } else if (options.effects) {
            return await jimpService.applyEffects(filePath, outPath, {
                ...options.effects,
                quality: options.quality || 85
            });
        } else if (options.resize) {
            return await jimpService.resizeImage(filePath, outPath, {
                width: options.resize.width,
                height: options.resize.height,
                mode: options.resize.mode || 'bilinear',
                quality: options.quality || 85
            });
        } else {
            return await jimpService.convertFormat(filePath, outPath, {
                quality: options.quality || 85
            });
        }
    }

    /**
     * Process with ImageMagick
     */
    async processWithImageMagick(filePath, outPath, targetFormat, options) {
        if (options.textOverlay && options.advancedText) {
            return await imageMagickService.addTextOverlay(filePath, outPath, {
                text: options.textOverlay.text,
                x: options.textOverlay.x || 10,
                y: options.textOverlay.y || 30,
                font: options.textOverlay.font || 'Arial',
                fontSize: options.textOverlay.fontSize || 16,
                fontColor: options.textOverlay.color || 'white',
                strokeColor: options.textOverlay.strokeColor,
                strokeWidth: options.textOverlay.strokeWidth,
                quality: options.quality || 85
            });
        } else if (options.effects) {
            return await imageMagickService.applyEffects(filePath, outPath, {
                ...options.effects,
                quality: options.quality || 85
            });
        } else {
            return await imageMagickService.convertFormat(filePath, outPath, {
                quality: options.quality || 85,
                compress: options.compress,
                colorspace: options.colorspace
            });
        }
    }

    /**
     * Process with GIF service
     */
    async processWithGif(filePath, outPath, options) {
        if (options.frames && Array.isArray(options.frames)) {
            return await gifService.createAnimatedGif(options.frames, {
                frameDelay: options.frameDelay || 20,
                quality: options.quality || 8,
                loop: options.loop || 0
            });
        } else {
            // Single image GIF optimization
            return await gifService.optimizeGif(filePath, outPath, {
                quality: options.quality || 10
            });
        }
    }

    /**
     * Handle SVG conversion specially
     */
    async handleSvgConversion(filePath, outPath, options) {
        console.log('SVG conversion requested');
        const meta = await sharp(filePath).metadata().catch(() => ({}));
        
        if (meta?.format === 'svg' || path.extname(filePath).toLowerCase() === '.svg') {
            console.log('Input is SVG, copying file');
            await fs.copyFile(filePath, outPath);
            const stat = await fs.stat(outPath);
            return { outName: path.basename(outPath), outPath, size: stat.size, processor: 'copy' };
        }
        
        // Convert raster to SVG with background removal
        console.log('Converting raster to SVG with background removal');
        try {
            const { data, info } = await sharp(filePath)
                .ensureAlpha()
                .raw()
                .toBuffer({ resolveWithObject: true });
            
            // Process pixel data to make white/light backgrounds transparent
            const pixels = new Uint8Array(data);
            for (let i = 0; i < pixels.length; i += 4) {
                const r = pixels[i];
                const g = pixels[i + 1];
                const b = pixels[i + 2];
                
                if (r > 240 && g > 240 && b > 240) {
                    pixels[i + 3] = 0; // Set alpha to 0 (transparent)
                }
            }
            
            const transparentPng = await sharp(pixels, {
                raw: { width: info.width, height: info.height, channels: 4 }
            }).png().toBuffer();
            
            const base64 = transparentPng.toString('base64');
            const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${info.width}" height="${info.height}" viewBox="0 0 ${info.width} ${info.height}">
  <image href="data:image/png;base64,${base64}" width="${info.width}" height="${info.height}"/>
</svg>`;
            
            await fs.writeFile(outPath, svg, 'utf8');
            const stat = await fs.stat(outPath);
            console.log(`SVG with background removal created, size: ${stat.size}`);
            return { outName: path.basename(outPath), outPath, size: stat.size, processor: 'sharp-svg' };
            
        } catch (e) {
            console.log('Background removal failed, creating simple SVG:', e.message);
            // Fallback to simple embedding
            const pngBuf = await sharp(filePath).png().toBuffer();
            const dim = await sharp(pngBuf).metadata();
            const base64 = pngBuf.toString('base64');
            const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${dim.width}" height="${dim.height}" viewBox="0 0 ${dim.width} ${dim.height}">
  <image href="data:image/png;base64,${base64}" width="${dim.width}" height="${dim.height}"/>
</svg>`;
            
            await fs.writeFile(outPath, svg, 'utf8');
            const stat = await fs.stat(outPath);
            return { outName: path.basename(outPath), outPath, size: stat.size, processor: 'sharp-svg-fallback' };
        }
    }

    /**
     * Sharp fallback conversion
     */
    async sharpFallback(filePath, outPath, targetFormat, options) {
        let pipeline = sharp(filePath);

        switch (targetFormat) {
            case 'jpg':
            case 'jpeg':
                pipeline = pipeline.jpeg({ quality: options.quality || config.jpegQuality || 85 });
                break;
            case 'png':
                pipeline = pipeline.png();
                break;
            case 'gif':
                pipeline = pipeline.gif();
                break;
            case 'webp':
                pipeline = pipeline.webp({
                    quality: options.quality || 80,
                    method: options.method || 6,
                    lossless: options.lossless || false
                });
                break;
            case 'avif':
                pipeline = pipeline.avif({ quality: options.quality || 80 });
                break;
            case 'tiff':
                pipeline = pipeline.tiff();
                break;
            default:
                throw new Error(`Unsupported target format: ${targetFormat}`);
        }
        
        await pipeline.toFile(outPath);
        const stat = await fs.stat(outPath);
        return { outPath, size: stat.size };
    }

    /**
     * Download image from URL
     */
    async downloadImageFromUrl(imageUrl) {
        return new Promise((resolve, reject) => {
            const id = uuid();
            const tempPath = path.join(tempDir, `url-${id}`);
            const protocol = imageUrl.startsWith('https') ? https : http;
            
            const request = protocol.get(imageUrl, (response) => {
                if (response.statusCode !== 200) {
                    reject(new Error(`Failed to download image: HTTP ${response.statusCode}`));
                    return;
                }
                
                const contentType = response.headers['content-type'];
                if (!contentType || !contentType.startsWith('image/')) {
                    reject(new Error('URL does not point to a valid image'));
                    return;
                }
                
                const writeStream = createWriteStream(tempPath);
                response.pipe(writeStream);
                
                writeStream.on('finish', () => {
                    writeStream.close();
                    resolve(tempPath);
                });
                
                writeStream.on('error', (err) => {
                    fs.unlink(tempPath).catch(() => {});
                    reject(err);
                });
            });
            
            request.on('error', (err) => {
                reject(new Error(`Failed to download image: ${err.message}`));
            });
            
            request.setTimeout(30000, () => {
                request.abort();
                reject(new Error('Download timeout'));
            });
        });
    }

    /**
     * Convert from URL with enhanced processing
     */
    async convertFromUrl(imageUrl, targetFormat, options = {}) {
        console.log(`\n=== ENHANCED URL CONVERSION START ===`);
        console.log(`URL: ${imageUrl}`);
        console.log(`Format: ${targetFormat}`);
        console.log(`=====================================`);
        
        let tempPath;
        try {
            tempPath = await this.downloadImageFromUrl(imageUrl);
            console.log(`Downloaded to temp: ${tempPath}`);
            
            const result = await this.convertSingle(tempPath, targetFormat, options);
            
            // Clean up temp file
            await fs.unlink(tempPath).catch(() => {});
            
            return result;
        } catch (error) {
            if (tempPath) {
                await fs.unlink(tempPath).catch(() => {});
            }
            throw error;
        }
    }

    /**
     * Batch conversion with intelligent processing
     */
    async batchConvert(files, targetFormat, options = {}) {
        const results = [];
        
        for (const file of files) {
            try {
                const result = await this.convertSingle(file.path, targetFormat, {
                    ...options,
                    // Add file-specific options if needed
                    filename: file.name
                });
                
                results.push({
                    success: true,
                    input: file.name,
                    ...result
                });
            } catch (error) {
                results.push({
                    success: false,
                    input: file.name,
                    error: error.message
                });
            }
        }
        
        return results;
    }

    /**
     * Get supported formats
     */
    getSupportedFormats() {
        return Array.from(this.supportedFormats).sort();
    }

    /**
     * Check if format is supported
     */
    isFormatSupported(format) {
        return this.supportedFormats.has(format.toLowerCase());
    }
}

// Create instance for export
const enhancedConversionService = new EnhancedConversionService();

// Export both individual functions (for backward compatibility) and the service
export default EnhancedConversionService;
export { enhancedConversionService };
export const convertSingle = enhancedConversionService.convertSingle.bind(enhancedConversionService);
export const convertFromUrl = enhancedConversionService.convertFromUrl.bind(enhancedConversionService);
export const batchConvert = enhancedConversionService.batchConvert.bind(enhancedConversionService);
