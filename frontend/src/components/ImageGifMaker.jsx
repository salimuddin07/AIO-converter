import { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { NotificationService } from '../utils/NotificationService.js';
import { realAPI, getApiUrl } from '../utils/apiConfig.js';

const SPEED_PRESETS = {
  slow: { label: 'Slow', delay: 140 },
  normal: { label: 'Normal', delay: 90 },
  fast: { label: 'Fast', delay: 60 },
  turbo: { label: 'Turbo', delay: 40 }
};

const DEFAULT_OPTIONS = {
  fps: 12,
  quality: 'high',
  loop: true,
  loopCount: 'infinite',
  width: '',
  height: '',
  speedPreset: 'normal',
  frameDelay: SPEED_PRESETS.normal.delay,
  fit: 'contain'
};

const DEFAULT_FRAME_CONFIG = {
  delay: SPEED_PRESETS.normal.delay,
  include: true
};

const sanitizeDelay = (value, fallback = SPEED_PRESETS.normal.delay) => {
  const numeric = parseInt(value, 10);
  if (Number.isNaN(numeric)) {
    return fallback;
  }
  return Math.min(2000, Math.max(10, numeric));
};

const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp', 'image/bmp'];

const formatBytes = (bytes) => {
  if (!bytes && bytes !== 0) return '';
  const units = ['B', 'KB', 'MB', 'GB'];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, exponent);
  return `${value.toFixed(exponent === 0 ? 0 : 1)} ${units[exponent]}`;
};

const resolveUrl = (path) => {
  if (!path) return '';
  return path.startsWith('http') ? path : getApiUrl(path);
};

