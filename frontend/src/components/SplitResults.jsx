import React from 'react';

export default function SplitResults({ frames, onEditAnimation, onDownloadZip }) {
  if (!frames || frames.length === 0) return null;

  return (
    <div className="split-results">
      <h2>Extracted Frames ({frames.length} frames)</h2>
      
      <div className="action-buttons" style={{ marginBottom: '20px' }}>
        <button 
          className="btn primary" 
          onClick={onDownloadZip}
          style={{ marginRight: '10px' }}
        >
          Download frames as ZIP archive
        </button>
        <button 
          className="btn secondary" 
          onClick={onEditAnimation}
        >
          Edit animation
        </button>
      </div>
      
      <div className="frames-grid" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
        gap: '15px',
        marginTop: '20px'
      }}>
        {frames.map((frame, index) => (
          <div key={index} className="frame-item" style={{
            border: '1px solid #ddd',
            borderRadius: '5px',
            padding: '10px',
            textAlign: 'center',
            backgroundColor: '#f8f8f8'
          }}>
            <div className="frame-number" style={{
              fontSize: '12px',
              color: '#666',
              marginBottom: '5px',
              fontWeight: 'bold'
            }}>
              Frame {index + 1}
            </div>
            
            <img 
              src={frame.url} 
              alt={`Frame ${index + 1}`}
              style={{
                maxWidth: '100%',
                height: 'auto',
                border: '1px solid #ccc',
                borderRadius: '3px'
              }}
              onContextMenu={(e) => {
                // Allow right-click to save
              }}
            />
            
            <div className="frame-info" style={{
              fontSize: '11px',
              color: '#888',
              marginTop: '5px'
            }}>
              {frame.delay}ms delay<br/>
              {frame.width}×{frame.height}px
            </div>
            
            <div className="frame-actions" style={{ marginTop: '5px' }}>
              <a 
                href={frame.url} 
                download={frame.filename}
                className="btn small"
                style={{
                  fontSize: '10px',
                  padding: '3px 8px',
                  textDecoration: 'none'
                }}
              >
                Download
              </a>
            </div>
          </div>
        ))}
      </div>
      
      <div className="info-box" style={{
        marginTop: '30px',
        padding: '15px',
        backgroundColor: '#f0f8ff',
        border: '1px solid #d0e7ff',
        borderRadius: '5px'
      }}>
        <h3>Tips:</h3>
        <ul>
          <li>Right-click any frame and select "Save image as..." to download individually</li>
          <li>Use "Download frames as ZIP archive" to get all frames at once</li>
          <li>Click "Edit animation" to modify frame order and timing</li>
          <li>Frame delays are shown in milliseconds (ms)</li>
        </ul>
      </div>
    </div>
  );
}
