/**
 * Prepare Resources for Electron Build
 * This script copies necessary resources for the Electron build
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const RESOURCES_DIR = path.join(__dirname, '../resources');
const BUILD_DIR = path.join(__dirname, '../build');

console.log('📦 Preparing resources for Electron build...\n');

// Ensure directories exist
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✅ Created directory: ${dir}`);
  }
}

// Copy file
function copyFile(src, dest) {
  try {
    fs.copyFileSync(src, dest);
    console.log(`✅ Copied: ${path.basename(src)}`);
  } catch (error) {
    console.error(`❌ Failed to copy ${src}:`, error.message);
  }
}

// Copy directory recursively
function copyDir(src, dest) {
  ensureDir(dest);
  
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      copyFile(srcPath, destPath);
    }
  }
}

// 1. Ensure build directory exists
console.log('1️⃣ Setting up build directory...');
ensureDir(BUILD_DIR);
ensureDir(RESOURCES_DIR);

// 2. Create placeholder icon if it doesn't exist
console.log('\n2️⃣ Checking for application icon...');
const iconPath = path.join(BUILD_DIR, 'icon.ico');
const iconPngPath = path.join(BUILD_DIR, 'icon.png');

if (!fs.existsSync(iconPath)) {
  console.log('⚠️  No icon.ico found. You should add one at build/icon.ico');
  console.log('   Icon should be 256x256 or larger, in .ico format for Windows');
}

if (!fs.existsSync(iconPngPath)) {
  console.log('⚠️  No icon.png found. You should add one at build/icon.png');
}

// 3. Create NSIS installer script
console.log('\n3️⃣ Creating NSIS installer script...');
const nsisScript = `
; Custom NSIS script for AIO Converter
; This file is included by electron-builder

!macro customInstall
  ; Create file associations
  WriteRegStr HKCR ".gif" "" "AIOConverter.gif"
  WriteRegStr HKCR "AIOConverter.gif" "" "GIF Image"
  WriteRegStr HKCR "AIOConverter.gif\\DefaultIcon" "" "$INSTDIR\\AIO Converter.exe,0"
  WriteRegStr HKCR "AIOConverter.gif\\shell\\open\\command" "" '"$INSTDIR\\AIO Converter.exe" "%1"'
  
  ; Additional file types
  WriteRegStr HKCR ".png" "" "AIOConverter.image"
  WriteRegStr HKCR ".jpg" "" "AIOConverter.image"
  WriteRegStr HKCR ".jpeg" "" "AIOConverter.image"
  WriteRegStr HKCR ".webp" "" "AIOConverter.image"
  WriteRegStr HKCR "AIOConverter.image\\shell\\Convert with AIO" "" ""
  WriteRegStr HKCR "AIOConverter.image\\shell\\Convert with AIO\\command" "" '"$INSTDIR\\AIO Converter.exe" "%1"'
!macroend

!macro customUnInstall
  ; Remove file associations
  DeleteRegKey HKCR ".gif"
  DeleteRegKey HKCR "AIOConverter.gif"
  DeleteRegKey HKCR "AIOConverter.image"
!macroend
`;

fs.writeFileSync(path.join(BUILD_DIR, 'installer.nsh'), nsisScript);
console.log('✅ Created installer.nsh');

// 4. Create or copy LICENSE file
console.log('\n4️⃣ Checking LICENSE file...');
const licensePath = path.join(__dirname, '../LICENSE');
if (!fs.existsSync(licensePath)) {
  const defaultLicense = `MIT License

Copyright (c) ${new Date().getFullYear()} Salimuddin

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`;
  
  fs.writeFileSync(licensePath, defaultLicense);
  console.log('✅ Created LICENSE file');
} else {
  console.log('✅ LICENSE file exists');
}

// 5. Build frontend
console.log('\n5️⃣ Building frontend...');
try {
  process.chdir(path.join(__dirname, '../frontend'));
  console.log('📦 Running: npm run build');
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Frontend built successfully');
} catch (error) {
  console.error('❌ Frontend build failed:', error.message);
  process.exit(1);
}

console.log('\n✅ All resources prepared successfully!');
console.log('\n📋 Summary:');
console.log('   - Build directory ready');
console.log('   - Frontend built');
console.log('   - NSIS installer script created');
console.log('\n🚀 You can now run: npm run build:win');
console.log('   Or for portable: npm run build:win-portable\n');
