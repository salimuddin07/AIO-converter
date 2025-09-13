import { createCanvas, loadImage, registerFont } from 'canvas';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuid } from 'uuid';
import { outputDir } from '../utils/FilePathUtils.js';

/**
 * Canvas Graphics Service using node-canvas
 * Specializes in: Complex graphics composition, text rendering, custom drawing operations
 * Best for: Creating overlays, watermarks, complex compositions, custom graphics generation
 */
class CanvasGraphicsService {
  constructor() {
    this.defaultCanvasOptions = {
      width: 800,
      height: 600,
      background: '#ffffff'
    };
    
    this.textDefaults = {
      font: '30px sans-serif',
      color: '#000000',
      align: 'left',
      baseline: 'top'
    };

    // Register custom fonts if available
    this.initializeFonts();
  }

  /**
   * Initialize custom fonts
   */
  async initializeFonts() {
    try {
      // You can register custom fonts here
      // registerFont('./fonts/CustomFont.ttf', { family: 'Custom Font' });
    } catch (error) {
      console.log('No custom fonts to register');
    }
  }

  /**
   * Create complex image composition with multiple layers
   */
  async createComplexComposition(layers, canvasOptions = {}) {
    try {
      const options = { ...this.defaultCanvasOptions, ...canvasOptions };
      const canvas = createCanvas(options.width, options.height);
      const ctx = canvas.getContext('2d');

      // Set background
      if (options.background && options.background !== 'transparent') {
        ctx.fillStyle = options.background;
        ctx.fillRect(0, 0, options.width, options.height);
      }

      // Process each layer
      for (const layer of layers) {
        await this.processLayer(ctx, layer, options);
      }

      // Save to file
      const outputName = `composition_${uuid()}.png`;
      const outputPath = path.join(outputDir, outputName);
      
      const buffer = canvas.toBuffer('image/png');
      await fs.writeFile(outputPath, buffer);

      return {
        outName: outputName,
        path: outputPath,
        width: options.width,
        height: options.height,
        layers: layers.length,
        size: buffer.length
      };
    } catch (error) {
      console.error('Canvas composition failed:', error);
      throw new Error(`Canvas composition failed: ${error.message}`);
    }
  }

  /**
   * Process individual layer
   */
  async processLayer(ctx, layer, canvasOptions) {
    const { type, ...layerOptions } = layer;

    // Save context state
    ctx.save();

    // Apply common transformations
    if (layerOptions.opacity !== undefined) {
      ctx.globalAlpha = layerOptions.opacity;
    }

    if (layerOptions.blendMode) {
      ctx.globalCompositeOperation = layerOptions.blendMode;
    }

    if (layerOptions.transform) {
      this.applyTransform(ctx, layerOptions.transform);
    }

    try {
      switch (type) {
        case 'image':
          await this.drawImage(ctx, layerOptions);
          break;
        case 'text':
          await this.drawText(ctx, layerOptions);
          break;
        case 'shape':
          await this.drawShape(ctx, layerOptions);
          break;
        case 'gradient':
          await this.drawGradient(ctx, layerOptions, canvasOptions);
          break;
        case 'pattern':
          await this.drawPattern(ctx, layerOptions);
          break;
        default:
          console.warn('Unknown layer type:', type);
      }
    } finally {
      // Restore context state
      ctx.restore();
    }
  }

  /**
   * Draw image layer
   */
  async drawImage(ctx, options) {
    const {
      src,
      x = 0,
      y = 0,
      width,
      height,
      sx = 0,
      sy = 0,
      sWidth,
      sHeight,
      filters = {}
    } = options;

    const image = await loadImage(src);

    // Apply filters before drawing
    this.applyImageFilters(ctx, filters);

    if (sWidth !== undefined && sHeight !== undefined) {
      // Draw with source clipping
      ctx.drawImage(
        image,
        sx, sy, sWidth, sHeight,
        x, y, width || sWidth, height || sHeight
      );
    } else if (width !== undefined || height !== undefined) {
      // Draw with scaling
      ctx.drawImage(
        image,
        x, y,
        width || image.width,
        height || image.height
      );
    } else {
      // Draw as-is
      ctx.drawImage(image, x, y);
    }
  }

