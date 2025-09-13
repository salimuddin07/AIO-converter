import React, { useState, useRef } from 'react';
import VideoResults from './VideoResults';

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
    // Validate file type
    const validTypes = ['video/mp4', 'video/webm', 'video/avi', 'video/quicktime', 'video/x-msvideo', 'video/x-flv', 'video/ogg', 'video/x-ms-wmv', 'video/3gpp'];
    if (!validTypes.includes(selectedFile.type)) {
      alert('Please select a valid video file (MP4, WebM, AVI, MOV, FLV, OGG, WMV, 3GP)');
      return;
    }

    // Check file size (200MB limit)
    if (selectedFile.size > 209715200) {
      alert('The file you are trying to upload is too large for us to process! Max file size is 200 MB');
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

  React.useEffect(() => {
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
    const formData = new FormData();
    
    if (file) {
      formData.append('video', file);
    } else if (url) {
      formData.append('url', url);
    }

    try {
      const base = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001';
      const response = await fetch(`${base}/api/video/upload`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      setUploadResult(result);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  if (uploadResult) {
    return <VideoResults result={uploadResult} onBack={() => setUploadResult(null)} />;
  }

  return (
    <div id="main">
      <h1>MP4 video to GIF converter</h1>
      
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
            MP4, WebM, AVI, MPEG, MKV, FLV, OGG, MOV, M4V, WMV, ASF, 3GP and other video files<br />
            Max file size: 200MB
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
            All uploaded files are automatically deleted 1 hour after upload.<br />
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
