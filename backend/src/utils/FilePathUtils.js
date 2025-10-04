/**
 * File Path Utilities
 * Centralized file path management and directory utilities
 * 
 * @author Media Converter Team
 */

import path from 'path';
import fs from 'fs';
import os from 'os';
import { fileURLToPath } from 'url';

// Get current directory in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Base directories
export const rootDir = path.resolve(__dirname, '../../../');
export const srcDir = path.resolve(__dirname, '../');

// Runtime working directories (kept outside repository to avoid artifacts)
const runtimeBaseDir = path.resolve(os.tmpdir(), 'gif-converter');
export const tempDir = path.resolve(runtimeBaseDir, 'temp');
export const outputDir = path.resolve(runtimeBaseDir, 'output');
export const uploadsDir = path.resolve(runtimeBaseDir, 'uploads');
export const logsDir = path.resolve(runtimeBaseDir, 'logs');

// Public directories
export const publicDir = path.resolve(rootDir, 'public');
export const staticDir = path.resolve(publicDir, 'static');

/**
 * Ensure all required directories exist
 */
export function ensureDirectories() {
  const directories = [
    tempDir,
    outputDir,
    uploadsDir,
    logsDir,
    publicDir,
    staticDir
  ];

  directories.forEach(dir => {
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`Created directory: ${dir}`);
      }
    } catch (error) {
      console.error(`Failed to create directory ${dir}:`, error.message);
    }
  });
}

/**
 * Get relative path from root
 */
export function getRelativePath(fullPath) {
  return path.relative(rootDir, fullPath);
}

/**
 * Get safe filename (remove/replace unsafe characters)
 */
export function getSafeFilename(filename) {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

/**
 * Get file extension
 */
export function getFileExtension(filename) {
  return path.extname(filename).toLowerCase();
}

/**
 * Check if path is within allowed directory
 */
export function isPathSafe(filePath, allowedDir) {
  const resolvedPath = path.resolve(filePath);
  const resolvedAllowedDir = path.resolve(allowedDir);
  return resolvedPath.startsWith(resolvedAllowedDir);
}

/**
 * Get MIME type from file extension
 */
export function getMimeType(filename) {
  const ext = getFileExtension(filename);
  const mimeTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.bmp': 'image/bmp',
    '.tiff': 'image/tiff',
    '.svg': 'image/svg+xml',
    '.mp4': 'video/mp4',
    '.avi': 'video/x-msvideo',
    '.mov': 'video/quicktime',
    '.webm': 'video/webm',
    '.mkv': 'video/x-matroska',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.pdf': 'application/pdf',
    '.zip': 'application/zip'
  };
  
  return mimeTypes[ext] || 'application/octet-stream';
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Get available disk space
 */
export async function getDiskSpace() {
  try {
    const stats = fs.statSync(rootDir);
    return {
      available: stats.size,
      formatted: formatFileSize(stats.size)
    };
  } catch (error) {
    return {
      available: 0,
      formatted: '0 Bytes',
      error: error.message
    };
  }
}

/**
 * Clean up old files in directory
 */
export async function cleanupOldFiles(directory, maxAge = 24 * 60 * 60 * 1000) { // 24 hours default
  try {
    if (!fs.existsSync(directory)) return { cleaned: 0, errors: 0 };

    const files = fs.readdirSync(directory);
    let cleaned = 0;
    let errors = 0;
    const now = Date.now();

    for (const file of files) {
      try {
        const filePath = path.join(directory, file);
        const stats = fs.statSync(filePath);
        
        if (now - stats.mtime.getTime() > maxAge) {
          fs.unlinkSync(filePath);
          cleaned++;
        }
      } catch (error) {
        console.error(`Error cleaning file ${file}:`, error.message);
        errors++;
      }
    }

    return { cleaned, errors, directory };
  } catch (error) {
    console.error(`Error cleaning directory ${directory}:`, error.message);
    return { cleaned: 0, errors: 1, error: error.message };
  }
}

/**
 * Get directory size
 */
export function getDirectorySize(directory) {
  try {
    if (!fs.existsSync(directory)) return 0;

    let totalSize = 0;
    const files = fs.readdirSync(directory);

    for (const file of files) {
      const filePath = path.join(directory, file);
      const stats = fs.statSync(filePath);
      
      if (stats.isDirectory()) {
        totalSize += getDirectorySize(filePath);
      } else {
        totalSize += stats.size;
      }
    }

    return totalSize;
  } catch (error) {
    console.error(`Error getting directory size for ${directory}:`, error.message);
    return 0;
  }
}

// Initialize directories on import
ensureDirectories();

// Legacy exports for backward compatibility
export const ensureRuntimeDirs = ensureDirectories;
export const filePaths = {
  root: rootDir,
  src: srcDir,
  temp: tempDir,
  output: outputDir,
  uploads: uploadsDir,
  logs: logsDir,
  public: publicDir,
  static: staticDir
};
