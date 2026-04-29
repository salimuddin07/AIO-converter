/**
 * UNIFIED API CLIENT - 100% local desktop processing via Electron IPC.
 * NO backend server is used. NO HTTP calls are made. Everything runs locally
 * via the IPC handlers registered in electron/main.js.
 *
 * If this module ever runs outside of Electron (e.g. accidentally opened in a
 * regular browser), every method throws a clear "desktop only" error so that
 * users never see a confusing network/backend error.
 */

const isElectron = () => {
  try {
    return typeof window !== 'undefined' &&
           window.electronAPI !== undefined &&
           typeof window.electronAPI === 'object';
  } catch (error) {
    console.warn('Error checking Electron environment:', error);
    return false;
  }
};

const DESKTOP_ONLY_MESSAGE = 'This feature is only available in the AIO Converter desktop app.';

const requireElectron = (feature) => {
  if (!isElectron()) {
    throw new Error(`${feature ? feature + ': ' : ''}${DESKTOP_ONLY_MESSAGE}`);
  }
};

/**
 * Helper: persist an in-memory File object to a temp file on disk so the
 * Electron main process can read it. Returns the absolute (or temp-relative)
 * path produced by the writeFile IPC handler.
 */
const writeFileToTemp = async (file, prefix = 'temp') => {
  if (!(file instanceof File)) {
    return file; // assume it's already a path
  }
  const arrayBuffer = await file.arrayBuffer();
  const safeName = (file.name || 'file').replace(/[^a-zA-Z0-9._-]/g, '_');
  const ext = safeName.includes('.') ? '' : '.bin';
  const tempFileName = `${prefix}_${Date.now()}_${safeName}${ext}`;
  const result = await window.electronAPI.writeFile({
    filePath: tempFileName,
    data: arrayBuffer
  });
  if (!result || !result.success || !result.filePath) {
    throw new Error(`Failed to save temp file for ${file.name}`);
  }
  return result.filePath;
};

/**
 * Unified API — pure Electron IPC. Every method runs locally inside the
 * desktop app via window.electronAPI (registered in electron/main.js).
 */
