/**
 * DESKTOP DOWNLOAD UTILITIES
 * Proper file downloading for Electron desktop app with progress tracking
 * NO browser-style downloads that open files
 */

import { api } from './unifiedAPI.js';

// Download status tracker
let downloadCounter = 0;
const activeDownloads = new Map();

/**
 * Create a unique download ID
 */
function createDownloadId() {
  return `download_${++downloadCounter}_${Date.now()}`;
}

/**
 * Show download progress notification
 * @param {string} downloadId - Unique download identifier
 * @param {string} filename - File being downloaded
 * @param {string} status - 'starting' | 'progress' | 'complete' | 'error'
 * @param {Object} extra - Additional info like progress percentage, filePath, etc.
 */
function showDownloadStatus(downloadId, filename, status, extra = {}) {
  const downloadInfo = {
    id: downloadId,
    filename,
    status,
    timestamp: new Date().toISOString(),
    ...extra
  };

  activeDownloads.set(downloadId, downloadInfo);

  // Show appropriate notification based on status
  switch (status) {
    case 'starting':
      showToast(`📥 Starting download: ${filename}`, 'info', 3000);
      break;
    
    case 'progress':
      if (extra.progress !== undefined) {
        showToast(`📥 Downloading ${filename}: ${extra.progress}%`, 'info', 1000);
      }
      break;
    
    case 'complete':
      showToast(
        `✅ Downloaded: ${filename}`,
        'success',
        0, // Permanent until user clicks
        {
          action: 'Open Folder',
          callback: () => openDownloadLocation(extra.filePath)
        }
      );
      break;
    
    case 'error':
      showToast(`❌ Download failed: ${filename} - ${extra.error}`, 'error', 5000);
      break;
  }

  // Emit custom event for download status changes
  window.dispatchEvent(new CustomEvent('downloadStatusChange', {
    detail: downloadInfo
  }));
}

/**
 * Show toast notification with action button
 * @param {string} message - Notification message
 * @param {string} type - 'success' | 'error' | 'info' | 'warning'
 * @param {number} duration - Auto-hide duration in ms (0 = permanent)
 * @param {Object} action - Optional action button {action: 'text', callback: function}
 */
function showToast(message, type = 'info', duration = 3000, action = null) {
  // Try to use NotificationService if available
  if (window.NotificationService) {
    window.NotificationService.show(message, type, duration);
    return;
  }

  // Fallback: Create custom toast
  const toast = document.createElement('div');
  toast.className = `download-toast toast-${type}`;
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${getToastColor(type)};
    color: white;
    padding: 12px 16px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    z-index: 10000;
    max-width: 400px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    line-height: 1.4;
    animation: slideInFromRight 0.3s ease-out;
  `;

  // Add close button
  const closeBtn = document.createElement('button');
  closeBtn.innerHTML = '×';
  closeBtn.style.cssText = `
    background: none;
    border: none;
    color: white;
    font-size: 18px;
    float: right;
    margin-left: 10px;
    cursor: pointer;
    opacity: 0.7;
    padding: 0;
    line-height: 1;
  `;
  closeBtn.onclick = () => document.body.removeChild(toast);

  // Create message container
  const messageDiv = document.createElement('div');
  messageDiv.textContent = message;
  messageDiv.style.paddingRight = action ? '0' : '20px';

  toast.appendChild(messageDiv);
  toast.appendChild(closeBtn);

  // Add action button if provided
  if (action) {
    const actionBtn = document.createElement('button');
    actionBtn.textContent = action.action;
    actionBtn.style.cssText = `
      background: rgba(255,255,255,0.2);
      border: 1px solid rgba(255,255,255,0.3);
      color: white;
      padding: 6px 12px;
      border-radius: 4px;
      margin-top: 8px;
      margin-right: 8px;
      cursor: pointer;
      font-size: 12px;
      display: inline-block;
    `;
    actionBtn.onclick = () => {
      action.callback();
      document.body.removeChild(toast);
    };
    toast.appendChild(actionBtn);
  }

  // Add CSS for animation
  if (!document.querySelector('#toast-styles')) {
    const style = document.createElement('style');
    style.id = 'toast-styles';
    style.textContent = `
      @keyframes slideInFromRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      .download-toast:hover { opacity: 0.9; }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(toast);

  // Auto-remove after duration (if not permanent)
  if (duration > 0) {
    setTimeout(() => {
      if (document.body.contains(toast)) {
        document.body.removeChild(toast);
      }
    }, duration);
  }
}

