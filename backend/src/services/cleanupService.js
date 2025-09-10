import fs from 'fs/promises';
import path from 'path';
import cron from 'node-cron';
import { tempDir, outputDir } from '../utils/filePaths.js';

const TTL_MINUTES = parseInt(process.env.FILE_TTL_MINUTES || '30', 10);
const CRON_EXPR = process.env.CLEANUP_INTERVAL_CRON || '*/15 * * * *';

async function cleanupDir(dir) {
  const now = Date.now();
  let entries = [];
  try {
    entries = await fs.readdir(dir);
  } catch {
    return;
  }
  await Promise.all(entries.map(async (name) => {
    const full = path.join(dir, name);
    try {
      const stat = await fs.stat(full);
      if (stat.isFile()) {
        const ageMin = (now - stat.mtimeMs) / 60000;
        if (ageMin > TTL_MINUTES) {
          await fs.unlink(full);
        }
      }
    } catch {/* ignore */}
  }));
}

export function scheduleCleanup() {
  cron.schedule(CRON_EXPR, async () => {
    await cleanupDir(tempDir);
    await cleanupDir(outputDir);
  });
}
