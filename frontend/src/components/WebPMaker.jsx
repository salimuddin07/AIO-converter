import React, { useState, useRef } from 'react';
import { styled } from 'polished';
import NotificationService from '../utils/NotificationService.js';

const StyledWebpMaker = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: Arial, sans-serif;
  font-size: 13px;
  line-height: 1.4;
  color: #333;
  
  .page-header {
    margin-bottom: 20px;
    
    h1 {
      font-size: 24px;
      color: #2c5aa0;
      margin: 0 0 10px 0;
      font-weight: normal;
    }
    
    .description {
      color: #666;
      margin-bottom: 15px;
      line-height: 1.6;
    }
    
    .breadcrumb {
      font-size: 11px;
      color: #999;
      margin-bottom: 20px;
      
      a {
        color: #2c5aa0;
        text-decoration: none;
        
        &:hover {
          text-decoration: underline;
        }
      }
    }
  }
  
  .upload-section {
    background: #f9f9f9;
    border: 1px solid #ddd;
    padding: 20px;
    margin-bottom: 20px;
    border-radius: 5px;
    
    .upload-methods {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 20px;
      
      .upload-method {
        .method-title {
          font-weight: bold;
          margin-bottom: 10px;
          color: #333;
        }
      }
    }
    
    .file-upload-area {
      border: 2px dashed #ccc;
      padding: 40px;
      text-align: center;
      background: #fff;
      border-radius: 5px;
      transition: all 0.3s ease;
      cursor: pointer;
      margin-bottom: 15px;
      
      &:hover, &.dragover {
        border-color: #2c5aa0;
        background: #f0f8ff;
      }
      
      .upload-icon {
        font-size: 48px;
        color: #ccc;
        margin-bottom: 15px;
        display: block;
      }
      
      .upload-text {
        color: #666;
        margin-bottom: 10px;
        
        .highlight {
          color: #2c5aa0;
          font-weight: bold;
        }
      }
      
      .file-types {
        font-size: 11px;
        color: #999;
        margin-top: 10px;
      }
    }
    
    .url-input-section {
      .url-input {
        width: 100%;
        padding: 8px;
        border: 1px solid #ccc;
        border-radius: 3px;
        font-size: 13px;
        margin-bottom: 10px;
        
        &:focus {
          border-color: #2c5aa0;
          outline: none;
          box-shadow: 0 0 5px rgba(44, 90, 160, 0.3);
        }
      }
      
      .url-note {
        font-size: 11px;
        color: #666;
        margin-bottom: 15px;
      }
    }
    
    .file-input-hidden {
      display: none;
    }
    
    .upload-button {
      background: #2c5aa0;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 3px;
      cursor: pointer;
      font-size: 13px;
      font-weight: bold;
      
      &:hover {
        background: #1e3f73;
      }
      
      &:disabled {
        background: #ccc;
        cursor: not-allowed;
      }
    }
  }
  
  .options-section {
    background: #fff;
    border: 1px solid #ddd;
    padding: 20px;
    margin-bottom: 20px;
    border-radius: 5px;
    
    h3 {
      color: #2c5aa0;
      margin-bottom: 15px;
      font-size: 16px;
      font-weight: bold;
    }
    
    .options-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      
      .option-group {
        label {
          display: block;
          margin-bottom: 5px;
          font-weight: bold;
          color: #333;
          font-size: 12px;
        }
        
        input, select {
          width: 100%;
          padding: 6px;
          border: 1px solid #ccc;
          border-radius: 3px;
          font-size: 12px;
        }
        
        input[type="range"] {
          width: calc(100% - 50px);
          margin-right: 10px;
        }
        
        .range-value {
          font-size: 11px;
          color: #666;
        }
      }
    }
  }
  
  .advanced-section {
    margin-top: 20px;
    
    details {
      border: 1px solid #ddd;
      border-radius: 3px;
      
      summary {
        background: #f0f0f0;
        padding: 10px;
        cursor: pointer;
        font-weight: bold;
        color: #333;
        border-bottom: 1px solid #ddd;
        
        &:hover {
          background: #e8e8e8;
        }
      }
      
      .advanced-content {
        padding: 15px;
        background: #fafafa;
      }
    }
  }
  
  .process-button-section {
    text-align: center;
    margin: 30px 0;
    
    .process-button {
      background: linear-gradient(to bottom, #4CAF50, #45a049);
      color: white;
      border: none;
      padding: 15px 40px;
      font-size: 16px;
      font-weight: bold;
      border-radius: 5px;
      cursor: pointer;
      box-shadow: 0 4px 8px rgba(0,0,0,0.2);
      transition: all 0.3s ease;
      
      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 12px rgba(0,0,0,0.3);
      }
      
      &:disabled {
        background: #ccc;
        cursor: not-allowed;
        transform: none;
        box-shadow: none;
      }
    }
  }
