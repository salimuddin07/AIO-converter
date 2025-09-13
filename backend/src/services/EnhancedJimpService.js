import { Jimp } from 'jimp';
import path from 'path';
import { v4 as uuid } from 'uuid';
import { outputDir } from '../utils/filePaths.js';

/**
 * Enhanced Jimp Service - Pure JavaScript image manipulation
 * Specializes in: Cross-fade effects, text overlay, basic filters, canvas operations
 * Best for: Operations requiring no native dependencies, complex compositions
 */
class EnhancedJimpService {
  constructor() {
    this.defaultOptions = {
      quality: 85,
      format: 'png',
      background: '#ffffff'
    };
  }

  /**
   * Advanced image composition with multiple layers
   */
  async createComposition(layers, options = {}) {
    try {
      const { width = 800, height = 600, background = '#ffffff' } = options;
      
      // Create base canvas
      const canvas = new Jimp(width, height, background);
      
      for (const layer of layers) {
        const image = await Jimp.read(layer.path);
        
        // Apply layer-specific transformations
        if (layer.resize) {
          image.resize(layer.resize.width || Jimp.AUTO, layer.resize.height || Jimp.AUTO);
        }
        
        if (layer.rotate) {
          image.rotate(layer.rotate, false);
        }
        
        if (layer.opacity && layer.opacity < 1) {
          image.opacity(layer.opacity);
        }
        
        // Apply filters
        if (layer.filters) {
          this.applyFilters(image, layer.filters);
        }
        
        // Composite onto canvas
        const x = layer.x || 0;
        const y = layer.y || 0;
        canvas.composite(image, x, y, {
          mode: layer.blendMode || Jimp.BLEND_SOURCE_OVER,
          opacitySource: layer.opacity || 1.0,
          opacityDest: 1.0
        });
      }
      
      const outputName = `composition_${uuid()}.png`;
      const outputPath = path.join(outputDir, outputName);
      
      await canvas.writeAsync(outputPath);
      
      return {
        outName: outputName,
        path: outputPath,
        width: canvas.bitmap.width,
        height: canvas.bitmap.height,
        layers: layers.length
      };
    } catch (error) {
      console.error('Jimp composition failed:', error);
      throw new Error(`Composition failed: ${error.message}`);
    }
  }

  /**
   * Advanced text overlay with styling
   */
  async addAdvancedText(imagePath, textOptions, options = {}) {
    try {
      const image = await Jimp.read(imagePath);
      const {
        text = 'Sample Text',
        font = Jimp.FONT_SANS_32_BLACK,
        x = 10,
        y = 10,
        maxWidth = image.bitmap.width - 20,
        maxHeight = image.bitmap.height - 20,
        alignmentX = Jimp.HORIZONTAL_ALIGN_LEFT,
        alignmentY = Jimp.VERTICAL_ALIGN_TOP,
        background = null,
        padding = 10
      } = textOptions;

      // Load font (Jimp has built-in fonts)
      const loadedFont = await Jimp.loadFont(font);
      
      // Add background for text if specified
      if (background) {
        const textWidth = Jimp.measureText(loadedFont, text);
        const textHeight = Jimp.measureTextHeight(loadedFont, text, maxWidth);
        
        const bgColor = typeof background === 'string' ? background : '#000000';
        const bgImage = new Jimp(textWidth + padding * 2, textHeight + padding * 2, bgColor);
        bgImage.opacity(background.opacity || 0.7);
        
        image.composite(bgImage, x - padding, y - padding);
      }
      
      // Add text with alignment
      image.print(loadedFont, x, y, {
        text: text,
        alignmentX: alignmentX,
        alignmentY: alignmentY
      }, maxWidth, maxHeight);
      
      const outputName = `text_overlay_${uuid()}.${options.format || 'png'}`;
      const outputPath = path.join(outputDir, outputName);
      
      await image.writeAsync(outputPath);
      
      return {
        outName: outputName,
        path: outputPath,
        width: image.bitmap.width,
        height: image.bitmap.height
      };
    } catch (error) {
      console.error('Jimp text overlay failed:', error);
      throw new Error(`Text overlay failed: ${error.message}`);
    }
  }

