import React, { useState, useRef, useCallback } from 'react';

const SUPPORTED = ['image/png','image/jpeg','image/gif','image/svg+xml','image/bmp','image/tiff','video/mp4','video/avi','video/mov','video/webm'];

export default function UploadArea({ onConvert, loading }) {
  const [files, setFiles] = useState([]);
  const [targetFormat, setTargetFormat] = useState('png');
  const [gifOptions, setGifOptions] = useState({ 
    frameDelay: 100, 
    loop: 0, 
    singleGif: false, 
    quality: 5,
    frameDelays: [] // Individual frame timings
  });
  const [videoOptions, setVideoOptions] = useState({
    frameRate: 10,
    quality: 'medium'
  });
  const dropRef = useRef(null);

  const handleFiles = useCallback(list => {
    const arr = Array.from(list);
    const filtered = arr.filter(f => SUPPORTED.includes(f.type) || f.name.endsWith('.svg'));
    setFiles(prev => [...prev, ...filtered]);
  }, []);

  function onDrop(e) {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  }
  function onDragOver(e) { e.preventDefault(); }

  function removeFile(idx) {
    setFiles(f => f.filter((_, i) => i !== idx));
  }

  function submit() {
    if (!files.length) return;
    onConvert({ files, targetFormat, gifOptions, videoOptions });
  }

  return (
    <div>
      <div
        ref={dropRef}
        onDrop={onDrop}
        onDragOver={onDragOver}
        className="dropzone"
        aria-label="File upload dropzone"
      >
        <p>Drag & drop images here or <label className="link"><input type="file" multiple hidden onChange={e=>handleFiles(e.target.files)} />browse</label></p>
      </div>
      <div className="controls">
        <label>Target Format:
          <select value={targetFormat} onChange={e=>setTargetFormat(e.target.value)}>
            <option value="png">PNG</option>
            <option value="jpg">JPG</option>
            <option value="gif">GIF</option>
            <option value="svg">SVG</option>
            <option value="mp4">MP4 Video</option>
            <option value="frames">Extract Frames</option>
          </select>
        </label>
        {targetFormat === 'gif' && (
          <div className="gif-options">
            <label>Frame Delay (ms)
              <input type="number" value={gifOptions.frameDelay} onChange={e=>setGifOptions(o=>({...o, frameDelay:e.target.value}))} />
            </label>
            <label>Loop (0=infinite)
              <input type="number" value={gifOptions.loop} onChange={e=>setGifOptions(o=>({...o, loop:e.target.value}))} />
            </label>
            <label>Quality (1-20, lower=better)
              <input type="number" min="1" max="20" value={gifOptions.quality} onChange={e=>setGifOptions(o=>({...o, quality:e.target.value}))} />
            </label>
             <label>Force Single GIF
               <input type="checkbox" checked={gifOptions.singleGif} onChange={e=>setGifOptions(o=>({...o, singleGif:e.target.checked}))} />
             </label>
          </div>
        )}
        {(targetFormat === 'mp4' || targetFormat === 'frames') && (
          <div className="video-options">
            <label>Frame Rate (fps)
              <input type="number" min="1" max="60" value={videoOptions.frameRate} onChange={e=>setVideoOptions(o=>({...o, frameRate:e.target.value}))} />
            </label>
            <label>Quality
              <select value={videoOptions.quality} onChange={e=>setVideoOptions(o=>({...o, quality:e.target.value}))}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </label>
          </div>
        )}
        <button disabled={!files.length || loading} onClick={submit}>{loading ? 'Converting...' : 'Convert'}</button>
      </div>
      {files.length > 0 && (
        <ul className="file-list">
          {files.map((f,i)=>(
            <li key={i}>{f.name} <button onClick={()=>removeFile(i)} aria-label={`Remove ${f.name}`}>×</button></li>
          ))}
        </ul>
      )}
    </div>
  );
}
