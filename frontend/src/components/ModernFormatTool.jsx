import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { NotificationService } from '../utils/NotificationService.js';
import { api as realAPI } from '../utils/unifiedAPI.js';

// Legacy compatibility for downloadFile
const downloadFile = async (data, filename) => {
  return await realAPI.saveFile(data, filename);
};

const FORMAT_CONFIG = {
  apng: {
    title: 'APNG Animator',
    subtitle: 'Build smooth animated PNGs with fine-grained frame control and instant previews.',
    actionLabel: 'Create APNG',
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp']
    },
    maxFiles: 100
  },
  avif: {
    title: 'AVIF Converter',
    subtitle: 'Convert images to AVIF for ultra-small file sizes without compromising quality.',
    actionLabel: 'Convert to AVIF',
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp', '.tiff', '.bmp']
    },
    maxFiles: 30
  },
  jxl: {
    title: 'JPEG XL Converter',
    subtitle: 'Upgrade your assets to JPEG XL for cutting-edge compression and HDR support.',
    actionLabel: 'Convert to JPEG XL',
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp', '.tiff', '.bmp']
    },
    maxFiles: 30
  }
};

const initialOptionsByFormat = {
  apng: {
    fps: 12,
    loopMode: 'infinite',
    loopCount: 1,
    resizeEnabled: false,
    width: '',
    height: '',
    fit: 'contain'
  },
  avif: {
    quality: 55,
    speed: 6,
    lossless: false,
    resizeEnabled: false,
    width: '',
    height: '',
    fit: 'cover'
  },
  jxl: {
    quality: 85,
    effort: 7,
    lossless: false,
    resizeEnabled: false,
    width: '',
    height: '',
    fit: 'contain'
  }
};

const bytesToSize = (bytes) => {
  if (!bytes) return '0 B';
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
};

