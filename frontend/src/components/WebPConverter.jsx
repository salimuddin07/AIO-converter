import React, { useState, useRef, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { NotificationService } from '../utils/NotificationService.js';
import { realAPI, downloadFile } from '../utils/apiConfig';
import '../aio-convert-style.css';

const WebPConverter = () => {
  const [files, setFiles] = useState([]);
  const [conversionSettings, setConversionSettings] = useState({
    quality: 85,
    lossless: false,
    method: 4,
    preset: 'default',
    alphaQuality: 100,
    autoFilter: true,
    sharpness: 0,
    filterStrength: 60,
    targetFormat: 'webp',
    downloadAsZip: false
  });
  const [conversionResults, setConversionResults] = useState(null);
  const [isConverting, setIsConverting] = useState(false);
  const [conversionProgress, setConversionProgress] = useState(0);
  const [activeTab, setActiveTab] = useState('convert-to-webp');
  
  const fileInputRef = useRef(null);

  // Dropzone configuration
  const onDrop = useCallback((acceptedFiles) => {
    const validFiles = acceptedFiles.filter(file => {
      if (activeTab === 'convert-to-webp') {
        return file.type.startsWith('image/') && file.type !== 'image/webp';
      } else {
        return file.type === 'image/webp';
      }
    });

    if (validFiles.length !== acceptedFiles.length) {
      const invalidCount = acceptedFiles.length - validFiles.length;
      NotificationService.warning(
        `${invalidCount} file(s) were rejected. Only ${activeTab === 'convert-to-webp' ? 'image' : 'WebP'} files are allowed.`
      );
    }

    const newFiles = validFiles.map(file => ({
      file,
      id: Date.now() + Math.random(),
      name: file.name,
      size: file.size,
      type: file.type,
      preview: activeTab === 'convert-to-webp' ? URL.createObjectURL(file) : null
    }));

    setFiles(prev => [...prev, ...newFiles]);
  }, [activeTab]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: activeTab === 'convert-to-webp' 
      ? { 'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.tiff'] }
      : { 'image/webp': ['.webp'] },
    multiple: true,
    maxSize: 50 * 1024 * 1024 // 50GB
  });

  // File management
  const removeFile = (fileId) => {
    setFiles(prev => {
      const updated = prev.filter(f => f.id !== fileId);
      // Revoke object URL to prevent memory leaks
      const fileToRemove = prev.find(f => f.id === fileId);
      if (fileToRemove?.preview) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      return updated;
    });
  };

  const clearAllFiles = () => {
    files.forEach(file => {
      if (file.preview) {
        URL.revokeObjectURL(file.preview);
      }
    });
    setFiles([]);
    setConversionResults(null);
  };

  // Settings handlers
  const handleSettingChange = (key, value) => {
    setConversionSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Conversion functions
  const convertFiles = async () => {
    if (files.length === 0) {
      NotificationService.error('Please select files to convert');
      return;
    }

    setIsConverting(true);
    setConversionProgress(0);

    try {
      const fileObjects = files.map(f => f.file);
      let result;
      
      if (activeTab === 'convert-to-webp') {
        result = await realAPI.convertToWebp(fileObjects, conversionSettings);
      } else {
        result = await realAPI.decodeWebp(fileObjects, conversionSettings);
      }

      if (result.success) {
        setConversionResults(result);
        NotificationService.success(
          `Successfully converted ${result.successful || 1} file(s)!`
        );
      } else {
        throw new Error(result.message || 'Conversion failed');
      }

    } catch (error) {
      console.error('Conversion error:', error);
      NotificationService.error(`Conversion failed: ${error.message}`);
    } finally {
      setIsConverting(false);
      setConversionProgress(100);
    }
  };

  const downloadFile = (downloadUrl, filename) => {
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadAllAsZip = async () => {
    if (!conversionResults?.zipDownload) {
      // Create ZIP on demand
      const fileObjects = files.map(f => f.file);
      const zipSettings = { ...conversionSettings, downloadAsZip: 'true' };

      try {
        let result;
        if (activeTab === 'convert-to-webp') {
          result = await realAPI.convertToWebp(fileObjects, zipSettings);
        } else {
          result = await realAPI.decodeWebp(fileObjects, zipSettings);
        }
        
        if (result.success && result.zipDownload) {
          downloadFile(result.zipDownload.downloadUrl, result.zipDownload.filename);
        }
      } catch (error) {
        NotificationService.error('ZIP download failed');
      }
    } else {
      downloadFile(conversionResults.zipDownload.downloadUrl, conversionResults.zipDownload.filename);
    }
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="webp-converter">
      <div className="converter-header">
        <h2>WebP Converter</h2>
        <p>Convert images to WebP format or decode WebP files to other formats</p>
      </div>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button 
          className={`tab-button ${activeTab === 'convert-to-webp' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('convert-to-webp');
            clearAllFiles();
          }}
        >
          Convert to WebP
        </button>
        <button 
          className={`tab-button ${activeTab === 'convert-from-webp' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('convert-from-webp');
            clearAllFiles();
          }}
        >
          Convert from WebP
        </button>
      </div>

      {/* File Upload Area */}
      <div 
        {...getRootProps()} 
        className={`dropzone ${isDragActive ? 'drag-active' : ''}`}
      >
        <input {...getInputProps()} ref={fileInputRef} />
        <div className="dropzone-content">
          <div className="upload-icon">📁</div>
          <p>
            {isDragActive 
              ? `Drop ${activeTab === 'convert-to-webp' ? 'image' : 'WebP'} files here...`
              : `Drag & drop ${activeTab === 'convert-to-webp' ? 'image' : 'WebP'} files here, or click to select`
            }
          </p>
          <p className="file-info">
            Supported: {activeTab === 'convert-to-webp' 
              ? 'JPG, PNG, GIF, BMP, TIFF' 
              : 'WebP files only'
            } • Max 50GB per file
          </p>
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="file-list">
          <div className="file-list-header">
            <h3>Selected Files ({files.length})</h3>
            <button onClick={clearAllFiles} className="clear-btn">
              Clear All
            </button>
          </div>
          
          <div className="files">
            {files.map(fileObj => (
              <div key={fileObj.id} className="file-item">
                {fileObj.preview && (
                  <img 
                    src={fileObj.preview} 
                    alt={fileObj.name}
                    className="file-preview"
                  />
                )}
                <div className="file-info">
                  <div className="file-name">{fileObj.name}</div>
                  <div className="file-size">{formatFileSize(fileObj.size)}</div>
                </div>
                <button 
                  onClick={() => removeFile(fileObj.id)}
                  className="remove-btn"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Conversion Settings */}
      {files.length > 0 && (
        <div className="conversion-settings">
          <h3>Conversion Settings</h3>
          
          {activeTab === 'convert-to-webp' ? (
            <div className="settings-grid">
              <div className="setting-group">
                <label>Quality: {conversionSettings.quality}%</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={conversionSettings.quality}
                  onChange={(e) => handleSettingChange('quality', parseInt(e.target.value))}
                />
              </div>

              <div className="setting-group">
                <label>Compression Method: {conversionSettings.method}</label>
                <input
                  type="range"
                  min="0"
                  max="6"
                  value={conversionSettings.method}
                  onChange={(e) => handleSettingChange('method', parseInt(e.target.value))}
                />
                <small>Higher = better compression, slower</small>
              </div>

              <div className="setting-group">
                <label>
                  <input
                    type="checkbox"
                    checked={conversionSettings.lossless}
                    onChange={(e) => handleSettingChange('lossless', e.target.checked)}
                  />
                  Lossless Compression
                </label>
              </div>

              <div className="setting-group">
                <label>Preset:</label>
                <select
                  value={conversionSettings.preset}
                  onChange={(e) => handleSettingChange('preset', e.target.value)}
                >
                  <option value="default">Default</option>
                  <option value="photo">Photo</option>
                  <option value="picture">Picture</option>
                  <option value="drawing">Drawing</option>
                  <option value="icon">Icon</option>
                  <option value="text">Text</option>
                </select>
              </div>
            </div>
          ) : (
            <div className="settings-grid">
              <div className="setting-group">
                <label>Target Format:</label>
                <select
                  value={conversionSettings.targetFormat}
                  onChange={(e) => handleSettingChange('targetFormat', e.target.value)}
                >
                  <option value="png">PNG</option>
                  <option value="jpg">JPG</option>
                  <option value="gif">GIF</option>
                  <option value="bmp">BMP</option>
                </select>
              </div>

              <div className="setting-group">
                <label>Quality: {conversionSettings.quality}%</label>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={conversionSettings.quality}
                  onChange={(e) => handleSettingChange('quality', parseInt(e.target.value))}
                />
              </div>
            </div>
          )}

          <div className="setting-group">
            <label>
              <input
                type="checkbox"
                checked={conversionSettings.downloadAsZip}
                onChange={(e) => handleSettingChange('downloadAsZip', e.target.checked)}
              />
              Download as ZIP (for multiple files)
            </label>
          </div>
        </div>
      )}

      {/* Convert Button */}
      {files.length > 0 && (
        <div className="convert-section">
          <button
            onClick={convertFiles}
            disabled={isConverting}
            className="convert-btn"
          >
            {isConverting ? 'Converting...' : `Convert ${files.length} file(s)`}
          </button>

          {isConverting && (
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${conversionProgress}%` }}
              ></div>
            </div>
          )}
        </div>
      )}

      {/* Results */}
      {conversionResults && (
        <div className="conversion-results">
          <h3>Conversion Results</h3>
          
          {conversionResults.batch && (
            <div className="results-summary">
              <p>
                Converted {conversionResults.successful} of {conversionResults.total} files
                {conversionResults.totalSavings && (
                  <span> • Average compression: {conversionResults.totalSavings}</span>
                )}
              </p>
              
              {conversionResults.zipDownload && (
                <button 
                  onClick={downloadAllAsZip}
                  className="download-zip-btn"
                >
                  Download All as ZIP ({formatFileSize(conversionResults.zipDownload.size)})
                </button>
              )}
            </div>
          )}

          <div className="results-list">
            {(conversionResults.results || [conversionResults]).map((result, index) => (
              <div 
                key={index} 
                className={`result-item ${result.success ? 'success' : 'error'}`}
              >
                <div className="result-info">
                  <div className="result-name">
                    {result.original || conversionResults.file?.original}
                  </div>
                  {result.success ? (
                    <>
                      <div className="result-details">
                        {result.compression && (
                          <span>Compression: {result.compression}</span>
                        )}
                        {result.size && (
                          <span>Size: {formatFileSize(result.size)}</span>
                        )}
                      </div>
                      <button
                        onClick={() => downloadFile(
                          result.downloadUrl || conversionResults.file?.downloadUrl, 
                          result.converted || conversionResults.file?.converted
                        )}
                        className="download-btn"
                      >
                        Download
                      </button>
                    </>
                  ) : (
                    <div className="error-message">{result.error}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default WebPConverter;
