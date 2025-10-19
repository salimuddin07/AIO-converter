import React, { useState, useEffect, useRef } from 'react';
import { resolveDisplayUrl, api as realAPI } from '../utils/unifiedAPI.js';

const VideoResults = ({ result, onBack }) => {
  // === Use API configuration ===
  
  const [isConverting, setIsConverting] = useState(false);
  const [convertResult, setConvertResult] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [settings, setSettings] = useState({
    startTime: 0,
    endTime: 5,
    width: '',
    height: '',
    fps: 10,
    quality: 90,
    method: 'ffmpeg'
  });
  const [videoInfo, setVideoInfo] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const videoRef = useRef(null);

  useEffect(() => {
    // Get video info when component mounts
    fetchVideoInfo();
  }, [result.videoId]);

  const fetchVideoInfo = async () => {
    try {
      const info = await realAPI.getVideoInfo(result.videoId);
      setVideoInfo(info);
      
      // Set default end time based on video duration
      if (info.duration) {
        setSettings(prev => ({
          ...prev,
          endTime: Math.min(5, info.duration),
          width: info.width || '',
          height: info.height || ''
        }));
      }
    } catch (error) {
      console.error('Error fetching video info:', error);
    }
  };

  const handleConvert = async () => {
    setIsConverting(true);
    
    try {
      const convertedResult = await realAPI.convertVideoToGif(result.videoId, settings);
      setConvertResult(convertedResult);
    } catch (error) {
      console.error('Conversion error:', error);
      const isNetworkError = error instanceof TypeError && (
        error.message === 'Failed to fetch' || error.message?.includes('NetworkError')
      );
      const message = isNetworkError
        ? 'Cannot reach the conversion service. Please make sure the backend server is running on http://localhost:3003.'
        : `Conversion failed: ${error.message}`;
      alert(message);
    } finally {
      setIsConverting(false);
    }
  };

  const useCurrentPosition = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const setStartTime = () => {
    setSettings(prev => ({ ...prev, startTime: Number(currentTime.toFixed(2)) }));
  };

  const setEndTime = () => {
    setSettings(prev => ({ ...prev, endTime: Number(currentTime.toFixed(2)) }));
  };

  const resolveApiPath = (path, fallback) => {
    if (!path) {
      return resolveDisplayUrl(fallback);
    }
    return resolveDisplayUrl(path);
  };

  const handleDownload = async (gifPath, filename, directUrl) => {
    try {
      setIsDownloading(true);
      
      // Check if we have a direct URL (like a blob URL) that we can download directly
      if (directUrl && (directUrl.startsWith('blob:') || directUrl.startsWith('data:'))) {
        const link = document.createElement('a');
        link.href = directUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }

      // For file paths, use unified API to handle download
      if (gifPath) {
        // Try to download using API endpoint
        const endpoint = `/api/video/download/${gifPath}`;
        const response = await realAPI.downloadFile(endpoint);
        
        if (response && response.blob) {
          const blobUrl = window.URL.createObjectURL(response.blob);
          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(blobUrl);
        } else {
          throw new Error('Download response is invalid');
        }
      } else {
        throw new Error('No download path provided');
      }
    } catch (error) {
      console.error('Download failed:', error);
      alert(`Download failed: ${error.message}. Please try again.`);
    } finally {
      setIsDownloading(false);
    }
  };

  const getMaxDuration = (fps) => {
    if (fps <= 5) return 60;
    if (fps <= 10) return 30;
    if (fps <= 15) return 20;
    if (fps <= 20) return 15;
    return 10;
  };

  const safeNumber = (value, fallback = 0) => {
    if (value === '' || value === null || value === undefined) {
      return fallback;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  const fpsValue = safeNumber(settings.fps, 10);
  const startTimeValue = safeNumber(settings.startTime, 0);
  const endTimeValue = safeNumber(settings.endTime, startTimeValue);
  const maxDurationAllowed = getMaxDuration(fpsValue);
  const endTimeMax = videoInfo
    ? Math.min(
        Number.isFinite(videoInfo.duration) ? videoInfo.duration : Infinity,
        startTimeValue + maxDurationAllowed
      )
    : startTimeValue + maxDurationAllowed;
  const conversionDisabled =
    isConverting || !Number.isFinite(endTimeValue) || endTimeValue <= startTimeValue;

  if (convertResult) {
    return (
      <div id="main">
        <h1>Video to GIF conversion result</h1>
        
        <div className="result-container">
          <div className="gif-preview">
            <img 
              src={resolveApiPath(convertResult.previewUrl, `/api/video/gif-preview/${convertResult.gifPath}`)} 
              alt="Converted GIF" 
              style={{ maxWidth: '100%', height: 'auto' }}
            />
          </div>
          
          <div className="result-info">
            <p><strong>File size:</strong> {convertResult.fileSize || `${(convertResult.fileSizeBytes / (1024 * 1024)).toFixed(2)} MB`}</p>
            <p><strong>Dimensions:</strong> {convertResult.width}×{convertResult.height}</p>
            <p><strong>Duration:</strong> {convertResult.duration}s</p>
            <p><strong>Frame rate:</strong> {convertResult.fps} fps</p>
            <p><strong>Frames:</strong> {convertResult.frames}</p>
          </div>
          
          <div className="download-section">
            <button 
              className="btn primary large"
              onClick={() => handleDownload(
                convertResult.gifPath,
                `converted-${Date.now()}.gif`,
                convertResult.downloadUrl
              )}
              disabled={isDownloading}
            >
              {isDownloading ? 'Preparing download...' : 'Download GIF'}
            </button>
            
            <div className="additional-tools">
              <h3>Additional tools</h3>
              <div className="tools-grid">
                <button className="btn secondary">Resize</button>
                <button className="btn secondary">Crop</button>
                <button className="btn secondary">Optimize</button>
                <button className="btn secondary">Add Text</button>
                <button className="btn secondary">Effects</button>
                <button className="btn secondary">Reverse</button>
              </div>
            </div>
          </div>
        </div>
        
        <button className="btn" onClick={onBack}>
          ← Convert another video
        </button>
      </div>
    );
  }

  return (
    <div id="main">
      <h1>Convert video to animated GIF</h1>
      
      <div className="video-converter-container">
        <div className="video-preview">
          <video 
            ref={videoRef}
            src={result.videoUrl || result.url || resolveDisplayUrl(`/api/video/preview/${result.videoId}`)}
            controls
            style={{ width: '100%', maxWidth: '600px' }}
            onTimeUpdate={() => setCurrentTime(videoRef.current?.currentTime || 0)}
          />
          
          <div className="video-controls">
            <button className="btn small" onClick={useCurrentPosition}>
              Use current video position
            </button>
            <span>Current time: {currentTime.toFixed(2)}s</span>
          </div>
        </div>
        
        <div className="conversion-settings">
          <h3>Conversion settings</h3>
          
          <div className="settings-grid">
            <div className="setting-group">
              <label>Start time (seconds):</label>
              <div className="time-input-group">
                <input 
                  type="number" 
                  step="0.1" 
                  min="0"
                  max={videoInfo?.duration ?? undefined}
                  value={settings.startTime === '' ? '' : startTimeValue}
                  onChange={(e) => {
                    const { value } = e.target;
                    setSettings(prev => ({
                      ...prev,
                      startTime: value === '' ? '' : Number(value)
                    }));
                  }}
                />
                <button className="btn small" onClick={setStartTime}>Set</button>
              </div>
            </div>
            
            <div className="setting-group">
              <label>End time (seconds):</label>
              <div className="time-input-group">
                <input 
                  type="number" 
                  step="0.1" 
                  min={startTimeValue}
                  max={Number.isFinite(endTimeMax) ? endTimeMax : undefined}
                  value={settings.endTime === '' ? '' : endTimeValue}
                  onChange={(e) => {
                    const { value } = e.target;
                    setSettings(prev => ({
                      ...prev,
                      endTime: value === '' ? '' : Number(value)
                    }));
                  }}
                />
                <button className="btn small" onClick={setEndTime}>Set</button>
              </div>
            </div>
            
            <div className="setting-group">
              <label>Size (width):</label>
              <input 
                type="number" 
                placeholder="Auto"
                value={settings.width}
                onChange={(e) => setSettings(prev => ({ ...prev, width: e.target.value }))}
              />
            </div>
            
            <div className="setting-group">
              <label>Size (height):</label>
              <input 
                type="number" 
                placeholder="Auto"
                value={settings.height}
                onChange={(e) => setSettings(prev => ({ ...prev, height: e.target.value }))}
              />
            </div>
            
            <div className="setting-group">
              <label>Frame rate (fps):</label>
              <select 
                value={String(settings.fps)}
                onChange={(e) => setSettings(prev => ({ ...prev, fps: parseInt(e.target.value) }))}
              >
                <option value="5">5 fps</option>
                <option value="10">10 fps</option>
                <option value="15">15 fps</option>
                <option value="20">20 fps</option>
                <option value="25">25 fps</option>
                <option value="30">30 fps</option>
              </select>
            </div>
            
            <div className="setting-group">
              <label>Method:</label>
              <select 
                value={settings.method}
                onChange={(e) => setSettings(prev => ({ ...prev, method: e.target.value }))}
              >
                <option value="ffmpeg">FFmpeg</option>
                <option value="gifsicle">Gifsicle</option>
              </select>
            </div>
          </div>
          
          <div className="duration-info">
            <p>
              Selected duration: {(Math.max(0, endTimeValue - startTimeValue)).toFixed(2)}s 
              (max {maxDurationAllowed}s at {fpsValue} fps)
            </p>
            {videoInfo && (
              <p>Video info: {videoInfo.duration?.toFixed(2)}s, {videoInfo.width}×{videoInfo.height}</p>
            )}
          </div>
          
          <button 
            className="btn primary large"
            onClick={handleConvert}
            disabled={conversionDisabled}
          >
            {isConverting ? 'Converting...' : 'Convert to GIF!'}
          </button>
        </div>
      </div>
      
      <div className="txt">
        <h3>Tips</h3>
        <ul>
          <li>Frame rate (fps) is the number of frames shown each second. Higher frame rates give smoother animation but increase file size.</li>
          <li>Duration limits depend on frame rate: 5 fps = 60s max, 10 fps = 30s max, etc.</li>
          <li>Use "Use current video position" to set accurate start and end times.</li>
          <li>Leave width/height empty for original size, or set one dimension to maintain aspect ratio.</li>
        </ul>
      </div>
      
      <button className="btn" onClick={onBack}>
        ← Upload different video
      </button>
    </div>
  );
};

export default VideoResults;
