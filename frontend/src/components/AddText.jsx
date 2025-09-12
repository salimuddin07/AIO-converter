import React, { useState, useRef, useCallback } from 'react';
import AdvancedUploadArea from './AdvancedUploadArea';
import Results from './Results';
import '../aio-convert-style.css';

const AddText = () => {
    const [file, setFile] = useState(null);
    const [imageInfo, setImageInfo] = useState(null);
    const [previewUrl, setPreviewUrl] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');
    const [showPreview, setShowPreview] = useState(false);
    
    // Text configuration state
    const [textConfig, setTextConfig] = useState({
        text: '',
        x: 10,
        y: 50,
        fontSize: 24,
        fontFamily: 'Arial',
        color: '#ffffff',
        backgroundColor: 'rgba(0,0,0,0.5)',
        strokeColor: '#000000',
        strokeWidth: 1,
        opacity: 1,
        rotation: 0,
        outline: true,
        shadow: false,
        shadowColor: '#000000',
        shadowOffsetX: 2,
        shadowOffsetY: 2,
        shadowBlur: 4,
        animationMode: 'all',
        frameStart: 0,
        frameEnd: -1,
        alignment: 'left',
        wordWrap: false,
        maxWidth: 300
    });

    const [availableFonts, setAvailableFonts] = useState([
        'Arial', 'Helvetica', 'Times New Roman', 'Georgia', 'Verdana', 
        'Courier New', 'Impact', 'Comic Sans MS', 'Trebuchet MS', 'Palatino'
    ]);

    const fileInputRef = useRef(null);

    const handleFileSelect = useCallback(async (selectedFile) => {
        if (!selectedFile) return;

        const formData = new FormData();
        formData.append('image', selectedFile);

        try {
            setIsProcessing(true);
            setError('');
            
            const response = await fetch('/api/text/upload', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();
            
            if (data.success) {
                setFile({ id: data.fileId, name: selectedFile.name });
                setImageInfo(data.imageInfo);
                setPreviewUrl(URL.createObjectURL(selectedFile));
                
                // Load available fonts
                fetchFonts();
            } else {
                setError(data.error || 'Upload failed');
            }
        } catch (err) {
            console.error('Upload error:', err);
            setError('Failed to upload file');
        } finally {
            setIsProcessing(false);
        }
    }, []);

    const handleUrlUpload = useCallback(async (url) => {
        if (!url) return;

        try {
            setIsProcessing(true);
            setError('');
            
            const response = await fetch('/api/text/upload-url', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ imageUrl: url })
            });

            const data = await response.json();
            
            if (data.success) {
                setFile({ id: data.fileId, name: 'Image from URL' });
                setImageInfo(data.imageInfo);
                setPreviewUrl(url);
                
                // Load available fonts
                fetchFonts();
            } else {
                setError(data.error || 'URL upload failed');
            }
        } catch (err) {
            console.error('URL upload error:', err);
            setError('Failed to download from URL');
        } finally {
            setIsProcessing(false);
        }
    }, []);

    const fetchFonts = async () => {
        try {
            const response = await fetch('/api/text/fonts');
            const data = await response.json();
            if (data.fonts) {
                setAvailableFonts(data.fonts);
            }
        } catch (err) {
            console.error('Failed to fetch fonts:', err);
        }
    };

    const handleConfigChange = (field, value) => {
        setTextConfig(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handlePreview = async () => {
        if (!file || !textConfig.text.trim()) return;

        try {
            setIsProcessing(true);
            setError('');
            
            const response = await fetch('/api/text/preview', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fileId: file.id,
                    ...textConfig,
                    frameRange: { start: textConfig.frameStart, end: textConfig.frameEnd }
                })
            });

            const data = await response.json();
            
            if (data.success) {
                setPreviewUrl(data.preview);
                setShowPreview(true);
            } else {
                setError(data.error || 'Preview failed');
            }
        } catch (err) {
            console.error('Preview error:', err);
            setError('Failed to generate preview');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleAddText = async () => {
        if (!file || !textConfig.text.trim()) {
            setError('Please select a file and enter text');
            return;
        }

        try {
            setIsProcessing(true);
            setError('');
            setResult(null);
            
            const response = await fetch('/api/text/add-text', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fileId: file.id,
                    ...textConfig,
                    frameRange: { start: textConfig.frameStart, end: textConfig.frameEnd }
                })
            });

            const data = await response.json();
            
            if (data.success) {
                setResult({
                    outputFile: data.outputFile,
                    downloadUrl: data.downloadUrl,
                    originalSize: imageInfo?.size || 'Unknown',
                    dimensions: `${imageInfo?.width || 0}x${imageInfo?.height || 0}`,
                    frames: imageInfo?.frames || 1
                });
            } else {
                setError(data.error || 'Text addition failed');
            }
        } catch (err) {
            console.error('Text addition error:', err);
            setError('Failed to add text to image');
        } finally {
            setIsProcessing(false);
        }
    };

    const resetForm = () => {
        setFile(null);
        setImageInfo(null);
        setPreviewUrl('');
        setResult(null);
        setError('');
        setShowPreview(false);
        setTextConfig({
            text: '',
            x: 10,
            y: 50,
            fontSize: 24,
            fontFamily: 'Arial',
            color: '#ffffff',
            backgroundColor: 'rgba(0,0,0,0.5)',
            strokeColor: '#000000',
            strokeWidth: 1,
            opacity: 1,
            rotation: 0,
            outline: true,
            shadow: false,
            shadowColor: '#000000',
            shadowOffsetX: 2,
            shadowOffsetY: 2,
            shadowBlur: 4,
            animationMode: 'all',
            frameStart: 0,
            frameEnd: -1,
            alignment: 'left',
            wordWrap: false,
            maxWidth: 300
        });
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    if (result) {
        return (
            <Results
                result={result}
                onReset={resetForm}
                title="Text Added Successfully!"
                type="text"
            />
        );
    }

    return (
        <div className="converter-container">
            <div className="main-content">
                <h1 className="main-title">Add Text to Animated Images</h1>
                <p className="main-subtitle">
                    Add custom text overlays to your GIF, WebP, and APNG images with advanced styling options
                </p>

                <div className="conversion-section">
                    {!file ? (
                        <AdvancedUploadArea
                            onFileSelect={handleFileSelect}
                            onUrlUpload={handleUrlUpload}
                            acceptedTypes="image/*"
                            maxSize={200}
                            title="Choose animated image"
                            subtitle="Upload your GIF, WebP, APNG, or static image"
                            isProcessing={isProcessing}
                        />
                    ) : (
                        <div className="file-selected">
                            <div className="selected-file-info">
                                <div className="file-details">
                                    <h3>{file.name}</h3>
                                    {imageInfo && (
                                        <div className="image-stats">
                                            <span>Size: {imageInfo.size}</span>
                                            <span>Dimensions: {imageInfo.width}×{imageInfo.height}</span>
                                            <span>Format: {imageInfo.format.toUpperCase()}</span>
                                            {imageInfo.frames > 1 && (
                                                <span>Frames: {imageInfo.frames}</span>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <button className="change-file-btn" onClick={resetForm}>
                                    Change File
                                </button>
                            </div>

                            {previewUrl && (
                                <div className="image-preview">
                                    <img src={previewUrl} alt="Preview" style={{ maxWidth: '100%', maxHeight: '300px' }} />
                                </div>
                            )}
                        </div>
                    )}

                    {file && (
                        <div className="text-config-section">
                            <h3>Text Configuration</h3>
                            
                            {/* Text Input */}
                            <div className="config-group">
                                <label>Text Content:</label>
                                <textarea
                                    value={textConfig.text}
                                    onChange={(e) => handleConfigChange('text', e.target.value)}
                                    placeholder="Enter your text here..."
                                    rows="3"
                                    className="text-input"
                                />
                            </div>

                            {/* Position Controls */}
                            <div className="config-row">
                                <div className="config-group">
                                    <label>X Position:</label>
                                    <input
                                        type="number"
                                        value={textConfig.x}
                                        onChange={(e) => handleConfigChange('x', parseInt(e.target.value))}
                                        min="0"
                                    />
                                </div>
                                <div className="config-group">
                                    <label>Y Position:</label>
                                    <input
                                        type="number"
                                        value={textConfig.y}
                                        onChange={(e) => handleConfigChange('y', parseInt(e.target.value))}
                                        min="0"
                                    />
                                </div>
                            </div>

                            {/* Font Controls */}
                            <div className="config-row">
                                <div className="config-group">
                                    <label>Font Family:</label>
                                    <select
                                        value={textConfig.fontFamily}
                                        onChange={(e) => handleConfigChange('fontFamily', e.target.value)}
                                    >
                                        {availableFonts.map(font => (
                                            <option key={font} value={font}>{font}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="config-group">
                                    <label>Font Size:</label>
                                    <input
                                        type="number"
                                        value={textConfig.fontSize}
                                        onChange={(e) => handleConfigChange('fontSize', parseInt(e.target.value))}
                                        min="8"
                                        max="200"
                                    />
                                </div>
                            </div>

                            {/* Color Controls */}
                            <div className="config-row">
                                <div className="config-group">
                                    <label>Text Color:</label>
                                    <input
                                        type="color"
                                        value={textConfig.color}
                                        onChange={(e) => handleConfigChange('color', e.target.value)}
                                    />
                                </div>
                                <div className="config-group">
                                    <label>Background Color:</label>
                                    <input
                                        type="color"
                                        value={textConfig.backgroundColor.replace('rgba(0,0,0,0.5)', '#000000')}
                                        onChange={(e) => handleConfigChange('backgroundColor', e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Outline & Shadow */}
                            <div className="config-row">
                                <div className="config-group">
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={textConfig.outline}
                                            onChange={(e) => handleConfigChange('outline', e.target.checked)}
                                        />
                                        Text Outline
                                    </label>
                                </div>
                                <div className="config-group">
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={textConfig.shadow}
                                            onChange={(e) => handleConfigChange('shadow', e.target.checked)}
                                        />
                                        Text Shadow
                                    </label>
                                </div>
                            </div>

                            {textConfig.outline && (
                                <div className="config-row">
                                    <div className="config-group">
                                        <label>Outline Color:</label>
                                        <input
                                            type="color"
                                            value={textConfig.strokeColor}
                                            onChange={(e) => handleConfigChange('strokeColor', e.target.value)}
                                        />
                                    </div>
                                    <div className="config-group">
                                        <label>Outline Width:</label>
                                        <input
                                            type="number"
                                            value={textConfig.strokeWidth}
                                            onChange={(e) => handleConfigChange('strokeWidth', parseInt(e.target.value))}
                                            min="0"
                                            max="10"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Animation Controls */}
                            {imageInfo && imageInfo.frames > 1 && (
                                <div className="config-group">
                                    <label>Animation Mode:</label>
                                    <select
                                        value={textConfig.animationMode}
                                        onChange={(e) => handleConfigChange('animationMode', e.target.value)}
                                    >
                                        <option value="all">All Frames</option>
                                        <option value="first">First Frame Only</option>
                                        <option value="last">Last Frame Only</option>
                                        <option value="range">Frame Range</option>
                                    </select>
                                </div>
                            )}

                            {textConfig.animationMode === 'range' && (
                                <div className="config-row">
                                    <div className="config-group">
                                        <label>Start Frame:</label>
                                        <input
                                            type="number"
                                            value={textConfig.frameStart}
                                            onChange={(e) => handleConfigChange('frameStart', parseInt(e.target.value))}
                                            min="0"
                                            max={imageInfo?.frames - 1 || 0}
                                        />
                                    </div>
                                    <div className="config-group">
                                        <label>End Frame:</label>
                                        <input
                                            type="number"
                                            value={textConfig.frameEnd}
                                            onChange={(e) => handleConfigChange('frameEnd', parseInt(e.target.value))}
                                            min="0"
                                            max={imageInfo?.frames - 1 || 0}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Advanced Options */}
                            <details className="advanced-options">
                                <summary>Advanced Options</summary>
                                
                                <div className="config-row">
                                    <div className="config-group">
                                        <label>Text Alignment:</label>
                                        <select
                                            value={textConfig.alignment}
                                            onChange={(e) => handleConfigChange('alignment', e.target.value)}
                                        >
                                            <option value="left">Left</option>
                                            <option value="center">Center</option>
                                            <option value="right">Right</option>
                                        </select>
                                    </div>
                                    <div className="config-group">
                                        <label>Rotation (degrees):</label>
                                        <input
                                            type="number"
                                            value={textConfig.rotation}
                                            onChange={(e) => handleConfigChange('rotation', parseInt(e.target.value))}
                                            min="-360"
                                            max="360"
                                        />
                                    </div>
                                </div>

                                <div className="config-row">
                                    <div className="config-group">
                                        <label>Opacity:</label>
                                        <input
                                            type="range"
                                            min="0"
                                            max="1"
                                            step="0.1"
                                            value={textConfig.opacity}
                                            onChange={(e) => handleConfigChange('opacity', parseFloat(e.target.value))}
                                        />
                                        <span>{Math.round(textConfig.opacity * 100)}%</span>
                                    </div>
                                    <div className="config-group">
                                        <label>
                                            <input
                                                type="checkbox"
                                                checked={textConfig.wordWrap}
                                                onChange={(e) => handleConfigChange('wordWrap', e.target.checked)}
                                            />
                                            Word Wrap
                                        </label>
                                    </div>
                                </div>

                                {textConfig.wordWrap && (
                                    <div className="config-group">
                                        <label>Max Width:</label>
                                        <input
                                            type="number"
                                            value={textConfig.maxWidth}
                                            onChange={(e) => handleConfigChange('maxWidth', parseInt(e.target.value))}
                                            min="50"
                                            max="1000"
                                        />
                                    </div>
                                )}
                            </details>

                            {/* Action Buttons */}
                            <div className="action-buttons">
                                <button
                                    className="preview-btn"
                                    onClick={handlePreview}
                                    disabled={!textConfig.text.trim() || isProcessing}
                                >
                                    {isProcessing ? 'Generating...' : 'Preview'}
                                </button>
                                
                                <button
                                    className="convert-btn"
                                    onClick={handleAddText}
                                    disabled={!textConfig.text.trim() || isProcessing}
                                >
                                    {isProcessing ? 'Processing...' : 'Add Text'}
                                </button>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="error-message">
                            {error}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AddText;