  /**
   * Draw text layer
   */
  async drawText(ctx, options) {
    const textOptions = { ...this.textDefaults, ...options };
    const {
      text,
      x = 0,
      y = 0,
      font,
      color,
      align,
      baseline,
      maxWidth,
      strokeColor,
      strokeWidth = 0,
      shadow = {}
    } = textOptions;

    // Set text properties
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.textBaseline = baseline;

    // Apply shadow if specified
    if (shadow.color) {
      ctx.shadowColor = shadow.color;
      ctx.shadowBlur = shadow.blur || 0;
      ctx.shadowOffsetX = shadow.offsetX || 0;
      ctx.shadowOffsetY = shadow.offsetY || 0;
    }

    // Draw stroke if specified
    if (strokeColor && strokeWidth > 0) {
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = strokeWidth;
      if (maxWidth) {
        ctx.strokeText(text, x, y, maxWidth);
      } else {
        ctx.strokeText(text, x, y);
      }
    }

    // Draw fill text
    if (maxWidth) {
      ctx.fillText(text, x, y, maxWidth);
    } else {
      ctx.fillText(text, x, y);
    }
  }

  /**
   * Draw shape layer
   */
  async drawShape(ctx, options) {
    const {
      shape,
      x = 0,
      y = 0,
      width = 100,
      height = 100,
      fillColor,
      strokeColor,
      strokeWidth = 1,
      radius = 0
    } = options;

    ctx.beginPath();

    switch (shape) {
      case 'rectangle':
        if (radius > 0) {
          this.roundRect(ctx, x, y, width, height, radius);
        } else {
          ctx.rect(x, y, width, height);
        }
        break;
      
      case 'circle':
        ctx.arc(x + width/2, y + height/2, Math.min(width, height)/2, 0, 2 * Math.PI);
        break;
      
      case 'ellipse':
        ctx.ellipse(x + width/2, y + height/2, width/2, height/2, 0, 0, 2 * Math.PI);
        break;
      
      case 'triangle':
        ctx.moveTo(x + width/2, y);
        ctx.lineTo(x + width, y + height);
        ctx.lineTo(x, y + height);
        ctx.closePath();
        break;
    }

    // Fill shape
    if (fillColor) {
      ctx.fillStyle = fillColor;
      ctx.fill();
    }

    // Stroke shape
    if (strokeColor && strokeWidth > 0) {
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = strokeWidth;
      ctx.stroke();
    }
  }

