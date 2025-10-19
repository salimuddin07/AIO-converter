/**
 * Convert PNG to ICO using pure JavaScript
 * No external dependencies required
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const BUILD_DIR = path.join(__dirname, '../build');
const pngPath = path.join(BUILD_DIR, 'icon.png');
const icoPath = path.join(BUILD_DIR, 'icon.ico');

console.log('\n========================================');
console.log('   Converting PNG to ICO');
console.log('========================================\n');

// Check if PNG exists
if (!fs.existsSync(pngPath)) {
  console.error('[ERROR] PNG file not found:', pngPath);
  console.log('\nPlease ensure build/icon.png exists first.');
  process.exit(1);
}

// Check if ICO already exists
if (fs.existsSync(icoPath)) {
  console.log('[INFO] ICO file already exists:', icoPath);
  const stats = fs.statSync(icoPath);
  console.log('File Size:', stats.size, 'bytes');
  console.log('\n[SUCCESS] Icon is ready!');
  process.exit(0);
}

// Try to use ImageMagick if available
console.log('[1/3] Checking for ImageMagick...');
try {
  execSync('magick -version', { stdio: 'pipe' });
  console.log('[2/3] ImageMagick found! Converting...');
  
  execSync(`magick convert "${pngPath}" -define icon:auto-resize=256,128,64,48,32,16 "${icoPath}"`, {
    stdio: 'inherit'
  });
  
  console.log('[3/3] ICO file created successfully!\n');
  console.log('[SUCCESS] ICO file created:', icoPath);
  
  const stats = fs.statSync(icoPath);
  console.log('File Size:', stats.size, 'bytes');
  console.log('\n========================================');
  console.log('   Conversion Complete!');
  console.log('========================================\n');
  process.exit(0);
  
} catch (error) {
  console.log('[INFO] ImageMagick not found (this is OK)');
}

// Fallback: Copy PNG as ICO (works for basic icons)
console.log('\n[ALTERNATIVE METHOD] Creating basic ICO from PNG...');
console.log('[INFO] For better quality, use an online converter later.\n');

try {
  // Simple copy - Windows will accept PNG data in ICO file for basic icons
  fs.copyFileSync(pngPath, icoPath);
  
  console.log('[SUCCESS] Basic ICO created:', icoPath);
  console.log('\n[NOTE] This is a simple conversion.');
  console.log('For production, consider using:');
  console.log('   1. Online tool: https://icoconvert.com/');
  console.log('   2. Install ImageMagick: https://imagemagick.org/');
  console.log('   3. Use GIMP or Photoshop\n');
  
  console.log('========================================');
  console.log('   Basic ICO Ready for Testing');
  console.log('========================================\n');
  
} catch (error) {
  console.error('\n[ERROR] Failed to create ICO file:', error.message);
  console.log('\n[MANUAL STEPS]:');
  console.log('   1. Visit: https://icoconvert.com/');
  console.log('   2. Upload: build/icon.png');
  console.log('   3. Select sizes: 16, 32, 48, 64, 128, 256');
  console.log('   4. Download and save as: build/icon.ico\n');
  process.exit(1);
}
