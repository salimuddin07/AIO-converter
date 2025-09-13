import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import convertRouter from './routes/ConversionRoutes.js';
// import splitRouter from './routes/SplitRoutes.js'; // Temporarily disabled due to file corruption
import videoRouter from './routes/VideoRoutes.js';
import textRouter from './routes/TextRoutes.js';
import aiRouter from './routes/AiRoutes.js';
import filesRouter from './routes/FileRoutes.js';
import webpRouter from './routes/WebpRoutes.js';
import errorHandler from './middleware/ErrorHandler.js';
import { ensureDirectories } from './utils/FilePathUtils.js';

const app = express();

ensureDirectories();

app.use(cors({ origin: true }));

// Minimal request logger
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/convert', convertRouter);
// app.use('/api/split', splitRouter); // Temporarily disabled
app.use('/api/video', videoRouter);
app.use('/api/text', textRouter);
app.use('/api/ai', aiRouter);
app.use('/api/files', filesRouter);
app.use('/api/webp', webpRouter);

// Serve converted files statically
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/api/files', express.static(path.join(__dirname, 'output')));
app.use('/api/output', express.static(path.join(__dirname, 'output')));

// Multer error handler (e.g., file size)
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, next) => {
  if (err && err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: { code: 'FILE_TOO_LARGE', message: 'File exceeds size limit' } });
  }
  if (err && err.message === 'Unsupported mimetype') {
    return res.status(400).json({ error: { code: 'UNSUPPORTED_TYPE', message: 'Unsupported file type' } });
  }
  return next(err);
});

app.use(errorHandler);

export default app;
