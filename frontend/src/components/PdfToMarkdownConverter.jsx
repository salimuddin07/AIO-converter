import React, { useState, useRef } from 'react';
import { pdfProcessor } from '../utils/pdfToMarkdown.js';

export default function PdfToMarkdownConverter() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [converting, setConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  // Handle file selection
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        setError('Please select a PDF file');
        return;
      }
      if (file.size > 25 * 1024 * 1024) {
        setError('File too large. Maximum 25MB allowed.');
        return;
      }
      setSelectedFile(file);
      setError(null);
      setResult(null);
    }
  };

  // Handle drag and drop
  const handleDrop = (event) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      setError(null);
      setResult(null);
    } else {
      setError('Please drop a PDF file');
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  // Convert PDF to Markdown
  const convertPdf = async () => {
    if (!selectedFile) return;

    setConverting(true);
    setProgress(0);
    setError(null);

    try {
      const onProgress = (progressPercent) => {
        setProgress(progressPercent);
      };

      const result = await pdfProcessor.convertPdfToMarkdown(selectedFile, onProgress);
      
      setResult({
        content: result,
        pageCount: selectedFile.name, // We'll get the actual page count from the processing
        downloadUrl: '#'
      });
      
      setProgress(100);
    } catch (err) {
      console.error('Conversion error:', err);
      setError(err.message || 'Failed to convert PDF to Markdown');
    } finally {
      setConverting(false);
    }
  };

  // Download the converted markdown file
  const downloadMarkdown = () => {
    if (result && result.content) {
      // Create a blob from the markdown content
      const blob = new Blob([result.content], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedFile.name.replace('.pdf', '')}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  // Clear selection and start over
  const reset = () => {
    setSelectedFile(null);
    setResult(null);
    setError(null);
    setProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="pdf-converter">
      <div className="converter-header">
        <h2>📄 PDF to Markdown Converter</h2>
        <p>Convert PDF documents to Markdown format - 100% Local Processing</p>
      </div>

      {!selectedFile && (
        <div 
          className="upload-area"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="upload-icon">📁</div>
          <h3>Drop PDF Here or Click to Browse</h3>
          <p>Maximum file size: 25MB</p>
          <button className="browse-button">Choose PDF File</button>
        </div>
      )}

      <input
        type="file"
        ref={fileInputRef}
        accept=".pdf,application/pdf"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      {selectedFile && !result && (
        <div className="file-selected">
          <div className="file-info">
            <div className="file-icon">📄</div>
            <div className="file-details">
              <h3>{selectedFile.name}</h3>
              <p>{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
          </div>
          
          <div className="conversion-controls">
            <button 
              className="convert-button"
              onClick={convertPdf}
              disabled={converting}
            >
              {converting ? 'Converting...' : 'Convert to Markdown'}
            </button>
            <button className="reset-button" onClick={reset}>
              Choose Different File
            </button>
          </div>

          {converting && (
            <div className="progress-section">
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <p>Converting PDF... {Math.round(progress)}%</p>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="error-message">
          <h3>❌ Error</h3>
          <p>{error}</p>
        </div>
      )}

      {result && (
        <div className="conversion-result">
          <div className="result-header">
            <h3>✅ Conversion Complete!</h3>
            <p>Successfully converted {result.pageCount} page{result.pageCount !== 1 ? 's' : ''} to Markdown</p>
          </div>

          <div className="result-actions">
            <button className="download-button" onClick={downloadMarkdown}>
              📥 Download Markdown File
            </button>
            <button className="reset-button" onClick={reset}>
              Convert Another PDF
            </button>
          </div>

          <div className="preview-section">
            <h4>📖 Preview:</h4>
            <div className="markdown-preview">
              <pre>{result.content?.substring(0, 500)}...</pre>
            </div>
          </div>
        </div>
      )}

      <div className="info-section">
        <h4>ℹ️ How it works:</h4>
        <ul>
          <li><strong>100% Local:</strong> Your PDF never leaves your computer</li>
          <li><strong>Text Extraction:</strong> Extracts text content from PDF pages</li>
          <li><strong>Smart Formatting:</strong> Detects headers, lists, and paragraphs</li>
          <li><strong>Markdown Output:</strong> Creates clean, structured Markdown files</li>
        </ul>
      </div>

      <style>{`
        .pdf-converter {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }

        .converter-header {
          text-align: center;
          margin-bottom: 30px;
        }

        .converter-header h2 {
          color: #2d3748;
          margin-bottom: 10px;
          font-size: 2rem;
        }

        .converter-header p {
          color: #718096;
          font-size: 1.1rem;
        }

        .upload-area {
          border: 3px dashed #cbd5e0;
          border-radius: 12px;
          padding: 60px 20px;
          text-align: center;
          background: #f7fafc;
          cursor: pointer;
          transition: all 0.3s ease;
          margin-bottom: 30px;
        }

        .upload-area:hover {
          border-color: #4299e1;
          background: #ebf8ff;
        }

        .upload-icon {
          font-size: 4rem;
          margin-bottom: 20px;
        }

        .upload-area h3 {
          color: #2d3748;
          margin-bottom: 10px;
          font-size: 1.5rem;
        }

        .upload-area p {
          color: #718096;
          margin-bottom: 20px;
        }

        .browse-button {
          background: #4299e1;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 1rem;
          cursor: pointer;
        }

        .browse-button:hover {
          background: #3182ce;
        }

        .file-selected {
          background: white;
          border-radius: 12px;
          padding: 30px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          margin-bottom: 30px;
        }

        .file-info {
          display: flex;
          align-items: center;
          margin-bottom: 20px;
        }

        .file-icon {
          font-size: 3rem;
          margin-right: 20px;
        }

        .file-details h3 {
          color: #2d3748;
          margin: 0 0 5px 0;
          font-size: 1.2rem;
        }

        .file-details p {
          color: #718096;
          margin: 0;
        }

        .conversion-controls {
          display: flex;
          gap: 15px;
          margin-bottom: 20px;
        }

        .convert-button {
          background: #48bb78;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 1rem;
          cursor: pointer;
          font-weight: 600;
        }

        .convert-button:hover:not(:disabled) {
          background: #38a169;
        }

        .convert-button:disabled {
          background: #a0aec0;
          cursor: not-allowed;
        }

        .reset-button {
          background: #e2e8f0;
          color: #4a5568;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 1rem;
          cursor: pointer;
        }

        .reset-button:hover {
          background: #cbd5e0;
        }

        .progress-section {
          margin-top: 20px;
        }

        .progress-bar {
          width: 100%;
          height: 8px;
          background: #e2e8f0;
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 10px;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #48bb78, #38a169);
          transition: width 0.3s ease;
        }

        .progress-section p {
          text-align: center;
          color: #4a5568;
          font-weight: 500;
        }

        .error-message {
          background: #fed7d7;
          border: 1px solid #fc8181;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 20px;
        }

        .error-message h3 {
          color: #e53e3e;
          margin: 0 0 10px 0;
        }

        .error-message p {
          color: #c53030;
          margin: 0;
        }

        .conversion-result {
          background: #f0fff4;
          border: 1px solid #68d391;
          border-radius: 12px;
          padding: 30px;
          margin-bottom: 30px;
        }

        .result-header {
          text-align: center;
          margin-bottom: 20px;
        }

        .result-header h3 {
          color: #22543d;
          margin: 0 0 10px 0;
          font-size: 1.5rem;
        }

        .result-header p {
          color: #2f855a;
          margin: 0;
        }

        .result-actions {
          display: flex;
          gap: 15px;
          justify-content: center;
          margin-bottom: 30px;
        }

        .download-button {
          background: #48bb78;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 1rem;
          cursor: pointer;
          font-weight: 600;
        }

        .download-button:hover {
          background: #38a169;
        }

        .preview-section h4 {
          color: #2d3748;
          margin-bottom: 15px;
        }

        .markdown-preview {
          background: #1a202c;
          color: #e2e8f0;
          padding: 20px;
          border-radius: 8px;
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
          font-size: 0.9rem;
          max-height: 300px;
          overflow-y: auto;
        }

        .markdown-preview pre {
          margin: 0;
          white-space: pre-wrap;
          word-wrap: break-word;
        }

        .info-section {
          background: #ebf8ff;
          border-radius: 8px;
          padding: 20px;
          margin-top: 30px;
        }

        .info-section h4 {
          color: #2b6cb0;
          margin: 0 0 15px 0;
        }

        .info-section ul {
          color: #2c5282;
          margin: 0;
          padding-left: 20px;
        }

        .info-section li {
          margin-bottom: 8px;
        }

        @media (max-width: 768px) {
          .conversion-controls {
            flex-direction: column;
          }
          
          .result-actions {
            flex-direction: column;
          }
          
          .convert-button,
          .download-button,
          .reset-button {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}