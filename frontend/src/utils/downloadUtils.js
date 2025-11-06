/**
 * DESKTOP DOWNLOAD UTILITIES
 * Proper file downloading for Electron desktop app
 * NO browser-style downloads that open files
 */

import { api } from './unifiedAPI.js';

/**
 * Download a file using Electron's native save dialog
 * This will prompt the user to choose where to save the file
 * @param {string|ArrayBuffer|Buffer|Blob} data - The file data
 * @param {string} filename - Suggested filename
 * @param {Array} filters - File type filters for the save dialog
 * @returns {Promise<{success: boolean, filePath?: string, message: string}>}
 */
export async function downloadFile(data, filename, filters = []) {
  try {
    // Ensure we're in Electron environment
    if (!window.electronAPI) {
      throw new Error('❌ Download requires the desktop app');
    }

    // Convert different data types to ArrayBuffer
    let arrayBuffer;
    
    if (data instanceof ArrayBuffer) {
      arrayBuffer = data;
    } else if (data instanceof Blob) {
      arrayBuffer = await data.arrayBuffer();
    } else if (typeof data === 'string') {
      // Handle base64 or regular strings
      if (data.startsWith('data:')) {
        // Data URL - extract the base64 part
        const base64 = data.split(',')[1];
        const binaryString = atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        arrayBuffer = bytes.buffer;
      } else {
        // Regular string - convert to UTF-8
        arrayBuffer = new TextEncoder().encode(data).buffer;
      }
    } else if (Buffer.isBuffer(data)) {
      arrayBuffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
    } else {
      throw new Error('Unsupported data type for download');
    }

    // Set up file filters based on filename if not provided
    if (!filters || filters.length === 0) {
      const ext = filename.split('.').pop()?.toLowerCase();
      switch (ext) {
        case 'gif':
          filters = [
            { name: 'GIF Images', extensions: ['gif'] },
            { name: 'All Files', extensions: ['*'] }
          ];
          break;
        case 'webp':
          filters = [
            { name: 'WebP Images', extensions: ['webp'] },
            { name: 'All Files', extensions: ['*'] }
          ];
          break;
        case 'png':
        case 'jpg':
        case 'jpeg':
          filters = [
            { name: 'Image Files', extensions: ['png', 'jpg', 'jpeg', 'webp'] },
            { name: 'All Files', extensions: ['*'] }
          ];
          break;
        case 'mp4':
        case 'webm':
        case 'avi':
        case 'mov':
          filters = [
            { name: 'Video Files', extensions: ['mp4', 'webm', 'avi', 'mov', 'mkv'] },
            { name: 'All Files', extensions: ['*'] }
          ];
          break;
        case 'pdf':
          filters = [
            { name: 'PDF Files', extensions: ['pdf'] },
            { name: 'All Files', extensions: ['*'] }
          ];
          break;
        case 'md':
          filters = [
            { name: 'Markdown Files', extensions: ['md'] },
            { name: 'All Files', extensions: ['*'] }
          ];
          break;
        case 'zip':
          filters = [
            { name: 'ZIP Archives', extensions: ['zip'] },
            { name: 'All Files', extensions: ['*'] }
          ];
          break;
        default:
          filters = [{ name: 'All Files', extensions: ['*'] }];
      }
    }

    // Show save dialog
    const result = await window.electronAPI.saveDialog({
      title: 'Save File As',
      defaultPath: filename,
      filters: filters
    });

    if (result.canceled) {
      return {
        success: false,
        message: 'Download cancelled by user'
      };
    }

    // Write the file to the selected location
    await window.electronAPI.writeFile({
      filePath: result.filePath,
      data: arrayBuffer
    });

    return {
      success: true,
      filePath: result.filePath,
      message: `File saved successfully to ${result.filePath}`
    };

  } catch (error) {
    console.error('❌ Download failed:', error);
    return {
      success: false,
      message: `Download failed: ${error.message}`
    };
  }
}

/**
 * Download a file from a URL/path using Electron's file operations
 * @param {string} filePath - Path to the source file
 * @param {string} suggestedName - Suggested filename for save dialog
 * @param {Array} filters - File type filters
 * @returns {Promise<{success: boolean, filePath?: string, message: string}>}
 */
export async function downloadFileFromPath(filePath, suggestedName, filters = []) {
  try {
    if (!window.electronAPI) {
      throw new Error('❌ Download requires the desktop app');
    }

    // Show save dialog
    const result = await window.electronAPI.saveDialog({
      title: 'Save File As',
      defaultPath: suggestedName,
      filters: filters.length > 0 ? filters : [{ name: 'All Files', extensions: ['*'] }]
    });

    if (result.canceled) {
      return {
        success: false,
        message: 'Download cancelled by user'
      };
    }

    // Copy the file
    await window.electronAPI.copyFile({
      sourcePath: filePath,
      destPath: result.filePath
    });

    return {
      success: true,
      filePath: result.filePath,
      message: `File saved successfully to ${result.filePath}`
    };

  } catch (error) {
    console.error('❌ Download from path failed:', error);
    return {
      success: false,
      message: `Download failed: ${error.message}`
    };
  }
}

/**
 * Quick download from a blob URL (creates temp file first)
 * @param {string} blobUrl - Blob URL to download
 * @param {string} filename - Suggested filename
 * @param {Array} filters - File type filters
 */
export async function downloadFromBlobUrl(blobUrl, filename, filters = []) {
  try {
    // Fetch the blob data
    const response = await fetch(blobUrl);
    const blob = await response.blob();
    
    // Download using the main download function
    return await downloadFile(blob, filename, filters);
    
  } catch (error) {
    console.error('❌ Download from blob URL failed:', error);
    return {
      success: false,
      message: `Download failed: ${error.message}`
    };
  }
}

/**
 * Show a success/error notification for download result
 * @param {Object} result - Download result object
 */
export function showDownloadNotification(result) {
  if (result.success) {
    // Success notification
    console.log('✅ Download successful:', result.message);
    
    // Try to show toast notification if NotificationService is available
    if (window.NotificationService) {
      window.NotificationService.toast('File downloaded successfully!', 'success');
    } else {
      alert('File downloaded successfully!');
    }
  } else {
    // Error notification
    console.error('❌ Download failed:', result.message);
    
    if (window.NotificationService) {
      window.NotificationService.error(`Download failed: ${result.message}`);
    } else {
      alert(`Download failed: ${result.message}`);
    }
  }
}

/**
 * Legacy browser-style download (DEPRECATED - DO NOT USE)
 * This is only kept for reference - it causes files to open instead of download
 */
export function legacyBrowserDownload(url, filename) {
  console.warn('⚠️ Using deprecated browser download - files will open instead of saving');
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export default {
  downloadFile,
  downloadFileFromPath,
  downloadFromBlobUrl,
  showDownloadNotification,
  legacyBrowserDownload
};