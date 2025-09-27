import React from 'react';

export default function Footer() {
  return (
    <footer className="aio-convert-footer">
      <div className="footer-container">
        <div className="footer-section">
          <h4>AIO Converter resources</h4>
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
      
      <div className="info-section">
        <div className="company-info">

          <h4>About AIO Converter</h4>

          <p>Professional media conversion platform offering secure, local processing for all your file conversion needs. No uploads required - your files stay private.</p>
        </div>
        
        <div className="support-info">
          <h4>Support</h4>
          <ul>
            <li><a href="#help">Help Center</a></li>
            <li><a href="#faq">FAQ</a></li>
            <li><a href="#contact">Contact Support</a></li>
            <li><a href="#feedback">Send Feedback</a></li>
          </ul>
        </div>
        
        <div className="features-info">
          <h4>Key Features</h4>
          <ul>
            <li>100% Local Processing</li>
            <li>No File Size Limits</li>
            <li>Privacy Focused</li>
            <li>Fast Conversion</li>
          </ul>
        </div>
      </div>
      
      <div className="footer-bottom">

        <p>&copy; 2024 AIO Converter - Professional Media Converter</p>


        <p className="footer-tagline">Empowering creators with secure, local media processing</p>
      </div>

      <style>{`
        .aio-convert-footer {
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

        .info-section {
          background: linear-gradient(135deg, #34495e 0%, #2c3e50 100%);
          border-top: 1px solid #4a6741;
          padding: 35px 20px;
          display: grid;
          grid-template-columns: 2fr 1fr 1fr;
          gap: 30px;
          max-width: 1200px;
          margin: 0 auto;
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.1);
        }

        .company-info,
        .support-info,
        .features-info {
          color: #ecf0f1;
        }

        .info-section h4 {
          color: #64b5f6;
          margin: 0 0 15px 0;
          font-size: 16px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .company-info p {
          color: #bdc3c7;
          line-height: 1.6;
          font-size: 14px;
          margin: 0;
        }

        .support-info ul,
        .features-info ul {
          list-style: none;
          margin: 0;
          padding: 0;
        }

        .support-info li,
        .features-info li {
          margin-bottom: 8px;
          color: #bdc3c7;
          font-size: 14px;
        }

        .support-info a {
          color: #bdc3c7;
          text-decoration: none;
          transition: color 0.3s ease;
        }

        .support-info a:hover {
          color: #64b5f6;
        }

        .footer-bottom {
          background: linear-gradient(135deg, #1a252f 0%, #2c3e50 100%);
          padding: 25px 0;
          text-align: center;
          border-top: 1px solid #4a6741;
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.05);
        }

        .footer-bottom p {
          margin: 5px 0;
          font-size: 14px;
          color: #bdc3c7;
          line-height: 1.5;
        }

        .footer-tagline {
          font-size: 13px !important;
          color: #95a5a6 !important;
          font-style: italic;
          margin-top: 8px !important;
        }

        @media (max-width: 768px) {
          .footer-container {
            grid-template-columns: repeat(2, 1fr);
            padding: 30px 20px;
            gap: 20px;
          }

          .info-section {
            grid-template-columns: 1fr;
            gap: 25px;
            padding: 25px 15px;
          }

          .company-info,
          .support-info,
          .features-info {
            text-align: center;
          }
        }

        @media (max-width: 480px) {
          .footer-container {
            grid-template-columns: 1fr;
            padding: 20px 15px;
          }

          .info-section {
            padding: 20px 10px;
            gap: 20px;
          }

          .info-section h4 {
            font-size: 14px;
          }

          .company-info p,
          .support-info li,
          .features-info li {
            font-size: 13px;
          }
        }
      `}</style>
    </footer>
  );
}