export const api = {

  // Environment detection
  get isElectron() {
    return isElectron();
  },
  /**
   * Create GIF from images
   */
  async createGifFromImages(files, options = {}) {
    requireElectron('createGifFromImages');
    console.log('🎬 Creating GIF from', files.length, 'images');

    const imagePaths = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file instanceof File) {
        const arrayBuffer = await file.arrayBuffer();
        const ext = file.name.split('.').pop() || 'jpg';
        const tempFileName = `temp_gif_${Date.now()}_${i}.${ext}`;
        const tempResult = await window.electronAPI.writeFile({
          filePath: tempFileName,
          data: arrayBuffer
        });
        if (tempResult.success && tempResult.filePath) {
          imagePaths.push(tempResult.filePath);
        } else {
          throw new Error(`Failed to save temp file: ${file.name}`);
        }
      } else {
        imagePaths.push(file);
      }
    }

    if (imagePaths.length === 0) {
      throw new Error('No valid image files provided');
    }

    const outputFileName = `gif_output_${Date.now()}.gif`;
    return await window.electronAPI.createGifFromImages({
      inputPaths: imagePaths,
      outputPath: outputFileName,
      options: {
        width: options.width || 500,
        height: options.height || 300,
        quality: options.quality || 80,
        fps: options.fps || 10,
        loop: options.loop !== false
      }
    });
  },

  /**
   * Convert image
   */
  async convertImage(file, options = {}) {
    requireElectron('convertImage');
    console.log('🖼️ Converting image:', file.name || 'unknown');

    let inputPath;
    if (file instanceof File) {
      const arrayBuffer = await file.arrayBuffer();
      const tempResult = await window.electronAPI.writeFile({
        filePath: `temp_convert_${Date.now()}_${file.name}`,
        data: arrayBuffer
      });
      inputPath = tempResult.filePath;
    } else {
      inputPath = file;
    }

    return await window.electronAPI.convertImage({
      inputPath,
      outputPath: `converted_${Date.now()}.${options.format || options.outputFormat || 'png'}`,
      format: options.format || options.outputFormat || 'png',
      quality: options.quality || 80,
      width: options.width,
      height: options.height
    });
  },

  /**
   * Convert video
   */
  async convertVideo(file, options = {}) {
    requireElectron('convertVideo');
    console.log('🎥 Converting video:', file.name || 'unknown');

    let inputPath;
    if (file instanceof File) {
      const arrayBuffer = await file.arrayBuffer();
      const tempResult = await window.electronAPI.writeFile({
        filePath: `temp_video_${Date.now()}_${file.name}`,
        data: arrayBuffer
      });
      inputPath = tempResult.filePath;
    } else {
      inputPath = file;
    }

    const result = await window.electronAPI.convertVideo({
      inputPath,
      outputPath: `converted_video_${Date.now()}.${options.outputFormat || options.format || 'mp4'}`,
      format: options.outputFormat || options.format || 'mp4',
      options: {
        quality: options.quality || 'medium',
        width: options.width,
        height: options.height,
        fps: options.fps,
        startTime: options.startTime,
        duration: options.duration
      }
    });

    if (result && result.success && result.outputPath) {
      const normalizedPath = result.outputPath.replace(/\\/g, '/');
      const fileUrl = normalizedPath.startsWith('/') ? `file://${normalizedPath}` : `file:///${normalizedPath}`;
      result.dataUrl = fileUrl;
      result.url = fileUrl;
      result.previewUrl = fileUrl;
      result.downloadUrl = fileUrl;
      result.filename = result.outputPath.split(/[/\\]/).pop();
    }

    return result;
  },

  /**
   * Show file picker (Electron native dialog)
   */
  async openFileDialog(options = {}) {
    requireElectron('openFileDialog');
    return await window.electronAPI.openDialog(options);
  },

  /**
   * Create GIF from video — uses convertVideo with gif output
   */
  async createGifFromVideo(file, options = {}) {
    requireElectron('createGifFromVideo');
    return await this.convertVideo(file, { ...options, outputFormat: 'gif' });
  },

  /**
   * General convert method (for backward compatibility)
   */
  async convert(file, format, quality = 0.9) {
    return await this.convertImage(file, {
      outputFormat: format,
      quality: quality
    });
  },

  /**
   * Resize image
   */
  async resize(file, width, height, maintainAspectRatio = true) {
    return await this.convertImage(file, {
      width: width,
      height: height,
      fit: maintainAspectRatio ? 'inside' : 'fill'
    });
  },

  /**
   * Rotate image
   */
  async rotate(file, degrees) {
    return await this.convertImage(file, {
      rotate: degrees
    });
  },

  /**
   * Add text to image
   */
  async addText(file, text, options = {}) {
    requireElectron('addText');
    const inputPath = await writeFileToTemp(file, 'temp_addtext');
    return await window.electronAPI.addTextToImage({
      inputPath,
      text,
      options
    });
  },

  /**
   * Create APNG sequence
   */
  async createApngSequence(files, options = {}) {
    requireElectron('createApngSequence');
    const inputPaths = [];
    for (let i = 0; i < files.length; i++) {
      inputPaths.push(await writeFileToTemp(files[i], `temp_apng_${i}`));
    }
    return await window.electronAPI.createApngSequence({ inputPaths, options });
  },

  /**
   * Convert to AVIF (modern format)
   */
  async convertToAvifModern(files, options = {}) {
    requireElectron('convertToAvifModern');
    const results = [];
    for (const file of files) {
      const inputPath = await writeFileToTemp(file, 'temp_avif');
      const result = await window.electronAPI.convertToAvifModern({ inputPath, options });
      results.push(result);
    }
    return { results };
  },

  /**
   * Convert to JXL format
   */
  async convertToJxl(files, options = {}) {
    requireElectron('convertToJxl');
    const results = [];
    for (const file of files) {
      const inputPath = await writeFileToTemp(file, 'temp_jxl');
      const result = await window.electronAPI.convertToJxl({ inputPath, options });
      results.push(result);
    }
    return { results };
  },

  /**
   * Compare modern formats (AVIF vs WebP vs JXL etc.)
   */
  async compareModernFormats(file, options = {}) {
    requireElectron('compareModernFormats');
    const inputPath = await writeFileToTemp(file, 'temp_compare');
    return await window.electronAPI.compareModernFormats({ inputPath, options });
  },

  /**
   * Get video info — accepts a File OR an absolute path.
   */
  async getVideoInfo(fileOrPath) {
    requireElectron('getVideoInfo');
    if (!fileOrPath) {
      throw new Error('getVideoInfo: a file or path is required');
    }
    const inputPath = await writeFileToTemp(fileOrPath, 'temp_videoinfo');
    return await window.electronAPI.getVideoInfo({ inputPath });
  },

  /**
   * Convert video to GIF (with settings) — accepts File or path.
   */
  async convertVideoToGif(fileOrPath, settings = {}) {
    requireElectron('convertVideoToGif');
    return await this.convertVideo(fileOrPath, { ...settings, outputFormat: 'gif' });
  },

  /**
   * Convert video to GIF (alias)
   */
  async videoToGif(file, options = {}) {
    requireElectron('videoToGif');
    return await this.convertVideo(file, { ...options, outputFormat: 'gif' });
  },

  /**
   * Upload video from URL — not supported in offline desktop app.
   */
  async uploadVideoFromUrl(/* url, options */) {
    throw new Error('Loading videos from a URL requires an internet service and is not available in the offline desktop app. Please drag-drop a local video file instead.');
  },

  /**
   * Split GIF into frames
   */
  async splitGif(file, options = {}) {
    requireElectron('splitGif');
    const arrayBuffer = await file.arrayBuffer();
    const tempFileName = `temp_gif_${Date.now()}.gif`;
    const tempResult = await window.electronAPI.writeFile({
      filePath: tempFileName,
      data: arrayBuffer
    });
    if (!tempResult.success) {
      throw new Error('Failed to save temp file for GIF splitting');
    }
    return await window.electronAPI.splitGif({ inputPath: tempResult.filePath, options });
  },

  /**
   * Split GIF from URL — not supported offline.
   */
  async splitGifFromUrl(/* url, options */) {
    throw new Error('Splitting a GIF from a URL requires an internet service and is not available in the offline desktop app. Please drag-drop a local GIF file instead.');
  },

  /**
   * Split video into segments
   */
  async splitVideo(file, options = {}) {
    requireElectron('splitVideo');
    const arrayBuffer = await file.arrayBuffer();
    const ext = file.name.split('.').pop() || 'mp4';
    const tempFileName = `temp_video_${Date.now()}.${ext}`;
    const tempResult = await window.electronAPI.writeFile({
      filePath: tempFileName,
      data: arrayBuffer
    });
    if (!tempResult.success) {
      throw new Error('Failed to save temp file for video splitting');
    }
    return await window.electronAPI.splitVideo({ inputPath: tempResult.filePath, options });
  },

  /**
   * Split video from URL — not supported offline.
   */
  async splitVideoFromUrl(/* url, options */) {
    throw new Error('Splitting a video from a URL requires an internet service and is not available in the offline desktop app. Please drag-drop a local video file instead.');
  },

  /**
   * Convert to WebP format
   */
  async convertToWebp(files, options = {}) {
    requireElectron('convertToWebp');
    const results = [];
    for (const file of files) {
      const result = await this.convertImage(file, { ...options, outputFormat: 'webp' });
      results.push(result);
    }
    return { results };
  },

  /**
   * Decode WebP format → png/jpeg
   */
  async decodeWebp(files, options = {}) {
    requireElectron('decodeWebp');
    const results = [];
    for (const file of files) {
      const result = await this.convertImage(file, { ...options, outputFormat: options.outputFormat || 'png' });
      results.push(result);
    }
    return { results };
  },

  /**
   * Download file — in desktop mode files are written directly via saveFile.
   */
  async downloadFile(/* endpoint */) {
    throw new Error('downloadFile is not used in the desktop app — use saveFile or copyToDownloads instead');
  },

  /**
   * Save file to disk (Electron temp folder by default)
   */
  async saveFile(data, filename) {
    requireElectron('saveFile');
    return await window.electronAPI.writeFile({ filePath: filename, data });
  },

  /**
   * Copy file (Electron only)
   */
  async copyFile(sourcePath, destPath) {
    requireElectron('copyFile');
    return await window.electronAPI.copyFile({ sourcePath, destPath });
  },

  /**
   * Describe image — currently a stub. Could be re-enabled if a local
   * AI model is bundled in a future version.
   */
  async describeImage(/* imageName */) {
    throw new Error('Image description (AI) is not bundled with this offline desktop app.');
  },

  /**
   * Get app info from main process
   */
  async getAppInfo() {
    requireElectron('getAppInfo');
    return await window.electronAPI.getAppInfo();
  },

  /**
   * Convert text file → Markdown
   */
  async convertTextToMd(file, options = {}) {
    requireElectron('convertTextToMd');
    const inputPath = await writeFileToTemp(file, 'temp_txt');
    return await window.electronAPI.textToMarkdown({ inputPath, options });
  },

  /**
   * Convert PDF(s) → Markdown
   */
  async convertPdfToMarkdown(files, options = {}) {
    requireElectron('convertPdfToMarkdown');
    const list = Array.isArray(files) ? files : [files];
    const inputPaths = [];
    for (let i = 0; i < list.length; i++) {
      inputPaths.push(await writeFileToTemp(list[i], `temp_pdf_${i}`));
    }
    return await window.electronAPI.pdfToMarkdown({ inputPaths, options });
  },

  /**
   * Convert Markdown file → PDF (saved to disk)
   */
  async convertMarkdownToPdf(file, options = {}) {
    requireElectron('convertMarkdownToPdf');
    const inputPath = await writeFileToTemp(file, 'temp_md');
    return await window.electronAPI.markdownToPdf({ inputPath, options });
  },

  /**
   * Convert images → single PDF (via main process)
   */
  async convertImagesToPdf(files, options = {}) {
    requireElectron('convertImagesToPdf');
    const inputPaths = [];
    for (let i = 0; i < files.length; i++) {
      inputPaths.push(await writeFileToTemp(files[i], `temp_imgpdf_${i}`));
    }
    return await window.electronAPI.imagesToPdf({ inputPaths, options });
  },

  /**
   * Extract frames from a video file
   */
  async extractVideoFrames(file, options = {}) {
    requireElectron('extractVideoFrames');
    const inputPath = await writeFileToTemp(file, 'temp_vidframes');
    return await window.electronAPI.extractVideoFrames({ inputPath, options });
  },

  /**
   * Extract video frames from URL — not supported offline.
   */
  async extractVideoFramesFromUrl(/* url, options */) {
    throw new Error('Extracting video frames from a URL requires an internet service and is not available in the offline desktop app. Please drag-drop a local video file instead.');
  }
};

