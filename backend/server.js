import 'dotenv/config';
import { createServer } from 'http';
import app from './src/app.js';
import { scheduleCleanup } from './src/services/cleanupService.js';

// Use port 3003 for local development, Railway will override with its own PORT
const PORT = process.env.PORT || 3003;
const server = createServer(app);
scheduleCleanup();

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Image Converter backend listening on port ${PORT}`);
});

server.on('error', (err) => {
  console.error('Server error:', err);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  console.error('Stack trace:', err.stack);
});
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
  if (reason instanceof Error) {
    console.error('Stack trace:', reason.stack);
  }
});
