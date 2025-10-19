/**
 * Canvas Module Wrapper
 * Safely imports canvas with fallback handling
 */

let canvas = null;
let canvasAvailable = false;

try {
  const canvasModule = await import('canvas');
  canvas = canvasModule;
  canvasAvailable = true;
  console.log('✅ Canvas module loaded successfully');
} catch (error) {
  console.warn('⚠️  Canvas module not available. Using Sharp for all image operations.');
  console.warn('   This is normal and does not affect core functionality.');
  canvasAvailable = false;
}

export const createCanvas = canvas?.createCanvas || function() {
  throw new Error('Canvas not available. Please use Sharp for image operations.');
};

export const loadImage = canvas?.loadImage || function() {
  throw new Error('Canvas not available. Please use Sharp for image operations.');
};

export const registerFont = canvas?.registerFont || function() {
  console.warn('registerFont called but Canvas is not available');
};

export const Image = canvas?.Image || class {
  constructor() {
    throw new Error('Canvas not available');
  }
};

export const isCanvasAvailable = () => canvasAvailable;

export default canvas;
