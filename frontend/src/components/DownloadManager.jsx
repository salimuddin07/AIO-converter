/**
 * DOWNLOAD MANAGER COMPONENT
 * Provides enhanced download functionality with status tracking and file location opening
 * Universal component for all tools in the AIO Converter
 */

import React, { useState, useCallback } from 'react';
import { 
  downloadFileWithStatus, 
  downloadFileFromPathWithStatus,
  downloadFileDirectly,
  downloadFileFromPathDirectly
} from '../utils/downloadUtils.js';

/**
 * Enhanced Download Button Component
 * @param {Object} props
 * @param {string|ArrayBuffer|Buffer|Blob} props.data - File data or file path
 * @param {string} props.filename - Suggested filename
 * @param {Array} props.filters - File type filters for save dialog
 * @param {string} props.buttonText - Custom button text (default: "📥 Download")
 * @param {string} props.className - Additional CSS classes
 * @param {Object} props.style - Inline styles
 * @param {boolean} props.disabled - Whether button is disabled
 * @param {boolean} props.useDirectDownload - Whether to download directly to Downloads folder (default: true)
 * @param {Function} props.onDownloadStart - Callback when download starts
 * @param {Function} props.onDownloadComplete - Callback when download completes
 * @param {Function} props.onDownloadError - Callback when download fails
 */
export function DownloadButton({ 
  data, 
  filename, 
  filters = [],
  buttonText = "📥 Download",
  className = "",
  style = {},
  disabled = false,
  useDirectDownload = true,
  onDownloadStart = null,
  onDownloadComplete = null,
  onDownloadError = null
}) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = useCallback(async () => {
    if (!data || !filename || downloading) {
      return;
    }

    setDownloading(true);
    
    try {
      // Trigger start callback
      if (onDownloadStart) {
        onDownloadStart(filename);
      }

      let result;

      // Determine if data is a file path or actual file data
      if (typeof data === 'string' && (data.startsWith('file://') || data.startsWith('/') || data.includes('\\'))) {
        // It's a file path
        const filePath = data.startsWith('file://') ? data.replace('file://', '') : data;
        
        if (useDirectDownload) {
          result = await downloadFileFromPathDirectly(filePath, filename);
        } else {
          result = await downloadFileFromPathWithStatus(filePath, filename, filters);
        }
      } else {
        // It's file data
        if (useDirectDownload) {
          result = await downloadFileDirectly(data, filename);
        } else {
          result = await downloadFileWithStatus(data, filename, filters);
        }
      }

      if (result.success) {
        // Trigger success callback
        if (onDownloadComplete) {
          onDownloadComplete(result);
        }
      } else {
        // Trigger error callback
        if (onDownloadError) {
          onDownloadError(result);
        }
      }

    } catch (error) {
      console.error('Download error:', error);
      
      // Trigger error callback
      if (onDownloadError) {
        onDownloadError({ success: false, message: error.message });
      }
    } finally {
      setDownloading(false);
    }
  }, [data, filename, filters, downloading, useDirectDownload, onDownloadStart, onDownloadComplete, onDownloadError]);

  return (
    <button
      onClick={handleDownload}
      disabled={disabled || downloading || !data || !filename}
      className={`download-button ${downloading ? 'downloading' : ''} ${className}`}
      style={{
        padding: '8px 16px',
        backgroundColor: downloading ? '#6c757d' : '#28a745',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: downloading || disabled ? 'not-allowed' : 'pointer',
        fontSize: '14px',
        fontWeight: '500',
        transition: 'all 0.3s ease',
        opacity: downloading || disabled ? 0.6 : 1,
        ...style
      }}
      title={downloading ? 'Downloading...' : 'Download file'}
    >
      {downloading ? '⏳ Downloading...' : buttonText}
    </button>
  );
}

/**
 * Enhanced Download Link Component (for quick downloads)
 * @param {Object} props - Same as DownloadButton but renders as a link
 */
