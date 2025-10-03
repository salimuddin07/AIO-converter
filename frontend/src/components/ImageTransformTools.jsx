import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Cropper from 'react-easy-crop';
import { NotificationService } from '../utils/NotificationService.js';

const cardStyle = {
  background: 'white',
  borderRadius: '16px',
  padding: '24px',
  boxShadow: '0 10px 30px rgba(15, 23, 42, 0.12)',
  display: 'flex',
  flexDirection: 'column',
  gap: '20px'
};

const sectionTitleStyle = {
  fontSize: '1.2rem',
  fontWeight: 600,
  margin: 0,
  color: '#1f2937'
};

const controlGroupStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '16px',
  alignItems: 'center'
};

const actionButtonStyle = {
  padding: '12px 22px',
  borderRadius: '999px',
  border: 'none',
  fontWeight: 600,
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  color: 'white',
  cursor: 'pointer',
  boxShadow: '0 12px 30px rgba(102, 126, 234, 0.25)'
};

function useLoadedImage(imageUrl, onErrorMessage = 'Unable to load image') {
  const [image, setImage] = useState(null);
  useEffect(() => {
    if (!imageUrl) {
      setImage(null);
      return;
    }
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => setImage(img);
    img.onerror = () => {
      setImage(null);
      NotificationService.error(onErrorMessage);
    };
    img.src = imageUrl;
    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [imageUrl, onErrorMessage]);
  return image;
}

export function ImageResizeTool({ imageUrl, onExport }) {
  const canvasRef = useRef(null);
  const image = useLoadedImage(imageUrl, 'Failed to load image for resizing');
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [originalDimensions, setOriginalDimensions] = useState({ width: 0, height: 0 });
  const [maintainAspect, setMaintainAspect] = useState(true);
  const aspectRatio = useMemo(() => {
    if (!originalDimensions.width || !originalDimensions.height) return 1;
    return originalDimensions.width / originalDimensions.height;
  }, [originalDimensions]);

  const draw = useCallback((img, width, height) => {
    const canvas = canvasRef.current;
    if (!canvas || !img) return;
    canvas.width = Math.max(1, Math.round(width));
    canvas.height = Math.max(1, Math.round(height));
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  }, []);

  useEffect(() => {
    if (image) {
      const { width, height } = image;
      setOriginalDimensions({ width, height });
      setDimensions({ width, height });
      draw(image, width, height);
    }
  }, [image, draw]);

  useEffect(() => {
    if (image && dimensions.width && dimensions.height) {
      draw(image, dimensions.width, dimensions.height);
    }
  }, [dimensions, draw, image]);

  const updateWidth = (value) => {
    const width = Math.max(1, parseInt(value, 10) || 1);
    if (maintainAspect) {
      const height = Math.max(1, Math.round(width / aspectRatio));
      setDimensions({ width, height });
    } else {
      setDimensions((prev) => ({ ...prev, width }));
    }
  };

  const updateHeight = (value) => {
    const height = Math.max(1, parseInt(value, 10) || 1);
    if (maintainAspect) {
      const width = Math.max(1, Math.round(height * aspectRatio));
      setDimensions({ width, height });
    } else {
      setDimensions((prev) => ({ ...prev, height }));
    }
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      NotificationService.error('Nothing to export yet');
      return;
    }
    const dataUrl = canvas.toDataURL('image/png');
    NotificationService.success('Resized image ready!');
    onExport(dataUrl);
  };

  const reset = () => {
    if (!image) return;
    setDimensions({ width: image.width, height: image.height });
    setMaintainAspect(true);
  };

  return (
    <div style={cardStyle}>
      <div>
        <h3 style={sectionTitleStyle}>Resize Image</h3>
        <p style={{ margin: '4px 0 0', color: '#4a5568' }}>
          Enter new dimensions or drag the handles in the preview. Aspect ratio can be unlocked if needed.
        </p>
      </div>

      <div style={controlGroupStyle}>
        <label style={{ display: 'flex', flexDirection: 'column', fontWeight: 600 }}>
          Width (px)
          <input
            type="number"
            min="1"
            value={Math.round(dimensions.width) || ''}
            onChange={(e) => updateWidth(e.target.value)}
            style={{ marginTop: '6px', padding: '8px 12px', borderRadius: '10px', border: '1px solid #cbd5f5', width: '140px' }}
          />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', fontWeight: 600 }}>
          Height (px)
          <input
            type="number"
            min="1"
            value={Math.round(dimensions.height) || ''}
            onChange={(e) => updateHeight(e.target.value)}
            disabled={maintainAspect}
            style={{ marginTop: '6px', padding: '8px 12px', borderRadius: '10px', border: '1px solid #cbd5f5', width: '140px', opacity: maintainAspect ? 0.6 : 1 }}
          />
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
          <input
            type="checkbox"
            checked={maintainAspect}
            onChange={(e) => setMaintainAspect(e.target.checked)}
          />
          Lock aspect ratio ({aspectRatio.toFixed(2)}:1)
        </label>

        <button type="button" onClick={reset} style={{ ...actionButtonStyle, background: '#e2e8f0', color: '#1f2937', boxShadow: 'none' }}>
          Reset
        </button>
      </div>

      <div style={{ borderRadius: '12px', background: '#f8fafc', padding: '16px', overflowX: 'auto' }}>
        <canvas ref={canvasRef} style={{ maxWidth: '100%', borderRadius: '12px' }} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button type="button" onClick={handleDownload} style={actionButtonStyle}>
          Download resized image
        </button>
      </div>
    </div>
  );
}

