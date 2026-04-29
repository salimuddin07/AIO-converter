import React, { useState, useEffect } from 'react';

const SOCIAL_LINKS = [
  { name: 'GitHub',    url: 'https://github.com/salimuddin07',                  d: 'M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56v-1.97c-3.2.7-3.87-1.54-3.87-1.54-.52-1.32-1.27-1.67-1.27-1.67-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.75 2.69 1.25 3.34.95.1-.74.4-1.25.72-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.18-3.1-.12-.29-.51-1.46.11-3.05 0 0 .96-.31 3.16 1.18.92-.26 1.9-.39 2.88-.39.98 0 1.96.13 2.88.39 2.2-1.49 3.16-1.18 3.16-1.18.62 1.59.23 2.76.11 3.05.74.81 1.18 1.84 1.18 3.1 0 4.42-2.69 5.39-5.25 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.68.8.56C20.71 21.39 24 17.08 24 12 24 5.65 18.85.5 12 .5z' },
  { name: 'LinkedIn',  url: 'https://www.linkedin.com/in/salimuddin07/',         d: 'M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94v5.67H9.35V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.38-1.85 3.61 0 4.28 2.38 4.28 5.47v6.27zM5.34 7.43a2.07 2.07 0 110-4.13 2.07 2.07 0 010 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0z' },
  { name: 'X',         url: 'https://x.com/salimuddin07_',                       d: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z' },
  { name: 'Instagram', url: 'https://www.instagram.com/salimuddin07_/',          d: 'M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.81.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.81-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.81-.25-2.23-.41a3.72 3.72 0 01-1.38-.9 3.72 3.72 0 01-.9-1.38c-.16-.42-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.81.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16zM12 0C8.74 0 8.33.01 7.05.07 5.78.13 4.9.33 4.14.63a5.88 5.88 0 00-2.13 1.38A5.88 5.88 0 00.63 4.14C.33 4.9.13 5.78.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.06 1.27.26 2.15.56 2.91a5.88 5.88 0 001.38 2.13 5.88 5.88 0 002.13 1.38c.76.3 1.64.5 2.91.56C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c1.27-.06 2.15-.26 2.91-.56a5.88 5.88 0 002.13-1.38 5.88 5.88 0 001.38-2.13c.3-.76.5-1.64.56-2.91.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.27-.26-2.15-.56-2.91a5.88 5.88 0 00-1.38-2.13A5.88 5.88 0 0019.86.63C19.1.33 18.22.13 16.95.07 15.67.01 15.26 0 12 0zm0 5.84a6.16 6.16 0 100 12.32 6.16 6.16 0 000-12.32zm0 10.16a4 4 0 110-8 4 4 0 010 8zm6.4-11.84a1.44 1.44 0 100 2.88 1.44 1.44 0 000-2.88z' },
  { name: 'Facebook',  url: 'https://www.facebook.com/salimuddin007/',           d: 'M22.68 0H1.32C.59 0 0 .59 0 1.32v21.36C0 23.41.59 24 1.32 24h11.5v-9.29h-3.13v-3.62h3.13V8.41c0-3.1 1.89-4.79 4.66-4.79 1.32 0 2.46.1 2.79.14v3.24h-1.91c-1.5 0-1.79.71-1.79 1.76v2.31h3.59l-.47 3.62h-3.12V24h6.12c.73 0 1.32-.59 1.32-1.32V1.32C24 .59 23.41 0 22.68 0z' },
  { name: 'Pinterest', url: 'https://in.pinterest.com/salimuddin007/',           d: 'M12 0C5.37 0 0 5.37 0 12c0 5.08 3.16 9.42 7.62 11.16-.1-.95-.2-2.4.04-3.43.22-.94 1.4-5.96 1.4-5.96s-.36-.72-.36-1.78c0-1.67.97-2.92 2.18-2.92 1.03 0 1.52.77 1.52 1.7 0 1.03-.66 2.58-1 4.01-.28 1.2.6 2.18 1.79 2.18 2.15 0 3.8-2.27 3.8-5.55 0-2.9-2.08-4.93-5.06-4.93-3.45 0-5.47 2.59-5.47 5.26 0 1.04.4 2.16.9 2.77.1.12.11.22.08.34l-.34 1.36c-.05.22-.18.27-.41.16-1.5-.7-2.43-2.88-2.43-4.64 0-3.78 2.74-7.25 7.92-7.25 4.16 0 7.4 2.96 7.4 6.93 0 4.13-2.61 7.46-6.23 7.46-1.22 0-2.36-.63-2.75-1.38l-.75 2.86c-.27 1.04-1 2.34-1.49 3.13C9.57 23.81 10.77 24 12 24c6.63 0 12-5.37 12-12S18.63 0 12 0z' },
  { name: 'Medium',    url: 'https://medium.com/@salimuddin07',                  d: 'M13.54 12c0 3.54-2.84 6.42-6.34 6.42S.86 15.54.86 12 3.7 5.58 7.2 5.58s6.34 2.88 6.34 6.42zm6.96 0c0 3.34-1.42 6.04-3.17 6.04-1.75 0-3.17-2.7-3.17-6.04s1.42-6.04 3.17-6.04c1.75 0 3.17 2.7 3.17 6.04zm3.5 0c0 2.99-.5 5.41-1.12 5.41-.62 0-1.12-2.42-1.12-5.41s.5-5.41 1.12-5.41c.62 0 1.12 2.42 1.12 5.41z' },
  { name: 'Dev.to',    url: 'https://dev.to/salimuddin07',                       d: 'M7.42 10.05c-.18-.16-.46-.23-.84-.23H6l.02 2.44.04 2.45.4-.01c.56 0 .83-.1 1.02-.35.16-.22.17-.32.18-2.05 0-1.95-.05-2.08-.24-2.25zM0 4.94v14.12h24V4.94H0zm8.56 9.66c-.46.45-1.27.7-1.93.7-.46 0-1.85-.04-2.34-.04l-.04-7.93h2.55c.95 0 1.43.13 1.91.5.65.5.95 1.32.95 2.92 0 1.62-.36 2.71-1.1 3.85zm5.42-5.71h-2.5l-.01 1.83 1.52.04-.01 1.34-1.51-.01v1.95h2.55v1.34l-1.6.04c-.88 0-1.65-.04-1.7-.07-.07-.05-.1-1.84-.1-3.92l.01-3.83h3.34v1.29zm5.4 5.86c-.6 1.4-1.28 1.43-1.93.05-.27-.59-1.99-7.21-1.99-7.21h1.69l.55 2.18c.31 1.21.62 2.32.66 2.39.05.07.34-.85.65-2.07.31-1.22.59-2.25.62-2.31.04-.07.43-.11.91-.1l.84.04-.94 3.46c-.51 1.91-1 3.36-1.06 3.57z' },
  { name: 'Reddit',    url: 'https://www.reddit.com/user/salimuddin07/',         d: 'M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 01-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 01.042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 014.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 01.14-.197.35.35 0 01.238-.042l2.906.617a1.214 1.214 0 011.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 00-.231.094.33.33 0 000 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 00.029-.463.33.33 0 00-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 00-.232-.095z' },
];

function SocialIcon({ name, url, d }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="social-icon"
      aria-label={name}
      title={name}
    >
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
        <path fill="currentColor" d={d} />
      </svg>
    </a>
  );
}

