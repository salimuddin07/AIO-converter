import React, { useState, useMemo } from 'react';

const SAMPLE_TEXT = `AIO Convert - Professional Media Converter

This is a sample text that will be converted to Markdown format.

Key Features:
- Convert text to Markdown automatically
- Smart detection of headers and formatting
- Support for lists and emphasis
- Preserve important formatting

Technical Details

The converter uses intelligent parsing to detect:
* Headers based on capitalization and position
* Lists with bullets or numbers  
* Links in text format
* Code blocks and inline code
* Bold and italic emphasis

Example Code:
function convertText() {
  return "Converted to Markdown!";
}

For more information, visit our website at https://example.com

Contact us at support@example.com for assistance.`;

const TEXT_HINT = `Paste your plain text here and it will be automatically converted to Markdown format with smart detection of headers, lists, links, and more.`;

export default function TextToMdConverter() {
  const [text, setText] = useState(SAMPLE_TEXT);
  const [fileName, setFileName] = useState('converted-text');
  const [options, setOptions] = useState({
    autoHeaders: true,
    autoParagraphs: true,
    autoLists: true,
    autoLinks: true,
    autoCodeBlocks: true,
    autoEmphasis: true,
    preserveLineBreaks: false,
    addFrontMatter: false,
    title: '',
    author: '',
    date: new Date().toISOString().split('T')[0]
  });

  const processTextToMarkdown = (inputText, opts) => {
    if (!inputText.trim()) return '';

    let result = inputText;

    // Add YAML front matter if requested
    if (opts.addFrontMatter && (opts.title || opts.author || opts.date)) {
      let frontMatter = '---\n';
      if (opts.title) frontMatter += `title: "${opts.title}"\n`;
      if (opts.author) frontMatter += `author: "${opts.author}"\n`;
      if (opts.date) frontMatter += `date: "${opts.date}"\n`;
      frontMatter += '---\n\n';
      result = frontMatter + result;
    }

    // Step 1: Pre-process and analyze the text structure
    const lines = result.split('\n');
    const analyzedLines = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      const nextLine = i + 1 < lines.length ? lines[i + 1].trim() : '';
      const prevLine = i > 0 ? lines[i - 1].trim() : '';
      
      if (!trimmed) {
        analyzedLines.push({ type: 'empty', content: '', original: line });
        continue;
      }

      // Analyze line type
      let lineType = 'paragraph';
      let content = trimmed;

      // Check for existing markdown
      if (trimmed.match(/^#{1,6}\s/)) {
        lineType = 'header';
      } else if (trimmed.match(/^[-*+]\s/) || trimmed.match(/^\d+\.\s/)) {
        lineType = 'list';
      } else if (trimmed.match(/^```/)) {
        lineType = 'code_fence';
      } else if (trimmed.match(/^[>\|]/)) {
        lineType = 'quote';
      }
      // Header detection
      else if (opts.autoHeaders) {
        // ALL CAPS titles (main headers)
        if (trimmed.length > 3 && trimmed === trimmed.toUpperCase() && 
            /^[A-Z\s\d\-_.,!?:()]+$/.test(trimmed) && 
            !trimmed.includes('```')) {
          lineType = 'header';
          content = `# ${trimmed}`;
        }
        // Title case lines followed by empty line or end (section headers)
        else if (/^[A-Z][a-zA-Z0-9\s\-_.,!?:()]{2,80}$/.test(trimmed) && 
                 (nextLine === '' || i === lines.length - 1) &&
                 !trimmed.endsWith('.') && !trimmed.endsWith(',')) {
          lineType = 'header';
          content = `## ${trimmed}`;
        }
        // Numbered sections
        else if (trimmed.match(/^\d+[\.)]\s+[A-Z]/)) {
          lineType = 'header';
          content = `### ${trimmed}`;
        }
        // Question headers
        else if (trimmed.match(/^(What|How|Why|When|Where|Who|Which)\s.*[?]?$/i)) {
          lineType = 'header';
          content = `### ${trimmed}`;
        }
      }
      // List detection
      else if (opts.autoLists) {
        // Various bullet indicators
        if (trimmed.match(/^[•·‣⁃○▪▫►‰→➤➜▶]\s/)) {
          lineType = 'list';
          content = trimmed.replace(/^[•·‣⁃○▪▫►‰→➤➜▶]\s/, '- ');
        }
        // Dash items (but not separators)
        else if (trimmed.match(/^-\s+[a-zA-Z]/) && !trimmed.match(/^-{3,}/)) {
          lineType = 'list';
          content = trimmed;
        }
        // Numbered/lettered items
        else if (trimmed.match(/^[a-zA-Z0-9]+[\.)]\s+/)) {
          lineType = 'list';
          const match = trimmed.match(/^([a-zA-Z0-9]+)[\.)]\s+(.+)$/);
          if (match) content = `${match[1]}. ${match[2]}`;
        }
        // Step indicators
        else if (trimmed.match(/^(Step|Phase|Stage|Part)\s*\d+[:\-.]?\s*/i)) {
          lineType = 'list';
          content = trimmed.replace(/^(Step|Phase|Stage|Part)\s*(\d+)[:\-.]?\s*/i, '$2. ');
        }
      }

      analyzedLines.push({ 
        type: lineType, 
        content: content, 
        original: line,
        indent: line.match(/^(\s*)/)[1]
      });
    }

    // Step 2: Process analyzed lines and apply formatting
    const processedLines = analyzedLines.map(lineObj => {
      if (lineObj.type === 'empty') return '';
      if (lineObj.type === 'header' || lineObj.type === 'list' || lineObj.type === 'code_fence' || lineObj.type === 'quote') {
        return lineObj.indent + lineObj.content;
      }

      let processed = lineObj.content;

      // Apply inline formatting to paragraph text
      if (opts.autoCodeBlocks) {
        // Code-like patterns with language detection
        processed = processed
          // File extensions with syntax highlighting
          .replace(/\b([a-zA-Z0-9_\-\.]+\.(js|jsx|ts|tsx|py|java|cpp|c|html|css|json|xml|yml|yaml|md|txt|php|rb|go|rs|swift))\b/g, '`$1`')
          // Function calls
          .replace(/\b([a-zA-Z_][a-zA-Z0-9_]*)\(\)/g, '`$1()`')
          // camelCase variables
          .replace(/\b([a-z]+[A-Z][a-zA-Z0-9]*)\b/g, '`$1`')
          // snake_case variables
          .replace(/\b([a-zA-Z_][a-zA-Z0-9_]*_[a-zA-Z0-9_]+)\b/g, '`$1`')
          // API endpoints
          .replace(/\/(api|v1|v2)\/[a-zA-Z0-9\-_\/]+/g, '`$&`')
          // Environment variables
          .replace(/\b[A-Z][A-Z0-9_]{2,}\b/g, (match) => {
            if (match.length > 8) return `\`${match}\``;
            return match;
          });
      }

      if (opts.autoLinks) {
        // Convert URLs with meaningful titles
        processed = processed.replace(/(https?:\/\/[^\s\)]+)/g, (match) => {
          try {
            const url = new URL(match);
            const domain = url.hostname.replace('www.', '');
            const path = url.pathname.slice(1);
            const title = path ? `${domain}/${path}` : domain;
            return `[${title}](${match})`;
          } catch {
            return `[Link](${match})`;
          }
        });
        
        // Convert email addresses
        processed = processed.replace(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g, '[$1](mailto:$1)');
      }

      if (opts.autoEmphasis) {
        // Important keywords
        processed = processed.replace(/\b(IMPORTANT|NOTE|WARNING|CAUTION|TIP|ATTENTION|NOTICE|ERROR|SUCCESS|INFO)\b/g, '**$1**');
        
        // Existing emphasis patterns
        processed = processed.replace(/(?<![*_`])\*([^*\s][^*]*?[^*\s])\*(?![*_`])/g, '**$1**');
        processed = processed.replace(/(?<![*_`])_([^_\s][^_]*?[^_\s])_(?![*_`])/g, '_$1_');
        
        // Quoted text
        processed = processed.replace(/"([^"]+)"/g, '_"$1"_');
        
        // Strong emphasis for ALL CAPS words (but not code or headers)
        processed = processed.replace(/(?<!`|#\s*)\b([A-Z]{3,})\b(?!`)/g, '**$1**');
      }

      return lineObj.indent + processed;
    });

    result = processedLines.join('\n');

    // Step 3: Post-process for code blocks and special formatting
    if (opts.autoCodeBlocks) {
      // Detect command-line patterns and wrap in code blocks
      result = result.replace(/^(\s*)(npm|yarn|git|docker|python|node|cd|ls|mkdir|cp|mv|curl|wget|pip|apt|brew|sudo)\s+[^\n]+$/gm, (match, indent, cmd) => {
        return `${indent}\`\`\`bash\n${match.trim()}\n\`\`\``;
      });
      
      // Multi-line indented code blocks
      result = result.replace(/^(    .+$\n?)+/gm, (match) => {
        const code = match.replace(/^    /gm, '').trim();
        // Try to detect language from content
        let language = '';
        if (code.includes('function') || code.includes('const') || code.includes('let')) language = 'javascript';
        else if (code.includes('def ') || code.includes('import ')) language = 'python';
        else if (code.includes('#include') || code.includes('int main')) language = 'c';
        else if (code.includes('public class') || code.includes('System.out')) language = 'java';
        
        return `\n\`\`\`${language}\n${code}\n\`\`\`\n\n`;
      });
    }

    // Step 4: Clean up spacing and structure
    if (opts.autoParagraphs) {
      // Proper spacing around different elements
      result = result
        // Space around headers
        .replace(/\n(#{1,6}\s)/g, '\n\n$1')
        .replace(/(#{1,6}\s[^\n]+)\n([^\n#])/g, '$1\n\n$2')
        // Space around code blocks
        .replace(/\n```/g, '\n\n```')
        .replace(/```\n([^\n])/g, '```\n\n$1')
        // Space around lists
        .replace(/\n(\s*[-*+]\s)/g, '\n\n$1')
        .replace(/\n(\s*\d+\.\s)/g, '\n\n$1')
        // Paragraph breaks
        .replace(/([.!?])\n([A-Z])/g, '$1\n\n$2')
        // Clean excessive spacing
        .replace(/\n{4,}/g, '\n\n\n')
        .replace(/^\n+/, '')
        .replace(/\n+$/, '');
    }

    // Preserve line breaks if requested
    if (opts.preserveLineBreaks) {
      result = result.replace(/\n/g, '  \n');
    }

    return result;
  };

  const convertedMarkdown = useMemo(() => {
    if (!text.trim()) return '';
    
    try {
      return processTextToMarkdown(text, options);
    } catch (err) {
      console.error('Conversion error:', err);
      return 'Error converting text to Markdown';
    }
  }, [text, options]);

  const handleOptionChange = (optionName, value) => {
    setOptions(prev => ({
      ...prev,
      [optionName]: value
    }));
  };

  const handleDownload = () => {
    if (!convertedMarkdown) return;
    
    const blob = new Blob([convertedMarkdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${fileName || 'converted-text'}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopy = async () => {
    if (!convertedMarkdown) return;
    
    try {
      await navigator.clipboard.writeText(convertedMarkdown);
      console.log('Markdown copied to clipboard');
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const handleClear = () => {
    setText('');
  };

  const handleLoadSample = () => {
    setText(SAMPLE_TEXT);
  };

  return (
    <div className="text-to-md-converter">
      <div className="converter-header">
        <h1>📄 Text to Markdown Converter</h1>
        <p>Convert plain text to formatted Markdown with intelligent detection of headers, lists, and formatting.</p>
      </div>

      <div className="converter-layout">
        <div className="input-section">
          <div className="input-controls">
            <h3>Input Text</h3>
            <div className="text-controls">
              <button onClick={handleLoadSample} className="btn-secondary">
                Load Sample
              </button>
              <button onClick={handleClear} className="btn-secondary">
                Clear Text
              </button>
            </div>
          </div>
          
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={TEXT_HINT}
            className="text-input"
            rows="20"
          />
          
          <div className="char-count">
            {text.length} characters
          </div>
        </div>

        <div className="options-section">
          <h3>Conversion Options</h3>
          
          <div className="options-grid">
            <label className="option-item">
              <input
                type="checkbox"
                checked={options.autoHeaders}
                onChange={(e) => handleOptionChange('autoHeaders', e.target.checked)}
              />
              <span>Auto-detect Headers</span>
            </label>

            <label className="option-item">
              <input
                type="checkbox"
                checked={options.autoLists}
                onChange={(e) => handleOptionChange('autoLists', e.target.checked)}
              />
              <span>Auto-detect Lists</span>
            </label>

            <label className="option-item">
              <input
                type="checkbox"
                checked={options.autoLinks}
                onChange={(e) => handleOptionChange('autoLinks', e.target.checked)}
              />
              <span>Auto-detect Links</span>
            </label>

            <label className="option-item">
              <input
                type="checkbox"
                checked={options.autoCodeBlocks}
                onChange={(e) => handleOptionChange('autoCodeBlocks', e.target.checked)}
              />
              <span>Auto-detect Code</span>
            </label>

            <label className="option-item">
              <input
                type="checkbox"
                checked={options.autoEmphasis}
                onChange={(e) => handleOptionChange('autoEmphasis', e.target.checked)}
              />
              <span>Auto-detect Emphasis</span>
            </label>

            <label className="option-item">
              <input
                type="checkbox"
                checked={options.autoParagraphs}
                onChange={(e) => handleOptionChange('autoParagraphs', e.target.checked)}
              />
              <span>Auto Paragraphs</span>
            </label>

            <label className="option-item">
              <input
                type="checkbox"
                checked={options.preserveLineBreaks}
                onChange={(e) => handleOptionChange('preserveLineBreaks', e.target.checked)}
              />
              <span>Preserve Line Breaks</span>
            </label>

            <label className="option-item">
              <input
                type="checkbox"
                checked={options.addFrontMatter}
                onChange={(e) => handleOptionChange('addFrontMatter', e.target.checked)}
              />
              <span>Add YAML Front Matter</span>
            </label>
          </div>

          {options.addFrontMatter && (
            <div className="front-matter-options">
              <h4>Front Matter</h4>
              <div className="form-group">
                <label>Title:</label>
                <input
                  type="text"
                  value={options.title}
                  onChange={(e) => handleOptionChange('title', e.target.value)}
                  placeholder="Document title"
                />
              </div>
              <div className="form-group">
                <label>Author:</label>
                <input
                  type="text"
                  value={options.author}
                  onChange={(e) => handleOptionChange('author', e.target.value)}
                  placeholder="Author name"
                />
              </div>
              <div className="form-group">
                <label>Date:</label>
                <input
                  type="date"
                  value={options.date}
                  onChange={(e) => handleOptionChange('date', e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="export-section">
            <h4>Export Options</h4>
            <div className="form-group">
              <label>Filename:</label>
              <input
                type="text"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="converted-text"
              />
            </div>
            
            <div className="export-buttons">
              <button 
                onClick={handleDownload} 
                className="btn-primary"
                disabled={!convertedMarkdown}
              >
                📥 Download MD
              </button>
              <button 
                onClick={handleCopy} 
                className="btn-secondary"
                disabled={!convertedMarkdown}
              >
                📋 Copy to Clipboard
              </button>
            </div>
          </div>
        </div>

        <div className="preview-section">
          <h3>Markdown Preview</h3>
          <div className="preview-container">
            <pre className="markdown-preview">{convertedMarkdown}</pre>
          </div>
        </div>
      </div>

      <style>{`
        .text-to-md-converter {
          max-width: 1400px;
          margin: 0 auto;
          padding: 20px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }

        .converter-header {
          text-align: center;
          margin-bottom: 30px;
        }

        .converter-header h1 {
          color: #2c3e50;
          margin-bottom: 10px;
        }

        .converter-header p {
          color: #666;
          font-size: 16px;
        }

        .converter-layout {
          display: grid;
          grid-template-columns: 1fr 300px 1fr;
          gap: 20px;
          min-height: 600px;
        }

        .input-section {
          display: flex;
          flex-direction: column;
        }

        .input-controls {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }

        .input-controls h3 {
          margin: 0;
          color: #2c3e50;
        }

        .text-controls {
          display: flex;
          gap: 10px;
        }

        .text-input {
          flex: 1;
          padding: 15px;
          border: 2px solid #e1e5e9;
          border-radius: 8px;
          font-family: 'Courier New', monospace;
          font-size: 14px;
          line-height: 1.5;
          resize: vertical;
          min-height: 500px;
        }

        .text-input:focus {
          outline: none;
          border-color: #007bff;
        }

        .char-count {
          margin-top: 5px;
          font-size: 12px;
          color: #666;
          text-align: right;
        }

        .options-section {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          border: 1px solid #e1e5e9;
        }

        .options-section h3, .options-section h4 {
          margin-top: 0;
          margin-bottom: 15px;
          color: #2c3e50;
        }

        .options-grid {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-bottom: 20px;
        }

        .option-item {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          font-size: 14px;
        }

        .option-item input[type="checkbox"] {
          margin: 0;
        }

        .front-matter-options {
          background: white;
          padding: 15px;
          border-radius: 6px;
          border: 1px solid #e1e5e9;
          margin-bottom: 20px;
        }

        .front-matter-options h4 {
          margin-top: 0;
          margin-bottom: 10px;
        }

        .form-group {
          margin-bottom: 10px;
        }

        .form-group label {
          display: block;
          margin-bottom: 5px;
          font-weight: 500;
          color: #555;
        }

        .form-group input {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
        }

        .export-section {
          border-top: 1px solid #e1e5e9;
          padding-top: 20px;
        }

        .export-buttons {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-top: 15px;
        }

        .preview-section {
          display: flex;
          flex-direction: column;
        }

        .preview-section h3 {
          margin-top: 0;
          margin-bottom: 15px;
          color: #2c3e50;
        }

        .preview-container {
          flex: 1;
          border: 2px solid #e1e5e9;
          border-radius: 8px;
          overflow: hidden;
        }

        .markdown-preview {
          width: 100%;
          height: 100%;
          min-height: 500px;
          padding: 15px;
          margin: 0;
          font-family: 'Courier New', monospace;
          font-size: 14px;
          line-height: 1.5;
          background: #f8f9fa;
          border: none;
          white-space: pre-wrap;
          overflow-y: auto;
        }

        .btn-primary {
          background: #007bff;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
          transition: background-color 0.2s;
        }

        .btn-primary:hover:not(:disabled) {
          background: #0056b3;
        }

        .btn-primary:disabled {
          background: #6c757d;
          cursor: not-allowed;
        }

        .btn-secondary {
          background: #6c757d;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
          transition: background-color 0.2s;
          font-size: 14px;
        }

        .btn-secondary:hover:not(:disabled) {
          background: #545b62;
        }

        .btn-secondary:disabled {
          background: #adb5bd;
          cursor: not-allowed;
        }

        @media (max-width: 1200px) {
          .converter-layout {
            grid-template-columns: 1fr;
            gap: 20px;
          }
          
          .options-section {
            order: -1;
          }
        }

        @media (max-width: 768px) {
          .text-controls {
            flex-direction: column;
            gap: 5px;
          }
          
          .input-controls {
            flex-direction: column;
            align-items: flex-start;
            gap: 10px;
          }
          
          .export-buttons {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}