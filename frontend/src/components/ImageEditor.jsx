import React, { useRef, useEffect, useState, useCallback } from 'react';
import Konva from 'konva';
import { Stage, Layer, Image as KonvaImage, Text as KonvaText, Transformer, Line } from 'react-konva';
import { NotificationService } from '../utils/NotificationService.js';

const MAX_HISTORY = 40;

const FONT_FAMILIES = [
  'Inter',
  'Roboto',
  'Poppins',
  'Montserrat',
  'Playfair Display',
  'Lora',
  'Oswald',
  'Raleway',
  'Merriweather',
  'Lobster',
  'Georgia',
  'Courier New'
];

const BRUSH_PRESETS = {
  pencil: {
    label: 'Pencil',
    icon: '✏️',
    strokeWidth: 4,
    opacity: 1,
    color: '#2c3e50',
    tension: 0.25,
    lineCap: 'round',
    lineJoin: 'round',
    composite: 'source-over'
  },
  brush: {
    label: 'Brush',
    icon: '🖌️',
    strokeWidth: 12,
    opacity: 0.9,
    color: '#1e88e5',
    tension: 0.4,
    lineCap: 'round',
    lineJoin: 'round',
    composite: 'source-over'
  },
  marker: {
    label: 'Marker',
    icon: '🖊️',
    strokeWidth: 16,
    opacity: 0.85,
    color: '#d81b60',
    tension: 0.5,
    lineCap: 'round',
    lineJoin: 'round',
    composite: 'source-over'
  },
  highlighter: {
    label: 'Highlighter',
    icon: '🖍️',
    strokeWidth: 22,
    opacity: 0.35,
    color: '#fbc02d',
    tension: 0.3,
    lineCap: 'round',
    lineJoin: 'round',
    composite: 'source-over'
  },
  eraser: {
    label: 'Eraser',
    icon: '🧽',
    strokeWidth: 24,
    opacity: 1,
    color: '#ffffff',
    tension: 0.3,
    lineCap: 'round',
    lineJoin: 'round',
    composite: 'destination-out'
  }
};

const TEXT_ALIGNMENT_OPTIONS = [
  { value: 'left', icon: '⬅️', label: 'Align Left' },
  { value: 'center', icon: '↔️', label: 'Align Center' },
  { value: 'right', icon: '➡️', label: 'Align Right' },
  { value: 'justify', icon: '🪄', label: 'Justify' }
];

const TEXT_STYLE_BUTTONS = [
  { key: 'bold', label: 'Bold', icon: 'B' },
  { key: 'italic', label: 'Italic', icon: 'I' },
  { key: 'underline', label: 'Underline', icon: 'U' },
  { key: 'uppercase', label: 'Uppercase', icon: 'TT' }
];

const normalizeFontStyle = (bold, italic) => {
  const parts = [];
  if (bold) parts.push('bold');
  if (italic) parts.push('italic');
  return parts.join(' ').trim() || 'normal';
};

const buildTextElementFromConfig = (config, overrides = {}) => {
  const rawText = config.text ?? '';
  const uppercase = !!config.uppercase;
  const textValue = uppercase ? rawText.toUpperCase() : rawText;

  return {
    type: 'text',
    text: textValue,
    rawText,
    uppercase,
    fontSize: config.fontSize ?? 32,
    fontFamily: config.fontFamily ?? FONT_FAMILIES[0],
    fill: config.fill ?? '#ffffff',
    align: config.align ?? 'center',
    fontStyle: normalizeFontStyle(config.bold, config.italic),
    textDecoration: config.underline ? 'underline' : '',
    letterSpacing: config.letterSpacing ?? 0,
    lineHeight: config.lineHeight ?? 1.2,
    stroke: config.strokeWidth > 0 ? (config.strokeColor ?? '#000000') : '',
    strokeWidth: config.strokeWidth ?? 0,
  shadowColor: config.shadowColor ?? '#000000',
  shadowBlur: config.shadowBlur ?? 0,
  shadowOpacity: (config.shadowBlur ?? 0) > 0 ? 0.85 : 0,
    shadowOffsetX: config.shadowOffsetX ?? 0,
    shadowOffsetY: config.shadowOffsetY ?? 0,
    padding: config.padding ?? 0,
    rotation: config.rotation ?? 0,
    ...overrides
  };
};

const cloneElements = (list = []) => list.map((el) => ({
  ...el,
  points: el.points ? [...el.points] : undefined
}));

const normaliseElement = (element) => ({
  scaleX: 1,
  scaleY: 1,
  rotation: 0,
  ...element
});

const normaliseElements = (elements) => elements.map(normaliseElement);

