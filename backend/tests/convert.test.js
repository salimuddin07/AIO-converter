import request from 'supertest';
import path from 'path';
import fs from 'fs/promises';
import app from '../src/app.js';
import { tempDir, outputDir } from '../src/utils/filePaths.js';

// Helper to create a small png buffer using sharp dynamically to avoid bundling fixtures
import sharp from 'sharp';

async function makePng(color, size=16) {
  return sharp({ create: { width: size, height: size, channels: 4, background: color } }).png().toBuffer();
}

async function writeTemp(buffer, name) {
  const filePath = path.join(tempDir, name);
  await fs.writeFile(filePath, buffer);
  return filePath;
}

describe('POST /api/convert', () => {
  test('converts single PNG to JPEG', async () => {
    const buf = await makePng({ r:255,g:0,b:0,alpha:1 });
    const filePath = path.join(process.cwd(), 'red.png');
    await fs.writeFile(filePath, buf);

    const res = await request(app)
      .post('/api/convert')
      .attach('files', filePath)
      .field('targetFormat', 'jpg');

    expect(res.status).toBe(200);
    expect(res.body.results).toHaveLength(1);
    expect(res.body.results[0].convertedName).toMatch(/\.jpg$/);
    await fs.unlink(filePath);
  });

  test('creates animated GIF from multiple frames', async () => {
    const buf1 = await makePng({ r:0,g:255,b:0,alpha:1 });
    const buf2 = await makePng({ r:0,g:0,b:255,alpha:1 });
    const f1 = path.join(process.cwd(), 'f1.png');
    const f2 = path.join(process.cwd(), 'f2.png');
    await fs.writeFile(f1, buf1); await fs.writeFile(f2, buf2);

    const res = await request(app)
      .post('/api/convert')
      .attach('files', f1)
      .attach('files', f2)
      .field('targetFormat', 'gif')
      .field('gif.frameDelay', '80')
      .field('gif.loop', '0');

    expect(res.status).toBe(200);
    expect(res.body.results).toHaveLength(1);
  expect(res.body.results[0].convertedName).toMatch(/\.gif$/);
  expect(res.body.results[0].animated).toBe(true);

    await fs.unlink(f1); await fs.unlink(f2);
  });

  test('single image gif without flag returns PNG', async () => {
    const buf = await makePng({ r:10,g:10,b:200,alpha:1 });
    const f = path.join(process.cwd(), 'single.png');
    await fs.writeFile(f, buf);
    const res = await request(app)
      .post('/api/convert')
      .attach('files', f)
      .field('targetFormat', 'gif');
    expect(res.status).toBe(200);
    expect(res.body.results[0].mimeType).toBe('image/png');
    await fs.unlink(f);
  });

  test('single image forced gif', async () => {
    const buf = await makePng({ r:20,g:150,b:20,alpha:1 });
    const f = path.join(process.cwd(), 'single2.png');
    await fs.writeFile(f, buf);
    const res = await request(app)
      .post('/api/convert')
      .attach('files', f)
      .field('targetFormat', 'gif')
      .field('singleGif', 'true');
    expect(res.status).toBe(200);
    expect(res.body.results[0].mimeType).toBe('image/gif');
    expect(res.body.results[0].animated).toBe(false);
    await fs.unlink(f);
  });

  test('validation error with no files', async () => {
    const res = await request(app)
      .post('/api/convert')
      .field('targetFormat', 'png');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBeDefined();
  });
});
