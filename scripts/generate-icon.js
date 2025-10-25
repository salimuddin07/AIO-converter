/**
 * Simple Icon Generator
 * Creates a basic placeholder icon for development/testing
 * For production, use a professional icon design
 */

const fs = require('fs');
const path = require('path');

const BUILD_DIR = path.join(__dirname, '../build');
const PUBLIC_DIR = path.join(__dirname, '../public');

// SVG icon template
const svgIcon = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <!-- Background gradient -->
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Rounded rectangle background -->
  <rect width="512" height="512" rx="80" fill="url(#grad1)"/>
  
  <!-- AIO Text -->
  <text x="256" y="240" font-family="Arial, sans-serif" font-size="140" font-weight="bold" 
        fill="white" text-anchor="middle">AIO</text>
  
  <!-- Convert Text -->
  <text x="256" y="340" font-family="Arial, sans-serif" font-size="60" font-weight="normal" 
        fill="white" text-anchor="middle" opacity="0.9">Convert</text>
  
  <!-- Icon elements (play button style) -->
  <circle cx="256" cy="420" r="35" fill="white" opacity="0.2"/>
  <polygon points="246,405 276,420 246,435" fill="white" opacity="0.9"/>
</svg>`;

console.log('🎨 Creating placeholder icon...\n');

// Ensure directories exist
if (!fs.existsSync(BUILD_DIR)) {
  fs.mkdirSync(BUILD_DIR, { recursive: true });
}
if (!fs.existsSync(PUBLIC_DIR)) {
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
}

// Save SVG
const svgPath = path.join(BUILD_DIR, 'icon.svg');
fs.writeFileSync(svgPath, svgIcon);
console.log('✅ Created SVG icon:', svgPath);

console.log('\n⚠️  IMPORTANT NOTES:');
console.log('1. This creates a basic SVG placeholder icon');
console.log('2. You need to convert it to PNG and ICO formats');
console.log('3. For Windows builds, you need:');
console.log('   - build/icon.ico (Windows icon)');
console.log('   - build/icon.png (512x512 PNG)');
console.log('   - public/icon.png (512x512 PNG)');
console.log('\n📖 See build/ICON_README.md for detailed instructions');
console.log('\n🔧 To convert SVG to PNG and ICO:');
console.log('   Option 1: Use online tool: https://icoconvert.com/');
console.log('   Option 2: Use ImageMagick: magick convert icon.svg icon.png');
console.log('   Option 3: Use GIMP or Photoshop');
console.log('\n✨ For a professional look, consider hiring a designer or using:');
console.log('   - Figma (https://figma.com)');
console.log('   - Canva (https://canva.com)');
console.log('   - Adobe Express (https://www.adobe.com/express/)');
console.log('\n');
