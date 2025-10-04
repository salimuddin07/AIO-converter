/**
 * Services Registry & Factory
 * Centralized access to all processing services with intelligent selection
 * 
 * @author Media Converter Team
 */

// New consolidated processors (primary services)
import ImageProcessor, { imageProcessor } from './ImageProcessingService.js';
import VideoProcessor, { videoProcessor } from './VideoProcessingService.js';
import GifProcessor, { gifProcessor } from './GifProcessingService.js';
import SplitService, { splitService } from './SplitService.js';

// Legacy services (for backward compatibility and specialized use cases)
import FFmpegService from './FfmpegService.js';
import SharpService from './SharpService.js';
import JimpService from './JimpService.js';
import GifService, { gifService } from './GifService.js';
import ImageMagickService from './ImageMagickService.js';
import EnhancedConversionService, { enhancedConversionService } from './EnhancedConversionService.js';

// Specialized services
import EnhancedJimpService from './EnhancedJimpService.js';
import WebPService from './WebPService.js';
import MediaAnalysisService from './MediaAnalysisService.js';
import CanvasGraphicsService from './CanvasGraphicsService.js';
import VideoJSService from './VideoJSService.js';

// Utility services
import textService from './TextService.js';
import { scheduleCleanup, cleanupFiles } from './cleanupService.js';
import { describeImage } from './AiService.js';

// Create service objects
const cleanupService = { scheduleCleanup, cleanupFiles };
const aiService = { describeImage };

// ============================================================================
// SERVICE INSTANCES - Ready-to-use instances
// ============================================================================

// Primary consolidated services (recommended for new code)
const primaryServices = {
  image: imageProcessor,
  video: videoProcessor,
  gif: gifProcessor
};

// Legacy services (for backward compatibility)
const ffmpegService = new FFmpegService();
const sharpService = new SharpService();
const jimpService = new JimpService();
const imageMagickService = new ImageMagickService();

// Specialized services for specific use cases
const enhancedJimpService = new EnhancedJimpService();
const webPService = new WebPService();
const mediaAnalysisService = new MediaAnalysisService();
const canvasGraphicsService = new CanvasGraphicsService();
const videoJSService = new VideoJSService();
const splitProcessingService = splitService || new SplitService();

// ============================================================================
// SERVICE RECOMMENDATIONS & SELECTION LOGIC
// ============================================================================

/**
 * RECOMMENDED SERVICE USAGE:
 * 
 * PRIMARY SERVICES (Use these for new development):
 * - ImageProcessor: All image operations (replaces Sharp/Jimp/ImageMagick services)
 *   • Intelligent service selection based on operation and file characteristics
 *   • Unified API for resize, convert, effects, optimization
 *   • Built-in error handling and fallback mechanisms
 * 
 * - VideoProcessor: All video operations (replaces FFmpeg/VideoJS services)  
 *   • Event-driven architecture with progress tracking
 *   • Scene detection and smart splitting
 *   • Quality presets and optimization
 * 
 * - GifProcessor: GIF creation and manipulation
 *   • Frame extraction with scene filtering
 *   • Animated GIF creation with optimization
 *   • Text overlay and effects
 * 
 * LEGACY SERVICES (Backward compatibility only):
 * - JimpService: Pure JavaScript image operations
 * - SharpService: High-performance native image operations
 * - FFmpegService: Direct FFmpeg operations
 * - WebPService: Specialized WebP operations
 * 
 * UTILITY SERVICES:
 * - textService: Text processing and overlays
 * - cleanupService: File cleanup and management
 * - aiService: AI-powered enhancements
 */

// ============================================================================
// SERVICE FACTORY - Intelligent service selection
// ============================================================================

/**
 * Service Factory for intelligent service selection and management
 */
class ServiceFactory {
  constructor() {
    this.primaryServices = primaryServices;
    this.legacyServices = {
      ffmpeg: ffmpegService,
      sharp: sharpService,
      jimp: jimpService,
      gifService: gifService,
      imageMagick: imageMagickService,
      enhancedJimp: enhancedJimpService,
  split: splitProcessingService,
      webp: webPService,
      mediaAnalysis: mediaAnalysisService,
      canvas: canvasGraphicsService,
      videoJS: videoJSService,
      enhancedConversion: enhancedConversionService
    };
    this.utilityServices = {
      text: textService,
      cleanup: cleanupService,
      ai: aiService
    };
  }

  /**
   * Get the recommended service for a file type and operation
   * @param {string} fileExtension - File extension (.jpg, .mp4, etc.)
   * @param {string} operation - Operation type (convert, resize, split, etc.)
   * @param {Object} options - Additional options for service selection
   * @returns {Object} Service instance
   */
  getServiceFor(fileExtension, operation = 'convert', options = {}) {
    const ext = fileExtension.toLowerCase().replace('.', '');
    
    // Image formats - use ImageProcessor
    const imageFormats = ['jpg', 'jpeg', 'png', 'bmp', 'tiff', 'avif', 'svg'];
    if (imageFormats.includes(ext)) {
      return this.primaryServices.image;
    }

    // Video formats - use VideoProcessor
    const videoFormats = ['mp4', 'avi', 'mov', 'webm', 'mkv', 'm4v', '3gp', 'flv'];
    if (videoFormats.includes(ext)) {
      return this.primaryServices.video;
    }

    // GIF handling
    if (ext === 'gif') {
      return operation === 'split' || operation === 'extract' || operation === 'create'
        ? this.primaryServices.gif 
        : this.primaryServices.image;
    }

    // WebP special handling
    if (ext === 'webp') {
      return operation === 'decode' || operation === 'animate'
        ? this.legacyServices.webp
        : this.primaryServices.image;
    }

    // Default to image processor for unknown formats
    return this.primaryServices.image;
  }

