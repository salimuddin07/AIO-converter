import React from 'react';
import ImageEditorWithUpload from './ImageEditorWithUpload.jsx';
import '../aio-convert-style.css';

const helperCardStyle = {
  marginTop: '24px',
  padding: '20px',
  borderRadius: '12px',
  background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.1), rgba(38, 166, 154, 0.1))',
  border: '1px solid rgba(25, 118, 210, 0.2)',
  color: '#1f1f1f'
};

const tipListStyle = {
  margin: '12px 0 0',
  paddingLeft: '20px',
  lineHeight: 1.6,
  fontSize: '0.95rem'
};

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

          <div style={helperCardStyle}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>How to use this editor</h3>
            <ul style={tipListStyle}>
              <li>
                Use the <strong>Text</strong> tool to click anywhere on the canvas and type. Double-click existing text to edit it.
              </li>
              <li>
                Switch to <strong>Select</strong> to move, resize, or rotate items. The handles appear as soon as the layer is selected.
              </li>
              <li>
                Pick <strong>Draw</strong> for freehand sketches, then adjust brush size and color from the toolbar.
              </li>
              <li>
                When you are happy with the result, press <strong>Export</strong> to download a PNG snapshot of your work.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddText;