  /**
   * Draw gradient layer
   */
  async drawGradient(ctx, options, canvasOptions) {
    const {
      type = 'linear',
      colors = ['#000000', '#ffffff'],
      stops = [0, 1],
      x1 = 0,
      y1 = 0,
      x2 = canvasOptions.width,
      y2 = canvasOptions.height,
      r1 = 0,
      r2 = Math.min(canvasOptions.width, canvasOptions.height) / 2
    } = options;

    let gradient;

    if (type === 'linear') {
      gradient = ctx.createLinearGradient(x1, y1, x2, y2);
    } else if (type === 'radial') {
      gradient = ctx.createRadialGradient(x1, y1, r1, x2, y2, r2);
    }

    // Add color stops
    colors.forEach((color, index) => {
      const stop = stops[index] !== undefined ? stops[index] : index / (colors.length - 1);
      gradient.addColorStop(stop, color);
    });

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvasOptions.width, canvasOptions.height);
  }

  /**
   * Draw pattern layer
   */
  async drawPattern(ctx, options) {
    const { src, repeat = 'repeat', x = 0, y = 0, width, height } = options;
    
    const image = await loadImage(src);
    const pattern = ctx.createPattern(image, repeat);
    
    ctx.fillStyle = pattern;
    ctx.fillRect(
      x, y,
      width || ctx.canvas.width,
      height || ctx.canvas.height
    );
  }

  /**
   * Apply transform to context
   */
  applyTransform(ctx, transform) {
    if (transform.translate) {
      ctx.translate(transform.translate.x || 0, transform.translate.y || 0);
    }
    
    if (transform.rotate) {
      ctx.rotate((transform.rotate * Math.PI) / 180);
    }
    
    if (transform.scale) {
      ctx.scale(transform.scale.x || 1, transform.scale.y || 1);
    }
    
    if (transform.skew) {
      ctx.transform(1, transform.skew.y || 0, transform.skew.x || 0, 1, 0, 0);
    }
  }

  /**
   * Apply image filters
   */
  applyImageFilters(ctx, filters) {
    const filterString = [];
    
    if (filters.blur) filterString.push(`blur(${filters.blur}px)`);
    if (filters.brightness) filterString.push(`brightness(${filters.brightness})`);
    if (filters.contrast) filterString.push(`contrast(${filters.contrast})`);
    if (filters.grayscale) filterString.push(`grayscale(${filters.grayscale})`);
    if (filters.sepia) filterString.push(`sepia(${filters.sepia})`);
    if (filters.saturate) filterString.push(`saturate(${filters.saturate})`);
    if (filters.hueRotate) filterString.push(`hue-rotate(${filters.hueRotate}deg)`);
    if (filters.invert) filterString.push(`invert(${filters.invert})`);
    
    if (filterString.length > 0) {
      ctx.filter = filterString.join(' ');
    }
  }

  /**
   * Create rounded rectangle path
   */
  roundRect(ctx, x, y, width, height, radius) {
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
  }

  /**
   * Create watermark
   */
  async createWatermark(imagePath, watermarkOptions = {}) {
    try {
      const image = await loadImage(imagePath);
      const canvas = createCanvas(image.width, image.height);
      const ctx = canvas.getContext('2d');

      // Draw original image
      ctx.drawImage(image, 0, 0);

      const {
        text = 'WATERMARK',
        position = 'bottom-right',
        opacity = 0.5,
        font = '20px Arial',
        color = '#ffffff',
        margin = 20
      } = watermarkOptions;

      // Calculate position
      ctx.font = font;
      const textWidth = ctx.measureText(text).width;
      const textHeight = 20; // Approximate height
      
      let x, y;
      switch (position) {
        case 'top-left':
          x = margin;
          y = margin + textHeight;
          break;
        case 'top-right':
          x = image.width - textWidth - margin;
          y = margin + textHeight;
          break;
        case 'bottom-left':
          x = margin;
          y = image.height - margin;
          break;
        case 'bottom-right':
        default:
          x = image.width - textWidth - margin;
          y = image.height - margin;
          break;
        case 'center':
          x = (image.width - textWidth) / 2;
          y = (image.height + textHeight) / 2;
          break;
      }

      // Apply watermark
      ctx.globalAlpha = opacity;
      ctx.fillStyle = color;
      ctx.fillText(text, x, y);

      // Save result
      const outputName = `watermarked_${uuid()}.png`;
      const outputPath = path.join(outputDir, outputName);
      
      const buffer = canvas.toBuffer('image/png');
      await fs.writeFile(outputPath, buffer);

      return {
        outName: outputName,
        path: outputPath,
        width: image.width,
        height: image.height,
        watermark: {
          text: text,
          position: position,
          opacity: opacity
        }
      };
    } catch (error) {
      console.error('Watermark creation failed:', error);
      throw new Error(`Watermark creation failed: ${error.message}`);
    }
  }

  /**
   * Generate thumbnail with custom styling
   */
  async generateStyledThumbnail(imagePath, options = {}) {
    try {
      const {
        width = 200,
        height = 200,
        style = 'crop', // crop, fit, stretch
        border = null,
        shadow = null,
        background = '#ffffff'
      } = options;

      const image = await loadImage(imagePath);
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext('2d');

      // Set background
      if (background !== 'transparent') {
        ctx.fillStyle = background;
        ctx.fillRect(0, 0, width, height);
      }

      // Apply shadow if specified
      if (shadow) {
        ctx.shadowColor = shadow.color || '#000000';
        ctx.shadowBlur = shadow.blur || 5;
        ctx.shadowOffsetX = shadow.offsetX || 0;
        ctx.shadowOffsetY = shadow.offsetY || 0;
      }

      // Calculate dimensions based on style
      let drawWidth, drawHeight, drawX, drawY;
      
      switch (style) {
        case 'crop':
          const scale = Math.max(width / image.width, height / image.height);
          drawWidth = image.width * scale;
          drawHeight = image.height * scale;
          drawX = (width - drawWidth) / 2;
          drawY = (height - drawHeight) / 2;
          break;
        
        case 'fit':
          const fitScale = Math.min(width / image.width, height / image.height);
          drawWidth = image.width * fitScale;
          drawHeight = image.height * fitScale;
          drawX = (width - drawWidth) / 2;
          drawY = (height - drawHeight) / 2;
          break;
        
        case 'stretch':
        default:
          drawWidth = width;
          drawHeight = height;
          drawX = 0;
          drawY = 0;
          break;
      }

      // Draw image
      ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);

      // Add border if specified
      if (border) {
        ctx.strokeStyle = border.color || '#000000';
        ctx.lineWidth = border.width || 1;
        ctx.strokeRect(0, 0, width, height);
      }

      // Save result
      const outputName = `thumbnail_${uuid()}.png`;
      const outputPath = path.join(outputDir, outputName);
      
      const buffer = canvas.toBuffer('image/png');
      await fs.writeFile(outputPath, buffer);

      return {
        outName: outputName,
        path: outputPath,
        width: width,
        height: height,
        style: style
      };
    } catch (error) {
      console.error('Thumbnail generation failed:', error);
      throw new Error(`Thumbnail generation failed: ${error.message}`);
    }
  }
}

export default CanvasGraphicsService;
