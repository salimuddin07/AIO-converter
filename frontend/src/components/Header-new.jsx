import React from 'react';

export default function Header() {
  return (
    <header className="aio-convert-header">
      <div className="header-container">
        <div className="logo-section">
          <h1 className="site-logo">
            <a href="/">AIO Convert</a>
          </h1>
          <p className="tagline">All-in-One Media Converter</p>
        </div>
        
        <div className="header-ad">
          <div className="ad-placeholder">Advertisement</div>
        </div>
      </div>

      <nav className="main-nav">
        <ul className="nav-links">
          <li><a href="#" className="nav-link gif-maker">GIF maker</a></li>
          <li><a href="#" className="nav-link video-to-gif">Video to GIF</a></li>
          <li><a href="#" className="nav-link resize">Resize</a></li>
          <li><a href="#" className="nav-link rotate">Rotate</a></li>
          <li><a href="#" className="nav-link crop">Crop</a></li>
          <li><a href="#" className="nav-link optimize">Optimize</a></li>
          <li><a href="#" className="nav-link effects">Effects</a></li>
          <li><a href="#" className="nav-link split">Split</a></li>
          <li><a href="#" className="nav-link add-text">Add text</a></li>
          <li><a href="#" className="nav-link webp">WebP</a></li>
          <li><a href="#" className="nav-link apng">APNG</a></li>
          <li><a href="#" className="nav-link avif">AVIF</a></li>
          <li><a href="#" className="nav-link jxl">JXL</a></li>
        </ul>
      </nav>

      <style>{`
        .aio-convert-header {
          background: #fff;
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
        }

        .site-logo a {
          color: #e74c3c;
          text-decoration: none;
          font-family: Arial, sans-serif;
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
        }

        .nav-link:hover,
        .nav-link:focus {
          background: #e9ecef;
          color: #212529;
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
