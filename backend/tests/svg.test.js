import request from 'supertest';
import fs from 'fs/promises';
import path from 'path';
import app from '../src/app.js';

const simpleSvg = `<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"><rect width="16" height="16" fill="red"/></svg>`;

describe('SVG conversions', () => {
  test('raster PNG -> SVG (embedded)', async () => {
    const png = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGP8z8DwnwAIAwMKh6bDmgAAAABJRU5ErkJggg==','base64'
    );
    const p = path.join(process.cwd(), 'onepx.png');
    await fs.writeFile(p, png);
    const res = await request(app).post('/api/convert').attach('files', p).field('targetFormat','svg');
    expect(res.status).toBe(200);
    expect(res.body.results[0].convertedName).toMatch(/\.svg$/);
    expect(res.body.results[0].mimeType).toBe('image/svg+xml');
    await fs.unlink(p);
  });

  test('SVG -> PNG passthrough rasterization', async () => {
    const p = path.join(process.cwd(), 'simple.svg');
    await fs.writeFile(p, simpleSvg, 'utf8');
    const res = await request(app).post('/api/convert').attach('files', p).field('targetFormat','png');
    expect(res.status).toBe(200);
    expect(res.body.results[0].mimeType).toBe('image/png');
    await fs.unlink(p);
  });
});
