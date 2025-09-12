import React, { useState, useRef, useCallback } from 'react';

const SUPPORTED = ['image/png','image/jpeg','image/gif','image/svg+xml','image/bmp','image/tiff','video/mp4','video/avi','video/mov','video/webm'];

export default function UploadArea({ onConvert, loading }) {
  const [files, setFiles] = useState([]);
  const [targetFormat, setTargetFormat] = useState('gif');
  
  // Individual frame controls
  const [frameDelays, setFrameDelays] = useState([]);
  const [enabledFrames, setEnabledFrames] = useState([]);
  
  // Advanced GIF options (like ezgif.com)
  const [gifOptions, setGifOptions] = useState({
    frameDelay: 20, // in 1/100 seconds like ezgif
    loop: 0, // 0 = infinite loop
    quality: 5,
    globalColormap: false,
    crossfade: false,
    crossfadeFrames: 10,
    crossfadeDelay: 6,
    noStack: false,
    keepFirst: false,
    skipFirst: false
  });
  
  // Video options
  const [videoOptions, setVideoOptions] = useState({
    frameRate: 10,
    quality: 'medium'
  });

  // Range controls
  const [rangeFrom, setRangeFrom] = useState(1);
  const [rangeTo, setRangeTo] = useState(5);

  const dropRef = useRef(null);

  const handleFiles = useCallback(list => {
    const arr = Array.from(list);
    const filtered = arr.filter(f => SUPPORTED.includes(f.type) || f.name.endsWith('.svg'));
    setFiles(prev => {
      const newFiles = [...prev, ...filtered];
      // Initialize frame controls
      setFrameDelays(new Array(newFiles.length).fill(20));
      setEnabledFrames(new Array(newFiles.length).fill(true));
      return newFiles;
    });
  }, []);

  function onDrop(e) {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  }

  function onDragOver(e) { 
    e.preventDefault(); 
  }

  function removeFile(idx) {
    setFiles(f => {
      const newFiles = f.filter((_, i) => i !== idx);
      setFrameDelays(delays => delays.filter((_, i) => i !== idx));
      setEnabledFrames(enabled => enabled.filter((_, i) => i !== idx));
      return newFiles;
    });
  }

  function duplicateFrame(idx) {
    const file = files[idx];
    setFiles(f => {
      const newFiles = [...f];
      newFiles.splice(idx + 1, 0, file);
      return newFiles;
    });
    
    setFrameDelays(delays => {
      const newDelays = [...delays];
      newDelays.splice(idx + 1, 0, delays[idx]);
      return newDelays;
    });
    
    setEnabledFrames(enabled => {
      const newEnabled = [...enabled];
      newEnabled.splice(idx + 1, 0, enabled[idx]);
      return newEnabled;
    });
  }

  function updateFrameDelay(idx, delay) {
    setFrameDelays(delays => {
      const newDelays = [...delays];
      newDelays[idx] = parseInt(delay) || 20;
      return newDelays;
    });
  }

  function toggleFrame(idx) {
    setEnabledFrames(enabled => {
      const newEnabled = [...enabled];
      newEnabled[idx] = !newEnabled[idx];
      return newEnabled;
    });
  }

  function setAllDelays() {
    const newDelay = parseInt(gifOptions.frameDelay) || 20;
    setFrameDelays(new Array(files.length).fill(newDelay));
  }

  function toggleFrameRange(enable) {
    setEnabledFrames(enabled => {
      const newEnabled = [...enabled];
      for (let i = rangeFrom - 1; i < rangeTo && i < newEnabled.length; i++) {
        newEnabled[i] = enable;
      }
      return newEnabled;
    });
  }

  function submit() {
    if (!files.length) return;
    
    const enabledFiles = files.filter((_, i) => enabledFrames[i]);
    const enabledDelays = frameDelays.filter((_, i) => enabledFrames[i]);
    
    onConvert({ 
      files: enabledFiles, 
      targetFormat, 
      gifOptions: {
        ...gifOptions,
        frameDelays: enabledDelays
      }, 
      videoOptions 
    });
  }

  return (
    <div>
      <h1>
        {targetFormat === 'gif' ? 'Animated GIF Maker' : 
         targetFormat === 'svg' ? 'Image to SVG Converter' :
         targetFormat === 'png' ? 'Image to PNG Converter' :
         targetFormat === 'jpg' ? 'Image to JPG Converter' :
         'Image Converter'}
      </h1>
      
      <div
        ref={dropRef}
        onDrop={onDrop}
        onDragOver={onDragOver}
        className="dropzone"
        onClick={() => document.getElementById('file-input')?.click()}
        style={{
          border: '2px dashed #ccc',
          borderRadius: '10px',
          padding: '40px',
          textAlign: 'center',
          cursor: 'pointer',
          backgroundColor: files.length > 0 ? '#f0f8ff' : '#fafafa'
        }}
      >
        <input
          id="file-input"
          type="file"
          multiple
          accept={SUPPORTED.join(',')}
          onChange={e => handleFiles(e.target.files)}
          style={{ display: 'none' }}
        />
        
        {files.length === 0 ? (
          <div>
            <h3>📁 Upload Images to Convert to {targetFormat.toUpperCase()}</h3>
            <p>Drop files here or click to browse</p>
            <p><small>Supports: GIF, JPG, PNG, BMP, TIFF, WebP, MP4, AVI, MOV, SVG</small></p>
          </div>
        ) : (
          <div>
            <h3>✅ {files.length} file{files.length !== 1 ? 's' : ''} uploaded</h3>
            <p>Drag and drop to reorder frames</p>
          </div>
        )}
      </div>

      {files.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          {/* Frame List (like ezgif.com) */}
          <div className="frame-list" style={{ marginBottom: '20px' }}>
            {files.map((file, idx) => (
              <div 
                key={idx} 
                className={`frame ${!enabledFrames[idx] ? 'disabled' : ''}`}
                style={{
                  display: 'inline-block',
                  margin: '10px',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '5px',
                  backgroundColor: enabledFrames[idx] ? '#fff' : '#f5f5f5',
                  opacity: enabledFrames[idx] ? 1 : 0.6,
                  minWidth: '200px'
                }}
              >
                <div className="frame-number" style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                  Frame {idx + 1}
                </div>
                
                <div className="frame-preview" style={{ marginBottom: '10px' }}>
                  <img 
                    src={URL.createObjectURL(file)} 
                    alt={file.name}
                    style={{ 
                      width: '100px', 
                      height: '100px', 
                      objectFit: 'cover',
                      border: '1px solid #ccc'
                    }}
                  />
                </div>
                
                <div className="frame-delay" style={{ marginBottom: '10px' }}>
                  <label>
                    Delay: 
                    <input 
                      type="number" 
                      min="1" 
                      max="65535"
                      value={frameDelays[idx] || 20}
                      onChange={e => updateFrameDelay(idx, e.target.value)}
                      style={{ width: '60px', marginLeft: '5px' }}
                    />
                    <small style={{ marginLeft: '5px', color: '#666' }}>1/100s</small>
                  </label>
                </div>
                
                <div className="frame-tools">
                  <button 
                    type="button"
                    className={`btn ${enabledFrames[idx] ? 'danger' : 'primary'}`}
                    onClick={() => toggleFrame(idx)}
                    style={{ marginRight: '5px', padding: '5px 10px', fontSize: '12px' }}
                  >
                    {enabledFrames[idx] ? 'Skip' : 'Enable'}
                  </button>
                  
                  <button 
                    type="button"
                    className="btn primary"
                    onClick={() => duplicateFrame(idx)}
                    style={{ marginRight: '5px', padding: '5px 10px', fontSize: '12px' }}
                  >
                    Copy
                  </button>
                  
                  <button 
                    type="button"
                    className="btn danger"
                    onClick={() => removeFile(idx)}
                    style={{ padding: '5px 8px', fontSize: '12px' }}
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Bulk Controls (like ezgif.com) */}
          <div className="bulk-controls" style={{ 
            padding: '15px', 
            backgroundColor: '#f9f9f9', 
            borderRadius: '5px', 
            marginBottom: '20px' 
          }}>
            <strong>Toggle a range of frames:</strong>
            <div style={{ marginTop: '10px' }}>
              <label style={{ marginRight: '10px' }}>
                From: 
                <input 
                  type="number" 
                  min="1" 
                  max={files.length}
                  value={rangeFrom}
                  onChange={e => setRangeFrom(parseInt(e.target.value) || 1)}
                  style={{ width: '60px', marginLeft: '5px' }}
                />
              </label>
              
              <label style={{ marginRight: '10px' }}>
                To: 
                <input 
                  type="number" 
                  min="1" 
                  max={files.length}
                  value={rangeTo}
                  onChange={e => setRangeTo(parseInt(e.target.value) || 5)}
                  style={{ width: '60px', marginLeft: '5px' }}
                />
              </label>
              
              <button 
                type="button" 
                className="btn danger"
                onClick={() => toggleFrameRange(false)}
                style={{ marginRight: '5px', padding: '5px 10px' }}
              >
                Skip
              </button>
              
              <button 
                type="button" 
                className="btn primary"
                onClick={() => toggleFrameRange(true)}
                style={{ padding: '5px 10px' }}
              >
                Enable
              </button>
            </div>
          </div>

          {/* GIF Options (like ezgif.com) - Only show for GIF format */}
          {targetFormat === 'gif' && (
            <>
              <div className="gif-options" style={{ 
                padding: '15px', 
                backgroundColor: '#f9f9f9', 
                borderRadius: '5px', 
                marginBottom: '20px' 
              }}>
                <strong>GIF Options:</strong>
            
            <div style={{ marginTop: '10px' }}>
              <label style={{ display: 'block', marginBottom: '10px' }}>
                Delay time: 
                <input 
                  type="number" 
                  min="1" 
                  max="65535"
                  value={gifOptions.frameDelay}
                  onChange={e => setGifOptions(prev => ({...prev, frameDelay: parseInt(e.target.value) || 20}))}
                  style={{ width: '60px', marginLeft: '5px' }}
                />
                <small style={{ marginLeft: '10px', color: '#666' }}>
                  (in 1/100 of second, changing this will reset delay for all frames)
                </small>
                <button 
                  type="button" 
                  onClick={setAllDelays}
                  style={{ marginLeft: '10px', padding: '2px 8px', fontSize: '12px' }}
                >
                  Apply to All
                </button>
              </label>

              <label style={{ display: 'block', marginBottom: '10px' }}>
                Loop count: 
                <input 
                  type="number" 
                  min="0"
                  value={gifOptions.loop}
                  onChange={e => setGifOptions(prev => ({...prev, loop: parseInt(e.target.value) || 0}))}
                  style={{ width: '60px', marginLeft: '5px' }}
                />
                <small style={{ marginLeft: '10px', color: '#666' }}>
                  (Empty or 0 = loop forever)
                </small>
              </label>

              <label className="checkbox" style={{ display: 'block', marginBottom: '5px' }}>
                <input 
                  type="checkbox"
                  checked={gifOptions.globalColormap}
                  onChange={e => setGifOptions(prev => ({...prev, globalColormap: e.target.checked}))}
                  style={{ marginRight: '5px' }}
                />
                Use global colormap (reduces file size)
              </label>
            </div>
          </div>

          {/* Effects (like ezgif.com) */}
          <div className="effects" style={{ 
            padding: '15px', 
            backgroundColor: '#f9f9f9', 
            borderRadius: '5px', 
            marginBottom: '20px' 
          }}>
            <strong>Effects:</strong>
            
            <div style={{ marginTop: '10px' }}>
              <label className="checkbox" style={{ display: 'block', marginBottom: '10px' }}>
                <input 
                  type="checkbox"
                  checked={gifOptions.crossfade}
                  onChange={e => setGifOptions(prev => ({...prev, crossfade: e.target.checked}))}
                  style={{ marginRight: '5px' }}
                />
                Crossfade frames
              </label>

              {gifOptions.crossfade && (
                <div style={{ marginLeft: '20px', marginBottom: '10px' }}>
                  <label style={{ display: 'inline-block', marginRight: '15px' }}>
                    Fader delay: 
                    <input 
                      type="number" 
                      min="1" 
                      max="100"
                      value={gifOptions.crossfadeDelay}
                      onChange={e => setGifOptions(prev => ({...prev, crossfadeDelay: parseInt(e.target.value) || 6}))}
                      style={{ width: '50px', marginLeft: '5px' }}
                    />
                  </label>
                  
                  <label style={{ display: 'inline-block' }}>
                    Frame count: 
                    <input 
                      type="number" 
                      min="2" 
                      max="20"
                      value={gifOptions.crossfadeFrames}
                      onChange={e => setGifOptions(prev => ({...prev, crossfadeFrames: parseInt(e.target.value) || 10}))}
                      style={{ width: '50px', marginLeft: '5px' }}
                    />
                    <small style={{ marginLeft: '5px', color: '#666' }}>(2-20)</small>
                  </label>
                </div>
              )}

              <label className="checkbox" style={{ display: 'block', marginBottom: '10px' }}>
                <input 
                  type="checkbox"
                  checked={gifOptions.noStack}
                  onChange={e => setGifOptions(prev => ({...prev, noStack: e.target.checked}))}
                  style={{ marginRight: '5px' }}
                />
                Don't stack frames
                <small style={{ display: 'block', marginLeft: '20px', color: '#666' }}>
                  (Remove frame when displaying next one, use for transparent backgrounds)
                </small>
              </label>

              {gifOptions.noStack && (
                <div style={{ marginLeft: '20px' }}>
                  <label className="checkbox" style={{ display: 'block', marginBottom: '5px' }}>
                    <input 
                      type="checkbox"
                      checked={gifOptions.keepFirst}
                      onChange={e => setGifOptions(prev => ({...prev, keepFirst: e.target.checked}))}
                      style={{ marginRight: '5px' }}
                    />
                    Use the first frame as background
                  </label>
                  
                  {gifOptions.keepFirst && (
                    <label className="checkbox" style={{ display: 'block', marginLeft: '20px' }}>
                      <input 
                        type="checkbox"
                        checked={gifOptions.skipFirst}
                        onChange={e => setGifOptions(prev => ({...prev, skipFirst: e.target.checked}))}
                        style={{ marginRight: '5px' }}
                      />
                      0 delay for first frame (don't show it alone)
                    </label>
                  )}
                </div>
              )}
            </div>
          </div>
          </>
          )}

          {/* Convert Button */}
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <button 
              onClick={submit} 
              disabled={loading || !files.length}
              style={{
                padding: '12px 30px',
                fontSize: '16px',
                fontWeight: 'bold',
                backgroundColor: loading ? '#ccc' : '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? `Converting to ${targetFormat.toUpperCase()}...` : `Convert to ${targetFormat.toUpperCase()}!`}
            </button>
          </div>
        </div>
      )}

      {/* Target Format Selection */}
      <div className="controls" style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f0f0f0', borderRadius: '5px' }}>
        <label>
          Output Format:
          <select 
            value={targetFormat} 
            onChange={e => setTargetFormat(e.target.value)}
            style={{ marginLeft: '10px', padding: '5px' }}
          >
            <option value="gif">GIF (Animated)</option>
            <option value="png">PNG</option>
            <option value="jpg">JPG</option>
            <option value="svg">SVG</option>
            <option value="mp4">MP4 Video</option>
            <option value="frames">Extract Frames</option>
          </select>
        </label>
      </div>

      {files.length > 0 && (
        <ul className="file-list" style={{ marginTop: '15px' }}>
          <strong>Uploaded Files:</strong>
          {files.map((file, i) => (
            <li key={i} style={{ 
              listStyle: 'none',
              padding: '5px 0',
              color: !enabledFrames[i] ? '#999' : '#333'
            }}>
              • {file.name} 
              {!enabledFrames[i] && <span style={{color: 'red'}}> (SKIPPED)</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
