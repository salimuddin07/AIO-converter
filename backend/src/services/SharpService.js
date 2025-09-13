import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';

/**
 * SharpService - High-performance image processing using Sharp library
 * Handles: JPEG, PNG, WebP, AVIF, TIFF, SVG conversion and manipulation
 * Features: Fast, memory-efficient, supports streaming, progressive JPEG
 */
class SharpService {
    constructor() {
        this.supportedFormats = {
            input: ['jpeg', 'jpg', 'png', 'webp', 'avif', 'tiff', 'tif', 'svg', 'gif'],
            output: ['jpeg', 'jpg', 'png', 'webp', 'avif', 'tiff', 'tif']
        };
        this.defaultQuality = {
            jpeg: 85,
            webp: 80,
            avif: 70,
            png: 9, // compression level 0-9
            tiff: 80
        };
    }

    /**
     * Check if file format is supported
     */
    isSupported(filePath, type = 'input') {
        const ext = path.extname(filePath).toLowerCase().slice(1);
        return this.supportedFormats[type].includes(ext);
    }

    /**
     * Get image metadata and information
     */
    async getImageInfo(inputPath) {
        try {
            const metadata = await sharp(inputPath).metadata();
            const stats = await fs.stat(inputPath);
            
            return {
                format: metadata.format,
                width: metadata.width,
                height: metadata.height,
                channels: metadata.channels,
                density: metadata.density,
                hasAlpha: metadata.hasAlpha,
                orientation: metadata.orientation,
                size: stats.size,
                colorSpace: metadata.space,
                isAnimated: metadata.pages > 1
            };
        } catch (error) {
            throw new Error(`Failed to get image info: ${error.message}`);
        }
    }

    /**
     * Convert image format with high quality settings
     */
    async convertFormat(inputPath, outputPath, options = {}) {
        try {
            const outputFormat = path.extname(outputPath).toLowerCase().slice(1);
            const quality = options.quality || this.defaultQuality[outputFormat] || 85;
            
            let sharpInstance = sharp(inputPath);

            // Apply format-specific options
            switch (outputFormat) {
                case 'jpeg':
                case 'jpg':
                    sharpInstance = sharpInstance.jpeg({
                        quality: quality,
                        progressive: options.progressive !== false,
                        mozjpeg: options.mozjpeg || false,
                        chromaSubsampling: options.chromaSubsampling || '4:2:0'
                    });
                    break;

                case 'png':
                    sharpInstance = sharpInstance.png({
                        compressionLevel: options.compressionLevel || quality,
                        progressive: options.progressive || false,
                        palette: options.palette || false
                    });
                    break;

                case 'webp':
                    sharpInstance = sharpInstance.webp({
                        quality: quality,
                        lossless: options.lossless || false,
                        nearLossless: options.nearLossless || false,
                        effort: options.effort || 4
                    });
                    break;

                case 'avif':
                    sharpInstance = sharpInstance.avif({
                        quality: quality,
                        lossless: options.lossless || false,
                        effort: options.effort || 4,
                        chromaSubsampling: options.chromaSubsampling || '4:2:0'
                    });
                    break;

                case 'tiff':
                case 'tif':
                    sharpInstance = sharpInstance.tiff({
                        quality: quality,
                        compression: options.compression || 'jpeg',
                        predictor: options.predictor || 'horizontal'
                    });
                    break;
            }

            await sharpInstance.toFile(outputPath);
            
            return {
                inputPath,
                outputPath,
                format: outputFormat,
                quality: quality,
                size: await this.getFileSize(outputPath)
            };
        } catch (error) {
            throw new Error(`Sharp format conversion failed: ${error.message}`);
        }
    }

    /**
     * Resize image with various algorithms and options
     */
    async resizeImage(inputPath, outputPath, options = {}) {
        try {
            const { width, height, fit = 'cover', position = 'center' } = options;
            
            let sharpInstance = sharp(inputPath);

            if (width || height) {
                sharpInstance = sharpInstance.resize(width, height, {
                    fit: fit, // cover, contain, fill, inside, outside
                    position: position, // center, top, bottom, left, right, etc.
                    kernel: options.kernel || 'lanczos3', // nearest, cubic, mitchell, lanczos2, lanczos3
                    withoutEnlargement: options.withoutEnlargement || false,
                    withoutReduction: options.withoutReduction || false
                });
            }

            // Apply output format
            const outputFormat = path.extname(outputPath).toLowerCase().slice(1);
            const quality = options.quality || this.defaultQuality[outputFormat] || 85;
            sharpInstance = this.applyOutputFormat(sharpInstance, outputFormat, quality, options);

            await sharpInstance.toFile(outputPath);

            return {
                inputPath,
                outputPath,
                dimensions: { width, height },
                fit,
                size: await this.getFileSize(outputPath)
            };
        } catch (error) {
            throw new Error(`Sharp resize failed: ${error.message}`);
        }
    }

