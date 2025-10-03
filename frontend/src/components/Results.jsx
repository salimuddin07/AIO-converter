import React, { useMemo, useState } from 'react';
import { realAPI } from '../utils/apiConfig';

export default function Results({ results }) {
  const [preview, setPreview] = useState(null);
  const [caption, setCaption] = useState('');
  const [captionLoading, setCaptionLoading] = useState(false);
  const base = import.meta.env.VITE_BACKEND_URL || '';
  const items = useMemo(() => (results || []).map(r => {
    const fileUrl = base + r.url;
    const downloadUrl = base + '/api/files/download/' + encodeURIComponent(r.convertedName);
    const ext = (r.convertedName.split('.').pop() || '').toLowerCase();
    return { ...r, fileUrl, downloadUrl, ext };
  }), [results, base]);

  if (!items.length) return null;
  const close = () => { setPreview(null); setCaption(''); setCaptionLoading(false); };

  async function describeCurrent() {
    if (!preview) return;
    try {
      setCaptionLoading(true);
      const data = await realAPI.describeImage(preview.convertedName);
      setCaption(data.caption || '');
    } catch (e) {
      setCaption(`Error: ${e.message}`);
    } finally {
      setCaptionLoading(false);
    }
  }

  return (
    <div className="results">
      <h2>Converted Results</h2>
      <div className="grid">
        {items.map(r => (
          <div key={r.convertedName} className="card">
            <p><strong>{r.originalName}</strong></p>
            <p style={{fontSize:'0.9rem', color:'#666', marginTop:'0.25rem'}}>
              → {r.convertedName.split('.').pop().toUpperCase()} format
            </p>
            <div style={{cursor:'zoom-in'}} onClick={()=>setPreview(r)}>
              {r.ext === 'svg' ? (
                <object data={r.fileUrl} type="image/svg+xml" aria-label={r.convertedName} style={{width:'100%'}} />
              ) : (
                <img src={r.fileUrl} alt={r.convertedName} />
              )}
            </div>
            <div style={{display:'flex', gap:'.5rem'}}>
              <a href={r.downloadUrl}>Download</a>
              <a href={r.fileUrl} target="_blank" rel="noreferrer">Open</a>
            </div>
            {r.note && <p className="note">{r.note}</p>}
          </div>
        ))}
      </div>

      {preview && (
        <div role="dialog" aria-modal="true" className="modal" onClick={close}>
          <div className="modal-content" onClick={e=>e.stopPropagation()}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
              <strong>{preview.originalName}</strong>
              <button onClick={close} aria-label="Close preview">×</button>
            </div>
            <div className="modal-body">
              {preview.ext === 'svg' ? (
                <object data={preview.fileUrl} type="image/svg+xml" style={{maxWidth:'90vw', maxHeight:'70vh'}} />
              ) : (
                <img src={preview.fileUrl} alt={preview.convertedName} style={{maxWidth:'90vw', maxHeight:'70vh'}} />
              )}
            </div>
            <div style={{marginTop:'.5rem', display:'flex', gap:'.75rem', alignItems:'center'}}>
              <a href={preview.downloadUrl}>Download</a>
              <button onClick={describeCurrent} disabled={captionLoading}>
                {captionLoading ? 'Describing…' : 'Describe (AI)'}
              </button>
            </div>
            {caption && (
              <p style={{marginTop:'.5rem'}}><em>{caption}</em></p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
