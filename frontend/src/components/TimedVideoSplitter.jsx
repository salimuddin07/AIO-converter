import React, { useState, useEffect, useMemo } from 'react';
import { resolveDisplayUrl, api as realAPI } from '../utils/unifiedAPI.js';
import SplitResults from './SplitResults';

const MIN_SEGMENT_DURATION_SECONDS = 1;

export default function TimedVideoSplitter() {
  const SUPPORTED_VIDEO_TYPES = useMemo(() => ['mp4', 'mov', 'avi', 'webm', 'mkv', 'flv', 'wmv', 'm4v'], []);

  const [videoFile, setVideoFile] = useState(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [videoDuration, setVideoDuration] = useState(0);
  const [timeSegments, setTimeSegments] = useState([
    { id: 1, name: 'Segment 1', startTime: '00:00:00', endTime: '00:00:30' }
  ]);
  const [videoOptions, setVideoOptions] = useState({
    createZip: true,
    outputFormat: 'mp4',
    quality: 'medium',
    preserveAudio: true
  });
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [splitData, setSplitData] = useState(null);
  
  // Countdown and progress states
  const [processingState, setProcessingState] = useState('idle'); // 'idle', 'analyzing', 'splitting', 'complete'
  const [estimatedTime, setEstimatedTime] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [progress, setProgress] = useState(0);
  const [currentSegment, setCurrentSegment] = useState(0);

  const videoAcceptAttr = useMemo(() => SUPPORTED_VIDEO_TYPES.map((ext) => `.${ext}`).join(','), [SUPPORTED_VIDEO_TYPES]);

  // Time conversion utilities
  const timeToSeconds = (timeString) => {
    const parts = timeString.split(':').map(Number);
    if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else if (parts.length === 2) {
      return parts[0] * 60 + parts[1];
    }
    return parts[0] || 0;
  };

  const secondsToTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const formatTime = (seconds) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}h ${m}m ${s}s`;
  };

  // Video file handling
  const handleFileChange = (event) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    setVideoFile(selectedFile);
    setVideoUrl('');
    setSplitData(null);
    setError('');
    analyzeVideoDuration(selectedFile);
  };

  const handleUrlChange = (event) => {
    const value = event.target.value;
    setVideoUrl(value);
    setVideoFile(null);
    setSplitData(null);
    setError('');
  };

  const analyzeVideoDuration = async (file) => {
    try {
      const video = document.createElement('video');
      video.preload = 'metadata';
      
      video.onloadedmetadata = () => {
        setVideoDuration(Math.floor(video.duration));
        window.URL.revokeObjectURL(video.src);
      };
      
      video.src = URL.createObjectURL(file);
    } catch (err) {
      console.warn('Could not analyze video duration:', err);
    }
  };

  // Drag and drop handlers
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

    setVideoFile(droppedFile);
    setVideoUrl('');
    setSplitData(null);
    setError('');
    analyzeVideoDuration(droppedFile);
  };

  // Time segment management
  const addTimeSegment = () => {
    const newId = Math.max(...timeSegments.map(s => s.id)) + 1;
    const lastSegment = timeSegments[timeSegments.length - 1];
    const startTime = lastSegment ? lastSegment.endTime : '00:00:00';
    const startSeconds = timeToSeconds(startTime);
    const endSeconds = Math.min(startSeconds + 30, videoDuration);
    
    setTimeSegments([...timeSegments, {
      id: newId,
      name: `Segment ${newId}`,
      startTime: startTime,
      endTime: secondsToTime(endSeconds)
    }]);
  };

  const removeTimeSegment = (id) => {
    if (timeSegments.length > 1) {
      setTimeSegments(timeSegments.filter(seg => seg.id !== id));
    }
  };

  const updateTimeSegment = (id, field, value) => {
    setTimeSegments(timeSegments.map(seg => 
      seg.id === id ? { ...seg, [field]: value } : seg
    ));
  };

  // Countdown timer effect
  useEffect(() => {
    let interval;
    if (countdown > 0 && processingState === 'splitting') {
      interval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            setProgress(prev_progress => Math.min(prev_progress + 20, 100));
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [countdown, processingState]);

  // Estimate processing time based on video duration and segments
  const estimateProcessingTime = () => {
    const totalDuration = timeSegments.reduce((sum, seg) => {
      return sum + (timeToSeconds(seg.endTime) - timeToSeconds(seg.startTime));
    }, 0);
    
    // Rough estimate: 2 seconds per minute of video content
    const baseTime = Math.max(10, Math.ceil(totalDuration / 30));
    const segmentMultiplier = timeSegments.length * 2;
    return baseTime + segmentMultiplier;
  };

  // Validate time segments
  const validateSegments = () => {
    const errors = [];
    
    timeSegments.forEach((seg, index) => {
      const startSeconds = timeToSeconds(seg.startTime);
      const endSeconds = timeToSeconds(seg.endTime);
      
      if (endSeconds <= startSeconds) {
        errors.push(`Segment ${index + 1}: End time must be after start time`);
      }
      
      if (endSeconds - startSeconds < MIN_SEGMENT_DURATION_SECONDS) {
        errors.push(`Segment ${index + 1}: Duration must be at least ${MIN_SEGMENT_DURATION_SECONDS} second`);
      }
      
      if (videoDuration > 0 && endSeconds > videoDuration) {
        errors.push(`Segment ${index + 1}: End time exceeds video duration (${formatTime(videoDuration)})`);
      }
    });
    
    return errors;
  };

  // Main split function with countdown
  const handleSplit = async (event) => {
    event.preventDefault();

    if (!videoFile && !videoUrl) {
      setError('Please choose a video file or enter a video URL');
      return;
    }

    const validationErrors = validateSegments();
    if (validationErrors.length > 0) {
      setError(validationErrors.join('; '));
      return;
    }

    try {
      setLoading(true);
      setError('');
      setProcessingState('analyzing');
      
      // Estimate processing time
      const estimated = estimateProcessingTime();
      setEstimatedTime(estimated);
      
      // Simulate analysis phase
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setProcessingState('splitting');
      setCountdown(estimated);
      setProgress(0);
      setCurrentSegment(0);

      // Convert time segments to API format
      const segments = timeSegments.map(seg => ({
        name: seg.name,
        startTime: timeToSeconds(seg.startTime),
        endTime: timeToSeconds(seg.endTime),
        duration: timeToSeconds(seg.endTime) - timeToSeconds(seg.startTime)
      }));

      const options = {
        createZip: videoOptions.createZip,
        outputFormat: videoOptions.outputFormat,
        quality: videoOptions.quality,
        preserveAudio: videoOptions.preserveAudio,
        segments: segments
      };

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          const newProgress = Math.min(prev + 5, 95);
          setCurrentSegment(Math.floor((newProgress / 100) * timeSegments.length));
          return newProgress;
        });
      }, 1000);

      const splitResult = videoFile 
        ? await realAPI.splitVideo(videoFile, options)
        : await realAPI.splitVideoFromUrl(videoUrl, options);

      clearInterval(progressInterval);
      setProgress(100);
      setProcessingState('complete');

      const items = splitResult.segments || [];
      setSplitData({
        type: 'video',
        jobId: splitResult.jobId,
        items,
        zipUrl: splitResult.zipUrl,
        meta: splitResult
      });

    } catch (err) {
      console.error('Split error:', err);
      setError(err.message || 'Split failed');
      setProcessingState('idle');
    } finally {
      setLoading(false);
      setCountdown(0);
    }
  };

  // Quick time presets
  const applyPreset = (presetType) => {
    let newSegments = [];
    
    switch (presetType) {
      case '30s':
        for (let i = 0; i < Math.ceil(videoDuration / 30); i++) {
          newSegments.push({
            id: i + 1,
            name: `Part ${i + 1}`,
            startTime: secondsToTime(i * 30),
            endTime: secondsToTime(Math.min((i + 1) * 30, videoDuration))
          });
        }
        break;
      case '1m':
        for (let i = 0; i < Math.ceil(videoDuration / 60); i++) {
          newSegments.push({
            id: i + 1,
            name: `Minute ${i + 1}`,
            startTime: secondsToTime(i * 60),
            endTime: secondsToTime(Math.min((i + 1) * 60, videoDuration))
          });
        }
        break;
      case '5m':
        for (let i = 0; i < Math.ceil(videoDuration / 300); i++) {
          newSegments.push({
            id: i + 1,
            name: `Part ${i + 1}`,
            startTime: secondsToTime(i * 300),
            endTime: secondsToTime(Math.min((i + 1) * 300, videoDuration))
          });
        }
        break;
    }
    
    setTimeSegments(newSegments);
  };

  return (
    <div className="page-container">
      <div className="page-content">
        <h1>🎬 Timed Video Splitter</h1>
        <p>Split videos at precise time intervals with real-time countdown and progress tracking.</p>

        {/* Video Upload Section */}
        <form
          className="form"
          onSubmit={handleSplit}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <fieldset>
            <legend>📁 Video Input</legend>

            <p>
              <label htmlFor="video-file">Choose, paste, or drag & drop a video file:</label><br />
              <input
                type="file"
                id="video-file"
                name="video-file"
                accept={videoAcceptAttr}
                className={`up-input ${dragging ? 'drag-active' : ''}`}
                onChange={handleFileChange}
              />
            </p>

            <p>
              <label htmlFor="video-url">Or enter a direct video URL:</label><br />
              <input
                className="text"
                id="video-url"
                name="video-url"
                placeholder="https://example.com/video.mp4"
                value={videoUrl}
                onChange={handleUrlChange}
              />
            </p>

            {videoDuration > 0 && (
              <div className="video-info">
                <p>📊 <strong>Video Duration:</strong> {formatTime(videoDuration)}</p>
              </div>
            )}
          </fieldset>

          {/* Time Segments Section */}
          <fieldset>
            <legend>⏱️ Time Segments</legend>
            
            {videoDuration > 0 && (
              <div className="preset-buttons" style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button type="button" onClick={() => applyPreset('30s')} className="btn">30s splits</button>
                <button type="button" onClick={() => applyPreset('1m')} className="btn">1min splits</button>
                <button type="button" onClick={() => applyPreset('5m')} className="btn">5min splits</button>
              </div>
            )}

            {timeSegments.map((segment, index) => (
              <div key={segment.id} className="time-segment" style={{ 
                border: '1px solid #ddd', 
                padding: '1rem', 
                marginBottom: '1rem', 
                borderRadius: '8px',
                backgroundColor: '#f9f9f9'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                  <div style={{ flex: '1', minWidth: '200px' }}>
                    <label>Segment Name:</label>
                    <input
                      type="text"
                      value={segment.name}
                      onChange={(e) => updateTimeSegment(segment.id, 'name', e.target.value)}
                      className="text"
                      style={{ width: '100%' }}
                    />
                  </div>
                  
                  <div>
                    <label>Start Time:</label>
                    <input
                      type="time"
                      value={segment.startTime}
                      onChange={(e) => updateTimeSegment(segment.id, 'startTime', e.target.value)}
                      className="text"
                      step="1"
                    />
                  </div>
                  
                  <div>
                    <label>End Time:</label>
                    <input
                      type="time"
                      value={segment.endTime}
                      onChange={(e) => updateTimeSegment(segment.id, 'endTime', e.target.value)}
                      className="text"
                      step="1"
                    />
                  </div>
                  
                  <div>
                    <span>Duration: {formatTime(timeToSeconds(segment.endTime) - timeToSeconds(segment.startTime))}</span>
                  </div>
                  
                  {timeSegments.length > 1 && (
                    <button 
                      type="button" 
                      onClick={() => removeTimeSegment(segment.id)}
                      className="btn danger"
                      style={{ padding: '0.5rem' }}
                    >
                      ❌
                    </button>
                  )}
                </div>
              </div>
            ))}

            <button type="button" onClick={addTimeSegment} className="btn">+ Add Time Segment</button>
          </fieldset>

          {/* Output Options */}
          <fieldset>
            <legend>⚙️ Output Options</legend>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
              <label>
                Output Format:
                <select 
                  value={videoOptions.outputFormat} 
                  onChange={(e) => setVideoOptions(prev => ({ ...prev, outputFormat: e.target.value }))}
                  className="text"
                >
                  <option value="mp4">MP4</option>
                  <option value="webm">WebM</option>
                  <option value="avi">AVI</option>
                </select>
              </label>
              
              <label>
                Quality:
                <select 
                  value={videoOptions.quality} 
                  onChange={(e) => setVideoOptions(prev => ({ ...prev, quality: e.target.value }))}
                  className="text"
                >
                  <option value="low">Low (faster)</option>
                  <option value="medium">Medium</option>
                  <option value="high">High (slower)</option>
                </select>
              </label>
              
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  checked={videoOptions.preserveAudio}
                  onChange={(e) => setVideoOptions(prev => ({ ...prev, preserveAudio: e.target.checked }))}
                />
                Preserve Audio
              </label>
              
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  checked={videoOptions.createZip}
                  onChange={(e) => setVideoOptions(prev => ({ ...prev, createZip: e.target.checked }))}
                />
                Create ZIP Archive
              </label>
            </div>
          </fieldset>

          {/* Processing Status */}
          {processingState !== 'idle' && (
            <fieldset>
              <legend>🔄 Processing Status</legend>
              
              <div className="processing-status">
                {processingState === 'analyzing' && (
                  <div>
                    <p>🔍 <strong>Analyzing video...</strong></p>
                    <p>Estimated processing time: {formatTime(estimatedTime)}</p>
                  </div>
                )}
                
                {processingState === 'splitting' && (
                  <div>
                    <p>✂️ <strong>Splitting video... ({currentSegment + 1}/{timeSegments.length} segments)</strong></p>
                    
                    {countdown > 0 && (
                      <div className="countdown-display" style={{
                        fontSize: '2rem',
                        fontWeight: 'bold',
                        color: '#4CAF50',
                        textAlign: 'center',
                        margin: '1rem 0'
                      }}>
                        ⏰ {formatTime(countdown)} remaining
                      </div>
                    )}
                    
                    <div className="progress-bar" style={{
                      width: '100%',
                      height: '20px',
                      backgroundColor: '#f0f0f0',
                      borderRadius: '10px',
                      overflow: 'hidden',
                      margin: '1rem 0'
                    }}>
                      <div 
                        className="progress-fill"
                        style={{
                          width: `${progress}%`,
                          height: '100%',
                          backgroundColor: '#4CAF50',
                          transition: 'width 0.3s ease',
                          borderRadius: '10px'
                        }}
                      />
                    </div>
                    
                    <p>Progress: {progress}% complete</p>
                  </div>
                )}
                
                {processingState === 'complete' && (
                  <div>
                    <p>✅ <strong>Split complete!</strong></p>
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
              backgroundColor: '#ffebee' 
            }}>
              ❌ {error}
            </div>
          )}

          <p>
            <input
              type="submit"
              className="btn primary"
              value={loading ? 'Processing...' : `Split Video (${timeSegments.length} segments)`}
              disabled={loading || processingState !== 'idle'}
            />
          </p>

          <p className="hint">
            Video uploads are automatically deleted 1 hour after processing.
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