// Standalone export used directly by PdfToMarkdownConverter.jsx
export const convertPdfToMarkdown = (files, options) => api.convertPdfToMarkdown(files, options);

// Legacy alias
export const realAPI = api;

/**
 * Resolve URL for display purposes (images, videos, etc.) inside Electron.
 * In desktop mode every path is converted to a file:// URL.
 */
export const resolveDisplayUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('data:')) return path;
  if (path.startsWith('file://')) return path;
  if (path.startsWith('blob:')) return path;
  if (path.startsWith('http')) return path;

  if (path.includes('\\') || path.includes('/')) {
    const normalizedPath = path.replace(/\\/g, '/');
    return normalizedPath.startsWith('/') ? `file://${normalizedPath}` : `file:///${normalizedPath}`;
  }

  return '';
};

/**
 * Legacy helper: in the desktop app there are no remote URLs, so we return
 * the path unchanged or an empty string.
 */
export const getApiUrl = (endpoint) => {
  console.warn('getApiUrl called in desktop app — desktop mode does not use remote URLs:', endpoint);
  return '';
};

// Convenience individual exports — bound to `api` so `this.convertImage(...)`
// inside arrow-extracted methods still works when called standalone.
const _bind = (name) => api[name].bind(api);

export const createGifFromImages = _bind('createGifFromImages');
export const createGifFromVideo = _bind('createGifFromVideo');
export const convertImage = _bind('convertImage');
export const convertVideo = _bind('convertVideo');
export const convert = _bind('convert');
export const resize = _bind('resize');
export const rotate = _bind('rotate');
export const addText = _bind('addText');
export const createApngSequence = _bind('createApngSequence');
export const convertToAvifModern = _bind('convertToAvifModern');
export const convertToJxl = _bind('convertToJxl');
export const compareModernFormats = _bind('compareModernFormats');
export const getVideoInfo = _bind('getVideoInfo');
export const convertVideoToGif = _bind('convertVideoToGif');
export const videoToGif = _bind('videoToGif');
export const uploadVideoFromUrl = _bind('uploadVideoFromUrl');
export const splitGif = _bind('splitGif');
export const splitGifFromUrl = _bind('splitGifFromUrl');
export const splitVideo = _bind('splitVideo');
export const splitVideoFromUrl = _bind('splitVideoFromUrl');
export const convertToWebp = _bind('convertToWebp');
export const decodeWebp = _bind('decodeWebp');
export const describeImage = _bind('describeImage');
export const openFileDialog = _bind('openFileDialog');
export const downloadFile = _bind('downloadFile');
export const saveFile = _bind('saveFile');
export const getAppInfo = _bind('getAppInfo');
export const convertTextToMd = _bind('convertTextToMd');
export const convertMarkdownToPdf = _bind('convertMarkdownToPdf');
export const convertImagesToPdf = _bind('convertImagesToPdf');
export const extractVideoFrames = _bind('extractVideoFrames');
export const extractVideoFramesFromUrl = _bind('extractVideoFramesFromUrl');

export default api;