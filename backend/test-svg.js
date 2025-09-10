import { convertSingle } from './src/services/conversionService.js';
import path from 'path';
import fs from 'fs/promises';

async function testSVGConversion() {
  try {
    // Test with any image file in temp folder
    const tempDir = './src/temp';
    const files = await fs.readdir(tempDir);
    const imageFile = files.find(f => /\.(jpg|jpeg|png|gif)$/i.test(f));
    
    if (!imageFile) {
      console.log('No image files found in temp folder');
      return;
    }
    
    const inputPath = path.join(tempDir, imageFile);
    console.log('Converting:', inputPath);
    
    const result = await convertSingle(inputPath, 'svg');
    console.log('SVG conversion result:', result);
    
    // Check if the file was created
    const exists = await fs.access(result.outPath).then(() => true).catch(() => false);
    console.log('SVG file exists:', exists);
    
    if (exists) {
      const content = await fs.readFile(result.outPath, 'utf8');
      console.log('SVG content preview:', content.substring(0, 200) + '...');
    }
    
  } catch (error) {
    console.error('SVG conversion error:', error);
  }
}

testSVGConversion();
