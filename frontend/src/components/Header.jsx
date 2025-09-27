import React from 'react';

export default function Header({ currentTool, setCurrentTool }) {
  
  const handleNavClick = (e, toolId) => {
    e.preventDefault();
    if (setCurrentTool) {
      setCurrentTool(toolId);
    }
  };

  return (
    <header className="aio-convert-header">
      <div className="header-container">
        <div className="logo-section">
          <h1 className="site-logo">
            <a href="#" onClick={(e) => handleNavClick(e, 'home')}>AIO Convert</a>
            <span className="local-badge">LOCAL</span>
          </h1>
          <p className="tagline">All-in-One Media Converter - 100% Local Processing</p>
        </div>
        
        <div className="header-ad">
          <div className="ad-placeholder">Advertisement</div>
        </div>
      </div>

      <nav className="main-nav">
        <ul className="nav-links">
          <li><a href="#" className={`nav-link gif-maker ${currentTool === 'gif-maker' ? 'active' : ''}`} onClick={(e) => handleNavClick(e, 'gif-maker')}>GIF maker</a></li>
          <li><a href="#" className={`nav-link video-to-gif ${currentTool === 'video-to-gif' ? 'active' : ''}`} onClick={(e) => handleNavClick(e, 'video-to-gif')}>Video to GIF</a></li>
          <li><a href="#" className={`nav-link resize ${currentTool === 'resize' ? 'active' : ''}`} onClick={(e) => handleNavClick(e, 'resize')}>Resize</a></li>
          <li><a href="#" className={`nav-link rotate ${currentTool === 'rotate' ? 'active' : ''}`} onClick={(e) => handleNavClick(e, 'rotate')}>Rotate</a></li>
          <li><a href="#" className={`nav-link crop ${currentTool === 'crop' ? 'active' : ''}`} onClick={(e) => handleNavClick(e, 'crop')}>Crop</a></li>
          <li><a href="#" className={`nav-link optimize ${currentTool === 'optimize' ? 'active' : ''}`} onClick={(e) => handleNavClick(e, 'optimize')}>Optimize</a></li>
          <li><a href="#" className={`nav-link effects ${currentTool === 'effects' ? 'active' : ''}`} onClick={(e) => handleNavClick(e, 'effects')}>Effects</a></li>
          <li><a href="#" className={`nav-link split ${currentTool === 'split' ? 'active' : ''}`} onClick={(e) => handleNavClick(e, 'split')}>Split</a></li>
          <li><a href="#" className={`nav-link add-text ${currentTool === 'add-text' ? 'active' : ''}`} onClick={(e) => handleNavClick(e, 'add-text')}>Add text</a></li>
          <li><a href="#" className={`nav-link pdf-to-md ${currentTool === 'pdf-to-md' ? 'active' : ''}`} onClick={(e) => handleNavClick(e, 'pdf-to-md')}>PDF to MD</a></li>
          <li><a href="#" className={`nav-link webp ${currentTool === 'webp-maker' ? 'active' : ''}`} onClick={(e) => handleNavClick(e, 'webp-maker')}>WebP</a></li>
          <li><a href="#" className={`nav-link apng ${currentTool === 'apng-maker' ? 'active' : ''}`} onClick={(e) => handleNavClick(e, 'apng-maker')}>APNG</a></li>
          <li><a href="#" className={`nav-link avif ${currentTool === 'avif-converter' ? 'active' : ''}`} onClick={(e) => handleNavClick(e, 'avif-converter')}>AVIF</a></li>
          <li><a href="#" className={`nav-link jxl ${currentTool === 'jxl-converter' ? 'active' : ''}`} onClick={(e) => handleNavClick(e, 'jxl-converter')}>JXL</a></li>
        </ul>
      </nav>

      <style>{`
        .aio-convert-header {
          background: #ffffffff;
          border-bottom: 1px solid #ddd;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .header-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 15px 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .logo-section {
          flex: 1;
        }

        .site-logo {
          margin: 0;
          font-size: 28px;
          font-weight: bold;
          position: relative;
        }

        .site-logo a {
          color: #e74c3c;
          text-decoration: none;
          font-family: Arial, sans-serif;
        }

        .local-badge {
          background: #48bb78;
          color: white;
          font-size: 10px;
          padding: 2px 6px;
          border-radius: 4px;
          position: absolute;
          top: -8px;
          right: -35px;
          font-weight: 500;
        }

        .tagline {
          margin: 5px 0 0 0;
          font-size: 12px;
          color: #666;
          font-style: italic;
        }

        .header-ad {
          width: 728px;
          height: 90px;
          background: #f5f5f5;
          border: 1px solid #ddd;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .ad-placeholder {
          color: #999;
          font-size: 14px;
        }

        .main-nav {
          background: #f8f9fa;
          border-bottom: 1px solid #dee2e6;
        }

        .nav-links {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0;
          list-style: none;
          display: flex;
          flex-wrap: wrap;
          font-size: 13px;
        }

        .nav-links li {
          margin: 0;
        }

        .nav-link {
          display: block;
          padding: 12px 15px;
          color: #495057;
          text-decoration: none;
          border-right: 1px solid #dee2e6;
          transition: all 0.2s ease;
          font-weight: 500;
          cursor: pointer;
        }

        .nav-link:hover,
        .nav-link:focus,
        .nav-link.active {
          background: #3498db;
          color: white;
        }

        @media (max-width: 768px) {
          .header-container {
            flex-direction: column;
            gap: 15px;
          }

          .header-ad {
            width: 100%;
            height: 60px;
          }

          .nav-links {
            justify-content: center;
          }

          .nav-link {
            padding: 10px 8px;
            font-size: 12px;
          }
        }
      `}</style>
    </header>
  );
}
