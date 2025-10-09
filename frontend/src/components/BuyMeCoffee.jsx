import React, { useEffect, useRef, useState } from 'react';

const BuyMeCoffee = () => {
  const buttonRef = useRef(null);

  const handleTelegramContact = () => {
    window.open('https://t.me/salimuddin07', '_blank');
  };

  useEffect(() => {
    // Create the exact script as provided
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = 'https://cdnjs.buymeacoffee.com/1.0.0/button.prod.min.js';
    script.setAttribute('data-name', 'bmc-button');
    script.setAttribute('data-slug', 'salimuddin07');
    script.setAttribute('data-color', '#FFDD00');
    script.setAttribute('data-emoji', '');
    script.setAttribute('data-font', 'Cookie');
    script.setAttribute('data-text', 'Buy me a coffee');
    script.setAttribute('data-outline-color', '#000000');
    script.setAttribute('data-font-color', '#000000');
    script.setAttribute('data-coffee-color', '#ffffff');
    
    // Append to the specific container
    if (buttonRef.current) {
      buttonRef.current.appendChild(script);
    }

    return () => {
      // Cleanup
      if (buttonRef.current && buttonRef.current.contains(script)) {
        buttonRef.current.removeChild(script);
      }
    };
  }, []);

  return (
    <div className="buy-me-coffee-page">
      <div className="coffee-container">
        <div className="coffee-header">
          <h1 className="coffee-title">
            ☕ Support Our Project
          </h1>
          <p className="coffee-subtitle">
            Help keep AIO Converter running and improving!
          </p>
        </div>

        <div className="coffee-content">
          <div className="coffee-message">
            <h2>Why Support Us?</h2>
            <div className="support-reasons">
              <div className="reason-item">
                <span className="reason-icon">🚀</span>
                <div className="reason-text">
                  <h3>Continuous Development</h3>
                  <p>Your support helps us add new features and improve existing tools</p>
                </div>
              </div>
              <div className="reason-item">
                <span className="reason-icon">🔧</span>
                <div className="reason-text">
                  <h3>Bug Fixes & Maintenance</h3>
                  <p>Keep the platform running smoothly with regular updates</p>
                </div>
              </div>
              <div className="reason-item">
                <span className="reason-icon">💡</span>
                <div className="reason-text">
                  <h3>New Tools & Features</h3>
                  <p>Fund research and development of innovative conversion tools</p>
                </div>
              </div>
              <div className="reason-item">
                <span className="reason-icon">🌟</span>
                <div className="reason-text">
                  <h3>Keep It Free</h3>
                  <p>Your donations help us keep AIO Converter free for everyone</p>
                </div>
              </div>
            </div>
          </div>

          <div className="coffee-button-section">
            <div className="coffee-button-container">
              <h3>If you find this website useful</h3>
              <p>If you want, you can buy me a coffee. Click here to buy me a coffee!</p>
              
              {/* Buy Me a Coffee Button Container */}
              <div ref={buttonRef} className="bmc-button-wrapper">
                {/* Script will be injected here */}
              </div>
              
              {/* Fallback link if script doesn't load */}
              <div className="fallback-link">
                <a 
                  href="https://www.buymeacoffee.com/salimuddin07" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="coffee-fallback-btn"
                >
                  ☕ Buy me a coffee
                </a>
              </div>
              
              <div className="coffee-note">
                <p>
                  <strong>Note:</strong> This is completely optional and the tool will always remain free to use.
                  Every contribution, no matter how small, is greatly appreciated! ❤️
                </p>
              </div>
            </div>
          </div>

          <div className="coffee-footer">
            <h3>Other Ways to Support</h3>
            <div className="support-alternatives">
              <div className="alt-support">
                <a href="https://github.com/salimuddin07" target="_blank" rel="noopener noreferrer" className="alt-support-link">
                  <span className="alt-icon">⭐</span>
                  <p>Star our project on GitHub</p>
                </a>
              </div>
              <div className="alt-support">
                <span className="alt-icon">📢</span>
                <p>Share AIO Converter with friends</p>
              </div>
              <div className="alt-support" onClick={handleTelegramContact}>
                <span className="alt-icon">🐛</span>
                <p>Report bugs and suggest features</p>
              </div>
              <div className="alt-support">
                <span className="alt-icon">💬</span>
                <p>Leave feedback and reviews</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .buy-me-coffee-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 2rem 1rem;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }

        .coffee-container {
          max-width: 800px;
          margin: 0 auto;
          background: white;
          border-radius: 20px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }

        .coffee-header {
          background: linear-gradient(135deg, #FFDD00 0%, #FFA500 100%);
          padding: 3rem 2rem;
          text-align: center;
          color: #000;
        }

        .coffee-title {
          font-size: 3rem;
          margin: 0 0 1rem 0;
          font-weight: 700;
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
        }

        .coffee-subtitle {
          font-size: 1.2rem;
          margin: 0;
          opacity: 0.8;
          font-weight: 500;
        }

        .coffee-content {
          padding: 3rem 2rem;
        }

        .coffee-message h2 {
          color: #1a202c;
          text-align: center;
          margin-bottom: 3rem;
          font-size: 2.5rem;
          font-weight: 700;
          position: relative;
        }

        .coffee-message h2:after {
          content: '';
          position: absolute;
          bottom: -10px;
          left: 50%;
          transform: translateX(-50%);
          width: 80px;
          height: 4px;
          background: linear-gradient(135deg, #FFDD00 0%, #FFA500 100%);
          border-radius: 2px;
        }

        .support-reasons {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 2rem;
          margin-bottom: 3rem;
          padding: 0 1rem;
        }

        .reason-item {
          display: flex;
          align-items: flex-start;
          gap: 1.2rem;
          padding: 2rem;
          background: linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%);
          border-radius: 16px;
          border: 1px solid #e9ecef;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .reason-item:before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 4px;
          height: 100%;
          background: linear-gradient(135deg, #FFDD00 0%, #FFA500 100%);
        }

        .reason-item:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
          background: linear-gradient(145deg, #ffffff 0%, #f1f3f4 100%);
        }

        .reason-icon {
          font-size: 2.5rem;
          flex-shrink: 0;
          background: linear-gradient(135deg, #FFDD00 0%, #FFA500 100%);
          border-radius: 50%;
          width: 60px;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 8px rgba(255, 221, 0, 0.3);
        }

        .reason-text {
          flex: 1;
        }

        .reason-text h3 {
          margin: 0 0 0.8rem 0;
          color: #1a202c;
          font-size: 1.25rem;
          font-weight: 600;
          line-height: 1.3;
        }

        .reason-text p {
          margin: 0;
          color: #4a5568;
          line-height: 1.6;
          font-size: 0.95rem;
        }

        .coffee-button-section {
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
          padding: 3rem 2rem;
          border-radius: 20px;
          text-align: center;
          margin: 3rem 0;
          border: 1px solid #dee2e6;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
        }

        .coffee-button-container h3 {
          color: #1a202c;
          margin-bottom: 1.5rem;
          font-size: 2rem;
          font-weight: 600;
        }

        .coffee-button-container p {
          color: #4a5568;
          margin-bottom: 2.5rem;
          line-height: 1.6;
          font-size: 1.1rem;
          max-width: 500px;
          margin-left: auto;
          margin-right: auto;
          margin-bottom: 2.5rem;
        }

        .bmc-button-wrapper {
          margin: 2rem 0;
          display: flex;
          justify-content: center;
        }

        .fallback-link {
          margin: 1rem 0;
          display: flex;
          justify-content: center;
        }

        .coffee-fallback-btn {
          background: linear-gradient(135deg, #FFDD00 0%, #FFA500 100%);
          color: #000000;
          padding: 15px 30px;
          border-radius: 12px;
          text-decoration: none;
          font-family: 'Cookie', cursive;
          font-size: 18px;
          font-weight: bold;
          border: 2px solid #000000;
          transition: all 0.3s ease;
          display: inline-block;
          box-shadow: 0 4px 12px rgba(255, 221, 0, 0.3);
        }

        .coffee-fallback-btn:hover {
          background: linear-gradient(135deg, #FFE55C 0%, #FFB347 100%);
          transform: translateY(-2px);
          box-shadow: 0 6px 18px rgba(255, 221, 0, 0.4);
        }

        .coffee-note {
          margin-top: 2.5rem;
          padding: 1.5rem;
          background: rgba(255, 221, 0, 0.08);
          border-radius: 12px;
          border: 1px solid rgba(255, 221, 0, 0.2);
          backdrop-filter: blur(10px);
        }

        .coffee-note p {
          margin: 0;
          color: #2d3748;
          font-size: 0.95rem;
          line-height: 1.6;
          font-weight: 500;
        }
          line-height: 1.5;
        }

        .coffee-footer h3 {
          color: #1a202c;
          text-align: center;
          margin-bottom: 2.5rem;
          font-size: 2rem;
          font-weight: 600;
          position: relative;
        }

        .coffee-footer h3:after {
          content: '';
          position: absolute;
          bottom: -8px;
          left: 50%;
          transform: translateX(-50%);
          width: 60px;
          height: 3px;
          background: linear-gradient(135deg, #FFDD00 0%, #FFA500 100%);
          border-radius: 2px;
        }

        .support-alternatives {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 1.5rem;
          padding: 0 1rem;
        }

        .alt-support {
          text-align: center;
          padding: 1.8rem 1.2rem;
          background: linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%);
          border-radius: 12px;
          transition: all 0.3s ease;
          border: 1px solid #e9ecef;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        }

        .alt-support:hover {
          transform: translateY(-3px);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
          background: linear-gradient(145deg, #ffffff 0%, #f1f3f4 100%);
        }

        .alt-icon {
          font-size: 2.2rem;
          display: block;
          margin-bottom: 1rem;
          background: linear-gradient(135deg, #FFDD00 0%, #FFA500 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .alt-support p {
          margin: 0;
          color: #4a5568;
          font-size: 0.95rem;
          font-weight: 500;
          line-height: 1.4;
        }

        .alt-support-link {
          text-decoration: none;
          color: inherit;
          display: block;
          width: 100%;
          height: 100%;
        }

        .alt-support-link:hover {
          color: inherit;
        }

        .alt-support:has(.alt-support-link):hover {
          cursor: pointer;
        }

        @media (max-width: 768px) {
          .buy-me-coffee-page {
            padding: 1rem;
          }

          .coffee-header {
            padding: 2.5rem 1.5rem;
          }

          .coffee-title {
            font-size: 2.2rem;
          }

          .coffee-subtitle {
            font-size: 1.1rem;
          }

          .coffee-content {
            padding: 2rem 1.5rem;
          }

          .coffee-message h2 {
            font-size: 2rem;
            margin-bottom: 2rem;
          }

          .support-reasons {
            grid-template-columns: 1fr;
            gap: 1.5rem;
            padding: 0;
          }

          .reason-item {
            padding: 1.5rem;
          }

          .reason-icon {
            width: 50px;
            height: 50px;
            font-size: 2rem;
          }

          .reason-text h3 {
            font-size: 1.1rem;
          }

          .coffee-button-section {
            padding: 2.5rem 1.5rem;
            margin: 2rem 0;
          }

          .coffee-button-container h3 {
            font-size: 1.6rem;
          }

          .coffee-button-container p {
            font-size: 1rem;
          }

          .coffee-footer h3 {
            font-size: 1.6rem;
          }

          .support-alternatives {
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 1rem;
            padding: 0;
          }

          .alt-support {
            padding: 1.2rem 0.8rem;
          }

          .alt-icon {
            font-size: 1.8rem;
          }

          .coffee-fallback-btn {
            padding: 12px 24px;
            font-size: 16px;
          }
        }
      `}</style>
    </div>
  );
};

export default BuyMeCoffee;