const ImageEditor = ({ 
  imageUrl, 
  width = 800, 
  height = 600, 
  onSave,
  tools = ['text', 'draw', 'crop', 'filters'],
  defaultTool = 'text'
}) => {
  const stageRef = useRef();
  const layerRef = useRef();
  const transformerRef = useRef();
  const pathRef = useRef([]);
  const imageInputRef = useRef(null);
  const [image, setImage] = useState(null);
  const [selectedTool, setSelectedTool] = useState(defaultTool);
  useEffect(() => {
    setSelectedTool(defaultTool);
  }, [defaultTool]);
  const [selectedElement, setSelectedElement] = useState(null);
  const [elements, setElements] = useState([]);
  const historyRef = useRef([]);
  const futureRef = useRef([]);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [imageCache, setImageCache] = useState({});
  const imageUrlRef = useRef(new Map());
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState([]);
  const [brushMode, setBrushMode] = useState('pencil');
  const [brushSize, setBrushSize] = useState(BRUSH_PRESETS.pencil.strokeWidth);
  const [brushColor, setBrushColor] = useState(BRUSH_PRESETS.pencil.color);
  const [brushOpacity, setBrushOpacity] = useState(BRUSH_PRESETS.pencil.opacity);
  const [textConfig, setTextConfig] = useState({
    text: 'Add your text',
    fontSize: 32,
    fontFamily: FONT_FAMILIES[0],
    fill: '#ffffff',
    align: 'center',
    bold: true,
    italic: false,
    underline: false,
    uppercase: false,
    rotation: 0,
    letterSpacing: 0,
    lineHeight: 1.2,
    strokeColor: '#000000',
    strokeWidth: 0,
  shadowColor: '#000000',
    shadowBlur: 0,
    shadowOffsetX: 0,
    shadowOffsetY: 0,
    padding: 0,
    x: null,
    y: null
  });
  const [editingText, setEditingText] = useState({ id: null, value: '', style: {} });
  const [canvasSize, setCanvasSize] = useState({ width, height });
  const currentBrushPreset = BRUSH_PRESETS[brushMode] || BRUSH_PRESETS.pencil;
  const activeTextElement = elements.find((el) => el.id === selectedElement && el.type === 'text');

  useEffect(() => {
    if (selectedTool !== 'select' && transformerRef.current) {
      transformerRef.current.nodes([]);
      transformerRef.current.getLayer().batchDraw();
    }
  }, [selectedTool]);

  useEffect(() => {
    const preset = BRUSH_PRESETS[brushMode];
    if (!preset) return;
    setBrushSize(preset.strokeWidth);
    if (brushMode !== 'eraser') {
      setBrushColor(preset.color);
    }
    setBrushOpacity(preset.opacity);
  }, [brushMode]);

  useEffect(() => {
    if (!imageUrl) {
      setImage(null);
      setCanvasSize({ width, height });
      setElements([]);
      historyRef.current = [cloneElements([])];
      futureRef.current = [];
      setCanUndo(false);
      setCanRedo(false);
      return;
    }

    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setImage(img);
      const maxDimension = 1200;
      const scale = Math.min(maxDimension / img.width, maxDimension / img.height, 1);
      setCanvasSize({
        width: Math.max(200, Math.round(img.width * scale)),
        height: Math.max(200, Math.round(img.height * scale))
      });
      setElements([]);
      historyRef.current = [cloneElements([])];
      futureRef.current = [];
      setCanUndo(false);
      setCanRedo(false);
    };
    img.onerror = () => {
      setImage(null);
      setCanvasSize({ width, height });
    };
    img.src = imageUrl;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [imageUrl, width, height]);

  useEffect(() => {
    const element = elements.find((el) => el.id === selectedElement);
    if (element && element.type === 'text') {
      const fontStyle = element.fontStyle || '';
      const shadowColorIsHex = typeof element.shadowColor === 'string' && element.shadowColor.startsWith('#');
      setTextConfig((prev) => ({
        ...prev,
        text: element.rawText ?? element.text ?? prev.text,
        fontSize: element.fontSize ?? prev.fontSize,
        fontFamily: element.fontFamily ?? prev.fontFamily,
        fill: element.fill ?? prev.fill,
        align: element.align ?? prev.align ?? 'left',
        bold: fontStyle.includes('bold'),
        italic: fontStyle.includes('italic'),
        underline: (element.textDecoration ?? '').includes('underline'),
        uppercase: element.uppercase ?? prev.uppercase ?? false,
        rotation: element.rotation ?? 0,
        letterSpacing: element.letterSpacing ?? prev.letterSpacing ?? 0,
        lineHeight: element.lineHeight ?? prev.lineHeight ?? 1.2,
        strokeColor: element.stroke ? element.stroke : prev.strokeColor,
        strokeWidth: element.strokeWidth ?? prev.strokeWidth ?? 0,
        shadowColor: shadowColorIsHex ? element.shadowColor : prev.shadowColor,
        shadowBlur: element.shadowBlur ?? prev.shadowBlur ?? 0,
        shadowOffsetX: element.shadowOffsetX ?? prev.shadowOffsetX ?? 0,
        shadowOffsetY: element.shadowOffsetY ?? prev.shadowOffsetY ?? 0,
        padding: element.padding ?? prev.padding ?? 0,
        x: element.x ?? prev.x,
        y: element.y ?? prev.y
      }));
    }
  }, [elements, selectedElement]);

  const cleanupRemovedImages = useCallback((prevList, nextList) => {
    const nextImageIds = new Set(nextList.filter((el) => el.type === 'image').map((el) => el.id));
    const removedIds = prevList
      .filter((el) => el.type === 'image' && !nextImageIds.has(el.id))
      .map((el) => el.id);

    if (removedIds.length === 0) return;

    setImageCache((cache) => {
      const updated = { ...cache };
      removedIds.forEach((id) => {
        delete updated[id];
      });
      return updated;
    });

    removedIds.forEach((id) => {
      const url = imageUrlRef.current.get(id);
      if (url) {
        URL.revokeObjectURL(url);
        imageUrlRef.current.delete(id);
      }
    });
  }, []);

  const updateElements = useCallback((updater, { pushHistory = true } = {}) => {
    setElements((prev) => {
      const prevClone = cloneElements(prev);
      const result = typeof updater === 'function' ? updater(prevClone) : cloneElements(updater);
      const next = normaliseElements(result);

      if (pushHistory) {
        historyRef.current.push(prevClone);
        if (historyRef.current.length > MAX_HISTORY) historyRef.current.shift();
        futureRef.current = [];
        setCanUndo(historyRef.current.length > 0);
        setCanRedo(false);
      }

      cleanupRemovedImages(prevClone, next);
      return next;
    });
  }, [cleanupRemovedImages]);

  const applyTextConfig = useCallback((patch, { pushHistory } = {}) => {
    setTextConfig((prev) => {
      const nextConfig = { ...prev, ...patch };
      const shouldPushHistory = pushHistory !== undefined ? pushHistory : true;

      if (selectedElement) {
        updateElements((prevElements) => prevElements.map((el) => {
          if (el.id !== selectedElement || el.type !== 'text') return el;
          const overrides = {
            id: el.id,
            x: nextConfig.x ?? el.x ?? 0,
            y: nextConfig.y ?? el.y ?? 0,
            rotation: nextConfig.rotation ?? el.rotation ?? 0,
            scaleX: el.scaleX ?? 1,
            scaleY: el.scaleY ?? 1,
            offsetX: el.offsetX ?? 0,
            offsetY: el.offsetY ?? 0,
            draggable: el.draggable
          };
          const updated = buildTextElementFromConfig(nextConfig, overrides);
          return { ...el, ...updated };
        }), { pushHistory: shouldPushHistory });
      }

      return nextConfig;
    });
  }, [selectedElement, updateElements]);

  const captureHistorySnapshot = useCallback(() => {
    historyRef.current.push(cloneElements(elements));
    if (historyRef.current.length > MAX_HISTORY) historyRef.current.shift();
    futureRef.current = [];
    setCanUndo(historyRef.current.length > 0);
    setCanRedo(false);
  }, [elements]);

  const undo = useCallback(() => {
    setElements((prev) => {
      if (historyRef.current.length === 0) {
        return prev;
      }
      const prevClone = cloneElements(prev);
      const previousState = historyRef.current.pop();
      const next = normaliseElements(previousState);
      futureRef.current.push(prevClone);
      cleanupRemovedImages(prevClone, next);
      setCanUndo(historyRef.current.length > 0);
      setCanRedo(true);
      return next;
    });
  }, [cleanupRemovedImages]);

  const redo = useCallback(() => {
    setElements((prev) => {
      if (futureRef.current.length === 0) {
        return prev;
      }
      const prevClone = cloneElements(prev);
      const nextState = futureRef.current.pop();
      const next = normaliseElements(nextState);
      historyRef.current.push(prevClone);
      if (historyRef.current.length > MAX_HISTORY) historyRef.current.shift();
      cleanupRemovedImages(prevClone, next);
      setCanUndo(historyRef.current.length > 0);
      setCanRedo(futureRef.current.length > 0);
      return next;
    });
  }, [cleanupRemovedImages]);

  const handleStageClick = (event) => {
    const stage = event.target.getStage();
    const clickedOnEmpty = event.target === stage;
    const pointer = stage.getPointerPosition();

    if (selectedTool === 'text' && pointer && clickedOnEmpty) {
      addText(pointer.x, pointer.y);
      return;
    }

    if (clickedOnEmpty) {
      setSelectedElement(null);
      if (transformerRef.current) {
        transformerRef.current.nodes([]);
        transformerRef.current.getLayer().batchDraw();
      }
    }
  };

  const addText = (x, y) => {
    const id = `text-${Date.now()}`;
    const element = buildTextElementFromConfig({
      ...textConfig,
      text: textConfig.text || 'Double click to edit'
    }, { id, x, y });
    updateElements((prev) => [...prev, element]);
    setSelectedElement(id);
  };

  const handleTextDblClick = (id) => {
    const text = elements.find(el => el.id === id);
    if (!text) return;

    const newText = prompt('Enter text:', text.text);
    if (newText !== null) {
      const parsed = {
        text: newText,
        fontSize: text.fontSize,
        fontFamily: text.fontFamily,
        fill: text.fill,
        align: text.align,
        bold: (text.fontStyle || '').includes('bold'),
        italic: (text.fontStyle || '').includes('italic'),
        underline: (text.textDecoration || '').includes('underline'),
        uppercase: text.uppercase ?? false,
        letterSpacing: text.letterSpacing ?? 0,
        lineHeight: text.lineHeight ?? 1.2,
        strokeColor: text.stroke || textConfig.strokeColor,
        strokeWidth: text.strokeWidth ?? textConfig.strokeWidth,
        shadowColor: text.shadowColor ?? textConfig.shadowColor,
        shadowBlur: text.shadowBlur ?? textConfig.shadowBlur,
        shadowOffsetX: text.shadowOffsetX ?? textConfig.shadowOffsetX,
        shadowOffsetY: text.shadowOffsetY ?? textConfig.shadowOffsetY,
        padding: text.padding ?? textConfig.padding,
        rotation: text.rotation ?? textConfig.rotation,
        x: text.x,
        y: text.y
      };

      updateElements((prev) => prev.map(el => {
        if (el.id !== id || el.type !== 'text') return el;
        const overrides = {
          id: el.id,
          x: text.x,
          y: text.y,
          rotation: text.rotation ?? 0,
          scaleX: el.scaleX ?? 1,
          scaleY: el.scaleY ?? 1,
          offsetX: el.offsetX ?? 0,
          offsetY: el.offsetY ?? 0,
          draggable: el.draggable
        };
        const updated = buildTextElementFromConfig(parsed, overrides);
        return { ...el, ...updated };
      }));

      if (selectedElement === id) {
        setTextConfig((prev) => ({ ...prev, text: newText }));
      }
    }
  };

  const handleMouseDown = (e) => {
    if (selectedTool === 'draw') {
      setIsDrawing(true);
      const pos = e.target.getStage().getPointerPosition();
      if (pos) {
        const initialPath = [pos.x, pos.y];
        pathRef.current = initialPath;
        setCurrentPath(initialPath);
      }
    }
  };

  const handleMouseMove = (e) => {
    if (!isDrawing || selectedTool !== 'draw') return;

    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    if (point) {
      const updatedPath = [...pathRef.current, point.x, point.y];
      pathRef.current = updatedPath;
      setCurrentPath(updatedPath);
    }
  };

  const handleMouseUp = () => {
    if (selectedTool === 'draw' && isDrawing) {
      if (pathRef.current.length < 4) {
        setIsDrawing(false);
        setCurrentPath([]);
        pathRef.current = [];
        return;
      }

      captureHistorySnapshot();

      const newLine = {
        id: `line-${Date.now()}`,
        type: 'line',
        points: [...pathRef.current],
        stroke: brushMode === 'eraser' ? '#ffffff' : brushColor,
        strokeWidth: brushSize,
        opacity: brushMode === 'eraser' ? 1 : brushOpacity,
        tension: currentBrushPreset.tension,
        lineCap: currentBrushPreset.lineCap,
        lineJoin: currentBrushPreset.lineJoin,
        globalCompositeOperation: currentBrushPreset.composite,
        mode: brushMode
      };

  updateElements((prev) => [...prev, newLine], { pushHistory: false });
      setCurrentPath([]);
      pathRef.current = [];
      setIsDrawing(false);
    }
  };

  const handleElementSelect = (id) => {
    if (selectedTool !== 'select') {
      return;
    }
    setSelectedElement(id);
    const node = stageRef.current.findOne(`#element-${id}`);
    if (node && transformerRef.current) {
      transformerRef.current.nodes([node]);
      transformerRef.current.getLayer().batchDraw();
    }
  };

  const handleElementTransform = (id, newAttrs) => {
    updateElements((prev) => prev.map(el => 
      el.id === id ? { ...el, ...newAttrs } : el
    ));
  };

  const deleteSelectedElement = () => {
    if (selectedElement) {
      updateElements(prev => prev.filter(el => el.id !== selectedElement));
      setSelectedElement(null);
      if (transformerRef.current) {
        transformerRef.current.nodes([]);
        transformerRef.current.getLayer().batchDraw();
      }
    }
  };

  const clearCanvas = () => {
    updateElements(() => [], { pushHistory: true });
    setSelectedElement(null);
    if (transformerRef.current) {
      transformerRef.current.nodes([]);
      transformerRef.current.getLayer().batchDraw();
    }
  };

  const exportCanvas = () => {
    if (stageRef.current) {
      const uri = stageRef.current.toDataURL({
        mimeType: 'image/png',
        quality: 1.0,
        pixelRatio: 2
      });
      
      // Download the image
      const link = document.createElement('a');
      link.download = 'edited-image.png';
      link.href = uri;
      link.click();

      if (onSave) {
        onSave(uri);
      }
    }
  };

  const applyFilter = (filterType) => {
    if (!layerRef.current) return;

    layerRef.current.clearCache();
    layerRef.current.cache({ drawBorder: false });
    
    switch (filterType) {
      case 'blur':
        layerRef.current.filters([Konva.Filters.Blur]);
        layerRef.current.blurRadius(5);
        break;
      case 'brighten':
        layerRef.current.filters([Konva.Filters.Brighten]);
        layerRef.current.brightness(0.3);
        break;
      case 'contrast':
        layerRef.current.filters([Konva.Filters.Contrast]);
        layerRef.current.contrast(20);
        break;
      case 'grayscale':
        layerRef.current.filters([Konva.Filters.Grayscale]);
        break;
      case 'sepia':
        layerRef.current.filters([Konva.Filters.Sepia]);
        break;
      case 'invert':
        layerRef.current.filters([Konva.Filters.Invert]);
        break;
      case 'emboss':
        layerRef.current.filters([Konva.Filters.Emboss]);
        layerRef.current.embossStrength(0.5);
        break;
      case 'enhance':
        layerRef.current.filters([Konva.Filters.Enhance]);
        layerRef.current.enhance(0.3);
        break;
      default:
        layerRef.current.filters([]);
        layerRef.current.clearCache();
    }
    
    layerRef.current.getLayer().batchDraw();
  };

  const ToolButton = ({ tool, icon, label, active, onClick }) => (
    <button
      className={`tool-button ${active ? 'active' : ''}`}
      onClick={onClick}
      title={label}
      style={{
        padding: '12px',
        margin: '4px',
        border: `2px solid ${active ? '#1976d2' : '#e0e0e0'}`,
        borderRadius: '8px',
        background: active ? 'rgba(25, 118, 210, 0.1)' : 'white',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}
    >
      <span style={{ fontSize: '18px' }}>{icon}</span>
      <span style={{ fontSize: '12px', fontWeight: '500' }}>{label}</span>
    </button>
  );

  return (
    <div className="konva-image-editor" style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      background: '#f5f5f5', 
      borderRadius: '12px',
      overflow: 'hidden',
      boxShadow: '0 8px 24px rgba(0,0,0,0.1)'
    }}>
      {/* Toolbar */}
      <div style={{ 
        padding: '16px', 
        background: 'white',
        borderBottom: '1px solid #e0e0e0',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', gap: '4px' }}>
          <ToolButton
            tool="text"
            icon="T"
            label="Text"
            active={selectedTool === 'text'}
            onClick={() => setSelectedTool('text')}
          />
          <ToolButton
            tool="draw"
            icon="✏️"
            label="Draw"
            active={selectedTool === 'draw'}
            onClick={() => setSelectedTool('draw')}
          />
          <ToolButton
            tool="select"
            icon="↖️"
            label="Select"
            active={selectedTool === 'select'}
            onClick={() => setSelectedTool('select')}
          />
        </div>
        
        <div style={{ height: '32px', width: '1px', background: '#e0e0e0', margin: '0 8px' }} />
        
        {selectedTool === 'draw' && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            padding: '8px 12px',
            background: 'rgba(25, 118, 210, 0.06)',
            borderRadius: '10px'
          }}>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {Object.entries(BRUSH_PRESETS).map(([mode, preset]) => {
                const active = brushMode === mode;
                return (
                  <button
                    key={mode}
                    onClick={() => setBrushMode(mode)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 10px',
                      borderRadius: '20px',
                      border: `1px solid ${active ? '#1976d2' : '#d0d7ff'}`,
                      background: active ? '#1976d2' : 'white',
                      color: active ? 'white' : '#1a237e',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      boxShadow: active ? '0 2px 6px rgba(25,118,210,0.35)' : 'none',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <span>{preset.icon}</span>
                    <span>{preset.label}</span>
                  </button>
                );
              })}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#1a237e' }}>
                Size
                <input
                  type="range"
                  min="1"
                  max="60"
                  value={brushSize}
                  onChange={(e) => setBrushSize(parseInt(e.target.value, 10))}
                  style={{ marginLeft: '8px', width: '120px' }}
                />
                <span style={{ marginLeft: '8px' }}>{brushSize}px</span>
              </label>
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#1a237e' }}>
                Opacity
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.05"
                  value={brushOpacity}
                  onChange={(e) => setBrushOpacity(parseFloat(e.target.value))}
                  disabled={brushMode === 'eraser'}
                  style={{ marginLeft: '8px', width: '120px', opacity: brushMode === 'eraser' ? 0.4 : 1 }}
                />
                <span style={{ marginLeft: '8px' }}>{Math.round(brushOpacity * 100)}%</span>
              </label>
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#1a237e' }}>
                Color
                <input
                  type="color"
                  value={brushColor}
                  onChange={(e) => setBrushColor(e.target.value)}
                  disabled={brushMode === 'eraser'}
                  style={{
                    marginLeft: '8px',
                    width: '36px',
                    height: '26px',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: brushMode === 'eraser' ? 'not-allowed' : 'pointer',
                    opacity: brushMode === 'eraser' ? 0.5 : 1
                  }}
                />
              </label>
            </div>
          </div>
        )}
        
        {selectedTool === 'text' && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            minWidth: '320px',
            background: 'linear-gradient(135deg, rgba(33,150,243,0.08), rgba(0,188,212,0.05))',
            borderRadius: '12px',
            padding: '10px 14px'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#0d47a1' }}>
                Text content
              </label>
              <textarea
                value={textConfig.text}
                onChange={(e) => applyTextConfig({ text: e.target.value }, { pushHistory: !!activeTextElement })}
                rows={2}
                style={{
                  width: '100%',
                  resize: 'none',
                  padding: '8px 10px',
                  borderRadius: '8px',
                  border: '1px solid #b0bec5',
                  fontFamily: textConfig.fontFamily,
                  fontSize: '13px'
                }}
                placeholder="Type your caption"
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#0d47a1' }}>
                Font
                <select
                  value={textConfig.fontFamily}
                  onChange={(e) => applyTextConfig({ fontFamily: e.target.value }, { pushHistory: !!activeTextElement })}
                  style={{
                    marginLeft: '6px',
                    padding: '6px 10px',
                    borderRadius: '8px',
                    border: '1px solid #90a4ae',
                    fontSize: '12px'
                  }}
                >
                  {FONT_FAMILIES.map((font) => (
                    <option value={font} key={font}>{font}</option>
                  ))}
                </select>
              </label>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#0d47a1' }}>
                Size
                <input
                  type="number"
                  min={8}
                  max={240}
                  value={textConfig.fontSize}
                  onChange={(e) => {
                    const value = Number(e.target.value) || 0;
                    applyTextConfig({ fontSize: Math.max(6, Math.min(300, value)) }, { pushHistory: !!activeTextElement });
                  }}
                  style={{
                    marginLeft: '6px',
                    width: '70px',
                    padding: '6px 8px',
                    borderRadius: '8px',
                    border: '1px solid #90a4ae'
                  }}
                />
              </label>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#0d47a1' }}>
                Letter spacing
                <input
                  type="range"
                  min={-5}
                  max={40}
                  value={textConfig.letterSpacing}
                  onChange={(e) => applyTextConfig({ letterSpacing: Number(e.target.value) }, { pushHistory: !!activeTextElement })}
                  style={{ marginLeft: '8px', width: '120px' }}
                />
                <span style={{ marginLeft: '6px' }}>{textConfig.letterSpacing}</span>
              </label>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#0d47a1' }}>
                Line height
                <input
                  type="range"
                  min={0.8}
                  max={3}
                  step={0.1}
                  value={textConfig.lineHeight}
                  onChange={(e) => applyTextConfig({ lineHeight: Number(e.target.value) }, { pushHistory: !!activeTextElement })}
                  style={{ marginLeft: '8px', width: '120px' }}
                />
                <span style={{ marginLeft: '6px' }}>{textConfig.lineHeight.toFixed(1)}</span>
              </label>
            </div>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '6px' }}>
                {TEXT_STYLE_BUTTONS.map(({ key, label, icon }) => {
                  const active = !!textConfig[key];
                  return (
                    <button
                      key={key}
                      onClick={() => applyTextConfig({ [key]: !textConfig[key] }, { pushHistory: !!activeTextElement })}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '20px',
                        border: `1px solid ${active ? '#1976d2' : '#90a4ae'}`,
                        background: active ? '#1976d2' : 'white',
                        color: active ? 'white' : '#0d47a1',
                        fontWeight: 700,
                        fontSize: '11px',
                        cursor: 'pointer',
                        letterSpacing: key === 'uppercase' ? '0.08em' : '0.02em'
                      }}
                      title={label}
                    >
                      {icon}
                    </button>
                  );
                })}
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                {TEXT_ALIGNMENT_OPTIONS.map(({ value, label, icon }) => {
                  const active = textConfig.align === value;
                  return (
                    <button
                      key={value}
                      onClick={() => applyTextConfig({ align: value }, { pushHistory: !!activeTextElement })}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '20px',
                        border: `1px solid ${active ? '#1976d2' : '#90a4ae'}`,
                        background: active ? '#1976d2' : 'white',
                        color: active ? 'white' : '#0d47a1',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                      title={label}
                    >
                      {icon}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#0d47a1' }}>
                Fill
                <input
                  type="color"
                  value={textConfig.fill}
                  onChange={(e) => applyTextConfig({ fill: e.target.value }, { pushHistory: !!activeTextElement })}
                  style={{
                    marginLeft: '6px',
                    width: '36px',
                    height: '26px',
                    border: 'none',
                    borderRadius: '6px'
                  }}
                />
              </label>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#0d47a1' }}>
                Outline
                <input
                  type="color"
                  value={textConfig.strokeColor}
                  onChange={(e) => applyTextConfig({ strokeColor: e.target.value }, { pushHistory: !!activeTextElement })}
                  style={{
                    marginLeft: '6px',
                    width: '36px',
                    height: '26px',
                    border: 'none',
                    borderRadius: '6px'
                  }}
                />
                <input
                  type="range"
                  min={0}
                  max={20}
                  value={textConfig.strokeWidth}
                  onChange={(e) => applyTextConfig({ strokeWidth: Number(e.target.value) }, { pushHistory: !!activeTextElement })}
                  style={{ marginLeft: '8px', width: '110px' }}
                />
                <span style={{ marginLeft: '6px' }}>{textConfig.strokeWidth}px</span>
              </label>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#0d47a1' }}>
                Glow
                <input
                  type="color"
                  value={textConfig.shadowColor}
                  onChange={(e) => applyTextConfig({ shadowColor: e.target.value }, { pushHistory: !!activeTextElement })}
                  style={{
                    marginLeft: '6px',
                    width: '36px',
                    height: '26px',
                    border: 'none',
                    borderRadius: '6px'
                  }}
                />
                <input
                  type="range"
                  min={0}
                  max={40}
                  value={textConfig.shadowBlur}
                  onChange={(e) => applyTextConfig({ shadowBlur: Number(e.target.value) }, { pushHistory: !!activeTextElement })}
                  style={{ marginLeft: '8px', width: '110px' }}
                />
                <span style={{ marginLeft: '6px' }}>{textConfig.shadowBlur}px</span>
              </label>
            </div>

            {!activeTextElement && (
              <span style={{ fontSize: '11px', color: '#546e7a', fontStyle: 'italic' }}>
                Tip: select an existing text layer to live-preview your style tweaks.
              </span>
            )}
          </div>
        )}
        
        <div style={{ height: '32px', width: '1px', background: '#e0e0e0', margin: '0 8px' }} />
        
        {/* Filter buttons */}
        <div style={{ display: 'flex', gap: '4px' }}>
          {['blur', 'brighten', 'contrast', 'grayscale', 'sepia'].map(filter => (
            <button
              key={filter}
              onClick={() => applyFilter(filter)}
              style={{
                padding: '6px 12px',
                fontSize: '11px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                background: 'white',
                cursor: 'pointer',
                textTransform: 'capitalize'
              }}
            >
              {filter}
            </button>
          ))}
          <button
            onClick={() => applyFilter('none')}
            style={{
              padding: '6px 12px',
              fontSize: '11px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              background: 'white',
              cursor: 'pointer'
            }}
          >
            Reset
          </button>
        </div>
        
        <div style={{ height: '32px', width: '1px', background: '#e0e0e0', margin: '0 8px' }} />
        
        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            onClick={deleteSelectedElement}
            disabled={!selectedElement}
            style={{
              padding: '8px 16px',
              fontSize: '12px',
              border: '1px solid #f44336',
              borderRadius: '4px',
              background: selectedElement ? '#f44336' : '#ccc',
              color: 'white',
              cursor: selectedElement ? 'pointer' : 'not-allowed'
            }}
          >
            Delete
          </button>
          <button
            onClick={clearCanvas}
            style={{
              padding: '8px 16px',
              fontSize: '12px',
              border: '1px solid #ff9800',
              borderRadius: '4px',
              background: '#ff9800',
              color: 'white',
              cursor: 'pointer'
            }}
          >
            Clear All
          </button>
          <button
            onClick={exportCanvas}
            style={{
              padding: '8px 16px',
              fontSize: '12px',
              border: '1px solid #4caf50',
              borderRadius: '4px',
              background: '#4caf50',
              color: 'white',
              cursor: 'pointer'
            }}
          >
            Export
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div style={{ 
        padding: '16px',
        background: '#f8f9fa',
        display: 'flex',
        justifyContent: 'center',
        minHeight: `${canvasSize.height + 32}px`
      }}>
        <Stage
          ref={stageRef}
          width={canvasSize.width}
          height={canvasSize.height}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onClick={handleStageClick}
          style={{ 
            background: 'white',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}
        >
          <Layer ref={layerRef}>
            {/* Background image */}
            {image && (
              <KonvaImage
                image={image}
                width={canvasSize.width}
                height={canvasSize.height}
                listening={false}
              />
            )}
            
            {/* Render elements */}
            {elements.map((element) => {
              if (element.type === 'text') {
                const { rawText, ...konvaProps } = element;
                return (
                  <KonvaText
                    key={element.id}
                    id={`element-${element.id}`}
                    {...konvaProps}
                    draggable={selectedTool === 'select'}
                    onClick={() => handleElementSelect(element.id)}
                    onDblClick={() => handleTextDblClick(element.id)}
                    onTransformEnd={(e) => {
                      const node = e.target;
                      handleElementTransform(element.id, {
                        x: node.x(),
                        y: node.y(),
                        rotation: node.rotation(),
                        scaleX: node.scaleX(),
                        scaleY: node.scaleY()
                      });
                    }}
                  />
                );
              } else if (element.type === 'line') {
                return (
                  <Line
                    key={element.id}
                    id={`element-${element.id}`}
                    {...element}
                    listening={selectedTool === 'select'}
                    onClick={() => selectedTool === 'select' && handleElementSelect(element.id)}
                  />
                );
              }
              return null;
            })}
            
            {/* Current drawing path */}
            {isDrawing && currentPath.length > 0 && (
              <Line
                points={currentPath}
                stroke={brushMode === 'eraser' ? '#ffffff' : brushColor}
                strokeWidth={brushSize}
                opacity={brushMode === 'eraser' ? 1 : brushOpacity}
                tension={currentBrushPreset.tension}
                lineCap={currentBrushPreset.lineCap}
                lineJoin={currentBrushPreset.lineJoin}
                globalCompositeOperation={currentBrushPreset.composite}
                listening={false}
              />
            )}
            
            {/* Transformer for selected elements */}
            {selectedTool === 'select' && (
              <Transformer
                ref={transformerRef}
                boundBoxFunc={(oldBox, newBox) => {
                  // Limit resize to prevent negative dimensions
                  if (newBox.width < 5 || newBox.height < 5) {
                    return oldBox;
                  }
                  return newBox;
                }}
              />
            )}
          </Layer>
        </Stage>
      </div>
    </div>
  );
};

// Advanced image manipulation component
export const AdvancedImageEditor = ({ imageUrl, onSave }) => {
  const [currentFilter, setCurrentFilter] = useState('none');
  const [filterParams, setFilterParams] = useState({
    blur: 5,
    brightness: 0.3,
    contrast: 20,
    hue: 0,
    saturation: 0,
    noise: 0.1
  });

  const presets = [
    { name: 'Vintage', filters: ['sepia', 'noise'], params: { noise: 0.2 } },
    { name: 'Cool', filters: ['hue'], params: { hue: 180 } },
    { name: 'Warm', filters: ['hue'], params: { hue: 30 } },
    { name: 'High Contrast', filters: ['contrast'], params: { contrast: 50 } },
    { name: 'Dramatic', filters: ['contrast', 'brightness'], params: { contrast: 30, brightness: -0.2 } }
  ];

  return (
    <div style={{ display: 'flex', gap: '20px' }}>
      <div style={{ flex: 1 }}>
        <ImageEditor
          imageUrl={imageUrl}
          width={600}
          height={400}
          onSave={onSave}
        />
      </div>
      
      <div style={{ 
        width: '250px', 
        background: 'white', 
        borderRadius: '12px',
        padding: '20px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        height: 'fit-content'
      }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>
          Filter Presets
        </h3>
        
        {presets.map((preset, index) => (
          <button
            key={index}
            style={{
              width: '100%',
              padding: '12px',
              margin: '4px 0',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              background: 'white',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#f5f5f5';
              e.target.style.borderColor = '#1976d2';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'white';
              e.target.style.borderColor = '#e0e0e0';
            }}
          >
            {preset.name}
          </button>
        ))}
        
        <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #e0e0e0' }}>
          <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600' }}>
            Manual Adjustments
          </h4>
          
          {Object.entries(filterParams).map(([key, value]) => (
            <div key={key} style={{ marginBottom: '12px' }}>
              <label style={{ 
                display: 'block', 
                fontSize: '12px', 
                fontWeight: '500', 
                marginBottom: '4px',
                textTransform: 'capitalize'
              }}>
                {key}: {value}
              </label>
              <input
                type="range"
                min={key === 'brightness' ? -1 : 0}
                max={key === 'hue' ? 360 : key === 'brightness' ? 1 : key === 'contrast' ? 100 : 1}
                step={key === 'brightness' || key === 'noise' ? 0.1 : 1}
                value={value}
                onChange={(e) => setFilterParams({
                  ...filterParams,
                  [key]: parseFloat(e.target.value)
                })}
                style={{ width: '100%' }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ImageEditor;
