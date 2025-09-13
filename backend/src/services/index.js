// ============================================================================
// UNIFIED SERVICE REGISTRY - Strategic Library Integration
// ============================================================================
// This module provides centralized access to all specialized services,
// each optimized for specific use cases based on their core strengths
// ============================================================================

// Core existing services
import FFmpegService from './ffmpegService.js';
import SharpService from './SharpService.js';
import JimpService from './JimpService.js';
import GifService, { gifService } from './gifService.js';
import ImageMagickService from './ImageMagickService.js';
import EnhancedConversionService, { enhancedConversionService } from './EnhancedConversionService.js';

// New specialized services
import EnhancedJimpService from './EnhancedJimpService.js';
import WebPService from './WebPService.js';
import MediaAnalysisService from './MediaAnalysisService.js';
import CanvasGraphicsService from './CanvasGraphicsService.js';
import VideoJSService from './VideoJSService.js';

// ============================================================================
// SERVICE INSTANCES - Ready-to-use singleton instances
// ============================================================================

// Core services
const ffmpegService = new FFmpegService();
const sharpService = new SharpService();
const jimpService = new JimpService();
const imageMagickService = new ImageMagickService();

// Specialized services for strategic library integration
const enhancedJimpService = new EnhancedJimpService();
const webPService = new WebPService();
const mediaAnalysisService = new MediaAnalysisService();
const canvasGraphicsService = new CanvasGraphicsService();
const videoJSService = new VideoJSService();

// ============================================================================
// SERVICE RECOMMENDATIONS - When to use which service
// ============================================================================

/**
 * SERVICE USAGE GUIDE:
 * 
 * JIMP SERVICES (Pure JavaScript - No Native Dependencies)
 * - JimpService: Basic image operations, cross-platform compatibility
 * - EnhancedJimpService: Advanced compositions, crossfades, styled text
 * 
 * SHARP SERVICE (High Performance Native)
 * - SharpService: Fast conversions, memory efficient, production workloads
 * 
 * WEBP SERVICES (Modern Web Optimization)
 * - WebPService: WebP conversion, animated WebP, modern compression
 * 
 * VIDEO SERVICES (Multimedia Processing)
 * - FFmpegService: Video conversion, frame extraction, multimedia
 * - VideoJSService: Web player integration, streaming optimization
 * - MediaAnalysisService: Video metadata, quality assessment, compatibility
 * 
 * GRAPHICS SERVICES (Custom Graphics Creation)
 * - CanvasGraphicsService: Complex compositions, watermarks, custom graphics
 * - ImageMagickService: Legacy format support, advanced effects
 * 
 * GIF SERVICES (Animation Creation)
 * - GifService: GIF creation and optimization
 * 
 * CONVERSION ORCHESTRATION
 * - EnhancedConversionService: Multi-format batch processing
 */

// ============================================================================
// SMART SERVICE SELECTOR - Automatic best service selection
// ============================================================================

class ServiceSelector {
  /**
   * Get the best service for a specific task
   */
  static getBestServiceFor(task, inputFormat = null, outputFormat = null) {
    const recommendations = {
      // Image conversion tasks
      'fast-conversion': sharpService,
      'cross-platform-conversion': enhancedJimpService,
      'webp-conversion': webPService,
      'batch-conversion': enhancedConversionService,
      
      // Image manipulation tasks
      'basic-resize': sharpService,
      'advanced-composition': canvasGraphicsService,
      'crossfade-effects': enhancedJimpService,
      'watermarking': canvasGraphicsService,
      'text-overlay': enhancedJimpService,
      
      // Video tasks
      'video-conversion': ffmpegService,
      'video-analysis': mediaAnalysisService,
      'web-video-optimization': videoJSService,
      'frame-extraction': ffmpegService,
      
      // Animation tasks
      'gif-creation': gifService,
      'animated-webp': webPService,
      
      // Web optimization
      'web-optimization': webPService,
      'responsive-images': sharpService,
      'streaming-setup': videoJSService
    };
    
    return recommendations[task] || enhancedConversionService;
  }

  /**
   * Get services by capability
   */
  static getServicesByCapability(capability) {
    const capabilities = {
      'image-conversion': [sharpService, enhancedJimpService, imageMagickService],
      'video-processing': [ffmpegService, videoJSService, mediaAnalysisService],
      'web-optimization': [webPService, sharpService, videoJSService],
      'graphics-creation': [canvasGraphicsService, enhancedJimpService],
      'animation': [gifService, webPService],
      'analysis': [mediaAnalysisService],
      'batch-processing': [enhancedConversionService, webPService, enhancedJimpService]
    };
    
    return capabilities[capability] || [];
  }