  /**
   * Create crossfade transition between two images
   */
  async createCrossfade(imagePath1, imagePath2, steps = 10, options = {}) {
    try {
      const image1 = await Jimp.read(imagePath1);
      const image2 = await Jimp.read(imagePath2);
      
      // Ensure same dimensions
      const targetWidth = Math.max(image1.bitmap.width, image2.bitmap.width);
      const targetHeight = Math.max(image1.bitmap.height, image2.bitmap.height);
      
      image1.resize(targetWidth, targetHeight);
      image2.resize(targetWidth, targetHeight);
      
      const frames = [];
      
      for (let step = 0; step <= steps; step++) {
        const opacity = step / steps;
        const frame1 = image1.clone().opacity(1 - opacity);
        const frame2 = image2.clone().opacity(opacity);
        
        const result = frame1.composite(frame2, 0, 0, Jimp.BLEND_SOURCE_OVER);
        
        const frameName = `crossfade_${String(step).padStart(3, '0')}_${uuid()}.png`;
        const framePath = path.join(outputDir, frameName);
        
        await result.writeAsync(framePath);
        
        frames.push({
          name: frameName,
          path: framePath,
          step: step,
          opacity: opacity
        });
      }
      
      return {
        frames: frames,
        totalSteps: steps + 1,
        dimensions: { width: targetWidth, height: targetHeight }
      };
    } catch (error) {
      console.error('Jimp crossfade failed:', error);
      throw new Error(`Crossfade creation failed: ${error.message}`);
    }
  }

  /**
   * Apply advanced filters
   */
  applyFilters(image, filters) {
    if (filters.blur) image.blur(filters.blur);
    if (filters.brightness) image.brightness(filters.brightness);
    if (filters.contrast) image.contrast(filters.contrast);
    if (filters.posterize) image.posterize(filters.posterize);
    if (filters.sepia) image.sepia();
    if (filters.greyscale) image.greyscale();
    if (filters.invert) image.invert();
    if (filters.normalize) image.normalize();
    
    return image;
  }

  /**
   * Batch process images with consistent styling
   */
  async batchProcess(imagePaths, operation, options = {}) {
    const results = [];
    
    for (const imagePath of imagePaths) {
      try {
        let result;
        switch (operation) {
          case 'resize':
            result = await this.resizeImage(imagePath, options);
            break;
          case 'filter':
            result = await this.applyImageFilters(imagePath, options);
            break;
          case 'text':
            result = await this.addAdvancedText(imagePath, options.text, options);
            break;
          default:
            throw new Error(`Unknown operation: ${operation}`);
        }
        results.push({ success: true, ...result });
      } catch (error) {
        results.push({ 
          success: false, 
          error: error.message, 
          imagePath: imagePath 
        });
      }
    }
    
    return results;
  }

  async resizeImage(imagePath, options) {
    const image = await Jimp.read(imagePath);
    const { width, height, mode = Jimp.RESIZE_LANCZOS } = options;
    
    image.resize(width || Jimp.AUTO, height || Jimp.AUTO, mode);
    
    const outputName = `resized_${uuid()}.png`;
    const outputPath = path.join(outputDir, outputName);
    await image.writeAsync(outputPath);
    
    return { outName: outputName, path: outputPath };
  }

  async applyImageFilters(imagePath, options) {
    const image = await Jimp.read(imagePath);
    this.applyFilters(image, options.filters || {});
    
    const outputName = `filtered_${uuid()}.png`;
    const outputPath = path.join(outputDir, outputName);
    await image.writeAsync(outputPath);
    
    return { outName: outputName, path: outputPath };
  }
}

export default EnhancedJimpService;