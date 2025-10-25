import React, { useState, useEffect, useMemo } from 'react';
import { resolveDisplayUrl, api as realAPI } from '../utils/unifiedAPI.js';
import SplitResults from './SplitResults';

export default function FrameSplitter() {
  const SUPPORTED_VIDEO_TYPES = useMemo(() => ['mp4', 'mov', 'avi', 'webm', 'mkv', 'flv', 'wmv', 'm4v'], []);

  const [activeType, setActiveType] = useState('video'); // 'video' or 'gif'
  const [file, setFile] = useState(null);
  const [url, setUrl] = useState('');
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [splitData, setSplitData] = useState(null);
  
  // Frame extraction options
  const [frameOptions, setFrameOptions] = useState({
    format: 'png', // png, jpg, webp
    quality: 'high', // high, medium, low
    skipDuplicates: false,
    maxFrames: 0, // 0 = unlimited
    frameRate: 0, // 0 = original, or specific fps
    createZip: true
  });

  // Processing status
  const [processingState, setProcessingState] = useState('idle');
  const [progress, setProgress] = useState(0);
  const [estimatedFrames, setEstimatedFrames] = useState(0);
  const [processedFrames, setProcessedFrames] = useState(0);
  const [duration, setDuration] = useState(0);

  const videoAcceptAttr = useMemo(() => SUPPORTED_VIDEO_TYPES.map(ext => `.${ext}`).join(','), [SUPPORTED_VIDEO_TYPES]);

  // Detect file type
  const detectFileType = (name = '', mimeType = '') => {
    const lowerMime = mimeType.toLowerCase();
    if (lowerMime.startsWith('video/')) return 'video';
    if (lowerMime === 'image/gif') return 'gif';
    
    const extension = name?.split('.').pop()?.toLowerCase() || '';
    if (SUPPORTED_VIDEO_TYPES.includes(extension)) return 'video';
    if (extension === 'gif') return 'gif';
    
    return null;
  };

  // Analyze media duration and estimate frames
  const analyzeMedia = async (file) => {
    try {
      if (activeType === 'video') {
        const video = document.createElement('video');
        video.preload = 'metadata';
        
        video.onloadedmetadata = () => {
          const dur = Math.floor(video.duration);
          setDuration(dur);
          // Estimate frames at 30fps
          const estimated = Math.floor(dur * 30);
          setEstimatedFrames(estimated);
          window.URL.revokeObjectURL(video.src);
        };
        
        video.src = URL.createObjectURL(file);
      } else if (activeType === 'gif') {
        // For GIF, we'll estimate based on file size (rough approximation)
        const sizeInMB = file.size / (1024 * 1024);
        const estimatedGifFrames = Math.floor(sizeInMB * 20); // Rough estimate
        setEstimatedFrames(Math.max(10, estimatedGifFrames));
        setDuration(estimatedGifFrames / 10); // Assume 10fps average
      }
    } catch (err) {
      console.warn('Could not analyze media:', err);
    }
  };

  // File handling
  const handleFileChange = (event) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    const detectedType = detectFileType(selectedFile.name, selectedFile.type);
    if (detectedType) {
      setActiveType(detectedType);
      setFile(selectedFile);
      setUrl('');
      setSplitData(null);
      setError('');
      analyzeMedia(selectedFile);
    } else {
      setError('Please select a valid video or GIF file');
    }
  };

  const handleUrlChange = (event) => {
    const value = event.target.value;
    setUrl(value);
    setFile(null);
    setSplitData(null);
    setError('');
  };

  // Drag and drop
  const handleDragOver = (event) => {
    event.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    setDragging(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragging(false);

    const droppedFile = event.dataTransfer?.files?.[0];
    if (!droppedFile) return;

    const detectedType = detectFileType(droppedFile.name, droppedFile.type);
    if (detectedType) {
      setActiveType(detectedType);
      setFile(droppedFile);
      setUrl('');
      setSplitData(null);
      setError('');
      analyzeMedia(droppedFile);
    } else {
      setError('Please drop a valid video or GIF file');
    }
  };

  // Format utilities
  const formatTime = (seconds) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}h ${m}m ${s}s`;
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat().format(num);
  };

  // Progress simulation
  useEffect(() => {
    let interval;
    if (processingState === 'extracting') {
      interval = setInterval(() => {
        setProgress(prev => {
          const newProgress = Math.min(prev + 2, 95);
          setProcessedFrames(Math.floor((newProgress / 100) * estimatedFrames));
          return newProgress;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [processingState, estimatedFrames]);

  // Main extraction function
  const handleExtractFrames = async (event) => {
    event.preventDefault();

    if (!file && !url) {
      setError('Please select a file or enter a URL');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setProcessingState('analyzing');
      setProgress(0);
      setProcessedFrames(0);

      // Simulate analysis
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setProcessingState('extracting');

      const options = {
        format: frameOptions.format,
        quality: frameOptions.quality,
        skipDuplicates: frameOptions.skipDuplicates,
        maxFrames: frameOptions.maxFrames || undefined,
        frameRate: frameOptions.frameRate || undefined,
        createZip: frameOptions.createZip
      };

      let result;
      if (activeType === 'video') {
        if (file) {
          result = await realAPI.extractVideoFrames(file, options);
        } else {
          result = await realAPI.extractVideoFramesFromUrl(url, options);
        }
      } else {
        if (file) {
          result = await realAPI.splitGif(file, { 
            ...options, 
            skipDuplicates: frameOptions.skipDuplicates,
            createZip: frameOptions.createZip 
          });
        } else {
          result = await realAPI.splitGifFromUrl(url, { 
            ...options,
            skipDuplicates: frameOptions.skipDuplicates,
            createZip: frameOptions.createZip 
          });
        }
      }

      setProgress(100);
      setProcessingState('complete');

      const items = activeType === 'video' 
        ? result.frames || []
        : result.frames || [];

      setSplitData({
        type: 'frames',
        originalType: activeType,
        jobId: result.jobId,
        items,
        zipUrl: result.zipUrl,
        meta: result
      });

    } catch (err) {
      console.error('Frame extraction error:', err);
      setError(err.message || 'Frame extraction failed');
      setProcessingState('idle');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-content">
        <h1>🎞️ Frame Splitter</h1>
        <p>Extract every frame from videos and GIFs into individual image files with advanced options.</p>

        {/* File Upload Section */}
        <form
          className="form"
          onSubmit={handleExtractFrames}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <fieldset>
            <legend>📁 Media Input</legend>

            <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                className={`btn ${activeType === 'video' ? 'primary' : 'secondary'}`}
                onClick={() => setActiveType('video')}
              >
                📹 Video Frames
              </button>
              <button
                type="button"
                className={`btn ${activeType === 'gif' ? 'primary' : 'secondary'}`}
                onClick={() => setActiveType('gif')}
              >
                🎭 GIF Frames
              </button>
            </div>

            <p>
              <label htmlFor="media-file">
                Choose, paste, or drag & drop a {activeType === 'video' ? 'video' : 'GIF'} file:
              </label><br />
              <input
                type="file"
                id="media-file"
                name="media-file"
                accept={activeType === 'video' ? videoAcceptAttr : '.gif'}
                className={`up-input ${dragging ? 'drag-active' : ''}`}
                onChange={handleFileChange}
              />
            </p>

            <p>
              <label htmlFor="media-url">Or enter a direct {activeType === 'video' ? 'video' : 'GIF'} URL:</label><br />
              <input
                className="text"
                id="media-url"
                name="media-url"
                placeholder={`https://example.com/${activeType === 'video' ? 'video.mp4' : 'animation.gif'}`}
                value={url}
                onChange={handleUrlChange}
              />
            </p>

            {/* Media Info */}
            {(duration > 0 || estimatedFrames > 0) && (
              <div className="media-info" style={{
                padding: '1rem',
                backgroundColor: '#f8f9fa',
                border: '1px solid #dee2e6',
                borderRadius: '8px',
                marginBottom: '1rem'
              }}>
                {duration > 0 && (
                  <p style={{ margin: '0 0 0.5rem 0', color: '#495057' }}>
                    📊 <strong>Duration:</strong> {formatTime(duration)}
                  </p>
                )}
                {estimatedFrames > 0 && (
                  <p style={{ margin: '0', color: '#495057' }}>
                    🎞️ <strong>Estimated Frames:</strong> {formatNumber(estimatedFrames)}
                  </p>
                )}
              </div>
            )}
          </fieldset>

          {/* Frame Options */}
          <fieldset>
            <legend>⚙️ Frame Options</legend>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div>
                <label>Output Format:</label>
                <select 
                  value={frameOptions.format} 
                  onChange={(e) => setFrameOptions(prev => ({ ...prev, format: e.target.value }))}
                  className="text"
                  style={{ width: '100%' }}
                >
                  <option value="png">PNG (lossless)</option>
                  <option value="jpg">JPG (smaller size)</option>
                  <option value="webp">WebP (modern)</option>
                </select>
              </div>
              
              <div>
                <label>Quality:</label>
                <select 
                  value={frameOptions.quality} 
                  onChange={(e) => setFrameOptions(prev => ({ ...prev, quality: e.target.value }))}
                  className="text"
                  style={{ width: '100%' }}
                >
                  <option value="high">High (best quality)</option>
                  <option value="medium">Medium (balanced)</option>
                  <option value="low">Low (faster)</option>
                </select>
              </div>

              {activeType === 'video' && (
                <div>
                  <label>Frame Rate (FPS):</label>
                  <select 
                    value={frameOptions.frameRate} 
                    onChange={(e) => setFrameOptions(prev => ({ ...prev, frameRate: parseInt(e.target.value) }))}
                    className="text"
                    style={{ width: '100%' }}
                  >
                    <option value="0">Original (all frames)</option>
                    <option value="1">1 FPS (every second)</option>
                    <option value="5">5 FPS (every 0.2s)</option>
                    <option value="10">10 FPS (every 0.1s)</option>
                    <option value="30">30 FPS (smooth)</option>
                  </select>
                </div>
              )}

              <div>
                <label>Max Frames (0 = unlimited):</label>
                <input
                  type="number"
                  min="0"
                  max="10000"
                  value={frameOptions.maxFrames}
                  onChange={(e) => setFrameOptions(prev => ({ ...prev, maxFrames: parseInt(e.target.value) || 0 }))}
                  className="text"
                  style={{ width: '100%' }}
                  placeholder="Unlimited"
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  checked={frameOptions.skipDuplicates}
                  onChange={(e) => setFrameOptions(prev => ({ ...prev, skipDuplicates: e.target.checked }))}
                />
                Skip duplicate frames
              </label>
              
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  checked={frameOptions.createZip}
                  onChange={(e) => setFrameOptions(prev => ({ ...prev, createZip: e.target.checked }))}
                />
                Create ZIP archive
              </label>
            </div>
          </fieldset>

          {/* Processing Status */}
          {processingState !== 'idle' && (
            <fieldset>
              <legend>🔄 Extraction Progress</legend>
              
              <div className="processing-status">
                {processingState === 'analyzing' && (
                  <div style={{ padding: '1rem', backgroundColor: '#e3f2fd', borderRadius: '8px' }}>
                    <p style={{ margin: '0', fontWeight: 'bold', color: '#1976d2' }}>
                      🔍 Analyzing {activeType}...
                    </p>
                  </div>
                )}
                
                {processingState === 'extracting' && (
                  <div style={{ padding: '1rem', backgroundColor: '#f3e5f5', borderRadius: '8px' }}>
                    <p style={{ margin: '0 0 1rem 0', fontWeight: 'bold', color: '#7b1fa2' }}>
                      🎞️ Extracting frames... ({formatNumber(processedFrames)} / {formatNumber(estimatedFrames)})
                    </p>
                    
                    <div className="progress-bar" style={{
                      width: '100%',
                      height: '24px',
                      backgroundColor: '#e0e0e0',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      margin: '1rem 0',
                      border: '1px solid #bdbdbd'
                    }}>
                      <div 
                        className="progress-fill"
                        style={{
                          width: `${progress}%`,
                          height: '100%',
                          background: 'linear-gradient(90deg, #ff6b6b 0%, #feca57 50%, #48dbfb 100%)',
                          transition: 'width 0.5s ease',
                          borderRadius: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontWeight: 'bold',
                          fontSize: '0.9rem'
                        }}
                      >
                        {progress > 10 ? `${progress}%` : ''}
                      </div>
                    </div>
                    
                    <p style={{ margin: '0', textAlign: 'center', color: '#666' }}>
                      Extracting frames at {frameOptions.format.toUpperCase()} quality
                    </p>
                  </div>
                )}
                
                {processingState === 'complete' && (
                  <div style={{ padding: '1rem', backgroundColor: '#e8f5e8', borderRadius: '8px' }}>
                    <p style={{ margin: '0', fontWeight: 'bold', color: '#2e7d32' }}>
                      ✅ Frame extraction complete! All frames are ready for download.
                    </p>
                  </div>
                )}
              </div>
            </fieldset>
          )}

          {error && (
            <div className="error-message" style={{ 
              color: 'red', 
              padding: '1rem', 
              border: '1px solid red', 
              borderRadius: '4px',
              backgroundColor: '#ffebee',
              marginBottom: '1rem'
            }}>
              ❌ {error}
            </div>
          )}

          <p>
            <input
              type="submit"
              className="btn primary"
              value={loading ? 'Extracting Frames...' : `Extract ${activeType === 'video' ? 'Video' : 'GIF'} Frames`}
              disabled={loading || processingState !== 'idle'}
            />
          </p>

          <p className="hint">
            {activeType === 'video' 
              ? 'Extract every frame from videos for analysis, animation, or thumbnails.'
              : 'Extract all frames from animated GIFs for editing or analysis.'
            }
          </p>
        </form>

        {/* Results */}
        {splitData && (
          <SplitResults
            splitData={splitData}
            onZipDownload={() => {
              if (splitData?.zipUrl) {
                const url = resolveDisplayUrl(splitData.zipUrl);
                if (url) window.open(url, '_blank', 'noopener');
              }
            }}
          />
        )}
      </div>
    </div>
  );
}