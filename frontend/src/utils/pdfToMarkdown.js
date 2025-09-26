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
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      if (onProgress && typeof onProgress === 'function') {
        onProgress((pageNum / totalPages) * 100, `Processing page ${pageNum} of ${totalPages}`);
      }
      
      if (totalPages > 1) {
        markdownContent += `## Page ${pageNum}\n\n`;
      }
      
      const pageText = this.extractTextFromPage(textContent);
      markdownContent += pageText + '\n\n';
    }

    return markdownContent;
  }

  extractTextFromPage(textContent) {
    const items = textContent.items;
    let text = '';
    let currentY = null;
    let lineText = '';
    
    const sortedItems = items.sort((a, b) => {
      if (Math.abs(a.transform[5] - b.transform[5]) > 5) {
        return b.transform[5] - a.transform[5];
      }
      return a.transform[4] - b.transform[4];
    });

    for (const item of sortedItems) {
      const itemY = Math.round(item.transform[5]);
      const itemText = item.str.trim();
      
      if (!itemText) continue;
      
      if (currentY === null || Math.abs(currentY - itemY) > 5) {
        if (lineText.trim()) {
          text += this.formatTextLine(lineText.trim()) + '\n';
        }
        lineText = itemText;
        currentY = itemY;
      } else {
        if (lineText && !lineText.endsWith(' ') && !itemText.startsWith(' ')) {
          lineText += ' ';
        }
        lineText += itemText;
      }
    }
    
    if (lineText.trim()) {
      text += this.formatTextLine(lineText.trim()) + '\n';
    }
    
    return this.postProcessText(text);
  }

  formatTextLine(line) {
    if (!line.trim()) return '';
    
    if (this.isLikelyHeader(line)) {
      return `### ${line}`;
    }
    
    if (/^[\-\*]\s+/.test(line)) {
      return `- ${line.replace(/^[\-\*]\s*/, '')}`;
    }
    
    if (/^\d+[\.\)]\s+/.test(line)) {
      return line.replace(/^(\d+)[\.\)]\s*/, '$1. ');
    }
    
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
