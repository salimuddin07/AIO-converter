import React from 'react';
import ImageEditorWithUpload from './ImageEditorWithUpload.jsx';
import '../aio-convert-style.css';

const AddText = () => {
  return (
    <div className="converter-container add-text-tool">
      <div className="main-content">
        <h1 className="main-title">Add Text to Images</h1>
        <p className="main-subtitle">
          Everything runs locally in your browser—drop in an image, switch between the Text, Draw, and Select tools, and export the result instantly.
        </p>

        <div className="conversion-section" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <ImageEditorWithUpload tool="add-text" />
        </div>
      </div>
    </div>
  );
};

export default AddText;
