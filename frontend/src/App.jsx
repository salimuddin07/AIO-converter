import React, { useState } from 'react';
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import PdfToMarkdownConverter from './components/PdfToMarkdownConverter.jsx';
import MarkdownToPdf from './components/MarkdownToPdf.jsx';
import ImagesToPdfConverter from './components/ImagesToPdfConverter.jsx';
import VideoToGifConverter from './components/VideoToGifConverter.jsx';
import ImageGifMaker from './components/ImageGifMaker.jsx';
import MainConversionInterface from './components/MainConversionInterface.jsx';
import ImageEditorWithUpload from './components/ImageEditorWithUpload.jsx';
import ImageOptimizer from './components/ImageOptimizer.jsx';
import WebPConverter from './components/WebPConverter.jsx';
import GifSplitter from './components/GifSplitter.jsx';
import { ApngStudio, AvifStudio, JxlStudio } from './components/ModernFormatTool.jsx';
import ToolInfoPanel from './components/ToolInfoPanel.jsx';
import BuyMeCoffee from './components/BuyMeCoffee.jsx';
import './aio-convert-style.css';

export default function App() {
  const [currentTool, setCurrentTool] = useState('home');

  const renderHome = () => (
    <div className="welcome-section">
      <div className="container">
        <h1>🎯 AIO Convert - Professional Media Converter</h1>
        <p className="lead">Convert, resize, and optimize your media files - 100% locally processed!</p>
        
        <div className="tool-grid">
          <div className="tool-card" onClick={() => setCurrentTool('gif-maker')}>
            <div className="tool-icon">🖼️</div>
            <h3>GIF Maker</h3>
            <p>Combine images into animated GIFs</p>
          </div>
          
          <div className="tool-card" onClick={() => setCurrentTool('image-converter')}>
            <div className="tool-icon">🔄</div>
            <h3>Image Converter</h3>
            <p>Convert between image formats</p>
          </div>
          
          <div className="tool-card" onClick={() => setCurrentTool('pdf-to-md')}>
            <div className="tool-icon">📄</div>
            <h3>PDF to Markdown</h3>
            <p>Convert PDF documents to Markdown</p>
          </div>

          <div className="tool-card" onClick={() => setCurrentTool('md-to-pdf')}>
            <div className="tool-icon">📝</div>
            <h3>Markdown to PDF</h3>
            <p>Render Markdown into a polished PDF</p>
          </div>

          <div className="tool-card" onClick={() => setCurrentTool('image-to-pdf')}>
            <div className="tool-icon">🖼️</div>
            <h3>Images to PDF</h3>
            <p>Combine multiple images into a PDF</p>
          </div>
          
          <div className="tool-card" onClick={() => setCurrentTool('image-editor')}>
            <div className="tool-icon">✏️</div>
            <h3>Image Editor</h3>
            <p>Resize, crop, and edit images</p>
          </div>
          
          <div className="tool-card" onClick={() => setCurrentTool('split')}>
            <div className="tool-icon">✂️</div>
            <h3>GIF Splitter</h3>
            <p>Extract frames from GIFs</p>
          </div>
          
          <div className="tool-card" onClick={() => setCurrentTool('webp-maker')}>
            <div className="tool-icon">🖼️</div>
            <h3>WebP Converter</h3>
            <p>Convert to/from WebP format</p>
          </div>
          
          <div className="tool-card coffee-card" onClick={() => setCurrentTool('buy-me-coffee')}>
            <div className="tool-icon">☕</div>
            <h3>Support Us</h3>
            <p>Buy us a coffee to keep improving!</p>
          </div>
        </div>
        
        <div className="features-highlight">
          <div className="feature">
            <span className="feature-icon">🔒</span>
            <span>100% Private - No uploads</span>
          </div>
          <div className="feature">
            <span className="feature-icon">⚡</span>
            <span>Fast Local Processing</span>
          </div>
          <div className="feature">
            <span className="feature-icon">🌐</span>
            <span>Works Offline</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTool = () => {
    switch (currentTool) {
      case 'pdf-to-md':
        return <PdfToMarkdownConverter />;
      case 'md-to-pdf':
        return <MarkdownToPdf />;
      case 'image-to-pdf':
        return <ImagesToPdfConverter />;
      case 'gif-maker':
        return <ImageGifMaker />;
      case 'video-to-gif':
        return <VideoToGifConverter />;
      case 'image-converter':
        return <MainConversionInterface />;
      case 'image-editor':
        return <ImageEditorWithUpload tool="edit" />;
      case 'resize':
        return <ImageEditorWithUpload tool="resize" />;
      case 'rotate':
        return <ImageEditorWithUpload tool="rotate" />;
      case 'crop':
        return <ImageEditorWithUpload tool="crop" />;
      case 'optimize':
        return <ImageOptimizer />;
      case 'effects':
        return <ImageEditorWithUpload tool="effects" />;
      case 'split':
        return <GifSplitter />;
      case 'webp-maker':
        return <WebPConverter />;
      case 'apng-maker':
        return <ApngStudio />;
      case 'avif-converter':
        return <AvifStudio />;
      case 'jxl-converter':
        return <JxlStudio />;
      case 'buy-me-coffee':
        return <BuyMeCoffee />;
      case 'home':
      default:
        return renderHome();
    }
  };

  return (
    <div className="app">
      <Header 
        currentTool={currentTool}
        setCurrentTool={setCurrentTool}
      />
      
      <main className="main-content">
        <div className={`tool-shell ${currentTool === 'home' ? 'tool-shell--home' : ''}`}>
          <div className="tool-shell__viewer">
            {renderTool()}
          </div>
          <ToolInfoPanel tool={currentTool} />
        </div>
      </main>
      
      <Footer />
      
      <style>{`
        .app {
          min-height: 100vh;
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }
        
        .main-content {
          min-height: 70vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          padding: 32px 16px;
          gap: 24px;
        }

        .main-content > * {
          width: 100%;
          max-width: 1240px;
        }

        .tool-shell {
          display: flex;
          flex-direction: column;
          gap: 32px;
        }

        .tool-shell__viewer {
          width: 100%;
        }
        
        .welcome-section {
          text-align: center;
          padding: 40px 20px;
          width: 100%;
        }
        
        .container {
          max-width: 1200px;
          margin: 0 auto;
        }
        
        .welcome-section h1 {
          font-size: 3rem;
          color: #2d3748;
          margin-bottom: 20px;
          font-weight: 700;
        }
        
        .lead {
          font-size: 1.3rem;
          color: #4a5568;
          margin-bottom: 50px;
          max-width: 600px;
          margin-left: auto;
          margin-right: auto;
        }
        
        .tool-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 30px;
          margin-bottom: 50px;
        }
        
        .tool-card {
          background: white;
          padding: 30px;
          border-radius: 20px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.1);
          cursor: pointer;
          transition: all 0.3s ease;
        }
        
        .tool-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 20px 40px rgba(0,0,0,0.15);
        }
        
        .tool-icon {
          font-size: 3rem;
          margin-bottom: 20px;
        }
        
        .tool-card h3 {
          font-size: 1.5rem;
          color: #2d3748;
          margin-bottom: 10px;
        }
        
        .tool-card p {
          color: #718096;
          font-size: 1rem;
        }
        
        .coffee-card {
          background: linear-gradient(135deg, #FFDD00 0%, #FFA500 100%);
          border: 2px solid #FFB347;
        }
        
        .coffee-card:hover {
          background: linear-gradient(135deg, #FFE55C 0%, #FFB347 100%);
          transform: translateY(-5px) scale(1.02);
        }
        
        .coffee-card h3,
        .coffee-card p {
          color: #2d3748;
        }
        
        .coffee-card .tool-icon {
          filter: drop-shadow(2px 2px 4px rgba(0,0,0,0.2));
        }
        
        .features-highlight {
          display: flex;
          justify-content: center;
          gap: 40px;
          margin-top: 40px;
          flex-wrap: wrap;
        }
        
        .feature {
          display: flex;
          align-items: center;
          gap: 10px;
          background: rgba(255,255,255,0.2);
          padding: 15px 25px;
          border-radius: 50px;
          backdrop-filter: blur(10px);
        }
        
        .feature-icon {
          font-size: 1.2rem;
        }
        
        .tool-info-panel {
          background: rgba(255, 255, 255, 0.94);
          border-radius: 18px;
          padding: 28px 32px;
          box-shadow: 0 14px 34px rgba(15, 23, 42, 0.1);
          border: 1px solid rgba(148, 163, 184, 0.28);
        }

        .tool-info-panel h2 {
          margin: 0 0 12px 0;
          font-size: 1.25rem;
          color: #1f2937;
        }

        .tool-info-panel__summary {
          color: #4b5563;
          margin-bottom: 16px;
          line-height: 1.5;
        }

        .tool-info-panel__section {
          margin-bottom: 20px;
        }

        .tool-info-panel__section:last-of-type {
          margin-bottom: 0;
        }

        .tool-info-panel__section h3 {
          margin-bottom: 8px;
          font-size: 0.95rem;
          color: #0f172a;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .tool-info-panel ol,
        .tool-info-panel ul {
          margin: 0;
          padding-left: 18px;
          color: #374151;
          display: grid;
          gap: 6px;
        }

        .tool-info-panel ul {
          list-style: disc;
        }

        .tool-info-panel ol {
          list-style: decimal;
        }

        @media (max-width: 768px) {
          .welcome-section h1 {
            font-size: 2rem;
          }
          
          .features-highlight {
            flex-direction: column;
            align-items: center;
            gap: 20px;
          }

          .tool-info-panel {
            padding: 24px;
          }
        }
      `}</style>
    </div>
  );
}