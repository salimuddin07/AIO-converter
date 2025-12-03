import React, { useState, useRef } from 'react';
import { convertPdfToMarkdown } from '../utils/unifiedAPI.js';

export default function PdfToMarkdownConverter() {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [converting, setConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    if (files.length > 0) {
      const pdfFiles = files.filter(file => file.type === 'application/pdf');
      if (pdfFiles.length === 0) {
        setError('Please select PDF files');
        return;
      }
      setSelectedFiles(pdfFiles);
      setError(null);
      setResults(null);
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files);
    const pdfFiles = files.filter(file => file.type === 'application/pdf');
    if (pdfFiles.length > 0) {
      setSelectedFiles(pdfFiles);
      setError(null);
      setResults(null);
    } else {
      setError('Please drop PDF files');
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const removeFile = (index) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
  };

  const convertPdfs = async () => {
    if (selectedFiles.length === 0) return;
    setConverting(true);
    setProgress(0);
    setError(null);
    try {
      const result = await convertPdfToMarkdown(selectedFiles);
      if (selectedFiles.length === 1) {
        if (result.success) {
          setResults({ single: true, file: result, total: 1, successful: 1, failed: 0 });
        } else {
          setError(result.error || 'Conversion failed');
        }
      } else {
        setResults({ single: false, files: result.results || [], total: result.total || 0, successful: result.successful || 0, failed: result.failed || 0 });
      }
      setProgress(100);
    } catch (err) {
      setError(err.message || 'Failed to convert PDF to Markdown');
    } finally {
      setConverting(false);
    }
  };

  const downloadMarkdown = async (fileData) => {
    try {
      if (fileData.content) {
        const blob = new Blob([fileData.content], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileData.fileName || 'converted.md';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      setError(`Failed to download: ${error.message}`);
    }
  };

  const downloadAllFiles = async () => {
    if (!results || results.single) return;
    for (const file of results.files) {
      if (file.success) {
        await downloadMarkdown(file);
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  };

  const reset = () => {
    setSelectedFiles([]);
    setResults(null);
    setError(null);
    setProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className='pdf-converter'>
      <div className='converter-header'>
        <h2> PDF to Markdown Converter</h2>
        <p>Convert single or multiple PDF documents to Markdown format</p>
      </div>
      {selectedFiles.length === 0 && (
        <div className='upload-area' onDrop={handleDrop} onDragOver={handleDragOver} onClick={() => fileInputRef.current?.click()}>
          <div className='upload-icon'></div>
          <h3>Drop PDF Files Here or Click to Browse</h3>
          <button className='browse-button'>Choose PDF Files</button>
        </div>
      )}
      <input type='file' ref={fileInputRef} accept='.pdf' onChange={handleFileSelect} multiple style={{ display: 'none' }} />
      {selectedFiles.length > 0 && !results && (
        <div className='file-selected'>
          <h3>Selected Files ({selectedFiles.length})</h3>
          {selectedFiles.map((file, index) => (
            <div key={index} className='file-item'>
              <span> {file.name}</span>
              <button className='remove-button' onClick={() => removeFile(index)} disabled={converting}></button>
            </div>
          ))}
          <button className='convert-button' onClick={convertPdfs} disabled={converting}>
            {converting ? 'Converting...' : `Convert ${selectedFiles.length} PDF${selectedFiles.length > 1 ? 's' : ''}`}
          </button>
          <button className='reset-button' onClick={reset} disabled={converting}>Clear All</button>
          {converting && <div className='progress-section'><div className='progress-bar'><div className='progress-fill' style={{ width: progress+'%' }}></div></div><p>Converting...</p></div>}
        </div>
      )}
      {error && <div className='error-message'><h3> Error</h3><p>{error}</p></div>}
      {results && (
        <div className='conversion-result'>
          <h3> Conversion Complete!</h3>
          {results.single ? (
            <><button className='download-button' onClick={() => downloadMarkdown(results.file)}> Download</button></>
          ) : (
            <><button className='download-button' onClick={downloadAllFiles}> Download All ({results.successful})</button></>
          )}
          <button className='reset-button' onClick={reset}>Convert More</button>
          {!results.single && (
            <div className='files-result-list'>
              {results.files.map((file, index) => (
                <div key={index} className={
esult-file-item  + (file.success ? 'success' : 'error')}>
                  <span>{file.success ? '' : ''} {file.originalName}</span>
                  {file.success && <button onClick={() => downloadMarkdown(file)}></button>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      <style>{``}</style>
    </div>
  );
}
