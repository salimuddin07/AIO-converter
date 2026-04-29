// Zips dist/AIO Converter-win32-x64 into dist/AIO-Converter-<version>-win-x64.zip
// Uses built-in Windows tar.exe (libarchive) - available on Windows 10 1803+.
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const version = require(path.join(projectRoot, 'package.json')).version;
const distDir = path.join(projectRoot, 'dist');
const sourceFolderName = 'AIO Converter-win32-x64';
const sourceFolder = path.join(distDir, sourceFolderName);
const zipName = `AIO-Converter-${version}-win-x64.zip`;
const zipPath = path.join(distDir, zipName);

if (!fs.existsSync(sourceFolder)) {
  console.error(`Source folder not found: ${sourceFolder}`);
  console.error('Run "npm run package" first.');
  process.exit(1);
}

if (fs.existsSync(zipPath)) {
  fs.unlinkSync(zipPath);
}

console.log(`Creating ${zipName} ...`);

// tar.exe -a -c -f <zipPath> -C <distDir> <sourceFolderName>
const result = spawnSync(
  'tar.exe',
  ['-a', '-c', '-f', zipPath, '-C', distDir, sourceFolderName],
  { stdio: 'inherit' }
);

if (result.status !== 0) {
  console.error('tar.exe failed (status ' + result.status + ').');
  console.error('Falling back to PowerShell Compress-Archive...');
  const ps = spawnSync(
    'powershell.exe',
    [
      '-NoProfile',
      '-Command',
      `Compress-Archive -Path "${sourceFolder}\\*" -DestinationPath "${zipPath}" -Force`,
    ],
    { stdio: 'inherit' }
  );
  if (ps.status !== 0) {
    console.error('Compress-Archive also failed.');
    process.exit(1);
  }
}

const stat = fs.statSync(zipPath);
const sizeMb = (stat.size / 1024 / 1024).toFixed(1);
console.log(`\n[OK] ${zipName} created (${sizeMb} MB)`);
console.log(`     Path: ${zipPath}`);
console.log(`\nUpload this file to Gumroad.`);
