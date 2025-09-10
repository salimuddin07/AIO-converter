import fs from 'fs/promises';
import path from 'path';

const backend = process.env.BACKEND_URL || 'http://localhost:4000';

async function main() {
  // Pick a sample png from src/temp or fallback to src/output
  const candidates = [
    'c:/MyPersonelProjects/GIF converter/backend/src/temp',
    'c:/MyPersonelProjects/GIF converter/backend/src/output'
  ];
  let filePath = null;
  for (const dir of candidates) {
    try {
      const files = (await fs.readdir(dir)).filter(f => f.toLowerCase().endsWith('.png'));
      if (files.length) { filePath = path.join(dir, files[0]); break; }
    } catch {}
  }
  if (!filePath) throw new Error('No sample PNG found');

  const buf = await fs.readFile(filePath);
  const form = new FormData();
  form.append('files', new Blob([buf], { type: 'image/png' }), path.basename(filePath));
  form.append('targetFormat', 'jpg');

  const res = await fetch(`${backend}/api/convert`, { method: 'POST', body: form });
  const text = await res.text();
  console.log('Status:', res.status);
  console.log(text);
  if (!res.ok) process.exit(1);
}

main().catch(e => { console.error(e); process.exit(1); });
