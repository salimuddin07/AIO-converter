import OpenAI from 'openai';
import fs from 'fs/promises';
import path from 'path';

const MODEL = process.env.OPENAI_VISION_MODEL || 'gpt-4o-mini';

export async function describeImage(filePath) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY not set');
  const client = new OpenAI({ apiKey });

  // Read and base64 encode (cap at ~2MB to be safe)
  const stat = await fs.stat(filePath);
  const maxBytes = 2 * 1024 * 1024;
  if (stat.size > maxBytes) {
    throw new Error('Image too large to describe');
  }
  const buf = await fs.readFile(filePath);
  const ext = (path.extname(filePath).toLowerCase().replace('.', '')) || 'png';
  const mime = ext === 'jpg' ? 'jpeg' : ext === 'svg' ? 'svg+xml' : ext;
  const dataUrl = `data:image/${mime};base64,${buf.toString('base64')}`;

  const messages = [
    {
      role: 'user',
      content: [
        { type: 'text', text: 'Describe this image briefly for a user-facing caption.' },
        { type: 'image_url', image_url: { url: dataUrl } }
      ]
    }
  ];

  const resp = await client.chat.completions.create({ model: MODEL, messages, temperature: 0.2 });
  const text = resp.choices?.[0]?.message?.content?.trim() || '';
  return text;
}
