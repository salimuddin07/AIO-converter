import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import textService from '../services/TextService.js';
import textToMdService from '../services/TextToMdService.js';
import { cleanupFiles } from '../services/cleanupService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Test route
router.get('/', (req, res) => {
    res.json({ 
        success: true, 
        service: 'Text Processing Service',
        message: 'Text processing endpoints are available',
        endpoints: ['/upload', '/add-text', '/text-to-md', '/download/:filename']
    });
});

// Health check
router.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'text' });
});

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../temp'));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'text-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage,
    limits: { fileSize: 200 * 1024 * 1024 }, // 200GB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/gif', 'image/webp', 'image/png', 'image/jpeg', 'image/apng'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Please upload a supported image format.'));
        }
    }
});

// Upload and analyze image
router.post('/upload', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const filePath = req.file.path;
        const imageInfo = await textService.getImageInfo(filePath);
        
        // Schedule cleanup
        setTimeout(() => {
            cleanupFiles([filePath]);
        }, 3600000); // 1 hour

        res.json({
            success: true,
            fileId: path.basename(filePath),
            imageInfo,
            message: 'Image uploaded successfully'
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Upload image from URL
router.post('/upload-url', async (req, res) => {
    try {
        const { imageUrl } = req.body;
        
        if (!imageUrl) {
            return res.status(400).json({ error: 'Image URL is required' });
        }

        // Download image from URL
        const response = await fetch(imageUrl);
        if (!response.ok) {
            throw new Error(`Failed to download image: ${response.statusText}`);
        }

        const buffer = await response.arrayBuffer();
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = path.extname(new URL(imageUrl).pathname) || '.jpg';
        const filename = `url-text-${uniqueSuffix}${extension}`;
        const filePath = path.join(__dirname, '../temp', filename);

        await fs.writeFile(filePath, Buffer.from(buffer));
        
        const imageInfo = await textService.getImageInfo(filePath);
        
        // Schedule cleanup
        setTimeout(() => {
            cleanupFiles([filePath]);
        }, 3600000); // 1 hour

        res.json({
            success: true,
            fileId: filename,
            imageInfo,
            message: 'Image downloaded and analyzed successfully'
        });
    } catch (error) {
        console.error('URL upload error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Add text to image
router.post('/add-text', async (req, res) => {
    try {
        const { 
            fileId,
            text,
            x = 10,
            y = 50,
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
            animationMode = 'all',
            frameRange = { start: 0, end: -1 },
            alignment = 'left',
            wordWrap = false,
            maxWidth = 300
        } = req.body;

        if (!fileId || !text) {
            return res.status(400).json({ error: 'File ID and text are required' });
        }

        const inputPath = path.join(__dirname, '../temp', fileId);
        
        // Check if file exists
        try {
            await fs.access(inputPath);
        } catch (error) {
            return res.status(404).json({ error: 'File not found or expired' });
        }

        const options = {
            text, x: parseInt(x), y: parseInt(y), fontSize: parseInt(fontSize),
            fontFamily, color, backgroundColor, strokeColor, 
            strokeWidth: parseInt(strokeWidth), opacity: parseFloat(opacity),
            rotation: parseInt(rotation), outline: Boolean(outline),
            shadow: Boolean(shadow), shadowColor, 
            shadowOffsetX: parseInt(shadowOffsetX), 
            shadowOffsetY: parseInt(shadowOffsetY),
            shadowBlur: parseInt(shadowBlur), animationMode, frameRange,
            alignment, wordWrap: Boolean(wordWrap), 
            maxWidth: parseInt(maxWidth)
        };

        const resultBuffer = await textService.addTextToAnimatedImage(inputPath, options);
        
        // Save result
        const outputFilename = `text-result-${Date.now()}.png`;
        const outputPath = path.join(__dirname, '../output', outputFilename);
        await fs.writeFile(outputPath, resultBuffer);

        // Schedule cleanup
        setTimeout(() => {
            cleanupFiles([outputPath]);
        }, 3600000); // 1 hour

        res.json({
            success: true,
            outputFile: outputFilename,
            downloadUrl: `/api/text/download/${outputFilename}`,
            message: 'Text added successfully'
        });

    } catch (error) {
        console.error('Text addition error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get available fonts
router.get('/fonts', (req, res) => {
    res.json({
        fonts: textService.getAvailableFonts()
    });
});

// Get supported formats
router.get('/formats', (req, res) => {
    res.json({
        formats: textService.getSupportedFormats()
    });
});

// Preview text settings
router.post('/preview', async (req, res) => {
    try {
        const { 
            fileId,
            text,
            x = 10,
            y = 50,
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
            alignment = 'left',
            wordWrap = false,
            maxWidth = 300
        } = req.body;

        if (!fileId || !text) {
            return res.status(400).json({ error: 'File ID and text are required' });
        }

        const inputPath = path.join(__dirname, '../temp', fileId);
        
        // Check if file exists
        try {
            await fs.access(inputPath);
        } catch (error) {
            return res.status(404).json({ error: 'File not found or expired' });
        }

        const options = {
            text, x: parseInt(x), y: parseInt(y), fontSize: parseInt(fontSize),
            fontFamily, color, backgroundColor, strokeColor, 
            strokeWidth: parseInt(strokeWidth), opacity: parseFloat(opacity),
            rotation: parseInt(rotation), outline: Boolean(outline),
            shadow: Boolean(shadow), shadowColor, 
            shadowOffsetX: parseInt(shadowOffsetX), 
            shadowOffsetY: parseInt(shadowOffsetY),
            shadowBlur: parseInt(shadowBlur), animationMode: 'first',
            frameRange: { start: 0, end: 0 }, alignment, 
            wordWrap: Boolean(wordWrap), maxWidth: parseInt(maxWidth)
        };

        const resultBuffer = await textService.addTextToAnimatedImage(inputPath, options);
        
        // Return as base64 for preview
        const base64 = resultBuffer.toString('base64');
        res.json({
            success: true,
            preview: `data:image/png;base64,${base64}`,
            message: 'Preview generated successfully'
        });

    } catch (error) {
        console.error('Preview error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Download processed image
router.get('/download/:filename', async (req, res) => {
    try {
        const { filename } = req.params;
        const filePath = path.join(__dirname, '../output', filename);

        // Check if file exists
        try {
            await fs.access(filePath);
        } catch (error) {
            return res.status(404).json({ error: 'File not found' });
        }

        const stats = await fs.stat(filePath);
        const fileBuffer = await fs.readFile(filePath);

        res.set({
            'Content-Type': 'image/png',
            'Content-Length': stats.size,
            'Content-Disposition': `attachment; filename="${filename}"`,
            'Cache-Control': 'no-cache'
        });

        res.send(fileBuffer);
    } catch (error) {
        console.error('Download error:', error);
        res.status(500).json({ error: 'Failed to download file' });
    }
});

// Configure multer for text file uploads
const textStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../temp'));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'text-input-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const textUpload = multer({ 
    storage: textStorage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit for text files
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['text/plain', 'application/octet-stream'];
        const allowedExtensions = ['.txt', '.text'];
        
        const ext = path.extname(file.originalname).toLowerCase();
        
        if (allowedTypes.includes(file.mimetype) || allowedExtensions.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Please upload a .txt or .text file.'));
        }
    }
});

// Text to Markdown conversion endpoint
router.post('/text-to-md', textUpload.single('textFile'), async (req, res) => {
    let tempFiles = [];
    
    try {
        if (!req.file) {
            return res.status(400).json({ 
                success: false, 
                error: 'No text file provided' 
            });
        }

        tempFiles.push(req.file.path);

        // Get conversion options from request body
        const options = {
            autoHeaders: req.body.autoHeaders === 'true',
            autoParagraphs: req.body.autoParagraphs !== 'false', // default true
            autoLists: req.body.autoLists === 'true',
            autoLinks: req.body.autoLinks === 'true',
            autoCodeBlocks: req.body.autoCodeBlocks === 'true',
            autoEmphasis: req.body.autoEmphasis === 'true',
            preserveLineBreaks: req.body.preserveLineBreaks === 'true',
            addFrontMatter: req.body.addFrontMatter === 'true',
            title: req.body.title || '',
            author: req.body.author || '',
            date: req.body.date || new Date().toISOString().split('T')[0]
        };

        console.log('📝 Processing text to Markdown conversion with options:', options);

        // Validate input file
        await textToMdService.validateInput(req.file.path);

        // Convert text to Markdown
        const result = await textToMdService.convertTextToMarkdown(req.file.path, options);

        tempFiles.push(result.outputPath);

        // Read the converted file
        const markdownContent = await fs.readFile(result.outputPath, 'utf-8');

        // Create response data
        const responseData = {
            success: true,
            result: {
                filename: result.filename,
                originalFilename: req.file.originalname,
                size: result.size,
                originalSize: result.originalSize,
                markdownContent: markdownContent,
                downloadUrl: `/api/text/download/${result.filename}`,
                message: result.message,
                conversionOptions: options
            }
        };

        console.log('✅ Text to Markdown conversion completed successfully');

        res.json(responseData);

        // Schedule cleanup
        setTimeout(async () => {
            try {
                await cleanupFiles(tempFiles);
            } catch (cleanupError) {
                console.error('Cleanup error:', cleanupError);
            }
        }, 5 * 60 * 1000); // 5 minutes

    } catch (error) {
        console.error('❌ Text to Markdown conversion error:', error);
        
        // Cleanup temp files on error
        try {
            await cleanupFiles(tempFiles);
        } catch (cleanupError) {
            console.error('Cleanup error after conversion failure:', cleanupError);
        }

        res.status(500).json({
            success: false,
            error: error.message || 'Text to Markdown conversion failed'
        });
    }
});

// Serve static files for preview
router.use('/preview/:filename', express.static(path.join(__dirname, '../output')));

export default router;
