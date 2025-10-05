import React, { useEffect, useMemo, useRef, useState } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import html2pdf from 'html2pdf.js';
import { PDFDocument } from 'pdf-lib';
import { NotificationService } from '../utils/NotificationService.js';
import { PAGE_SIZES_MM, sanitizeFileName, clampMargin, mmToPixels, getPageSizeMm } from '../utils/pdfExport.js';

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
  const exportRef = useRef(null);
  const [pageStats, setPageStats] = useState({ estimatedPages: 0, actualPages: null, availableHeightPx: 0 });
  const [exportMode, setExportMode] = useState('all');
  const [pageInputs, setPageInputs] = useState({ start: 1, end: 1 });
  const [selectedPages, setSelectedPages] = useState([]);
  const [pageSelectionError, setPageSelectionError] = useState('');

  const clampValue = (value, min, max) => Math.min(Math.max(value, min), max);

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

  useEffect(() => {
    if (!exportRef.current) {
      return;
    }

    const target = exportRef.current;
    target.innerHTML = renderedHtml || '';

    const { pageSize, orientation, margin } = options;
    const { width: pageWidthMm, height: pageHeightMm } = getPageSizeMm(pageSize, orientation);
    const marginPx = mmToPixels(margin);
    const pageWidthPx = mmToPixels(pageWidthMm);
    const pageHeightPx = mmToPixels(pageHeightMm);
    const contentWidthPx = Math.max(120, pageWidthPx - marginPx * 2);
    const contentHeightPx = Math.max(120, pageHeightPx - marginPx * 2);

    target.style.width = `${contentWidthPx}px`;
    target.style.padding = `${marginPx}px`;
    target.style.boxSizing = 'border-box';

    const measure = () => {
      const height = target.getBoundingClientRect?.().height || 0;
      const hasContent = Boolean(markdown.trim());
      const estimatedPages = hasContent && contentHeightPx > 0
        ? Math.max(1, Math.ceil(height / contentHeightPx))
        : 0;

      setPageStats((prev) => ({
        estimatedPages,
        actualPages: hasContent ? prev.actualPages : null,
        availableHeightPx: contentHeightPx
      }));

      if (estimatedPages > 0) {
        const safeMax = Math.max(estimatedPages, 1);
        setPageInputs((prev) => ({
          start: clampValue(prev.start || 1, 1, safeMax),
          end: clampValue(prev.end || safeMax, 1, safeMax)
        }));

        setSelectedPages((prev) => {
          if (!Array.isArray(prev) || prev.length === 0) {
            return Array.from({ length: safeMax }, (_, idx) => idx + 1);
          }

          const normalized = Array.from(new Set(prev
            .map((page) => clampValue(Number(page) || 1, 1, safeMax))))
            .sort((a, b) => a - b);

          return normalized.length ? normalized : Array.from({ length: safeMax }, (_, idx) => idx + 1);
        });
      }
    };

    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(measure);
    } else {
      setTimeout(measure, 0);
    }
  }, [renderedHtml, options, markdown]);

  const resolvedPages = pageStats.actualPages ?? pageStats.estimatedPages ?? 0;
  const hasResolvedPages = resolvedPages > 0;
  const pageLabel = pageStats.actualPages
    ? `${pageStats.actualPages} page${pageStats.actualPages === 1 ? '' : 's'}`
    : pageStats.estimatedPages
      ? `≈ ${pageStats.estimatedPages} page${pageStats.estimatedPages === 1 ? '' : 's'}`
      : '—';
  const selectedPageSet = useMemo(() => new Set(selectedPages), [selectedPages]);

  useEffect(() => {
    if (!hasResolvedPages) {
      setSelectedPages([]);
      return;
    }

    setPageInputs((prev) => ({
      start: clampValue(prev.start || 1, 1, resolvedPages),
      end: clampValue(prev.end || resolvedPages, 1, resolvedPages)
    }));

    setSelectedPages((prev) => {
      if (!Array.isArray(prev) || prev.length === 0) {
        return Array.from({ length: resolvedPages }, (_, idx) => idx + 1);
      }

      const normalized = Array.from(new Set(prev
        .map((page) => clampValue(Number(page) || 1, 1, resolvedPages)))).sort((a, b) => a - b);

      return normalized.length ? normalized : Array.from({ length: resolvedPages }, (_, idx) => idx + 1);
    });
  }, [hasResolvedPages, resolvedPages]);

  useEffect(() => {
    if (exportMode !== 'custom' && pageSelectionError) {
      setPageSelectionError('');
    }
  }, [exportMode, pageSelectionError]);

  const togglePageSelection = (pageNumber) => {
    if (!hasResolvedPages) {
      return;
    }

    setPageSelectionError('');
    setSelectedPages((prev) => {
      const set = new Set(prev);
      if (set.has(pageNumber)) {
        set.delete(pageNumber);
      } else {
        set.add(pageNumber);
      }
      const next = Array.from(set)
        .map((page) => clampValue(Number(page) || 1, 1, resolvedPages))
        .filter((value, index, array) => array.indexOf(value) === index)
        .sort((a, b) => a - b);
      return next;
    });
  };

  const selectAllPages = () => {
    if (!hasResolvedPages) {
      return;
    }
    setPageSelectionError('');
    setSelectedPages(Array.from({ length: resolvedPages }, (_, idx) => idx + 1));
  };

  const clearSelectedPages = () => {
    setPageSelectionError('');
    setSelectedPages([]);
  };

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
    if (!exportRef.current) {
      NotificationService.warning('Nothing to export yet. Add some Markdown first.');
      return;
    }

    if (!markdown.trim()) {
      NotificationService.warning('Add some Markdown before exporting.');
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
        html2canvas: { scale: 2, useCORS: true, scrollY: 0 },
        pagebreak: { mode: ['css', 'legacy'] },
        jsPDF: { unit: 'mm', format: pageSize, orientation }
      };

      setPageSelectionError('');
      NotificationService.toast('Generating PDF…', 'info');

      const worker = html2pdf().set(pdfOptions).from(exportRef.current);
      const pdfArrayBuffer = await worker.outputPdf('arraybuffer');
      const pdfDoc = await PDFDocument.load(pdfArrayBuffer);
      const totalPages = pdfDoc.getPageCount();

      setPageStats((prev) => ({
        ...prev,
        actualPages: totalPages,
        estimatedPages: prev.estimatedPages || totalPages
      }));

      setPageInputs((prev) => {
        const max = Math.max(totalPages, 1);
        return {
          start: clampValue(prev.start || 1, 1, max),
          end: clampValue(prev.end || max, 1, max)
        };
      });

      setSelectedPages((prev) => {
        if (!Array.isArray(prev) || !prev.length) {
          return Array.from({ length: totalPages }, (_, idx) => idx + 1);
        }
        const normalized = Array.from(new Set(prev
          .map((page) => clampValue(Number(page) || 1, 1, totalPages)))).sort((a, b) => a - b);
        return normalized.length ? normalized : Array.from({ length: totalPages }, (_, idx) => idx + 1);
      });

      const clampPage = (value) => clampValue(value, 1, totalPages);
      const derivePageNumbers = () => {
        if (exportMode === 'range') {
          const start = clampPage(pageInputs.start || 1);
          const end = clampPage(pageInputs.end || totalPages);
          const [min, max] = start <= end ? [start, end] : [end, start];
          return Array.from({ length: max - min + 1 }, (_, idx) => min + idx);
        }

        if (exportMode === 'custom') {
          const normalized = Array.from(new Set(selectedPages
            .map((page) => clampPage(Number(page) || 1)))).sort((a, b) => a - b);

          if (!normalized.length) {
            const message = 'Select at least one page before downloading.';
            setPageSelectionError(message);
            NotificationService.warning(message);
            return null;
          }

          return normalized;
        }

        return Array.from({ length: totalPages }, (_, idx) => idx + 1);
      };

      const pageNumbers = derivePageNumbers();
      if (!pageNumbers || !pageNumbers.length) {
        return;
      }

      const uniqueIndexes = Array.from(new Set(pageNumbers.map((page) => clampPage(page) - 1))).sort((a, b) => a - b);
      const shouldSubset = exportMode !== 'all' && uniqueIndexes.length < totalPages;

      if (shouldSubset) {
        const keepSet = new Set(uniqueIndexes);
        for (let index = totalPages - 1; index >= 0; index -= 1) {
          if (!keepSet.has(index)) {
            pdfDoc.removePage(index);
          }
        }
      }

      const outputBytes = await pdfDoc.save();
      const exportedCount = shouldSubset ? uniqueIndexes.length : totalPages;

      const blob = new Blob([outputBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = exportName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      NotificationService.success(`PDF downloaded successfully (${exportedCount} page${exportedCount === 1 ? '' : 's'})`);
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

          <div className="page-controls">
            <div className="page-count">
              <span>Total pages</span>
              <strong>{pageLabel}</strong>
              {pageStats.actualPages && pageStats.estimatedPages && pageStats.actualPages !== pageStats.estimatedPages && (
                <small>Estimated before export: ≈{pageStats.estimatedPages}</small>
              )}
              {!pageStats.actualPages && pageStats.estimatedPages > 0 && (
                <small>Final count will confirm on export.</small>
              )}
            </div>

            <fieldset className="page-mode" disabled={!hasResolvedPages}>
              <legend>Select pages to export</legend>
              {!hasResolvedPages && (
                <small className="page-hint">Add Markdown and wait a moment for page estimates to unlock selection controls.</small>
              )}
              <label className="radio-line">
                <input
                  type="radio"
                  name="export-mode"
                  value="all"
                  checked={exportMode === 'all'}
                  onChange={() => setExportMode('all')}
                />
                <span>All pages ({pageLabel})</span>
              </label>

              <label className="radio-line">
                <input
                  type="radio"
                  name="export-mode"
                  value="range"
                  checked={exportMode === 'range'}
                  onChange={() => setExportMode('range')}
                  disabled={!hasResolvedPages}
                />
                <span>Pages</span>
                <input
                  type="number"
                  min="1"
                  max={Math.max(resolvedPages, 1)}
                  value={pageInputs.start}
                  onChange={(e) => {
                    const next = clampValue(parseInt(e.target.value, 10) || 1, 1, Math.max(resolvedPages, 1));
                    setPageInputs((prev) => ({ ...prev, start: next }));
                  }}
                  disabled={exportMode !== 'range' || !hasResolvedPages}
                />
                <span>to</span>
                <input
                  type="number"
                  min="1"
                  max={Math.max(resolvedPages, 1)}
                  value={pageInputs.end}
                  onChange={(e) => {
                    const next = clampValue(parseInt(e.target.value, 10) || 1, 1, Math.max(resolvedPages, 1));
                    setPageInputs((prev) => ({ ...prev, end: next }));
                  }}
                  disabled={exportMode !== 'range' || !hasResolvedPages}
                />
              </label>

              <div className={`radio-custom ${exportMode === 'custom' ? 'active' : ''}`}>
                <label className="radio-line spread">
                  <input
                    type="radio"
                    name="export-mode"
                    value="custom"
                    checked={exportMode === 'custom'}
                    onChange={() => setExportMode('custom')}
                    disabled={!hasResolvedPages}
                  />
                  <span>Choose specific pages</span>
                  <span className="selection-count">
                    {!hasResolvedPages
                      ? '—'
                      : selectedPages.length === resolvedPages
                        ? 'All pages selected'
                        : selectedPages.length > 0
                          ? `${selectedPages.length} selected`
                          : 'None selected yet'}
                  </span>
                </label>

                <div className="page-picker" data-disabled={exportMode !== 'custom'}>
                  {Array.from({ length: resolvedPages }, (_, idx) => idx + 1).map((pageNumber) => {
                    const isSelected = selectedPageSet.has(pageNumber);
                    return (
                      <button
                        key={pageNumber}
                        type="button"
                        className={`page-chip ${isSelected ? 'selected' : ''}`}
                        onClick={() => togglePageSelection(pageNumber)}
                        disabled={exportMode !== 'custom'}
                        aria-pressed={isSelected}
                        title={`Toggle page ${pageNumber}`}
                      >
                        {pageNumber}
                      </button>
                    );
                  })}
                </div>

                <div className="page-picker-actions">
                  <button
                    type="button"
                    onClick={selectAllPages}
                    disabled={exportMode !== 'custom' || !hasResolvedPages}
                  >
                    Select all
                  </button>
                  <button
                    type="button"
                    onClick={clearSelectedPages}
                    disabled={exportMode !== 'custom' || !hasResolvedPages}
                  >
                    Clear
                  </button>
                </div>

                {pageSelectionError && exportMode === 'custom' && (
                  <small className="error-message">{pageSelectionError}</small>
                )}
              </div>
            </fieldset>
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

      <div className="export-measure-root" aria-hidden="true">
        <div ref={exportRef} className="markdown-export" />
      </div>

      <style>{`
        .md-to-pdf {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 auto;
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

        .page-controls {
          padding: 16px;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          background: rgba(248, 250, 252, 0.8);
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .page-count {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .page-count span {
          font-weight: 600;
          color: #1f2937;
        }

        .page-count strong {
          font-size: 1.4rem;
          color: #0f172a;
        }

        .page-count small {
          color: #64748b;
          font-size: 0.8rem;
        }

        .page-mode {
          border: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .page-mode legend {
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 4px;
        }

        .page-hint {
          color: #64748b;
          font-size: 0.85rem;
        }

        .radio-line {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.95rem;
          color: #1f2937;
        }

        .radio-line.spread {
          gap: 12px;
          flex-wrap: wrap;
        }

        .radio-custom {
          display: flex;
          flex-direction: column;
          gap: 12px;
          border-radius: 12px;
          padding: 10px 12px;
          transition: background 0.2s ease;
        }

        .radio-custom.active {
          background: rgba(99, 102, 241, 0.08);
        }

        .selection-count {
          margin-left: auto;
          font-size: 0.85rem;
          color: #475569;
        }

        .radio-line input[type='number'] {
          width: 72px;
          text-align: center;
        }

        .page-picker {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(44px, 1fr));
          gap: 8px;
        }

        .page-picker[data-disabled='true'] {
          opacity: 0.5;
          pointer-events: none;
        }

        .page-chip {
          border: 1px solid #cbd5f5;
          border-radius: 8px;
          background: #fff;
          padding: 8px 0;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .page-chip.selected {
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: #fff;
          border-color: transparent;
          box-shadow: 0 8px 20px rgba(99, 102, 241, 0.2);
        }

        .page-chip:disabled {
          cursor: not-allowed;
          opacity: 0.5;
        }

        .page-picker-actions {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .page-picker-actions button {
          border: none;
          border-radius: 999px;
          padding: 6px 14px;
          font-size: 0.85rem;
          font-weight: 600;
          background: rgba(15, 118, 110, 0.12);
          color: #0f766e;
          cursor: pointer;
          transition: background 0.2s ease;
        }

        .page-picker-actions button:hover:not(:disabled) {
          background: rgba(15, 118, 110, 0.2);
        }

        .page-picker-actions button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .error-message {
          color: #b91c1c;
          font-size: 0.85rem;
        }

        .export-measure-root {
          position: absolute;
          top: 0;
          left: -9999px;
          opacity: 0;
          pointer-events: none;
          max-width: none;
        }

        .markdown-export {
          line-height: 1.7;
          color: #1f2937;
          font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
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

        .markdown-export h1,
        .markdown-export h2,
        .markdown-export h3,
        .markdown-export h4 {
          color: #111827;
        }

        .markdown-export pre {
          background: #0f172a;
          color: #e2e8f0;
          padding: 12px;
          border-radius: 12px;
          overflow-x: auto;
          font-size: 0.9rem;
        }

        .markdown-export table {
          width: 100%;
          border-collapse: collapse;
          margin: 16px 0;
        }

        .markdown-export th,
        .markdown-export td {
          border: 1px solid #e5e7eb;
          padding: 8px 12px;
          text-align: left;
        }

        .markdown-export blockquote {
          border-left: 4px solid #6366f1;
          margin: 16px 0;
          padding: 8px 16px;
          background: rgba(99, 102, 241, 0.08);
          color: #4338ca;
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