export default function ImageGifMaker() {
  const [frames, setFrames] = useState([]);
  const [options, setOptions] = useState(DEFAULT_OPTIONS);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [errorState, setErrorState] = useState(null);
  const fileInputRef = useRef(null);
  const dropRef = useRef(null);
  const objectUrlsRef = useRef(new Map());

  const totalSize = useMemo(
    () => frames.reduce((sum, frame) => sum + (frame.file?.size || 0), 0),
    [frames]
  );
  const orderedFrames = useMemo(() => frames, [frames]);
  const activeFrames = useMemo(() => orderedFrames.filter((frame) => frame.include), [orderedFrames]);
  const speedPresets = useMemo(() => Object.entries(SPEED_PRESETS), []);
  const approximateFps = useMemo(() => {
    if (!options.frameDelay) {
      return options.fps;
    }

    const derived = Math.round(1000 / options.frameDelay);
    return derived > 0 ? derived : options.fps;
  }, [options.frameDelay, options.fps]);

  const revokePreviewUrl = useCallback((id) => {
    const url = objectUrlsRef.current.get(id);
    if (url) {
      URL.revokeObjectURL(url);
      objectUrlsRef.current.delete(id);
    }
  }, []);

  const createFrameFromFile = useCallback(
    (file) => {
      const id = `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2, 8)}`;
      const previewUrl = URL.createObjectURL(file);
      objectUrlsRef.current.set(id, previewUrl);
      return {
        id,
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        previewUrl,
        delay: sanitizeDelay(options.frameDelay || DEFAULT_FRAME_CONFIG.delay),
        include: true
      };
    },
    [options.frameDelay]
  );

  useEffect(() => () => {
    objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    objectUrlsRef.current.clear();
  }, []);

  const handleFiles = (incoming) => {
    if (!incoming || incoming.length === 0) {
      return;
    }

    const nextFrames = [];
    const existingKeys = new Set(orderedFrames.map((frame) => `${frame.name}-${frame.file?.lastModified}`));

    incoming.forEach((item) => {
      if (!ACCEPTED_IMAGE_TYPES.includes(item.type)) {
        NotificationService.toast(`${item.name} is not a supported image type`, 'warning');
        return;
      }

      const key = `${item.name}-${item.lastModified}`;
      if (existingKeys.has(key)) {
        NotificationService.toast(`${item.name} is already added`, 'info');
        return;
      }

      const frame = createFrameFromFile(item);
      nextFrames.push(frame);
      existingKeys.add(key);
    });

    if (nextFrames.length === 0) {
      return;
    }

    setFrames((prev) => [...prev, ...nextFrames]);
    setResult(null);
    setErrorState(null);
  };

  const applyDelayToAllFrames = useCallback((delay) => {
    const sanitized = sanitizeDelay(delay);
    setFrames((prev) => prev.map((frame) => ({ ...frame, delay: sanitized })));
    setResult(null);
    setErrorState(null);
  }, []);

  const updateFrameValue = useCallback((id, key, value) => {
    setFrames((prev) => prev.map((frame) => {
      if (frame.id !== id) return frame;
      if (key === 'delay') {
        return { ...frame, delay: sanitizeDelay(value, frame.delay) };
      }
      if (key === 'include') {
        return { ...frame, include: Boolean(value) };
      }
      return { ...frame, [key]: value };
    }));
    setResult(null);
    setErrorState(null);
  }, []);

  const onFileInputChange = (event) => {
    const selected = Array.from(event.target.files || []);
    handleFiles(selected);
    event.target.value = '';
  };

  const onDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();

    const fileList = Array.from(event.dataTransfer.files || []);
    handleFiles(fileList);
    dropRef.current?.classList.remove('drag-active');
  };

  const onDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();
    dropRef.current?.classList.add('drag-active');
  };

  const onDragLeave = (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (event.target === dropRef.current) {
      dropRef.current?.classList.remove('drag-active');
    }
  };

  const removeFrame = (id) => {
    setFrames((prev) => {
      const next = prev.filter((frame) => frame.id !== id);
      revokePreviewUrl(id);
      return next;
    });
    setResult(null);
    setErrorState(null);
  };

  const moveFrame = (id, direction) => {
    setFrames((prev) => {
      const index = prev.findIndex((frame) => frame.id === id);
      if (index === -1) return prev;
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;
      const next = [...prev];
      const [moved] = next.splice(index, 1);
      next.splice(targetIndex, 0, moved);
      return next;
    });
    setResult(null);
    setErrorState(null);
  };

  const updateOption = (key, value) => {
    setOptions((prev) => {
      let next = prev;

      if (key === 'frameDelay') {
        const numeric = sanitizeDelay(value, prev.frameDelay);
        next = { ...prev, frameDelay: numeric, speedPreset: 'custom' };
        applyDelayToAllFrames(numeric);
        return next;
      }

      if (key === 'loopCount') {
        next = { ...prev, loopCount: value };
        return next;
      }

      if (key === 'width' || key === 'height') {
        next = { ...prev, [key]: value.replace(/[^0-9]/g, '') };
        return next;
      }

      if (key === 'fps') {
        const nextFps = Math.max(1, parseInt(value, 10) || prev.fps);
        next = { ...prev, fps: nextFps };
        return next;
      }

      if (key === 'fit') {
        next = { ...prev, fit: value };
        return next;
      }

      next = { ...prev, [key]: value };
      return next;
    });
  };

  const handleSpeedPresetChange = (presetKey) => {
    if (presetKey === 'custom') {
      setOptions((prev) => ({ ...prev, speedPreset: 'custom' }));
      return;
    }

    const preset = SPEED_PRESETS[presetKey];
    if (!preset) {
      return;
    }

    setOptions((prev) => ({
      ...prev,
      speedPreset: presetKey,
      frameDelay: preset.delay
    }));
    applyDelayToAllFrames(preset.delay);
  };

  const reset = () => {
    objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    objectUrlsRef.current.clear();
    setFrames([]);
    setOptions(DEFAULT_OPTIONS);
    setResult(null);
    setErrorState(null);
  };

  const buildGif = async () => {
    if (orderedFrames.length === 0) {
      NotificationService.toast('Please add at least one image', 'warning');
      return;
    }

    if (activeFrames.length === 0) {
      NotificationService.toast('All frames are disabled. Enable at least one frame to continue.', 'warning');
      return;
    }

    setIsProcessing(true);
    setErrorState(null);
    setResult(null);
    const progressToast = NotificationService.progressToast('Creating GIF...', 'Processing your images');

    try {
      progressToast.update({ message: `Uploading ${activeFrames.length} frame${activeFrames.length === 1 ? '' : 's'}`, progress: 30 });
      const payload = {
        fps: options.fps,
        quality: options.quality,
        loop: options.loop ? 'true' : 'false'
      };

      if (options.width) payload.width = options.width;
      if (options.height) payload.height = options.height;
      if (options.frameDelay) payload.delay = options.frameDelay;
      if (options.loopCount && options.loopCount !== 'infinite') payload.loopCount = options.loopCount;
      if (options.fit) payload.fit = options.fit;

      const frameDelays = activeFrames.map((frame) => sanitizeDelay(frame.delay, options.frameDelay));
      payload.frameDelays = JSON.stringify(frameDelays);
      payload.frameIds = JSON.stringify(activeFrames.map((frame) => frame.id));
      payload.totalFrames = activeFrames.length;

      progressToast.update({ message: 'Encoding animation frames…', progress: 65 });
      const response = await realAPI.createGifFromImages(activeFrames.map((frame) => frame.file), payload);

      if (!response?.success) {
        throw new Error(response?.error || 'GIF creation did not complete');
      }

      progressToast.update({ title: 'Wrapping up…', message: 'Preparing download link', progress: 90 });
      setResult(response);
      NotificationService.success('GIF created successfully!');
    } catch (error) {
      console.error('Image GIF maker error:', error);
      const message = error?.message || 'Unexpected error during GIF creation';
      NotificationService.error(`GIF creation failed: ${message}`);
      setErrorState(message);
    } finally {
      progressToast.close();
      setIsProcessing(false);
    }
  };

  const downloadResult = () => {
    if (!result?.result) return;
    const link = document.createElement('a');
    const { downloadUrl, filename, url } = result.result;
    link.href = resolveUrl(downloadUrl || url || '');
    link.download = filename || 'image-sequence.gif';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="image-gif-maker">
      <div className="hero">
        <h1>🖼️ GIF Maker</h1>
        <p>Create animated GIFs by combining multiple images in the order you choose.</p>
      </div>

      <section
        className="dropzone"
        ref={dropRef}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        <input
          type="file"
          accept="image/*"
          multiple
          ref={fileInputRef}
          onChange={onFileInputChange}
          style={{ display: 'none' }}
        />

        <button
          type="button"
          className="select-button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isProcessing}
        >
          Select Images
        </button>
        <p>or drag & drop image files here</p>
        <small>
          Supported formats: PNG, JPG, GIF, WebP, BMP • Total size: {formatBytes(totalSize)}
          {orderedFrames.length > 0 ? ` • Frames selected: ${activeFrames.length}/${orderedFrames.length}` : ''}
        </small>
      </section>

      {orderedFrames.length > 0 && (
        <section className="file-list">
          <div className="list-header">
            <h2>Frames ({orderedFrames.length})</h2>
            <div className="actions">
              <button
                type="button"
                onClick={() => applyDelayToAllFrames(options.frameDelay)}
                disabled={isProcessing}
              >
                Apply global delay
              </button>
              <button type="button" onClick={reset} disabled={isProcessing}>Clear</button>
            </div>
          </div>

          <ul className="frame-grid">
            {orderedFrames.map((frame, index) => (
              <li key={frame.id} className={`frame-card${frame.include ? '' : ' frame-card--disabled'}`}>
                <div className="frame-card__preview">
                  <img src={frame.previewUrl} alt={`Frame ${index + 1} preview`} />
                  <span className="frame-card__badge">#{index + 1}</span>
                </div>
                <div className="frame-card__content">
                  <div className="frame-card__header">
                    <strong>{frame.name}</strong>
                    <small>{formatBytes(frame.size)}</small>
                  </div>
                  <div className="frame-card__controls">
                    <label>
                      <span>Delay (ms)</span>
                      <input
                        type="number"
                        min="10"
                        step="5"
                        value={frame.delay}
                        onChange={(e) => updateFrameValue(frame.id, 'delay', e.target.value)}
                        disabled={isProcessing}
                      />
                    </label>
                    <label className="frame-card__toggle">
                      <input
                        type="checkbox"
                        checked={frame.include}
                        onChange={(e) => updateFrameValue(frame.id, 'include', e.target.checked)}
                        disabled={isProcessing}
                      />
                      <span>Include in GIF</span>
                    </label>
                  </div>
                  <div className="frame-card__actions">
                    <button
                      type="button"
                      onClick={() => moveFrame(frame.id, -1)}
                      disabled={index === 0 || isProcessing}
                      aria-label="Move up"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => moveFrame(frame.id, 1)}
                      disabled={index === orderedFrames.length - 1 || isProcessing}
                      aria-label="Move down"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      onClick={() => removeFrame(frame.id)}
                      disabled={isProcessing}
                      aria-label="Remove"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="options">
        <h2>Options</h2>
        <div className="grid">
          <label>
            <span>Frames per second</span>
            <select value={options.fps} onChange={(e) => updateOption('fps', parseInt(e.target.value, 10))} disabled={isProcessing}>
              {[4, 6, 8, 10, 12, 15, 20, 24].map((fps) => (
                <option key={fps} value={fps}>{fps} fps</option>
              ))}
            </select>
          </label>

          <label>
            <span>Quality</span>
            <select value={options.quality} onChange={(e) => updateOption('quality', e.target.value)} disabled={isProcessing}>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </label>

          <label className="checkbox">
            <input
              type="checkbox"
              checked={options.loop}
              onChange={(e) => updateOption('loop', e.target.checked)}
              disabled={isProcessing}
            />
            <span>Loop animation</span>
          </label>

          <label>
            <span>Loop count</span>
            <select
              value={options.loopCount}
              onChange={(e) => updateOption('loopCount', e.target.value)}
              disabled={isProcessing || !options.loop}
            >
              <option value="infinite">Infinite</option>
              <option value="1">Repeat 1 time</option>
              <option value="2">Repeat 2 times</option>
              <option value="3">Repeat 3 times</option>
              <option value="5">Repeat 5 times</option>
            </select>
            <small>Disable looping to play once.</small>
          </label>

          <label>
            <span>Width (optional)</span>
            <input
              type="number"
              min="1"
              placeholder="Auto"
              value={options.width}
              onChange={(e) => updateOption('width', e.target.value)}
              disabled={isProcessing}
            />
          </label>

          <label>
            <span>Height (optional)</span>
            <input
              type="number"
              min="1"
              placeholder="Auto"
              value={options.height}
              onChange={(e) => updateOption('height', e.target.value)}
              disabled={isProcessing}
            />
          </label>

          <label>
            <span>Scale mode</span>
            <select
              value={options.fit}
              onChange={(e) => updateOption('fit', e.target.value)}
              disabled={isProcessing}
            >
              <option value="contain">Contain (show full image)</option>
              <option value="cover">Cover (fill canvas)</option>
              <option value="fill">Stretch to size</option>
            </select>
            <small>Choose how each frame is resized when dimensions are provided.</small>
          </label>
        </div>

        <div className="speed-presets">
          <div className="speed-header">
            <span>Animation speed</span>
            <small>Current frame delay: {options.frameDelay} ms • Approx. {approximateFps} fps</small>
          </div>
          <div className="preset-buttons">
            {speedPresets.map(([key, preset]) => (
              <button
                key={key}
                type="button"
                className={options.speedPreset === key ? 'active' : ''}
                onClick={() => handleSpeedPresetChange(key)}
                disabled={isProcessing}
              >
                {preset.label}
              </button>
            ))}
            <button
              type="button"
              className={options.speedPreset === 'custom' ? 'active' : ''}
              onClick={() => handleSpeedPresetChange('custom')}
              disabled={isProcessing}
            >
              Custom
            </button>
          </div>

          <label className="custom-delay">
            <span>Frame delay (ms)</span>
            <input
              type="number"
              min="10"
              step="5"
              value={options.frameDelay}
              onChange={(e) => updateOption('frameDelay', e.target.value)}
              disabled={isProcessing || options.speedPreset !== 'custom'}
            />
            <small>Lower values make the GIF faster. Presets adjust this automatically.</small>
          </label>
        </div>
      </section>

      <section className="cta">
        <button
          type="button"
          className="build-button"
          onClick={buildGif}
          disabled={isProcessing || activeFrames.length === 0}
        >
          {isProcessing ? 'Creating GIF...' : 'Create GIF'}
        </button>
        {isProcessing && <p className="processing-hint">Working on your animation — feel free to grab a coffee ☕</p>}
      </section>

      {errorState && (
        <section className="result result--error">
          <h2>We hit a snag</h2>
          <p>{errorState}</p>
          <div className="result-actions">
            <button type="button" onClick={buildGif} disabled={isProcessing || activeFrames.length === 0}>
              Retry
            </button>
            <button type="button" onClick={reset} disabled={isProcessing}>Start over</button>
          </div>
        </section>
      )}

      {result?.result && (
        <section className="result">
          <h2>Your GIF is ready!</h2>
          <div className="preview">
            <img
              src={resolveUrl(result.result.previewUrl || result.result.downloadUrl || result.result.url || '')}
              alt="Generated GIF preview"
            />
          </div>
          <div className="result-actions">
            <button type="button" onClick={downloadResult}>Download GIF</button>
            <button type="button" onClick={reset}>Create another</button>
          </div>
        </section>
      )}

  <style>{`
        .image-gif-maker {
          max-width: 960px;
          margin: 0 auto;
          padding: 32px 20px 60px;
        }

        .hero {
          text-align: center;
          margin-bottom: 32px;
        }

        .hero h1 {
          font-size: 2.5rem;
          margin-bottom: 12px;
        }

        .hero p {
          color: #4a5568;
          font-size: 1.1rem;
        }

        .dropzone {
          border: 2px dashed #667eea;
          border-radius: 16px;
          padding: 36px 24px;
          text-align: center;
          background: rgba(102, 126, 234, 0.05);
          transition: border-color 0.2s ease, background 0.2s ease;
          margin-bottom: 24px;
        }

        .dropzone.drag-active {
          border-color: #764ba2;
          background: rgba(118, 75, 162, 0.08);
        }

        .select-button {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 999px;
          padding: 12px 28px;
          font-size: 1rem;
          cursor: pointer;
          margin-bottom: 12px;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .select-button:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 8px 18px rgba(102, 126, 234, 0.3);
        }

        .select-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .dropzone p {
          margin: 8px 0;
          color: #4a5568;
        }

        .dropzone small {
          color: #718096;
        }

        .file-list {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 20px;
          margin-bottom: 24px;
          box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
        }

        .list-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .list-header h2 {
          margin: 0;
          font-size: 1.2rem;
        }

        .list-header .actions button {
          background: none;
          border: none;
          color: #667eea;
          font-weight: 600;
          cursor: pointer;
        }

        .frame-grid {
          list-style: none;
          margin: 0;
          padding: 0;
          display: grid;
          gap: 16px;
        }

        .frame-card {
          display: grid;
          grid-template-columns: 140px 1fr;
          gap: 18px;
          padding: 16px;
          border-radius: 14px;
          background: rgba(102, 126, 234, 0.08);
          position: relative;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }

        .frame-card:hover {
          transform: translateY(-1px);
          box-shadow: 0 12px 26px rgba(102, 126, 234, 0.22);
        }

        .frame-card--disabled {
          opacity: 0.6;
          filter: grayscale(0.3);
        }

        .frame-card__preview {
          position: relative;
          border-radius: 12px;
          overflow: hidden;
          background: #1f2937;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .frame-card__preview img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .frame-card__badge {
          position: absolute;
          top: 10px;
          left: 10px;
          background: rgba(31, 41, 55, 0.8);
          color: white;
          padding: 4px 10px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 600;
        }

        .frame-card__content {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .frame-card__header {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          align-items: baseline;
          flex-wrap: wrap;
        }

        .frame-card__header strong {
          font-size: 1rem;
          color: #1f2937;
        }

        .frame-card__header small {
          color: #4a5568;
        }

        .frame-card__controls {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
        }

        .frame-card__controls label {
          display: flex;
          flex-direction: column;
          gap: 6px;
          font-weight: 500;
          color: #1f2937;
        }

        .frame-card__controls input[type='number'] {
          padding: 8px 12px;
          border-radius: 10px;
          border: 1px solid #cbd5f5;
          width: 120px;
        }

        .frame-card__toggle {
          flex-direction: row !important;
          align-items: center;
          gap: 10px;
        }

        .frame-card__actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .frame-card__actions button {
          border: none;
          background: white;
          width: 38px;
          height: 38px;
          border-radius: 10px;
          cursor: pointer;
          box-shadow: 0 6px 14px rgba(102, 126, 234, 0.25);
          font-weight: 700;
          color: #4c51bf;
        }

        .frame-card__actions button:hover:not(:disabled) {
          transform: translateY(-1px);
        }

        .frame-card__actions button:disabled {
          opacity: 0.4;
          cursor: not-allowed;
          box-shadow: none;
        }

        .options {
          background: white;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
          margin-bottom: 24px;
        }

        .options h2 {
          margin-top: 0;
          margin-bottom: 16px;
        }

        .options .grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 16px;
        }

        .options label {
          display: flex;
          flex-direction: column;
          gap: 6px;
          font-weight: 500;
          color: #1f2937;
        }

        .options label select,
        .options label input[type='number'] {
          padding: 8px 12px;
          border-radius: 10px;
          border: 1px solid #cbd5f5;
          font-size: 0.95rem;
        }

        .options .checkbox {
          flex-direction: row;
          align-items: center;
          gap: 10px;
        }

        .speed-presets {
          margin-top: 20px;
          border-top: 1px solid #edf2f7;
          padding-top: 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .speed-presets .speed-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px;
          font-weight: 600;
        }

        .speed-presets .speed-header small {
          font-weight: 400;
          color: #718096;
        }

        .speed-presets .preset-buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .speed-presets .preset-buttons button {
          padding: 10px 16px;
          border-radius: 999px;
          border: 1px solid #cbd5f5;
          background: #f8f9ff;
          color: #4c51bf;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .speed-presets .preset-buttons button:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 10px 18px rgba(102, 126, 234, 0.2);
        }

        .speed-presets .preset-buttons button.active {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-color: transparent;
          box-shadow: 0 12px 20px rgba(102, 126, 234, 0.35);
        }

        .speed-presets .preset-buttons button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .speed-presets .custom-delay {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .speed-presets .custom-delay input {
          border-radius: 10px;
          border: 1px solid #d1d5db;
          padding: 10px 12px;
          font-size: 0.95rem;
        }

        .cta {
          text-align: center;
          margin-bottom: 32px;
        }

        .build-button {
          background: linear-gradient(135deg, #f6d365 0%, #fda085 100%);
          color: #1f2937;
          border: none;
          border-radius: 999px;
          padding: 14px 36px;
          font-size: 1.1rem;
          font-weight: 700;
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .processing-hint {
          margin-top: 12px;
          color: #4a5568;
          font-size: 0.95rem;
        }

        .build-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 12px 24px rgba(253, 160, 133, 0.4);
        }

        .build-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .result {
          background: white;
          border-radius: 16px;
          padding: 32px 24px;
          box-shadow: 0 12px 32px rgba(15, 23, 42, 0.1);
        }

        .result--error {
          background: #fef2f2;
          border: 1px solid #fecaca;
          box-shadow: none;
          color: #991b1b;
        }

        .result--error h2 {
          color: #b91c1c;
        }

        .result--error p {
          text-align: center;
          color: #7f1d1d;
        }

        .result h2 {
          text-align: center;
          margin-top: 0;
        }

        .preview {
          display: flex;
          justify-content: center;
          padding: 16px;
        }

        .preview img {
          max-width: 100%;
          border-radius: 16px;
          box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
        }

        .result-actions {
          display: flex;
          gap: 16px;
          justify-content: center;
          flex-wrap: wrap;
        }

        .result-actions button {
          padding: 12px 24px;
          border-radius: 999px;
          border: none;
          cursor: pointer;
          font-weight: 600;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .result-actions button:nth-child(2) {
          background: linear-gradient(135deg, #f6d365 0%, #fda085 100%);
          color: #1f2937;
        }

        .result-actions button:hover {
          transform: translateY(-1px);
          box-shadow: 0 10px 24px rgba(102, 126, 234, 0.35);
        }

        @media (max-width: 640px) {
          .dropzone {
            padding: 24px 16px;
          }

          .frame-card {
            grid-template-columns: 1fr;
          }

          .frame-card__actions {
            justify-content: flex-start;
          }
        }
  `}</style>
    </div>
  );
}
