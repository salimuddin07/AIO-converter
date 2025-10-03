import React, { useState } from 'react';
import { realAPI } from '../utils/apiConfig';
import Results from './Results';

export default function GifSplitter() {
  const [file, setFile] = useState(null);
  const [url, setUrl] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file && !url) {
      setError('Please select a GIF file or enter a URL');
      return;
    }
    
    if (file && file.size > 209715200) { // 200MB limit
      setError('The file you are trying to upload is too large! Max file size is 200 MB');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setResult(null);
      
      let splitResult;
      if (file) {
        splitResult = await realAPI.splitGif(file);
      } else if (url) {
        splitResult = await realAPI.splitGifFromUrl(url);
      }
      
      setResult(splitResult);
    } catch (err) {
      console.error('Split error:', err);
      setError(`Split failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePaste = (e) => {
    if (e.clipboardData.files.length > 0) {
      setFile(e.clipboardData.files[0]);
    } else {
      const pastedData = e.clipboardData.getData('Text');
      if (pastedData.indexOf('http') === 0) {
        setUrl(pastedData);
      }
    }
  };

  React.useEffect(() => {
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  return (
    <div id="main">
      <h1>GIF frame extractor (splitter)</h1>
      
      <form 
        className="form" 
        onSubmit={handleSubmit}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <fieldset>
          <legend>Upload image</legend>
          
          <p>
            <label htmlFor="new-image">Choose, paste, or drag and drop a file here:</label><br/>
            <input 
              type="file" 
              name="new-image" 
              id="new-image" 
              className={`up-input ${dragActive ? 'drag-active' : ''}`}
              onChange={handleFileChange}
              accept=".gif,.webp,.apng,.mng,.avif,.jxl"
            />
          </p>
          
          <p>
            <label htmlFor="new-image-url">Or enter direct image URL:</label><br/>
            <input 
              className="text" 
              name="new-image-url" 
              id="new-image-url" 
              placeholder="https://"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </p>
          
          <p>
            Supported image types: animated GIF, WebP, APNG, MNG, AVIF, JXL (JPEG XL)<br/>
            Max file size: 200MB
          </p>
          
          <p>
            <input 
              type="submit" 
              className="btn primary" 
              value={loading ? "Processing..." : "Upload!"}
              disabled={loading}
            />
          </p>
          
          <p className="hint">
            All uploaded files are automatically deleted 1 hour after upload.<br/>
            For permanent links you can use: https://gifmaster.com/split?url=<span style={{color:'#2c882c'}}>https://example.com/source-image.gif</span>
          </p>
        </fieldset>
      </form>

      {error && (
        <div className="error" style={{color: 'red', margin: '20px 0'}}>
          <h3>Error:</h3>
          <p>{error}</p>
        </div>
      )}

      {results && <Results results={results} />}
      
      <div className="txt">
        <h2>Animated GIF, APNG, WebP, AVIF, JPEG XL and MNG frame splitter (extractor/decompiler)</h2>
        
        <p>This online tool is designed to convert animated images into a sequence of images to edit or view them separately.<br/>
        GIF explode tool, splitter, decompiler - call it whatever you want. It can extract individual frames from various animated image formats such as Animated GIF, APNG, WebP, AVIF, and MNG.</p>
        
        <p>After decompressing the GIF file, you can download specific frames (right-click the image and select <em>Save image as...</em>) or save them all at once as a single zip file by clicking <em>"Download frames as ZIP archive."</em></p>
        
        <p>If you want to rearrange frame order or remove some frames and restore animation, click the <em>"Edit animation"</em> button. It will take you to the GIF maker window. You can also download the ZIP file, edit some frames in the image editor of your choice and then upload a new ZIP archive back to <a href="/maker">GIF maker</a>. If you keep the file names unchanged, it will preserve the frame order and duration.</p>
        
        <hr/>
        
        <p>If you want to have all frames placed side by side in a single image file, we also offer <a href="/gif-to-sprite">GIF to Sprite Sheet converter</a>.</p>
        
        <p>For splitting video files (mp4, webm, avi...) into a sequence of images, use our <a href="/video-to-png">video splitter</a>.</p>
      </div>
    </div>
  );
}
