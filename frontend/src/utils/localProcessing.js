/**
 * Local Processing Utilities - Client-side only
 * Handles all image/video processing without backend server
 */

// Image processing utilities
export class LocalImageProcessor {
  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
  }

  // Convert image to different format
  async convertImage(file, outputFormat, quality = 0.9) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      
      img.onload = () => {
        try {
          this.canvas.width = img.width;
          this.canvas.height = img.height;
          this.ctx.drawImage(img, 0, 0);
          
          // Convert to desired format
          const mimeType = this.getMimeType(outputFormat);
          this.canvas.toBlob((blob) => {
            if (blob) {
              const convertedFile = new File([blob], 
                `converted.${outputFormat.toLowerCase()}`, 
                { type: mimeType }
              );
              resolve(convertedFile);
            } else {
              reject(new Error('Failed to convert image'));
            }
            URL.revokeObjectURL(url);
          }, mimeType, quality);
        } catch (error) {
          URL.revokeObjectURL(url);
          reject(error);
        }
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image'));
      };
      
      img.src = url;
    });
  }

  // Resize image
  async resizeImage(file, width, height, maintainAspect = true) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      
      img.onload = () => {
        try {
          let newWidth = width;
          let newHeight = height;
          
          if (maintainAspect) {
            const aspectRatio = img.width / img.height;
            if (width / height > aspectRatio) {
              newWidth = height * aspectRatio;
            } else {
              newHeight = width / aspectRatio;
            }
          }
          
          this.canvas.width = newWidth;
          this.canvas.height = newHeight;
          this.ctx.drawImage(img, 0, 0, newWidth, newHeight);
          
          this.canvas.toBlob((blob) => {
            if (blob) {
              const resizedFile = new File([blob], 
                `resized_${file.name}`, 
                { type: file.type }
              );
              resolve(resizedFile);
            } else {
              reject(new Error('Failed to resize image'));
            }
            URL.revokeObjectURL(url);
          }, file.type, 0.9);
        } catch (error) {
          URL.revokeObjectURL(url);
          reject(error);
        }
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image'));
      };
      
      img.src = url;
    });
  }

  // Add text to image
  async addTextToImage(file, text, options = {}) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      
      img.onload = () => {
        try {
          this.canvas.width = img.width;
          this.canvas.height = img.height;
          this.ctx.drawImage(img, 0, 0);
          
          // Configure text
          const fontSize = options.fontSize || 30;
          const fontFamily = options.fontFamily || 'Arial';
          const color = options.color || '#ffffff';
          const x = options.x || img.width / 2;
          const y = options.y || img.height / 2;
          
          this.ctx.font = `${fontSize}px ${fontFamily}`;
          this.ctx.fillStyle = color;
          this.ctx.textAlign = options.align || 'center';
          this.ctx.textBaseline = options.baseline || 'middle';
          
          // Add text shadow for better visibility
          this.ctx.shadowColor = '#000000';
          this.ctx.shadowBlur = 2;
          this.ctx.shadowOffsetX = 1;
          this.ctx.shadowOffsetY = 1;
          
          this.ctx.fillText(text, x, y);
          
          this.canvas.toBlob((blob) => {
            if (blob) {
              const textFile = new File([blob], 
                `text_${file.name}`, 
                { type: file.type }
              );
              resolve(textFile);
            } else {
              reject(new Error('Failed to add text'));
            }
            URL.revokeObjectURL(url);
          }, file.type, 0.9);
        } catch (error) {
          URL.revokeObjectURL(url);
          reject(error);
        }
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image'));
      };
      
      img.src = url;
    });
  }

  // Rotate image
  async rotateImage(file, degrees) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      
      img.onload = () => {
        try {
          const radians = (degrees * Math.PI) / 180;
          const cos = Math.abs(Math.cos(radians));
          const sin = Math.abs(Math.sin(radians));
          
          const newWidth = img.width * cos + img.height * sin;
          const newHeight = img.width * sin + img.height * cos;
          
          this.canvas.width = newWidth;
          this.canvas.height = newHeight;
          
          this.ctx.translate(newWidth / 2, newHeight / 2);
          this.ctx.rotate(radians);
          this.ctx.drawImage(img, -img.width / 2, -img.height / 2);
          
          this.canvas.toBlob((blob) => {
            if (blob) {
              const rotatedFile = new File([blob], 
                `rotated_${file.name}`, 
                { type: file.type }
              );
              resolve(rotatedFile);
            } else {
              reject(new Error('Failed to rotate image'));
            }
            URL.revokeObjectURL(url);
          }, file.type, 0.9);
        } catch (error) {
          URL.revokeObjectURL(url);
          reject(error);
        }
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image'));
      };
      
      img.src = url;
    });
  }

  getMimeType(format) {
    const mimeTypes = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'webp': 'image/webp',
      'gif': 'image/gif',
      'bmp': 'image/bmp'
    };
    return mimeTypes[format.toLowerCase()] || 'image/png';
  }
}

// GIF processing utilities
export class LocalGifProcessor {
  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
  }

  // Create GIF from images (basic implementation)
  async createGifFromImages(imageFiles, options = {}) {
    // This is a simplified version - for full GIF creation, you'd need a library like gif.js
    console.log('Creating GIF from', imageFiles.length, 'images');
    console.log('Options:', options);
    
    // For now, return the first image as a placeholder
    if (imageFiles.length > 0) {
      return imageFiles[0];
    }
    
    throw new Error('No images provided for GIF creation');
  }

  // Split GIF into frames (requires additional library)
  async splitGif(gifFile) {
    console.log('Splitting GIF:', gifFile.name);
    
    // This would require a GIF parsing library
    // For now, return the original file as a placeholder
    return [gifFile];
  }
}

// Video processing utilities (limited in browser)
export class LocalVideoProcessor {
  constructor() {
    this.video = document.createElement('video');
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
  }

  // Extract frames from video
  async extractFrames(videoFile, frameCount = 10) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(videoFile);
      this.video.src = url;
      
      this.video.onloadedmetadata = async () => {
        try {
          const duration = this.video.duration;
          const interval = duration / frameCount;
          const frames = [];
          
          this.canvas.width = this.video.videoWidth;
          this.canvas.height = this.video.videoHeight;
          
          for (let i = 0; i < frameCount; i++) {
            const time = i * interval;
            await this.seekToTime(time);
            
            this.ctx.drawImage(this.video, 0, 0);
            
            const blob = await new Promise(resolve => {
              this.canvas.toBlob(resolve, 'image/png');
            });
            
            frames.push(new File([blob], `frame_${i}.png`, { type: 'image/png' }));
          }
          
          URL.revokeObjectURL(url);
          resolve(frames);
        } catch (error) {
          URL.revokeObjectURL(url);
          reject(error);
        }
      };
      
      this.video.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load video'));
      };
    });
  }

  seekToTime(time) {
    return new Promise((resolve) => {
      this.video.currentTime = time;
      this.video.onseeked = () => {
        resolve();
      };
    });
  }
}

// Export instances for use
export const imageProcessor = new LocalImageProcessor();
export const gifProcessor = new LocalGifProcessor();
export const videoProcessor = new LocalVideoProcessor();