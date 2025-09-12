const imagemagick = require("imagemagick");
const path = require("path");
const fs = require("fs").promises;
const { promisify } = require("util");

/**
 * ImageMagickService - Advanced image processing using ImageMagick
 * Handles: 200+ image formats, advanced effects, batch processing
 * Features: Command-line ImageMagick wrapper for Node.js
 */
class ImageMagickService {
  constructor() {
    this.supportedFormats = [
      // Common formats
      "jpg",
      "jpeg",
      "png",
      "gif",
      "bmp",
      "tiff",
      "tif",
      "webp",
      // Advanced formats
      "svg",
      "eps",
      "ps",
      "pdf",
      "psd",
      "xcf",
      // RAW formats
      "cr2",
      "nef",
      "arw",
      "dng",
      "raw",
      // Other formats
      "ico",
      "cur",
      "pbm",
      "pgm",
      "ppm",
      "xbm",
      "xpm",
      "heic",
      "avif",
      "jxl",
    ];

    // Promisify ImageMagick functions
    this.identify = promisify(imagemagick.identify);
    this.convert = promisify(imagemagick.convert);
    this.resize = promisify(imagemagick.resize);
    this.crop = promisify(imagemagick.crop);

    this.defaultQuality = 85;
  }

  /**
   * Check if file format is supported
   */
  isSupported(filePath) {
    const ext = path.extname(filePath).toLowerCase().slice(1);
    return this.supportedFormats.includes(ext);
  }

  /**
   * Get detailed image information using ImageMagick identify
   */
  async getImageInfo(inputPath) {
    try {
      const info = await this.identify(inputPath);

      return {
        path: inputPath,
        format: info.format,
        width: info.width,
        height: info.height,
        depth: info.depth,
        colorspace: info.colorspace,
        class: info.class,
        filesize: info.filesize,
        compression: info.compression,
        quality: info.quality,
        orientation: info.orientation,
        properties: info.properties || {},
        profiles: info.profiles || {},
      };
    } catch (error) {
      throw new Error(`Failed to get image info: ${error.message}`);
    }
  }

  /**
   * Convert image format with extensive options
   */
  async convertFormat(inputPath, outputPath, options = {}) {
    try {
      const convertOptions = [inputPath];

      // Quality settings
      if (options.quality) {
        convertOptions.push("-quality", options.quality.toString());
      }

      // Compression settings
      if (options.compress) {
        convertOptions.push("-compress", options.compress);
      }

      // Color depth
      if (options.depth) {
        convertOptions.push("-depth", options.depth.toString());
      }

      // Colorspace conversion
      if (options.colorspace) {
        convertOptions.push("-colorspace", options.colorspace);
      }

      // Interlacing
      if (options.interlace) {
        convertOptions.push("-interlace", options.interlace);
      }

      // Strip metadata
      if (options.strip) {
        convertOptions.push("-strip");
      }

      convertOptions.push(outputPath);

      await this.convert(convertOptions);

      return {
        inputPath,
        outputPath,
        format: path.extname(outputPath).slice(1),
        size: await this.getFileSize(outputPath),
        options,
      };
    } catch (error) {
      throw new Error(`ImageMagick conversion failed: ${error.message}`);
    }
  }

