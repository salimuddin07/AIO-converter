import React, { useRef, useEffect, useState, useCallback } from 'react';
import Konva from 'konva';
import { Stage, Layer, Image as KonvaImage, Text as KonvaText, Transformer, Line, Rect, Circle, Ellipse, Arrow, Star, Group as KonvaGroup } from 'react-konva';
import { NotificationService } from '../utils/NotificationService.js';

const MAX_HISTORY = 40;
const MIN_CROP_SIZE = 12;

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

const SHAPE_TOOLS = {
  rectangle: { label: 'Rectangle', icon: '▬', type: 'rect' },
  circle: { label: 'Circle', icon: '○', type: 'circle' },
  ellipse: { label: 'Ellipse', icon: '⬭', type: 'ellipse' },
  triangle: { label: 'Triangle', icon: '△', type: 'triangle' },
  line: { label: 'Line', icon: '/', type: 'line' },
  arrow: { label: 'Arrow', icon: '↗', type: 'arrow' },
  star: { label: 'Star', icon: '★', type: 'star' },
  polygon: { label: 'Polygon', icon: '⬟', type: 'polygon' },
  diamond: { label: 'Diamond', icon: '◊', type: 'diamond' },
  heart: { label: 'Heart', icon: '♥', type: 'heart' },
  roundedRect: { label: 'Rounded', icon: '▢', type: 'roundedRect' },
  hexagon: { label: 'Hexagon', icon: '⬡', type: 'hexagon' }
};

const isFilledShapeVariant = (shapeKey = '') => shapeKey.toLowerCase().startsWith('filled');

const normaliseShapeType = (shapeKey = '') => {
  if (!shapeKey) return 'rectangle';
  if (isFilledShapeVariant(shapeKey)) {
    const base = shapeKey.slice('filled'.length);
    if (!base) return 'rectangle';
    return base.charAt(0).toLowerCase() + base.slice(1);
  }
  return shapeKey;
};

const shapeSupportsFill = (shapeKey = '') => {
  const baseType = normaliseShapeType(shapeKey);
  return !['line', 'arrow'].includes(baseType);
};

const determineShapeFill = (shapeKey, fillToggle, color) => {
  if (!shapeSupportsFill(shapeKey)) {
    return 'transparent';
  }
  const shouldFill = fillToggle || isFilledShapeVariant(shapeKey);
  return shouldFill ? color : 'transparent';
};

const IMAGE_TOOLS = {
  crop: { label: 'Crop', icon: '✂️' },
  rotate: { label: 'Rotate', icon: '↻' },
  flip: { label: 'Flip', icon: '⇄' },
  resize: { label: 'Resize', icon: '⤡' },
  skew: { label: 'Skew', icon: '◊' },
  removeBackground: { label: 'Remove BG', icon: '🗑️' }
};

const ERASER_SHAPES = {
  round: { label: 'Round', icon: '●', type: 'round' },
  square: { label: 'Square', icon: '■', type: 'square' },
  triangle: { label: 'Triangle', icon: '▲', type: 'triangle' },
  diamond: { label: 'Diamond', icon: '♦', type: 'diamond' },
  star: { label: 'Star', icon: '✦', type: 'star' },
  line: { label: 'Line', icon: '—', type: 'line' }
};

const MAIN_TOOLS = {
  select: { label: 'Select', icon: '▦' },
  text: { label: 'Text', icon: 'A' },
  fillBucket: { label: 'Fill', icon: '🪣' },
  colorPicker: { label: 'Picker', icon: '💧' },
  magnifier: { label: 'Zoom', icon: '🔍' }
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

const clampValue = (value, min, max) => Math.min(Math.max(value, min), max);

const rectFromPoints = (start, end) => ({
  x: Math.min(start.x, end.x),
  y: Math.min(start.y, end.y),
  width: Math.abs(end.x - start.x),
  height: Math.abs(end.y - start.y)
});

const getElementBounds = (element = {}) => {
  if (!element) return null;

  if (Array.isArray(element.points) && element.points.length >= 2) {
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    for (let i = 0; i < element.points.length; i += 2) {
      const x = element.points[i];
      const y = element.points[i + 1];
      if (typeof x === 'number') {
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
      }
      if (typeof y === 'number') {
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      }
    }

    if (!isFinite(minX) || !isFinite(minY) || !isFinite(maxX) || !isFinite(maxY)) {
      return null;
    }

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    };
  }

  if (typeof element.x === 'number' && typeof element.y === 'number') {
    const fallbackWidth = (element.text?.length || 0) * (element.fontSize || 16) * 0.6;
    const fallbackHeight = (element.fontSize || 16) * (element.lineHeight || 1.2);

    const width = typeof element.width === 'number'
      ? element.width
      : (typeof element.radius === 'number'
        ? element.radius * 2
        : typeof element.radiusX === 'number'
          ? element.radiusX * 2
          : fallbackWidth);

    const height = typeof element.height === 'number'
      ? element.height
      : (typeof element.radius === 'number'
        ? element.radius * 2
        : typeof element.radiusY === 'number'
          ? element.radiusY * 2
          : fallbackHeight);

    return {
      x: element.x,
      y: element.y,
      width,
      height
    };
  }

  return null;
};

const rectsIntersect = (a, b) => {
  if (!a || !b) return true;
  const ax2 = a.x + a.width;
  const ay2 = a.y + a.height;
  const bx2 = b.x + b.width;
  const by2 = b.y + b.height;
  return a.x < bx2 && ax2 > b.x && a.y < by2 && ay2 > b.y;
};

const offsetElementForCrop = (element, rect) => {
  const [clone] = cloneElements([element]);
  const next = clone || { ...element };

  if (Array.isArray(next.points)) {
    next.points = next.points.map((coord, index) =>
      coord - (index % 2 === 0 ? rect.x : rect.y)
    );
  }

  if (next.startPos) {
    next.startPos = {
      x: next.startPos.x - rect.x,
      y: next.startPos.y - rect.y
    };
  }

  if (next.endPos) {
    next.endPos = {
      x: next.endPos.x - rect.x,
      y: next.endPos.y - rect.y
    };
  }

  if (typeof next.x === 'number') {
    next.x -= rect.x;
  }

  if (typeof next.y === 'number') {
    next.y -= rect.y;
  }

  return next;
};