const ModernFormatTool = ({ format }) => {
  const config = FORMAT_CONFIG[format];
  const [files, setFiles] = useState([]);
  const [options, setOptions] = useState(initialOptionsByFormat[format]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sequenceResult, setSequenceResult] = useState(null);
  const [conversionResults, setConversionResults] = useState([]);
  const [formatInfo, setFormatInfo] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [showComparison, setShowComparison] = useState(false);

  useEffect(() => {
    setOptions(initialOptionsByFormat[format]);
    setFiles([]);
    setSequenceResult(null);
    setConversionResults([]);
    setComparison(null);
    setShowComparison(false);
  }, [format]);

  useEffect(() => {
    // Only fetch format info if format is valid
    if (!format || typeof format !== 'string' || !format.trim()) {
      setFormatInfo(null);
      return;
    }

    let cancelled = false;
    realAPI
      .getModernFormatInfo(format)
      .then((info) => {
        if (!cancelled) {
          setFormatInfo(info?.info || info?.result || info);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setFormatInfo(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [format]);

  useEffect(() => () => {
    files.forEach((item) => {
      if (item.preview) {
        URL.revokeObjectURL(item.preview);
      }
    });
  }, [files]);

  const onDrop = useCallback(
    (acceptedFiles) => {
      if (!acceptedFiles?.length) {
        return;
      }

      const newItems = acceptedFiles.map((file) => ({
        id: `${Date.now()}-${Math.random()}`,
        file,
        name: file.name,
        size: file.size,
        preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null
      }));

      setFiles((prev) => {
        const merged = [...prev, ...newItems];
        if (config.maxFiles && merged.length > config.maxFiles) {
          NotificationService.warning(`Only the first ${config.maxFiles} files are kept for this tool.`);
          return merged.slice(0, config.maxFiles);
        }
        return merged;
      });
      setSequenceResult(null);
      setConversionResults([]);
      setComparison(null);
      setShowComparison(false);
    },
    [config?.maxFiles]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: config.accept,
    multiple: true
  });

  const removeFile = (id) => {
    setFiles((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target?.preview) {
        URL.revokeObjectURL(target.preview);
      }
      return prev.filter((item) => item.id !== id);
    });
  };

  const moveFile = (id, direction) => {
    setFiles((prev) => {
      const index = prev.findIndex((item) => item.id === id);
      if (index === -1) return prev;
      const newIndex = index + direction;
      if (newIndex < 0 || newIndex >= prev.length) return prev;
      const updated = [...prev];
      const [moved] = updated.splice(index, 1);
      updated.splice(newIndex, 0, moved);
      return updated;
    });
  };

  const clearFiles = () => {
    files.forEach((item) => {
      if (item.preview) {
        URL.revokeObjectURL(item.preview);
      }
    });
    setFiles([]);
    setSequenceResult(null);
    setConversionResults([]);
    setComparison(null);
    setShowComparison(false);
  };

  const handleOptionChange = (key, value) => {
    setOptions((prev) => ({
      ...prev,
      [key]: value
    }));
  };

  const buildSettings = useMemo(() => {
    if (format === 'apng') {
      const settings = {
        fps: Math.max(1, parseInt(options.fps, 10) || 12)
      };

      if (options.loopMode === 'infinite') {
        settings.loop = true;
      } else {
        const loopCount = Math.max(1, parseInt(options.loopCount, 10) || 1);
        settings.loop = loopCount;
      }

      if (options.resizeEnabled && options.width && options.height) {
        settings.resize = {
          width: parseInt(options.width, 10),
          height: parseInt(options.height, 10),
          fit: options.fit || 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        };
      }

      return settings;
    }

    if (format === 'avif') {
      const settings = {
        quality: Math.min(100, Math.max(0, parseInt(options.quality, 10) || 55)),
        speed: Math.min(10, Math.max(0, parseInt(options.speed, 10) || 6)),
        lossless: Boolean(options.lossless)
      };

      if (options.resizeEnabled && options.width && options.height) {
        settings.resize = {
          width: parseInt(options.width, 10),
          height: parseInt(options.height, 10),
          fit: options.fit || 'cover',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        };
      }

      return settings;
    }

    // JPEG XL
    const settings = {
      quality: Math.min(100, Math.max(0, parseInt(options.quality, 10) || 85)),
      effort: Math.min(9, Math.max(1, parseInt(options.effort, 10) || 7)),
      lossless: Boolean(options.lossless)
    };

    if (options.resizeEnabled && options.width && options.height) {
      settings.resize = {
        width: parseInt(options.width, 10),
        height: parseInt(options.height, 10),
        fit: options.fit || 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      };
    }

    return settings;
  }, [format, options]);

  const readyToProcess = files.length > 0 && !isProcessing;

  const handleProcess = async () => {
    if (!files.length) {
      NotificationService.warning('Add some files first.');
      return;
    }

    try {
      setIsProcessing(true);
      setSequenceResult(null);
      setConversionResults([]);
      setComparison(null);

      if (format === 'apng') {
        const result = await realAPI.createApngSequence(
          files.map((item) => item.file),
          buildSettings
        );
        setSequenceResult(result);
        NotificationService.success('APNG sequence created successfully!');
      } else if (format === 'avif') {
        const results = await realAPI.convertToAvifModern(
          files.map((item) => item.file),
          buildSettings
        );
        setConversionResults(results);
        NotificationService.success(`Converted ${results.length} file(s) to AVIF.`);
      } else {
        const results = await realAPI.convertToJxl(
          files.map((item) => item.file),
          buildSettings
        );
        setConversionResults(results);
        NotificationService.success(`Converted ${results.length} file(s) to JPEG XL.`);
      }
    } catch (error) {
      console.error('Modern format processing error:', error);
      NotificationService.error('Processing failed', error.message || 'Unknown error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCompare = async () => {
    if (!files.length) {
      NotificationService.warning('Add a file to compare formats.');
      return;
    }
    try {
      setIsProcessing(true);
      const firstFile = files[0].file;
      const result = await realAPI.compareModernFormats(firstFile);
      setComparison(result);
      setShowComparison(true);
      NotificationService.success('Comparison complete.');
    } catch (error) {
      console.error('Format comparison error:', error);
      NotificationService.error('Comparison failed', error.message || 'Unknown error');
    } finally {
      setIsProcessing(false);
    }
  };

  const renderOptions = () => {
    if (format === 'apng') {
      return (
        <div className="options-grid">
          <div className="option-card">
            <label>Frames per second</label>
            <input
              type="range"
              min="1"
              max="60"
              value={options.fps}
              onChange={(e) => handleOptionChange('fps', e.target.value)}
            />
            <div className="option-value">{options.fps} fps</div>
          </div>

          <div className="option-card">
            <label>Loop behaviour</label>
            <div className="radio-row">
              <label>
                <input
                  type="radio"
                  name="loop-mode"
                  value="infinite"
                  checked={options.loopMode === 'infinite'}
                  onChange={(e) => handleOptionChange('loopMode', e.target.value)}
                />
                Infinite
              </label>
              <label>
                <input
                  type="radio"
                  name="loop-mode"
                  value="finite"
                  checked={options.loopMode === 'finite'}
                  onChange={(e) => handleOptionChange('loopMode', e.target.value)}
                />
                Custom
              </label>
            </div>
            {options.loopMode === 'finite' && (
              <input
                type="number"
                min="1"
                max="30"
                value={options.loopCount}
                onChange={(e) => handleOptionChange('loopCount', e.target.value)}
              />
            )}
          </div>

          <div className="option-card">
            <label>
              <input
                type="checkbox"
                checked={options.resizeEnabled}
                onChange={(e) => handleOptionChange('resizeEnabled', e.target.checked)}
              />
              Resize frames
            </label>
            {options.resizeEnabled && (
              <div className="resize-grid">
                <input
                  type="number"
                  placeholder="Width"
                  value={options.width}
                  onChange={(e) => handleOptionChange('width', e.target.value)}
                />
                <input
                  type="number"
                  placeholder="Height"
                  value={options.height}
                  onChange={(e) => handleOptionChange('height', e.target.value)}
                />
                <select
                  value={options.fit}
                  onChange={(e) => handleOptionChange('fit', e.target.value)}
                >
                  <option value="contain">Contain</option>
                  <option value="cover">Cover</option>
                  <option value="fill">Fill</option>
                </select>
              </div>
            )}
          </div>
        </div>
      );
    }

    if (format === 'avif') {
      return (
        <div className="options-grid">
          <div className="option-card">
            <label>Quality</label>
            <input
              type="range"
              min="0"
              max="100"
              value={options.quality}
              onChange={(e) => handleOptionChange('quality', e.target.value)}
            />
            <div className="option-value">{options.quality}%</div>
          </div>

          <div className="option-card">
            <label>Speed / Effort</label>
            <input
              type="range"
              min="0"
              max="10"
              value={options.speed}
              onChange={(e) => handleOptionChange('speed', e.target.value)}
            />
            <div className="option-value">{options.speed} (lower = slower/better)</div>
          </div>

          <div className="option-card">
            <label>
              <input
                type="checkbox"
                checked={options.lossless}
                onChange={(e) => handleOptionChange('lossless', e.target.checked)}
              />
              Lossless mode
            </label>
          </div>

          <div className="option-card">
            <label>
              <input
                type="checkbox"
                checked={options.resizeEnabled}
                onChange={(e) => handleOptionChange('resizeEnabled', e.target.checked)}
              />
              Resize output
            </label>
            {options.resizeEnabled && (
              <div className="resize-grid">
                <input
                  type="number"
                  placeholder="Width"
                  value={options.width}
                  onChange={(e) => handleOptionChange('width', e.target.value)}
                />
                <input
                  type="number"
                  placeholder="Height"
                  value={options.height}
                  onChange={(e) => handleOptionChange('height', e.target.value)}
                />
                <select
                  value={options.fit}
                  onChange={(e) => handleOptionChange('fit', e.target.value)}
                >
                  <option value="cover">Cover</option>
                  <option value="contain">Contain</option>
                  <option value="fill">Fill</option>
                </select>
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="options-grid">
        <div className="option-card">
          <label>Quality</label>
          <input
            type="range"
            min="0"
            max="100"
            value={options.quality}
            onChange={(e) => handleOptionChange('quality', e.target.value)}
          />
          <div className="option-value">{options.quality}%</div>
        </div>

        <div className="option-card">
          <label>Effort</label>
          <input
            type="range"
            min="1"
            max="9"
            value={options.effort}
            onChange={(e) => handleOptionChange('effort', e.target.value)}
          />
          <div className="option-value">{options.effort} (higher = better compression)</div>
        </div>

        <div className="option-card">
          <label>
            <input
              type="checkbox"
              checked={options.lossless}
              onChange={(e) => handleOptionChange('lossless', e.target.checked)}
            />
            Lossless mode
          </label>
        </div>

        <div className="option-card">
          <label>
            <input
              type="checkbox"
              checked={options.resizeEnabled}
              onChange={(e) => handleOptionChange('resizeEnabled', e.target.checked)}
            />
            Resize output
          </label>
          {options.resizeEnabled && (
            <div className="resize-grid">
              <input
                type="number"
                placeholder="Width"
                value={options.width}
                onChange={(e) => handleOptionChange('width', e.target.value)}
              />
              <input
                type="number"
                placeholder="Height"
                value={options.height}
                onChange={(e) => handleOptionChange('height', e.target.value)}
              />
              <select
                value={options.fit}
                onChange={(e) => handleOptionChange('fit', e.target.value)}
              >
                <option value="contain">Contain</option>
                <option value="cover">Cover</option>
                <option value="fill">Fill</option>
              </select>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderResults = () => {
    if (format === 'apng') {
      if (!sequenceResult) return null;
      return (
        <div className="results-card">
          <h3>🎉 APNG ready</h3>
          <p>Frames: {sequenceResult.frameCount || files.length}</p>
          <p>Size: {bytesToSize(sequenceResult.size)}</p>
          <button
            className="download-btn"
            onClick={() => downloadFile(sequenceResult.downloadUrl, sequenceResult.outputName || 'animation.png')}
          >
            Download animation
          </button>
          {sequenceResult.note && <p className="note">{sequenceResult.note}</p>}
        </div>
      );
    }

    if (!conversionResults.length) return null;

    return (
      <div className="results-card">
        <h3>✅ Conversion complete</h3>
        <ul className="results-list">
          {conversionResults.map((result, index) => (
            <li key={index} className="result-item">
              <div>
                <strong>{result.originalName}</strong>
                <div className="result-meta">
                  Output: {result.outputName || result.format?.toUpperCase()} · {bytesToSize(result.size)}
                </div>
                {result.compression && (
                  <div className="result-meta">Savings: {result.compression}</div>
                )}
              </div>
              <button
                className="download-btn"
                onClick={() => downloadFile(result.downloadUrl, result.outputName || `converted-${result.originalName}`)}
              >
                Download
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const renderComparison = () => {
    if (!comparison || !showComparison) return null;

    const conversions = comparison.results?.conversions || {};

    return (
      <div className="comparison-card">
        <h3>Format comparison</h3>
        <p>Original: {comparison.originalName} ({bytesToSize(comparison.results?.original?.size)})</p>
        <div className="comparison-grid">
          {Object.entries(conversions).map(([key, value]) => (
            <div key={key} className="comparison-item">
              <h4>{key.toUpperCase()}</h4>
              {value.error ? (
                <p className="error-text">{value.error}</p>
              ) : (
                <>
                  <p>{bytesToSize(value.size)}</p>
                  <p>Savings: {value.savings}</p>
                  <button
                    className="download-btn"
                    onClick={() => downloadFile(value.downloadUrl, `${comparison.originalName}.${key}`)}
                  >
                    Download
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="modern-format-tool">
      <div className="tool-header">
        <div>
          <h2>{config.title}</h2>
          <p>{config.subtitle}</p>
        </div>
        <div className="header-actions">
          <button className="secondary-btn" onClick={handleCompare} disabled={isProcessing || !files.length}>
            Compare formats
          </button>
          <button className="ghost-btn" onClick={clearFiles} disabled={!files.length}>
            Clear files
          </button>
        </div>
      </div>

      <div className="tool-body">
        <div className="left-pane">
          <div
            {...getRootProps({ className: `dropzone ${isDragActive ? 'drag-active' : ''}` })}
          >
            <input {...getInputProps()} />
            <div className="dropzone-content">
              <div className="upload-icon">📁</div>
              <p>{isDragActive ? 'Drop files here…' : 'Drag & drop files or click to browse'}</p>
              <small>Supported: {Object.values(config.accept).flat().join(', ')}</small>
            </div>
          </div>

          {files.length > 0 && (
            <div className="file-list">
              <div className="file-list-header">
                <h3>{files.length} file{files.length > 1 ? 's' : ''} selected</h3>
              </div>
              <ul>
                {files.map((item, index) => (
                  <li key={item.id} className="file-item">
                    {item.preview && (
                      <img src={item.preview} alt={item.name} className="file-thumb" />
                    )}
                    <div className="file-info">
                      <span className="file-name">{item.name}</span>
                      <span className="file-size">{bytesToSize(item.size)}</span>
                    </div>
                    <div className="file-actions">
                      <button onClick={() => moveFile(item.id, -1)} disabled={index === 0}>↑</button>
                      <button onClick={() => moveFile(item.id, 1)} disabled={index === files.length - 1}>↓</button>
                      <button onClick={() => removeFile(item.id)}>✕</button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="options-section">
            <h3>Conversion settings</h3>
            {renderOptions()}
          </div>

          <div className="actions">
            <button
              className="primary-btn"
              onClick={handleProcess}
              disabled={!readyToProcess}
            >
              {isProcessing ? 'Processing…' : config.actionLabel}
            </button>
          </div>
        </div>

        <div className="right-pane">
          {formatInfo && (
            <div className="info-card">
              <h3>{formatInfo.name}</h3>
              <p className="info-description">{formatInfo.description}</p>
              {formatInfo.supports && (
                <p><strong>Supports:</strong> {formatInfo.supports.join(', ')}</p>
              )}
              {formatInfo.browserSupport && (
                <p><strong>Browser support:</strong> {formatInfo.browserSupport}</p>
              )}
              {formatInfo.advantages && (
                <ul className="info-list">
                  {formatInfo.advantages.map((adv, idx) => (
                    <li key={idx}>{adv}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {renderResults()}
          {renderComparison()}
        </div>
      </div>
    </div>
  );
};

export const ApngStudio = () => <ModernFormatTool format="apng" />;
export const AvifStudio = () => <ModernFormatTool format="avif" />;
export const JxlStudio = () => <ModernFormatTool format="jxl" />;

export default ModernFormatTool;