/**
 * Get toast background color based on type
 */
function getToastColor(type) {
  switch (type) {
    case 'success': return '#10b981';
    case 'error': return '#ef4444';
    case 'warning': return '#f59e0b';
    case 'info': 
    default: return '#3b82f6';
  }
}

/**
 * Open the download location in system file explorer
 * @param {string} filePath - Path to the downloaded file
 */
async function openDownloadLocation(filePath) {
  try {
    if (!window.electronAPI) {
      throw new Error('Electron API not available');
    }

    // Try to show the file in folder (highlights the file)
    if (window.electronAPI.showItemInFolder) {
      await window.electronAPI.showItemInFolder(filePath);
    } else if (window.electronAPI.openPath) {
      // Fallback: open the parent directory
      const path = require('path');
      const directory = path.dirname(filePath);
      await window.electronAPI.openPath(directory);
    } else {
      console.warn('No method available to open download location');
    }
  } catch (error) {
    console.error('Failed to open download location:', error);
    showToast('Could not open download folder', 'warning', 3000);
  }
}

/**
 * Enhanced download function with comprehensive status tracking
 * Shows download progress and provides option to open file location when complete
 * @param {string|ArrayBuffer|Buffer|Blob} data - The file data
 * @param {string} filename - Suggested filename
 * @param {Array} filters - File type filters for the save dialog
 * @returns {Promise<{success: boolean, filePath?: string, message: string}>}
 */
export async function downloadFileWithStatus(data, filename, filters = []) {
  const downloadId = createDownloadId();
  
  try {
    // Show starting status
    showDownloadStatus(downloadId, filename, 'starting');
    
    // Ensure we're in Electron environment
    if (!window.electronAPI) {
      throw new Error('❌ Download requires the desktop app');
    }

    // Show downloading status
    showDownloadStatus(downloadId, filename, 'downloading');

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
      showDownloadStatus(downloadId, filename, 'error', { error: 'Download cancelled by user' });
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

    // Show success status with file location
    showDownloadStatus(downloadId, filename, 'complete', { filePath: result.filePath });

    return {
      success: true,
      filePath: result.filePath,
      message: `File saved successfully to ${result.filePath}`
    };

  } catch (error) {
    console.error('❌ Download failed:', error);
    showDownloadStatus(downloadId, filename, 'error', { error: error.message });
    return {
      success: false,
      message: `Download failed: ${error.message}`
    };
  }
}

/**
 * Direct download to Downloads folder (NEW)
 * Downloads directly to Downloads folder without user interaction
 * @param {string|ArrayBuffer|Buffer|Blob} data - The file data
 * @param {string} filename - Filename
 * @returns {Promise<{success: boolean, filePath?: string, message: string}>}
 */
export async function downloadFileDirectly(data, filename) {
  const downloadId = createDownloadId();
  
  try {
    // Ensure we're in Electron environment
    if (!window.electronAPI) {
      throw new Error('❌ Download requires the desktop app');
    }

    // Show starting status
    showDownloadStatus(downloadId, filename, 'starting');

    // Convert different data types to appropriate format
    let processedData;
    
    if (data instanceof ArrayBuffer) {
      processedData = data;
    } else if (data instanceof Blob) {
      processedData = await data.arrayBuffer();
    } else if (typeof data === 'string') {
      processedData = data; // Let the main process handle string data
    } else if (Buffer.isBuffer(data)) {
      processedData = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
    } else {
      throw new Error('Unsupported data type for download');
    }

    // Show downloading status
    showDownloadStatus(downloadId, filename, 'downloading');

    // Download directly to Downloads folder
    const result = await window.electronAPI.downloadDirect({
      data: processedData,
      filename: filename,
      showProgress: true
    });

    if (result.success) {
      // Show success status with file location
      showDownloadStatus(downloadId, filename, 'complete', { 
        filePath: result.filePath,
        filename: result.filename 
      });
    } else {
      showDownloadStatus(downloadId, filename, 'error', { error: result.message });
    }

    return result;

  } catch (error) {
    console.error('❌ Direct download failed:', error);
    showDownloadStatus(downloadId, filename, 'error', { error: error.message });
    return {
      success: false,
      message: `Download failed: ${error.message}`
    };
  }
}