  /**
   * Resize image with advanced options
   */
  async resizeImage(inputPath, outputPath, options = {}) {
    try {
      const resizeOptions = {
        srcPath: inputPath,
        dstPath: outputPath,
        quality: options.quality || this.defaultQuality,
      };

      // Dimension options
      if (options.width && options.height) {
        if (options.ignoreAspectRatio) {
          resizeOptions.width = options.width;
          resizeOptions.height = options.height + "!";
        } else if (options.onlyGrowIfLarger) {
          resizeOptions.width = options.width + ">";
          resizeOptions.height = options.height + ">";
        } else if (options.onlyShrinkIfLarger) {
          resizeOptions.width = options.width + "<";
          resizeOptions.height = options.height + "<";
        } else {
          resizeOptions.width = options.width;
          resizeOptions.height = options.height;
        }
      } else if (options.width) {
        resizeOptions.width = options.width;
      } else if (options.height) {
        resizeOptions.height = options.height;
      }

      // Filter/resampling algorithm
      if (options.filter) {
        resizeOptions.filter = options.filter; // Lanczos, Mitchell, Cubic, etc.
      }

      // Sharpening
      if (options.sharpen) {
        resizeOptions.sharpen = options.sharpen;
      }

      await this.resize(resizeOptions);

      return {
        inputPath,
        outputPath,
        dimensions: {
          width: options.width,
          height: options.height,
        },
        size: await this.getFileSize(outputPath),
        options,
      };
    } catch (error) {
      throw new Error(`ImageMagick resize failed: ${error.message}`);
    }
  }

  /**
   * Crop image with advanced options
   */
  async cropImage(inputPath, outputPath, options = {}) {
    try {
      const cropOptions = {
        srcPath: inputPath,
        dstPath: outputPath,
        width: options.width,
        height: options.height,
        x: options.x || 0,
        y: options.y || 0,
        quality: options.quality || this.defaultQuality,
      };

      await this.crop(cropOptions);

      return {
        inputPath,
        outputPath,
        cropArea: {
          x: options.x || 0,
          y: options.y || 0,
          width: options.width,
          height: options.height,
        },
        size: await this.getFileSize(outputPath),
      };
    } catch (error) {
      throw new Error(`ImageMagick crop failed: ${error.message}`);
    }
  }

  /**
   * Apply advanced effects and transformations
   */
  async applyEffects(inputPath, outputPath, effects = {}) {
    try {
      const convertOptions = [inputPath];

      // Rotation
      if (effects.rotate) {
        convertOptions.push("-rotate", effects.rotate.toString());
      }

      // Flip and flop
      if (effects.flipVertical) {
        convertOptions.push("-flip");
      }
      if (effects.flipHorizontal) {
        convertOptions.push("-flop");
      }

      // Color adjustments
      if (effects.brightness) {
        convertOptions.push("-modulate", `${100 + effects.brightness},100,100`);
      }
      if (effects.contrast) {
        convertOptions.push("-contrast-stretch", `${effects.contrast}%`);
      }
      if (effects.saturation) {
        convertOptions.push("-modulate", `100,${100 + effects.saturation},100`);
      }
      if (effects.hue) {
        convertOptions.push("-modulate", `100,100,${100 + effects.hue}`);
      }

      // Gamma correction
      if (effects.gamma) {
        convertOptions.push("-gamma", effects.gamma.toString());
      }

      // Blur effects
      if (effects.blur) {
        convertOptions.push(
          "-blur",
          `${effects.blur.radius || 1}x${effects.blur.sigma || 1}`
        );
      }
      if (effects.gaussianBlur) {
        convertOptions.push(
          "-gaussian-blur",
          `${effects.gaussianBlur.radius || 1}x${
            effects.gaussianBlur.sigma || 1
          }`
        );
      }

      // Sharpening
      if (effects.sharpen) {
        convertOptions.push(
          "-sharpen",
          `${effects.sharpen.radius || 1}x${effects.sharpen.sigma || 1}`
        );
      }
      if (effects.unsharpMask) {
        const {
          radius = 1,
          sigma = 1,
          amount = 1,
          threshold = 0,
        } = effects.unsharpMask;
        convertOptions.push(
          "-unsharp",
          `${radius}x${sigma}+${amount}+${threshold}`
        );
      }

      // Noise effects
      if (effects.addNoise) {
        convertOptions.push("-noise", effects.addNoise);
      }
      if (effects.reduceNoise) {
        convertOptions.push("-noise", "-" + effects.reduceNoise);
      }

      // Edge detection
      if (effects.edge) {
        convertOptions.push("-edge", effects.edge.toString());
      }

      // Emboss
      if (effects.emboss) {
        convertOptions.push("-emboss", effects.emboss.toString());
      }

      // Solarize
      if (effects.solarize) {
        convertOptions.push("-solarize", `${effects.solarize}%`);
      }

      // Sepia tone
      if (effects.sepia) {
        convertOptions.push("-sepia-tone", `${effects.sepia}%`);
      }

      // Color effects
      if (effects.grayscale) {
        convertOptions.push("-type", "Grayscale");
      }
      if (effects.negate) {
        convertOptions.push("-negate");
      }
      if (effects.normalize) {
        convertOptions.push("-normalize");
      }
      if (effects.equalize) {
        convertOptions.push("-equalize");
      }

      // Color tinting
      if (effects.tint) {
        convertOptions.push(
          "-fill",
          effects.tint.color,
          "-tint",
          `${effects.tint.percent}%`
        );
      }

      // Posterize
      if (effects.posterize) {
        convertOptions.push("-posterize", effects.posterize.toString());
      }

      // Quality setting
      if (effects.quality) {
        convertOptions.push("-quality", effects.quality.toString());
      }

      convertOptions.push(outputPath);

      await this.convert(convertOptions);

      return {
        inputPath,
        outputPath,
        effects,
        size: await this.getFileSize(outputPath),
      };
    } catch (error) {
      throw new Error(`ImageMagick effects failed: ${error.message}`);
    }
  }

