import React, { useState } from 'react';
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import PdfToMarkdownConverter from './components/PdfToMarkdownConverter.jsx';
import LibraryTest from './components/LibraryTest.jsx';
import { NotificationService } from './utils/NotificationService.js';
import './aio-convert-style.css';

export default function App() {
  const [currentTool, setCurrentTool] = useState('home');

  return (
    <div className="app">
      <Header 
        currentTool={currentTool}
        setCurrentTool={setCurrentTool}
      />
      
      <main className="main-content">
        {currentTool === 'library-test' ? (
          <LibraryTest />
        ) : currentTool === 'pdf-to-md' ? (
          <PdfToMarkdownConverter />
        ) : (
          <div className="welcome-section">
            <div className="container">
              <h1>🎯 AIO Convert - Professional Media Converter</h1>
              <p className="lead">Convert, resize, and optimize your media files - 100% locally processed!</p>
              
              <div className="tool-grid">
                <div className="tool-card" onClick={() => setCurrentTool('library-test')}>
                  <div className="tool-icon">🧪</div>
                  <h3>Library Test</h3>
                  <p>Test frontend animation libraries</p>
                </div>
                
                <div className="tool-card" onClick={() => setCurrentTool('gif-maker')}>
                  <div className="tool-icon">🎞️</div>
                  <h3>GIF Maker</h3>
                  <p>Convert videos to animated GIFs</p>
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
                
                <div className="tool-card" onClick={() => setCurrentTool('image-editor')}>
                  <div className="tool-icon">✏️</div>
                  <h3>Image Editor</h3>
                  <p>Resize, crop, and edit images</p>
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
        )}
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
          align-items: center;
          justify-content: center;
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
        
        @media (max-width: 768px) {
          .welcome-section h1 {
            font-size: 2rem;
          }
          
          .features-highlight {
            flex-direction: column;
            align-items: center;
            gap: 20px;
          }
        }
      `}</style>
    </div>
  );
}