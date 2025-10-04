import React, { useEffect, useMemo, useRef, useState } from 'react';
import { NotificationService } from '../utils/NotificationService.js';
import '../aio-convert-style.css';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/bmp'];
const FORMAT_OPTIONS = [
  { label: 'JPEG (.jpg)', value: 'image/jpeg' },
  { label: 'WebP (.webp)', value: 'image/webp' },
  { label: 'PNG (.png)', value: 'image/png' }
];

const initialSettings = {
  quality: 0.8,
  maxWidth: 1920,
  maxHeight: 1920,
  outputFormat: 'image/webp',
  keepResolution: true
};

const formatBytes = (bytes) => {
  if (!bytes && bytes !== 0) return '—';
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const value = parseFloat((bytes / Math.pow(k, i)).toFixed(2));
  return `${value} ${sizes[i]}`;
};

const getOptimizedDimensions = (width, height, settings) => {
  if (settings.keepResolution) {
    return { width, height };
  }

  const maxW = Number(settings.maxWidth) || width;
  const maxH = Number(settings.maxHeight) || height;
  const ratio = Math.min(maxW / width, maxH / height, 1);
  return {
    width: Math.round(width * ratio),
    height: Math.round(height * ratio)
  };
};

const readFileAsDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = reject;
  reader.readAsDataURL(file);
});

const optimizeImage = async (file, settings) => {
  const imageBitmap = await createImageBitmap(file).catch((err) => {
    NotificationService.error('Preview failed', `${file.name}: ${err.message}`);
    throw err;
  });

  const canvas = document.createElement('canvas');
  const { width, height } = getOptimizedDimensions(imageBitmap.width, imageBitmap.height, settings);
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(imageBitmap, 0, 0, width, height);

  const mimeType = settings.outputFormat || file.type || 'image/webp';

  const optimizedBlob = await new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Failed to encode optimized image.'));
        return;
      }
      resolve(blob);
    }, mimeType, settings.quality);
  });

  if (typeof imageBitmap.close === 'function') {
    imageBitmap.close();
  }

  const optimizedFile = new File([optimizedBlob], generateOptimizedName(file.name, mimeType), {
    type: mimeType,
    lastModified: Date.now()
  });

  const previewUrl = URL.createObjectURL(optimizedBlob);

  return {
    optimizedFile,
    previewUrl,
    originalSize: file.size,
    optimizedSize: optimizedBlob.size,
    width,
    height,
    originalWidth: imageBitmap.width,
    originalHeight: imageBitmap.height
  };
};

const generateOptimizedName = (originalName, mimeType) => {
  const extensionMap = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp'
  };
  const base = originalName.replace(/\.[^/.]+$/, '');
  const ext = extensionMap[mimeType] || 'webp';
  return `${base}-optimized.${ext}`;
};

const OptimizationSummary = ({ results }) => {
  const totals = useMemo(() => {
    if (!results.length) return null;
    const originalBytes = results.reduce((acc, item) => acc + (item.originalSize || 0), 0);
    const optimizedBytes = results.reduce((acc, item) => acc + (item.optimizedSize || 0), 0);
    const saved = Math.max(originalBytes - optimizedBytes, 0);
    const percent = originalBytes ? Math.round((saved / originalBytes) * 100) : 0;
    return { originalBytes, optimizedBytes, saved, percent };
  }, [results]);

  if (!totals) return null;

  return (
    <div className="optimization-summary">
      <h3>Optimization Summary</h3>
      <div className="summary-grid">
        <div>
          <span className="label">Original Total</span>
          <strong>{formatBytes(totals.originalBytes)}</strong>
        </div>
        <div>
          <span className="label">Optimized Total</span>
          <strong>{formatBytes(totals.optimizedBytes)}</strong>
        </div>
        <div>
          <span className="label">Space Saved</span>
          <strong>{formatBytes(totals.saved)} ({totals.percent}%)</strong>
        </div>
      </div>
    </div>
  );
};

