import React, { useEffect, useState } from 'react';
import MainConversionInterface from './components/MainConversionInterface.jsx';
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import NotificationService from './utils/NotificationService.js';
import './aio-convert-style.css';

export default function App() {
  const [currentTool, setCurrentTool] = useState('home');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    NotificationService.toast('AIO Convert - Professional Media Converter Ready!', 'success', { 
      timer: 3000,
      position: 'top-center'
    });
  }, []);

  return (
    <div className="app">
      <Header 
        currentTool={currentTool}
        setCurrentTool={setCurrentTool}
      />
      <MainConversionInterface 
        currentTool={currentTool}
        setCurrentTool={setCurrentTool}
        loading={loading}
        setLoading={setLoading}
        error={error}
        setError={setError}
      />
      <Footer />
      
      <style>{`
        .app {
          min-height: 100vh;
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }
      `}</style>
    </div>
  );
}