  /**
   * Get service by capability/task type
   * @param {string} task - Task identifier
   * @returns {Object|Array} Service(s) for the task
   */
  getBestServiceFor(task, inputFormat = null, outputFormat = null) {
    const taskMap = {
      // Primary tasks - use consolidated services
      'image-conversion': this.primaryServices.image,
      'image-resize': this.primaryServices.image,
      'image-effects': this.primaryServices.image,
      'video-conversion': this.primaryServices.video,
      'video-split': this.primaryServices.video,
      'gif-creation': this.primaryServices.gif,
      'gif-split': this.primaryServices.gif,
      
      // Specialized tasks - use specific services
      'webp-optimization': this.legacyServices.webp,
      'canvas-graphics': this.legacyServices.canvas,
      'media-analysis': this.legacyServices.mediaAnalysis,
      'batch-conversion': this.legacyServices.enhancedConversion,
      
      // Utility tasks
      'text-processing': this.utilityServices.text,
      'cleanup': this.utilityServices.cleanup,
      'ai-enhancement': this.utilityServices.ai
    };
    
    return taskMap[task] || this.primaryServices.image;
  }

  /**
   * Get all services by category
   * @param {string} category - Category name
   * @returns {Array} Services in category
   */
  getServicesByCategory(category) {
    const categories = {
      'primary': Object.values(this.primaryServices),
      'legacy': Object.values(this.legacyServices),
      'utility': Object.values(this.utilityServices),
      'image': [
        this.primaryServices.image,
        this.legacyServices.sharp,
        this.legacyServices.jimp,
        this.legacyServices.imageMagick,
        this.legacyServices.enhancedJimp,
        this.legacyServices.canvas
      ],
      'video': [
        this.primaryServices.video,
        this.legacyServices.ffmpeg,
        this.legacyServices.videoJS,
        this.legacyServices.mediaAnalysis
      ],
      'animation': [
        this.primaryServices.gif,
        this.legacyServices.gifService,
        this.legacyServices.webp
      ]
    };
    
    return categories[category] || [];
  }

  /**
   * Get all available services
   * @returns {Object} All service instances
   */
  getAllServices() {
    return {
      ...this.primaryServices,
      ...this.legacyServices,
      ...this.utilityServices
    };
  }
}

// ============================================================================
// WORKFLOW ORCHESTRATOR - Complex multi-service workflows
// ============================================================================

/**
 * Workflow Orchestrator for complex multi-service operations
 */
class WorkflowOrchestrator {
  constructor(serviceFactory) {
    this.serviceFactory = serviceFactory || new ServiceFactory();
    this.activeWorkflows = new Map();
  }

  /**
   * Complete web optimization workflow
   * @param {string} inputPath - Input file path
   * @param {Object} options - Optimization options
   * @returns {Promise<Object>} Optimization results
   */
  async optimizeForWeb(inputPath, options = {}) {
    const workflowId = `optimize_${Date.now()}`;
    const workflow = {
      id: workflowId,
      status: 'running',
      steps: [],
      results: []
    };
    
    this.activeWorkflows.set(workflowId, workflow);

    try {
      // Step 1: Analyze input file
      const analysisService = this.serviceFactory.legacyServices.mediaAnalysis;
      const analysis = await analysisService.analyzeMedia?.(inputPath) || { type: 'unknown' };
      
      workflow.steps.push('analysis');
      workflow.results.push({ step: 'analysis', data: analysis });

      // Step 2: Apply appropriate optimization based on file type
      if (analysis.type === 'image' || inputPath.match(/\.(jpg|jpeg|png|webp|gif)$/i)) {
        const imageService = this.serviceFactory.getServiceFor(inputPath, 'optimize');
        
        // Create web-optimized version
        const optimizedResult = await imageService.convertImage(inputPath, {
          format: options.format || 'webp',
          quality: options.quality || 85,
          progressive: true,
          optimizeForWeb: true
        });
        
        workflow.steps.push('image-optimization');
        workflow.results.push({ step: 'image-optimization', data: optimizedResult });

        // Generate responsive sizes if requested
        if (options.responsive) {
          const sizes = options.sizes || [400, 800, 1200];
          for (const size of sizes) {
            const resized = await imageService.resizeImage(optimizedResult.outputPath, {
              width: size,
              maintainAspectRatio: true
            });
            workflow.results.push({ step: `responsive-${size}`, data: resized });
          }
        }

      } else if (analysis.type === 'video' || inputPath.match(/\.(mp4|avi|mov|webm)$/i)) {
        const videoService = this.serviceFactory.getServiceFor(inputPath, 'optimize');
        
        // Create web-optimized video versions
        const qualities = options.qualities || [
          { height: 480, bitrate: '1000k' },
          { height: 720, bitrate: '2500k' }
        ];
        
        for (const quality of qualities) {
          const optimized = await videoService.convertVideo(inputPath, {
            format: 'mp4',
            codec: 'h264',
            ...quality
          });
          workflow.results.push({ step: `video-${quality.height}p`, data: optimized });
        }
      }

      workflow.status = 'completed';
      workflow.finalOutput = workflow.results[workflow.results.length - 1]?.data?.outputPath || inputPath;
      
      return {
        workflowId,
        status: 'completed',
        results: workflow.results,
        finalOutput: workflow.finalOutput
      };

    } catch (error) {
      workflow.status = 'failed';
      workflow.error = error.message;
      throw new Error(`Web optimization workflow failed: ${error.message}`);
    }
  }