export function ImageRotateTool({ imageUrl, onExport }) {
  const canvasRef = useRef(null);
  const image = useLoadedImage(imageUrl, 'Failed to load image for rotation');
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);

  const draw = useCallback(() => {
    if (!image || !canvasRef.current) return;
    const angle = ((rotation % 360) + 360) % 360;
    const radians = angle * (Math.PI / 180);
    const sin = Math.abs(Math.sin(radians));
    const cos = Math.abs(Math.cos(radians));
    const width = image.width;
    const height = image.height;
    const canvasWidth = Math.round(width * cos + height * sin);
    const canvasHeight = Math.round(width * sin + height * cos);

    const canvas = canvasRef.current;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    ctx.save();
    ctx.translate(canvasWidth / 2, canvasHeight / 2);
    ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
    ctx.rotate(radians);
    ctx.drawImage(image, -width / 2, -height / 2);
    ctx.restore();
  }, [flipH, flipV, image, rotation]);

  useEffect(() => {
    draw();
  }, [draw]);

  const rotate = (delta) => setRotation((prev) => prev + delta);

  const handleDownload = () => {
    if (!canvasRef.current) {
      NotificationService.error('Nothing to export yet');
      return;
    }
    const dataUrl = canvasRef.current.toDataURL('image/png');
    NotificationService.success('Rotated image ready!');
    onExport(dataUrl);
  };

  const reset = () => {
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
  };

  return (
    <div style={cardStyle}>
      <div>
        <h3 style={sectionTitleStyle}>Rotate & Flip</h3>
        <p style={{ margin: '4px 0 0', color: '#4a5568' }}>
          Rotate the image by 90° steps or mirror it horizontally/vertically.
        </p>
      </div>

      <div style={controlGroupStyle}>
        <button type="button" onClick={() => rotate(-90)} style={{ ...actionButtonStyle, background: '#fbbf24', boxShadow: '0 12px 24px rgba(251, 191, 36, 0.35)' }}>
          ⟲ Rotate -90°
        </button>
        <button type="button" onClick={() => rotate(90)} style={{ ...actionButtonStyle, background: '#34d399', boxShadow: '0 12px 24px rgba(52, 211, 153, 0.35)' }}>
          ⟳ Rotate +90°
        </button>
        <button type="button" onClick={() => rotate(180)} style={{ ...actionButtonStyle, background: '#60a5fa', boxShadow: '0 12px 24px rgba(96, 165, 250, 0.35)' }}>
          ↻ Rotate 180°
        </button>
        <button type="button" onClick={() => setFlipH((prev) => !prev)} style={{ ...actionButtonStyle, background: flipH ? '#f87171' : '#e5e7eb', color: flipH ? '#fff' : '#1f2937', boxShadow: flipH ? '0 12px 24px rgba(248, 113, 113, 0.35)' : 'none' }}>
          ↔ Flip horizontal
        </button>
        <button type="button" onClick={() => setFlipV((prev) => !prev)} style={{ ...actionButtonStyle, background: flipV ? '#f87171' : '#e5e7eb', color: flipV ? '#fff' : '#1f2937', boxShadow: flipV ? '0 12px 24px rgba(248, 113, 113, 0.35)' : 'none' }}>
          ↕ Flip vertical
        </button>
        <button type="button" onClick={reset} style={{ ...actionButtonStyle, background: '#e2e8f0', color: '#1f2937', boxShadow: 'none' }}>
          Reset
        </button>
      </div>

      <div style={{ borderRadius: '12px', background: '#f8fafc', padding: '16px', overflowX: 'auto' }}>
        <canvas ref={canvasRef} style={{ maxWidth: '100%', borderRadius: '12px' }} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button type="button" onClick={handleDownload} style={actionButtonStyle}>
          Download rotated image
        </button>
      </div>
    </div>
  );
}