export default function Footer() {
  return (
    <footer className="app-footer">
      <div className="footer-inner">
        <div className="footer-row footer-top">
          <div className="footer-brand">
            <div className="footer-title">AIO Converter</div>
            <p className="footer-desc">
              All-in-one media converter. Runs locally on your computer — your files never leave your device.
            </p>
          </div>

          <nav className="footer-socials" aria-label="Social media">
            {SOCIAL_LINKS.map((s) => (
              <SocialIcon key={s.name} {...s} />
            ))}
          </nav>
        </div>

        <div className="footer-row footer-bottom">
          <p className="footer-copy">
            © {new Date().getFullYear()} AIO Converter · Built by{' '}
            <a href="https://github.com/salimuddin07" target="_blank" rel="noopener noreferrer">
              Salimuddin
            </a>
          </p>
          <p className="footer-tags">100% offline · No tracking · No accounts</p>
        </div>
      </div>

      <style>{`
        .app-footer {
          background: #ffffff;
          border-top: 1px solid #e5e7eb;
          color: #475569;
          margin-top: auto;
        }
        .footer-inner {
          max-width: 1200px;
          margin: 0 auto;
          padding: 28px 24px 20px;
        }
        .footer-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
          flex-wrap: wrap;
        }
        .footer-top {
          padding-bottom: 18px;
          border-bottom: 1px solid #f1f5f9;
        }
        .footer-brand {
          max-width: 520px;
        }
        .footer-title {
          font-size: 1rem;
          font-weight: 600;
          color: #0f172a;
          margin-bottom: 4px;
          letter-spacing: -0.01em;
        }
        .footer-desc {
          margin: 0;
          font-size: 0.875rem;
          color: #64748b;
          line-height: 1.5;
        }
        .footer-socials {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }
        .social-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 34px;
          height: 34px;
          border-radius: 6px;
          color: #64748b;
          background: #ffffff;
          border: 1px solid #e5e7eb;
          transition: color 0.15s ease, border-color 0.15s ease, background 0.15s ease;
        }
        .social-icon:hover,
        .social-icon:focus {
          color: #2563eb;
          border-color: #2563eb;
          background: #eff6ff;
        }
        .footer-bottom {
          padding-top: 14px;
          font-size: 0.8rem;
        }
        .footer-copy {
          margin: 0;
          color: #64748b;
        }
        .footer-copy a {
          color: #2563eb;
          text-decoration: none;
          font-weight: 500;
        }
        .footer-copy a:hover {
          text-decoration: underline;
        }
        .footer-tags {
          margin: 0;
          color: #94a3b8;
        }
        @media (max-width: 640px) {
          .footer-inner { padding: 22px 16px 16px; }
          .footer-row { justify-content: center; text-align: center; }
          .footer-brand { max-width: 100%; }
        }
      `}</style>
    </footer>
  );
}

// __NEW_FOOTER_PLACEHOLDER__
// eslint-disable-next-line no-unused-vars
function __obsoleteOldFooter() {
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

      <style>{`
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