export function DownloadLink({ 
  data, 
  filename, 
  filters = [],
  buttonText = "Quick Download",
  className = "",
  style = {},
  disabled = false,
  onDownloadStart = null,
  onDownloadComplete = null,
  onDownloadError = null
}) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = useCallback(async (e) => {
    e.preventDefault();
    
    if (!data || !filename || downloading) {
      return;
    }

    setDownloading(true);
    
    try {
      // Trigger start callback
      if (onDownloadStart) {
        onDownloadStart(filename);
      }

      let result;

      // Determine if data is a file path or actual file data
      if (typeof data === 'string' && (data.startsWith('file://') || data.startsWith('/') || data.includes('\\'))) {
        // It's a file path
        const filePath = data.startsWith('file://') ? data.replace('file://', '') : data;
        result = await downloadFileFromPathWithStatus(filePath, filename, filters);
      } else {
        // It's file data
        result = await downloadFileWithStatus(data, filename, filters);
      }

      if (result.success) {
        // Trigger success callback
        if (onDownloadComplete) {
          onDownloadComplete(result);
        }
      } else {
        // Trigger error callback
        if (onDownloadError) {
          onDownloadError(result);
        }
      }

    } catch (error) {
      console.error('Download error:', error);
      
      // Trigger error callback
      if (onDownloadError) {
        onDownloadError({ success: false, message: error.message });
      }
    } finally {
      setDownloading(false);
    }
  }, [data, filename, filters, downloading, onDownloadStart, onDownloadComplete, onDownloadError]);

  return (
    <a
      href="#"
      onClick={handleDownload}
      className={`download-link ${downloading ? 'downloading' : ''} ${className}`}
      style={{
        color: downloading ? '#6c757d' : '#007bff',
        textDecoration: downloading ? 'none' : 'underline',
        cursor: downloading || disabled ? 'not-allowed' : 'pointer',
        fontSize: '12px',
        opacity: downloading || disabled ? 0.6 : 1,
        pointerEvents: downloading || disabled ? 'none' : 'auto',
        ...style
      }}
      title={downloading ? 'Downloading...' : 'Download file'}
    >
      {downloading ? '⏳ Downloading...' : buttonText}
    </a>
  );
}

/**
 * Main Download Manager Hook
 * Provides state management for downloads across components
 */
export function useDownloadManager() {
  const [activeDownloads, setActiveDownloads] = useState(new Map());

  const startDownload = useCallback((downloadId, filename) => {
    setActiveDownloads(prev => {
      const newMap = new Map(prev);
      newMap.set(downloadId, {
        id: downloadId,
        filename,
        status: 'downloading',
        timestamp: new Date().toISOString()
      });
      return newMap;
    });
  }, []);

  const completeDownload = useCallback((downloadId, result) => {
    setActiveDownloads(prev => {
      const newMap = new Map(prev);
      const download = newMap.get(downloadId);
      if (download) {
        newMap.set(downloadId, {
          ...download,
          status: 'completed',
          result,
          completedAt: new Date().toISOString()
        });
      }
      return newMap;
    });
  }, []);

  const errorDownload = useCallback((downloadId, error) => {
    setActiveDownloads(prev => {
      const newMap = new Map(prev);
      const download = newMap.get(downloadId);
      if (download) {
        newMap.set(downloadId, {
          ...download,
          status: 'error',
          error,
          errorAt: new Date().toISOString()
        });
      }
      return newMap;
    });
  }, []);

  const removeDownload = useCallback((downloadId) => {
    setActiveDownloads(prev => {
      const newMap = new Map(prev);
      newMap.delete(downloadId);
      return newMap;
    });
  }, []);

  return {
    activeDownloads,
    startDownload,
    completeDownload,
    errorDownload,
    removeDownload
  };
}

/**
 * Download Button with Save Dialog (for when user wants to choose location)
 * Same as DownloadButton but always uses save dialog
 */
export function DownloadButtonWithDialog(props) {
  return <DownloadButton {...props} useDirectDownload={false} />;
}

export default DownloadButton;