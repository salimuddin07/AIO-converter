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
            <span className="offline-badge">OFFLINE</span>
          </h1>
          <p className="tagline">All-in-one media converter — runs entirely on your computer</p>
        </div>
      </div>

      <nav className="main-nav">
        <ul className="nav-links">
          <li><a href="#" className={`nav-link gif-maker ${currentTool === 'gif-maker' ? 'active' : ''}`} onClick={(e) => handleNavClick(e, 'gif-maker')}>Images to GIF</a></li>
          <li><a href="#" className={`nav-link video-to-gif ${currentTool === 'video-to-gif' ? 'active' : ''}`} onClick={(e) => handleNavClick(e, 'video-to-gif')}>Video to GIF</a></li>
          <li><a href="#" className={`nav-link resize ${currentTool === 'resize' ? 'active' : ''}`} onClick={(e) => handleNavClick(e, 'resize')}>Resize</a></li>
          <li><a href="#" className={`nav-link rotate ${currentTool === 'rotate' ? 'active' : ''}`} onClick={(e) => handleNavClick(e, 'rotate')}>Rotate</a></li>
          <li><a href="#" className={`nav-link crop ${currentTool === 'crop' ? 'active' : ''}`} onClick={(e) => handleNavClick(e, 'crop')}>Crop</a></li>
          <li><a href="#" className={`nav-link optimize ${currentTool === 'optimize' ? 'active' : ''}`} onClick={(e) => handleNavClick(e, 'optimize')}>Optimize</a></li>
          <li><a href="#" className={`nav-link effects ${currentTool === 'effects' ? 'active' : ''}`} onClick={(e) => handleNavClick(e, 'effects')}>Effects</a></li>
          <li><a href="#" className={`nav-link split ${currentTool === 'split' ? 'active' : ''}`} onClick={(e) => handleNavClick(e, 'split')}>Split</a></li>
          <li><a href="#" className={`nav-link frame-split ${currentTool === 'frame-splitter' ? 'active' : ''}`} onClick={(e) => handleNavClick(e, 'frame-splitter')}>Frame Split</a></li>
          <li><a href="#" className={`nav-link timed-split ${currentTool === 'timed-video-split' ? 'active' : ''}`} onClick={(e) => handleNavClick(e, 'timed-video-split')}>Timed Split</a></li>
          <li><a href="#" className={`nav-link pdf-to-md ${currentTool === 'pdf-to-md' ? 'active' : ''}`} onClick={(e) => handleNavClick(e, 'pdf-to-md')}>PDF to MD</a></li>
          <li><a href="#" className={`nav-link md-to-pdf ${currentTool === 'md-to-pdf' ? 'active' : ''}`} onClick={(e) => handleNavClick(e, 'md-to-pdf')}>MD to PDF</a></li>
          <li><a href="#" className={`nav-link text-to-md ${currentTool === 'text-to-md' ? 'active' : ''}`} onClick={(e) => handleNavClick(e, 'text-to-md')}>Text to MD</a></li>
          <li><a href="#" className={`nav-link image-to-pdf ${currentTool === 'image-to-pdf' ? 'active' : ''}`} onClick={(e) => handleNavClick(e, 'image-to-pdf')}>Image to PDF</a></li>
          <li><a href="#" className={`nav-link webp ${currentTool === 'webp-maker' ? 'active' : ''}`} onClick={(e) => handleNavClick(e, 'webp-maker')}>WebP</a></li>
          <li><a href="#" className={`nav-link apng ${currentTool === 'apng-maker' ? 'active' : ''}`} onClick={(e) => handleNavClick(e, 'apng-maker')}>APNG</a></li>
          <li><a href="#" className={`nav-link avif ${currentTool === 'avif-converter' ? 'active' : ''}`} onClick={(e) => handleNavClick(e, 'avif-converter')}>AVIF</a></li>
          <li><a href="#" className={`nav-link jxl ${currentTool === 'jxl-converter' ? 'active' : ''}`} onClick={(e) => handleNavClick(e, 'jxl-converter')}>JXL</a></li>
          <li><a href="#" className={`nav-link coffee ${currentTool === 'buy-me-coffee' ? 'active' : ''}`} onClick={(e) => handleNavClick(e, 'buy-me-coffee')}>☕ Support</a></li>
        </ul>
      </nav>

      <style>{`
        .aio-convert-header {
          background: #ffffff;
          border-bottom: 1px solid #e5e7eb;
        }

        .header-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 18px 24px;
        }

        .logo-section {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .site-logo {
          margin: 0;
          font-size: 22px;
          font-weight: 700;
          letter-spacing: -0.01em;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .site-logo a {
          color: #0f172a;
          text-decoration: none;
        }

        .offline-badge {
          background: #ecfdf5;
          color: #047857;
          font-size: 10px;
          padding: 2px 8px;
          border-radius: 4px;
          font-weight: 600;
          letter-spacing: 0.05em;
          border: 1px solid #a7f3d0;
        }

        .tagline {
          margin: 0;
          font-size: 13px;
          color: #64748b;
        }

        .main-nav {
          background: #f8fafc;
          border-bottom: 1px solid #e5e7eb;
        }

        .nav-links {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 12px;
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
          padding: 11px 14px;
          color: #475569;
          text-decoration: none;
          transition: color 0.15s ease, background 0.15s ease;
          font-weight: 500;
          cursor: pointer;
          border-bottom: 2px solid transparent;
        }

        .nav-link:hover,
        .nav-link:focus {
          color: #2563eb;
          background: #ffffff;
        }

        .nav-link.active {
          color: #2563eb;
          background: #ffffff;
          border-bottom-color: #2563eb;
        }

        @media (max-width: 768px) {
          .header-container {
            padding: 14px 16px;
          }

          .nav-link {
            padding: 10px 10px;
            font-size: 12px;
          }
        }
      `}</style>
    </header>
  );
}
