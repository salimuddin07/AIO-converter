import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { NotificationService } from '../utils/NotificationService.js';
import { PAGE_SIZES_MM, pageSizeToPoints, hexToRgbUnit, sanitizeFileName, clampMargin, mmToPoints } from '../utils/pdfExport.js';

const ACCEPTED_TYPES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/gif',
  'image/webp',
  'image/bmp',
  'image/tiff',
  'image/svg+xml',
  'image/heic',
  'image/heif',
  'image/pjpeg',
  'image/x-png'
];

const pageSizeOptions = Object.entries(PAGE_SIZES_MM);

const readImageMeta = (file) => new Promise((resolve, reject) => {
  const objectUrl = URL.createObjectURL(file);
  const img = new Image();
  img.onload = () => {
    resolve({
      width: img.naturalWidth || img.width || 1024,
      height: img.naturalHeight || img.height || 1024,
      objectUrl
    });
  };
  img.onerror = (error) => {
    URL.revokeObjectURL(objectUrl);
    reject(error);
  };
  img.src = objectUrl;
});

const fileToPngDataUrl = (file) => new Promise((resolve, reject) => {
  const img = new Image();
  const objectUrl = URL.createObjectURL(file);
  img.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth || img.width || 1024;
    canvas.height = img.naturalHeight || img.height || 1024;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    URL.revokeObjectURL(objectUrl);
    try {
      const dataUrl = canvas.toDataURL('image/png');
      resolve(dataUrl);
    } catch (err) {
      reject(err);
    }
  };
  img.onerror = (err) => {
    URL.revokeObjectURL(objectUrl);
    reject(err);
  };
  img.src = objectUrl;
});

