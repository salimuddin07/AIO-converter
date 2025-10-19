import React, { useMemo, useState, useEffect } from 'react';
import { resolveDisplayUrl } from '../utils/unifiedAPI.js';

const toAbsoluteUrl = (path) => {
  if (!path) return null;
  return resolveDisplayUrl(path);
};

const formatSeconds = (value) => {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return '00:00';
  const totalSeconds = Math.max(0, Math.round(numericValue));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const mm = minutes.toString().padStart(2, '0');
  const ss = seconds.toString().padStart(2, '0');
  if (hours > 0) {
    return `${hours}:${mm}:${ss}`;
  }
  return `${minutes}:${ss}`;
};

const formatFileSize = (bytes) => {
  const numericValue = Number(bytes);
  if (!Number.isFinite(numericValue) || numericValue <= 0) return '—';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let value = numericValue;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  const precision = value < 10 && unitIndex > 0 ? 1 : 0;
  return `${value.toFixed(precision)} ${units[unitIndex]}`;
};

// Secure video component for Electron
const SecureVideo = ({ filePath, ...props }) => {
  const [videoUrl, setVideoUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!filePath) return;
    
    // Check if we're in Electron and need secure video loading
    if (typeof window !== 'undefined' && window.electronAPI && filePath.match(/\.(mp4|webm|avi|mov|mkv)$/i)) {
      console.log('🎥 Loading video securely:', filePath);
      
      window.electronAPI.serveVideo(filePath)
        .then(result => {
          if (result.success) {
            console.log('✅ Video loaded securely');
            setVideoUrl(result.dataUrl);
          } else {
            console.error('❌ Failed to load video:', result.error);
            setError(result.error);
          }
        })
        .catch(err => {
          console.error('❌ Error loading video:', err);
          setError(err.message);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      // Use direct URL for non-Electron or non-video files
      setVideoUrl(filePath);
      setLoading(false);
    }
  }, [filePath]);

  if (loading) {
    return (
      <div style={{ 
        width: '100%', 
        height: '120px', 
        backgroundColor: '#f0f0f0', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        borderRadius: '6px'
      }}>
        Loading video...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        width: '100%', 
        height: '120px', 
        backgroundColor: '#ffe6e6', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        borderRadius: '6px',
        color: '#d63031'
      }}>
        Error loading video: {error}
      </div>
    );
  }

  return (
    <video
      {...props}
      src={videoUrl}
    />
  );
};

const GifResultsSection = ({ frames, onDownloadZip, onEditAnimation }) => (
  <div className="split-results">
    <h2>Extracted Frames ({frames.length} frames)</h2>

    <div className="action-buttons" style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
      {onDownloadZip && (
        <button className="btn primary" onClick={onDownloadZip}>
          Download frames as ZIP
        </button>
      )}
      {onEditAnimation && (
        <button className="btn secondary" onClick={onEditAnimation}>
          Edit animation
        </button>
      )}
    </div>

    <div
      className="frames-grid"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
        gap: '15px',
        marginTop: '20px'
      }}
    >
      {frames.map((frame, index) => (
        <div
          key={frame.filename || index}
          className="frame-item"
          style={{
            border: '1px solid #ddd',
            borderRadius: '5px',
            padding: '10px',
            textAlign: 'center',
            backgroundColor: '#f8f8f8'
          }}
        >
          <div
            className="frame-number"
            style={{ fontSize: '12px', color: '#666', marginBottom: '5px', fontWeight: 'bold' }}
          >
            Frame {index + 1}
          </div>

          <img
            src={frame.previewUrl}
            alt={`Frame ${index + 1}`}
            style={{
              maxWidth: '100%',
              height: 'auto',
              border: '1px solid #ccc',
              borderRadius: '3px'
            }}
          />

          <div className="frame-info" style={{ fontSize: '11px', color: '#888', marginTop: '5px' }}>
            {frame.delay ? `${frame.delay}ms delay` : 'Frame extracted'}
            <br />
            {frame.width && frame.height ? `${frame.width}×${frame.height}px` : null}
          </div>

          <div className="frame-actions" style={{ marginTop: '5px' }}>
            <a
              href={frame.downloadUrl || frame.previewUrl}
              download={frame.filename}
              className="btn small"
              style={{ fontSize: '10px', padding: '3px 8px', textDecoration: 'none' }}
            >
              Download
            </a>
          </div>
        </div>
      ))}
    </div>

    <div
      className="info-box"
      style={{
        marginTop: '30px',
        padding: '15px',
        backgroundColor: '#f0f8ff',
        border: '1px solid #d0e7ff',
        borderRadius: '5px'
      }}
    >
      <h3>Tips</h3>
      <ul>
        <li>Right-click any frame and select "Save image as..." for fast grabbing.</li>
        <li>Use the ZIP option when you need the entire frame stack.</li>
        <li>Frame delays are shown in milliseconds (ms) to match playback timing.</li>
      </ul>
    </div>
  </div>
);