`;

const WebPMaker = ({ onConvert, loading = false }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [imageUrl, setImageUrl] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [webpOptions, setWebpOptions] = useState({
    quality: 80,
    method: 6,
    lossless: false,
    animated: true,
    loop: 0,
    frameDelay: 100,
    backgroundAlpha: 255
  });
  
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    const validFiles = files.filter(file => 
      file.type.startsWith('image/') || file.type.startsWith('video/')
    );
    
    if (validFiles.length > 0) {
      setSelectedFiles(validFiles);
      NotificationService.success(
        'Files Selected',
        `${validFiles.length} file(s) ready for WebP conversion`
      );
    } else {
      NotificationService.warning(
        'Invalid Files',
        'Please select image or video files only'
      );
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setSelectedFiles(files);
      NotificationService.success(
        'Files Selected',
        `${files.length} file(s) ready for WebP conversion`
      );
    }
  };

  const handleUrlInput = () => {
    if (imageUrl.trim()) {
      // Create a virtual file from URL for processing
      const urlFile = {
        name: 'url-image.webp',
        type: 'image/url',
        url: imageUrl.trim()
      };
      setSelectedFiles([urlFile]);
      NotificationService.success(
        'URL Added',
        'Image URL ready for WebP conversion'
      );
    }
  };

  const handleOptionChange = (key, value) => {
    setWebpOptions(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleConvert = async () => {
    if (selectedFiles.length === 0 && !imageUrl.trim()) {
      NotificationService.warning(
        'No Files Selected',
        'Please select files or enter an image URL'
      );
      return;
    }

    const filesToProcess = selectedFiles.length > 0 ? selectedFiles : [];
    
    try {
      await onConvert({
        files: filesToProcess,
        targetFormat: 'webp',
        webpOptions: webpOptions,
        imageUrl: imageUrl.trim()
      });
    } catch (error) {
      console.error('WebP conversion failed:', error);
      NotificationService.error(
        'Conversion Failed',
        error.message || 'Failed to convert to WebP'
      );
    }
  };

  return (
    <StyledWebpMaker>
      <div className="page-header">
        <div className="breadcrumb">
          <a href="/">aio-convert.com</a> › <span>Animated WebP Maker</span>
        </div>
        <h1>Animated WebP Maker</h1>
        <p className="description">
          Make animated WebP files from PNG, JPG, GIF, SVG or MP4 video files. 
          Animated WebP supports transparency and usually produces smaller files than animated GIFs.
        </p>
      </div>

      <div className="upload-section">
        <div className="upload-methods">
          <div className="upload-method">
            <div className="method-title">Choose Files</div>
            <div 
              className={`file-upload-area ${dragActive ? 'dragover' : ''}`}
              onClick={() => fileInputRef.current?.click()}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <span className="upload-icon">📁</span>
              <div className="upload-text">
                <span className="highlight">Click to browse</span> or drag files here
              </div>
              <div className="file-types">
                PNG, JPG, GIF, SVG, BMP, TIFF, WebP, MP4, AVI, MOV, WEBM
              </div>
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="file-input-hidden"
              accept="image/*,video/*"
              onChange={handleFileSelect}
            />
            
            {selectedFiles.length > 0 && (
              <div style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
                Selected: {selectedFiles.map(f => f.name || 'URL Image').join(', ')}
              </div>
            )}
          </div>

          <div className="upload-method">
            <div className="method-title">Or paste image URL</div>
            <input
              type="url"
              className="url-input"
              placeholder="https://example.com/image.png"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleUrlInput()}
            />
            <div className="url-note">
              Direct links to image files work best
            </div>
            <button 
              className="upload-button"
              onClick={handleUrlInput}
              disabled={!imageUrl.trim()}
            >
              Load from URL
            </button>
          </div>
        </div>
      </div>

      <div className="options-section">
        <h3>WebP Conversion Options</h3>
        <div className="options-grid">
          <div className="option-group">
            <label>Quality ({webpOptions.quality}%)</label>
            <input
              type="range"
              min="1"
              max="100"
              value={webpOptions.quality}
              onChange={(e) => handleOptionChange('quality', parseInt(e.target.value))}
            />
            <span className="range-value">{webpOptions.quality}%</span>
          </div>

          <div className="option-group">
            <label>Compression Method</label>
            <select
              value={webpOptions.method}
              onChange={(e) => handleOptionChange('method', parseInt(e.target.value))}
            >
              <option value="0">Fastest (0)</option>
              <option value="1">Fast (1)</option>
              <option value="2">Fast (2)</option>
              <option value="3">Good (3)</option>
              <option value="4">Good (4)</option>
              <option value="5">Better (5)</option>
              <option value="6">Best (6)</option>
            </select>
          </div>

          <div className="option-group">
            <label>Animation Frame Delay (ms)</label>
            <input
              type="number"
              min="10"
              max="5000"
              value={webpOptions.frameDelay}
              onChange={(e) => handleOptionChange('frameDelay', parseInt(e.target.value))}
            />
          </div>

          <div className="option-group">
            <label>Loop Count</label>
            <select
              value={webpOptions.loop}
              onChange={(e) => handleOptionChange('loop', parseInt(e.target.value))}
            >
              <option value="0">Infinite</option>
              <option value="1">Once</option>
              <option value="2">Twice</option>
              <option value="3">3 times</option>
              <option value="5">5 times</option>
              <option value="10">10 times</option>
            </select>
          </div>
        </div>

        <div className="advanced-section">
          <details>
            <summary>Advanced Options</summary>
            <div className="advanced-content">
              <div className="options-grid">
                <div className="option-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={webpOptions.lossless}
                      onChange={(e) => handleOptionChange('lossless', e.target.checked)}
                    />
                    Lossless compression
                  </label>
                </div>
                
                <div className="option-group">
                  <label>Background Alpha ({webpOptions.backgroundAlpha})</label>
                  <input
                    type="range"
                    min="0"
                    max="255"
                    value={webpOptions.backgroundAlpha}
                    onChange={(e) => handleOptionChange('backgroundAlpha', parseInt(e.target.value))}
                  />
                  <span className="range-value">{webpOptions.backgroundAlpha}</span>
                </div>
              </div>
            </div>
          </details>
        </div>
      </div>

      <div className="process-button-section">
        <button
          className="process-button"
          onClick={handleConvert}
          disabled={loading || (selectedFiles.length === 0 && !imageUrl.trim())}
        >
          {loading ? '🔄 Converting to WebP...' : '🚀 Make WebP!'}
        </button>
      </div>

      {selectedFiles.length > 0 && (
        <div style={{ 
          background: '#e8f4fd', 
          padding: '15px', 
          border: '1px solid #b3d9ff',
          borderRadius: '5px',
          margin: '20px 0',
          fontSize: '12px',
          color: '#2c5aa0'
        }}>
          <strong>Ready to convert:</strong> {selectedFiles.length} file(s) to animated WebP format
          with {webpOptions.quality}% quality and {webpOptions.frameDelay}ms frame delay.
        </div>
      )}
    </StyledWebpMaker>
  );
};

export default WebPMaker;
