import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class TextService {
    constructor() {
        this.tempDir = path.join(__dirname, '../temp');
        this.outputDir = path.join(__dirname, '../output');
        this.supportedFormats = ['gif', 'webp', 'apng', 'png', 'jpg', 'jpeg'];
        this.fonts = [
            'Arial', 'Helvetica', 'Times New Roman', 'Courier New', 'Verdana',
            'Georgia', 'Palatino', 'Garamond', 'Bookman', 'Comic Sans MS',
            'Trebuchet MS', 'Arial Black', 'Impact'
        ];
    }

    async getImageInfo(inputPath) {
        try {
            const inputBuffer = await fs.readFile(inputPath);
            const metadata = await sharp(inputBuffer).metadata();
            
            const stats = await fs.stat(inputPath);
            const sizeInGB = (stats.size / (1024 * 1024)).toFixed(2);

            return {
                width: metadata.width,
                height: metadata.height,
                format: metadata.format,
                size: `${sizeInGB} GB`,
                frames: metadata.pages || 1,
                hasAnimation: (metadata.pages || 1) > 1,
                density: metadata.density,
                channels: metadata.channels,
                hasAlpha: metadata.hasAlpha
            };
        } catch (error) {
            throw new Error(`Failed to analyze image: ${error.message}`);
        }
    }

    getSupportedFormats() {
        return this.supportedFormats;
    }

    getAvailableFonts() {
        return this.fonts;
    }

    async addTextToAnimatedImage(inputPath, options) {
        try {
            const {
                text,
                x = 10,
                y = 10,
                fontSize = 24,
                fontFamily = 'Arial',
                color = '#ffffff',
                backgroundColor = 'rgba(0,0,0,0.5)',
                strokeColor = '#000000',
                strokeWidth = 1,
                opacity = 1,
                rotation = 0,
                outline = true,
                shadow = false,
                shadowColor = '#000000',
                shadowOffsetX = 2,
                shadowOffsetY = 2,
                shadowBlur = 4,
                animationMode = 'all', // 'all', 'first', 'last', 'range'
                frameRange = { start: 0, end: -1 },
                alignment = 'left',
                wordWrap = false,
                maxWidth = 300
            } = options;

            const inputBuffer = await fs.readFile(inputPath);
            const metadata = await sharp(inputBuffer).metadata();
            
            if (metadata.pages && metadata.pages > 1) {
                // Handle animated images
                return await this.processAnimatedImage(inputBuffer, metadata, {
                    text, x, y, fontSize, fontFamily, color, backgroundColor,
                    strokeColor, strokeWidth, opacity, rotation, outline,
                    shadow, shadowColor, shadowOffsetX, shadowOffsetY, shadowBlur,
                    animationMode, frameRange, alignment, wordWrap, maxWidth
                });
            } else {
                // Handle static images
                return await this.processStaticImage(inputBuffer, {
                    text, x, y, fontSize, fontFamily, color, backgroundColor,
                    strokeColor, strokeWidth, opacity, rotation, outline,
                    shadow, shadowColor, shadowOffsetX, shadowOffsetY, shadowBlur,
                    alignment, wordWrap, maxWidth
                });
            }
        } catch (error) {
            console.error('Error adding text to image:', error);
            throw new Error(`Failed to add text: ${error.message}`);
        }
    }

    async processAnimatedImage(inputBuffer, metadata, options) {
        const frames = [];
        const totalFrames = metadata.pages || 1;
        const { animationMode, frameRange } = options;

        // Determine which frames to process
        const framesToProcess = this.getFramesToProcess(totalFrames, animationMode, frameRange);

        for (let i = 0; i < totalFrames; i++) {
            const frameBuffer = await sharp(inputBuffer, { page: i })
                .png()
                .toBuffer();

            let processedFrame;
            if (framesToProcess.includes(i)) {
                // Add text to this frame
                processedFrame = await this.addTextToFrame(frameBuffer, options);
            } else {
                // Keep original frame
                processedFrame = frameBuffer;
            }

            frames.push(processedFrame);
        }

        // Reconstruct animated image
        return await this.reconstructAnimation(frames, metadata);
    }

    async processStaticImage(inputBuffer, options) {
        return await this.addTextToFrame(inputBuffer, options);
    }

    async addTextToFrame(frameBuffer, options) {
        const {
            text, x, y, fontSize, fontFamily, color, backgroundColor,
            strokeColor, strokeWidth, opacity, rotation, outline,
            shadow, shadowColor, shadowOffsetX, shadowOffsetY, shadowBlur,
            alignment, wordWrap, maxWidth
        } = options;

        const image = sharp(frameBuffer);
        const { width, height } = await image.metadata();

        // Create text overlay using SVG
        const textSvg = this.createTextSvg({
            text, x, y, fontSize, fontFamily, color, backgroundColor,
            strokeColor, strokeWidth, opacity, rotation, outline,
            shadow, shadowColor, shadowOffsetX, shadowOffsetY, shadowBlur,
            alignment, wordWrap, maxWidth, canvasWidth: width, canvasHeight: height
        });

        // Composite text over image
        const result = await image
            .composite([{
                input: Buffer.from(textSvg),
                left: 0,
                top: 0
            }])
            .png()
            .toBuffer();

        return result;
    }

    createTextSvg(options) {
        const {
            text, x, y, fontSize, fontFamily, color, backgroundColor,
            strokeColor, strokeWidth, opacity, rotation, outline,
            shadow, shadowColor, shadowOffsetX, shadowOffsetY, shadowBlur,
            alignment, wordWrap, maxWidth, canvasWidth, canvasHeight
        } = options;

        const lines = wordWrap ? this.wrapText(text, maxWidth, fontSize) : [text];
        const lineHeight = fontSize * 1.2;
        const totalTextHeight = lines.length * lineHeight;

        let svgContent = `<svg width="${canvasWidth}" height="${canvasHeight}" xmlns="http://www.w3.org/2000/svg">`;
        
        // Add background if specified
        if (backgroundColor && backgroundColor !== 'transparent') {
            const bgOpacity = this.extractOpacity(backgroundColor);
            const bgColor = this.extractColor(backgroundColor);
            svgContent += `<rect x="${x - 5}" y="${y - fontSize}" width="${maxWidth || 200}" height="${totalTextHeight + 10}" fill="${bgColor}" fill-opacity="${bgOpacity}" rx="3"/>`;
        }

        lines.forEach((line, index) => {
            const lineY = y + (index * lineHeight);
            let textAnchor = 'start';
            let lineX = x;

            if (alignment === 'center') {
                textAnchor = 'middle';
                lineX = x + (maxWidth || 100) / 2;
            } else if (alignment === 'right') {
                textAnchor = 'end';
                lineX = x + (maxWidth || 100);
            }

            let textElement = `<text x="${lineX}" y="${lineY}" font-family="${fontFamily}" font-size="${fontSize}" text-anchor="${textAnchor}" opacity="${opacity}"`;
            
            if (rotation !== 0) {
                textElement += ` transform="rotate(${rotation} ${lineX} ${lineY})"`;
            }

            // Add shadow if enabled
            if (shadow) {
                svgContent += `<text x="${lineX + shadowOffsetX}" y="${lineY + shadowOffsetY}" font-family="${fontFamily}" font-size="${fontSize}" text-anchor="${textAnchor}" fill="${shadowColor}" opacity="${opacity * 0.5}" filter="blur(${shadowBlur}px)">${this.escapeXml(line)}</text>`;
            }

            // Add stroke if outline is enabled
            if (outline && strokeWidth > 0) {
                textElement += ` fill="${color}" stroke="${strokeColor}" stroke-width="${strokeWidth}"`;
            } else {
                textElement += ` fill="${color}"`;
            }

            textElement += `>${this.escapeXml(line)}</text>`;
            svgContent += textElement;
        });

        svgContent += '</svg>';
        return svgContent;
    }

    wrapText(text, maxWidth, fontSize) {
        // Simple text wrapping based on character count
        const maxChars = Math.floor(maxWidth / (fontSize * 0.6));
        const words = text.split(' ');
        const lines = [];
        let currentLine = '';

        words.forEach(word => {
            if ((currentLine + word).length <= maxChars) {
                currentLine += (currentLine ? ' ' : '') + word;
            } else {
                if (currentLine) lines.push(currentLine);
                currentLine = word;
            }
        });

        if (currentLine) lines.push(currentLine);
        return lines;
    }

    getFramesToProcess(totalFrames, animationMode, frameRange) {
        switch (animationMode) {
            case 'first':
                return [0];
            case 'last':
                return [totalFrames - 1];
            case 'range':
                const start = Math.max(0, frameRange.start);
                const end = frameRange.end === -1 ? totalFrames - 1 : Math.min(totalFrames - 1, frameRange.end);
                return Array.from({ length: end - start + 1 }, (_, i) => start + i);
            case 'all':
            default:
                return Array.from({ length: totalFrames }, (_, i) => i);
        }
    }

    async reconstructAnimation(frames, originalMetadata) {
        // For now, return the first frame. In a full implementation,
        // you would use a library like gif-encoder-2 or similar to reconstruct the animation
        return frames[0];
    }

    extractOpacity(color) {
        const rgba = color.match(/rgba?\(([^)]+)\)/);
        if (rgba) {
            const values = rgba[1].split(',').map(v => v.trim());
            return values.length === 4 ? parseFloat(values[3]) : 1;
        }
        return 1;
    }

    extractColor(color) {
        if (color.startsWith('#')) return color;
        const rgba = color.match(/rgba?\(([^)]+)\)/);
        if (rgba) {
            const values = rgba[1].split(',').map(v => v.trim());
            return `rgb(${values[0]}, ${values[1]}, ${values[2]})`;
        }
        return color;
    }

    escapeXml(unsafe) {
        return unsafe.replace(/[<>&'"]/g, (c) => {
            switch (c) {
                case '<': return '&lt;';
                case '>': return '&gt;';
                case '&': return '&amp;';
                case "'": return '&apos;';
                case '"': return '&quot;';
                default: return c;
            }
        });
    }

    getSupportedFormats() {
        return this.supportedFormats;
    }

    getAvailableFonts() {
        return this.fonts;
    }

    async getImageInfo(filePath) {
        try {
            const metadata = await sharp(filePath).metadata();
            return {
                width: metadata.width,
                height: metadata.height,
                format: metadata.format,
                pages: metadata.pages || 1,
                animated: (metadata.pages || 1) > 1,
                size: (await fs.stat(filePath)).size
            };
        } catch (error) {
            throw new Error(`Failed to get image info: ${error.message}`);
        }
    }

    async cleanup(filePaths) {
        for (const filePath of filePaths) {
            try {
                await fs.unlink(filePath);
            } catch (error) {
                console.warn(`Failed to cleanup file ${filePath}:`, error.message);
            }
        }
    }
}

export default new TextService();