const VideoResultsSection = ({ segments, meta, onDownloadZip }) => {
  const videoMeta = meta?.metadata?.video || {};
  const audioMeta = meta?.metadata?.audio;
  const totalDuration = meta?.metadata?.duration ?? segments.reduce((acc, segment) => acc + (segment.duration || 0), 0);

  return (
    <div className="split-results">
      <h2>Video Segments ({segments.length} clips)</h2>

      <div className="action-buttons" style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        {onDownloadZip && (
          <button className="btn primary" onClick={onDownloadZip}>
            Download clips as ZIP
          </button>
        )}
      </div>

      <div
        className="segments-summary"
        style={{
          marginBottom: '20px',
          padding: '15px',
          backgroundColor: '#edf6ff',
          border: '1px solid #c8e1ff',
          borderRadius: '6px'
        }}
      >
        <h3 style={{ marginTop: 0 }}>Clip summary</h3>
        <p style={{ marginBottom: '0.75rem', color: '#355571' }}>
          Processed {formatSeconds(totalDuration)} of video into downloadable segments.
        </p>
        <ul style={{ margin: 0, paddingLeft: '1.25rem', color: '#355571' }}>
          <li>
            Resolution: {videoMeta.width && videoMeta.height ? `${videoMeta.width}×${videoMeta.height}px` : 'Unknown'}
          </li>
          <li>Video codec: {videoMeta.codec || 'Auto-detected'}</li>
          <li>Audio: {audioMeta ? `${audioMeta.codec || 'preserved'} (${audioMeta.channels || 2} ch)` : 'Muted'}</li>
        </ul>
      </div>

      <div
        className="segments-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: '18px'
        }}
      >
        {segments.map((segment, index) => (
          <div
            key={segment.filename || index}
            style={{
              border: '1px solid #d9e3f0',
              borderRadius: '8px',
              padding: '12px',
              backgroundColor: '#f7faff'
            }}
          >
            <header style={{ marginBottom: '10px' }}>
              <strong style={{ color: '#243b53' }}>{segment.name || `Clip ${index + 1}`}</strong>
            </header>

            <video
              controls
              src={segment.previewUrl || segment.downloadUrl}
              style={{
                width: '100%',
                borderRadius: '6px',
                backgroundColor: '#000'
              }}
              onError={(e) => {
                console.error('❌ Video load error:', e.target.error, 'for URL:', e.target.src);
              }}
              onLoadStart={() => {
                console.log('🎥 Video load started for:', segment.name);
              }}
              onLoadedMetadata={() => {
                console.log('✅ Video metadata loaded for:', segment.name);
              }}
            />

            <div style={{ fontSize: '12px', color: '#486581', marginTop: '10px', lineHeight: 1.5 }}>
              <div>
                <strong>Start:</strong> {segment.startTimeFormatted || formatSeconds(segment.startTime)}
              </div>
              <div>
                <strong>End:</strong> {segment.endTimeFormatted || formatSeconds(segment.endTime)}
              </div>
              <div>
                <strong>Duration:</strong> {segment.durationFormatted || formatSeconds(segment.duration)}
              </div>
              <div>
                <strong>Size:</strong> {formatFileSize(segment.size)} • <strong>Format:</strong> {(segment.format || '').toUpperCase() || 'MP4'}
              </div>
            </div>

            <div style={{ marginTop: '10px' }}>
              <a
                href={segment.downloadUrl || segment.previewUrl}
                download={segment.filename}
                className="btn small"
                style={{ fontSize: '11px', padding: '5px 10px', textDecoration: 'none' }}
              >
                Download clip
              </a>
            </div>
          </div>
        ))}
      </div>

      <div
        className="info-box"
        style={{
          marginTop: '30px',
          padding: '15px',
          backgroundColor: '#f0f8ff',
          border: '1px solid #d0e7ff',
          borderRadius: '5px'
        }}
      >
        <h3>Tips</h3>
        <ul>
          <li>Use the clip summary to keep reels under time limits like 60 seconds.</li>
          <li>Rename clips in the custom segment editor to keep exports organized.</li>
          <li>Segments are hosted temporarily—download or move them to cloud storage soon after processing.</li>
        </ul>
      </div>
    </div>
  );
};

export default function SplitResults({ type, items, meta, onEditAnimation, onDownloadZip }) {
  console.log('🔍 SplitResults received:', { type, items: items?.length || 0, meta });
  console.log('🔍 Raw items:', items);
  
  const normalizedItems = useMemo(
    () =>
      (items || []).map((item, index) => {
        const normalized = {
          ...item,
          previewUrl: toAbsoluteUrl(item.previewUrl || item.url),
          downloadUrl: toAbsoluteUrl(item.downloadUrl || item.url)
        };
        console.log(`🔍 Normalized item ${index}:`, item, '→', normalized);
        return normalized;
      }),
    [items]
  );

  console.log('🔍 Normalized items count:', normalizedItems.length);

  if (!normalizedItems.length) {
    console.log('🔍 SplitResults returning null - no items');
    return (
      <div style={{ margin: '20px 0', padding: '15px', backgroundColor: '#fff3cd', border: '1px solid #ffeaa7', borderRadius: '5px' }}>
        <p>⚠️ No results to display. Check console for debugging information.</p>
        <p><small>Received {items?.length || 0} items, type: {type}</small></p>
      </div>
    );
  }

  if (type === 'video') {
    return <VideoResultsSection segments={normalizedItems} meta={meta} onDownloadZip={onDownloadZip} />;
  }

  return <GifResultsSection frames={normalizedItems} onDownloadZip={onDownloadZip} onEditAnimation={onEditAnimation} />;
}
