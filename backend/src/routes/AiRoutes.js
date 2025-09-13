import { Router } from 'express';
import path from 'path';
import { outputDir } from '../utils/FilePathUtils.js';
import { describeImage } from '../service./AiService.js';

const router = Router();

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