const cropElementsToRect = (elements = [], rect) => {
  if (!rect) return elements;
  return elements.reduce((acc, element) => {
    const bounds = getElementBounds(element);
    if (bounds && !rectsIntersect(bounds, rect)) {
      return acc;
    }

    const adjusted = offsetElementForCrop(element, rect);
    if (adjusted) {
      acc.push(adjusted);
    }
    return acc;
  }, []);
};

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
  const rawPointsRef = useRef([]);
  const smoothedPointRef = useRef(null);
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
  const [stabilizerEnabled, setStabilizerEnabled] = useState(true);
  const [stabilizerStrength, setStabilizerStrength] = useState(35);
  
  // Enhanced state for Windows Paint-style features
  const [tool, setTool] = useState('select');
  const [brushSize, setBrushSize] = useState(10);
  const [brushOpacity, setBrushOpacity] = useState(100);
  const [selectedPreset, setSelectedPreset] = useState('brush');
  const [brushColor, setBrushColor] = useState('#000000');
  const [fillColor, setFillColor] = useState('#ffffff');
  const [strokeColor, setStrokeColor] = useState('#000000');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotationAngle, setRotationAngle] = useState(0);
  const [flipHorizontal, setFlipHorizontal] = useState(false);
  const [flipVertical, setFlipVertical] = useState(false);
  const [cropMode, setCropMode] = useState(false);
  const [isCropping, setIsCropping] = useState(false);
  const [cropStartPos, setCropStartPos] = useState(null);
  const [cropSelection, setCropSelection] = useState(null);
  const [selectedShape, setSelectedShape] = useState('rectangle');
  const [tempShape, setTempShape] = useState(null);
  const [drawMode, setDrawMode] = useState('pen'); // 'pen', 'brush', 'shape'
  const [previousTool, setPreviousTool] = useState(null);
  const [selectedEraser, setSelectedEraser] = useState('medium');
  const [shapeMode, setShapeMode] = useState(false);
  const [startPos, setStartPos] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [textPosition, setTextPosition] = useState({ x: 0, y: 0 });
  const [currentText, setCurrentText] = useState('');
  const [textSize, setTextSize] = useState(20);
  const [fontFamily, setFontFamily] = useState('Arial');
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyStep, setHistoryStep] = useState(-1);
  const [selectedFilter, setSelectedFilter] = useState(null);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedObjects, setSelectedObjects] = useState([]);
  const [transformerRefState, setTransformerRefState] = useState(null);
  const [selectedEraserShape, setSelectedEraserShape] = useState('round');
  const [eraserSize, setEraserSize] = useState(20);
  const [brushMode, setBrushMode] = useState('pencil');
  const [fillEnabled, setFillEnabled] = useState(false);
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
  const currentBrushPreset = BRUSH_PRESETS[selectedPreset] || BRUSH_PRESETS[brushMode] || BRUSH_PRESETS.pencil;
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
    if (brushMode === 'eraser' && fillEnabled) {
      setFillEnabled(false);
    }
  }, [brushMode, fillEnabled]);

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

  const clearCropSelection = useCallback(() => {
    setIsCropping(false);
    setCropStartPos(null);
    setCropSelection(null);
  }, []);

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

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const handleKeydown = (event) => {
      const target = event.target;
      const isEditableElement = target && (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      );

      if ((event.ctrlKey || event.metaKey) && !event.altKey) {
        const key = event.key.toLowerCase();

        if (key === 'z' && !event.shiftKey) {
          if (isEditableElement) return;
          event.preventDefault();
          if (canUndo) undo();
        } else if ((key === 'y') || (key === 'z' && event.shiftKey)) {
          if (isEditableElement) return;
          event.preventDefault();
          if (canRedo) redo();
        }
      }
    };

    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [canUndo, canRedo, undo, redo]);

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
    const stage = e.target.getStage();
    if (!stage) return;
    const pos = stage.getPointerPosition();
    if (!pos) return;

    const activeTool = shapeMode ? 'shape' : (tool || selectedTool);

    if (activeTool === 'crop') {
      const clampedPos = {
        x: clampValue(pos.x, 0, canvasSize.width),
        y: clampValue(pos.y, 0, canvasSize.height)
      };
      setIsCropping(true);
      setCropStartPos(clampedPos);
      setCropSelection({ x: clampedPos.x, y: clampedPos.y, width: 0, height: 0 });
      setSelectedElement(null);
      if (transformerRef.current) {
        transformerRef.current.nodes([]);
        transformerRef.current.getLayer().batchDraw();
      }
      return;
    }

    if (activeTool === 'draw') {
      setIsDrawing(true);
      rawPointsRef.current = [pos.x, pos.y];
      smoothedPointRef.current = { x: pos.x, y: pos.y };
      const initialPath = [pos.x, pos.y];
      pathRef.current = initialPath;
      setCurrentPath(initialPath);

      if (selectedPreset === 'eraser' || brushMode === 'eraser') {
        setStartPos(pos);
      }
      return;
    }

    if (activeTool === 'shape') {
      setIsDrawing(true);
      setStartPos(pos);
      setTempShape(null);
      rawPointsRef.current = [];
      smoothedPointRef.current = null;
      console.log('Starting shape creation at:', pos);
      return;
    }

    if (activeTool === 'text') {
      setTextPosition({ x: pos.x, y: pos.y });
      setIsTyping(true);

      const newTextElement = buildTextElementFromConfig(textConfig, {
        x: pos.x,
        y: pos.y,
        id: `text-${Date.now()}`
      });

      captureHistorySnapshot();
      updateElements((prev) => [...prev, newTextElement], { pushHistory: false });
      console.log('Text element created at:', pos);
      return;
    }

    if (activeTool === 'fillBucket') {
      floodFill(pos);
      return;
    }

    if (activeTool === 'colorPicker') {
      pickColor(pos);
      return;
    }

    if (activeTool === 'magnifier') {
      const newZoom = zoomLevel < 3 ? zoomLevel + 0.5 : 1;
      handleZoom(newZoom, pos);
      return;
    }

    if (activeTool === 'eraser') {
      applyErase(pos);
      setIsDrawing(true);
      pathRef.current = [pos.x, pos.y];
      setCurrentPath([pos.x, pos.y]);
      return;
    }
  };

  const handleMouseMove = (e) => {
    const stage = e.target.getStage();
    if (!stage) return;
    const point = stage.getPointerPosition();
    if (!point) return;

    const activeTool = shapeMode ? 'shape' : (tool || selectedTool);

    if (activeTool === 'crop') {
      if (!isCropping || !cropStartPos) return;
      const clampedPoint = {
        x: clampValue(point.x, 0, canvasSize.width),
        y: clampValue(point.y, 0, canvasSize.height)
      };
      setCropSelection(rectFromPoints(cropStartPos, clampedPoint));
      return;
    }

    if (!isDrawing) return;

    if (activeTool === 'draw') {
      const usesEraser = selectedPreset === 'eraser' || brushMode === 'eraser';

      if (usesEraser) {
        const updatedPath = [...pathRef.current, point.x, point.y];
        pathRef.current = updatedPath;
        setCurrentPath(updatedPath);
        return;
      }

      const smoothingActive = stabilizerEnabled && stabilizerStrength > 0;
      if (smoothingActive) {
        const normalized = Math.min(Math.max(stabilizerStrength, 0), 100) / 100;
        const lerpFactor = Math.max(0.15, 1 - normalized * 0.85);
        const previous = smoothedPointRef.current || { x: point.x, y: point.y };
        const newPoint = {
          x: previous.x + (point.x - previous.x) * lerpFactor,
          y: previous.y + (point.y - previous.y) * lerpFactor
        };

        const lastIndex = pathRef.current.length;
        let updatedPath;
        if (lastIndex >= 2) {
          const lastX = pathRef.current[lastIndex - 2];
          const lastY = pathRef.current[lastIndex - 1];
          const distance = Math.hypot(newPoint.x - lastX, newPoint.y - lastY);

          if (distance < 0.3) {
            updatedPath = [...pathRef.current];
            updatedPath[lastIndex - 2] = newPoint.x;
            updatedPath[lastIndex - 1] = newPoint.y;
          } else {
            updatedPath = [...pathRef.current, newPoint.x, newPoint.y];
          }
        } else {
          updatedPath = [...pathRef.current, newPoint.x, newPoint.y];
        }

        pathRef.current = updatedPath;
        smoothedPointRef.current = newPoint;
        rawPointsRef.current.push(point.x, point.y);
        setCurrentPath(updatedPath);
        return;
      }

      const updatedPath = [...pathRef.current, point.x, point.y];
      pathRef.current = updatedPath;
      setCurrentPath(updatedPath);
      return;
    }

    if (activeTool === 'eraser') {
      const updatedPath = [...pathRef.current, point.x, point.y];
      pathRef.current = updatedPath;
      setCurrentPath(updatedPath);
      return;
    }

    if (activeTool === 'shape' && shapeMode && startPos) {
      const tempShape = createShape(selectedShape, startPos, point);
      setTempShape(tempShape);
    }
  };

  const handleMouseUp = () => {
    const activeTool = shapeMode ? 'shape' : (tool || selectedTool);

    if (activeTool === 'crop') {
      if (!isCropping) return;

      let nextSelection = cropSelection;
      const stage = stageRef.current;
      if (stage && cropStartPos) {
        const pointer = stage.getPointerPosition();
        if (pointer) {
          const clampedPointer = {
            x: clampValue(pointer.x, 0, canvasSize.width),
            y: clampValue(pointer.y, 0, canvasSize.height)
          };
          nextSelection = rectFromPoints(cropStartPos, clampedPointer);
        }
      }

      setIsCropping(false);

      if (!nextSelection || nextSelection.width < MIN_CROP_SIZE || nextSelection.height < MIN_CROP_SIZE) {
        clearCropSelection();
      } else {
        setCropSelection(nextSelection);
        setCropStartPos(null);
      }
      return;
    }

    if (!isDrawing) return;

    if (activeTool === 'draw') {
      const usesEraser = selectedPreset === 'eraser' || brushMode === 'eraser';
      const smoothingActive = stabilizerEnabled && stabilizerStrength > 0 && !usesEraser;

      if (smoothingActive && pathRef.current.length >= 2) {
        const normalized = Math.min(Math.max(stabilizerStrength, 0), 100) / 100;
        const lerpFactor = Math.max(0.15, 1 - normalized * 0.85);
        const lastSmoothed = smoothedPointRef.current;
        const finalRaw = rawPointsRef.current.length >= 2
          ? {
              x: rawPointsRef.current[rawPointsRef.current.length - 2],
              y: rawPointsRef.current[rawPointsRef.current.length - 1]
            }
          : (stageRef.current ? stageRef.current.getPointerPosition() : null);

        if (finalRaw) {
          const lastIndex = pathRef.current.length;
          const lastX = pathRef.current[lastIndex - 2];
          const lastY = pathRef.current[lastIndex - 1];
          let workingPoint = lastSmoothed || { x: lastX, y: lastY };
          const catchUpPoints = [];
          let iterations = 0;

          while (Math.hypot(finalRaw.x - workingPoint.x, finalRaw.y - workingPoint.y) > 0.5 && iterations < 12) {
            workingPoint = {
              x: workingPoint.x + (finalRaw.x - workingPoint.x) * lerpFactor,
              y: workingPoint.y + (finalRaw.y - workingPoint.y) * lerpFactor
            };
            catchUpPoints.push(workingPoint.x, workingPoint.y);
            iterations += 1;
          }

          if (catchUpPoints.length) {
            const updatedPath = [...pathRef.current, ...catchUpPoints, finalRaw.x, finalRaw.y];
            pathRef.current = updatedPath;
            setCurrentPath(updatedPath);
          } else if (Math.hypot(finalRaw.x - lastX, finalRaw.y - lastY) > 0.5) {
            const updatedPath = [...pathRef.current, finalRaw.x, finalRaw.y];
            pathRef.current = updatedPath;
            setCurrentPath(updatedPath);
          }
        }
      }

      if (pathRef.current.length >= 4) {
        captureHistorySnapshot();

        const shouldFill = fillEnabled && !usesEraser;
        const newLine = {
          id: `line-${Date.now()}`,
          type: 'line',
          points: [...pathRef.current],
          stroke: usesEraser ? '#ffffff' : brushColor,
          strokeWidth: brushSize,
          opacity: usesEraser ? 1 : (brushOpacity / 100),
          tension: currentBrushPreset.tension,
          lineCap: currentBrushPreset.lineCap,
          lineJoin: currentBrushPreset.lineJoin,
          globalCompositeOperation: usesEraser ? currentBrushPreset.composite : 'source-over',
          fill: shouldFill ? fillColor : undefined,
          closed: shouldFill,
          mode: selectedPreset || brushMode
        };

        updateElements((prev) => [...prev, newLine], { pushHistory: false });
      }

      setCurrentPath([]);
      pathRef.current = [];
      rawPointsRef.current = [];
      smoothedPointRef.current = null;
    } else if (activeTool === 'shape' && shapeMode && startPos) {
      const stage = stageRef.current;
      if (stage) {
        const endPos = stage.getPointerPosition();
        if (endPos) {
          const width = Math.abs(endPos.x - startPos.x);
          const height = Math.abs(endPos.y - startPos.y);
          const x = Math.min(startPos.x, endPos.x);
          const y = Math.min(startPos.y, endPos.y);

          if (width >= 5 && height >= 5) {
            const baseShapeType = normaliseShapeType(selectedShape);

            captureHistorySnapshot();

            const newShape = {
              id: `shape-${Date.now()}`,
              type: baseShapeType,
              shapeType: selectedShape,
              x,
              y,
              width,
              height,
              startPos,
              endPos,
              stroke: strokeColor,
              strokeWidth: brushSize,
              fill: determineShapeFill(selectedShape, fillEnabled, fillColor),
              draggable: false
            };

            if (baseShapeType === 'line' || baseShapeType === 'arrow') {
              newShape.points = [startPos.x, startPos.y, endPos.x, endPos.y];
            }

            updateElements((prev) => [...prev, newShape], { pushHistory: false });
            console.log('Shape created:', selectedShape, newShape);
          }
        }
      }

      setTempShape(null);
      setStartPos(null);
    }

    setIsDrawing(false);
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

    // Capture history before applying filter
    captureHistorySnapshot();
    
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

  const handleAIBackgroundRemoval = async () => {
    if (!stageRef.current || !layerRef.current) {
      alert('No image loaded for background removal');
      return;
    }

    try {
      // Capture history before applying AI background removal
      captureHistorySnapshot();
      
      // Get the current canvas as a data URL
      const dataURL = stageRef.current.toDataURL({
        mimeType: 'image/png',
        quality: 1.0,
        pixelRatio: 1
      });

      // Convert data URL to blob
      const response = await fetch(dataURL);
      const blob = await response.blob();

      // Create FormData for API request
      const formData = new FormData();
      formData.append('image', blob, 'image.png');

      // Show loading indicator
      const originalText = document.activeElement?.textContent;
      if (document.activeElement && document.activeElement.textContent === 'Remove BG') {
        document.activeElement.textContent = 'Processing...';
        document.activeElement.disabled = true;
      }

      // Check if we're in Electron mode
      const isElectron = typeof window !== 'undefined' && window.electronAPI !== undefined;
      
      if (isElectron) {
        // Electron mode - AI background removal not supported locally
        alert('❌ AI Background Removal is not available in desktop mode.\n\nThis feature requires cloud AI processing and is only available in the web browser version with backend server running.');
        setIsProcessingBgRemoval(false);
        return;
      }

      // Make API request to backend (browser mode only)
      const apiResponse = await fetch('http://localhost:3003/api/ai/remove-background', {
        method: 'POST',
        body: formData,
      });

      if (!apiResponse.ok) {
        throw new Error(`API request failed: ${apiResponse.status}`);
      }

      const result = await apiResponse.blob();
      
      // Create object URL for the processed image
      const processedImageURL = URL.createObjectURL(result);
      
      // Load the processed image into the canvas
      const img = new Image();
      img.onload = () => {
        // Clear the current layer
        layerRef.current.destroyChildren();
        
        // Add the processed image
        const konvaImage = new window.Konva.Image({
          x: 0,
          y: 0,
          image: img,
          width: img.width,
          height: img.height,
        });
        
        layerRef.current.add(konvaImage);
        layerRef.current.batchDraw();
        
        // Clean up object URL
        URL.revokeObjectURL(processedImageURL);
        
        console.log('AI background removal completed successfully');
      };
      
      img.src = processedImageURL;

    } catch (error) {
      console.error('AI background removal failed:', error);
      alert(`Background removal failed: ${error.message}`);
    } finally {
      // Reset button state
      if (document.activeElement && document.activeElement.disabled) {
        document.activeElement.textContent = 'Remove BG';
        document.activeElement.disabled = false;
      }
    }
  };

  // Windows Paint-style tool handlers
  const handleImageTransform = (transformType) => {
    if (!image && !elements.length) {
      console.log('No image or elements to transform');
      return;
    }
    
    console.log('Applying transform:', transformType);
    
    switch (transformType) {
      case 'rotate':
        setRotationAngle(prev => (prev + 90) % 360);
        // Apply rotation to the stage
        if (stageRef.current) {
          const stage = stageRef.current;
          const currentRotation = stage.rotation();
          stage.rotation(currentRotation + 90);
          stage.batchDraw();
        }
        break;
      case 'flip':
        setFlipHorizontal(!flipHorizontal);
        // Apply flip to stage
        if (stageRef.current) {
          const stage = stageRef.current;
          stage.scaleX(flipHorizontal ? 1 : -1);
          stage.batchDraw();
        }
        break;
      case 'flipVertical':
        setFlipVertical(!flipVertical);
        if (stageRef.current) {
          const stage = stageRef.current;
          stage.scaleY(flipVertical ? 1 : -1);
          stage.batchDraw();
        }
        break;
      case 'crop': {
        const nextCropMode = !cropMode;
        setCropMode(nextCropMode);
        if (nextCropMode) {
          setShapeMode(false);
          setIsTyping(false);
          setTool('crop');
          setSelectedTool('crop');
        } else {
          clearCropSelection();
          setTool('select');
          setSelectedTool('select');
        }
        console.log('Crop mode:', nextCropMode);
        break;
      }
      case 'resize':
        handleResize();
        break;
      case 'skew':
        handleSkew();
        break;
      case 'removeBackground':
        handleRemoveBackground();
        break;
      default:
        console.log('Transform not implemented:', transformType);
        break;
    }
  };

  const createShape = (shapeType, startPos, endPos) => {
    if (!startPos || !endPos) return null;
    
    const width = Math.abs(endPos.x - startPos.x);
    const height = Math.abs(endPos.y - startPos.y);
    const x = Math.min(startPos.x, endPos.x);
    const y = Math.min(startPos.y, endPos.y);
    
    // Minimum size check
    if (width < 5 || height < 5) return null;
    const baseShapeType = normaliseShapeType(shapeType);
    const shapeFill = determineShapeFill(shapeType, fillEnabled, fillColor);
    
    const shapeProps = {
      x,
      y,
      stroke: strokeColor,
      strokeWidth: brushSize,
      fill: shapeFill,
      name: 'shape',
      draggable: false
    };
    
    let shape;
    
    switch (baseShapeType) {
      case 'rectangle':
        shape = new window.Konva.Rect({
          ...shapeProps,
          width,
          height
        });
        break;
        
      case 'circle': {
        const radius = Math.min(width, height) / 2;
        shape = new window.Konva.Circle({
          ...shapeProps,
          x: x + width / 2,
          y: y + height / 2,
          radius
        });
        break;
      }
        
      case 'ellipse': {
        shape = new window.Konva.Ellipse({
          ...shapeProps,
          x: x + width / 2,
          y: y + height / 2,
          radiusX: width / 2,
          radiusY: height / 2
        });
        break;
      }
        
      case 'line':
        shape = new window.Konva.Line({
          ...shapeProps,
          points: [startPos.x, startPos.y, endPos.x, endPos.y]
        });
        break;
        
      case 'arrow':
        shape = new window.Konva.Arrow({
          ...shapeProps,
          points: [startPos.x, startPos.y, endPos.x, endPos.y],
          pointerLength: 20,
          pointerWidth: 15
        });
        break;
        
      case 'triangle':
        shape = new window.Konva.Line({
          ...shapeProps,
          points: [
            x + width / 2, y,
            x, y + height,
            x + width, y + height,
            x + width / 2, y
          ],
          closed: true
        });
        break;
        
      case 'star':
        shape = new window.Konva.Star({
          ...shapeProps,
          x: x + width / 2,
          y: y + height / 2,
          numPoints: 5,
          innerRadius: Math.min(width, height) / 4,
          outerRadius: Math.min(width, height) / 2
        });
        break;

      case 'diamond':
        shape = new window.Konva.Line({
          ...shapeProps,
          points: [
            x + width / 2, y,
            x + width, y + height / 2,
            x + width / 2, y + height,
            x, y + height / 2
          ],
          closed: true
        });
        break;

      case 'polygon':
      case 'hexagon': {
        const sides = baseShapeType === 'polygon' ? 5 : 6;
        const radius = Math.min(width, height) / 2;
        const centerX = x + width / 2;
        const centerY = y + height / 2;
        const points = [];
        for (let i = 0; i < sides; i += 1) {
          const angle = (i * 2 * Math.PI) / sides;
          points.push(centerX + radius * Math.cos(angle));
          points.push(centerY + radius * Math.sin(angle));
        }
        shape = new window.Konva.Line({
          ...shapeProps,
          points,
          closed: true
        });
        break;
      }

      case 'roundedRect':
        shape = new window.Konva.Rect({
          ...shapeProps,
          width,
          height,
          cornerRadius: Math.min(width, height) * 0.2
        });
        break;

      case 'heart': {
        const centerX = x + width / 2;
        const centerY = y + height / 2;
        const points = [
          centerX, centerY + height * 0.3,
          centerX - width * 0.4, centerY - height * 0.1,
          centerX - width * 0.2, centerY - height * 0.3,
          centerX, centerY - height * 0.1,
          centerX + width * 0.2, centerY - height * 0.3,
          centerX + width * 0.4, centerY - height * 0.1,
          centerX, centerY + height * 0.3
        ];
        shape = new window.Konva.Line({
          ...shapeProps,
          points,
          closed: true
        });
        break;
      }
        
      default:
        return null;
    }
    
    return shape;
  };

  const handleShapeCreation = (shapeType) => {
    setSelectedShape(shapeType);
    setShapeMode(true);
    setTool('shape');
    setSelectedTool('shape');
    console.log('Shape tool activated:', shapeType);
  };

  const handleFillBucket = () => {
    setTool('fillBucket');
    setSelectedTool('fillBucket');
    console.log('Fill bucket tool activated');
  };

  const floodFill = (startPos) => {
    if (!startPos || !stageRef.current) return;

    const stage = stageRef.current;
    const layer = stage.findOne('Layer');
    
    // Get canvas data for pixel-based flood fill
    const canvas = stage.toCanvas();
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    const startX = Math.floor(startPos.x);
    const startY = Math.floor(startPos.y);
    
    if (startX < 0 || startX >= canvas.width || startY < 0 || startY >= canvas.height) return;
    
    const startIndex = (startY * canvas.width + startX) * 4;
    const startR = data[startIndex];
    const startG = data[startIndex + 1];
    const startB = data[startIndex + 2];
    const startA = data[startIndex + 3];
    
    // Convert fill color to RGB
    const fillColorRgb = hexToRgb(fillColor);
    if (!fillColorRgb) return;
    
    // Check if the target color is different from fill color
    if (startR === fillColorRgb.r && startG === fillColorRgb.g && startB === fillColorRgb.b) {
      console.log('Target and fill colors are the same, no fill needed');
      return;
    }
    
    // For simplicity, create a filled rectangle that covers the clicked area
    // In a more advanced implementation, you'd do pixel-by-pixel flood fill
    const fillRect = new window.Konva.Rect({
      x: 0,
      y: 0,
      width: canvas.width,
      height: canvas.height,
      fill: fillColor,
      opacity: 0.3,
      name: 'floodFill',
      listening: false
    });
    
    layer.add(fillRect);
    stage.batchDraw();
    
    console.log('Flood fill applied at:', startPos, 'with color:', fillColor);
  };

  // Helper function to convert hex to RGB
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  const handleEraserClick = (eraserType) => {
    setSelectedEraser(eraserType);
    setTool('eraser');
    setSelectedTool('eraser');
    console.log('Eraser activated:', eraserType);
  };

  const applyErase = (pos) => {
    if (!pos) return;
    
    // For eraser, we'll add points to a path just like normal drawing
    // The eraser behavior is handled by the globalCompositeOperation in rendering
    if (!pathRef.current || pathRef.current.length === 0) {
      pathRef.current = [pos.x, pos.y];
      setCurrentPath([pos.x, pos.y]);
    } else {
      const updatedPath = [...pathRef.current, pos.x, pos.y];
      pathRef.current = updatedPath;
      setCurrentPath(updatedPath);
    }
    
    console.log('Added eraser point at:', pos, 'path length:', pathRef.current.length);
  };

  const pickColor = (pos) => {
    if (!pos || !stageRef.current) return;

    const stage = stageRef.current;
    
    // Get canvas data to sample pixel color
    const canvas = stage.toCanvas();
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(Math.floor(pos.x), Math.floor(pos.y), 1, 1);
    const data = imageData.data;
    
    // Convert RGBA to hex
    const r = data[0];
    const g = data[1];
    const b = data[2];
    const a = data[3];
    
    if (a === 0) {
      console.log('Transparent pixel clicked');
      return;
    }
    
    const hex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
    
    // Set the picked color as the current stroke color
    setStrokeColor(hex);
    setBrushColor(hex);
    
    console.log('Color picked:', hex, 'from position:', pos);
    
    // Automatically switch back to previous tool after picking
    if (previousTool && previousTool !== 'colorPicker') {
      setTool(previousTool);
      setSelectedTool(previousTool);
    }
  };
  
  const handleColorPicker = () => {
    setPreviousTool(tool); // Remember current tool
    setTool('colorPicker');
    setSelectedTool('colorPicker');
    console.log('Color picker tool activated');
  };

  const handleMagnifier = () => {
    setTool('magnifier');
    setSelectedTool('magnifier');
    console.log('Magnifier tool activated - click to zoom in, right-click to zoom out, wheel to zoom');
  };

  const handleZoom = (newZoom, centerPoint = null) => {
    const clampedZoom = Math.max(0.1, Math.min(5, newZoom));
    setZoomLevel(clampedZoom);
    
    if (stageRef.current) {
      const stage = stageRef.current;
      const oldScale = stage.scaleX();
      
      if (centerPoint) {
        // Zoom to specific point
        const mousePointTo = {
          x: (centerPoint.x - stage.x()) / oldScale,
          y: (centerPoint.y - stage.y()) / oldScale,
        };
        
        const newPos = {
          x: centerPoint.x - mousePointTo.x * clampedZoom,
          y: centerPoint.y - mousePointTo.y * clampedZoom,
        };
        
        stage.scale({ x: clampedZoom, y: clampedZoom });
        stage.position(newPos);
      } else {
        // Center zoom
        stage.scale({ x: clampedZoom, y: clampedZoom });
      }
      
      stage.batchDraw();
    }
    console.log('Zoom level:', (clampedZoom * 100).toFixed(0) + '%');
  };

  const cancelCrop = useCallback(() => {
    clearCropSelection();
    setCropMode(false);
    setTool('select');
    setSelectedTool('select');
  }, [clearCropSelection]);

  const applyCrop = useCallback(() => {
    if (!cropSelection || cropSelection.width < MIN_CROP_SIZE || cropSelection.height < MIN_CROP_SIZE) {
      NotificationService.warning('Draw a larger crop area before applying.');
      return;
    }

    if (!stageRef.current) {
      NotificationService.error('Canvas is not ready for cropping.');
      return;
    }

    const normalised = {
      x: Math.round(clampValue(cropSelection.x, 0, canvasSize.width)),
      y: Math.round(clampValue(cropSelection.y, 0, canvasSize.height)),
      width: Math.round(Math.min(canvasSize.width, Math.max(1, cropSelection.width))),
      height: Math.round(Math.min(canvasSize.height, Math.max(1, cropSelection.height)))
    };

    if (normalised.width < MIN_CROP_SIZE || normalised.height < MIN_CROP_SIZE) {
      NotificationService.warning('Crop area is too small to apply.');
      return;
    }

    captureHistorySnapshot();

    updateElements((prev) => cropElementsToRect(prev, normalised), { pushHistory: false });

    setCanvasSize({ width: normalised.width, height: normalised.height });

    if (image) {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = normalised.width;
        canvas.height = normalised.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(
          image,
          normalised.x,
          normalised.y,
          normalised.width,
          normalised.height,
          0,
          0,
          normalised.width,
          normalised.height
        );

        const croppedSrc = canvas.toDataURL('image/png');
        const nextImage = new window.Image();
        nextImage.crossOrigin = 'anonymous';
        nextImage.onload = () => {
          setImage(nextImage);
          stageRef.current?.batchDraw();
        };
        nextImage.src = croppedSrc;
      } catch (error) {
        console.error('Failed to crop base image:', error);
        NotificationService.error('Unable to crop the base image.');
      }
    }

    stageRef.current?.position({ x: 0, y: 0 });
    stageRef.current?.scale({ x: 1, y: 1 });
    setZoomLevel(1);

    if (transformerRef.current) {
      transformerRef.current.nodes([]);
      transformerRef.current.getLayer().batchDraw();
    }
    setSelectedElement(null);

    clearCropSelection();
    setCropMode(false);
    setTool('select');
    setSelectedTool('select');

    NotificationService.success('Crop applied successfully.');
  }, [canvasSize.height, canvasSize.width, captureHistorySnapshot, clearCropSelection, cropSelection, image, updateElements]);

  const handleToolChange = (newTool) => {
    setTool(newTool);
    setSelectedTool(newTool);
    setShapeMode(false);
    clearCropSelection();
    setCropMode(false);
    setIsTyping(false);
  };

  const handleEraserShapeChange = (shapeType) => {
    setSelectedEraserShape(shapeType);
    setSelectedPreset('eraser');
    handleToolChange('draw');
    console.log('Eraser shape changed to:', shapeType);
  };

  const handlePresetChange = (presetKey) => {
    const preset = BRUSH_PRESETS[presetKey];
    setSelectedPreset(presetKey);
    setBrushSize(preset.strokeWidth);
    setBrushColor(preset.color);
    setBrushOpacity(preset.opacity * 100);
    setBrushMode(presetKey);
    
    // If switching to eraser, set default eraser size
    if (presetKey === 'eraser') {
      setEraserSize(eraserSize);
    }
  };

  const handleResize = () => {
    const newWidth = prompt('Enter new width (current: ' + canvasSize.width + '):', canvasSize.width);
    const newHeight = prompt('Enter new height (current: ' + canvasSize.height + '):', canvasSize.height);
    
    if (newWidth && newHeight && !isNaN(newWidth) && !isNaN(newHeight)) {
      const width = parseInt(newWidth);
      const height = parseInt(newHeight);
      
      if (width > 0 && height > 0 && width <= 2000 && height <= 2000) {
        setCanvasSize({ width, height });
        console.log('Canvas resized to:', width, 'x', height);
      } else {
        alert('Please enter valid dimensions (1-2000 pixels)');
      }
    }
  };

  const handleSkew = () => {
    if (!image) {
      alert('Please upload an image first');
      return;
    }
    
    const skewX = prompt('Enter horizontal skew angle in degrees (-45 to 45):', '0');
    const skewY = prompt('Enter vertical skew angle in degrees (-45 to 45):', '0');
    
    if (skewX !== null && skewY !== null && !isNaN(skewX) && !isNaN(skewY)) {
      const x = parseFloat(skewX);
      const y = parseFloat(skewY);
      
      if (x >= -45 && x <= 45 && y >= -45 && y <= 45) {
        // Apply skew transformation to the image
        const stage = stageRef.current;
        if (stage) {
          const imageNode = stage.findOne('.mainImage');
          if (imageNode) {
            imageNode.skewX(x * Math.PI / 180); // Convert to radians
            imageNode.skewY(y * Math.PI / 180);
            stage.batchDraw();
            console.log('Image skewed by X:', x, 'Y:', y, 'degrees');
          }
        }
      } else {
        alert('Skew angles must be between -45 and 45 degrees');
      }
    }
  };

  const handleRemoveBackground = async () => {
    console.log('Starting background removal...');
    
    if (!image) {
      alert('Please upload an image first');
      return;
    }
    
    try {
      // Simple background removal implementation
      // In a real application, you would use an AI service like remove.bg
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      canvas.width = image.width;
      canvas.height = image.height;
      
      // Draw the image
      ctx.drawImage(image, 0, 0);
      
      // Get image data
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // Simple background removal: make white/light pixels transparent
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        // If pixel is close to white, make it transparent
        if (r > 200 && g > 200 && b > 200) {
          data[i + 3] = 0; // Set alpha to 0 (transparent)
        }
      }
      
      // Put the modified image data back
      ctx.putImageData(imageData, 0, 0);
      
      // Create new image from canvas
      const newImageSrc = canvas.toDataURL();
      const newImage = new Image();
      newImage.onload = () => {
        setImage(newImage);
        console.log('Background removed successfully');
      };
      newImage.src = newImageSrc;
      
    } catch (error) {
      console.error('Background removal failed:', error);
      alert('Background removal failed. In a production app, this would use an AI service like remove.bg');
    }
  };

  const applyShapeErase = (pos) => {
    const eraseElements = [];
    
    elements.forEach((element) => {
      let shouldErase = false;
      
      switch (selectedEraserShape) {
        case 'round':
          // Check if element is within circular eraser area
          const distance = Math.sqrt(
            Math.pow(pos.x - (element.x || 0), 2) + 
            Math.pow(pos.y - (element.y || 0), 2)
          );
          shouldErase = distance <= eraserSize;
          break;
          
        case 'square':
          // Check if element is within square eraser area
          const halfSize = eraserSize / 2;
          shouldErase = (
            Math.abs(pos.x - (element.x || 0)) <= halfSize &&
            Math.abs(pos.y - (element.y || 0)) <= halfSize
          );
          break;
          
        case 'triangle':
        case 'diamond':
        case 'star':
        case 'line':
          // For other shapes, use circular area for simplicity
          const dist = Math.sqrt(
            Math.pow(pos.x - (element.x || 0), 2) + 
            Math.pow(pos.y - (element.y || 0), 2)
          );
          shouldErase = dist <= eraserSize;
          break;
      }
      
      if (shouldErase) {
        eraseElements.push(element.id);
      }
    });
    
    if (eraseElements.length > 0) {
      captureHistorySnapshot();
      updateElements((prev) => prev.filter(el => !eraseElements.includes(el.id)), { pushHistory: false });
      console.log('Erased elements:', eraseElements.length);
    }
  };

  // Canvas size management with transformations
  const getTransformedCanvasSize = () => {
    let width = canvasSize.width;
    let height = canvasSize.height;
    
    // Apply rotation adjustments
    if (rotationAngle === 90 || rotationAngle === 270) {
      [width, height] = [height, width];
    }
    
    return { width, height };
  };

  // Image transformation styles
  const getImageTransformStyle = () => {
    const transforms = [];
    
    if (rotationAngle !== 0) {
      transforms.push(`rotate(${rotationAngle}deg)`);
    }
    
    if (flipHorizontal) {
      transforms.push('scaleX(-1)');
    }
    
    if (flipVertical) {
      transforms.push('scaleY(-1)');
    }
    
    if (zoomLevel !== 1) {
      transforms.push(`scale(${zoomLevel})`);
    }
    
    return transforms.length > 0 ? transforms.join(' ') : 'none';
  };

  const isCropToolActive = tool === 'crop' || selectedTool === 'crop';
  const isCropSelectionValid = !!(cropSelection && cropSelection.width >= MIN_CROP_SIZE && cropSelection.height >= MIN_CROP_SIZE);

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
      {/* Windows Paint-style Toolbar */}
      <div style={{ 
        padding: '12px 16px', 
        background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
        borderBottom: '2px solid #dee2e6',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '16px',
        alignItems: 'flex-start',
        minHeight: '120px'
      }}>
        
        {/* Selection Section */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          padding: '8px',
          border: '1px solid #dee2e6',
          borderRadius: '8px',
          background: 'white',
          minWidth: '120px'
        }}>
          <div style={{ fontSize: '11px', fontWeight: '600', color: '#495057', textTransform: 'uppercase', marginBottom: '4px' }}>Selection</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {Object.entries(MAIN_TOOLS).filter(([key]) => ['select'].includes(key)).map(([toolKey, toolData]) => (
              <button
                key={toolKey}
                onClick={() => handleToolChange(toolKey)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 12px',
                  border: `1px solid ${tool === toolKey ? '#0d6efd' : '#dee2e6'}`,
                  borderRadius: '6px',
                  background: tool === toolKey ? '#0d6efd' : 'white',
                  color: tool === toolKey ? 'white' : '#212529',
                  fontSize: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  minWidth: '100px'
                }}
              >
                <span style={{ fontSize: '14px' }}>{toolData.icon}</span>
                <span>{toolData.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Image Tools Section */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          padding: '8px',
          border: '1px solid #dee2e6',
          borderRadius: '8px',
          background: 'white',
          minWidth: '160px'
        }}>
          <div style={{ fontSize: '11px', fontWeight: '600', color: '#495057', textTransform: 'uppercase', marginBottom: '4px' }}>Image</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {Object.entries(IMAGE_TOOLS).map(([toolKey, toolData]) => (
              <button
                key={toolKey}
                onClick={() => handleImageTransform(toolKey)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '2px',
                  padding: '6px',
                  border: '1px solid #dee2e6',
                  borderRadius: '4px',
                  background: 'white',
                  color: '#212529',
                  fontSize: '10px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  minWidth: '48px',
                  ':hover': { background: '#f8f9fa' }
                }}
              >
                <span style={{ fontSize: '14px' }}>{toolData.icon}</span>
                <span>{toolData.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tools Section */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          padding: '8px',
          border: '1px solid #dee2e6',
          borderRadius: '8px',
          background: 'white',
          minWidth: '200px'
        }}>
          <div style={{ fontSize: '11px', fontWeight: '600', color: '#495057', textTransform: 'uppercase', marginBottom: '4px' }}>Tools</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {Object.entries(MAIN_TOOLS).filter(([key]) => !['select'].includes(key)).map(([toolKey, toolData]) => (
              <button
                key={toolKey}
                onClick={() => toolKey === 'fillBucket' ? handleFillBucket() : 
                              toolKey === 'colorPicker' ? handleColorPicker() :
                              toolKey === 'magnifier' ? handleMagnifier() :
                              handleToolChange(toolKey)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '2px',
                  padding: '6px',
                  border: `1px solid ${tool === toolKey ? '#0d6efd' : '#dee2e6'}`,
                  borderRadius: '4px',
                  background: tool === toolKey ? '#0d6efd' : 'white',
                  color: tool === toolKey ? 'white' : '#212529',
                  fontSize: '10px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  minWidth: '48px'
                }}
              >
                <span style={{ fontSize: '14px' }}>{toolData.icon}</span>
                <span>{toolData.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Brushes Section */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          padding: '8px',
          border: '1px solid #dee2e6',
          borderRadius: '8px',
          background: 'white',
          minWidth: '250px'
        }}>
          <div style={{ fontSize: '11px', fontWeight: '600', color: '#495057', textTransform: 'uppercase', marginBottom: '4px' }}>Brushes</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '8px' }}>
            {Object.entries(BRUSH_PRESETS).map(([presetKey, preset]) => (
              <button
                key={presetKey}
                onClick={() => {
                  handlePresetChange(presetKey);
                  handleToolChange('draw');
                }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '2px',
                  padding: '6px',
                  border: `1px solid ${selectedPreset === presetKey ? '#0d6efd' : '#dee2e6'}`,
                  borderRadius: '4px',
                  background: selectedPreset === presetKey ? '#0d6efd' : 'white',
                  color: selectedPreset === presetKey ? 'white' : '#212529',
                  fontSize: '10px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  minWidth: '48px'
                }}
              >
                <span style={{ fontSize: '14px' }}>{preset.icon}</span>
                <span>{preset.label}</span>
              </button>
            ))}
          </div>
          
          {(tool === 'draw' || selectedTool === 'draw') && (
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              <label style={{ fontSize: '11px', fontWeight: '600', color: '#495057' }}>
                Size
                <input
                  type="range"
                  min="1"
                  max="60"
                  value={brushSize}
                  onChange={(e) => setBrushSize(parseInt(e.target.value, 10))}
                  style={{ marginLeft: '6px', width: '80px' }}
                />
                <span style={{ marginLeft: '4px', fontSize: '10px' }}>{brushSize}px</span>
              </label>
              <label style={{ fontSize: '11px', fontWeight: '600', color: '#495057' }}>
                Opacity
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={brushOpacity}
                  onChange={(e) => setBrushOpacity(parseInt(e.target.value))}
                  style={{ marginLeft: '6px', width: '80px' }}
                />
                <span style={{ marginLeft: '4px', fontSize: '10px' }}>{brushOpacity}%</span>
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '4px 8px', borderLeft: '1px solid #dee2e6' }}>
                <label style={{ fontSize: '11px', fontWeight: '600', color: '#495057', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <input
                    type="checkbox"
                    checked={stabilizerEnabled}
                    onChange={(e) => setStabilizerEnabled(e.target.checked)}
                    style={{ accentColor: '#0d6efd' }}
                  />
                  Steady Stroke
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: stabilizerEnabled ? 1 : 0.4 }}>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={stabilizerStrength}
                    onChange={(e) => setStabilizerStrength(parseInt(e.target.value, 10))}
                    disabled={!stabilizerEnabled}
                    style={{ width: '100px' }}
                  />
                  <span style={{ fontSize: '10px', color: '#6c757d' }}>{stabilizerStrength}%</span>
                </div>
              </div>
            </div>
          )}
          
          {/* Eraser Shape Controls */}
          {selectedPreset === 'eraser' && (
            <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #dee2e6' }}>
              <div style={{ fontSize: '10px', fontWeight: '600', color: '#495057', marginBottom: '4px' }}>Eraser Shape</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '8px' }}>
                {Object.entries(ERASER_SHAPES).map(([shapeKey, shapeData]) => (
                  <button
                    key={shapeKey}
                    onClick={() => handleEraserShapeChange(shapeKey)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '2px',
                      padding: '4px',
                      border: `1px solid ${selectedEraserShape === shapeKey ? '#dc3545' : '#dee2e6'}`,
                      borderRadius: '4px',
                      background: selectedEraserShape === shapeKey ? '#dc3545' : 'white',
                      color: selectedEraserShape === shapeKey ? 'white' : '#212529',
                      fontSize: '9px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      minWidth: '36px'
                    }}
                  >
                    <span style={{ fontSize: '12px' }}>{shapeData.icon}</span>
                    <span>{shapeData.label}</span>
                  </button>
                ))}
              </div>
              <label style={{ fontSize: '11px', fontWeight: '600', color: '#495057' }}>
                Eraser Size
                <input
                  type="range"
                  min="5"
                  max="100"
                  value={eraserSize}
                  onChange={(e) => setEraserSize(parseInt(e.target.value))}
                  style={{ marginLeft: '6px', width: '80px' }}
                />
                <span style={{ marginLeft: '4px', fontSize: '10px' }}>{eraserSize}px</span>
              </label>
            </div>
          )}
        </div>

        {/* Shapes Section */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          padding: '8px',
          border: '1px solid #dee2e6',
          borderRadius: '8px',
          background: 'white',
          minWidth: '200px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <div style={{ fontSize: '11px', fontWeight: '600', color: '#495057', textTransform: 'uppercase' }}>Shapes</div>
            {shapeMode && (
              <button
                onClick={() => {
                  setShapeMode(false);
                  setTool('select');
                  setSelectedTool('select');
                }}
                style={{
                  padding: '2px 6px',
                  fontSize: '9px',
                  border: '1px solid #6c757d',
                  borderRadius: '3px',
                  background: '#6c757d',
                  color: 'white',
                  cursor: 'pointer'
                }}
              >
                Exit
              </button>
            )}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {Object.entries(SHAPE_TOOLS).map(([shapeKey, shapeData]) => (
              <button
                key={shapeKey}
                onClick={() => handleShapeCreation(shapeKey)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '2px',
                  padding: '6px',
                  border: `1px solid ${selectedShape === shapeKey && shapeMode ? '#0d6efd' : '#dee2e6'}`,
                  borderRadius: '4px',
                  background: selectedShape === shapeKey && shapeMode ? '#0d6efd' : 'white',
                  color: selectedShape === shapeKey && shapeMode ? 'white' : '#212529',
                  fontSize: '10px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  minWidth: '48px'
                }}
              >
                <span style={{ fontSize: '14px' }}>{shapeData.icon}</span>
                <span>{shapeData.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Colors Section */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          padding: '8px',
          border: '1px solid #dee2e6',
          borderRadius: '8px',
          background: 'white',
          minWidth: '140px'
        }}>
          <div style={{ fontSize: '11px', fontWeight: '600', color: '#495057', textTransform: 'uppercase', marginBottom: '4px' }}>Colors</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {/* Primary Colors */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                <input
                  type="color"
                  value={strokeColor}
                  onChange={(e) => {
                    setStrokeColor(e.target.value);
                    setBrushColor(e.target.value); // Sync with brush color
                  }}
                  style={{
                    width: '32px',
                    height: '32px',
                    border: '2px solid #dee2e6',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                />
                <span style={{ fontSize: '9px', color: '#6c757d' }}>Line</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                <input
                  type="color"
                  value={fillColor}
                  onChange={(e) => setFillColor(e.target.value)}
                  style={{
                    width: '32px',
                    height: '32px',
                    border: '2px solid #dee2e6',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                />
                <span style={{ fontSize: '9px', color: '#6c757d' }}>Fill</span>
              </div>
            </div>
            
            {/* Border Controls */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ fontSize: '10px', color: '#6c757d' }}>Border Width</div>
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={brushSize}
                  onChange={(e) => setBrushSize(parseInt(e.target.value))}
                  style={{ flex: 1 }}
                />
                <span style={{ fontSize: '10px', color: '#6c757d', minWidth: '20px' }}>{brushSize}px</span>
              </div>
            </div>
            
            {/* Text Alignment (when text tool is active) */}
            {(tool === 'text' || selectedTool === 'text') && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ fontSize: '10px', color: '#6c757d' }}>Text Align</div>
                <div style={{ display: 'flex', gap: '2px' }}>
                  {TEXT_ALIGNMENT_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => applyTextConfig({ align: option.value })}
                      style={{
                        padding: '4px 6px',
                        border: `1px solid ${textConfig.align === option.value ? '#1976d2' : '#dee2e6'}`,
                        borderRadius: '4px',
                        background: textConfig.align === option.value ? '#e3f2fd' : 'white',
                        fontSize: '10px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      title={option.label}
                    >
                      {option.icon}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Image Filters Section */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          padding: '8px',
          border: '1px solid #dee2e6',
          borderRadius: '8px',
          background: 'white',
          minWidth: '180px'
        }}>
          <div style={{ fontSize: '11px', fontWeight: '600', color: '#495057', textTransform: 'uppercase', marginBottom: '4px' }}>Filters</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {[
              { key: 'blur', label: 'Blur', icon: '🌫️' },
              { key: 'brighten', label: 'Brighten', icon: '☀️' },
              { key: 'contrast', label: 'Contrast', icon: '🌗' },
              { key: 'grayscale', label: 'Grayscale', icon: '⚫' },
              { key: 'sepia', label: 'Sepia', icon: '🟤' }
            ].map((filter) => (
              <button
                key={filter.key}
                onClick={() => applyFilter(filter.key)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '2px',
                  padding: '6px',
                  border: '1px solid #dee2e6',
                  borderRadius: '4px',
                  background: 'white',
                  color: '#212529',
                  fontSize: '9px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  minWidth: '48px'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#f8f9fa';
                  e.target.style.borderColor = '#6c757d';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'white';
                  e.target.style.borderColor = '#dee2e6';
                }}
              >
                <span style={{ fontSize: '12px' }}>{filter.icon}</span>
                <span>{filter.label}</span>
              </button>
            ))}
            
            {/* AI Background Removal */}
            <button
              onClick={handleAIBackgroundRemoval}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '2px',
                padding: '6px',
                border: '1px solid #6f42c1',
                borderRadius: '4px',
                background: '#f8f5ff',
                color: '#6f42c1',
                fontSize: '9px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                minWidth: '48px'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#e5d5ff';
                e.target.style.borderColor = '#6f42c1';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = '#f8f5ff';
                e.target.style.borderColor = '#6f42c1';
              }}
            >
              <span style={{ fontSize: '12px' }}>🤖</span>
              <span>Remove BG</span>
            </button>
          </div>
        </div>

        {/* Actions Section */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          padding: '8px',
          border: '1px solid #dee2e6',
          borderRadius: '8px',
          background: 'white',
          minWidth: '160px'
        }}>
          <div style={{ fontSize: '11px', fontWeight: '600', color: '#495057', textTransform: 'uppercase', marginBottom: '4px' }}>Actions</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            <button
              onClick={() => {
                if (layerRef.current) {
                  layerRef.current.filters([]);
                  layerRef.current.cache();
                }
              }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '2px',
                padding: '6px',
                border: '1px solid #ffc107',
                borderRadius: '4px',
                background: '#fff3cd',
                color: '#856404',
                fontSize: '9px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                minWidth: '48px'
              }}
            >
              <span style={{ fontSize: '12px' }}>🔄</span>
              <span>Reset</span>
            </button>
            <button
              onClick={() => {
                if (layerRef.current) {
                  const children = layerRef.current.children;
                  const selected = children.filter(child => child.attrs.id && transformerRef.current.nodes().includes(child));
                  selected.forEach(child => child.destroy());
                  transformerRef.current.nodes([]);
                  layerRef.current.batchDraw();
                }
              }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '2px',
                padding: '6px',
                border: '1px solid #dc3545',
                borderRadius: '4px',
                background: '#f8d7da',
                color: '#721c24',
                fontSize: '9px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                minWidth: '48px'
              }}
            >
              <span style={{ fontSize: '12px' }}>🗑️</span>
              <span>Delete</span>
            </button>
            <button
              onClick={clearCanvas}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '2px',
                padding: '6px',
                border: '1px solid #dc3545',
                borderRadius: '4px',
                background: '#f8d7da',
                color: '#721c24',
                fontSize: '9px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                minWidth: '48px'
              }}
            >
              <span style={{ fontSize: '12px' }}>🧹</span>
              <span>Clear All</span>
            </button>
            <button
              onClick={exportCanvas}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '2px',
                padding: '6px',
                border: '1px solid #198754',
                borderRadius: '4px',
                background: '#d1e7dd',
                color: '#0f5132',
                fontSize: '9px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                minWidth: '48px'
              }}
            >
              <span style={{ fontSize: '12px' }}>💾</span>
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Undo/Redo Actions */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
          <button
            onClick={undo}
            disabled={!canUndo}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '8px 12px',
              border: `1px solid ${canUndo ? '#198754' : '#dee2e6'}`,
              borderRadius: '6px',
              background: canUndo ? '#198754' : '#f8f9fa',
              color: canUndo ? 'white' : '#6c757d',
              fontSize: '12px',
              cursor: canUndo ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s ease'
            }}
          >
            <span>↺</span>
            <span>Undo</span>
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '8px 12px',
              border: `1px solid ${canRedo ? '#198754' : '#dee2e6'}`,
              borderRadius: '6px',
              background: canRedo ? '#198754' : '#f8f9fa',
              color: canRedo ? 'white' : '#6c757d',
              fontSize: '12px',
              cursor: canRedo ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s ease'
            }}
          >
            <span>↻</span>
            <span>Redo</span>
          </button>
        </div>
      </div>

      {/* Text Configuration Panel (when text tool is active) */}
      {(tool === 'text' || selectedTool === 'text') && (
        <div style={{
          padding: '12px 16px',
          background: '#e3f2fd',
          borderBottom: '1px solid #bbdefb',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '16px',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <textarea
              value={textConfig.text}
              onChange={(e) => applyTextConfig({ text: e.target.value }, { pushHistory: !!activeTextElement })}
              rows={1}
              style={{
                width: '200px',
                resize: 'none',
                padding: '6px 8px',
                borderRadius: '4px',
                border: '1px solid #90caf9',
                fontSize: '12px'
              }}
              placeholder="Enter text..."
            />
            
            <select
              value={textConfig.fontFamily}
              onChange={(e) => applyTextConfig({ fontFamily: e.target.value }, { pushHistory: !!activeTextElement })}
              style={{
                padding: '6px 8px',
                borderRadius: '4px',
                border: '1px solid #90caf9',
                fontSize: '12px'
              }}
            >
              {FONT_FAMILIES.map((font) => (
                <option value={font} key={font}>{font}</option>
              ))}
            </select>
            
            <input
              type="number"
              min={8}
              max={120}
              value={textConfig.fontSize}
              onChange={(e) => applyTextConfig({ fontSize: parseInt(e.target.value) || 20 }, { pushHistory: !!activeTextElement })}
              style={{
                width: '60px',
                padding: '6px 8px',
                borderRadius: '4px',
                border: '1px solid #90caf9',
                fontSize: '12px'
              }}
            />
            
            <input
              type="color"
              value={textConfig.fill}
              onChange={(e) => applyTextConfig({ fill: e.target.value }, { pushHistory: !!activeTextElement })}
              style={{
                width: '32px',
                height: '32px',
                border: '1px solid #90caf9',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            />
            
            <div style={{ display: 'flex', gap: '4px' }}>
              {['bold', 'italic', 'underline'].map((style) => (
                <button
                  key={style}
                  onClick={() => applyTextConfig({ [style]: !textConfig[style] }, { pushHistory: !!activeTextElement })}
                  style={{
                    padding: '6px 10px',
                    border: `1px solid ${textConfig[style] ? '#1976d2' : '#90caf9'}`,
                    borderRadius: '4px',
                    background: textConfig[style] ? '#1976d2' : 'white',
                    color: textConfig[style] ? 'white' : '#1976d2',
                    fontSize: '11px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  {style === 'bold' ? 'B' : style === 'italic' ? 'I' : 'U'}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

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
          onWheel={(e) => {
            // Only allow wheel zoom when magnifier tool is active
            if (tool === 'magnifier') {
              e.evt.preventDefault();
              const scaleBy = 1.05;
              const stage = e.target.getStage();
              const oldScale = stage.scaleX();
              const pointer = stage.getPointerPosition();
              
              const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
              handleZoom(newScale, pointer);
            }
          }}
          style={{ 
            background: 'white',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      cursor: (tool === 'crop' || selectedTool === 'crop') ? 'crosshair' :
        tool === 'magnifier' ? 'zoom-in' : 
        tool === 'eraser' ? 'crosshair' : 
        tool === 'colorPicker' ? 'crosshair' : 'default'
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
                name="mainImage"
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
                    draggable={selectedTool === 'select' || tool === 'select'}
                    onClick={() => (selectedTool === 'select' || tool === 'select') && handleElementSelect(element.id)}
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
                    listening={selectedTool === 'select' || tool === 'select'}
                    onClick={() => (selectedTool === 'select' || tool === 'select') && handleElementSelect(element.id)}
                  />
                );
              } else if (element.type === 'rectangle' || element.type === 'rect') {
                return (
                  <Rect
                    key={element.id}
                    id={`element-${element.id}`}
                    x={element.x}
                    y={element.y}
                    width={element.width}
                    height={element.height}
                    stroke={element.stroke}
                    fill={element.fill}
                    strokeWidth={element.strokeWidth}
                    draggable={selectedTool === 'select' || tool === 'select'}
                    onClick={() => (selectedTool === 'select' || tool === 'select') && handleElementSelect(element.id)}
                  />
                );
              } else if (element.type === 'circle') {
                return (
                  <Circle
                    key={element.id}
                    id={`element-${element.id}`}
                    x={element.x + element.width / 2}
                    y={element.y + element.height / 2}
                    radius={Math.min(element.width, element.height) / 2}
                    stroke={element.stroke}
                    fill={element.fill}
                    strokeWidth={element.strokeWidth}
                    draggable={selectedTool === 'select' || tool === 'select'}
                    onClick={() => (selectedTool === 'select' || tool === 'select') && handleElementSelect(element.id)}
                  />
                );
              } else if (element.type === 'triangle') {
                const points = [
                  element.x + element.width / 2, element.y, // Top point
                  element.x, element.y + element.height, // Bottom left
                  element.x + element.width, element.y + element.height // Bottom right
                ];
                return (
                  <Line
                    key={element.id}
                    id={`element-${element.id}`}
                    points={points}
                    stroke={element.stroke}
                    fill={element.fill}
                    strokeWidth={element.strokeWidth}
                    closed={true}
                    draggable={selectedTool === 'select' || tool === 'select'}
                    onClick={() => (selectedTool === 'select' || tool === 'select') && handleElementSelect(element.id)}
                  />
                );
              } else if (element.type === 'ellipse') {
                return (
                  <Ellipse
                    key={element.id}
                    id={`element-${element.id}`}
                    x={element.x + element.width / 2}
                    y={element.y + element.height / 2}
                    radiusX={element.width / 2}
                    radiusY={element.height / 2}
                    stroke={element.stroke}
                    fill={element.fill}
                    strokeWidth={element.strokeWidth}
                    draggable={selectedTool === 'select' || tool === 'select'}
                    onClick={() => (selectedTool === 'select' || tool === 'select') && handleElementSelect(element.id)}
                  />
                );
              } else if (element.type === 'diamond') {
                const points = [
                  element.x + element.width / 2, element.y, // Top
                  element.x + element.width, element.y + element.height / 2, // Right
                  element.x + element.width / 2, element.y + element.height, // Bottom
                  element.x, element.y + element.height / 2 // Left
                ];
                return (
                  <Line
                    key={element.id}
                    id={`element-${element.id}`}
                    points={points}
                    stroke={element.stroke}
                    fill={element.fill}
                    strokeWidth={element.strokeWidth}
                    closed={true}
                    draggable={selectedTool === 'select' || tool === 'select'}
                    onClick={() => (selectedTool === 'select' || tool === 'select') && handleElementSelect(element.id)}
                  />
                );
              } else if (element.type === 'star') {
                // Simple 5-point star
                const centerX = element.x + element.width / 2;
                const centerY = element.y + element.height / 2;
                const outerRadius = Math.min(element.width, element.height) / 2;
                const innerRadius = outerRadius * 0.4;
                const points = [];
                
                for (let i = 0; i < 10; i++) {
                  const radius = i % 2 === 0 ? outerRadius : innerRadius;
                  const angle = (i * Math.PI) / 5 - Math.PI / 2;
                  points.push(centerX + radius * Math.cos(angle));
                  points.push(centerY + radius * Math.sin(angle));
                }
                
                return (
                  <Line
                    key={element.id}
                    id={`element-${element.id}`}
                    points={points}
                    stroke={element.stroke}
                    fill={element.fill}
                    strokeWidth={element.strokeWidth}
                    closed={true}
                    draggable={selectedTool === 'select' || tool === 'select'}
                    onClick={() => (selectedTool === 'select' || tool === 'select') && handleElementSelect(element.id)}
                  />
                );
              } else if (element.type === 'arrow') {
                const arrowLength = Math.sqrt(element.width * element.width + element.height * element.height);
                const angle = Math.atan2(element.height, element.width);
                const headLength = Math.min(20, arrowLength * 0.3);
                
                const points = [
                  element.x, element.y,
                  element.x + element.width, element.y + element.height,
                  element.x + element.width - headLength * Math.cos(angle - Math.PI / 6), 
                  element.y + element.height - headLength * Math.sin(angle - Math.PI / 6),
                  element.x + element.width, element.y + element.height,
                  element.x + element.width - headLength * Math.cos(angle + Math.PI / 6), 
                  element.y + element.height - headLength * Math.sin(angle + Math.PI / 6)
                ];
                
                return (
                  <Line
                    key={element.id}
                    id={`element-${element.id}`}
                    points={points}
                    stroke={element.stroke}
                    strokeWidth={element.strokeWidth}
                    draggable={selectedTool === 'select' || tool === 'select'}
                    onClick={() => (selectedTool === 'select' || tool === 'select') && handleElementSelect(element.id)}
                  />
                );
              } else if (element.type === 'polygon') {
                // Simple hexagon as default polygon
                const centerX = element.x + element.width / 2;
                const centerY = element.y + element.height / 2;
                const radius = Math.min(element.width, element.height) / 2;
                const points = [];
                
                for (let i = 0; i < 6; i++) {
                  const angle = (i * Math.PI) / 3;
                  points.push(centerX + radius * Math.cos(angle));
                  points.push(centerY + radius * Math.sin(angle));
                }
                
                return (
                  <Line
                    key={element.id}
                    id={`element-${element.id}`}
                    points={points}
                    stroke={element.stroke}
                    fill={element.fill}
                    strokeWidth={element.strokeWidth}
                    closed={true}
                    draggable={selectedTool === 'select' || tool === 'select'}
                    onClick={() => (selectedTool === 'select' || tool === 'select') && handleElementSelect(element.id)}
                  />
                );
              } else if (element.type === 'hexagon') {
                const centerX = element.x + element.width / 2;
                const centerY = element.y + element.height / 2;
                const radius = Math.min(element.width, element.height) / 2;
                const points = [];
                
                for (let i = 0; i < 6; i++) {
                  const angle = (i * Math.PI) / 3;
                  points.push(centerX + radius * Math.cos(angle));
                  points.push(centerY + radius * Math.sin(angle));
                }
                
                return (
                  <Line
                    key={element.id}
                    id={`element-${element.id}`}
                    points={points}
                    stroke={element.stroke}
                    fill={element.fill}
                    strokeWidth={element.strokeWidth}
                    closed={true}
                    draggable={selectedTool === 'select' || tool === 'select'}
                    onClick={() => (selectedTool === 'select' || tool === 'select') && handleElementSelect(element.id)}
                  />
                );
              } else if (element.type === 'roundedRect') {
                return (
                  <Rect
                    key={element.id}
                    id={`element-${element.id}`}
                    x={element.x}
                    y={element.y}
                    width={element.width}
                    height={element.height}
                    stroke={element.stroke}
                    fill={element.fill}
                    strokeWidth={element.strokeWidth}
                    cornerRadius={10}
                    draggable={selectedTool === 'select' || tool === 'select'}
                    onClick={() => (selectedTool === 'select' || tool === 'select') && handleElementSelect(element.id)}
                  />
                );
              } else if (element.type === 'heart') {
                // Heart shape using path-like points
                const centerX = element.x + element.width / 2;
                const centerY = element.y + element.height / 2;
                const w = element.width;
                const h = element.height;
                
                const points = [
                  centerX, centerY + h * 0.3,
                  centerX - w * 0.4, centerY - h * 0.1,
                  centerX - w * 0.2, centerY - h * 0.3,
                  centerX, centerY - h * 0.1,
                  centerX + w * 0.2, centerY - h * 0.3,
                  centerX + w * 0.4, centerY - h * 0.1,
                  centerX, centerY + h * 0.3
                ];
                
                return (
                  <Line
                    key={element.id}
                    id={`element-${element.id}`}
                    points={points}
                    stroke={element.stroke}
                    fill={element.fill}
                    strokeWidth={element.strokeWidth}
                    closed={true}
                    draggable={selectedTool === 'select' || tool === 'select'}
                    onClick={() => (selectedTool === 'select' || tool === 'select') && handleElementSelect(element.id)}
                  />
                );
              } else if (element.type === 'line') {
                const points = [
                  element.x, element.y,
                  element.x + element.width, element.y + element.height
                ];
                return (
                  <Line
                    key={element.id}
                    id={`element-${element.id}`}
                    points={element.points || points}
                    stroke={element.stroke}
                    strokeWidth={element.strokeWidth}
                    draggable={selectedTool === 'select' || tool === 'select'}
                    onClick={() => (selectedTool === 'select' || tool === 'select') && handleElementSelect(element.id)}
                  />
                );
              }
              return null;
            })}
            
            {/* Current drawing path */}
            {isDrawing && currentPath.length > 0 && (tool === 'draw' || selectedTool === 'draw') && Array.isArray(currentPath) && typeof currentPath[0] === 'number' && (
              <Line
                points={currentPath}
                stroke={selectedPreset === 'eraser' || brushMode === 'eraser' ? '#ffffff' : brushColor}
                strokeWidth={brushSize}
                opacity={(selectedPreset === 'eraser' || brushMode === 'eraser') ? 1 : (brushOpacity / 100)}
                tension={currentBrushPreset.tension}
                lineCap={currentBrushPreset.lineCap}
                lineJoin={currentBrushPreset.lineJoin}
                globalCompositeOperation={(selectedPreset === 'eraser' || brushMode === 'eraser') ? currentBrushPreset.composite : 'source-over'}
                fill={fillEnabled && (selectedPreset !== 'eraser' && brushMode !== 'eraser') ? fillColor : undefined}
                closed={fillEnabled && (selectedPreset !== 'eraser' && brushMode !== 'eraser')}
                listening={false}
              />
            )}
            
            {/* Temporary shape preview */}
            {tempShape && isDrawing && (tool === 'shape' || selectedTool === 'shape') && (
              <>
                {tempShape.className === 'Rect' && (
                  <Rect
                    {...tempShape.attrs}
                    opacity={0.7}
                    listening={false}
                  />
                )}
                {tempShape.className === 'Circle' && (
                  <Circle
                    {...tempShape.attrs}
                    opacity={0.7}
                    listening={false}
                  />
                )}
                {tempShape.className === 'Ellipse' && (
                  <Ellipse
                    {...tempShape.attrs}
                    opacity={0.7}
                    listening={false}
                  />
                )}
                {tempShape.className === 'Line' && (
                  <Line
                    {...tempShape.attrs}
                    opacity={0.7}
                    listening={false}
                  />
                )}
                {tempShape.className === 'Arrow' && (
                  <Arrow
                    {...tempShape.attrs}
                    opacity={0.7}
                    listening={false}
                  />
                )}
                {tempShape.className === 'Star' && (
                  <Star
                    {...tempShape.attrs}
                    opacity={0.7}
                    listening={false}
                  />
                )}
              </>
            )}

            {/* Crop selection overlay */}
            {cropSelection && cropSelection.width > 0 && cropSelection.height > 0 && (
              <KonvaGroup listening={false}>
                <Rect
                  x={0}
                  y={0}
                  width={canvasSize.width}
                  height={Math.max(0, cropSelection.y)}
                  fill="rgba(15, 23, 42, 0.35)"
                />
                <Rect
                  x={0}
                  y={cropSelection.y}
                  width={Math.max(0, cropSelection.x)}
                  height={cropSelection.height}
                  fill="rgba(15, 23, 42, 0.35)"
                />
                <Rect
                  x={Math.min(canvasSize.width, cropSelection.x + cropSelection.width)}
                  y={cropSelection.y}
                  width={Math.max(0, canvasSize.width - (cropSelection.x + cropSelection.width))}
                  height={cropSelection.height}
                  fill="rgba(15, 23, 42, 0.35)"
                />
                <Rect
                  x={0}
                  y={Math.min(canvasSize.height, cropSelection.y + cropSelection.height)}
                  width={canvasSize.width}
                  height={Math.max(0, canvasSize.height - (cropSelection.y + cropSelection.height))}
                  fill="rgba(15, 23, 42, 0.35)"
                />
                <Rect
                  x={cropSelection.x}
                  y={cropSelection.y}
                  width={cropSelection.width}
                  height={cropSelection.height}
                  stroke="#0d6efd"
                  strokeWidth={2}
                  dash={[8, 4]}
                  fill="rgba(13, 110, 253, 0.12)"
                />
                {[
                  { x: cropSelection.x, y: cropSelection.y },
                  { x: cropSelection.x + cropSelection.width, y: cropSelection.y },
                  { x: cropSelection.x, y: cropSelection.y + cropSelection.height },
                  { x: cropSelection.x + cropSelection.width, y: cropSelection.y + cropSelection.height }
                ].map((handle, index) => (
                  <Rect
                    key={`crop-handle-${index}`}
                    x={handle.x - 4}
                    y={handle.y - 4}
                    width={8}
                    height={8}
                    fill="#0d6efd"
                    cornerRadius={2}
                  />
                ))}
              </KonvaGroup>
            )}
            
            {/* Transformer for selected elements */}
            {(selectedTool === 'select' || tool === 'select') && (
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
            
            {/* Eraser Preview */}
            {selectedPreset === 'eraser' && tool === 'draw' && (
              <Circle
                x={0}
                y={0}
                radius={eraserSize / 2}
                stroke="#ff0000"
                strokeWidth={1}
                opacity={0.5}
                listening={false}
                dash={[5, 5]}
              />
            )}
          </Layer>
        </Stage>
      </div>

      {isCropToolActive && (
        <div style={{
          margin: '0 16px 24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '10px'
        }}>
          <span style={{ fontSize: '12px', color: '#495057' }}>
            Drag on the canvas to choose a crop area, then apply or cancel below.
          </span>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="button"
              onClick={applyCrop}
              disabled={!isCropSelectionValid}
              style={{
                padding: '10px 18px',
                borderRadius: '8px',
                border: 'none',
                background: isCropSelectionValid ? '#0d6efd' : '#cbd5f5',
                color: isCropSelectionValid ? '#fff' : '#6b7280',
                fontWeight: 600,
                cursor: isCropSelectionValid ? 'pointer' : 'not-allowed',
                boxShadow: isCropSelectionValid ? '0 8px 18px rgba(13,110,253,0.35)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              Apply crop
            </button>
            <button
              type="button"
              onClick={cancelCrop}
              style={{
                padding: '10px 18px',
                borderRadius: '8px',
                border: '1px solid #dee2e6',
                background: '#fff',
                color: '#495057',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
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