/**
 * Copy file directly to Downloads folder (NEW)
 * Copies an existing file to Downloads folder without user interaction
 * @param {string} sourcePath - Path to source file
 * @param {string} filename - Filename for downloaded file
 * @returns {Promise<{success: boolean, filePath?: string, message: string}>}
 */
export async function downloadFileFromPathDirectly(sourcePath, filename) {
  const downloadId = createDownloadId();
  
  try {
    // Ensure we're in Electron environment
    if (!window.electronAPI) {
      throw new Error('❌ Download requires the desktop app');
    }

    // Show starting status
    showDownloadStatus(downloadId, filename, 'starting');
    showDownloadStatus(downloadId, filename, 'downloading');

    // Copy to Downloads folder
    const result = await window.electronAPI.copyToDownloads({
      sourcePath: sourcePath,
      filename: filename,
      showProgress: true
    });

    if (result.success) {
      // Show success status with file location
      showDownloadStatus(downloadId, filename, 'complete', { 
        filePath: result.filePath,
        filename: result.filename 
      });
    } else {
      showDownloadStatus(downloadId, filename, 'error', { error: result.message });
    }

    return result;

  } catch (error) {
    console.error('❌ Direct download from path failed:', error);
    showDownloadStatus(downloadId, filename, 'error', { error: error.message });
    return {
      success: false,
      message: `Download failed: ${error.message}`
    };
  }
}

/**
 * Enhanced download from file path with status tracking
 * @param {string} filePath - Path to the source file
 * @param {string} suggestedName - Suggested filename for save dialog
 * @param {Array} filters - File type filters
 * @returns {Promise<{success: boolean, filePath?: string, message: string}>}
 */
export async function downloadFileFromPathWithStatus(filePath, suggestedName, filters = []) {
  const downloadId = createDownloadId();
  
  try {
    // Show starting status
    showDownloadStatus(downloadId, suggestedName, 'starting');
    
    if (!window.electronAPI) {
      throw new Error('❌ Download requires the desktop app');
    }

    // Show downloading status
    showDownloadStatus(downloadId, suggestedName, 'downloading');

    // Show save dialog
    const result = await window.electronAPI.saveDialog({
      title: 'Save File As',
      defaultPath: suggestedName,
      filters: filters.length > 0 ? filters : [{ name: 'All Files', extensions: ['*'] }]
    });

    if (result.canceled) {
      showDownloadStatus(downloadId, suggestedName, 'error', { error: 'Download cancelled by user' });
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

    // Show success status with file location
    showDownloadStatus(downloadId, suggestedName, 'complete', { filePath: result.filePath });

    return {
      success: true,
      filePath: result.filePath,
      message: `File saved successfully to ${result.filePath}`
    };

  } catch (error) {
    console.error('❌ Download from path failed:', error);
    showDownloadStatus(downloadId, suggestedName, 'error', { error: error.message });
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

// Backward compatibility exports
export const downloadFile = downloadFileWithStatus;
export const downloadFileFromPath = downloadFileFromPathWithStatus;

export default {
  downloadFile,
  downloadFileWithStatus,
  downloadFileFromPath,
  downloadFileFromPathWithStatus,
  downloadFromBlobUrl,
  showDownloadNotification,
  legacyBrowserDownload
};