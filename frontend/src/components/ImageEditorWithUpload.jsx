import React, { useEffect, useRef, useState } from 'react';
import ImageEditor from './ImageEditor.jsx';
import { ImageCropTool, ImageResizeTool, ImageRotateTool } from './ImageTransformTools.jsx';

const ImageEditorWithUpload = ({ tool = 'edit' }) => {
  const [imageUrl, setImageUrl] = useState(null);
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [objectUrl, setObjectUrl] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [objectUrl]);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (selectedFile) => {
    if (!selectedFile) {
      return;
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'];
    if (!validTypes.includes(selectedFile.type)) {
      alert('Please select a valid image file (JPG, PNG, GIF, WebP, BMP)');
      return;
    }

    // Check file size (50GB limit for image editing)
    if (selectedFile.size > 52242880000) {
      alert('The file you are trying to upload is too large! Max file size is 50 GB');
      return;
    }

    setIsUploading(true);
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
      setObjectUrl(null);
    }

    const nextUrl = URL.createObjectURL(selectedFile);
    const img = new window.Image();

    img.onload = () => {
      setFile(selectedFile);
      setImageUrl(nextUrl);
      setObjectUrl(nextUrl);
      setIsUploading(false);
    };

    img.onerror = () => {
      URL.revokeObjectURL(nextUrl);
      setObjectUrl(null);
      setIsUploading(false);
      console.error('Preview error: unable to load selected image.');
      alert('We could not load that image. Please try another file.');
    };

    img.src = nextUrl;
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleSave = async (editedImageData) => {
    try {
      // Convert canvas data to blob and download
      const response = await fetch(editedImageData);
      const blob = await response.blob();
      
      const downloadLink = document.createElement('a');
      downloadLink.href = URL.createObjectURL(blob);
      downloadLink.download = `edited_${file?.name || 'image.png'}`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(downloadLink.href);
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save image');
    }
  };

  const getToolTitle = () => {
    switch (tool) {
      case 'resize':
        return 'Image Resizer';
      case 'crop':
        return 'Image Cropper';
      case 'rotate':
        return 'Image Rotator';
      case 'effects':
        return 'Image Effects';
      case 'add-text':
        return 'Add Text to Images';
      default:
        return 'Image Editor';
    }
  };

  const getToolDescription = () => {
    switch (tool) {
      case 'resize':
        return 'Resize, scale, and export your image at precise dimensions with aspect ratio controls.';
      case 'crop':
        return 'Select the exact region you want to keep using modern cropping controls.';
      case 'rotate':
        return 'Rotate, flip, or mirror your image before downloading the adjusted result.';
      case 'effects':
        return 'Apply filters and effects to your images instantly.';
      case 'add-text':
        return 'Upload an image and add text, drawings, or filters right in your browser.';
      default:
        return 'Edit and enhance your images';
    }
  };

  if (!imageUrl) {
    return (
      <div id="main">
        <h1>{getToolTitle()}</h1>
        <p>{getToolDescription()}</p>
        
        <div 
          className={`upload-area ${dragActive ? 'drag-active' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: '2px dashed #ccc',
            borderRadius: '10px',
            padding: '40px',
            textAlign: 'center',
            cursor: 'pointer',
            margin: '20px 0',
            backgroundColor: dragActive ? '#f0f8ff' : '#f9f9f9',
            borderColor: dragActive ? '#007bff' : '#ccc'
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          
          {isUploading ? (
            <div>
              <div style={{ fontSize: '48px', marginBottom: '20px' }}>⏳</div>
              <h3>Uploading...</h3>
              <p>Please wait while we process your image</p>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: '48px', marginBottom: '20px' }}>📷</div>
              <h3>Choose an Image to {tool === 'resize' ? 'Resize' : tool === 'crop' ? 'Crop' : tool === 'rotate' ? 'Rotate' : 'Edit'}</h3>
              <p>Drag and drop an image here, or click to browse</p>
              <p style={{ fontSize: '14px', color: '#666', marginTop: '10px' }}>
                Supported formats: JPG, PNG, GIF, WebP, BMP<br/>
                Maximum file size: 50GB
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  const renderEditor = () => {
    const header = (
      <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '5px' }}>
        <h2>{getToolTitle()}</h2>
        <p>{getToolDescription()}</p>
        <button
          onClick={() => {
            setImageUrl(null);
            setFile(null);
            setObjectUrl(prev => {
              if (prev) {
                URL.revokeObjectURL(prev);
              }
              return null;
            });
          }}
          style={{
            padding: '8px 16px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Choose Different Image
        </button>
      </div>
    );

    if (tool === 'resize') {
      return (
        <>
          {header}
          <ImageResizeTool imageUrl={imageUrl} onExport={handleSave} />
        </>
      );
    }

    if (tool === 'rotate') {
      return (
        <>
          {header}
          <ImageRotateTool imageUrl={imageUrl} onExport={handleSave} />
        </>
      );
    }

    if (tool === 'crop') {
      return (
        <>
          {header}
          <ImageCropTool imageUrl={imageUrl} onExport={handleSave} />
        </>
      );
    }

    return (
      <>
        {header}
        <ImageEditor
          imageUrl={imageUrl}
          onSave={handleSave}
          defaultTool={tool === 'effects' ? 'filters' : 'text'}
        />
      </>
    );
  };

  return renderEditor();
};

export default ImageEditorWithUpload;