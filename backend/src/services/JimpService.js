const Jimp = require('jimp');
const path = require('path');
const fs = require('fs').promises;

/**
 * JimpService - Pure JavaScript image processing using Jimp library
 * Handles: JPEG, PNG, BMP, TIFF, GIF reading and processing
 * Features: No native dependencies, cross-platform, built-in fonts and effects
 */
class JimpService {
    constructor() {
        this.supportedFormats = {
            input: ['jpeg', 'jpg', 'png', 'bmp', 'tiff', 'tif', 'gif'],
            output: ['jpeg', 'jpg', 'png', 'bmp', 'tiff', 'tif']
        };
        this.defaultQuality = 85;
        
        // Jimp built-in fonts
        this.fonts = {
            FONT_SANS_8_BLACK: Jimp.FONT_SANS_8_BLACK,
            FONT_SANS_8_WHITE: Jimp.FONT_SANS_8_WHITE,
            FONT_SANS_10_BLACK: Jimp.FONT_SANS_10_BLACK,
            FONT_SANS_10_WHITE: Jimp.FONT_SANS_10_WHITE,
            FONT_SANS_12_BLACK: Jimp.FONT_SANS_12_BLACK,
            FONT_SANS_12_WHITE: Jimp.FONT_SANS_12_WHITE,
            FONT_SANS_14_BLACK: Jimp.FONT_SANS_14_BLACK,
            FONT_SANS_14_WHITE: Jimp.FONT_SANS_14_WHITE,
            FONT_SANS_16_BLACK: Jimp.FONT_SANS_16_BLACK,
            FONT_SANS_16_WHITE: Jimp.FONT_SANS_16_WHITE,
            FONT_SANS_32_BLACK: Jimp.FONT_SANS_32_BLACK,
            FONT_SANS_32_WHITE: Jimp.FONT_SANS_32_WHITE,
            FONT_SANS_64_BLACK: Jimp.FONT_SANS_64_BLACK,
            FONT_SANS_64_WHITE: Jimp.FONT_SANS_64_WHITE,
            FONT_SANS_128_BLACK: Jimp.FONT_SANS_128_BLACK,
            FONT_SANS_128_WHITE: Jimp.FONT_SANS_128_WHITE
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
            const image = await Jimp.read(inputPath);
            const stats = await fs.stat(inputPath);
            
            return {
                width: image.getWidth(),
                height: image.getHeight(),
                channels: image.hasAlpha() ? 4 : 3,
                hasAlpha: image.hasAlpha(),
                size: stats.size,
                mimeType: image.getMIME()
            };
        } catch (error) {
            throw new Error(`Failed to get image info: ${error.message}`);
        }
    }

    /**
     * Convert image format
     */
    async convertFormat(inputPath, outputPath, options = {}) {
        try {
            const image = await Jimp.read(inputPath);
            const quality = options.quality || this.defaultQuality;
            
            // Set quality for JPEG
            if (path.extname(outputPath).toLowerCase().match(/\.(jpg|jpeg)$/)) {
                image.quality(quality);
            }

            await image.writeAsync(outputPath);
            
            return {
                inputPath,
                outputPath,
                quality: quality,
                size: await this.getFileSize(outputPath)
            };
        } catch (error) {
            throw new Error(`Jimp format conversion failed: ${error.message}`);
        }
    }

    /**
     * Resize image with various algorithms
     */
    async resizeImage(inputPath, outputPath, options = {}) {
        try {
            const image = await Jimp.read(inputPath);
            const { width, height, mode = 'bilinear' } = options;
            
            // Resize modes: Jimp.RESIZE_NEAREST_NEIGHBOR, Jimp.RESIZE_BILINEAR, Jimp.RESIZE_BICUBIC, Jimp.RESIZE_HERMITE, Jimp.RESIZE_BEZIER
            let resizeMode = Jimp.RESIZE_BILINEAR;
            switch (mode) {
                case 'nearest': resizeMode = Jimp.RESIZE_NEAREST_NEIGHBOR; break;
                case 'bilinear': resizeMode = Jimp.RESIZE_BILINEAR; break;
                case 'bicubic': resizeMode = Jimp.RESIZE_BICUBIC; break;
                case 'hermite': resizeMode = Jimp.RESIZE_HERMITE; break;
                case 'bezier': resizeMode = Jimp.RESIZE_BEZIER; break;
            }

            if (width && height) {
                image.resize(width, height, resizeMode);
            } else if (width) {
                image.resize(width, Jimp.AUTO, resizeMode);
            } else if (height) {
                image.resize(Jimp.AUTO, height, resizeMode);
            }

            // Apply quality for JPEG
            const quality = options.quality || this.defaultQuality;
            if (path.extname(outputPath).toLowerCase().match(/\.(jpg|jpeg)$/)) {
                image.quality(quality);
            }

            await image.writeAsync(outputPath);

            return {
                inputPath,
                outputPath,
                dimensions: { width, height },
                mode,
                size: await this.getFileSize(outputPath)
            };
        } catch (error) {
            throw new Error(`Jimp resize failed: ${error.message}`);
        }
    }

