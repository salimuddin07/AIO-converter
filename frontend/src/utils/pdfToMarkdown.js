class LocalPdfProcessor {
  constructor() {
    this.isReady = false;
    this.initializePdfJs();
  }

  async initializePdfJs() {
    if (typeof pdfjsLib === 'undefined') {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      document.head.appendChild(script);
      
      await new Promise((resolve) => {
        script.onload = resolve;
      });
      
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    }
    this.isReady = true;
  }

  async convertPdfToMarkdown(file, onProgress) {
    try {
      await this.initializePdfJs();
      
      const arrayBuffer = await this.fileToArrayBuffer(file);
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      const totalPages = pdf.numPages;
      let markdownContent = '';
      
      const fileName = file.name.replace(/\.[^/.]+$/, '');
      markdownContent += `# ${fileName}\n\n`;
      markdownContent += `*Converted from PDF - ${totalPages} page${totalPages > 1 ? 's' : ''}*\n\n`;
      markdownContent += `---\n\n`;

      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        try {
          const page = await pdf.getPage(pageNum);
          const textContent = await page.getTextContent();
          
          if (onProgress && typeof onProgress === 'function') {
            onProgress((pageNum / totalPages) * 100, `Processing page ${pageNum} of ${totalPages}`);
          }
          
          if (totalPages > 1) {
            markdownContent += `## Page ${pageNum}\n\n`;
          }
          
          const pageText = this.extractTextFromPage(textContent);
          
          if (pageText && pageText.trim()) {
            markdownContent += pageText + '\n\n';
          } else {
            markdownContent += `*[No text content found on this page]*\n\n`;
          }
          
        } catch (pageError) {
          console.error(`Error processing page ${pageNum}:`, pageError);
          markdownContent += `*[Error processing page ${pageNum}: ${pageError.message}]*\n\n`;
        }
      }

      return markdownContent;
    } catch (error) {
      console.error('PDF conversion error:', error);
      throw new Error(`Failed to convert PDF: ${error.message}`);
    }
  }

  extractTextFromPage(textContent) {
    if (!textContent || !textContent.items) {
      return '';
    }

    const items = textContent.items;
    let text = '';
    
    // Simple approach: sort items by Y position (top to bottom), then by X position (left to right)
    const sortedItems = items.sort((a, b) => {
      const yDiff = b.transform[5] - a.transform[5]; // Y position (top to bottom)
      if (Math.abs(yDiff) > 2) { // Different lines
        return yDiff;
      }
      return a.transform[4] - b.transform[4]; // Same line, sort by X position (left to right)
    });

    let currentLine = '';
    let lastY = null;
    
    for (const item of sortedItems) {
      const itemText = item.str || '';
      const itemY = Math.round(item.transform[5]);
      
      // Skip empty text
      if (!itemText.trim()) continue;
      
      // Check if we're on a new line
      if (lastY !== null && Math.abs(lastY - itemY) > 2) {
        // New line detected, add the previous line to text
        if (currentLine.trim()) {
          text += this.formatTextLine(currentLine.trim()) + '\n';
        }
        currentLine = itemText;
      } else {
        // Same line, concatenate text
        if (currentLine && !currentLine.endsWith(' ') && !itemText.startsWith(' ')) {
          currentLine += ' ';
        }
        currentLine += itemText;
      }
      
      lastY = itemY;
    }
    
    // Add the last line
    if (currentLine.trim()) {
      text += this.formatTextLine(currentLine.trim()) + '\n';
    }
    
    return this.postProcessText(text);
  }

  formatTextLine(line) {
    if (!line || !line.trim()) return '';
    
    line = line.trim();
    
    // Detect headers (all caps, short lines, numbered sections, etc.)
    if (this.isLikelyHeader(line)) {
      return `### ${line}`;
    }
    
    // Detect bullet points
    if (/^[\-\*\•]\s+/.test(line)) {
      return `- ${line.replace(/^[\-\*\•]\s*/, '')}`;
    }
    
    // Detect numbered lists
    if (/^\d+[\.\)]\s+/.test(line)) {
      return line.replace(/^(\d+)[\.\)]\s*/, '$1. ');
    }
    
    // Regular text paragraph
    return line;
  }

  isLikelyHeader(line) {
    return (
      /^[A-Z][A-Z\s]{3,}$/.test(line) ||
      /^\d+\.\s+[A-Z]/.test(line) ||
      /^Chapter\s+\d+/i.test(line)
    ) && line.length < 100;
  }

  postProcessText(text) {
    text = text.replace(/\n{3,}/g, '\n\n');
    text = text.replace(/[ \t]+/g, ' ');
    return text.trim();
  }

  fileToArrayBuffer(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }
}

export const pdfProcessor = new LocalPdfProcessor();