  /**
   * Add text overlay with advanced typography
   */
  async addTextOverlay(inputPath, outputPath, textOptions = {}) {
    try {
      const {
        text,
        x = 10,
        y = 30,
        font = "Arial",
        fontSize = 16,
        fontColor = "white",
        backgroundColor,
        strokeColor,
        strokeWidth,
        gravity = "NorthWest",
        angle = 0,
      } = textOptions;

      const convertOptions = [inputPath];

      // Font settings
      convertOptions.push("-font", font);
      convertOptions.push("-pointsize", fontSize.toString());
      convertOptions.push("-fill", fontColor);

      // Stroke settings
      if (strokeColor && strokeWidth) {
        convertOptions.push("-stroke", strokeColor);
        convertOptions.push("-strokewidth", strokeWidth.toString());
      }

      // Background color
      if (backgroundColor) {
        convertOptions.push("-undercolor", backgroundColor);
      }

      // Text rotation
      if (angle !== 0) {
        convertOptions.push("-rotate", angle.toString());
      }

      // Gravity and position
      convertOptions.push("-gravity", gravity);
      convertOptions.push("-annotate", `+${x}+${y}`, text);

      convertOptions.push(outputPath);

      await this.convert(convertOptions);

      return {
        inputPath,
        outputPath,
        textOverlay: textOptions,
        size: await this.getFileSize(outputPath),
      };
    } catch (error) {
      throw new Error(`ImageMagick text overlay failed: ${error.message}`);
    }
  }

  /**
   * Create composite images (layer multiple images)
   */
  async createComposite(
    baseImagePath,
    overlayImagePath,
    outputPath,
    options = {}
  ) {
    try {
      const {
        x = 0,
        y = 0,
        compose = "over", // over, multiply, screen, overlay, etc.
        dissolve,
        gravity = "NorthWest",
      } = options;

      const convertOptions = [baseImagePath];

      // Composition settings
      convertOptions.push("-compose", compose);

      if (dissolve) {
        convertOptions.push("-dissolve", `${dissolve}%`);
      }

      // Gravity setting
      convertOptions.push("-gravity", gravity);

      // Composite the overlay
      convertOptions.push("-geometry", `+${x}+${y}`);
      convertOptions.push(overlayImagePath);
      convertOptions.push("-composite");

      convertOptions.push(outputPath);

      await this.convert(convertOptions);

      return {
        baseImagePath,
        overlayImagePath,
        outputPath,
        composite: options,
        size: await this.getFileSize(outputPath),
      };
    } catch (error) {
      throw new Error(`ImageMagick composite failed: ${error.message}`);
    }
  }

