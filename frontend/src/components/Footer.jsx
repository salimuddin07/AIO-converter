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
    <footer className={`modern-footer ${isVisible ? 'visible' : ''}`}>
      <div className="footer-bg"></div>
      
      <div className="footer-content">
        <div className="brand-section">
          <div className="logo">AIO</div>
          <h3>AIO Converter</h3>
          <p className="tagline">✨ Transform Media Like Magic ✨</p>
          <p className="description">
            AI-powered conversion engine that delivers lightning-fast results 
            with military-grade security. Built for creators who demand perfection.
          </p>
          
          <div className="social-links">
            <a href="https://github.com/salimuddin07" target="_blank" rel="noopener noreferrer" className="social github">
              <span>⭐</span> GitHub
            </a>
            <a href="https://t.me/salimuddin07" target="_blank" rel="noopener noreferrer" className="social telegram">
              <span>💬</span> Telegram
            </a>
          </div>
        </div>

        <div className="footer-col">
          <h4>🚀 Hot Tools</h4>
          <ul>
            <li><a href="#convert">Image Magic</a></li>
            <li><a href="#video">Video to GIF</a></li>
            <li><a href="#split">GIF Splitter</a></li>
            <li><a href="#webp">WebP Wizard</a></li>
            <li><a href="#editor">Photo Editor</a></li>
            <li><a href="#batch">Batch Tools</a></li>
          </ul>
        </div>

        <div className="footer-col">
          <h4>⭐ Why Choose Us?</h4>
          <ul className="features">
            <li><span>🛡️</span> Bank-Level Security</li>
            <li><span>⚡</span> Lightning Fast AI</li>
            <li><span>🎯</span> Perfect Quality</li>
            <li><span>🌍</span> Global CDN</li>
            <li><span>💎</span> Premium Experience</li>
          </ul>
        </div>

        <div className="footer-col">
          <h4>💡 Get Support</h4>
          <ul>
            <li><a href="https://t.me/salimuddin07" target="_blank" rel="noopener noreferrer">🚀 Instant Chat</a></li>
            <li><a href="/#buy-me-coffee">☕ Support Us</a></li>
            <li><a href="https://github.com/salimuddin07" target="_blank" rel="noopener noreferrer">🐛 Report Issues</a></li>
          </ul>
        </div>
      </div>

      <div className="stats">
        <div className="stat">
          <div className="num">1M+</div>
          <div className="label">Files Converted</div>
        </div>
        <div className="stat">
          <div className="num">99.9%</div>
          <div className="label">Uptime</div>
        </div>
        <div className="stat">
          <div className="num">2s</div>
          <div className="label">Avg Speed</div>
        </div>
        <div className="stat">
          <div className="num">100%</div>
          <div className="label">Private</div>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="copyright">
          <p>
            © {currentYear} <span className="brand">AIO Converter</span> • 
            Crafted with <span className="heart">💖</span> by 
            <a href="https://github.com/salimuddin07" target="_blank" rel="noopener noreferrer">Salimuddin</a>
          </p>
          <p className="motto">🚀 AI-Powered • 🔒 Secure • ⚡ Lightning Fast</p>
        </div>
        
        <button onClick={scrollToTop} className="top-btn">
          <span>↑</span> Back to Top
        </button>
      </div>

      <style jsx>{`
        .modern-footer {
          position: relative;
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
          color: white;
          margin-top: auto;
          overflow: hidden;
          opacity: 0;
          transform: translateY(20px);
          transition: all 0.6s ease;
        }

        .visible {
          opacity: 1;
          transform: translateY(0);
        }

        .footer-bg {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.15), transparent 50%),
                      radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.1), transparent 50%);
        }

        .footer-content {
          position: relative;
          z-index: 2;
          max-width: 1200px;
          margin: 0 auto;
          padding: 60px 40px;
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr;
          gap: 40px;
        }

        .brand-section {
          position: relative;
        }

        .logo {
          width: 70px;
          height: 70px;
          background: linear-gradient(45deg, #667eea, #764ba2);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.8rem;
          font-weight: 900;
          color: white;
          box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
          margin-bottom: 16px;
        }

        .brand-section h3 {
          font-size: 2.2rem;
          font-weight: 800;
          margin: 0 0 8px 0;
          background: linear-gradient(45deg, #667eea, #764ba2);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .tagline {
          font-size: 1rem;
          color: #e2e8f0;
          margin: 0 0 16px 0;
          font-weight: 500;
        }

        .description {
          font-size: 0.95rem;
          line-height: 1.6;
          color: #cbd5e1;
          margin: 0 0 24px 0;
          max-width: 350px;
        }

        .social-links {
          display: flex;
          gap: 12px;
        }

        .social {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 18px;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border-radius: 25px;
          text-decoration: none;
          color: white;
          font-weight: 500;
          transition: all 0.3s ease;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .social:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
        }

        .github:hover {
          background: rgba(88, 166, 255, 0.2);
          border-color: rgba(88, 166, 255, 0.3);
        }

        .telegram:hover {
          background: rgba(0, 136, 204, 0.2);
          border-color: rgba(0, 136, 204, 0.3);
        }

        .footer-col h4 {
          font-size: 1.1rem;
          font-weight: 700;
          margin: 0 0 20px 0;
          color: #e2e8f0;
        }

        .footer-col ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .footer-col li {
          margin-bottom: 10px;
        }

        .footer-col a {
          color: #cbd5e1;
          text-decoration: none;
          font-weight: 500;
          transition: all 0.3s ease;
          display: inline-block;
        }

        .footer-col a:hover {
          color: #e2e8f0;
          transform: translateX(4px);
        }

        .features li {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #cbd5e1;
          font-weight: 500;
          font-size: 0.9rem;
          margin-bottom: 10px;
        }

        .features span {
          font-size: 1rem;
        }

        .stats {
          background: rgba(0, 0, 0, 0.2);
          backdrop-filter: blur(10px);
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          padding: 30px 40px;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 30px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .stat {
          text-align: center;
        }

        .num {
          font-size: 2rem;
          font-weight: 900;
          background: linear-gradient(45deg, #667eea, #764ba2);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 4px;
        }

        .label {
          font-size: 0.85rem;
          color: #cbd5e1;
          font-weight: 500;
        }

        .footer-bottom {
          background: rgba(0, 0, 0, 0.3);
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          padding: 25px 40px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          max-width: 1200px;
          margin: 0 auto;
        }

        .copyright p {
          font-size: 0.85rem;
          color: #cbd5e1;
          margin: 0 0 4px 0;
        }

        .brand {
          background: linear-gradient(45deg, #667eea, #764ba2);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          font-weight: 700;
        }

        .heart {
          color: #ef4444;
          animation: heartbeat 2s ease-in-out infinite;
        }

        @keyframes heartbeat {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }

        .copyright a {
          color: #667eea;
          text-decoration: none;
          font-weight: 600;
          transition: color 0.3s ease;
        }

        .copyright a:hover {
          color: #764ba2;
        }

        .motto {
          font-size: 0.8rem;
          color: #94a3b8;
          margin: 0;
        }

        .top-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 10px 20px;
          background: linear-gradient(45deg, #667eea, #764ba2);
          color: white;
          border: none;
          border-radius: 25px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
        }

        .top-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
        }

        @media (max-width: 1024px) {
          .footer-content {
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            padding: 50px 30px;
          }

          .brand-section {
            grid-column: 1 / -1;
            text-align: center;
            margin-bottom: 20px;
          }

          .stats {
            grid-template-columns: repeat(2, 1fr);
            gap: 25px;
            padding: 25px 30px;
          }
        }

        @media (max-width: 768px) {
          .footer-content {
            grid-template-columns: 1fr;
            gap: 25px;
            padding: 40px 20px;
          }

          .brand-section h3 {
            font-size: 1.8rem;
          }

          .stats {
            grid-template-columns: 1fr;
            gap: 20px;
            padding: 20px;
          }

          .footer-bottom {
            flex-direction: column;
            gap: 15px;
            text-align: center;
            padding: 20px;
          }

          .social-links {
            justify-content: center;
          }
        }

        @media (max-width: 480px) {
          .footer-content {
            padding: 30px 15px;
          }

          .brand-section h3 {
            font-size: 1.6rem;
          }

          .logo {
            width: 60px;
            height: 60px;
            font-size: 1.5rem;
          }

          .num {
            font-size: 1.6rem;
          }

          .social {
            padding: 8px 14px;
            font-size: 0.9rem;
          }
        }
      `}</style>
    </footer>
  );
}