export default function ImageOptimizer() {
  const [files, setFiles] = useState([]);
  const [settings, setSettings] = useState(initialSettings);
  const [results, setResults] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => () => {
    results.forEach((result) => URL.revokeObjectURL(result.previewUrl));
  }, [results]);

  const handleFiles = (incoming) => {
    const sanitized = incoming.filter((file) => {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        NotificationService.toast(`${file.name} is not a supported image format.`, 'warning');
        return false;
      }
      return true;
    });

    if (!sanitized.length) return;

    setFiles((prev) => [...prev, ...sanitized]);
  };

  const onFileInputChange = (e) => {
    const selected = Array.from(e.target.files || []);
    handleFiles(selected);
  };

  const onDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    const dropped = Array.from(event.dataTransfer.files || []);
    handleFiles(dropped);
  };

  const onDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const clearAll = () => {
    results.forEach((result) => URL.revokeObjectURL(result.previewUrl));
    setFiles([]);
    setResults([]);
  };

  const processOptimization = async () => {
    if (!files.length) {
      NotificationService.toast('Add at least one image to optimize.', 'info');
      return;
    }

    setIsProcessing(true);
    results.forEach((result) => URL.revokeObjectURL(result.previewUrl));
    setResults([]);

    const progressToast = NotificationService.progressToast(
      'Optimizing images...',
      'Processing happens in your browser. This might take a moment for large files.'
    );

    try {
      const nextResults = [];
      for (const file of files) {
        try {
          const optimized = await optimizeImage(file, settings);
          nextResults.push({
            file,
            ...optimized
          });
        } catch (err) {
          NotificationService.error('Optimization failed', `${file.name}: ${err.message}`);
        }
      }
      setResults(nextResults);
      NotificationService.success(`Optimized ${nextResults.length} image${nextResults.length === 1 ? '' : 's'} successfully.`);
    } catch (err) {
      NotificationService.error('Optimization failed', err.message);
    } finally {
      progressToast.close();
      setIsProcessing(false);
    }
  };

  const handleDownload = (result) => {
    const link = document.createElement('a');
    link.href = result.previewUrl;
    link.download = result.optimizedFile.name;
    link.click();
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, idx) => idx !== index));
  };

  return (
    <div className="converter-container image-optimizer">
      <div className="main-content">
        <div className="tool-header">
          <h1>Image Optimizer</h1>
          <p className="tool-subtitle">Compress images without leaving your browser. Drop files, tweak quality, and download smaller versions instantly.</p>
        </div>

        <div className="tool-usage-card">
          <h3>How this tool works</h3>
          <ul>
            <li>Upload JPG, PNG, GIF, WebP, or BMP images up to 25&nbsp;GB each.</li>
            <li>Choose the target format and quality slider to balance size and fidelity.</li>
            <li>Optionally resize large images by disabling “Keep original resolution”.</li>
            <li>Click <strong>Optimize Images</strong> to process everything locally, then download each result.</li>
          </ul>
        </div>

        <section
          className="optimizer-dropzone"
          onClick={() => fileInputRef.current?.click()}
          onDrop={onDrop}
          onDragOver={onDragOver}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={ACCEPTED_TYPES.join(',')}
            onChange={onFileInputChange}
            style={{ display: 'none' }}
          />
          <div className="dropzone-inner">
            <div className="icon">📤</div>
            <h3>Drop images here or browse</h3>
            <p>All processing is 100% local and private.</p>
            <button type="button" className="browse-btn">Choose Images</button>
          </div>
        </section>

        {files.length > 0 && (
          <div className="selected-files-panel">
            <div className="panel-header">
              <h3>{files.length} image{files.length === 1 ? '' : 's'} selected</h3>
              <button type="button" className="link-button" onClick={clearAll} disabled={isProcessing}>Clear all</button>
            </div>
            <div className="file-list">
              {files.map((file, index) => (
                <article key={`${file.name}-${index}`} className="file-row">
                  <div className="file-meta">
                    <strong>{file.name}</strong>
                    <span>{formatBytes(file.size)}</span>
                  </div>
                  <button type="button" className="link-button" onClick={() => removeFile(index)} disabled={isProcessing}>
                    Remove
                  </button>
                </article>
              ))}
            </div>
          </div>
        )}

        <div className="optimizer-settings">
          <h3>Optimization Settings</h3>
          <div className="settings-grid">
            <label>
              Output format
              <select
                value={settings.outputFormat}
                onChange={(event) => setSettings((prev) => ({ ...prev, outputFormat: event.target.value }))}
                disabled={isProcessing}
              >
                {FORMAT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>

            <label>
              Quality: <strong>{Math.round(settings.quality * 100)}%</strong>
              <input
                type="range"
                min="0.3"
                max="1"
                step="0.05"
                value={settings.quality}
                onChange={(event) => setSettings((prev) => ({ ...prev, quality: Number(event.target.value) }))}
                disabled={isProcessing}
              />
            </label>

            <label className="checkbox">
              <input
                type="checkbox"
                checked={settings.keepResolution}
                onChange={(event) => setSettings((prev) => ({ ...prev, keepResolution: event.target.checked }))}
                disabled={isProcessing}
              />
              Keep original resolution
            </label>

            {!settings.keepResolution && (
              <div className="size-inputs">
                <label>
                  Max width (px)
                  <input
                    type="number"
                    min="320"
                    max="8000"
                    value={settings.maxWidth}
                    onChange={(event) => setSettings((prev) => ({ ...prev, maxWidth: event.target.value }))}
                    disabled={isProcessing}
                  />
                </label>
                <label>
                  Max height (px)
                  <input
                    type="number"
                    min="320"
                    max="8000"
                    value={settings.maxHeight}
                    onChange={(event) => setSettings((prev) => ({ ...prev, maxHeight: event.target.value }))}
                    disabled={isProcessing}
                  />
                </label>
              </div>
            )}
          </div>
        </div>

        <div className="process-actions">
          <button
            type="button"
            className="primary-btn"
            onClick={processOptimization}
            disabled={isProcessing}
          >
            {isProcessing ? 'Optimizing…' : 'Optimize Images'}
          </button>
        </div>

        {results.length > 0 && (
          <div className="optimization-results">
            <OptimizationSummary results={results} />
            <div className="results-grid">
              {results.map((result, index) => (
                <article key={`${result.optimizedFile.name}-${index}`} className="result-card">
                  <figure>
                    <img src={result.previewUrl} alt={`${result.optimizedFile.name} preview`} loading="lazy" />
                  </figure>
                  <header>
                    <h4>{result.optimizedFile.name}</h4>
                    <span>{result.width}×{result.height}px</span>
                  </header>
                  <dl>
                    <div>
                      <dt>Original:</dt>
                      <dd>{formatBytes(result.originalSize)}</dd>
                    </div>
                    <div>
                      <dt>Optimized:</dt>
                      <dd>{formatBytes(result.optimizedSize)}</dd>
                    </div>
                    <div>
                      <dt>Saved:</dt>
                      <dd>{formatBytes(result.originalSize - result.optimizedSize)}</dd>
                    </div>
                  </dl>
                  <button type="button" className="secondary-btn" onClick={() => handleDownload(result)}>
                    Download optimized
                  </button>
                </article>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