const downloadBlob = (blob, name) => {
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export default function ImagesToPdfConverter() {
  const [images, setImages] = useState([]);
  const [fileName, setFileName] = useState('images-to-pdf');
  const [settings, setSettings] = useState({
    pageSize: 'a4',
    orientation: 'portrait',
    margin: 12,
    fit: 'contain',
    background: '#ffffff',
    includeTitles: false
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [pdfSummary, setPdfSummary] = useState(null);
  const objectUrlsRef = useRef(new Map());

  useEffect(() => () => {
    objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    objectUrlsRef.current.clear();
  }, []);

  const activeImages = useMemo(() => images.filter((img) => img.include), [images]);
  const totalSize = useMemo(() => images.reduce((sum, img) => sum + (img.file?.size || 0), 0), [images]);

  const addFiles = useCallback(async (fileList) => {
    if (!fileList || fileList.length === 0) return;

    const validFiles = Array.from(fileList).filter((file) => {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        NotificationService.toast(`${file.name} is not a supported image type`, 'warning');
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) {
      return;
    }

    setIsProcessing(true);
    try {
      const newEntries = await Promise.all(validFiles.map(async (file) => {
        const { width, height, objectUrl } = await readImageMeta(file);
        const id = `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2, 8)}`;
        objectUrlsRef.current.set(id, objectUrl);
        return {
          id,
          file,
          name: file.name,
          size: file.size,
          type: file.type,
          previewUrl: objectUrl,
          width,
          height,
          include: true
        };
      }));

      setImages((prev) => [...prev, ...newEntries]);
      setPdfSummary(null);
      setError(null);
    } catch (loadError) {
      console.error('Failed to load image previews:', loadError);
      setError('Unable to read one of the images. Please try different files.');
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const handleFileChange = (event) => {
    const files = event.target.files;
    addFiles(files);
    event.target.value = '';
  };

  const handleDrop = (event) => {
    event.preventDefault();
    addFiles(event.dataTransfer.files);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const removeImage = (id) => {
    setImages((prev) => {
      const next = prev.filter((img) => img.id !== id);
      const url = objectUrlsRef.current.get(id);
      if (url) {
        URL.revokeObjectURL(url);
        objectUrlsRef.current.delete(id);
      }
      return next;
    });
    setPdfSummary(null);
  };

  const moveImage = (id, direction) => {
    setImages((prev) => {
      const index = prev.findIndex((img) => img.id === id);
      if (index === -1) return prev;
      const target = index + direction;
      if (target < 0 || target >= prev.length) return prev;
      const copy = [...prev];
      const [item] = copy.splice(index, 1);
      copy.splice(target, 0, item);
      return copy;
    });
    setPdfSummary(null);
  };

  const updateImage = (id, key, value) => {
    setImages((prev) => prev.map((img) => {
      if (img.id !== id) return img;
      if (key === 'include') {
        return { ...img, include: Boolean(value) };
      }
      return { ...img, [key]: value };
    }));
    setPdfSummary(null);
  };

  const handleSettingChange = (key, value) => {
    setSettings((prev) => ({
      ...prev,
      [key]: key === 'margin' ? clampMargin(value) : value
    }));
    setPdfSummary(null);
  };

  const reset = () => {
    objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    objectUrlsRef.current.clear();
    setImages([]);
    setFileName('images-to-pdf');
    setSettings({ pageSize: 'a4', orientation: 'portrait', margin: 12, fit: 'contain', background: '#ffffff', includeTitles: false });
    setPdfSummary(null);
    setError(null);
  };

  const prepareImageForPdf = async (file) => {
    const isJpeg = file.type === 'image/jpeg' || file.type === 'image/jpg';
    const isPng = file.type === 'image/png';

    if (isJpeg || isPng) {
      const buffer = await file.arrayBuffer();
      return { bytes: new Uint8Array(buffer), type: isJpeg ? 'jpg' : 'png' };
    }

    const dataUrl = await fileToPngDataUrl(file);
    const response = await fetch(dataUrl);
    const buffer = await response.arrayBuffer();
    return { bytes: new Uint8Array(buffer), type: 'png' };
  };

  const convertToPdf = async () => {
    if (activeImages.length === 0) {
      NotificationService.warning('Add at least one image to convert.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    const progressToast = NotificationService.progressToast('Building PDF…', `Processing ${activeImages.length} image${activeImages.length === 1 ? '' : 's'}`);

    try {
      const pdfDoc = await PDFDocument.create();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const { width: pageWidth, height: pageHeight } = pageSizeToPoints(settings.pageSize, settings.orientation);
      const margin = mmToPoints(settings.margin);
      const backgroundColorUnits = hexToRgbUnit(settings.background);
      const includeTitles = settings.includeTitles;

      for (let index = 0; index < activeImages.length; index += 1) {
        const imageEntry = activeImages[index];
        progressToast.update({ message: `Embedding ${imageEntry.name} (${index + 1}/${activeImages.length})`, progress: Math.round((index / activeImages.length) * 80) });
        const { bytes, type } = await prepareImageForPdf(imageEntry.file);
        const embedded = type === 'jpg' ? await pdfDoc.embedJpg(bytes) : await pdfDoc.embedPng(bytes);
        const { width: imgWidth, height: imgHeight } = embedded;

        const page = pdfDoc.addPage([pageWidth, pageHeight]);

        if (settings.background && settings.background !== '#ffffff') {
          page.drawRectangle({
            x: 0,
            y: 0,
            width: pageWidth,
            height: pageHeight,
            color: rgb(backgroundColorUnits.r, backgroundColorUnits.g, backgroundColorUnits.b)
          });
        }

        const maxWidth = pageWidth - margin * 2;
        const maxHeight = includeTitles ? (pageHeight - margin * 3.5) : (pageHeight - margin * 2);

        let drawWidth = imgWidth;
        let drawHeight = imgHeight;

        const scaleContain = Math.min(maxWidth / drawWidth, maxHeight / drawHeight, 1);
        const scaleCover = Math.max(maxWidth / drawWidth, maxHeight / drawHeight);
        const scaleWidth = Math.min(maxWidth / drawWidth, 1);

        let scale = scaleContain;
        if (settings.fit === 'cover') scale = scaleCover;
        if (settings.fit === 'fit-width') scale = scaleWidth;

        drawWidth *= scale;
        drawHeight *= scale;

        const x = (pageWidth - drawWidth) / 2;
        const y = includeTitles ? ((pageHeight - margin * 1.5 - drawHeight) / 2) + margin * 0.5 : (pageHeight - drawHeight) / 2;

        page.drawImage(embedded, {
          x,
          y,
          width: drawWidth,
          height: drawHeight
        });

        if (includeTitles) {
          const caption = imageEntry.name;
          const fontSize = 12;
          const textWidth = font.widthOfTextAtSize(caption, fontSize);
          const textX = (pageWidth - textWidth) / 2;
          const textY = margin;
          page.drawText(caption, {
            x: textX,
            y: textY,
            size: fontSize,
            font,
            color: rgb(0.25, 0.27, 0.31)
          });
        }
      }

      progressToast.update({ message: 'Finalizing PDF file…', progress: 95 });
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const downloadName = sanitizeFileName(fileName, 'pdf');
      downloadBlob(blob, downloadName);
      setPdfSummary({
        name: downloadName,
        size: blob.size,
        pageCount: activeImages.length
      });
      NotificationService.success('PDF created successfully');
    } catch (conversionError) {
      console.error('Image to PDF conversion failed:', conversionError);
      const message = conversionError?.message || 'Unable to generate the PDF';
      setError(message);
      NotificationService.error(`PDF generation failed: ${message}`);
    } finally {
      progressToast.close();
      setIsProcessing(false);
    }
  };

  return (
    <div className="images-to-pdf" onDragOver={handleDragOver} onDrop={handleDrop}>
      <header className="hero">
        <div>
          <h1>🖼️ Images to PDF</h1>
          <p>Combine multiple images into a polished PDF document. Reorder pages, tweak layout options, and export instantly — everything stays on your device.</p>
        </div>
        <div className="hero-actions">
          <button type="button" onClick={reset} className="ghost">Reset</button>
        </div>
      </header>

      <section className="upload">
        <label className="drop-area">
          <input type="file" multiple accept="image/*" onChange={handleFileChange} />
          <div className="drop-content">
            <span className="icon">📁</span>
            <h2>Drop images here or click to browse</h2>
            <p>Supported formats: PNG, JPG, GIF, WebP, BMP, TIFF. Total size: {(totalSize / (1024 * 1024)).toFixed(2)} MB</p>
          </div>
        </label>
      </section>

      {images.length > 0 && (
        <section className="controls">
          <div className="control-grid">
            <label>
              <span>PDF file name</span>
              <input type="text" value={fileName} onChange={(e) => setFileName(e.target.value)} />
            </label>

            <label>
              <span>Page size</span>
              <select value={settings.pageSize} onChange={(e) => handleSettingChange('pageSize', e.target.value)}>
                {pageSizeOptions.map(([key, meta]) => (
                  <option key={key} value={key}>{meta.label}</option>
                ))}
              </select>
            </label>

            <label>
              <span>Orientation</span>
              <select value={settings.orientation} onChange={(e) => handleSettingChange('orientation', e.target.value)}>
                <option value="portrait">Portrait</option>
                <option value="landscape">Landscape</option>
              </select>
            </label>

            <label>
              <span>Margin (mm)</span>
              <input
                type="number"
                min="0"
                max="60"
                value={settings.margin}
                onChange={(e) => handleSettingChange('margin', parseInt(e.target.value, 10) || 0)}
              />
            </label>

            <label>
              <span>Fit mode</span>
              <select value={settings.fit} onChange={(e) => handleSettingChange('fit', e.target.value)}>
                <option value="contain">Contain (show entire image)</option>
                <option value="cover">Cover (fill the page)</option>
                <option value="fit-width">Fit to width</option>
              </select>
            </label>

            <label>
              <span>Background</span>
              <input
                type="color"
                value={settings.background}
                onChange={(e) => handleSettingChange('background', e.target.value)}
              />
            </label>

            <label className="toggle">
              <input
                type="checkbox"
                checked={settings.includeTitles}
                onChange={(e) => handleSettingChange('includeTitles', e.target.checked)}
              />
              <span>Caption each page with file name</span>
            </label>
          </div>

          <button type="button" className="primary" onClick={convertToPdf} disabled={isProcessing || activeImages.length === 0}>
            {isProcessing ? 'Generating PDF…' : `Create PDF (${activeImages.length} page${activeImages.length === 1 ? '' : 's'})`}
          </button>
        </section>
      )}

      {error && (
        <div className="error-banner">{error}</div>
      )}

      {pdfSummary && (
        <div className="success-banner">
          <strong>PDF ready:</strong> {pdfSummary.name} • {pdfSummary.pageCount} pages • {(pdfSummary.size / (1024 * 1024)).toFixed(2)} MB
        </div>
      )}

      {images.length > 0 && (
        <section className="image-grid">
          {images.map((img, index) => (
            <article key={img.id} className={`image-card${img.include ? '' : ' image-card--muted'}`}>
              <div className="image-preview">
                <img src={img.previewUrl} alt={img.name} />
                <span className="badge">#{index + 1}</span>
              </div>
              <div className="image-info">
                <div className="image-title">
                  <h3>{img.name}</h3>
                  <small>{(img.size / 1024).toFixed(1)} KB · {img.width}×{img.height}</small>
                </div>
                <div className="image-actions">
                  <label className="toggle">
                    <input
                      type="checkbox"
                      checked={img.include}
                      onChange={(e) => updateImage(img.id, 'include', e.target.checked)}
                      disabled={isProcessing}
                    />
                    <span>Include in PDF</span>
                  </label>
                  <div className="reorder">
                    <button type="button" onClick={() => moveImage(img.id, -1)} disabled={index === 0 || isProcessing}>↑</button>
                    <button type="button" onClick={() => moveImage(img.id, 1)} disabled={index === images.length - 1 || isProcessing}>↓</button>
                  </div>
                </div>
                <button type="button" className="ghost" onClick={() => removeImage(img.id)} disabled={isProcessing}>Remove</button>
              </div>
            </article>
          ))}
        </section>
      )}

      <style>{`
        .images-to-pdf {
          max-width: 1200px;
          margin: 0 auto;
          padding: 32px 20px 80px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .hero {
          display: flex;
          justify-content: space-between;
          gap: 20px;
        }

        .hero h1 {
          margin: 0 0 8px;
          font-size: 2.4rem;
          color: #1f2937;
        }

        .hero p {
          margin: 0;
          color: #4b5563;
          max-width: 640px;
          line-height: 1.6;
        }

        .hero-actions {
          display: flex;
          gap: 12px;
        }

        .ghost {
          border: 1px solid rgba(99, 102, 241, 0.3);
          background: transparent;
          color: #4c51bf;
          border-radius: 999px;
          padding: 10px 20px;
          font-weight: 600;
          cursor: pointer;
        }

        .upload {
          border-radius: 18px;
          background: rgba(99, 102, 241, 0.06);
          padding: 30px;
        }

        .drop-area {
          display: block;
          border: 2px dashed rgba(99, 102, 241, 0.4);
          border-radius: 16px;
          padding: 50px 20px;
          text-align: center;
          cursor: pointer;
          background: white;
        }

        .drop-area input {
          display: none;
        }

        .drop-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          color: #4c51bf;
        }

        .drop-content .icon {
          font-size: 3rem;
        }

        .controls {
          background: white;
          border-radius: 16px;
          box-shadow: 0 12px 32px rgba(15, 23, 42, 0.12);
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .control-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 18px;
        }

        label span {
          display: block;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 6px;
        }

        input[type='text'],
        input[type='number'],
        select {
          width: 100%;
          border: 1px solid #cbd5f5;
          border-radius: 10px;
          padding: 10px 12px;
        }

        input[type='color'] {
          width: 100%;
          height: 42px;
          border: 1px solid #cbd5f5;
          border-radius: 10px;
          padding: 4px;
        }

        .toggle {
          display: flex;
          align-items: center;
          gap: 10px;
          font-weight: 600;
          color: #1f2937;
        }

        .primary {
          align-self: flex-start;
          background: linear-gradient(135deg, #10b981, #14b8a6);
          color: white;
          border: none;
          border-radius: 999px;
          padding: 12px 28px;
          font-weight: 700;
          cursor: pointer;
        }

        .primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .error-banner {
          background: #fee2e2;
          border: 1px solid #fca5a5;
          border-radius: 12px;
          padding: 14px 16px;
          color: #b91c1c;
        }

        .success-banner {
          background: #ecfdf5;
          border: 1px solid #6ee7b7;
          border-radius: 12px;
          padding: 14px 16px;
          color: #047857;
        }

        .image-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px;
        }

        .image-card {
          background: white;
          border-radius: 16px;
          box-shadow: 0 10px 30px rgba(15, 23, 42, 0.1);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .image-card--muted {
          opacity: 0.45;
        }

        .image-preview {
          position: relative;
          height: 180px;
          background: #111827;
        }

        .image-preview img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .badge {
          position: absolute;
          top: 12px;
          left: 12px;
          background: rgba(17, 24, 39, 0.75);
          color: white;
          border-radius: 999px;
          padding: 4px 10px;
          font-size: 0.8rem;
          font-weight: 600;
        }

        .image-info {
          padding: 0 16px 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .image-title {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .image-title h3 {
          margin: 0;
          font-size: 1.05rem;
          color: #1f2937;
        }

        .image-title small {
          color: #6b7280;
        }

        .image-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .reorder {
          display: flex;
          gap: 8px;
        }

        .reorder button {
          border: none;
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: rgba(99, 102, 241, 0.12);
          cursor: pointer;
          font-weight: 700;
          color: #4c51bf;
        }

        .reorder button:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        @media (max-width: 900px) {
          .hero {
            flex-direction: column;
            align-items: flex-start;
          }

          .control-grid {
            grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          }
        }
      `}</style>
    </div>
  );
}