    /**
     * Crop image to specific dimensions
     */
    async cropImage(inputPath, outputPath, options = {}) {
        try {
            const image = await Jimp.read(inputPath);
            const { x = 0, y = 0, width, height } = options;
            
            if (width && height) {
                image.crop(x, y, width, height);
            }

            // Apply quality for JPEG
            const quality = options.quality || this.defaultQuality;
            if (path.extname(outputPath).toLowerCase().match(/\.(jpg|jpeg)$/)) {
                image.quality(quality);
            }

            await image.writeAsync(outputPath);

            return {
                inputPath,
                outputPath,
                cropArea: { x, y, width, height },
                size: await this.getFileSize(outputPath)
            };
        } catch (error) {
            throw new Error(`Jimp crop failed: ${error.message}`);
        }
    }

    /**
     * Apply image transformations
     */
    async transformImage(inputPath, outputPath, options = {}) {
        try {
            const image = await Jimp.read(inputPath);

            // Rotation
            if (options.rotate) {
                image.rotate(options.rotate, options.resize !== false);
            }

            // Flip operations
            if (options.flipHorizontal) {
                image.flip(true, false);
            }
            if (options.flipVertical) {
                image.flip(false, true);
            }

            // Scale
            if (options.scale && options.scale !== 1) {
                image.scale(options.scale);
            }

            // Apply quality for JPEG
            const quality = options.quality || this.defaultQuality;
            if (path.extname(outputPath).toLowerCase().match(/\.(jpg|jpeg)$/)) {
                image.quality(quality);
            }

            await image.writeAsync(outputPath);

            return {
                inputPath,
                outputPath,
                transformations: {
                    rotate: options.rotate,
                    flipHorizontal: options.flipHorizontal,
                    flipVertical: options.flipVertical,
                    scale: options.scale
                },
                size: await this.getFileSize(outputPath)
            };
        } catch (error) {
            throw new Error(`Jimp transform failed: ${error.message}`);
        }
    }

    /**
     * Apply image effects and filters
     */
    async applyEffects(inputPath, outputPath, options = {}) {
        try {
            const image = await Jimp.read(inputPath);

            // Blur effect
            if (options.blur && options.blur > 0) {
                image.blur(options.blur);
            }

            // Grayscale
            if (options.grayscale) {
                image.greyscale();
            }

            // Sepia
            if (options.sepia) {
                image.sepia();
            }

            // Invert colors
            if (options.invert) {
                image.invert();
            }

            // Brightness (-1 to +1)
            if (options.brightness !== undefined) {
                image.brightness(options.brightness);
            }

            // Contrast (-1 to +1)
            if (options.contrast !== undefined) {
                image.contrast(options.contrast);
            }

            // Fade (0 to 1)
            if (options.fade !== undefined) {
                image.fade(options.fade);
            }

            // Opacity (0 to 1)
            if (options.opacity !== undefined) {
                image.opacity(options.opacity);
            }

            // Posterize (2-255)
            if (options.posterize) {
                image.posterize(options.posterize);
            }

            // Normalize
            if (options.normalize) {
                image.normalize();
            }

            // Dither
            if (options.dither565) {
                image.dither565();
            }

            // Color adjustments
            if (options.color) {
                image.color(options.color);
            }

            // Apply quality for JPEG
            const quality = options.quality || this.defaultQuality;
            if (path.extname(outputPath).toLowerCase().match(/\.(jpg|jpeg)$/)) {
                image.quality(quality);
            }

            await image.writeAsync(outputPath);

            return {
                inputPath,
                outputPath,
                effects: options,
                size: await this.getFileSize(outputPath)
            };
        } catch (error) {
            throw new Error(`Jimp effects failed: ${error.message}`);
        }
    }

