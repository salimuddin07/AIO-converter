import React, { useMemo, useState } from 'react';
import { getApiUrl, realAPI } from '../utils/apiConfig';
import SplitResults from './SplitResults';

const TOOL_GIF = 'gif';
const TOOL_VIDEO = 'video';

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
    fps: 5,
    createZip: true
  });
  const [dragging, setDragging] = useState(null);
  const [loadingTool, setLoadingTool] = useState(null);
  const [error, setError] = useState('');
  const [splitData, setSplitData] = useState(null);

  const videoAcceptAttr = useMemo(() => SUPPORTED_VIDEO_TYPES.map((ext) => `.${ext}`).join(','), [SUPPORTED_VIDEO_TYPES]);

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
    }
    setSplitData(null);
    setError('');
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

  const runSplit = async (tool, requestFn) => {
    try {
      setLoadingTool(tool);
      setError('');
      const splitResult = await requestFn();

      setSplitData({
        type: tool,
        jobId: splitResult.jobId,
        frames: splitResult.frames || [],
        zipUrl: splitResult.zipUrl,
        meta: splitResult
      });
    } catch (err) {
      console.error('Split error:', err);
      setError(`Split failed: ${err.message}`);
    } finally {
      setLoadingTool(null);
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
        fps: videoOptions.fps,
        createZip: videoOptions.createZip
      };

      if (videoFile) {
        return realAPI.splitVideo(videoFile, options);
      }
      return realAPI.splitVideoFromUrl(videoUrl, options);
    });
  };

  const handleZipDownload = () => {
    if (!splitData?.zipUrl) return;
    const url = splitData.zipUrl.startsWith('http') ? splitData.zipUrl : getApiUrl(splitData.zipUrl);
    window.open(url, '_blank', 'noopener');
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

        <fieldset style={{ marginBottom: '1.5rem' }}>
          <legend>Video options</legend>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
            <label>
              FPS (frames per second)
              <input
                type="number"
                min="1"
                max="60"
                value={videoOptions.fps}
                onChange={(event) => setVideoOptions((prev) => ({ ...prev, fps: event.target.value }))}
              />
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="checkbox"
                checked={videoOptions.createZip}
                onChange={(event) => setVideoOptions((prev) => ({ ...prev, createZip: event.target.checked }))}
              />
              Create ZIP archive when done
            </label>
          </div>
        </fieldset>

        <p>
          <input
            type="submit"
            className="btn primary"
            value={loadingTool === TOOL_VIDEO ? 'Processing…' : 'Split video'}
            disabled={loadingTool !== null}
          />
        </p>

        <p className="hint">
          Videos are removed automatically 1 hour after processing. Large files may take longer to split.
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
        Choose the workflow you need: extract frames from a GIF animation or pull stills from a video file. Each splitter has its own upload slot and options so you can work on GIFs and videos independently.
      </p>

      {activeTool === TOOL_GIF ? renderGifForm() : renderVideoForm()}

      {error && (
        <div className="error" style={{ color: 'red', margin: '20px 0' }}>
          <h3>Error</h3>
          <p>{error}</p>
        </div>
      )}

      {splitData && (
        <SplitResults
          frames={splitData.frames}
          onDownloadZip={splitData.zipUrl ? handleZipDownload : undefined}
          onEditAnimation={() => alert('Animation editing coming soon!')}
        />
      )}

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
            <p style={{ color: '#4a5668' }}>Extract stills from MP4, MOV, WEBM, AVI, MKV, and more.</p>
            <h4 style={{ marginBottom: '0.5rem' }}>How it works</h4>
            <ol style={{ paddingLeft: '1.25rem', marginBottom: '1rem', color: '#2c3748' }}>
              <li>Upload a video file or provide a direct streaming URL.</li>
              <li>Select the frame rate you want and whether to package results into a ZIP.</li>
              <li>We sample the video, generate image frames, and expose preview/download links.</li>
              <li>Save individual stills or download them all at once.</li>
            </ol>
            <h4 style={{ marginBottom: '0.5rem' }}>Pro tips</h4>
            <ul style={{ paddingLeft: '1.25rem', color: '#2c3748', margin: 0 }}>
              <li>Higher FPS values capture more moments but generate larger downloads.</li>
              <li>Trim longer clips beforehand if you only need a specific section.</li>
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
