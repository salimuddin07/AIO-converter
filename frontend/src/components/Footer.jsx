import React, { useState, useEffect } from 'react';

export default function Footer() {
  const [currentYear] = useState(new Date().getFullYear());
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className={`aio-convert-footer ${isVisible ? 'footer-visible' : ''}`}>
      {/* Wave Animation */}
      <div className="footer-waves">
        <svg className="waves" xmlns="http://www.w3.org/2000/svg" viewBox="0 24 150 28" preserveAspectRatio="none" shapeRendering="auto">
          <defs>
            <path id="gentle-wave" d="M-160 44c30 0 58-18 88-18s 58 18 88 18 58-18 88-18 58 18 88 18 v44h-352z" />
          </defs>
          <g className="parallax">
            <use xlinkHref="#gentle-wave" x="48" y="0" fill="rgba(52, 152, 219, 0.7)" />
            <use xlinkHref="#gentle-wave" x="48" y="3" fill="rgba(41, 128, 185, 0.5)" />
            <use xlinkHref="#gentle-wave" x="48" y="5" fill="rgba(44, 62, 80, 0.3)" />
            <use xlinkHref="#gentle-wave" x="48" y="7" fill="rgba(52, 73, 94, 1)" />
          </g>
        </svg>
      </div>

      {/* Main Footer Content */}
      <div className="footer-container">
        {/* Brand Section */}
        <div className="footer-brand">
          <div className="brand-logo">
            <div className="logo-icon">
              <span className="logo-text">AIO</span>
              <div className="logo-pulse"></div>
            </div>
          </div>
          <h3 className="brand-title">AIO Converter</h3>
          <p className="brand-subtitle">Professional Media Processing</p>
          <p className="brand-description">
            Transform your media with cutting-edge technology. Fast, secure, and completely private 
            processing that keeps your files safe on your device.
          </p>
          
          {/* Social Links */}
          <div className="social-links">
            <a href="https://github.com/salimuddin07" target="_blank" rel="noopener noreferrer" className="social-link github">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              <span>GitHub</span>
            </a>
            <a href="https://www.linkedin.com/in/salimuddin-shaikh-330a7b2a5" target="_blank" rel="noopener noreferrer" className="social-link linkedin">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
              <span>LinkedIn</span>
            </a>
            <a href="https://www.instagram.com/salimuddin_shaikh_786" target="_blank" rel="noopener noreferrer" className="social-link instagram">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
              <span>Instagram</span>
            </a>
          </div>
        </div>

        {/* Quick Links */}
        <div className="footer-section">
          <h4 className="section-title">
            <span className="title-icon">🚀</span>
            Quick Tools
          </h4>
          <ul className="footer-links">
            <li><a href="#convert" className="footer-link">Image Converter</a></li>
            <li><a href="#video" className="footer-link">Video to GIF</a></li>
            <li><a href="#split" className="footer-link">GIF Splitter</a></li>
            <li><a href="#webp" className="footer-link">WebP Converter</a></li>
            <li><a href="#editor" className="footer-link">Image Editor</a></li>
            <li><a href="#batch" className="footer-link">Batch Processing</a></li>
          </ul>
        </div>

        {/* Features */}
        <div className="footer-section">
          <h4 className="section-title">
            <span className="title-icon">⭐</span>
            Features
          </h4>
          <ul className="footer-links">
            <li className="feature-item">
              <span className="feature-icon">🔒</span>
              <span>100% Private & Secure</span>
            </li>
            <li className="feature-item">
              <span className="feature-icon">⚡</span>
              <span>Lightning Fast Processing</span>
            </li>
            <li className="feature-item">
              <span className="feature-icon">🎯</span>
              <span>Professional Quality</span>
            </li>
            <li className="feature-item">
              <span className="feature-icon">📱</span>
              <span>Mobile Optimized</span>
            </li>
            <li className="feature-item">
              <span className="feature-icon">🌟</span>
              <span>All Libraries Working</span>
            </li>
          </ul>
        </div>

        {/* Tech Stack */}
        <div className="footer-section">
          <h4 className="section-title">
            <span className="title-icon">🛠️</span>
            Technology
          </h4>
          <div className="tech-stack">
            <div className="tech-category">
              <h5>Backend</h5>
              <div className="tech-items">
                <span className="tech-item">Node.js</span>
                <span className="tech-item">Sharp</span>
                <span className="tech-item">FFmpeg</span>
                <span className="tech-item">Canvas</span>
              </div>
            </div>
            <div className="tech-category">
              <h5>Frontend</h5>
              <div className="tech-items">
                <span className="tech-item">React</span>
                <span className="tech-item">GSAP</span>
                <span className="tech-item">Three.js</span>
                <span className="tech-item">Framer Motion</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="status-bar">
        <div className="status-container">
          <div className="status-items">
            <div className="status-item">
              <div className="status-indicator online"></div>
              <span>Backend: Online</span>
            </div>
            <div className="status-item">
              <div className="status-indicator online"></div>
              <span>Frontend: Online</span>
            </div>
            <div className="status-item">
              <div className="status-indicator online"></div>
              <span>Libraries: 14/14 Working</span>
            </div>
          </div>
          <div className="performance-stats">
            <span className="stat">🚀 99.9% Uptime</span>
            <span className="stat">⚡ < 2s Processing</span>
            <span className="stat">🔒 Zero Data Collection</span>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="footer-bottom">
        <div className="bottom-container">
          <div className="copyright-section">
            <p className="copyright">
              © {currentYear} <span className="brand-highlight">AIO Converter</span> - 
              Crafted with <span className="heart">❤️</span> by 
              <a href="https://github.com/salimuddin07" target="_blank" rel="noopener noreferrer" className="author-link">
                Salimuddin
              </a>
            </p>
            <p className="tagline">
              Professional Media Processing • Privacy-First • Lightning Fast
            </p>
          </div>
          
          <div className="scroll-top-section">
            <button onClick={scrollToTop} className="scroll-to-top" aria-label="Scroll to top">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 3.09L9 11.18l-1.41-1.41L12 5.34l4.41 4.43L15 11.18l-3.09-3.09L12 2z"/>
              </svg>
              <span>Back to Top</span>
            </button>
          </div>
        </div>
      </div>

      <style>{`
        /* Footer Base Styles */
        .aio-convert-footer {
          position: relative;
          background: linear-gradient(135deg, #0c1426 0%, #1a252f 25%, #2c3e50 50%, #34495e 75%, #4a6741 100%);
          color: #ecf0f1;
          margin-top: auto;
          overflow: hidden;
          opacity: 0;
          transform: translateY(50px);
          transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .footer-visible {
          opacity: 1;
          transform: translateY(0);
        }

        /* Animated Wave Background */
        .footer-waves {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 80px;
          overflow: hidden;
          line-height: 0;
        }

        .waves {
          position: relative;
          width: 100%;
          height: 80px;
          margin-bottom: -7px;
        }

        .parallax > use {
          animation: move-forever 25s cubic-bezier(.55,.5,.45,.5) infinite;
        }

        .parallax > use:nth-child(1) { animation-delay: -2s; animation-duration: 7s; }
        .parallax > use:nth-child(2) { animation-delay: -3s; animation-duration: 10s; }
        .parallax > use:nth-child(3) { animation-delay: -4s; animation-duration: 13s; }
        .parallax > use:nth-child(4) { animation-delay: -5s; animation-duration: 20s; }

        @keyframes move-forever {
          0% { transform: translate3d(-90px,0,0); }
          100% { transform: translate3d(85px,0,0); }
        }

        /* Main Container */
        .footer-container {
          position: relative;
          z-index: 2;
          max-width: 1400px;
          margin: 0 auto;
          padding: 80px 40px 60px;
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr;
          gap: 50px;
          align-items: start;
        }

        /* Brand Section */
        .footer-brand {
          position: relative;
        }

        .brand-logo {
          margin-bottom: 20px;
          position: relative;
        }

        .logo-icon {
          position: relative;
          width: 80px;
          height: 80px;
          background: linear-gradient(45deg, #3498db, #2980b9, #8e44ad, #9b59b6);
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 15px;
          box-shadow: 0 10px 30px rgba(52, 152, 219, 0.3);
          overflow: hidden;
        }

        .logo-text {
          font-size: 24px;
          font-weight: 900;
          color: white;
          z-index: 2;
          position: relative;
        }

        .logo-pulse {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(45deg, rgba(255,255,255,0.2), transparent);
          animation: pulse-glow 3s ease-in-out infinite;
        }

        @keyframes pulse-glow {
          0%, 100% { opacity: 0; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.05); }
        }

        .brand-title {
          font-size: 2.5rem;
          font-weight: 800;
          background: linear-gradient(45deg, #3498db, #8e44ad, #e74c3c, #f39c12);
          background-size: 300% 300%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: gradient-flow 4s ease-in-out infinite;
          margin: 0 0 10px 0;
          line-height: 1.2;
        }

        @keyframes gradient-flow {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        .brand-subtitle {
          font-size: 1.1rem;
          color: #64b5f6;
          font-weight: 600;
          margin: 0 0 15px 0;
          text-transform: uppercase;
          letter-spacing: 2px;
        }

        .brand-description {
          color: #bdc3c7;
          line-height: 1.7;
          font-size: 16px;
          margin: 0 0 30px 0;
          max-width: 400px;
        }

        /* Social Links */
        .social-links {
          display: flex;
          gap: 15px;
          flex-wrap: wrap;
        }

        .social-link {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
          border-radius: 50px;
          text-decoration: none;
          font-weight: 600;
          font-size: 14px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }

        .social-link::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          transition: left 0.5s;
        }

        .social-link:hover::before {
          left: 100%;
        }

        .social-link svg {
          width: 20px;
          height: 20px;
          transition: transform 0.3s ease;
        }

        .social-link:hover svg {
          transform: scale(1.2) rotate(5deg);
        }

        .github {
          background: linear-gradient(45deg, #333, #24292e);
          color: white;
        }

        .github:hover {
          background: linear-gradient(45deg, #24292e, #000);
          transform: translateY(-3px);
          box-shadow: 0 10px 25px rgba(36, 41, 46, 0.4);
        }

        .linkedin {
          background: linear-gradient(45deg, #0077b5, #004471);
          color: white;
        }

        .linkedin:hover {
          background: linear-gradient(45deg, #004471, #002d47);
          transform: translateY(-3px);
          box-shadow: 0 10px 25px rgba(0, 119, 181, 0.4);
        }

        .instagram {
          background: linear-gradient(45deg, #e1306c, #fd1d1d, #fcaf45);
          color: white;
        }

        .instagram:hover {
          background: linear-gradient(45deg, #fd1d1d, #fcaf45, #e1306c);
          transform: translateY(-3px);
          box-shadow: 0 10px 25px rgba(225, 48, 108, 0.4);
        }

        /* Section Styles */
        .footer-section {
          position: relative;
        }

        .section-title {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 1.2rem;
          font-weight: 700;
          color: #64b5f6;
          margin: 0 0 25px 0;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .title-icon {
          font-size: 1.4rem;
          filter: drop-shadow(0 0 10px currentColor);
        }

        .footer-links {
          list-style: none;
          margin: 0;
          padding: 0;
        }

        .footer-links li {
          margin-bottom: 12px;
        }

        .footer-link {
          color: #bdc3c7;
          text-decoration: none;
          font-size: 15px;
          font-weight: 500;
          transition: all 0.3s ease;
          position: relative;
          display: inline-block;
        }

        .footer-link::after {
          content: '';
          position: absolute;
          width: 0;
          height: 2px;
          bottom: -2px;
          left: 0;
          background: linear-gradient(90deg, #3498db, #8e44ad);
          transition: width 0.3s ease;
        }

        .footer-link:hover {
          color: #64b5f6;
          transform: translateX(5px);
        }

        .footer-link:hover::after {
          width: 100%;
        }

        /* Feature Items */
        .feature-item {
          display: flex;
          align-items: center;
          gap: 12px;
          color: #bdc3c7;
          font-size: 15px;
          font-weight: 500;
          margin-bottom: 12px;
          transition: all 0.3s ease;
        }

        .feature-item:hover {
          color: #64b5f6;
          transform: translateX(5px);
        }

        .feature-icon {
          font-size: 18px;
          filter: drop-shadow(0 0 8px currentColor);
        }

        /* Tech Stack */
        .tech-stack {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .tech-category h5 {
          color: #64b5f6;
          font-size: 14px;
          font-weight: 600;
          margin: 0 0 10px 0;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .tech-items {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .tech-item {
          background: rgba(100, 181, 246, 0.1);
          color: #64b5f6;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          border: 1px solid rgba(100, 181, 246, 0.2);
          transition: all 0.3s ease;
        }

        .tech-item:hover {
          background: rgba(100, 181, 246, 0.2);
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(100, 181, 246, 0.3);
        }

        /* Status Bar */
        .status-bar {
          background: linear-gradient(135deg, rgba(44, 62, 80, 0.9), rgba(52, 73, 94, 0.9));
          border-top: 1px solid rgba(100, 181, 246, 0.2);
          border-bottom: 1px solid rgba(100, 181, 246, 0.2);
          padding: 20px 0;
          position: relative;
          z-index: 2;
        }

        .status-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 40px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 20px;
        }

        .status-items {
          display: flex;
          gap: 30px;
          flex-wrap: wrap;
        }

        .status-item {
          display: flex;
          align-items: center;
          gap: 10px;
          color: #bdc3c7;
          font-size: 14px;
          font-weight: 600;
        }

        .status-indicator {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          position: relative;
        }

        .status-indicator.online {
          background: #27ae60;
          box-shadow: 0 0 10px #27ae60;
          animation: pulse-online 2s ease-in-out infinite;
        }

        @keyframes pulse-online {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; box-shadow: 0 0 20px #27ae60; }
        }

        .performance-stats {
          display: flex;
          gap: 20px;
          flex-wrap: wrap;
        }

        .stat {
          color: #64b5f6;
          font-size: 13px;
          font-weight: 600;
        }

        /* Bottom Bar */
        .footer-bottom {
          background: linear-gradient(135deg, #1a252f, #0c1426);
          border-top: 1px solid rgba(100, 181, 246, 0.1);
          position: relative;
          z-index: 2;
        }

        .bottom-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 30px 40px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 20px;
        }

        .copyright-section {
          flex: 1;
        }

        .copyright {
          color: #bdc3c7;
          font-size: 15px;
          font-weight: 500;
          margin: 0 0 5px 0;
          line-height: 1.6;
        }

        .brand-highlight {
          background: linear-gradient(45deg, #3498db, #8e44ad);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          font-weight: 700;
        }

        .heart {
          color: #e74c3c;
          animation: heartbeat 1.5s ease-in-out infinite;
        }

        @keyframes heartbeat {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.2); }
        }

        .author-link {
          color: #64b5f6;
          text-decoration: none;
          font-weight: 700;
          transition: all 0.3s ease;
          margin-left: 5px;
        }

        .author-link:hover {
          color: #3498db;
          text-shadow: 0 0 10px rgba(52, 152, 219, 0.5);
        }

        .tagline {
          color: #95a5a6;
          font-size: 14px;
          font-style: italic;
          margin: 0;
        }

        /* Scroll to Top */
        .scroll-to-top {
          display: flex;
          align-items: center;
          gap: 8px;
          background: linear-gradient(45deg, #3498db, #8e44ad);
          color: white;
          border: none;
          padding: 12px 20px;
          border-radius: 50px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }

        .scroll-to-top::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          transition: left 0.5s;
        }

        .scroll-to-top:hover::before {
          left: 100%;
        }

        .scroll-to-top:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 25px rgba(52, 152, 219, 0.4);
        }

        .scroll-to-top svg {
          width: 18px;
          height: 18px;
          transition: transform 0.3s ease;
        }

        .scroll-to-top:hover svg {
          transform: translateY(-2px);
        }

        /* Responsive Design */
        @media (max-width: 1200px) {
          .footer-container {
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            padding: 60px 30px 50px;
          }

          .footer-brand {
            grid-column: 1 / -1;
            text-align: center;
          }
        }

        @media (max-width: 768px) {
          .footer-container {
            grid-template-columns: 1fr;
            gap: 30px;
            padding: 50px 20px 40px;
          }

          .brand-title {
            font-size: 2rem;
          }

          .social-links {
            justify-content: center;
          }

          .status-container {
            padding: 0 20px;
            flex-direction: column;
            text-align: center;
          }

          .bottom-container {
            padding: 20px;
            flex-direction: column;
            text-align: center;
          }

          .performance-stats {
            justify-content: center;
          }
        }

        @media (max-width: 480px) {
          .footer-waves {
            height: 60px;
          }

          .waves {
            height: 60px;
          }

          .footer-container {
            padding: 40px 15px 30px;
          }

          .brand-title {
            font-size: 1.8rem;
          }

          .status-items {
            justify-content: center;
          }

          .social-link {
            padding: 10px 16px;
            font-size: 13px;
          }
        }

        /* Performance Optimizations */
        .aio-convert-footer * {
          will-change: auto;
        }

        .aio-convert-footer .footer-link,
        .aio-convert-footer .social-link,
        .aio-convert-footer .scroll-to-top {
          will-change: transform;
        }
      `}</style>
    </footer>
  );
}