  /**
   * Create thumbnails with smart cropping
   */
  async createThumbnail(inputPath, outputPath, options = {}) {
    try {
      const {
        width = 150,
        height = 150,
        crop = true,
        gravity = "Center",
        quality = 85,
      } = options;

      const convertOptions = [inputPath];

      if (crop) {
        // Smart thumbnail with cropping
        convertOptions.push("-thumbnail", `${width}x${height}^`);
        convertOptions.push("-gravity", gravity);
        convertOptions.push("-extent", `${width}x${height}`);
      } else {
        // Simple resize without cropping
        convertOptions.push("-thumbnail", `${width}x${height}`);
      }

      convertOptions.push("-quality", quality.toString());
      convertOptions.push(outputPath);

      await this.convert(convertOptions);

      return {
        inputPath,
        outputPath,
        thumbnailSize: { width, height },
        crop,
        size: await this.getFileSize(outputPath),
      };
    } catch (error) {
      throw new Error(
        `ImageMagick thumbnail creation failed: ${error.message}`
      );
    }
  }

  /**
   * Advanced color operations
   */
  async colorOperations(inputPath, outputPath, colorOptions = {}) {
    try {
      const convertOptions = [inputPath];

      // Color space conversions
      if (colorOptions.colorspace) {
        convertOptions.push("-colorspace", colorOptions.colorspace);
      }

      // Color quantization (reduce colors)
      if (colorOptions.colors) {
        convertOptions.push("-colors", colorOptions.colors.toString());
      }

      // Dithering
      if (colorOptions.dither !== undefined) {
        if (colorOptions.dither) {
          convertOptions.push("+dither");
        } else {
          convertOptions.push("-dither");
        }
      }

      // Color matrix transformations
      if (colorOptions.colorMatrix) {
        convertOptions.push("-color-matrix", colorOptions.colorMatrix);
      }

      // Auto level/contrast
      if (colorOptions.autoLevel) {
        convertOptions.push("-auto-level");
      }
      if (colorOptions.autoGamma) {
        convertOptions.push("-auto-gamma");
      }

      // Histogram equalization
      if (colorOptions.equalize) {
        convertOptions.push("-equalize");
      }

      convertOptions.push(outputPath);

      await this.convert(convertOptions);

      return {
        inputPath,
        outputPath,
        colorOperations: colorOptions,
        size: await this.getFileSize(outputPath),
      };
    } catch (error) {
      throw new Error(`ImageMagick color operations failed: ${error.message}`);
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
        const outputFormat =
          options.outputFormat || path.extname(inputPath).slice(1) || "jpg";
        const outputPath = path.join(outputDir, `${inputName}.${outputFormat}`);

        let result;
        switch (operation) {
          case "convert":
            result = await this.convertFormat(inputPath, outputPath, options);
            break;
          case "resize":
            result = await this.resizeImage(inputPath, outputPath, options);
            break;
          case "crop":
            result = await this.cropImage(inputPath, outputPath, options);
            break;
          case "effects":
            result = await this.applyEffects(inputPath, outputPath, options);
            break;
          case "thumbnail":
            result = await this.createThumbnail(inputPath, outputPath, options);
            break;
          case "text":
            result = await this.addTextOverlay(inputPath, outputPath, options);
            break;
          case "colors":
            result = await this.colorOperations(inputPath, outputPath, options);
            break;
          default:
            throw new Error(`Unknown operation: ${operation}`);
        }

        results.push({ success: true, ...result });
      } catch (error) {
        results.push({
          success: false,
          inputPath,
          error: error.message,
        });
      }
    }

    return results;
  }

  /**
   * Check ImageMagick availability
   */
  async checkAvailability() {
    try {
      await this.convert(["-version"]);
      return { available: true, version: "Available" };
    } catch (error) {
      return {
        available: false,
        error: "ImageMagick not installed or not in PATH",
        message:
          "Install ImageMagick from https://imagemagick.org/script/download.php",
      };
    }
  }
}

module.exports = ImageMagickService;
