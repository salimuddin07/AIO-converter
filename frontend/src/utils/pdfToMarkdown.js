import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

GlobalWorkerOptions.workerSrc = pdfjsWorker;

// pdf to md converter is ready to run
class LocalPdfProcessor {
  constructor() {
    this.isReady = true;
  }

  async initializePdfJs() {
    if (!this.isReady) {
      this.isReady = true;
    }
    return true;
  }

  async convertPdfToMarkdown(file, onProgress) {
    try {
  await this.initializePdfJs();

      const arrayBuffer = await this.fileToArrayBuffer(file);
  const pdf = await getDocument({ data: arrayBuffer }).promise;
      
      const totalPages = pdf.numPages;
      let markdownContent = '';
      
      const fileName = file.name.replace(/\.[^/.]+$/, '');
      markdownContent += `# ${fileName}\n\n`;
      markdownContent += `*Converted from PDF - ${totalPages} page${totalPages > 1 ? 's' : ''}*\n\n`;
      markdownContent += `---\n\n`;

      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        try {
          if (onProgress && typeof onProgress === 'function') {
            onProgress((pageNum / totalPages) * 100, `Processing page ${pageNum} of ${totalPages}`);
          }
          
          const page = await pdf.getPage(pageNum);
          const textContent = await page.getTextContent();
          
          console.log(`Page ${pageNum} text items:`, textContent.items.length); // Debug log
          
          if (totalPages > 1) {
            markdownContent += `## Page ${pageNum}\n\n`;
          }
          
          const pageText = this.extractTextFromPage(textContent);
          console.log(`Page ${pageNum} extracted text length:`, pageText.length); // Debug log
          
          if (pageText && pageText.trim()) {
            markdownContent += pageText + '\n\n';
          } else {
            console.warn(`No text found on page ${pageNum}`);
            markdownContent += `*[No readable text found on page ${pageNum}]*\n\n`;
          }
          
        } catch (pageError) {
          console.error(`Error processing page ${pageNum}:`, pageError);
          markdownContent += `*[Error processing page ${pageNum}: ${pageError.message}]*\n\n`;
        }
      }

      console.log('Total markdown length:', markdownContent.length); // Debug log
      return markdownContent;
      
    } catch (error) {
      console.error('PDF conversion error:', error);
      throw new Error(`Failed to convert PDF: ${error.message}`);
    }
  }

  extractTextFromPage(textContent) {
    if (!textContent || !textContent.items || textContent.items.length === 0) {
      return '';
    }

    // Get all text items from the page
    const items = textContent.items;
    
    // Simple approach: just concatenate all text items with proper spacing
    let allText = '';
    
    // Sort items by their vertical position (Y coordinate) first, then horizontal (X coordinate)
    const sortedItems = items.sort((a, b) => {
      const yDiff = Math.round(b.transform[5]) - Math.round(a.transform[5]); // Y position (higher values = higher on page)
      if (Math.abs(yDiff) > 5) { // Different lines (with 5px tolerance)
        return yDiff;
      }
      return Math.round(a.transform[4]) - Math.round(b.transform[4]); // X position (left to right)
    });

    let currentLine = '';
    let lastY = null;
    let lastX = null;
    
    for (let i = 0; i < sortedItems.length; i++) {
      const item = sortedItems[i];
      const text = item.str || '';
      const y = Math.round(item.transform[5]);
      const x = Math.round(item.transform[4]);
      
      // Skip empty strings
      if (!text.trim()) continue;
      
      // Check if we're starting a new line
      const isNewLine = lastY !== null && Math.abs(y - lastY) > 5;
      
      if (isNewLine) {
        // Add the completed line to allText
        if (currentLine.trim()) {
          allText += currentLine.trim() + '\n';
        }
        currentLine = text;
      } else {
        // Same line - add spacing if needed
        if (currentLine) {
          // Add space if there's a significant gap between text items
          const needSpace = lastX !== null && (x - lastX) > 10;
          if (needSpace && !currentLine.endsWith(' ') && !text.startsWith(' ')) {
            currentLine += ' ';
          }
        }
        currentLine += text;
      }
      
      lastY = y;
      lastX = x + (text.length * 6); // Estimate text width
    }
    
    // Add the final line
    if (currentLine.trim()) {
      allText += currentLine.trim() + '\n';
    }
    
    // Clean up the text
    allText = allText
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/\n\s*\n/g, '\n\n') // Replace multiple newlines with double newline
      .trim();
    
    return allText;
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
