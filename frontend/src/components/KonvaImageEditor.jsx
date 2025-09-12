import React, { useRef, useEffect, useState } from 'react';
import Konva from 'konva';
import { Stage, Layer, Image as KonvaImage, Text as KonvaText, Transformer } from 'react-konva';
import { colorVariations } from '../utils/polishedHelpers';

const KonvaImageEditor = ({ 
  imageUrl, 
  width = 800, 
  height = 600, 
  onSave,
  tools = ['text', 'draw', 'crop', 'filters']
}) => {
  const stageRef = useRef();
  const layerRef = useRef();
  const transformerRef = useRef();
  const [image, setImage] = useState(null);
  const [selectedTool, setSelectedTool] = useState('text');
  const [selectedElement, setSelectedElement] = useState(null);
  const [elements, setElements] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState([]);
  const [brushSize, setBrushSize] = useState(5);
  const [brushColor, setBrushColor] = useState('#000000');
  const [textConfig, setTextConfig] = useState({
    fontSize: 24,
    fontFamily: 'Arial',
    fill: '#000000',
    fontWeight: 'normal',
    fontStyle: 'normal'
  });

  useEffect(() => {
    if (imageUrl) {
      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        setImage(img);
      };
      img.src = imageUrl;
    }
  }, [imageUrl]);

  const handleStageClick = (e) => {
    const clickedOnEmpty = e.target === e.target.getStage();
    
    if (clickedOnEmpty) {
      setSelectedElement(null);
      return;
    }

    if (selectedTool === 'text' && clickedOnEmpty) {
      addText(e.evt.offsetX, e.evt.offsetY);
    }
  };

  const addText = (x, y) => {
    const newText = {
      id: Date.now(),
      type: 'text',
      x: x,
      y: y,
      text: 'Double click to edit',
      ...textConfig
    };
    setElements([...elements, newText]);
  };

  const handleTextDblClick = (id) => {
    const text = elements.find(el => el.id === id);
    if (!text) return;

    const newText = prompt('Enter text:', text.text);
    if (newText !== null) {
      setElements(elements.map(el => 
        el.id === id ? { ...el, text: newText } : el
      ));
    }
  };

  const handleMouseDown = (e) => {
    if (selectedTool === 'draw') {
      setIsDrawing(true);
      const pos = e.target.getStage().getPointerPosition();
      setCurrentPath([pos.x, pos.y]);
    }
  };

  const handleMouseMove = (e) => {
    if (!isDrawing || selectedTool !== 'draw') return;

    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    setCurrentPath([...currentPath, point.x, point.y]);
  };

  const handleMouseUp = () => {
    if (selectedTool === 'draw' && isDrawing) {
      const newLine = {
        id: Date.now(),
        type: 'line',
        points: currentPath,
        stroke: brushColor,
        strokeWidth: brushSize,
        tension: 0.5,
        lineCap: 'round',
        lineJoin: 'round'
      };
      setElements([...elements, newLine]);
      setCurrentPath([]);
      setIsDrawing(false);
    }
  };

  const handleElementSelect = (id) => {
    setSelectedElement(id);
    const node = stageRef.current.findOne(`#element-${id}`);
    if (node && transformerRef.current) {
      transformerRef.current.nodes([node]);
      transformerRef.current.getLayer().batchDraw();
    }
  };

  const handleElementTransform = (id, newAttrs) => {
    setElements(elements.map(el => 
      el.id === id ? { ...el, ...newAttrs } : el
    ));
  };

  const deleteSelectedElement = () => {
    if (selectedElement) {
      setElements(elements.filter(el => el.id !== selectedElement));
      setSelectedElement(null);
      if (transformerRef.current) {
        transformerRef.current.nodes([]);
        transformerRef.current.getLayer().batchDraw();
      }
    }
  };

  const clearCanvas = () => {
    setElements([]);
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

    layerRef.current.cache();
    
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
        border: `2px solid ${active ? colorVariations('#1976d2').base : '#e0e0e0'}`,
        borderRadius: '8px',
        background: active ? colorVariations('#1976d2').transparent : 'white',
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <label style={{ fontSize: '12px', fontWeight: '500' }}>
              Size:
              <input
                type="range"
                min="1"
                max="20"
                value={brushSize}
                onChange={(e) => setBrushSize(parseInt(e.target.value))}
                style={{ marginLeft: '8px' }}
              />
              <span style={{ marginLeft: '8px' }}>{brushSize}px</span>
            </label>
            <label style={{ fontSize: '12px', fontWeight: '500' }}>
              Color:
              <input
                type="color"
                value={brushColor}
                onChange={(e) => setBrushColor(e.target.value)}
                style={{ marginLeft: '8px', width: '32px', height: '24px', border: 'none', borderRadius: '4px' }}
              />
            </label>
          </div>
        )}
        
        {selectedTool === 'text' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <input
              type="number"
              value={textConfig.fontSize}
              onChange={(e) => setTextConfig({...textConfig, fontSize: parseInt(e.target.value)})}
              style={{ width: '60px', padding: '4px 8px', borderRadius: '4px', border: '1px solid #ccc' }}
              placeholder="Size"
            />
            <select
              value={textConfig.fontFamily}
              onChange={(e) => setTextConfig({...textConfig, fontFamily: e.target.value})}
              style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #ccc' }}
            >
              <option value="Arial">Arial</option>
              <option value="Helvetica">Helvetica</option>
              <option value="Times New Roman">Times New Roman</option>
              <option value="Courier New">Courier New</option>
              <option value="Verdana">Verdana</option>
            </select>
            <input
              type="color"
              value={textConfig.fill}
              onChange={(e) => setTextConfig({...textConfig, fill: e.target.value})}
              style={{ width: '32px', height: '24px', border: 'none', borderRadius: '4px' }}
            />
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
        minHeight: `${height + 32}px`
      }}>
        <Stage
          ref={stageRef}
          width={width}
          height={height}
          onMouseDown={handleMouseDown}
          onMousemove={handleMouseMove}
          onMouseup={handleMouseUp}
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
                width={width}
                height={height}
                listening={false}
              />
            )}
            
            {/* Render elements */}
            {elements.map((element) => {
              if (element.type === 'text') {
                return (
                  <KonvaText
                    key={element.id}
                    id={`element-${element.id}`}
                    {...element}
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
                  <Konva.Line
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
              <Konva.Line
                points={currentPath}
                stroke={brushColor}
                strokeWidth={brushSize}
                tension={0.5}
                lineCap="round"
                lineJoin="round"
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
        <KonvaImageEditor
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

export default KonvaImageEditor;
