import { useState, useRef, useMemo } from 'react';
import { NotificationService } from '../utils/NotificationService.js';
import { realAPI, getApiUrl } from '../utils/apiConfig.js';

const DEFAULT_OPTIONS = {
  fps: 12,
  quality: 'high',
  loop: true,
  width: '',
  height: ''
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
  const [files, setFiles] = useState([]);
  const [options, setOptions] = useState(DEFAULT_OPTIONS);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const fileInputRef = useRef(null);
  const dropRef = useRef(null);

  const totalSize = useMemo(() => files.reduce((sum, file) => sum + (file.size || 0), 0), [files]);

  const handleFiles = (incoming) => {
    const uniqueFiles = [];
    const existingNames = new Set(files.map((file) => `${file.name}-${file.lastModified}`));

    incoming.forEach((item) => {
      if (!ACCEPTED_IMAGE_TYPES.includes(item.type)) {
        NotificationService.toast(`${item.name} is not a supported image type`, 'warning');
        return;
      }

      const key = `${item.name}-${item.lastModified}`;
      if (existingNames.has(key)) {
        NotificationService.toast(`${item.name} is already added`, 'info');
        return;
      }

      uniqueFiles.push(item);
    });

    if (uniqueFiles.length === 0) {
      return;
    }

    setFiles((prev) => [...prev, ...uniqueFiles]);
    setResult(null);
  };

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

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const moveFile = (index, direction) => {
    setFiles((prev) => {
      const next = [...prev];
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= next.length) return prev;
      const [moved] = next.splice(index, 1);
      next.splice(targetIndex, 0, moved);
      return next;
    });
  };

  const updateOption = (key, value) => {
    setOptions((prev) => ({ ...prev, [key]: value }));
  };

  const reset = () => {
    setFiles([]);
    setOptions(DEFAULT_OPTIONS);
    setResult(null);
  };

  const buildGif = async () => {
    if (files.length === 0) {
      NotificationService.toast('Please add at least one image', 'warning');
      return;
    }

    setIsProcessing(true);
    const progressToast = NotificationService.progressToast('Creating GIF...', 'Processing your images');

    try {
      const payload = {
        fps: options.fps,
        quality: options.quality,
        loop: options.loop ? 'true' : 'false'
      };

      if (options.width) payload.width = options.width;
      if (options.height) payload.height = options.height;

      const response = await realAPI.createGifFromImages(files, payload);
      setResult(response);
      NotificationService.success('GIF created successfully!');
    } catch (error) {
      console.error('Image GIF maker error:', error);
      NotificationService.error('GIF creation failed', error.message || 'Unexpected error');
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
        <small>Supported formats: PNG, JPG, GIF, WebP, BMP • Total size: {formatBytes(totalSize)}</small>
      </section>

      {files.length > 0 && (
        <section className="file-list">
          <div className="list-header">
            <h2>Frames ({files.length})</h2>
            <div className="actions">
              <button type="button" onClick={reset} disabled={isProcessing}>Clear</button>
            </div>
          </div>

          <ul>
            {files.map((file, index) => (
              <li key={`${file.name}-${file.lastModified}`}>
                <div className="info">
                  <span className="index">#{index + 1}</span>
                  <div>
                    <strong>{file.name}</strong>
                    <small>{formatBytes(file.size)}</small>
                  </div>
                </div>
                <div className="controls">
                  <button type="button" onClick={() => moveFile(index, -1)} disabled={index === 0 || isProcessing} aria-label="Move up">↑</button>
                  <button type="button" onClick={() => moveFile(index, 1)} disabled={index === files.length - 1 || isProcessing} aria-label="Move down">↓</button>
                  <button type="button" onClick={() => removeFile(index)} disabled={isProcessing} aria-label="Remove">✕</button>
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
        </div>
      </section>

      <section className="cta">
        <button type="button" className="build-button" onClick={buildGif} disabled={isProcessing || files.length === 0}>
          {isProcessing ? 'Creating GIF...' : 'Create GIF'}
        </button>
      </section>

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

        .file-list ul {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .file-list li {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          border-radius: 12px;
          background: rgba(102, 126, 234, 0.06);
        }

        .file-list .info {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .file-list .index {
          background: #667eea;
          color: white;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
        }

        .file-list .info small {
          color: #4a5568;
        }

        .file-list .controls {
          display: flex;
          gap: 8px;
        }

        .file-list .controls button {
          border: none;
          background: white;
          width: 32px;
          height: 32px;
          border-radius: 8px;
          cursor: pointer;
          box-shadow: 0 5px 12px rgba(102, 126, 234, 0.25);
        }

        .file-list .controls button:disabled {
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

          .file-list li {
            flex-direction: column;
            align-items: flex-start;
          }

          .file-list .controls {
            margin-top: 12px;
          }
        }
  `}</style>
    </div>
  );
}