    /**
     * Add text overlay to image
     */
    async addTextOverlay(inputPath, outputPath, options = {}) {
        try {
            const image = await Jimp.read(inputPath);
            const {
                text,
                x = 0,
                y = 0,
                fontName = 'FONT_SANS_16_BLACK',
                alignmentX = Jimp.HORIZONTAL_ALIGN_LEFT,
                alignmentY = Jimp.VERTICAL_ALIGN_TOP,
                maxWidth,
                maxHeight
            } = options;

            const font = await Jimp.loadFont(this.fonts[fontName] || Jimp.FONT_SANS_16_BLACK);
            
            if (maxWidth && maxHeight) {
                image.print(font, x, y, {
                    text: text,
                    alignmentX: alignmentX,
                    alignmentY: alignmentY
                }, maxWidth, maxHeight);
            } else {
                image.print(font, x, y, text);
            }

            // Apply quality for JPEG
            const quality = options.quality || this.defaultQuality;
            if (path.extname(outputPath).toLowerCase().match(/\.(jpg|jpeg)$/)) {
                image.quality(quality);
            }

            await image.writeAsync(outputPath);

            return {
                inputPath,
                outputPath,
                textOverlay: {
                    text,
                    position: { x, y },
                    font: fontName
                },
                size: await this.getFileSize(outputPath)
            };
        } catch (error) {
            throw new Error(`Jimp text overlay failed: ${error.message}`);
        }
    }

    /**
     * Create a composite image (blend multiple images)
     */
    async createComposite(baseImagePath, overlayImagePath, outputPath, options = {}) {
        try {
            const baseImage = await Jimp.read(baseImagePath);
            const overlayImage = await Jimp.read(overlayImagePath);
            
            const {
                x = 0,
                y = 0,
                mode = Jimp.BLEND_SOURCE_OVER,
                opacity = 1.0
            } = options;

            if (opacity < 1.0) {
                overlayImage.opacity(opacity);
            }

            baseImage.composite(overlayImage, x, y, {
                mode: mode,
                opacitySource: options.opacitySource || 1.0,
                opacityDest: options.opacityDest || 1.0
            });

            // Apply quality for JPEG
            const quality = options.quality || this.defaultQuality;
            if (path.extname(outputPath).toLowerCase().match(/\.(jpg|jpeg)$/)) {
                baseImage.quality(quality);
            }

            await baseImage.writeAsync(outputPath);

            return {
                baseImagePath,
                overlayImagePath,
                outputPath,
                composite: {
                    position: { x, y },
                    mode,
                    opacity
                },
                size: await this.getFileSize(outputPath)
            };
        } catch (error) {
            throw new Error(`Jimp composite failed: ${error.message}`);
        }
    }

    /**
     * Create thumbnail with smart cropping
     */
    async createThumbnail(inputPath, outputPath, options = {}) {
        try {
            const image = await Jimp.read(inputPath);
            const { width = 150, height = 150, mode = 'cover' } = options;
            
            if (mode === 'cover') {
                // Smart cropping to cover the thumbnail dimensions
                image.cover(width, height);
            } else if (mode === 'contain') {
                // Fit image within dimensions
                image.contain(width, height);
            } else {
                // Simple resize
                image.resize(width, height);
            }

            // Apply quality for JPEG
            const quality = options.quality || this.defaultQuality;
            if (path.extname(outputPath).toLowerCase().match(/\.(jpg|jpeg)$/)) {
                image.quality(quality);
            }

            await image.writeAsync(outputPath);

            return {
                inputPath,
                outputPath,
                thumbnailSize: { width, height },
                mode,
                size: await this.getFileSize(outputPath)
            };
        } catch (error) {
            throw new Error(`Jimp thumbnail creation failed: ${error.message}`);
        }
    }

    /**
     * Extract colors from image
     */
    async extractColors(inputPath, options = {}) {
        try {
            const image = await Jimp.read(inputPath);
            const { sampleSize = 100 } = options;
            
            // Sample colors from image
            const colors = [];
            const width = image.getWidth();
            const height = image.getHeight();
            const step = Math.max(1, Math.floor(Math.min(width, height) / sampleSize));

            for (let x = 0; x < width; x += step) {
                for (let y = 0; y < height; y += step) {
                    const color = image.getPixelColor(x, y);
                    const rgba = Jimp.intToRGBA(color);
                    
                    if (rgba.a > 128) { // Skip transparent pixels
                        colors.push({
                            r: rgba.r,
                            g: rgba.g,
                            b: rgba.b,
                            a: rgba.a,
                            hex: `#${((rgba.r << 16) | (rgba.g << 8) | rgba.b).toString(16).padStart(6, '0')}`
                        });
                    }
                }
            }

            return {
                inputPath,
                colors: colors.slice(0, 100), // Limit to 100 colors
                totalSampled: colors.length
            };
        } catch (error) {
            throw new Error(`Jimp color extraction failed: ${error.message}`);
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
                    case 'text':
                        result = await this.addTextOverlay(inputPath, outputPath, options);
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

module.exports = JimpService;