  /**
   * Image enhancement workflow with multiple processing steps
   * @param {string} inputPath - Input image path
   * @param {Object} enhancements - Enhancement options
   * @returns {Promise<Array>} Enhancement results
   */
  async enhanceImage(inputPath, enhancements = {}) {
    const {
      addWatermark = false,
      addText = null,
      applyEffects = null,
      optimizeForWeb = false,
      createVariations = false
    } = enhancements;

    const results = [];
    let currentPath = inputPath;

    try {
      const imageService = this.serviceFactory.getServiceFor(inputPath, 'enhance');

      // Apply effects if requested
      if (applyEffects) {
        const effectResult = await imageService.applyEffects(currentPath, applyEffects);
        results.push({ step: 'effects', ...effectResult });
        currentPath = effectResult.outputPath;
      }

      // Add text overlay if requested
      if (addText) {
        const textResult = await imageService.addTextOverlay?.(currentPath, addText) ||
                          await this.serviceFactory.utilityServices.text.addTextToImage?.(currentPath, addText);
        if (textResult) {
          results.push({ step: 'text-overlay', ...textResult });
          currentPath = textResult.outputPath;
        }
      }

      // Add watermark if requested  
      if (addWatermark) {
        const watermarkResult = await this.serviceFactory.legacyServices.canvas.createWatermark?.(currentPath, addWatermark);
        if (watermarkResult) {
          results.push({ step: 'watermark', ...watermarkResult });
          currentPath = watermarkResult.outputPath;
        }
      }

      // Create variations if requested
      if (createVariations) {
        const variations = await imageService.createVariations?.(currentPath, createVariations);
        if (variations) {
          results.push({ step: 'variations', variations });
        }
      }

      // Web optimization if requested
      if (optimizeForWeb) {
        const webOptimized = await this.optimizeForWeb(currentPath);
        results.push({ step: 'web-optimization', ...webOptimized });
      }

      return results;

    } catch (error) {
      console.error('Image enhancement workflow failed:', error);
      throw new Error(`Image enhancement workflow failed: ${error.message}`);
    }
  }

  /**
   * Get workflow status
   * @param {string} workflowId - Workflow ID
   * @returns {Object} Workflow status
   */
  getWorkflowStatus(workflowId) {
    return this.activeWorkflows.get(workflowId) || null;
  }

  /**
   * Cancel a running workflow
   * @param {string} workflowId - Workflow ID
   */
  cancelWorkflow(workflowId) {
    const workflow = this.activeWorkflows.get(workflowId);
    if (workflow) {
      workflow.status = 'cancelled';
      // Additional cleanup logic here
    }
  }
}

// ============================================================================
// EXPORTS - All services and utilities
// ============================================================================

// Create singleton instances
const serviceFactory = new ServiceFactory();
const workflowOrchestrator = new WorkflowOrchestrator(serviceFactory);

// Export consolidated service classes
export {
  // New consolidated processors (recommended for new development)
  ImageProcessor,
  VideoProcessor,
  GifProcessor,
  
  // Legacy service classes (backward compatibility)
  FFmpegService,
  SharpService,
  JimpService,
  GifService,
  ImageMagickService,
  EnhancedConversionService,
  EnhancedJimpService,
  WebPService,
  MediaAnalysisService,
  CanvasGraphicsService,
  VideoJSService,
  
  // Utility classes
  ServiceFactory,
  WorkflowOrchestrator
};

// Export consolidated service instances (primary - use these in new code)
export {
  imageProcessor,
  videoProcessor,
  gifProcessor
};

// Export legacy service instances (backward compatibility)
export {
  ffmpegService,
  sharpService,
  jimpService,
  gifService,
  imageMagickService,
  enhancedConversionService,
  enhancedJimpService,
  webPService,
  mediaAnalysisService,
  canvasGraphicsService,
  videoJSService
};

// Export utility service instances
export {
  textService,
  cleanupService,
  aiService
};

// Export factory and orchestrator instances
export {
  serviceFactory,
  workflowOrchestrator
};

// Default export - ServiceFactory for easy access
export default serviceFactory;
