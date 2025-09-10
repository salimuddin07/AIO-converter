import 'dotenv/config';
import { createServer } from 'http';
import app from './src/app.js';
import { scheduleCleanup } from './src/services/cleanupService.js';

const PORT = process.env.PORT || 4000;
const server = createServer(app);
scheduleCleanup();

server.listen(PORT, () => {
  console.log(`Image Converter backend listening on port ${PORT}`);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection', reason);
});
