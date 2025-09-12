import React, { useEffect, useState } from 'react';
import Header from './components/Header.jsx';
import HomePage from './components/HomePage.jsx';
import Sidebar from './components/Sidebar.jsx';
import Footer from './components/Footer.jsx';
import AdvancedUploadArea from './components/AdvancedUploadArea.jsx';
import GifSplitter from './components/GifSplitter.jsx';
import SplitResults from './components/SplitResults.jsx';
import VideoToGif from './components/VideoToGif.jsx';
import Results from './components/Results.jsx';
import './ezgif-style.css';

export default function App() {
  const [results, setResults] = useState([]);
  const [splitResults, setSplitResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [aiStatus, setAiStatus] = useState(null);
  const [currentPage, setCurrentPage] = useState('home');
  
  useEffect(() => {
    const base = import.meta.env.VITE_BACKEND_URL || '';
    fetch(base + '/api/ai/status').then(r=>r.json()).then(setAiStatus).catch(()=>{});
  }, []);

  async function handleConvert({ files, targetFormat, gifOptions, videoOptions }) {
    setError(null);
    setLoading(true);
    try {
      const form = new FormData();
      files.forEach(f => form.append('files', f));
      form.append('targetFormat', targetFormat);
      if (targetFormat === 'gif' && gifOptions) {
        if (gifOptions.frameDelays && gifOptions.frameDelays.length > 0) {
          gifOptions.frameDelays.forEach((delay, i) => {
            form.append(`frameDelay_${i}`, delay);
          });
        } else if (gifOptions.frameDelay) {
          form.append('gif.frameDelay', gifOptions.frameDelay);
        }
        if (gifOptions.loop !== undefined) form.append('gif.loop', gifOptions.loop);
        if (gifOptions.quality) form.append('gif.quality', gifOptions.quality);
        if (gifOptions.globalColormap) form.append('gif.globalColormap', 'true');
        if (gifOptions.crossfade) {
          form.append('gif.crossfade', 'true');
          form.append('gif.crossfadeFrames', gifOptions.crossfadeFrames || 10);
          form.append('gif.crossfadeDelay', gifOptions.crossfadeDelay || 6);
        }
        if (gifOptions.noStack) form.append('gif.noStack', 'true');
        if (gifOptions.keepFirst) form.append('gif.keepFirst', 'true');
        if (gifOptions.skipFirst) form.append('gif.skipFirst', 'true');
      }
      if ((targetFormat === 'mp4' || targetFormat === 'frames') && videoOptions) {
        if (videoOptions.frameRate) form.append('video.frameRate', videoOptions.frameRate);
        if (videoOptions.quality) form.append('video.quality', videoOptions.quality);
      }
      const base = import.meta.env.VITE_BACKEND_URL || '';
      let res;
      try {
        res = await fetch(base + '/api/convert', { method: 'POST', body: form });
      } catch (e1) {
        console.warn('Primary fetch failed, attempting direct backend http://localhost:4001');
        const fallback = 'http://localhost:4001';
        res = await fetch(fallback + '/api/convert', { method: 'POST', body: form });
      }
      let data; 
      try { 
        data = await res.json(); 
      } catch { 
        data = {}; 
      }
      if (!res.ok) {
        const details = data?.error?.details ? `: ${data.error.details.join('; ')}` : '';
        throw new Error(data.error?.message || `Conversion failed${details}`);
      }
      setResults(data.results || []);
    } catch (e) {
      console.error('Upload error', e);
      setError(`Upload failed: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }

  // Split GIF functionality
  async function handleSplit({ file, url }) {
    setError(null);
    setLoading(true);
    setSplitResults(null);
    
    try {
      const form = new FormData();
      if (file) {
        form.append('file', file);
      }
      if (url) {
        form.append('url', url);
      }
      
      const base = import.meta.env.VITE_BACKEND_URL || '';
      let res;
      try {
        res = await fetch(base + '/api/split/split', { method: 'POST', body: form });
      } catch (e1) {
        console.warn('Primary fetch failed, attempting direct backend http://localhost:4001');
        const fallback = 'http://localhost:4001';
        res = await fetch(fallback + '/api/split/split', { method: 'POST', body: form });
      }
      
      let data;
      try {
        data = await res.json();
      } catch {
        data = {};
      }
      
      if (!res.ok) {
        throw new Error(data.error || `Split failed: ${res.status}`);
      }
      
      setSplitResults(data);
    } catch (e) {
      console.error('Split error', e);
      setError(`Split failed: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }

  // Handle editing animation from split results
  const handleEditAnimation = () => {
    // Switch to maker page and pre-populate with frames
    setCurrentPage('maker');
    // In a real implementation, you'd pass the frame data
  };

  // Handle ZIP download
  const handleDownloadZip = () => {
    if (splitResults && splitResults.zipUrl) {
      const base = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4001';
      window.open(base + splitResults.zipUrl, '_blank');
    }
  };

  // Navigation handler for future routing
  const handleNavigation = (page) => {
    setCurrentPage(page);
  };

  const renderCurrentPage = () => {
    switch(currentPage) {
      case 'maker':
        return (
          <div id="main">
            <AdvancedUploadArea onConvert={handleConvert} loading={loading} />
            {error && <div role="alert" className="error" style={{color: 'red', padding: '10px', margin: '10px 0', background: '#ffe6e6', border: '1px solid #ff9999'}}>{error}</div>}
            <Results results={results} />
          </div>
        );
      case 'split':
        return (
          <div>
            <GifSplitter onSplit={handleSplit} loading={loading} />
            {error && <div role="alert" className="error" style={{color: 'red', padding: '10px', margin: '10px 0', background: '#ffe6e6', border: '1px solid #ff9999'}}>{error}</div>}
            {splitResults && (
              <SplitResults 
                frames={splitResults.frames} 
                onEditAnimation={handleEditAnimation}
                onDownloadZip={handleDownloadZip}
              />
            )}
          </div>
        );
      case 'video-to-gif':
        return <VideoToGif />;
      default:
        return <HomePage onNavigate={handleNavigation} />;
    }
  };

  return (
    <div className="ww" id="wrapper">
      <Header onNavigate={handleNavigation} />
      
      <div id="content">
        <Sidebar />
        {renderCurrentPage()}
        <div className="c"></div>
      </div>
      
      <Footer />
    </div>
  );
}
