import { useState, useRef } from 'react';
import { NotificationService } from '../utils/NotificationService.js';
import { api as realAPI } from '../utils/unifiedAPI.js';

// Legacy compatibility for downloadFile and validateFile
const downloadFile = async (data, filename) => {
  return await realAPI.saveFile(data, filename);
};

const validateFile = (file) => {
  // Basic file validation
  if (!file) return { isValid: false, error: 'No file provided' };
  if (file.size > 100 * 1024 * 1024) return { isValid: false, error: 'File too large (max 100MB)' };
  return { isValid: true };
};

const API_CONFIG = {
  processing: {
    maxFileSize: { image: 25, video: 100, pdf: 25 },
    supportedFormats: {
      input: ["jpg", "jpeg", "png", "gif", "bmp", "webp", "mp4", "avi", "mov", "wmv", "pdf"],
      output: ["jpg", "jpeg", "png", "gif", "webp", "pdf", "md"]
    }
  }
};

export default function MainConversionInterface({ currentTool, setCurrentTool, loading, setLoading, error, setError }) {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [results, setResults] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);
  const [urlInput, setUrlInput] = useState('');
  const [showEnhancedGifCreator, setShowEnhancedGifCreator] = useState(false);
  const [showApiTest, setShowApiTest] = useState(false);
  const activeTool = typeof currentTool === 'string' && currentTool.trim() ? currentTool : 'home';

  const toolCategories = {
    'Basic Tools': [
      { 
        id: 'convert', 
        title: 'Convert Images', 
        description: 'Convert between different image formats',
        icon: '🔄',
        formats: ['JPG', 'PNG', 'GIF', 'WEBP', 'BMP'] 
      },
      { 
        id: 'resize', 
        title: 'Resize Images', 
        description: 'Change image dimensions and optimize size',
        icon: '📏',
        formats: ['JPG', 'PNG', 'GIF', 'WEBP'] 
      },
      { 
        id: 'compress', 
        title: 'Compress Images', 
        description: 'Reduce file size while maintaining quality',
        icon: '🗜️',
        formats: ['JPG', 'PNG', 'WEBP'] 
      }
    ],
    'GIF Tools': [
      { 
        id: 'gif-maker', 
        title: 'Create GIF', 
        description: 'Convert videos or images to animated GIF',
        icon: '🎞️',
        formats: ['MP4', 'AVI', 'MOV', 'JPG', 'PNG'] 
      },
      { 
        id: 'enhanced-gif-creator', 
        title: 'Enhanced GIF Creator', 
        description: 'Advanced GIF creation with effects and optimization',
        icon: '✨',
        formats: ['MP4', 'AVI', 'MOV', 'JPG', 'PNG'] 
      },
      { 
        id: 'gif-optimizer', 
        title: 'Optimize GIF', 
        description: 'Reduce GIF file size and improve performance',
        icon: '⚡',
        formats: ['GIF'] 
      }
    ],
    'Debug Tools': [
      { 
        id: 'api-test', 
        title: 'API Connection Test', 
        description: 'Test frontend-backend API connectivity',
        icon: '🔧',
        formats: [] 
      }
    ]
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(files);
    setResults([]);
  };

  const handleUrlInput = () => {
    if (urlInput.trim()) {
      // Create a virtual file object for URL input
      const urlFile = { name: urlInput.split('/').pop(), url: urlInput };
      setSelectedFiles([urlFile]);
      setResults([]);
    }
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
    setResults([]);
  };

  // Local processing function - no server required
  const processFiles = async () => {
    if (selectedFiles.length === 0 && !urlInput.trim()) {
      NotificationService.toast('Please select files or enter a URL first', 'warning');
      return;
    }

    setLoading(true);
    setError('');
    setUploadProgress(0);
    
    const progressNotification = NotificationService.progressToast(
      'Processing files locally...', 
      'Your files are being processed in your browser'
    );

    try {
      const processedResults = [];
      
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const progress = ((i + 1) / selectedFiles.length) * 100;
        setUploadProgress(progress);
        
        // Validate file
        try {
          validateFile(file, file.type.startsWith('video/') ? 'video' : 'image');
        } catch (validationError) {
          throw new Error(`${file.name}: ${validationError.message}`);
        }

        let result;
        
        // Process based on current tool
        switch (activeTool) {
          case 'convert':
            result = await realAPI.convert(file, 'png', 0.9);
            break;
          case 'resize':
            result = await realAPI.resize(file, 800, 600, true);
            break;
          case 'rotate':
            result = await realAPI.rotate(file, 90);
            break;
          case 'add-text':
            result = await realAPI.addText(file, 'Sample Text', {
              fontSize: 30,
              color: '#ffffff',
              x: null, // center
              y: null  // center
            });
            break;
          case 'video-to-gif':
            if (file.type.startsWith('video/')) {
              result = await realAPI.videoToGif(file, { frameCount: 10 });
            } else {
              throw new Error('Video file required for video to GIF conversion');
            }
            break;
          case 'split-gif':
            if (file.type === 'image/gif') {
              result = await realAPI.splitGif(file);
            } else {
              throw new Error('GIF file required for splitting');
            }
            break;
          default:
            result = await realAPI.convert(file, 'png', 0.9);
        }
        
        processedResults.push({
          originalName: file.name,
          processedFile: result.file,
          downloadUrl: result.url,
          type: activeTool
        });
      }
      
      setResults(processedResults);
      setUploadProgress(100);
      progressNotification.close();
      NotificationService.success(`${processedResults.length} file(s) processed successfully!`);
      
    } catch (err) {
      console.error('Local processing error:', err);
      progressNotification.close();
      setError(err.message);
      NotificationService.error('Processing Failed', err.message);
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  const renderToolInterface = () => {
  if (activeTool === 'home') {
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
                      if (tool.id === 'enhanced-gif-creator') {
                        setShowEnhancedGifCreator(true);
                      } else if (tool.id === 'api-test') {
                        setShowApiTest(true);
                      } else {
                        setCurrentTool(tool.id);
                      }
                    }}
                  >
                    <div className="tool-icon">{tool.icon}</div>
                    <h4 className="tool-title">{tool.title}</h4>
                    <p className="tool-description">{tool.description}</p>
                    <div className="tool-formats">
                      {tool.formats.map(format => (
                        <span key={format} className="format-tag">{format}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      );
    }

  if (activeTool === 'webp') {
      return (
        <div className="specialized-tool">
          <div className="tool-header">
            <button 
              className="back-button" 
              onClick={() => setCurrentTool('home')}
            >
              ← Back to Tools
            </button>
            <h2>WebP Converter</h2>
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
            ← Back to Tools
          </button>
          <h2>{activeTool.charAt(0).toUpperCase() + activeTool.slice(1)} Tool</h2>
        </div>

        <div className="upload-area"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <div className="upload-content">
            <div className="upload-icon">📁</div>
            <h3>Upload Your Files</h3>
            <p>Drag and drop files here, or click to browse</p>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              multiple
              accept="image/*,video/*"
              style={{ display: 'none' }}
            />
            <button 
              className="browse-button"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
            >
              Browse Files
            </button>

            {selectedFiles.length > 0 && (
              <div className="selected-files">
                <h4>Selected Files:</h4>
                {selectedFiles.map((file, index) => (
                  <div key={index} className="file-item">
                    <span>{file.name}</span>
                    <span className="file-size">
                      {file.size ? `${(file.size / 1024 / 1024).toFixed(2)} GB` : 'URL'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="url-input-section">
          <h4>Or enter a URL:</h4>
          <div className="url-input-group">
            <input
              type="url"
              placeholder="https://example.com/image.jpg"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              disabled={loading}
            />
            <button onClick={handleUrlInput} disabled={loading}>
              Add URL
            </button>
          </div>
        </div>

        <div className="process-section">
          <button 
            className="process-button"
            onClick={processFiles}
            disabled={loading || (selectedFiles.length === 0 && !urlInput.trim())}
          >
            {loading ? 'Processing...' : `Process with ${activeTool}`}
          </button>
        </div>

        {results.length > 0 && (
          <div className="results-section">
            <h3>✅ Processing Complete! ({results.length} file{results.length > 1 ? 's' : ''})</h3>
            <div className="results-grid">
              {results.map((result, index) => (
                <div key={index} className="result-item">
                  <div className="result-preview">
                    {result.downloadUrl ? (
                      <img 
                        src={result.downloadUrl} 
                        alt={result.originalName}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'block';
                        }}
                      />
                    ) : (
                      <div className="file-icon">📄</div>
                    )}
                    <div style={{display: 'none'}}>
                      <div className="file-icon">📄</div>
                    </div>
                  </div>
                  <div className="result-info">
                    <h4>{result.processedFile?.name || 'Processed File'}</h4>
                    <p className="process-type">Tool: {result.type}</p>
                    <p className="file-size">
                      {result.processedFile?.size 
                        ? `${(result.processedFile.size / 1024 / 1024).toFixed(2)} GB` 
                        : ''
                      }
                    </p>
                    <button 
                      className="download-button"
                      onClick={() => downloadFile(
                        result.processedFile, 
                        result.processedFile?.name || `processed_${result.originalName}`
                      )}
                    >
                      📥 Download
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="results-actions">
              <button 
                className="clear-results-button"
                onClick={() => {
                  setResults([]);
                  // Clean up object URLs to prevent memory leaks
                  results.forEach(result => {
                    if (result.downloadUrl) {
                      URL.revokeObjectURL(result.downloadUrl);
                    }
                  });
                }}
              >
                🗑️ Clear Results
              </button>
            </div>
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
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }

        .category-title {
          color: #2d3748;
          margin-bottom: 20px;
          font-size: 1.5rem;
          font-weight: 600;
        }

        .tools-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px;
        }

        .tool-card {
          background: #f7fafc;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          padding: 20px;
          cursor: pointer;
          transition: all 0.3s ease;
          text-align: center;
        }

        .tool-card:hover {
          border-color: #4299e1;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(66, 153, 225, 0.15);
        }

        .tool-icon {
          font-size: 3rem;
          margin-bottom: 15px;
        }

        .tool-title {
          color: #2d3748;
          margin-bottom: 8px;
          font-size: 1.2rem;
          font-weight: 600;
        }

        .tool-description {
          color: #4a5568;
          margin-bottom: 15px;
          line-height: 1.5;
        }

        .tool-formats {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          justify-content: center;
        }

        .format-tag {
          background: #e2e8f0;
          color: #4a5568;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 0.8rem;
          font-weight: 500;
        }

        .specialized-tool, .tool-interface {
          background: white;
          border-radius: 12px;
          padding: 25px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }

        .tool-header {
          display: flex;
          align-items: center;
          margin-bottom: 25px;
          gap: 15px;
        }

        .back-button {
          background: #e2e8f0;
          border: none;
          border-radius: 6px;
          padding: 8px 16px;
          cursor: pointer;
          transition: background-color 0.2s;
          font-weight: 500;
          color: #2d3748;
        }

        .back-button:hover {
          background: #cbd5e0;
        }

        .tool-header h2 {
          color: #2d3748;
          margin: 0;
          font-size: 1.8rem;
        }

        .upload-area {
          border: 2px dashed #cbd5e0;
          border-radius: 8px;
          padding: 40px;
          text-align: center;
          margin-bottom: 25px;
          transition: border-color 0.3s ease;
        }

        .upload-area:hover {
          border-color: #4299e1;
        }

        .upload-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 15px;
        }

        .upload-icon {
          font-size: 3rem;
          opacity: 0.6;
        }

        .upload-content h3 {
          color: #2d3748;
          margin: 0;
        }

        .upload-content p {
          color: #718096;
          margin: 0;
        }

        .browse-button {
          background: #4299e1;
          color: white;
          border: none;
          border-radius: 6px;
          padding: 12px 24px;
          cursor: pointer;
          font-weight: 500;
          transition: background-color 0.2s;
        }

        .browse-button:hover:not(:disabled) {
          background: #3182ce;
        }

        .browse-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .selected-files {
          margin-top: 20px;
          text-align: left;
          width: 100%;
          max-width: 400px;
        }

        .selected-files h4 {
          color: #2d3748;
          margin-bottom: 10px;
        }

        .file-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          background: #f7fafc;
          border-radius: 4px;
          margin-bottom: 8px;
        }

        .file-size {
          color: #718096;
          font-size: 0.9rem;
        }

        .url-input-section {
          margin-bottom: 25px;
        }

        .url-input-section h4 {
          color: #2d3748;
          margin-bottom: 10px;
        }

        .url-input-group {
          display: flex;
          gap: 10px;
          max-width: 500px;
        }

        .url-input-group input {
          flex: 1;
          padding: 10px 12px;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          font-size: 1rem;
        }

        .url-input-group input:focus {
          outline: none;
          border-color: #4299e1;
        }

        .url-input-group button {
          background: #4299e1;
          color: white;
          border: none;
          border-radius: 6px;
          padding: 10px 20px;
          cursor: pointer;
          font-weight: 500;
        }

        .url-input-group button:hover:not(:disabled) {
          background: #3182ce;
        }

        .process-section {
          margin-bottom: 25px;
        }

        .process-button {
          background: #48bb78;
          color: white;
          border: none;
          border-radius: 8px;
          padding: 15px 30px;
          font-size: 1.1rem;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .process-button:hover:not(:disabled) {
          background: #38a169;
        }

        .process-button:disabled {
          background: #a0aec0;
          cursor: not-allowed;
        }

        .results-section {
          border-top: 1px solid #e2e8f0;
          padding-top: 25px;
        }

        .results-section h3 {
          color: #2d3748;
          margin-bottom: 20px;
        }

        .results-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
        }

        .result-item {
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          overflow: hidden;
          transition: transform 0.2s;
        }

        .result-item:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .result-preview {
          height: 150px;
          background: #f7fafc;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        .result-preview img {
          max-width: 100%;
          max-height: 100%;
          object-fit: cover;
        }

        .file-icon {
          font-size: 3rem;
          opacity: 0.6;
        }

        .result-info {
          padding: 15px;
        }

        .result-info h4 {
          color: #2d3748;
          margin-bottom: 5px;
          font-size: 1rem;
        }

        .result-info p {
          color: #718096;
          margin-bottom: 10px;
          font-size: 0.9rem;
        }

        .download-button {
          background: #4299e1;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 8px 16px;
          cursor: pointer;
          font-size: 0.9rem;
          font-weight: 500;
          width: 100%;
        }

        .download-button:hover {
          background: #3182ce;
        }

        .process-type {
          background: #e2e8f0;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 0.8rem !important;
          display: inline-block;
          margin-bottom: 8px !important;
        }

        .results-actions {
          text-align: center;
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid #e2e8f0;
        }

        .clear-results-button {
          background: #e53e3e;
          color: white;
          border: none;
          border-radius: 6px;
          padding: 10px 20px;
          cursor: pointer;
          font-size: 0.9rem;
          font-weight: 500;
        }

        .clear-results-button:hover {
          background: #c53030;
        }

        @media (max-width: 768px) {
          .container {
            padding: 0 15px;
          }
          
          .tools-grid {
            grid-template-columns: 1fr;
          }
          
          .url-input-group {
            flex-direction: column;
            gap: 10px;
          }
          
          .apply-button, .reset-button {
            width: 100%;
          }
        }
      `}</style>

      {/* Enhanced GIF Creator Modal */}
      {showEnhancedGifCreator && (
        <EnhancedGifCreator onClose={() => setShowEnhancedGifCreator(false)} />
      )}

      {/* API Test Component */}
      {showApiTest && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '20px',
            maxWidth: '800px',
            maxHeight: '600px',
            overflow: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2>API Integration Test</h2>
              <button 
                onClick={() => setShowApiTest(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer'
                }}
              >
                ✕
              </button>
            </div>
            <ApiTest />
          </div>
        </div>
      )}
    </div>
  );
}