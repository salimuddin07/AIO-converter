import { Router } from 'express';
import path from 'path';
import fs from 'fs/promises';
import { outputDir } from '../utils/FilePathUtils.js';

const router = Router();

// Download with attachment header and safe path handling
router.get('/download/:name', async (req, res, next) => {
  try {
    const name = path.basename(req.params.name || '');
    if (!name) return res.status(400).json({ error: { code: 'BAD_NAME', message: 'Filename required' } });
    const full = path.join(outputDir, name);
    // Ensure the resolved path stays inside outputDir
    const resolved = path.resolve(full);
    if (!resolved.startsWith(path.resolve(outputDir))) {
      return res.status(400).json({ error: { code: 'BAD_PATH', message: 'Invalid path' } });
    }
    await fs.access(resolved);
    res.type(path.extname(name));
    res.setHeader('Content-Disposition', `attachment; filename="${name}"`);
    res.sendFile(resolved);
  } catch (e) {
    if (e && e.code === 'ENOENT') return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'File not found' } });
    next(e);
  }
});

export default router;