const aspectOptions = [
  { value: 'free', label: 'Free' },
  { value: '1:1', label: 'Square 1:1', ratio: 1 },
  { value: '4:3', label: 'Landscape 4:3', ratio: 4 / 3 },
  { value: '16:9', label: 'Widescreen 16:9', ratio: 16 / 9 },
  { value: '3:4', label: 'Portrait 3:4', ratio: 3 / 4 }
];

export function ImageCropTool({ imageUrl, onExport }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [aspect, setAspect] = useState('free');
  const imageElement = useLoadedImage(imageUrl, 'Failed to load image for cropping');

  const onCropComplete = useCallback((_, croppedPixels) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleDownload = async () => {
    if (!imageElement || !croppedAreaPixels) {
      NotificationService.error('Select a region before exporting');
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(croppedAreaPixels.width));
    canvas.height = Math.max(1, Math.round(croppedAreaPixels.height));
    const ctx = canvas.getContext('2d');

    ctx.drawImage(
      imageElement,
      croppedAreaPixels.x,
      croppedAreaPixels.y,
      croppedAreaPixels.width,
      croppedAreaPixels.height,
      0,
      0,
      canvas.width,
      canvas.height
    );

    const dataUrl = canvas.toDataURL('image/png');
    NotificationService.success('Cropped image ready!');
    onExport(dataUrl);
  };

  return (
    <div style={cardStyle}>
      <div>
        <h3 style={sectionTitleStyle}>Crop Image</h3>
        <p style={{ margin: '4px 0 0', color: '#4a5568' }}>
          Drag the selection area to crop. Choose a preset ratio or stay in freeform mode.
        </p>
      </div>

      <div style={{ position: 'relative', width: '100%', height: '420px', background: '#111827', borderRadius: '16px', overflow: 'hidden' }}>
        {imageUrl && (
          <Cropper
            image={imageUrl}
            crop={crop}
            zoom={zoom}
            aspect={aspect === 'free' ? undefined : aspectOptions.find((opt) => opt.value === aspect)?.ratio}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            restrictPosition={false}
            style={{ containerStyle: { background: '#111827' } }}
          />
        )}
      </div>

      <div style={controlGroupStyle}>
        <label style={{ display: 'flex', flexDirection: 'column', fontWeight: 600 }}>
          Zoom
          <input
            type="range"
            min="1"
            max="3"
            step="0.1"
            value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            style={{ marginTop: '6px', width: '200px' }}
          />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', fontWeight: 600 }}>
          Aspect ratio
          <select
            value={aspect}
            onChange={(e) => setAspect(e.target.value)}
            style={{ marginTop: '6px', padding: '8px 12px', borderRadius: '10px', border: '1px solid #cbd5f5', width: '200px' }}
          >
            {aspectOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button type="button" onClick={handleDownload} style={actionButtonStyle}>
          Download cropped image
        </button>
      </div>
    </div>
  );
}