  /**
   * Get format-specific services
   */
  static getServicesForFormat(format) {
    const formatServices = {
      'webp': [webPService, sharpService],
      'gif': [gifService, enhancedJimpService],
      'mp4': [ffmpegService, videoJSService, mediaAnalysisService],
      'jpeg': [sharpService, enhancedJimpService, canvasGraphicsService],
      'png': [sharpService, enhancedJimpService, canvasGraphicsService],
      'svg': [canvasGraphicsService, imageMagickService]
    };
    
    return formatServices[format.toLowerCase()] || [enhancedConversionService];
  }
}

// ============================================================================
// WORKFLOW ORCHESTRATOR - Complex multi-service workflows
// ============================================================================

class WorkflowOrchestrator {
  /**
   * Execute a complete web optimization workflow
   */
  static async optimizeForWeb(inputPath, options = {}) {
    const results = {
      original: inputPath,
      optimized: [],
      analysis: null,
      recommendations: []
    };

    try {
      // Step 1: Analyze the input
      results.analysis = await mediaAnalysisService.analyzeMedia(inputPath);
      
      // Step 2: Generate optimized versions based on analysis
      if (results.analysis.type === 'image') {
        // WebP optimization
        const webpResult = await webPService.convertToWebP(inputPath, {
          quality: 85,
          effort: 6
        });
        results.optimized.push(webpResult);
        
        // Responsive versions with Sharp
        const responsiveResults = await sharpService.createResponsiveVersions(inputPath, {
          sizes: [400, 800, 1200],
          formats: ['jpeg', 'webp']
        });
        results.optimized.push(...responsiveResults);
        
      } else if (results.analysis.type === 'video') {
        // Video optimization for web
        const webOptimized = await videoJSService.createWebOptimizedVersions(inputPath, {
          qualities: [
            { height: 480, bitrate: '1000k' },
            { height: 720, bitrate: '2500k' }
          ],
          formats: ['mp4', 'webm']
        });
        results.optimized.push(webOptimized);
      }
      
      // Step 3: Generate recommendations
      results.recommendations = results.analysis.optimizations || [];
      
      return results;
      
    } catch (error) {
      console.error('Web optimization workflow failed:', error);
      throw new Error(`Web optimization workflow failed: ${error.message}`);
    }
  }

  /**
   * Execute a complete image enhancement workflow
   */
  static async enhanceImage(inputPath, enhancements = {}) {
    const {
      addWatermark = false,
      createVariations = false,
      optimizeForWeb = false,
      addText = null
    } = enhancements;

    const results = [];

    try {
      let currentPath = inputPath;

      // Add watermark if requested
      if (addWatermark) {
        const watermarked = await canvasGraphicsService.createWatermark(currentPath, addWatermark);
        results.push(watermarked);
        currentPath = watermarked.path;
      }

      // Add text overlay if requested
      if (addText) {
        const textOverlay = await enhancedJimpService.addAdvancedText(currentPath, addText);
        results.push(textOverlay);
        currentPath = textOverlay.path;
      }

      // Create variations if requested
      if (createVariations) {
        const variations = await sharpService.createStyleVariations(currentPath, createVariations);
        results.push(...variations);
      }

      // Web optimization if requested
      if (optimizeForWeb) {
        const webOptimized = await this.optimizeForWeb(currentPath);
        results.push(webOptimized);
      }

      return results;

    } catch (error) {
      console.error('Image enhancement workflow failed:', error);
      throw new Error(`Image enhancement workflow failed: ${error.message}`);
    }
  }
}

// ============================================================================
// EXPORTS - All services and utilities
// ============================================================================

// Export service classes
export {
  // Core services
  FFmpegService,
  SharpService,
  JimpService,
  GifService,
  ImageMagickService,
  EnhancedConversionService,
  
  // Specialized services
  EnhancedJimpService,
  WebPService,
  MediaAnalysisService,
  CanvasGraphicsService,
  VideoJSService,
  
  // Utilities
  ServiceSelector,
  WorkflowOrchestrator
};

// Export service instances (ready to use)
export {
  // Core instances
  ffmpegService,
  sharpService,
  jimpService,
  gifService,
  imageMagickService,
  enhancedConversionService,
  
  // Specialized instances
  enhancedJimpService,
  webPService,
  mediaAnalysisService,
  canvasGraphicsService,
  videoJSService
};

// Default export: ServiceSelector for easy imports
export default ServiceSelector;