    /**
     * Crop image to specific dimensions and position
     */
    async cropImage(inputPath, outputPath, options = {}) {
        try {
            const { x = 0, y = 0, width, height } = options;
            
            let sharpInstance = sharp(inputPath);

            if (width && height) {
                sharpInstance = sharpInstance.extract({
                    left: x,
                    top: y,
                    width: width,
                    height: height
                });
            }

            // Apply output format
            const outputFormat = path.extname(outputPath).toLowerCase().slice(1);
            const quality = options.quality || this.defaultQuality[outputFormat] || 85;
            sharpInstance = this.applyOutputFormat(sharpInstance, outputFormat, quality, options);

            await sharpInstance.toFile(outputPath);

            return {
                inputPath,
                outputPath,
                cropArea: { x, y, width, height },
                size: await this.getFileSize(outputPath)
            };
        } catch (error) {
            throw new Error(`Sharp crop failed: ${error.message}`);
        }
    }

    /**
     * Apply image transformations (rotate, flip, etc.)
     */
    async transformImage(inputPath, outputPath, options = {}) {
        try {
            let sharpInstance = sharp(inputPath);

            // Rotation
            if (options.rotate) {
                sharpInstance = sharpInstance.rotate(options.rotate, {
                    background: options.backgroundColor || { r: 255, g: 255, b: 255, alpha: 0 }
                });
            }

            // Flip operations
            if (options.flipHorizontal) {
                sharpInstance = sharpInstance.flop();
            }
            if (options.flipVertical) {
                sharpInstance = sharpInstance.flip();
            }

            // Apply output format
            const outputFormat = path.extname(outputPath).toLowerCase().slice(1);
            const quality = options.quality || this.defaultQuality[outputFormat] || 85;
            sharpInstance = this.applyOutputFormat(sharpInstance, outputFormat, quality, options);

            await sharpInstance.toFile(outputPath);

            return {
                inputPath,
                outputPath,
                transformations: {
                    rotate: options.rotate,
                    flipHorizontal: options.flipHorizontal,
                    flipVertical: options.flipVertical
                },
                size: await this.getFileSize(outputPath)
            };
        } catch (error) {
            throw new Error(`Sharp transform failed: ${error.message}`);
        }
    }

    /**
     * Apply image effects and filters
     */
    async applyEffects(inputPath, outputPath, options = {}) {
        try {
            let sharpInstance = sharp(inputPath);

            // Blur effect
            if (options.blur && options.blur > 0) {
                sharpInstance = sharpInstance.blur(options.blur);
            }

            // Sharpen effect
            if (options.sharpen) {
                sharpInstance = sharpInstance.sharpen(
                    options.sharpen.sigma,
                    options.sharpen.flat,
                    options.sharpen.jagged
                );
            }

            // Grayscale
            if (options.grayscale) {
                sharpInstance = sharpInstance.grayscale();
            }

            // Normalize (enhance contrast)
            if (options.normalize) {
                sharpInstance = sharpInstance.normalize();
            }

            // Modulate (brightness, saturation, hue)
            if (options.modulate) {
                sharpInstance = sharpInstance.modulate(options.modulate);
            }

            // Gamma correction
            if (options.gamma) {
                sharpInstance = sharpInstance.gamma(options.gamma);
            }

            // Tint
            if (options.tint) {
                sharpInstance = sharpInstance.tint(options.tint);
            }

            // Apply output format
            const outputFormat = path.extname(outputPath).toLowerCase().slice(1);
            const quality = options.quality || this.defaultQuality[outputFormat] || 85;
            sharpInstance = this.applyOutputFormat(sharpInstance, outputFormat, quality, options);

            await sharpInstance.toFile(outputPath);

            return {
                inputPath,
                outputPath,
                effects: options,
                size: await this.getFileSize(outputPath)
            };
        } catch (error) {
            throw new Error(`Sharp effects failed: ${error.message}`);
        }
    }

