import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

// Import route modules
import convertRouter from './src/routes/ConversionRoutes.js';
import splitRouter from './src/routes/SplitRoutes.js';
import videoRouter from './src/routes/VideoRoutes.js';
import textRouter from './src/routes/TextRoutes.js';
import aiRouter from './src/routes/AiRoutes.js';
import filesRouter from './src/routes/FileRoutes.js';
import webpRouter from './src/routes/WebpRoutes.js';
import enhancedGifRouter from './src/routes/EnhancedGifRoutes.js';
import modernFormatRouter from './src/routes/ModernFormatRoutes.js';

// Import utilities
import { ensureDirectories } from './src/utils/FilePathUtils.js';

console.log('Starting fresh server...');

// Ensure required directories exist
try {
  ensureDirectories();
  console.log('✅ Directories ensured');
} catch (error) {
  console.warn('⚠️  Directory setup warning:', error.message);
}

const app = express();

// Enable CORS
app.use(cors());

// Parse JSON and URL encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Root route
app.get('/', (req, res) => {
  console.log('Handling root request');
  try {
    res.json({ 
      message: 'Fresh GIF Converter API',
      status: 'running',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    });
  } catch (error) {
    console.error('Error in root handler:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check
app.get('/health', (req, res) => {
  console.log('Handling health check');
  try {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Error in health handler:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API Tester page
app.get('/test', (req, res) => {
  console.log('Serving API tester page');
  res.sendFile(path.join(__dirname, 'api-tester.html'));
});

// File Upload Tester page
app.get('/files', (req, res) => {
  console.log('Serving file upload tester page');
  res.sendFile(path.join(__dirname, 'file-tester.html'));
});

// Functionality Tester page
app.get('/functionality', (req, res) => {
  console.log('Serving functionality tester page');
  res.sendFile(path.join(__dirname, 'functionality-tester.html'));
});

// WebP info endpoint
app.get('/api/webp-info', (req, res) => {
  console.log('Handling WebP info request');
  try {
    res.json({
      service: 'WebP Information',
      formats: ['WebP', 'AVIF', 'HEIF'],
      features: ['lossless', 'lossy', 'animated', 'alpha'],
      status: 'available'
    });
  } catch (error) {
    console.error('Error in webp-info handler:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API Routes
console.log('Setting up API routes...');
app.use('/api/convert', convertRouter);
app.use('/api/split', splitRouter);
app.use('/api/video', videoRouter);
app.use('/api/text', textRouter);
app.use('/api/ai', aiRouter);
app.use('/api/files', filesRouter);
app.use('/api/webp', webpRouter);
app.use('/api/enhanced-gif', enhancedGifRouter);
app.use('/api/modern', modernFormatRouter);

// Serve static files
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/api/output', express.static(path.join(__dirname, '../output')));
console.log('✅ API routes configured');

// Error handler
app.use((error, req, res, next) => {
  console.error('Express error handler:', error);
  res.status(500).json({ 
    error: 'Server error', 
    message: error.message,
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 3004;

app.listen(PORT, () => {
  console.log(`✅ Fresh server is running on port ${PORT}`);
  console.log(`Test it: http://localhost:${PORT}`);
});

process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});