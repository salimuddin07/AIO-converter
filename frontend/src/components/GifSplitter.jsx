import React, { useMemo, useState } from 'react';
import { resolveDisplayUrl, api as realAPI } from '../utils/unifiedAPI.js';
import SplitResults from './SplitResults';

const TOOL_GIF = 'gif';
const TOOL_VIDEO = 'video';
const MIN_SEGMENT_DURATION_SECONDS = 1;

export default function GifSplitter() {
  const SUPPORTED_VIDEO_TYPES = useMemo(() => ['mp4', 'mov', 'avi', 'webm', 'mkv', 'flv', 'wmv', 'm4v'], []);

  const [activeTool, setActiveTool] = useState(TOOL_GIF);
  const [gifFile, setGifFile] = useState(null);
  const [gifUrl, setGifUrl] = useState('');
  const [videoFile, setVideoFile] = useState(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [gifOptions, setGifOptions] = useState({
    skipDuplicates: false,
    createZip: true
  });
  const [videoOptions, setVideoOptions] = useState({
    createZip: true,
    outputFormat: 'mp4',
    quality: 'medium',
    preserveAudio: true
  });
  const [segmentMode, setSegmentMode] = useState('duration');
  const [segmentMinutes, setSegmentMinutes] = useState('0');
  const [segmentSeconds, setSegmentSeconds] = useState('30');
  const [customSegmentsText, setCustomSegmentsText] = useState('0:00-0:30');
  const [dragging, setDragging] = useState(null);
  const [loadingTool, setLoadingTool] = useState(null);
  const [error, setError] = useState('');
  const [splitData, setSplitData] = useState(null);

  // New timing and progress states
  const [processingState, setProcessingState] = useState('idle'); // 'idle', 'analyzing', 'splitting', 'complete'
  const [estimatedTime, setEstimatedTime] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [progress, setProgress] = useState(0);
  const [currentSegment, setCurrentSegment] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);

  const videoAcceptAttr = useMemo(() => SUPPORTED_VIDEO_TYPES.map((ext) => `.${ext}`).join(','), [SUPPORTED_VIDEO_TYPES]);

  // Time formatting utilities
  const formatTime = (seconds) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}h ${m}m ${s}s`;
  };

  // Estimate processing time
  const estimateProcessingTime = () => {
    const segmentDuration = computeSegmentDurationSeconds();
    const estimatedSegments = videoDuration > 0 ? Math.ceil(videoDuration / segmentDuration) : 5;
    // Rough estimate: 2 seconds per minute of video content
    const baseTime = Math.max(10, Math.ceil(videoDuration / 30));
    const segmentMultiplier = estimatedSegments * 2;
    return baseTime + segmentMultiplier;
  };

  // Analyze video duration
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

  // Countdown timer effect
  React.useEffect(() => {
    let interval;
    if (countdown > 0 && processingState === 'splitting') {
      interval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            setProgress(prev_progress => Math.min(prev_progress + 10, 95));
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [countdown, processingState]);

  const detectToolFromName = (name = '', mimeType = '') => {
    const lowerMime = mimeType.toLowerCase();
    if (lowerMime.startsWith('video/')) {
      return TOOL_VIDEO;
    }

    const extension = name?.split('.').pop()?.toLowerCase?.() || '';
    if (SUPPORTED_VIDEO_TYPES.includes(extension)) {
      return TOOL_VIDEO;
    }
    if (extension === 'gif' || lowerMime === 'image/gif') {
      return TOOL_GIF;
    }
    return null;
  };

  const setFileForTool = (tool, file) => {
    if (!file) return;
    if (tool === TOOL_GIF) {
      setGifFile(file);
      setGifUrl('');
    } else if (tool === TOOL_VIDEO) {
      setVideoFile(file);
      setVideoUrl('');
      // Analyze video duration for timing estimates
      analyzeVideoDuration(file);
    }
    setSplitData(null);
    setError('');
    setProcessingState('idle');
    setProgress(0);
    setCountdown(0);
  };

  const handleFileChange = (tool) => (event) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    const detectedTool = detectToolFromName(selectedFile.name, selectedFile.type) || tool;
    setActiveTool(detectedTool);
    setFileForTool(detectedTool, selectedFile);
  };

  const handleUrlChange = (tool) => (event) => {
    const value = event.target.value;
    if (tool === TOOL_GIF) {
      setGifUrl(value);
      setGifFile(null);
    } else {
      setVideoUrl(value);
      setVideoFile(null);
    }
    setSplitData(null);
    setError('');
  };

  const handleDragOver = (tool) => (event) => {
    event.preventDefault();
    setDragging(tool);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    setDragging(null);
  };

  const handleDrop = (tool) => (event) => {
    event.preventDefault();
    setDragging(null);

    const droppedFile = event.dataTransfer?.files?.[0];
    if (!droppedFile) return;

    const detectedTool = detectToolFromName(droppedFile.name, droppedFile.type) || tool;
    if (detectedTool !== tool) {
      // Switch to the detected tool for convenience.
      setActiveTool(detectedTool);
    }
    setFileForTool(detectedTool, droppedFile);
  };

  const handlePaste = (event) => {
    if (event.clipboardData.files.length > 0) {
      const pastedFile = event.clipboardData.files[0];
      const detectedTool = detectToolFromName(pastedFile.name, pastedFile.type) || activeTool;
      setActiveTool(detectedTool);
      setFileForTool(detectedTool, pastedFile);
      return;
    }

    const pastedText = event.clipboardData.getData('Text');
    if (!pastedText || !pastedText.startsWith('http')) return;

    const detectedTool = detectToolFromName(pastedText) || activeTool;
    setActiveTool(detectedTool);
    if (detectedTool === TOOL_GIF) {
      setGifUrl(pastedText);
      setGifFile(null);
    } else {
      setVideoUrl(pastedText);
      setVideoFile(null);
    }
    setSplitData(null);
    setError('');
  };

  React.useEffect(() => {
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTool]);

  const computeSegmentDurationSeconds = () => {
    let minutes = Number(segmentMinutes) || 0;
    let seconds = Number(segmentSeconds) || 0;

    if (seconds >= 60) {
      minutes += Math.floor(seconds / 60);
      seconds = seconds % 60;
    }

    minutes = Math.max(0, minutes);
    seconds = Math.max(0, seconds);

    return minutes * 60 + seconds;
  };

  const parseTimestampToSeconds = (value, contextLabel) => {
    if (value === undefined || value === null || value === '') {
      throw new Error(`${contextLabel} is missing. Use a time like 0:30 or 00:00:30.`);
    }

    const raw = String(value).trim();
    if (!raw) {
      throw new Error(`${contextLabel} is missing. Use a time like 0:30 or 00:00:30.`);
    }

    if (/^\d+(\.\d+)?$/.test(raw)) {
      return Number(raw);
    }

    const parts = raw.split(':').map((part) => part.trim());
    if (parts.length === 0 || parts.length > 3) {
      throw new Error(`${contextLabel} must use HH:MM:SS or MM:SS format.`);
    }

    const numbers = parts.map((part) => {
      const numeric = Number(part);
      if (!Number.isFinite(numeric)) {
        throw new Error(`${contextLabel} contains an invalid number.`);
      }
      return numeric;
    });

    return numbers.reduce((total, current) => total * 60 + current, 0);
  };

  const parseCustomSegmentsInput = (input) => {
    const lines = (input || '')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    return lines.map((line, index) => {
      const [rangePart, labelPart] = line.split('|').map((part) => part.trim());
      const [start, end] = (rangePart || '').split('-').map((part) => part.trim());

      if (!start || !end) {
        throw new Error(`Line ${index + 1}: use START-END format like 0:30-1:00`);
      }

      const startSeconds = parseTimestampToSeconds(start, `Line ${index + 1} start time`);
      const endSeconds = parseTimestampToSeconds(end, `Line ${index + 1} end time`);

      if (endSeconds <= startSeconds) {
        throw new Error(`Line ${index + 1}: end time must be after start time.`);
      }

      if (endSeconds - startSeconds < MIN_SEGMENT_DURATION_SECONDS) {
        throw new Error(`Line ${index + 1}: each clip must be at least ${MIN_SEGMENT_DURATION_SECONDS} second long.`);
      }

      return {
        name: labelPart || `segment_${index + 1}`,
        startTime: startSeconds,
        endTime: endSeconds,
        duration: endSeconds - startSeconds
      };
    });
  };

  const runSplit = async (tool, requestFn) => {
    try {
      setLoadingTool(tool);
      setError('');
      
      // Add timing features for video splitting
      if (tool === TOOL_VIDEO) {
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

        // Simulate progress updates
        const progressInterval = setInterval(() => {
          setProgress(prev => {
            const newProgress = Math.min(prev + 3, 90);
            const segmentDuration = computeSegmentDurationSeconds();
            const estimatedSegments = videoDuration > 0 ? Math.ceil(videoDuration / segmentDuration) : 5;
            setCurrentSegment(Math.floor((newProgress / 100) * estimatedSegments));
            return newProgress;
          });
        }, 1500);

        const splitResult = await requestFn();

        clearInterval(progressInterval);
        setProgress(100);
        setProcessingState('complete');

        const items = splitResult.segments || [];
        const splitDataToSet = {
          type: tool,
          jobId: splitResult.jobId,
          items,
          zipUrl: splitResult.zipUrl,
          meta: splitResult
        };
        
        setSplitData(splitDataToSet);
      } else {
        // Regular GIF processing without timing features
        const splitResult = await requestFn();
        const items = splitResult.frames || [];
        
        const splitDataToSet = {
          type: tool,
          jobId: splitResult.jobId,
          items,
          zipUrl: splitResult.zipUrl,
          meta: splitResult
        };
        
        setSplitData(splitDataToSet);
      }
    } catch (err) {
      console.error('Split error:', err);
      setError(err.message || 'Split failed');
      setProcessingState('idle');
    } finally {
      setLoadingTool(null);
      setCountdown(0);
    }
  };

  const handleGifSubmit = async (event) => {
    event.preventDefault();

    if (!gifFile && !gifUrl) {
      setError('Please choose a GIF file or enter a GIF URL');
      return;
    }

    await runSplit(TOOL_GIF, async () => {
      const options = {
        skipDuplicates: gifOptions.skipDuplicates,
        createZip: gifOptions.createZip
      };

      if (gifFile) {
        return realAPI.splitGif(gifFile, options);
      }
      return realAPI.splitGifFromUrl(gifUrl, options);
    });
  };

  const handleVideoSubmit = async (event) => {
    event.preventDefault();

    if (!videoFile && !videoUrl) {
      setError('Please choose a video file or enter a video URL');
      return;
    }

    await runSplit(TOOL_VIDEO, async () => {
      const options = {
        createZip: videoOptions.createZip,
        outputFormat: videoOptions.outputFormat,
        quality: videoOptions.quality,
        preserveAudio: videoOptions.preserveAudio
      };

      if (segmentMode === 'duration') {
        const durationSeconds = computeSegmentDurationSeconds();
        if (!Number.isFinite(durationSeconds) || durationSeconds < MIN_SEGMENT_DURATION_SECONDS) {
          throw new Error('Segment length must be at least 1 second. Increase the minutes or seconds value.');
        }
        options.segmentDuration = durationSeconds;
      } else {
        const segments = parseCustomSegmentsInput(customSegmentsText);
        if (!segments.length) {
          throw new Error('Add at least one custom segment (format: start-end | optional name).');
        }
        options.segments = segments;
      }

      if (videoFile) {
        return realAPI.splitVideo(videoFile, options);
      }
      return realAPI.splitVideoFromUrl(videoUrl, options);
    });
  };

  const handleZipDownload = () => {
    if (!splitData?.zipUrl) return;
    const url = resolveDisplayUrl(splitData.zipUrl);
    if (url) {
      window.open(url, '_blank', 'noopener');
    }
  };

  const renderGifForm = () => (
    <form
      className="form"
      onSubmit={handleGifSubmit}
      onDragOver={handleDragOver(TOOL_GIF)}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop(TOOL_GIF)}
    >
      <fieldset>
        <legend>GIF splitter</legend>

        <p>
          <label htmlFor="gif-file">Choose, paste, or drag & drop a GIF file:</label><br />
          <input
            type="file"
            id="gif-file"
            name="gif-file"
            accept=".gif"
            className={`up-input ${dragging === TOOL_GIF ? 'drag-active' : ''}`}
            onChange={handleFileChange(TOOL_GIF)}
          />
        </p>

        <p>
          <label htmlFor="gif-url">Or enter a direct GIF URL:</label><br />
          <input
            className="text"
            id="gif-url"
            name="gif-url"
            placeholder="https://example.com/animation.gif"
            value={gifUrl}
            onChange={handleUrlChange(TOOL_GIF)}
          />
        </p>

        <fieldset style={{ marginBottom: '1.5rem' }}>
          <legend>GIF options</legend>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="checkbox"
                checked={gifOptions.skipDuplicates}
                onChange={(event) => setGifOptions((prev) => ({ ...prev, skipDuplicates: event.target.checked }))}
              />
              Skip duplicate frames
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="checkbox"
                checked={gifOptions.createZip}
                onChange={(event) => setGifOptions((prev) => ({ ...prev, createZip: event.target.checked }))}
              />
              Create ZIP archive when done
            </label>
          </div>
        </fieldset>

        <p>
          <input
            type="submit"
            className="btn primary"
            value={loadingTool === TOOL_GIF ? 'Processing…' : 'Split GIF'}
            disabled={loadingTool !== null}
          />
        </p>

        <p className="hint">
          GIF uploads are automatically deleted 1 hour after processing.
        </p>
      </fieldset>
    </form>
  );

  const renderVideoForm = () => (
    <form
      className="form"
      onSubmit={handleVideoSubmit}
      onDragOver={handleDragOver(TOOL_VIDEO)}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop(TOOL_VIDEO)}
    >
      <fieldset>
        <legend>Video splitter</legend>

        <p>
          <label htmlFor="video-file">Choose, paste, or drag & drop a video file:</label><br />
          <input
            type="file"
            id="video-file"
            name="video-file"
            accept={videoAcceptAttr}
            className={`up-input ${dragging === TOOL_VIDEO ? 'drag-active' : ''}`}
            onChange={handleFileChange(TOOL_VIDEO)}
          />
        </p>

        <p>
          <label htmlFor="video-url">Or enter a direct video URL:</label><br />
          <input
            className="text"
            id="video-url"
            name="video-url"
            placeholder="https://example.com/sample.mp4"
            value={videoUrl}
            onChange={handleUrlChange(TOOL_VIDEO)}
          />
        </p>

        {/* Video Info Display */}
        {videoDuration > 0 && (
          <div className="video-info" style={{
            padding: '1rem',
            backgroundColor: '#f8f9fa',
            border: '1px solid #dee2e6',
            borderRadius: '8px',
            marginBottom: '1rem'
          }}>
            <p style={{ margin: '0', fontWeight: 'bold', color: '#495057' }}>
              📊 Video Duration: {formatTime(videoDuration)}
            </p>
          </div>
        )}

        <fieldset style={{ marginBottom: '1.5rem' }}>
          <legend>Video options</legend>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
            <label>
              Output format
              <select
                value={videoOptions.outputFormat}
                onChange={(event) => setVideoOptions((prev) => ({ ...prev, outputFormat: event.target.value }))}
              >
                <option value="mp4">MP4 (H.264)</option>
                <option value="webm">WebM (VP9)</option>
              </select>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="checkbox"
                checked={videoOptions.preserveAudio}
                onChange={(event) => setVideoOptions((prev) => ({ ...prev, preserveAudio: event.target.checked }))}
              />
              Keep original audio
            </label>
            <label>
              Quality preset
              <select
                value={videoOptions.quality}
                onChange={(event) => setVideoOptions((prev) => ({ ...prev, quality: event.target.value }))}
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="checkbox"
                checked={videoOptions.createZip}
                onChange={(event) => setVideoOptions((prev) => ({ ...prev, createZip: event.target.checked }))}
              />
              Bundle clips into a ZIP
            </label>
          </div>
        </fieldset>

        <fieldset style={{ marginBottom: '1.5rem' }}>
          <legend>Segment plan</legend>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="radio"
                name="segment-mode"
                value="duration"
                checked={segmentMode === 'duration'}
                onChange={() => setSegmentMode('duration')}
              />
              Split into equal-length clips
            </label>

            {segmentMode === 'duration' && (
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginLeft: '1.5rem' }}>
                <label>
                  Minutes
                  <input
                    type="number"
                    min="0"
                    value={segmentMinutes}
                    onChange={(event) => setSegmentMinutes(event.target.value)}
                  />
                </label>
                <label>
                  Seconds
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={segmentSeconds}
                    onChange={(event) => setSegmentSeconds(event.target.value)}
                  />
                </label>
              </div>
            )}

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="radio"
                name="segment-mode"
                value="custom"
                checked={segmentMode === 'custom'}
                onChange={() => setSegmentMode('custom')}
              />
              Use custom timeline (start-end pairs)
            </label>

            {segmentMode === 'custom' && (
              <div style={{ marginLeft: '1.5rem', width: '100%' }}>
                <textarea
                  value={customSegmentsText}
                  onChange={(event) => setCustomSegmentsText(event.target.value)}
                  rows={4}
                  placeholder={'For multiple segments, add one per line:\n0:00-0:30 | First part\n0:30-1:00 | Second part\n1:00-1:30 | Third part\n\nFor auto-split, use equal-length mode instead.'}
                  style={{ width: '100%', fontFamily: 'inherit' }}
                />
                <p className="hint" style={{ marginTop: '0.5rem' }}>
                  <strong>Multiple segments:</strong> Add one segment per line. Use HH:MM:SS or MM:SS timestamps. Add an optional name after <code>|</code>.<br/>
                  <strong>Equal segments:</strong> Use "Split into equal-length clips" option above for automatic splitting.
                </p>
              </div>
            )}
          </div>
        </fieldset>

        {/* Processing Status Display */}
        {processingState !== 'idle' && (
          <fieldset style={{ marginBottom: '1.5rem' }}>
            <legend>🔄 Processing Status</legend>
            
            <div className="processing-status">
              {processingState === 'analyzing' && (
                <div style={{ padding: '1rem', backgroundColor: '#e3f2fd', borderRadius: '8px' }}>
                  <p style={{ margin: '0 0 0.5rem 0', fontWeight: 'bold', color: '#1976d2' }}>
                    🔍 Analyzing video...
                  </p>
                  <p style={{ margin: '0', color: '#424242' }}>
                    Estimated processing time: {formatTime(estimatedTime)}
                  </p>
                </div>
              )}
              
              {processingState === 'splitting' && (
                <div style={{ padding: '1rem', backgroundColor: '#f3e5f5', borderRadius: '8px' }}>
                  <p style={{ margin: '0 0 1rem 0', fontWeight: 'bold', color: '#7b1fa2' }}>
                    ✂️ Splitting video... ({currentSegment + 1} segments processed)
                  </p>
                  
                  {countdown > 0 && (
                    <div className="countdown-display" style={{
                      fontSize: '1.5rem',
                      fontWeight: 'bold',
                      color: '#4caf50',
                      textAlign: 'center',
                      margin: '1rem 0',
                      padding: '0.5rem',
                      backgroundColor: '#e8f5e8',
                      borderRadius: '8px'
                    }}>
                      ⏰ {formatTime(countdown)} remaining
                    </div>
                  )}
                  
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
                        background: 'linear-gradient(90deg, #4caf50 0%, #81c784 100%)',
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
                    Progress: {progress}% complete
                  </p>
                </div>
              )}
              
              {processingState === 'complete' && (
                <div style={{ padding: '1rem', backgroundColor: '#e8f5e8', borderRadius: '8px' }}>
                  <p style={{ margin: '0', fontWeight: 'bold', color: '#2e7d32' }}>
                    ✅ Split complete! Your video segments are ready for download.
                  </p>
                </div>
              )}
            </div>
          </fieldset>
        )}

        <p>
          <input
            type="submit"
            className="btn primary"
            value={loadingTool === TOOL_VIDEO ? 'Processing…' : 'Split video'}
            disabled={loadingTool !== null || processingState !== 'idle'}
          />
        </p>

        <p className="hint">
          Source uploads and generated clips are automatically removed about an hour after processing finishes.
        </p>
      </fieldset>
    </form>
  );

  return (
    <div id="main">
      <h1>GIF & video splitter</h1>

      <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <button
          type="button"
          className={`btn ${activeTool === TOOL_GIF ? 'primary' : 'secondary'}`}
          onClick={() => {
            setActiveTool(TOOL_GIF);
            setError('');
          }}
        >
          GIF splitter
        </button>
        <button
          type="button"
          className={`btn ${activeTool === TOOL_VIDEO ? 'primary' : 'secondary'}`}
          onClick={() => {
            setActiveTool(TOOL_VIDEO);
            setError('');
          }}
        >
          Video splitter
        </button>
      </div>

      <p style={{ color: '#555', marginBottom: '1.5rem' }}>
        Choose the workflow you need: break an animation into ready-to-download frames or carve a video into shareable clips with precise timing. Each splitter has its own upload slot and options so you can work on GIFs and videos independently.
      </p>

      {activeTool === TOOL_GIF ? renderGifForm() : renderVideoForm()}

      {error && (
        <div className="error" style={{ color: 'red', margin: '20px 0' }}>
          <h3>Error</h3>
          <p>{error}</p>
        </div>
      )}

      {(() => {
        console.log('🔍 Render check: splitData exists?', !!splitData);
        if (splitData) {
          console.log('🔍 Rendering SplitResults with:', { 
            type: splitData.type, 
            itemCount: splitData.items?.length || 0,
            hasZipUrl: !!splitData.zipUrl
          });
        }
        return splitData && (
          <SplitResults
            type={splitData.type}
            items={splitData.items}
            meta={splitData.meta}
            onDownloadZip={splitData.zipUrl ? handleZipDownload : undefined}
            onEditAnimation={splitData.type === TOOL_GIF ? () => alert('Animation editing coming soon!') : undefined}
          />
        );
      })()}

      <div className="txt" style={{ marginTop: '2.5rem' }}>
        <h2>Splitter workflows at a glance</h2>
        <p>
          Both tools extract every frame into downloadable images. Pick the workflow that matches your source file and follow the quick steps below.
        </p>

        <div
          style={{
            display: 'grid',
            gap: '1.5rem',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            marginTop: '1.5rem'
          }}
        >
          <div style={{ background: '#f7f9fc', border: '1px solid #dbe4f3', borderRadius: '8px', padding: '1.25rem' }}>
            <h3 style={{ marginTop: 0 }}>GIF splitter workflow</h3>
            <p style={{ color: '#4a5668' }}>Break an animated GIF into the individual frames.</p>
            <h4 style={{ marginBottom: '0.5rem' }}>How it works</h4>
            <ol style={{ paddingLeft: '1.25rem', marginBottom: '1rem', color: '#2c3748' }}>
              <li>Upload the GIF you want to dissect or paste any direct GIF URL.</li>
              <li>Choose whether to skip duplicate frames and enable automatic ZIP packaging.</li>
              <li>The splitter exports lossless PNG frames in playback order.</li>
              <li>Download individual frames or grab the full ZIP archive.</li>
            </ol>
            <h4 style={{ marginBottom: '0.5rem' }}>Pro tips</h4>
            <ul style={{ paddingLeft: '1.25rem', color: '#2c3748', margin: 0 }}>
              <li>Large GIFs can contain dozens of frames—use the preview grid filters to find the ones you need.</li>
              <li>Frame numbering mirrors the original animation timing for easy reassembly.</li>
            </ul>
          </div>

          <div style={{ background: '#f7f9fc', border: '1px solid #dbe4f3', borderRadius: '8px', padding: '1.25rem' }}>
            <h3 style={{ marginTop: 0 }}>Video splitter workflow</h3>
            <p style={{ color: '#4a5668' }}>Cut MP4, MOV, WEBM, AVI, MKV, and more into back-to-back clips sized for reels, shorts, and stories.</p>
            <h4 style={{ marginBottom: '0.5rem' }}>How it works</h4>
            <ol style={{ paddingLeft: '1.25rem', marginBottom: '1rem', color: '#2c3748' }}>
              <li>Upload a video file or provide a direct streaming URL.</li>
              <li>Pick a uniform clip length (minutes/seconds) or define custom start-end pairs.</li>
              <li>We render fresh video files for every segment and keep audio if you request it.</li>
              <li>Preview clips instantly, download favorites, or grab the full ZIP export.</li>
            </ol>
            <h4 style={{ marginBottom: '0.5rem' }}>Pro tips</h4>
            <ul style={{ paddingLeft: '1.25rem', color: '#2c3748', margin: 0 }}>
              <li>Set 0:30 or 0:45 clip lengths to stay within Instagram Reel and TikTok limits.</li>
              <li>Name segments (Intro, Hook, Outro) in the custom editor so the downloads stay organized.</li>
            </ul>
          </div>
        </div>

        <p style={{ marginTop: '1.75rem' }}>
          Need other converters? Check out the GIF maker, sprite sheet generator, or modern format tools from the navigation bar.
        </p>
      </div>
    </div>
  );
}
