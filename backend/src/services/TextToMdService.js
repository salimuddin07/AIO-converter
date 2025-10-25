/**
 * TEXT TO MARKDOWN CONVERSION SERVICE
 * Converts plain text files to properly formatted Markdown documents
 */

import fs from 'fs/promises';
import path from 'path';

class TextToMdService {
  constructor() {
    this.name = 'TextToMdService';
    this.supportedFormats = ['.txt', '.text'];
    this.outputFormat = '.md';
  }

  /**
   * Convert plain text to Markdown
   * @param {string} inputPath - Path to input text file
   * @param {object} options - Conversion options
   * @returns {Promise<object>} - Conversion result
   */
  async convertTextToMarkdown(inputPath, options = {}) {
    try {
      console.log('📝 Converting text to Markdown:', inputPath);

      // Read the input text file
      const textContent = await fs.readFile(inputPath, 'utf-8');
      
      // Process the text content
      const markdownContent = this.processTextToMarkdown(textContent, options);
      
      // Generate output filename
      const inputDir = path.dirname(inputPath);
      const baseName = path.basename(inputPath, path.extname(inputPath));
      const outputPath = path.join(inputDir, `${baseName}_converted.md`);
      
      // Write the Markdown file
      await fs.writeFile(outputPath, markdownContent, 'utf-8');
      
      // Get file stats
      const stats = await fs.stat(outputPath);
      
      console.log('✅ Text to Markdown conversion completed:', outputPath);
      
      return {
        success: true,
        outputPath,
        filename: path.basename(outputPath),
        size: stats.size,
        originalSize: textContent.length,
        compressionRatio: ((textContent.length - markdownContent.length) / textContent.length * 100).toFixed(2),
        message: 'Text successfully converted to Markdown'
      };
      
    } catch (error) {
      console.error('❌ Text to Markdown conversion failed:', error);
      throw new Error(`Text to Markdown conversion failed: ${error.message}`);
    }
  }

  /**
   * Process text content and convert to Markdown format
   * @param {string} textContent - Raw text content
   * @param {object} options - Processing options
   * @returns {string} - Formatted Markdown content
   */
  processTextToMarkdown(textContent, options = {}) {
    const {
      autoHeaders = true,
      autoParagraphs = true,
      autoLists = true,
      autoLinks = true,
      autoCodeBlocks = true,
      autoEmphasis = true,
      preserveLineBreaks = false,
      addFrontMatter = false,
      title = '',
      author = '',
      date = new Date().toISOString().split('T')[0]
    } = options;

    let markdown = textContent;

    // Add front matter if requested
    if (addFrontMatter) {
      const frontMatter = this.generateFrontMatter(title, author, date);
      markdown = frontMatter + '\n\n' + markdown;
    }

    // Auto-detect and convert headers
    if (autoHeaders) {
      markdown = this.convertHeaders(markdown);
    }

    // Auto-detect and convert lists
    if (autoLists) {
      markdown = this.convertLists(markdown);
    }

    // Auto-detect and convert links
    if (autoLinks) {
      markdown = this.convertLinks(markdown);
    }

    // Auto-detect and convert code blocks
    if (autoCodeBlocks) {
      markdown = this.convertCodeBlocks(markdown);
    }

    // Auto-detect and convert emphasis
    if (autoEmphasis) {
      markdown = this.convertEmphasis(markdown);
    }

    // Handle paragraphs
    if (autoParagraphs) {
      markdown = this.convertParagraphs(markdown, preserveLineBreaks);
    }

    return markdown.trim();
  }

  /**
   * Generate YAML front matter
   */
  generateFrontMatter(title, author, date) {
    return `---
title: "${title || 'Converted Document'}"
author: "${author || 'Unknown'}"
date: ${date}
---`;
  }

  /**
   * Convert text headers to Markdown headers
   */
  convertHeaders(text) {
    // Convert lines that are all caps or have specific patterns
    return text.replace(/^([A-Z][A-Z\s]{2,})$/gm, '# $1')
             .replace(/^(\d+\.\s+[A-Z].*?)$/gm, '## $1')
             .replace(/^([A-Z][a-z]+.*?):$/gm, '### $1')
             .replace(/^(-{3,}|={3,})$/gm, '---');
  }

  /**
   * Convert text lists to Markdown lists
   */
  convertLists(text) {
    // Convert numbered lists
    text = text.replace(/^\s*(\d+)[\.\)]\s+(.+)$/gm, '$1. $2');
    
    // Convert bullet points
    text = text.replace(/^\s*[\*\-\+•]\s+(.+)$/gm, '- $1');
    
    // Convert simple dashes
    text = text.replace(/^\s*-\s+(.+)$/gm, '- $1');
    
    return text;
  }

  /**
   * Convert URLs to Markdown links
   */
  convertLinks(text) {
    // Convert bare URLs
    text = text.replace(/(https?:\/\/[^\s]+)/g, '<$1>');
    
    // Convert email addresses
    text = text.replace(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g, '<$1>');
    
    return text;
  }

  /**
   * Convert code blocks
   */
  convertCodeBlocks(text) {
    // Convert indented code blocks
    text = text.replace(/^(    .+)$/gm, '    $1');
    
    // Convert code between specific markers
    text = text.replace(/```([\s\S]*?)```/g, '```\n$1\n```');
    
    // Convert inline code (words in backticks or quotes)
    text = text.replace(/`([^`]+)`/g, '`$1`');
    
    return text;
  }

  /**
   * Convert emphasis (bold, italic)
   */
  convertEmphasis(text) {
    // Convert *bold* or **bold** text
    text = text.replace(/\*\*([^*]+)\*\*/g, '**$1**');
    text = text.replace(/\*([^*]+)\*/g, '*$1*');
    
    // Convert _italic_ text
    text = text.replace(/_([^_]+)_/g, '_$1_');
    
    // Convert ALL CAPS to bold (for emphasis)
    text = text.replace(/\b([A-Z]{3,})\b/g, '**$1**');
    
    return text;
  }

  /**
   * Convert paragraphs
   */
  convertParagraphs(text, preserveLineBreaks) {
    if (preserveLineBreaks) {
      // Add two spaces at the end of lines for line breaks
      return text.replace(/$/gm, '  ');
    } else {
      // Ensure proper paragraph spacing
      return text.replace(/\n\n+/g, '\n\n');
    }
  }

  /**
   * Validate input file
   */
  async validateInput(filePath) {
    try {
      const stats = await fs.stat(filePath);
      
      if (!stats.isFile()) {
        throw new Error('Input path is not a file');
      }
      
      const ext = path.extname(filePath).toLowerCase();
      if (!this.supportedFormats.includes(ext)) {
        throw new Error(`Unsupported file format: ${ext}. Supported formats: ${this.supportedFormats.join(', ')}`);
      }
      
      return true;
    } catch (error) {
      throw new Error(`File validation failed: ${error.message}`);
    }
  }

  /**
   * Get supported file extensions
   */
  getSupportedFormats() {
    return this.supportedFormats;
  }

  /**
   * Get service information
   */
  getInfo() {
    return {
      name: this.name,
      supportedFormats: this.supportedFormats,
      outputFormat: this.outputFormat,
      description: 'Converts plain text files to formatted Markdown documents'
    };
  }
}

export default new TextToMdService();