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
          </ul>
        </div>
      </div>

      {/* Status Bar - Simplified */}
      <div className="status-bar">
        <div className="status-container">
          <div className="performance-stats">
            <span className="stat">🚀 99.9% Uptime</span>
            <span className="stat">⚡ &lt; 2s Processing</span>
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

        /* WAVE ANIMATION FUNCTIONALITY - DETAILED EXPLANATION */
        
        /* 
        HOW THE WAVE ANIMATION WORKS:
        
        1. SVG WAVE STRUCTURE:
           - We create an SVG with a viewBox that defines the coordinate system
           - The viewBox="0 24 150 28" means: start at x=0, y=24, width=150, height=28
           - preserveAspectRatio="none" allows the SVG to stretch to fill container
        
        2. WAVE PATH DEFINITION:
           - The <path> element with id="gentle-wave" defines the wave shape
           - d="M-160 44c30 0 58-18 88-18s 58 18 88 18 58-18 88-18 58 18 88 18 v44h-352z"
           - This uses SVG path commands:
             * M = Move to point (-160, 44)
             * c = Cubic bezier curve (creates smooth wave curves)
             * s = Smooth cubic bezier (continues the wave pattern)
             * v = Vertical line to y=44
             * h = Horizontal line left by 352 units
             * z = Close path
        
        3. ANIMATION TECHNIQUE:
           - We use multiple <use> elements to reference the same wave path
           - Each <use> has different x, y offsets and fill colors
           - This creates layered waves with depth and transparency
        
        4. CSS ANIMATION:
           - The 'move-forever' keyframe moves waves horizontally
           - translate3d() triggers hardware acceleration for smooth performance
           - Different animation-delay and duration for each layer creates parallax effect
        
        5. PARALLAX EFFECT:
           - Front waves move faster, back waves move slower
           - Different opacities create depth perception
           - Staggered timing makes waves appear to flow naturally
        */

        /* Wave Container - positioned absolutely at top of footer */
        .footer-waves {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 80px;
          overflow: hidden;  /* Hides wave parts that extend beyond container */
          line-height: 0;    /* Removes any unwanted spacing */
        }

        /* SVG Waves Element */
        .waves {
          position: relative;
          width: 100%;
          height: 80px;
          margin-bottom: -7px;  /* Eliminates gap between waves and footer content */
        }

        /* Individual Wave Layer Animation */
        .parallax > use {
          animation: move-forever 25s cubic-bezier(.55,.5,.45,.5) infinite;
          /* 
          Animation breakdown:
          - move-forever: keyframe name (defined below)
          - 25s: base duration (each layer will have different duration)
          - cubic-bezier(.55,.5,.45,.5): custom easing for natural wave motion
          - infinite: animation repeats forever
          */
        }

        /* Different Animation Timing for Each Wave Layer (creates parallax effect) */
        .parallax > use:nth-child(1) { 
          animation-delay: -2s;      /* Starts 2s into animation */
          animation-duration: 7s;    /* Fastest wave (front layer) */
        }
        .parallax > use:nth-child(2) { 
          animation-delay: -3s; 
          animation-duration: 10s;   /* Medium speed */
        }
        .parallax > use:nth-child(3) { 
          animation-delay: -4s; 
          animation-duration: 13s;   /* Slower */
        }
        .parallax > use:nth-child(4) { 
          animation-delay: -5s; 
          animation-duration: 20s;   /* Slowest wave (back layer) */
        }

        /* Wave Movement Keyframes */
        @keyframes move-forever {
          0% { 
            transform: translate3d(-90px,0,0); /* Start position: 90px left */
          }
          100% { 
            transform: translate3d(85px,0,0);  /* End position: 85px right */
          }
          /* 
          The wave moves from left to right continuously
          Total movement distance: 175px (-90 to +85)
          translate3d() uses GPU acceleration for smooth animation
          Z-axis (third parameter) is 0 - no 3D transformation needed
          */
        }

        /* 
        WAVE CUSTOMIZATION TIPS:
        
        1. SPEED: Adjust animation-duration values to make waves faster/slower
        2. COLORS: Change the fill colors in the SVG <use> elements
        3. HEIGHT: Modify the height values in .footer-waves and .waves
        4. OPACITY: Adjust the rgba opacity values for more/less transparency
        5. DIRECTION: Change translate3d values to reverse wave direction
        6. WAVE SHAPE: Modify the path 'd' attribute to change wave curves
        
        PERFORMANCE NOTES:
        - Using translate3d() instead of translate() for hardware acceleration
        - will-change property (defined later) tells browser to optimize these elements
        - SVG is vector-based, so it scales perfectly on all screen sizes
        */

        /* Main Container */
        .footer-container {
          position: relative;
          z-index: 2;
          max-width: 1400px;
          margin: 0 auto;
          padding: 80px 40px 60px;
          display: grid;
          grid-template-columns: 2fr 1fr 1fr;
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
          justify-content: center;
          align-items: center;
          flex-wrap: wrap;
          gap: 20px;
        }

        .performance-stats {
          display: flex;
          gap: 30px;
          flex-wrap: wrap;
          justify-content: center;
        }

        .stat {
          color: #64b5f6;
          font-size: 15px;
          font-weight: 600;
          padding: 8px 16px;
          background: rgba(100, 181, 246, 0.1);
          border-radius: 25px;
          border: 1px solid rgba(100, 181, 246, 0.2);
          transition: all 0.3s ease;
        }

        .stat:hover {
          background: rgba(100, 181, 246, 0.2);
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(100, 181, 246, 0.3);
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

          .performance-stats {
            justify-content: center;
            gap: 15px;
          }

          .stat {
            font-size: 13px;
            padding: 6px 12px;
          }
        }

        /* Performance Optimizations */
        .aio-convert-footer * {
          will-change: auto;
        }

        .aio-convert-footer .footer-link,
        .aio-convert-footer .scroll-to-top {
          will-change: transform;
        }
      `}</style>
    </footer>
  );
}
