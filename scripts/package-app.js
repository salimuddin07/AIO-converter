// Wraps electron-packager with the right ignore patterns and options.
// Output: dist/AIO Converter-win32-x64/
const packager = require('electron-packager');
const path = require('path');
const fs = require('fs');

const projectRoot = path.resolve(__dirname, '..');

const ignorePatterns = [
  /^\/frontend\/src(\/|$)/,
  /^\/frontend\/node_modules(\/|$)/,
  /^\/frontend\/\.vite(\/|$)/,
  /^\/temp(\/|$)/,
  /^\/logs(\/|$)/,
  /^\/dist(\/|$)/,
  /^\/dist-packager(\/|$)/,
  /^\/\.git(\/|$)/,
  /^\/\.vscode(\/|$)/,
  /^\/scripts(\/|$)/,
  /^\/docs(\/|$)/,
  /^\/.*\.md$/,
  /^\/.*\.bat$/,
  /^\/test-.*\.js$/,
  /^\/electron-builder\.yml$/,
  /^\/package-lock\.json$/,
  /^\/\.eslintrc.*/,
  /^\/\.gitignore$/,
];

(async () => {
  try {
    console.log('Running electron-packager...');
    const appPaths = await packager({
      dir: projectRoot,
      out: path.join(projectRoot, 'dist'),
      name: 'AIO Converter',
      platform: 'win32',
      arch: 'x64',
      overwrite: true,
      asar: false,
      icon: fs.existsSync(path.join(projectRoot, 'build', 'icon.ico'))
        ? path.join(projectRoot, 'build', 'icon.ico')
        : undefined,
      appCopyright: 'Copyright © 2025 Salimuddin',
      appVersion: require(path.join(projectRoot, 'package.json')).version,
      ignore: ignorePatterns,
      prune: true,
    });
    console.log('Packaged at:', appPaths.join(', '));
  } catch (err) {
    console.error('Packaging failed:', err);
    process.exit(1);
  }
})();