    /**
     * Create thumbnails with Smart cropping
     */
    async createThumbnail(inputPath, outputPath, options = {}) {
        try {
            const { width = 150, height = 150, fit = 'cover' } = options;
            
            let sharpInstance = sharp(inputPath)
                .resize(width, height, {
                    fit: fit,
                    position: 'attention' // Smart cropping
                });

            // Apply output format
            const outputFormat = path.extname(outputPath).toLowerCase().slice(1);
            const quality = options.quality || this.defaultQuality[outputFormat] || 80;
            sharpInstance = this.applyOutputFormat(sharpInstance, outputFormat, quality, options);

            await sharpInstance.toFile(outputPath);

            return {
                inputPath,
                outputPath,
                thumbnailSize: { width, height },
                size: await this.getFileSize(outputPath)
            };
        } catch (error) {
            throw new Error(`Sharp thumbnail creation failed: ${error.message}`);
        }
    }

    /**
     * Progressive web-optimized images
     */
    async createWebOptimized(inputPath, outputDir, options = {}) {
        try {
            const inputName = path.parse(inputPath).name;
            const results = [];

            // Create multiple formats for web optimization
            const formats = [
                { ext: 'webp', quality: 80 },
                { ext: 'avif', quality: 70 },
                { ext: 'jpg', quality: 85 }
            ];

            // Create multiple sizes
            const sizes = options.sizes || [
                { suffix: '-sm', width: 480 },
                { suffix: '-md', width: 768 },
                { suffix: '-lg', width: 1200 },
                { suffix: '', width: null } // Original size
            ];

            for (const format of formats) {
                for (const size of sizes) {
                    const outputPath = path.join(outputDir, `${inputName}${size.suffix}.${format.ext}`);
                    
                    let sharpInstance = sharp(inputPath);
                    
                    if (size.width) {
                        sharpInstance = sharpInstance.resize(size.width, null, {
                            fit: 'inside',
                            withoutEnlargement: true
                        });
                    }

                    sharpInstance = this.applyOutputFormat(sharpInstance, format.ext, format.quality, options);
                    await sharpInstance.toFile(outputPath);

                    results.push({
                        format: format.ext,
                        size: size.suffix,
                        path: outputPath,
                        fileSize: await this.getFileSize(outputPath)
                    });
                }
            }

            return results;
        } catch (error) {
            throw new Error(`Web optimization failed: ${error.message}`);
        }
    }

    /**
     * Helper method to apply output format settings
     */
    applyOutputFormat(sharpInstance, format, quality, options = {}) {
        switch (format) {
            case 'jpeg':
            case 'jpg':
                return sharpInstance.jpeg({
                    quality: quality,
                    progressive: options.progressive !== false,
                    mozjpeg: options.mozjpeg || false
                });

            case 'png':
                return sharpInstance.png({
                    compressionLevel: options.compressionLevel || 6,
                    progressive: options.progressive || false
                });

            case 'webp':
                return sharpInstance.webp({
                    quality: quality,
                    lossless: options.lossless || false,
                    effort: options.effort || 4
                });

            case 'avif':
                return sharpInstance.avif({
                    quality: quality,
                    lossless: options.lossless || false,
                    effort: options.effort || 4
                });

            case 'tiff':
            case 'tif':
                return sharpInstance.tiff({
                    quality: quality,
                    compression: options.compression || 'jpeg'
                });

            default:
                return sharpInstance;
        }
    }

    /**
     * Get file size helper
     */
    async getFileSize(filePath) {
        try {
            const stats = await fs.stat(filePath);
            return stats.size;
        } catch (error) {
            return 0;
        }
    }

    /**
     * Batch process multiple images
     */
    async batchProcess(inputPaths, outputDir, operation, options = {}) {
        const results = [];
        
        for (const inputPath of inputPaths) {
            try {
                const inputName = path.parse(inputPath).name;
                const outputFormat = options.outputFormat || 'jpg';
                const outputPath = path.join(outputDir, `${inputName}.${outputFormat}`);

                let result;
                switch (operation) {
                    case 'convert':
                        result = await this.convertFormat(inputPath, outputPath, options);
                        break;
                    case 'resize':
                        result = await this.resizeImage(inputPath, outputPath, options);
                        break;
                    case 'crop':
                        result = await this.cropImage(inputPath, outputPath, options);
                        break;
                    case 'effects':
                        result = await this.applyEffects(inputPath, outputPath, options);
                        break;
                    case 'thumbnail':
                        result = await this.createThumbnail(inputPath, outputPath, options);
                        break;
                    default:
                        throw new Error(`Unknown operation: ${operation}`);
                }

                results.push({ success: true, ...result });
            } catch (error) {
                results.push({
                    success: false,
                    inputPath,
                    error: error.message
                });
            }
        }

        return results;
    }
}

export default SharpService;