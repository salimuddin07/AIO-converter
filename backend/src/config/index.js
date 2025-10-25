import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Detect if running in Electron
const isElectron = process.env.ELECTRON_MODE === 'true' || process.versions.hasOwnProperty('electron');

// Get resource paths based on environment
function getResourcePath(relativePath) {
  if (isElectron && process.resourcesPath) {
    return path.join(process.resourcesPath, relativePath);
  }
  return path.join(__dirname, '../..', relativePath);
}

export const config = {
  port: parseInt(process.env.PORT || '3003', 10),
  maxFileSizeGB: parseInt(process.env.MAX_FILE_SIZE_GB || '10', 10),
  maxBatchCount: parseInt(process.env.MAX_BATCH_COUNT || '30', 10),
  jpegQuality: parseInt(process.env.JPEG_QUALITY || '80', 10),
  fileTTLMinutes: parseInt(process.env.FILE_TTL_MINUTES || '30', 10),
  isElectron,
  resourcesPath: isElectron && process.resourcesPath ? process.resourcesPath : null,
  // FFmpeg paths
  ffmpegPath: process.env.FFMPEG_PATH || (isElectron && process.resourcesPath 
    ? path.join(process.resourcesPath, 'ffmpeg', 'win32', 'x64', 'ffmpeg.exe')
    : undefined),
  ffprobePath: process.env.FFPROBE_PATH || (isElectron && process.resourcesPath
    ? path.join(process.resourcesPath, 'ffmpeg', 'win32', 'x64', 'ffprobe.exe')
    : undefined),
};

export const supportedExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.bmp', '.tiff', '.mp4', '.avi', '.mov', '.webm'];
export const convertibleTargets = ['png','jpg','jpeg','gif','svg','mp4','frames'];

