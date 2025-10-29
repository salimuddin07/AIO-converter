import { useState, useRef, useEffect } from 'react';
import VideoResults from './VideoResults';
import { api as realAPI } from '../utils/unifiedAPI.js';

const VideoToGifConverter = () => {
  const [file, setFile] = useState(null);
  const [url, setUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (selectedFile) => {
    const isVideo = selectedFile.type.startsWith('video/');

    if (!isVideo) {
      alert('Please select a supported video file (MP4, WebM, AVI, MOV, etc.) to create GIFs');
      return;
    }

    if (selectedFile.size > 2009715200) {
      alert('The file you are trying to upload is too large for us to process! Max file size is 200 GB');
      return;
    }

    setFile(selectedFile);
    setUrl('');
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handlePaste = (e) => {
    if (document.activeElement.name !== 'new-image-url') {
      if (e.clipboardData.files.length > 0) {
        handleFileSelect(e.clipboardData.files[0]);
      } else {
        const pastedText = e.clipboardData.getData('Text');
        if (pastedText.indexOf('http') === 0) {
          setUrl(pastedText);
          setFile(null);
        }
      }
    }
  };

  useEffect(() => {
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!file && !url) {
      alert('Please select a file or enter a URL');
      return;
    }

    setIsUploading(true);
    
    try {
      let result;
      
      if (file) {
        const isVideo = file.type.startsWith('video/');
        
        if (!isVideo) {
          throw new Error('Selected file is not a video. Please choose a supported video file.');
        }

        // Check if we're in Electron mode
        const isElectron = typeof window !== 'undefined' && window.electronAPI !== undefined;
        
        if (isElectron) {
          // In Electron mode, convert directly and get the result
          result = await realAPI.videoToGif(file, {
            quality: 80,
            fps: 10,
            startTime: 0,
            duration: 5 // Convert first 5 seconds by default
          });
          
          // Handle Electron result format
          if (result.success) {
            setUploadResult({
              type: 'electron',
              outputPath: result.outputPath,
              dataUrl: result.dataUrl || result.url || `file:///${result.outputPath}`,
              filename: result.filename || 'converted.gif',
              message: result.message || 'Video converted to GIF successfully'
            });
          } else {
            throw new Error(result.error || 'Conversion failed');
          }
        } else {
          // Browser mode - use the old workflow
          result = await realAPI.videoToGif(file);
          setUploadResult(result);
        }
      } else if (url) {
        // URL upload only works in browser mode
        result = await realAPI.uploadVideoFromUrl(url);
        setUploadResult(result);
      }
      
    } catch (error) {
      console.error('Upload error:', error);
      alert(`Upload failed: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  if (uploadResult) {
    // Check if this is an Electron result
    if (uploadResult.type === 'electron') {
      return (
        <div id="main">
          <h1>✅ Video to GIF Conversion Complete</h1>
          
          <div style={{ margin: '20px 0', padding: '20px', background: '#f0f8ff', border: '1px solid #c0e0ff', borderRadius: '8px' }}>
            <h2>Your GIF is ready!</h2>
            <p>{uploadResult.message}</p>
            
            {uploadResult.dataUrl && (
              <div style={{ textAlign: 'center', margin: '20px 0' }}>
                <img 
                  src={uploadResult.dataUrl} 
                  alt="Converted GIF"
                  style={{ maxWidth: '100%', maxHeight: '400px', border: '1px solid #ddd', borderRadius: '4px' }}
                  onError={(e) => {
                    console.error('Failed to load GIF preview:', e.target.src);
                    e.target.style.display = 'none';
                  }}
                />
              </div>
            )}
            
            <div style={{ textAlign: 'center', margin: '20px 0' }}>
              <a 
                href={uploadResult.dataUrl}
                download={uploadResult.filename}
                className="btn primary"
                style={{ textDecoration: 'none', margin: '10px' }}
              >
                📥 Download GIF
              </a>
              
              <button 
                className="btn secondary"
                onClick={() => setUploadResult(null)}
                style={{ margin: '10px' }}
              >
                🔄 Convert Another Video
              </button>
            </div>
            
            <div style={{ fontSize: '12px', color: '#666', textAlign: 'center' }}>
              <p>📁 File saved to: {uploadResult.outputPath}</p>
              <p>💡 Tip: Right-click the GIF and "Save As..." to save it anywhere</p>
            </div>
          </div>
        </div>
      );
    }
    
    // Browser mode - use VideoResults
    return <VideoResults result={uploadResult} onBack={() => setUploadResult(null)} />;
  }

  return (
    <div id="main">
  <h1>Video to GIF Converter</h1>
      
      <form 
        className="form" 
        onSubmit={handleSubmit}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <fieldset>
          <legend>Upload video</legend>
          
          <p>
            <label htmlFor="new-image">Choose, paste, or drag and drop a file here:</label><br />
            <input 
              type="file" 
              name="new-image" 
              id="new-image" 
              className={`up-input ${dragActive ? 'drag-active' : ''}`}
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="video/*"
            />
            {file && <div className="file-selected">Selected: {file.name}</div>}
          </p>
          
          <p>
            <label htmlFor="new-image-url">Or enter direct video URL:</label><br />
            <input 
              className="text" 
              name="new-image-url" 
              id="new-image-url" 
              placeholder="https://"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                if (e.target.value) setFile(null);
              }}
            />
          </p>
          
          <p>
            <strong>Supported files:</strong><br />
            • Videos: MP4, WebM, AVI, MPEG, MKV, FLV, OGG, MOV, M4V, WMV, ASF, 3GP<br />
            Max file size: 200GB
          </p>
          
          <p id="tsbt">
            <input 
              type="submit" 
              className="btn primary" 
              value={isUploading ? "Uploading video..." : "Upload video!"} 
              disabled={isUploading}
            />
          </p>
          
          <p className="hint">
            All uploaded files are automatically deleted 10 minutes after upload.<br />
            For permanent links you can use: https://aio-convert.com/video-to-gif?url=<span style={{color:'#2c882c'}}>https://example.com/source-video.mp4</span>
          </p>
        </fieldset>
      </form>

      <div className="txt">
        <h2>Upload and convert video to GIF</h2>
        <p>
          With this online video converter you can upload your mp4, avi, WebM, flv, wmv and many other popular types of
          video and rich media files to turn them into high-quality animated GIFs.
          Source video file can be uploaded from your computer or smartphone or fetched from another server by URL.
        </p>
        
        <p>
          After upload, you can select the part of the video you want to cut, entering the start and end times. If nothing
          is selected, the converter will make a GIF from the first five seconds of the video clip.
          If you want to change the dimensions of the GIF or crop out only part of the video, you can use our resize and
          crop tools on the GIF after finishing the conversion.
        </p>
        
        <p>
          We offer <em>MP4 to GIF</em>, <em>WebM to GIF</em>, <em>AVI to GIF</em>, <em>MOV to GIF</em>, <em>FLV to
          GIF</em>, as well as <em>3GP</em>, <em>OGV</em>, <em>M4V</em>, <em>ASF</em>, <em>MKV</em>, and other format converters.
          It's possible to convert transparent video (with alpha channel) to transparent GIF as well. It can also
          convert some SWF (flash) files, but currently, not all of them.
        </p>
        
        <h3>Tips</h3>
        <ul>
          <li>
            Frame rate (<abbr title="Frames Per Second">fps</abbr>) is the number of frames shown each second. A higher
            frame rate gives smoother and more cinematic animation, thus increasing perceived quality but greatly
            increases the file size. Choose accordingly for your needs.
          </li>
          <li>
            To keep the file size and processing time reasonable, we limit the maximum length of the part you can select
            for conversion (duration) depending on the selected frame rate. If you want to create longer GIFs, you have
            to select lower fps. Maximum length at 5 fps is 60 seconds; at 10 fps it's lowered to 30 seconds, and
            so on.
          </li>
          <li>
            Pause the video and click "Use current video position" to get an accurate start and end time for
            your GIF.
          </li>
          <li>
            Use our crop, resize, and optimization tools below the output image, to adjust the dimensions and file size.
          </li>
        </ul>
        
        <p>
          If you are looking for a tool to perform conversion the other way around (GIF to Video), give our <a href="#/gif-to-mp4">GIF to MP4</a> or <a href="#/gif-to-webm">GIF to WebM</a> converter a try.<br />
          Or if you want to make a GIF from multiple images, use our <a href="#/maker">GIF maker</a> instead.
        </p>
      </div>
    </div>
  );
};

export default VideoToGifConverter;
