import React from 'react';

export default function Footer() {
  return (
    <footer className="ezgif-footer">
      <div className="footer-container">
        <div className="footer-section">
          <h4>EZGIF resources</h4>
          <ul>
            <li><a href="#">Help / FAQ</a></li>
            <li><a href="#">About and contacts</a></li>
            <li><a href="#">Privacy and Cookies</a></li>
            <li><a href="#">Search EZGIF.com</a></li>
          </ul>
        </div>
        
        <div className="footer-section">
          <h4>Video tools</h4>
          <ul>
            <li><a href="#">GIF to MP4 converter</a></li>
            <li><a href="#">Online video cutter</a></li>
            <li><a href="#">Video reverser</a></li>
            <li><a href="#">Video crop tool</a></li>
            <li><a href="#">Video rotator</a></li>
          </ul>
        </div>
        
        <div className="footer-section">
          <h4>Popular converters</h4>
          <ul>
            <li><a href="#">PNG to GIF</a></li>
            <li><a href="#">JPG to GIF</a></li>
            <li><a href="#">WebP to GIF</a></li>
            <li><a href="#">MP4 to GIF</a></li>
            <li><a href="#">APNG to GIF</a></li>
          </ul>
        </div>
        
        <div className="footer-section">
          <h4>Image tools</h4>
          <ul>
            <li><a href="#">Image resizer</a></li>
            <li><a href="#">Image compressor</a></li>
            <li><a href="#">Image rotator</a></li>
            <li><a href="#">Image cropper</a></li>
            <li><a href="#">Color picker</a></li>
          </ul>
        </div>
      </div>
      
      <div className="footer-bottom">
        <p>&copy; 2024 EZGIF Clone - Professional Media Converter</p>
      </div>

      <style>{`
        .ezgif-footer {
          background: #2c3e50;
          color: #ecf0f1;
          margin-top: auto;
        }

        .footer-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 40px 20px;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 30px;
        }

        .footer-section h4 {
          color: #3498db;
          margin: 0 0 15px 0;
          font-size: 14px;
          font-weight: bold;
          text-transform: uppercase;
        }

        .footer-section ul {
          list-style: none;
          margin: 0;
          padding: 0;
        }

        .footer-section li {
          margin-bottom: 8px;
        }

        .footer-section a {
          color: #bdc3c7;
          text-decoration: none;
          font-size: 13px;
          transition: color 0.2s ease;
        }

        .footer-section a:hover {
          color: #3498db;
        }

        .footer-bottom {
          background: #34495e;
          padding: 15px 0;
          text-align: center;
          border-top: 1px solid #4a5f7a;
        }

        .footer-bottom p {
          margin: 0;
          font-size: 12px;
          color: #95a5a6;
        }

        @media (max-width: 768px) {
          .footer-container {
            grid-template-columns: repeat(2, 1fr);
            padding: 30px 20px;
            gap: 20px;
          }
        }

        @media (max-width: 480px) {
          .footer-container {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </footer>
  );
}
