import 'dotenv/config';
import { createServer } from 'http';
import app from './src/app.js';
import { scheduleCleanup } from './src/services/CleanupService.js';
import { config } from './src/config/index.js';

const PORT = config.port;
const server = createServer(app);

// Schedule cleanup only if not in test mode
if (process.env.NODE_ENV !== 'test') {
  scheduleCleanup();
}

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 AIO Converter backend listening on port ${PORT}`);
  if (config.isElectron) {
    console.log('📦 Running in Electron mode');
    console.log('📁 Resources path:', config.resourcesPath || 'Using local paths');
  }
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use. Please close other instances or use a different port.`);
  } else {
    console.error('❌ Server error:', err);
  }
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught exception:', err);
  console.error('Stack trace:', err.stack);
});

process.on('unhandledRejection', (reason) => {
  console.error('❌ Unhandled rejection:', reason);
  if (reason instanceof Error) {
    console.error('Stack trace:', reason.stack);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('📴 SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('📴 SIGINT received, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

