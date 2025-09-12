import 'dotenv/config';
import { createServer } from 'http';
import app from './src/app.js';
import { scheduleCleanup } from './src/services/cleanupService.js';

const PORT = process.env.PORT || 5001;
const server = createServer(app);
scheduleCleanup();

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Image Converter backend listening on port ${PORT}`);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection', reason);
});
