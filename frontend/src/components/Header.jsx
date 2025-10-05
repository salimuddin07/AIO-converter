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
            <a href="#" onClick={(e) => handleNavClick(e, 'home')}>
              AIO Convert
            </a>
            {/* <span className="local-badge">LOCAL</span> */}
          </h1>
          <p className="tagline">All-in-One Media Converter</p>
        </div>
        
        <div className="header-ad">
          <div className="ad-placeholder">Advertisement Space</div>
        </div>
      </div>

      <nav className="main-nav">
        <div className="nav-container">
          <ul className="nav-links">
            <li><a href="#" className={`nav-link ${currentTool === 'gif-maker' ? 'active' : ''}`} onClick={(e) => handleNavClick(e, 'gif-maker')}>🎬 Images to GIF</a></li>
            <li><a href="#" className={`nav-link ${currentTool === 'video-to-gif' ? 'active' : ''}`} onClick={(e) => handleNavClick(e, 'video-to-gif')}>📹 Video to GIF</a></li>
            <li><a href="#" className={`nav-link ${currentTool === 'resize' ? 'active' : ''}`} onClick={(e) => handleNavClick(e, 'resize')}>📏 Resize</a></li>
            <li><a href="#" className={`nav-link ${currentTool === 'rotate' ? 'active' : ''}`} onClick={(e) => handleNavClick(e, 'rotate')}>🔄 Rotate</a></li>
            <li><a href="#" className={`nav-link ${currentTool === 'crop' ? 'active' : ''}`} onClick={(e) => handleNavClick(e, 'crop')}>✂️ Crop</a></li>
            <li><a href="#" className={`nav-link ${currentTool === 'optimize' ? 'active' : ''}`} onClick={(e) => handleNavClick(e, 'optimize')}>⚡ Optimize</a></li>
            <li><a href="#" className={`nav-link ${currentTool === 'effects' ? 'active' : ''}`} onClick={(e) => handleNavClick(e, 'effects')}>✨ Effects</a></li>
            <li><a href="#" className={`nav-link ${currentTool === 'split' ? 'active' : ''}`} onClick={(e) => handleNavClick(e, 'split')}>📂 Split</a></li>
            <li><a href="#" className={`nav-link ${currentTool === 'pdf-to-md' ? 'active' : ''}`} onClick={(e) => handleNavClick(e, 'pdf-to-md')}>📄 PDF→MD</a></li>
            <li><a href="#" className={`nav-link ${currentTool === 'md-to-pdf' ? 'active' : ''}`} onClick={(e) => handleNavClick(e, 'md-to-pdf')}>📝 MD→PDF</a></li>
            <li><a href="#" className={`nav-link ${currentTool === 'image-to-pdf' ? 'active' : ''}`} onClick={(e) => handleNavClick(e, 'image-to-pdf')}>🖼️ Image→PDF</a></li>
            <li><a href="#" className={`nav-link ${currentTool === 'webp-maker' ? 'active' : ''}`} onClick={(e) => handleNavClick(e, 'webp-maker')}>🌐 WebP</a></li>
            <li><a href="#" className={`nav-link ${currentTool === 'apng-maker' ? 'active' : ''}`} onClick={(e) => handleNavClick(e, 'apng-maker')}>🎞️ APNG</a></li>
            <li><a href="#" className={`nav-link ${currentTool === 'avif-converter' ? 'active' : ''}`} onClick={(e) => handleNavClick(e, 'avif-converter')}>🔧 AVIF</a></li>
            <li><a href="#" className={`nav-link ${currentTool === 'jxl-converter' ? 'active' : ''}`} onClick={(e) => handleNavClick(e, 'jxl-converter')}>🚀 JXL</a></li>
          </ul>
        </div>
      </nav>

      <style>{`
        .aio-convert-header {
          background: #ffffff;
          border-bottom: 1px solid #e2e8f0;
          box-shadow: 0 2px 4px rgba(0,0,0,0.06);
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .header-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 16px 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 24px;
        }

        .logo-section {
          flex: 0 0 auto;
          min-width: 200px;
        }

        .site-logo {
          margin: 0;
          font-size: 32px;
          font-weight: 700;
          position: relative;
          line-height: 1.2;
        }

        .site-logo a {
          color: #e53e3e;
          text-decoration: none;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
          display: inline-block;
          transition: color 0.2s ease;
        }

        .site-logo a:hover {
          color: #c53030;
        }

        .local-badge {
          background: linear-gradient(135deg, #48bb78, #38a169);
          color: white;
          font-size: 10px;
          padding: 3px 8px;
          border-radius: 6px;
          position: absolute;
          top: -2px;
          right: -40px;
          font-weight: 600;
          letter-spacing: 0.5px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.2);
        }

        .tagline {
          margin: 4px 0 0 0;
          font-size: 13px;
          color: #718096;
          font-weight: 500;
          letter-spacing: 0.3px;
        }

        .header-ad {
          flex: 1;
          max-width: 728px;
          height: 90px;
          background: linear-gradient(135deg, #f7fafc, #edf2f7);
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto;
        }

        .ad-placeholder {
          color: #a0aec0;
          font-size: 14px;
          font-weight: 500;
        }

        .main-nav {
          background: linear-gradient(135deg, #f8fafc, #f1f5f9);
          border-bottom: 1px solid #e2e8f0;
        }

        .nav-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 24px;
        }

        .nav-links {
          padding: 0;
          margin: 0;
          list-style: none;
          display: flex;
          flex-wrap: wrap;
          font-size: 14px;
          justify-content: center;
          gap: 2px;
        }

        .nav-links li {
          margin: 0;
        }

        .nav-link {
          display: block;
          padding: 14px 18px;
          color: #4a5568;
          text-decoration: none;
          border-radius: 6px;
          margin: 4px 0;
          transition: all 0.2s ease;
          font-weight: 500;
          cursor: pointer;
          white-space: nowrap;
          position: relative;
        }

        .nav-link:hover {
          background: #e2e8f0;
          color: #2d3748;
          transform: translateY(-1px);
        }

        .nav-link.active {
          background: linear-gradient(135deg, #3182ce, #2c5aa0);
          color: white;
          box-shadow: 0 2px 4px rgba(49, 130, 206, 0.3);
        }

        .nav-link.active:hover {
          background: linear-gradient(135deg, #2c5aa0, #2a4a8a);
          transform: translateY(-1px);
        }

        /* Responsive Design */
        @media (max-width: 1024px) {
          .header-container {
            padding: 16px 20px;
            gap: 16px;
          }
          
          .header-ad {
            max-width: 400px;
            height: 70px;
          }
          
          .nav-container {
            padding: 0 20px;
          }
          
          .nav-links {
            gap: 1px;
          }
          
          .nav-link {
            padding: 12px 14px;
            font-size: 13px;
          }
        }

        @media (max-width: 768px) {
          .header-container {
            flex-direction: column;
            gap: 12px;
            padding: 16px;
          }

          .logo-section {
            text-align: center;
            min-width: auto;
          }

          .site-logo {
            font-size: 28px;
          }

          .header-ad {
            width: 100%;
            max-width: 100%;
            height: 60px;
          }

          .nav-container {
            padding: 0 16px;
          }

          .nav-links {
            justify-content: center;
            gap: 4px;
          }

          .nav-link {
            padding: 10px 12px;
            font-size: 12px;
            margin: 2px;
          }
        }

        @media (max-width: 640px) {
          .nav-links {
            flex-wrap: wrap;
            gap: 2px;
          }
          
          .nav-link {
            padding: 8px 10px;
            font-size: 11px;
            flex: 1;
            text-align: center;
            min-width: calc(33.333% - 4px);
          }
        }
      `}</style>
    </header>
  );
}
