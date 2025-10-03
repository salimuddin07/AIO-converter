import React, { useMemo, useRef, useState } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import html2pdf from 'html2pdf.js';
import { NotificationService } from '../utils/NotificationService.js';
import { PAGE_SIZES_MM, sanitizeFileName, clampMargin } from '../utils/pdfExport.js';

const SAMPLE_MARKDOWN = String.raw`# Markdown to PDF

This is a **live preview** of the Markdown to PDF converter.

## Features

- Write Markdown manually or upload a \`.md\` file
- Choose page size, orientation, and margins
- Preview exactly what will be exported
- Fully offline — everything happens in your browser

## Code Blocks

\`\`\`
const greet = (name) => 'Hello, ' + name + '!';
console.log(greet('world'));
\`\`\`

## Tables

| Feature | Supported |
| ------- | --------- |
| Headings | ✅ |
| Lists | ✅ |
| Tables | ✅ |
| Code | ✅ |

> Tip: you can tweak margins or switch to landscape for wide tables.
`;

const MARKDOWN_HINT = `Supports GitHub-flavoured Markdown: headings (#), bold/italic, lists, code blocks, tables, blockquotes, links, images, and more.`;

const pageSizeOptions = Object.entries(PAGE_SIZES_MM);

export default function MarkdownToPdf() {
  const [markdown, setMarkdown] = useState(SAMPLE_MARKDOWN);
  const [fileName, setFileName] = useState('markdown-document');
  const [options, setOptions] = useState({
    pageSize: 'a4',
    orientation: 'portrait',
    margin: 15
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const previewRef = useRef(null);

  const renderedHtml = useMemo(() => {
    try {
      const rawHtml = marked.parse(markdown || '');
      return DOMPurify.sanitize(rawHtml, { USE_PROFILES: { html: true } });
    } catch (err) {
      console.error('Markdown rendering error:', err);
      setError('Unable to render Markdown preview');
      return '';
    }
  }, [markdown]);

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.md')) {
      setError('Please choose a Markdown (.md) file');
      return;
    }

    try {
      const text = await file.text();
      setMarkdown(text);
      setFileName(file.name.replace(/\.md$/i, ''));
      setError(null);
    } catch (readError) {
      console.error('Failed to read Markdown file:', readError);
      setError('Unable to read that file. Please try another Markdown document.');
    } finally {
      event.target.value = '';
    }
  };

  const handleOptionChange = (key, value) => {
    setOptions((prev) => ({
      ...prev,
      [key]: key === 'margin' ? clampMargin(value) : value
    }));
  };

  const reset = () => {
    setMarkdown('');
    setFileName('markdown-document');
    setOptions({ pageSize: 'a4', orientation: 'portrait', margin: 15 });
    setError(null);
  };

  const loadSample = () => {
    setMarkdown(SAMPLE_MARKDOWN);
    setFileName('markdown-to-pdf-sample');
    setError(null);
  };

  const convertToPdf = async () => {
    if (!previewRef.current) {
      NotificationService.warning('Nothing to export yet. Add some Markdown first.');
      return;
    }

    try {
      setIsGenerating(true);
      setError(null);
      const exportName = sanitizeFileName(fileName, 'pdf');

      const { orientation, pageSize, margin } = options;
      const pdfOptions = {
        margin,
        filename: exportName,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: pageSize, orientation }
      };

      NotificationService.toast('Generating PDF…', 'info');
      await html2pdf()
        .set(pdfOptions)
        .from(previewRef.current)
        .save();

      NotificationService.success('PDF downloaded successfully');
    } catch (conversionError) {
      console.error('Markdown to PDF error:', conversionError);
      const message = conversionError?.message || 'PDF generation failed';
      setError(message);
      NotificationService.error(`PDF generation failed: ${message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="md-to-pdf">
      <header className="hero">
        <div>
          <h1>📝 Markdown to PDF</h1>
          <p>Write Markdown, preview the rendered document, and export a high-quality PDF — all without leaving your browser.</p>
        </div>
        <div className="hero-actions">
          <button type="button" onClick={loadSample} className="secondary">Load sample</button>
          <button type="button" onClick={reset} className="ghost">Reset</button>
        </div>
      </header>

      <section className="layout">
        <div className="left-panel">
          <label className="field">
            <span>Markdown source</span>
            <textarea
              value={markdown}
              onChange={(e) => setMarkdown(e.target.value)}
              placeholder={MARKDOWN_HINT}
              rows={18}
            />
          </label>

          <div className="field inline">
            <label className="small">
              <span>File name</span>
              <input
                type="text"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="my-document"
              />
            </label>

            <label className="small">
              <span>Page size</span>
              <select value={options.pageSize} onChange={(e) => handleOptionChange('pageSize', e.target.value)}>
                {pageSizeOptions.map(([key, meta]) => (
                  <option key={key} value={key}>{meta.label}</option>
                ))}
              </select>
            </label>

            <label className="small">
              <span>Orientation</span>
              <select value={options.orientation} onChange={(e) => handleOptionChange('orientation', e.target.value)}>
                <option value="portrait">Portrait</option>
                <option value="landscape">Landscape</option>
              </select>
            </label>

            <label className="small">
              <span>Margin (mm)</span>
              <input
                type="number"
                min="0"
                max="60"
                value={options.margin}
                onChange={(e) => handleOptionChange('margin', parseInt(e.target.value, 10) || 0)}
              />
            </label>
          </div>

          <div className="uploader">
            <input
              id="md-file-input"
              type="file"
              accept=".md,text/markdown"
              onChange={handleFileUpload}
            />
            <label htmlFor="md-file-input" className="uploader-label">Upload Markdown file</label>
            <span className="hint">We only read files locally — nothing is uploaded.</span>
          </div>

          <button type="button" className="primary" onClick={convertToPdf} disabled={isGenerating || !markdown.trim()}>
            {isGenerating ? 'Preparing PDF…' : 'Download PDF'}
          </button>
        </div>

        <div className="right-panel">
          <div className="preview-card">
            <div className="preview-header">
              <h2>Live preview</h2>
              <span>{markdown.trim().length} characters</span>
            </div>
            <div className="preview" ref={previewRef} dangerouslySetInnerHTML={{ __html: renderedHtml || '<p class="empty">Start typing Markdown to preview it here.</p>' }} />
          </div>
        </div>
      </section>

      {error && (
        <div className="error-banner">
          <strong>Something went wrong:</strong> {error}
        </div>
      )}

      <style>{`
        .md-to-pdf {
          max-width: 1200px;
          margin: 0 auto;
          padding: 32px 20px 80px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .hero {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 20px;
        }

        .hero h1 {
          margin: 0 0 8px;
          font-size: 2.4rem;
          color: #1f2937;
        }

        .hero p {
          margin: 0;
          color: #4b5563;
          max-width: 620px;
          line-height: 1.6;
        }

        .hero-actions {
          display: flex;
          gap: 12px;
        }

        .hero-actions button {
          border: none;
          border-radius: 999px;
          padding: 10px 20px;
          font-weight: 600;
          cursor: pointer;
        }

        .hero-actions .secondary {
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: white;
        }

        .hero-actions .ghost {
          background: transparent;
          border: 1px solid rgba(99, 102, 241, 0.4);
          color: #4c51bf;
        }

        .layout {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }

        .left-panel {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .field {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .field span {
          font-weight: 600;
          color: #1f2937;
        }

        textarea {
          resize: vertical;
          padding: 14px;
          font-family: 'Fira Code', 'Source Code Pro', monospace;
          border-radius: 12px;
          border: 1px solid #cbd5f5;
          background: rgba(248, 250, 252, 0.7);
          min-height: 360px;
        }

        textarea:focus {
          outline: none;
          border-color: #818cf8;
          box-shadow: 0 0 0 3px rgba(129, 140, 248, 0.2);
        }

        .field.inline {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
          gap: 16px;
        }

        .field.inline .small {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        input[type='text'],
        input[type='number'],
        select {
          border-radius: 10px;
          border: 1px solid #cbd5f5;
          padding: 10px 12px;
          font-size: 0.95rem;
        }

        select:focus,
        input:focus {
          outline: none;
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
        }

        .uploader {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .uploader input {
          display: none;
        }

        .uploader-label {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
          padding: 10px;
          background: rgba(99, 102, 241, 0.1);
          color: #4c51bf;
          cursor: pointer;
          font-weight: 600;
          transition: background 0.2s ease;
        }

        .uploader-label:hover {
          background: rgba(99, 102, 241, 0.2);
        }

        .hint {
          font-size: 0.85rem;
          color: #6b7280;
        }

        .primary {
          align-self: flex-start;
          background: linear-gradient(135deg, #10b981, #14b8a6);
          color: white;
          border: none;
          border-radius: 999px;
          padding: 12px 28px;
          font-weight: 700;
          cursor: pointer;
          transition: transform 0.2s ease;
        }

        .primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .primary:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 14px 28px rgba(20, 184, 166, 0.3);
        }

        .right-panel {
          display: flex;
          flex-direction: column;
        }

        .preview-card {
          background: white;
          border-radius: 16px;
          box-shadow: 0 12px 32px rgba(15, 23, 42, 0.12);
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .preview-header {
          padding: 18px 22px;
          border-bottom: 1px solid #e5e7eb;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .preview-header h2 {
          margin: 0;
          font-size: 1.2rem;
          color: #1f2937;
        }

        .preview-header span {
          color: #64748b;
          font-size: 0.9rem;
        }

        .preview {
          padding: 24px;
          overflow-y: auto;
          max-height: 620px;
          line-height: 1.7;
          color: #1f2937;
        }

        .preview h1,
        .preview h2,
        .preview h3,
        .preview h4 {
          color: #111827;
        }

        .preview pre {
          background: #0f172a;
          color: #e2e8f0;
          padding: 12px;
          border-radius: 12px;
          overflow-x: auto;
          font-size: 0.9rem;
        }

        .preview table {
          width: 100%;
          border-collapse: collapse;
          margin: 16px 0;
        }

        .preview th,
        .preview td {
          border: 1px solid #e5e7eb;
          padding: 8px 12px;
          text-align: left;
        }

        .preview blockquote {
          border-left: 4px solid #6366f1;
          margin: 16px 0;
          padding: 8px 16px;
          background: rgba(99, 102, 241, 0.08);
          color: #4338ca;
        }

        .preview .empty {
          color: #94a3b8;
          font-style: italic;
        }

        .error-banner {
          background: #fee2e2;
          border: 1px solid #fca5a5;
          color: #b91c1c;
          border-radius: 12px;
          padding: 16px 20px;
        }

        @media (max-width: 1024px) {
          .layout {
            grid-template-columns: 1fr;
          }

          .hero {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  );
}
