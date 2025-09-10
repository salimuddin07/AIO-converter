import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

export const tempDir = path.join(rootDir, 'temp');
export const outputDir = path.join(rootDir, 'output');

export function ensureRuntimeDirs() {
  [tempDir, outputDir].forEach(d => {
    if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
  });
}
