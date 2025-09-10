import React, { useEffect, useState } from 'react';
import UploadArea from './components/UploadArea.jsx';
import Results from './components/Results.jsx';

export default function App() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [aiStatus, setAiStatus] = useState(null);
  useEffect(() => {
    const base = import.meta.env.VITE_BACKEND_URL || '';
    fetch(base + '/api/ai/status').then(r=>r.json()).then(setAiStatus).catch(()=>{});
  }, []);

  async function handleConvert({ files, targetFormat, gifOptions }) {
    setError(null);
    setLoading(true);
    try {
      const form = new FormData();
      files.forEach(f => form.append('files', f));
      form.append('targetFormat', targetFormat);
      if (targetFormat === 'gif' && gifOptions) {
        if (gifOptions.frameDelay) form.append('gif.frameDelay', gifOptions.frameDelay);
        if (gifOptions.loop !== undefined) form.append('gif.loop', gifOptions.loop);
        if (gifOptions.singleGif) form.append('singleGif', 'true');
      }
  const base = import.meta.env.VITE_BACKEND_URL || '';
      let res;
      try {
        res = await fetch(base + '/api/convert', { method: 'POST', body: form });
      } catch (e1) {
        console.warn('Primary fetch failed, attempting direct backend http://localhost:4000');
  const fallback = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000');
  res = await fetch(fallback + '/api/convert', { method: 'POST', body: form });
      }
      let data; try { data = await res.json(); } catch { data = {}; }
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

  return (
    <div className="container">
      <header className="header">
        <div className="brand">
          <h1>Image Converter</h1>
          <span className="sub">PNG • JPG • GIF • SVG</span>
        </div>
        {aiStatus && (
          <small style={{ opacity: 0.8 }}>AI: {aiStatus.enabled ? `enabled (${aiStatus.provider})` : 'disabled'}</small>
        )}
      </header>
      <UploadArea onConvert={handleConvert} loading={loading} />
      {error && <div role="alert" className="error">{error}</div>}
      <Results results={results} />
      <footer className="footer">© {new Date().getFullYear()} Image Converter</footer>
    </div>
  );
}
