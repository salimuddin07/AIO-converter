import { Router } from 'express';
import path from 'path';
import multer from 'multer';
import OpenAI from 'openai';
import { outputDir } from '../utils/FilePathUtils.js';
import { describeImage } from '../services/AiService.js';

const router = Router();

// Configure multer for handling file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

router.get('/status', (_req, res) => {
  const providers = [
    { name: 'openai', key: process.env.OPENAI_API_KEY },
    { name: 'anthropic', key: process.env.ANTHROPIC_API_KEY },
    { name: 'azure-openai', key: process.env.AZURE_OPENAI_API_KEY || process.env.AZURE_OPENAI_KEY },
    { name: 'huggingface', key: process.env.HUGGINGFACE_API_KEY || process.env.HF_API_KEY }
  ];
  const found = providers.find(p => !!p.key);
  res.json({ enabled: !!found, provider: found?.name || null });
});

// AI Background Removal endpoint
router.post('/remove-background', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: 'OpenAI API key not configured' });
    }

    console.log('Processing background removal for image:', req.file.originalname);

    // Convert buffer to base64
    const base64Image = req.file.buffer.toString('base64');
    const imageDataURL = `data:${req.file.mimetype};base64,${base64Image}`;

    // Use OpenAI's vision model to analyze the image and generate a mask
    const response = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Please analyze this image and provide instructions for background removal. Identify the main subject that should be kept and describe the background areas that should be removed. Be specific about colors, shapes, and regions."
            },
            {
              type: "image_url",
              image_url: {
                url: imageDataURL,
                detail: "high"
              }
            }
          ]
        }
      ],
      max_tokens: 500
    });

    const analysis = response.choices[0].message.content;
    console.log('OpenAI Analysis:', analysis);

    // For now, return the original image with analysis
    // In a production environment, you would use this analysis to guide
    // a more sophisticated background removal algorithm or service
    
    // Since OpenAI doesn't directly provide background removal,
    // we'll use a simple approach or integrate with a specialized service
    
    // For demonstration, return the original image
    // In production, you could integrate with services like:
    // - remove.bg API
    // - Adobe's background removal API
    // - Custom ML models for background removal
    
    res.setHeader('Content-Type', req.file.mimetype);
    res.setHeader('Content-Disposition', 'attachment; filename="background-removed.png"');
    res.send(req.file.buffer);

  } catch (error) {
    console.error('Background removal error:', error);
    res.status(500).json({ 
      error: 'Background removal failed',
      details: error.message 
    });
  }
});

// describe by filename in /api/files
router.post('/describe', async (req, res, next) => {
  try {
    const { name } = req.body || {};
    if (!name) return res.status(400).json({ error: { code: 'NO_NAME', message: 'name required' } });
    const full = path.join(outputDir, path.basename(name));
    const caption = await describeImage(full);
    res.json({ caption });
  } catch (e) { next(e); }
});

export default router;

// describe by filename in /api/files
router.post('/describe', async (req, res, next) => {
  try {
    const { name } = req.body || {};
    if (!name) return res.status(400).json({ error: { code: 'NO_NAME', message: 'name required' } });
    const full = path.join(outputDir, path.basename(name));
    const caption = await describeImage(full);
    res.json({ caption });
  } catch (e) { next(e); }
});
