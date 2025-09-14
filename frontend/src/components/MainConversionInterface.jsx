import React, { useState, useRef } from 'react';
import NotificationService from '../utils/NotificationService.js';
import WebPConverter from './WebPConverter.jsx';

export default function MainConversionInterface({ currentTool, setCurrentTool, loading, setLoading, error, setError }) {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [results, setResults] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);
  const [urlInput, setUrlInput] = useState('');
  
  // Tool categories exactly matching ezgif.com
  const toolCategories = {
    'GIF maker': [
      { id: 'video-to-gif', name: 'Video to GIF', icon: '🎬', description: 'Convert video files to animated GIF' },
      { id: 'images-to-gif', name: 'Images to GIF', icon: '🖼️', description: 'Create animated GIF from images' },
      { id: 'gif-maker', name: 'GIF maker', icon: '✨', description: 'Professional GIF creation tools' }
    ],
    'GIF tools': [
      { id: 'resize', name: 'Resize', icon: '📏', description: 'Resize animated GIFs' },
      { id: 'crop', name: 'Crop', icon: '✂️', description: 'Crop animated GIFs' },
      { id: 'rotate', name: 'Rotate', icon: '🔄', description: 'Rotate/flip animated GIFs' },
      { id: 'optimize', name: 'Optimize', icon: '⚡', description: 'Compress and optimize GIFs' },
      { id: 'effects', name: 'Effects', icon: '🎨', description: 'Add effects to GIFs' },
      { id: 'split', name: 'Split', icon: '✂️', description: 'Extract frames from GIF' },
      { id: 'add-text', name: 'Add Text', icon: '📝', description: 'Add text to GIF' },
      { id: 'overlay', name: 'Overlay', icon: '🎭', description: 'Add image overlay to GIF' }
    ],
    'WebP tools': [
      { id: 'webp-maker', name: 'WebP maker', icon: '🌐', description: 'Convert to WebP format' },
      { id: 'webp-to-gif', name: 'WebP to GIF', icon: '🔄', description: 'Convert WebP to GIF' },
      { id: 'webp-to-mp4', name: 'WebP to MP4', icon: '🎥', description: 'Convert WebP to MP4' }
    ],
    'Other formats': [
      { id: 'apng-maker', name: 'APNG maker', icon: '🖼️', description: 'Create APNG animations' },
      { id: 'avif-converter', name: 'AVIF converter', icon: '🔄', description: 'Convert to AVIF format' },
      { id: 'jxl-converter', name: 'JXL converter', icon: '💎', description: 'Convert to JPEG XL format' },
      { id: 'png-to-gif', name: 'PNG to GIF', icon: '🔄', description: 'Convert PNG sequence to GIF' }
    ]
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(files);
    NotificationService.toast(`Selected ${files.length} file(s)`, 'info');
  };

  const handleUrlInput = () => {
    if (!urlInput.trim()) {
      NotificationService.error('URL Required', 'Please enter a valid URL');
      return;
    }
    
    NotificationService.toast('Fetching from URL...', 'info');
    // Here you would implement URL fetching logic
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = Array.from(e.dataTransfer.files);
    setSelectedFiles(files);
    NotificationService.toast(`Dropped ${files.length} file(s)`, 'success');
  };

  const processFiles = async () => {
    if (selectedFiles.length === 0 && !urlInput.trim()) {
      NotificationService.error('No Input', 'Please select files or enter a URL');
      return;
    }

    setLoading(true);
    setError(null);
    
    const progressNotification = NotificationService.progressToast(
      `Processing with ${currentTool}`,
      'Converting your files...',
      0
    );

  // === Old Railway backend (commented out) ===
  /*
  const handleConvert_Railway = async () => {
    if (selectedFiles.length === 0 && !urlInput.trim()) {
      NotificationService.error('No Input', 'Please select files or enter a URL');
      return;
    }

    setLoading(true);
    setError('');
    setResults([]);

    const progressNotification = NotificationService.progress(
      'Processing Files',
      'Converting your media files...'
    );

    try {
      const form = new FormData();
      selectedFiles.forEach(file => form.append('files', file));
      if (urlInput.trim()) form.append('url', urlInput.trim());
      form.append('tool', currentTool);

      const base = 'https://gif-backend-production.up.railway.app'; // Railway backend
      
      // Log API configuration for debugging
      console.log('🔧 API Configuration (Railway):', {
        railwayBase: base,
        tool: currentTool,
        filesCount: selectedFiles.length,
        hasUrl: !!urlInput.trim()
      });
      
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const newProgress = Math.min(prev + Math.random() * 15, 90);
          progressNotification.updateProgress(newProgress);
          return newProgress;
        });
      }, 300);

      console.log(`🚀 Making API call to Railway: ${base}/api/convert`);
      const response = await fetch(`${base}/api/convert`, {
        method: 'POST',
        body: form
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Railway API Response:', result);

      progressNotification.complete('Conversion completed successfully!');
      
      if (result.files && Array.isArray(result.files)) {
        setResults(result.files);
      } else if (result.success) {
        setResults([{ success: true, message: result.message || 'Processing completed', tool: currentTool }]);
      } else {
        throw new Error(result.message || 'Processing failed');
      }

    } catch (err) {
      console.error('❌ Railway API Error:', err);
      progressNotification.error(`Conversion failed: ${err.message}`);
      setError(err.message);
      
      NotificationService.error(
        'Conversion Failed', 
        err.message.includes('fetch') ? 'Unable to connect to server' : err.message
      );
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };
  */

  // === New Local backend (active) ===
  const handleConvert = async () => {
    if (selectedFiles.length === 0 && !urlInput.trim()) {
      NotificationService.error('No Input', 'Please select files or enter a URL');
      return;
    }

    setLoading(true);
    setError('');
    setResults([]);

    const progressNotification = NotificationService.progress(
      'Processing Files',
      'Converting your media files...'
    );

    try {
      const form = new FormData();
      selectedFiles.forEach(file => form.append('files', file));
      if (urlInput.trim()) form.append('url', urlInput.trim());
      form.append('tool', currentTool);

      // Use local backend instead of Railway
      const base = 'http://localhost:5000'; // Local backend
      
      // Log API configuration for debugging
      console.log('🔧 API Configuration (Local):', {
        localBase: base,
        tool: currentTool,
        filesCount: selectedFiles.length,
        hasUrl: !!urlInput.trim()
      });
      
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const newProgress = Math.min(prev + Math.random() * 15, 90);
          progressNotification.updateProgress(newProgress);
          return newProgress;
        });
      }, 300);

      console.log(`🚀 Making API call to Local Backend: ${base}/api/convert`);
      const response = await fetch(`${base}/api/convert`, {
        method: 'POST',
        body: form
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Local Backend API Response:', result);

      progressNotification.complete('Conversion completed successfully!');
      
      if (result.files && Array.isArray(result.files)) {
        setResults(result.files);
      } else if (result.success) {
        setResults([{ success: true, message: result.message || 'Processing completed', tool: currentTool }]);
      } else {
        throw new Error(result.message || 'Processing failed');
      }

    } catch (err) {
      console.error('❌ Local Backend API Error:', err);
      progressNotification.error(`Conversion failed: ${err.message}`);
      setError(err.message);
      
      NotificationService.error(
        'Conversion Failed', 
        err.message.includes('fetch') ? 'Unable to connect to local server' : err.message
      );
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };
      progressNotification.updateProgress(100);

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      setResults(data.files || []);
      
      NotificationService.success(
        'Processing Complete!',
        `Successfully processed ${selectedFiles.length} file(s)`,
        { timer: 5000 }
      );

      progressNotification.close();

    } catch (err) {
      console.error('Processing error:', err);
      setError(err.message);
      NotificationService.error(
        'Processing Failed',
        err.message || 'An unexpected error occurred',
        { timer: 8000 }
      );
      progressNotification.close();
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  // === Old Railway backend download (commented out) ===
  /*
  const downloadFile_Railway = async (filename) => {
    try {
      const base = 'https://gif-backend-production.up.railway.app'; // Railway backend
      const link = document.createElement('a');
      link.href = `${base}/api/files/${filename}`;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      NotificationService.toast(`Downloaded: ${filename}`, 'success');
    } catch (err) {
      NotificationService.error('Download Failed', 'Unable to download the file from Railway');
    }
  };
  */

  // === New Local backend download (active) ===
  const downloadFile = async (filename) => {
    try {
      const base = 'http://localhost:5000'; // Local backend
      const link = document.createElement('a');
      link.href = `${base}/api/files/${filename}`;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      NotificationService.toast(`Downloaded: ${filename}`, 'success');
    } catch (err) {
      NotificationService.error('Download Failed', 'Unable to download the file from local server');
    }
  };

  const renderToolInterface = () => {
    if (currentTool === 'home') {
      return (
        <div className="tool-grid">
          {Object.entries(toolCategories).map(([category, tools]) => (
            <div key={category} className="tool-category">
              <h3 className="category-title">{category}</h3>
              <div className="tools-grid">
                {tools.map(tool => (
                  <div 
                    key={tool.id}
                    className="tool-card"
                    onClick={() => {
                      setCurrentTool(tool.id);
                      NotificationService.toast(`Switched to ${tool.name}`, 'info');
                    }}
                  >
                    <div className="tool-icon">{tool.icon}</div>
                    <h4 className="tool-name">{tool.name}</h4>
                    <p className="tool-description">{tool.description}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      );
    }

    // Render specialized WebP converter for WebP tools
    if (currentTool === 'webp-maker' || currentTool === 'webp-to-gif' || currentTool === 'webp-to-mp4') {
      return (
        <div className="specialized-tool">
          <div className="tool-header">
            <button 
              className="back-button"
              onClick={() => setCurrentTool('home')}
            >
              ← Back to tools
            </button>
          </div>
          <WebPConverter />
        </div>
      );
    }

    return (
      <div className="tool-interface">
        <div className="tool-header">
          <button 
            className="back-button"
            onClick={() => setCurrentTool('home')}
          >
            ← Back to tools
          </button>
          <h2 className="tool-title">
            {Object.values(toolCategories).flat().find(t => t.id === currentTool)?.name || currentTool}
          </h2>
        </div>

        <div className="upload-area"
             onDragOver={handleDragOver}
             onDrop={handleDrop}>
          <div className="upload-content">
            <div className="upload-icon">📁</div>
            <h3>Choose files or drag & drop</h3>
            <p>Supported formats: GIF, MP4, MOV, AVI, WEBM, WebP, PNG, JPG</p>
            
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              multiple
              accept="image/*,video/*"
              style={{ display: 'none' }}
            />
            
            <button 
              className="upload-button"
              onClick={() => fileInputRef.current?.click()}
            >
              Choose Files
            </button>
            
            {selectedFiles.length > 0 && (
              <div className="selected-files">
                <h4>Selected Files ({selectedFiles.length}):</h4>
                {selectedFiles.map((file, index) => (
                  <div key={index} className="file-item">
                    {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="url-input-section">
          <h4>Or paste URL:</h4>
          <div className="url-input-group">
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://example.com/video.mp4"
              className="url-input"
            />
            <button 
              className="url-button"
              onClick={handleUrlInput}
            >
              Load from URL
            </button>
          </div>
        </div>

        <div className="process-section">
          <button 
            className="process-button"
            onClick={processFiles}
            disabled={loading || (selectedFiles.length === 0 && !urlInput.trim())}
          >
            {loading ? 'Processing...' : `Process with ${currentTool}`}
          </button>
        </div>

        {results.length > 0 && (
          <div className="results-section">
            <h3>Results</h3>
            <div className="results-grid">
              {results.map((result, index) => (
                <div key={index} className="result-item">
                  <div className="result-preview">
                    {result.type === 'image' ? (
                      <img src={result.url} alt="Result" />
                    ) : result.type === 'video' ? (
                      <video src={result.url} controls />
                    ) : (
                      <div className="file-icon">📄</div>
                    )}
                  </div>
                  <div className="result-info">
                    <h4>{result.filename}</h4>
                    <p>Size: {result.size}</p>
                    <button 
                      className="download-button"
                      onClick={() => downloadFile(result.filename)}
                    >
                      Download
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Editing Options */}
            <div className="editing-options">
              <h3>Edit Options</h3>
              <div className="options-grid">
                <div className="option-group">
                  <label>Frame Delay (ms)</label>
                  <input 
                    type="number" 
                    min="10" 
                    max="5000" 
                    defaultValue="100" 
                    className="option-input"
                    placeholder="100"
                  />
                  <small>Time between frames (milliseconds)</small>
                </div>
                
                <div className="option-group">
                  <label>Left Position</label>
                  <input 
                    type="number" 
                    min="0" 
                    max="1000" 
                    defaultValue="0" 
                    className="option-input"
                    placeholder="0"
                  />
                  <small>Horizontal offset (pixels)</small>
                </div>
                
                <div className="option-group">
                  <label>Top Position</label>
                  <input 
                    type="number" 
                    min="0" 
                    max="1000" 
                    defaultValue="0" 
                    className="option-input"
                    placeholder="0"
                  />
                  <small>Vertical offset (pixels)</small>
                </div>
                
                <div className="option-group">
                  <label>Width</label>
                  <input 
                    type="number" 
                    min="10" 
                    max="2000" 
                    defaultValue="400" 
                    className="option-input"
                    placeholder="400"
                  />
                  <small>Output width (pixels)</small>
                </div>
                
                <div className="option-group">
                  <label>Height</label>
                  <input 
                    type="number" 
                    min="10" 
                    max="2000" 
                    defaultValue="300" 
                    className="option-input"
                    placeholder="300"
                  />
                  <small>Output height (pixels)</small>
                </div>
                
                <div className="option-group">
                  <label>Quality</label>
                  <input 
                    type="range" 
                    min="1" 
                    max="100" 
                    defaultValue="80" 
                    className="option-slider"
                  />
                  <small>Compression quality (1-100)</small>
                </div>
                
                <div className="option-group checkbox-group">
                  <label>
                    <input type="checkbox" /> Loop Animation
                  </label>
                  <small>Repeat animation continuously</small>
                </div>
                
                <div className="option-group checkbox-group">
                  <label>
                    <input type="checkbox" /> Auto Crop
                  </label>
                  <small>Remove transparent borders</small>
                </div>
              </div>
              
              <div className="editing-actions">
                <button className="apply-button" disabled={loading}>
                  {loading ? 'Applying...' : 'Apply Changes'}
                </button>
                <button className="reset-button">
                  Reset to Default
                </button>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="error-message">
            <strong>Error:</strong> {error}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="ezgif-interface">
      <div className="container">
        {renderToolInterface()}
      </div>

      <style>{`
        .ezgif-interface {
          min-height: calc(100vh - 120px);
          background: #f8f9fa;
          padding: 20px 0;
        }

        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 20px;
        }

        .tool-grid {
          display: grid;
          gap: 30px;
        }

        .tool-category {
          background: white;
          border-radius: 12px;
          padding: 25px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }

        .category-title {
          font-size: 1.5rem;
          font-weight: 600;
          color: #2c3e50;
          margin: 0 0 20px 0;
          border-bottom: 2px solid #3498db;
          padding-bottom: 10px;
        }

        .tools-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 15px;
        }

        .tool-card {
          background: #f8f9fa;
          border: 1px solid #dee2e6;
          border-radius: 8px;
          padding: 20px;
          cursor: pointer;
          transition: all 0.3s ease;
          text-align: center;
        }

        .tool-card:hover {
          background: #3498db;
          color: white;
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(52, 152, 219, 0.3);
        }

        .tool-icon {
          font-size: 2rem;
          margin-bottom: 10px;
        }

        .tool-name {
          font-size: 1.1rem;
          font-weight: 600;
          margin: 0 0 8px 0;
        }

        .tool-description {
          font-size: 0.9rem;
          opacity: 0.8;
          margin: 0;
        }

        .tool-interface {
          background: white;
          border-radius: 12px;
          padding: 30px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }

        .tool-header {
          display: flex;
          align-items: center;
          gap: 15px;
          margin-bottom: 30px;
          padding-bottom: 15px;
          border-bottom: 1px solid #dee2e6;
        }

        .back-button {
          background: #6c757d;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.9rem;
        }

        .back-button:hover {
          background: #5a6268;
        }

        .tool-title {
          font-size: 1.8rem;
          font-weight: 600;
          color: #2c3e50;
          margin: 0;
        }

        .upload-area {
          border: 2px dashed #3498db;
          border-radius: 12px;
          padding: 40px;
          text-align: center;
          margin-bottom: 30px;
          transition: all 0.3s ease;
        }

        .upload-area:hover {
          border-color: #2980b9;
          background: #f8f9fa;
        }

        .upload-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 15px;
        }

        .upload-icon {
          font-size: 3rem;
          opacity: 0.7;
        }

        .upload-button {
          background: #3498db;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .upload-button:hover {
          background: #2980b9;
          transform: translateY(-1px);
        }

        .selected-files {
          margin-top: 20px;
          text-align: left;
          width: 100%;
        }

        .file-item {
          background: #f8f9fa;
          padding: 8px 12px;
          border-radius: 6px;
          margin: 5px 0;
          border-left: 3px solid #3498db;
        }

        .url-input-section {
          margin-bottom: 30px;
        }

        .url-input-group {
          display: flex;
          gap: 10px;
          margin-top: 10px;
        }

        .url-input {
          flex: 1;
          padding: 12px;
          border: 1px solid #dee2e6;
          border-radius: 6px;
          font-size: 1rem;
        }

        .url-button {
          background: #28a745;
          color: white;
          border: none;
          padding: 12px 20px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
        }

        .url-button:hover {
          background: #218838;
        }

        .process-section {
          text-align: center;
          margin-bottom: 30px;
        }

        .process-button {
          background: #e74c3c;
          color: white;
          border: none;
          padding: 15px 30px;
          border-radius: 8px;
          font-size: 1.1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .process-button:hover:not(:disabled) {
          background: #c0392b;
          transform: translateY(-1px);
        }

        .process-button:disabled {
          background: #bdc3c7;
          cursor: not-allowed;
        }

        .results-section {
          margin-top: 30px;
          padding-top: 30px;
          border-top: 1px solid #dee2e6;
        }

        .results-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
          margin-top: 20px;
        }

        .result-item {
          background: #f8f9fa;
          border-radius: 8px;
          padding: 20px;
          text-align: center;
        }

        .result-preview img,
        .result-preview video {
          max-width: 100%;
          max-height: 200px;
          border-radius: 6px;
        }

        .file-icon {
          font-size: 3rem;
          opacity: 0.7;
        }

        .result-info {
          margin-top: 15px;
        }

        .download-button {
          background: #17a2b8;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
          margin-top: 10px;
        }

        .download-button:hover {
          background: #138496;
        }

        .error-message {
          background: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
          border-radius: 6px;
          padding: 15px;
          margin-top: 20px;
        }

        /* Editing Options Styles */
        .editing-options {
          margin-top: 30px;
          padding: 25px;
          background: white;
          border-radius: 10px;
          border: 1px solid #e1e5e9;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .editing-options h3 {
          color: #2c3e50;
          margin-bottom: 20px;
          font-size: 1.3rem;
          font-weight: 600;
          border-bottom: 2px solid #e9ecef;
          padding-bottom: 10px;
        }

        .options-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
          margin-bottom: 25px;
        }

        .option-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .option-group label {
          font-weight: 600;
          color: #495057;
          font-size: 0.9rem;
        }

        .option-input, .option-slider {
          padding: 10px;
          border: 1px solid #ced4da;
          border-radius: 6px;
          font-size: 0.95rem;
          transition: border-color 0.2s ease;
        }

        .option-input:focus, .option-slider:focus {
          outline: none;
          border-color: #3498db;
          box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
        }

        .option-slider {
          padding: 5px 0;
        }

        .option-group small {
          color: #6c757d;
          font-size: 0.8rem;
          font-style: italic;
        }

        .checkbox-group {
          flex-direction: row;
          align-items: center;
          gap: 10px;
        }

        .checkbox-group label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 500;
          margin: 0;
        }

        .checkbox-group input[type="checkbox"] {
          width: 18px;
          height: 18px;
          accent-color: #3498db;
        }

        .editing-actions {
          display: flex;
          gap: 15px;
          justify-content: flex-start;
          padding-top: 20px;
          border-top: 1px solid #e9ecef;
        }

        .apply-button {
          background: #28a745;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.2s ease;
          font-size: 0.95rem;
        }

        .apply-button:hover:not(:disabled) {
          background: #218838;
        }

        .apply-button:disabled {
          background: #6c757d;
          cursor: not-allowed;
        }

        .reset-button {
          background: #6c757d;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.2s ease;
          font-size: 0.95rem;
        }

        .reset-button:hover {
          background: #5a6268;
        }

        @media (max-width: 768px) {
          .tools-grid {
            grid-template-columns: 1fr;
          }
          
          .url-input-group {
            flex-direction: column;
          }
          
          .results-grid {
            grid-template-columns: 1fr;
          }
          
          .options-grid {
            grid-template-columns: 1fr;
            gap: 15px;
          }
          
          .editing-actions {
            flex-direction: column;
            gap: 10px;
          }
          
          .apply-button, .reset-button {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
