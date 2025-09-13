import ffprobe from 'ffprobe';
import ffprobeStatic from 'ffprobe-static';
import path from 'path';
import fs from 'fs/promises';

/**
 * Media Analysis Service using FFprobe
 * Specializes in: Video/audio metadata extraction, format analysis, stream inspection
 * Best for: Comprehensive media file analysis, codec detection, quality assessment
 */
class MediaAnalysisService {
  constructor() {
    // Set the path to the ffprobe binary
    ffprobe.FFPROBE_PATH = ffprobeStatic.path;
    
    this.supportedFormats = {
      video: ['mp4', 'avi', 'mov', 'mkv', 'webm', 'flv', 'wmv', '3gp', 'ogv'],
      audio: ['mp3', 'wav', 'flac', 'aac', 'ogg', 'wma', 'm4a'],
      image: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'tiff']
    };
  }

  /**
   * Get comprehensive media information
   */
  async analyzeMedia(filePath) {
    try {
      console.log('Analyzing media file:', filePath);
      
      const info = await ffprobe(filePath);
      
      return {
        filepath: filePath,
        format: this.parseFormatInfo(info.format),
        streams: this.parseStreams(info.streams),
        metadata: this.parseMetadata(info.format.tags || {}),
        technical: {
          duration: parseFloat(info.format.duration) || 0,
          bitrate: parseInt(info.format.bit_rate) || 0,
          size: parseInt(info.format.size) || 0,
          formatName: info.format.format_name,
          formatLongName: info.format.format_long_name
        },
        analysis: await this.performAdvancedAnalysis(info)
      };
    } catch (error) {
      console.error('Media analysis failed:', error);
      throw new Error(`Media analysis failed: ${error.message}`);
    }
  }

  /**
   * Parse format information
   */
  parseFormatInfo(format) {
    return {
      filename: format.filename,
      formatName: format.format_name,
      formatLongName: format.format_long_name,
      duration: parseFloat(format.duration) || 0,
      size: parseInt(format.size) || 0,
      bitrate: parseInt(format.bit_rate) || 0,
      startTime: parseFloat(format.start_time) || 0,
      streamCount: parseInt(format.nb_streams) || 0
    };
  }

  /**
   * Parse stream information
   */
  parseStreams(streams) {
    const result = {
      video: [],
      audio: [],
      subtitle: [],
      data: []
    };

    streams.forEach((stream, index) => {
      const baseInfo = {
        index: stream.index,
        codecType: stream.codec_type,
        codecName: stream.codec_name,
        codecLongName: stream.codec_long_name,
        duration: parseFloat(stream.duration) || 0,
        bitrate: parseInt(stream.bit_rate) || 0,
        tags: stream.tags || {}
      };

      switch (stream.codec_type) {
        case 'video':
          result.video.push({
            ...baseInfo,
            width: stream.width,
            height: stream.height,
            aspectRatio: stream.display_aspect_ratio,
            frameRate: this.parseFrameRate(stream.r_frame_rate),
            pixelFormat: stream.pix_fmt,
            colorSpace: stream.color_space,
            colorRange: stream.color_range,
            hasAlpha: stream.pix_fmt?.includes('a'),
            level: stream.level,
            profile: stream.profile
          });
          break;

        case 'audio':
          result.audio.push({
            ...baseInfo,
            sampleRate: parseInt(stream.sample_rate) || 0,
            channels: stream.channels,
            channelLayout: stream.channel_layout,
            sampleFormat: stream.sample_fmt,
            bitsPerSample: stream.bits_per_sample
          });
          break;

        case 'subtitle':
          result.subtitle.push({
            ...baseInfo,
            language: stream.tags?.language
          });
          break;

        default:
          result.data.push(baseInfo);
      }
    });

    return result;
  }

  /**
   * Parse metadata tags
   */
  parseMetadata(tags) {
    return {
      title: tags.title || null,
      artist: tags.artist || tags.author || null,
      album: tags.album || null,
      date: tags.date || tags.creation_time || null,
      genre: tags.genre || null,
      description: tags.description || tags.comment || null,
      copyright: tags.copyright || null,
      encoder: tags.encoder || null,
      language: tags.language || null,
      custom: Object.keys(tags).reduce((acc, key) => {
        if (!['title', 'artist', 'album', 'date', 'genre', 'description', 'copyright', 'encoder', 'language'].includes(key)) {
          acc[key] = tags[key];
        }
        return acc;
      }, {})
    };
  }

  /**
   * Perform advanced analysis
   */
  async performAdvancedAnalysis(info) {
    const analysis = {
      mediaType: this.determineMediaType(info),
      quality: this.assessQuality(info),
      compatibility: this.checkCompatibility(info),
      optimization: this.suggestOptimizations(info),
      issues: this.detectIssues(info)
    };

    return analysis;
  }

  /**
   * Determine primary media type
   */
  determineMediaType(info) {
    const hasVideo = info.streams.some(s => s.codec_type === 'video');
    const hasAudio = info.streams.some(s => s.codec_type === 'audio');

    if (hasVideo && hasAudio) return 'video';
    if (hasVideo && !hasAudio) return 'video_silent';
    if (!hasVideo && hasAudio) return 'audio';
    return 'unknown';
  }

  /**
   * Assess media quality
   */
  assessQuality(info) {
    const videoStream = info.streams.find(s => s.codec_type === 'video');
    const audioStream = info.streams.find(s => s.codec_type === 'audio');

    let score = 0;
    let factors = [];

    if (videoStream) {
      // Resolution score
      const pixels = videoStream.width * videoStream.height;
      if (pixels >= 3840 * 2160) { score += 25; factors.push('4K/Ultra HD'); }
      else if (pixels >= 1920 * 1080) { score += 20; factors.push('Full HD'); }
      else if (pixels >= 1280 * 720) { score += 15; factors.push('HD'); }
      else if (pixels >= 640 * 480) { score += 10; factors.push('SD'); }
      else { score += 5; factors.push('Low resolution'); }

      // Bitrate score
      const bitrate = parseInt(videoStream.bit_rate) || 0;
      if (bitrate >= 10000000) { score += 25; factors.push('High bitrate'); }
      else if (bitrate >= 5000000) { score += 20; factors.push('Good bitrate'); }
      else if (bitrate >= 2000000) { score += 15; factors.push('Medium bitrate'); }
      else if (bitrate >= 1000000) { score += 10; factors.push('Low bitrate'); }
      else { score += 5; factors.push('Very low bitrate'); }

      // Codec score
      if (videoStream.codec_name === 'h264') { score += 20; factors.push('H.264 codec'); }
      else if (videoStream.codec_name === 'hevc') { score += 25; factors.push('H.265/HEVC codec'); }
      else if (videoStream.codec_name === 'vp9') { score += 22; factors.push('VP9 codec'); }
      else { score += 10; factors.push(`${videoStream.codec_name} codec`); }

      // Frame rate
      const fps = this.parseFrameRate(videoStream.r_frame_rate);
      if (fps >= 60) { score += 15; factors.push('High frame rate'); }
      else if (fps >= 30) { score += 10; factors.push('Standard frame rate'); }
      else { score += 5; factors.push('Low frame rate'); }
    }

    if (audioStream) {
      // Audio quality
      const sampleRate = parseInt(audioStream.sample_rate) || 0;
      if (sampleRate >= 48000) { score += 15; factors.push('High audio quality'); }
      else if (sampleRate >= 44100) { score += 10; factors.push('CD quality audio'); }
      else { score += 5; factors.push('Basic audio quality'); }
    }

    return {
      score: Math.min(100, score),
      grade: score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : score >= 40 ? 'Fair' : 'Poor',
      factors: factors
    };
  }

  /**
   * Check format compatibility
   */
  checkCompatibility(info) {
    const videoStream = info.streams.find(s => s.codec_type === 'video');
    const audioStream = info.streams.find(s => s.codec_type === 'audio');

    const compatibility = {
      web: { score: 0, issues: [] },
      mobile: { score: 0, issues: [] },
      desktop: { score: 0, issues: [] }
    };

    if (videoStream) {
      // Web compatibility
      if (['h264', 'vp8', 'vp9'].includes(videoStream.codec_name)) {
        compatibility.web.score += 50;
      } else {
        compatibility.web.issues.push(`${videoStream.codec_name} not widely supported in browsers`);
      }

      // Mobile compatibility
      if (videoStream.codec_name === 'h264' && videoStream.level <= 41) {
        compatibility.mobile.score += 50;
      } else {
        compatibility.mobile.issues.push('May have mobile playback issues');
      }

      // Desktop compatibility
      compatibility.desktop.score += 40; // Most codecs work on desktop
    }

    if (audioStream) {
      // Audio compatibility checks
      if (['aac', 'mp3'].includes(audioStream.codec_name)) {
        compatibility.web.score += 30;
        compatibility.mobile.score += 30;
      }
      compatibility.desktop.score += 30;
    }

    // Container format checks
    const format = info.format.format_name.toLowerCase();
    if (format.includes('mp4')) {
      compatibility.web.score += 20;
      compatibility.mobile.score += 20;
      compatibility.desktop.score += 30;
    } else if (format.includes('webm')) {
      compatibility.web.score += 25;
      compatibility.desktop.score += 20;
    }

    return compatibility;
  }

  /**
   * Suggest optimizations
   */
  suggestOptimizations(info) {
    const suggestions = [];
    const videoStream = info.streams.find(s => s.codec_type === 'video');
    const audioStream = info.streams.find(s => s.codec_type === 'audio');

    if (videoStream) {
      // Resolution optimization
      if (videoStream.width > 1920 || videoStream.height > 1080) {
        suggestions.push({
          type: 'resolution',
          suggestion: 'Consider scaling down for web delivery',
          impact: 'High file size reduction'
        });
      }

      // Codec optimization
      if (videoStream.codec_name !== 'h264' && videoStream.codec_name !== 'hevc') {
        suggestions.push({
          type: 'codec',
          suggestion: 'Convert to H.264 or H.265 for better compatibility',
          impact: 'Improved compatibility and compression'
        });
      }

      // Bitrate optimization
      const bitrate = parseInt(videoStream.bit_rate) || 0;
      if (bitrate > 10000000) {
        suggestions.push({
          type: 'bitrate',
          suggestion: 'Reduce bitrate for streaming optimization',
          impact: 'Faster loading, smaller files'
        });
      }
    }

    if (audioStream) {
      // Audio optimization
      if (audioStream.codec_name !== 'aac' && audioStream.codec_name !== 'mp3') {
        suggestions.push({
          type: 'audio_codec',
          suggestion: 'Convert audio to AAC for better compression',
          impact: 'Better quality-to-size ratio'
        });
      }
    }

    return suggestions;
  }

  /**
   * Detect potential issues
   */
  detectIssues(info) {
    const issues = [];
    const videoStream = info.streams.find(s => s.codec_type === 'video');

    if (videoStream) {
      // Check for problematic pixel formats
      if (videoStream.pix_fmt && videoStream.pix_fmt.includes('422') || videoStream.pix_fmt.includes('444')) {
        issues.push({
          type: 'pixel_format',
          severity: 'medium',
          description: 'High-quality pixel format may not be compatible with all players'
        });
      }

      // Check for unusual aspect ratios
      if (videoStream.display_aspect_ratio && !['16:9', '4:3', '1:1'].includes(videoStream.display_aspect_ratio)) {
        issues.push({
          type: 'aspect_ratio',
          severity: 'low',
          description: `Unusual aspect ratio: ${videoStream.display_aspect_ratio}`
        });
      }

      // Check frame rate
      const fps = this.parseFrameRate(videoStream.r_frame_rate);
      if (fps > 60) {
        issues.push({
          type: 'frame_rate',
          severity: 'medium',
          description: 'Very high frame rate may cause playback issues on some devices'
        });
      }
    }

    return issues;
  }

  /**
   * Parse frame rate string
   */
  parseFrameRate(rFrameRate) {
    if (!rFrameRate) return 0;
    const parts = rFrameRate.split('/');
    return parseFloat(parts[0]) / parseFloat(parts[1]) || 0;
  }

  /**
   * Batch analyze multiple media files
   */
  async batchAnalyze(filePaths, options = {}) {
    const results = [];
    const concurrency = options.concurrency || 2;

    for (let i = 0; i < filePaths.length; i += concurrency) {
      const batch = filePaths.slice(i, i + concurrency);
      
      const batchPromises = batch.map(async (filePath) => {
        try {
          const analysis = await this.analyzeMedia(filePath);
          return { success: true, ...analysis };
        } catch (error) {
          return { 
            success: false, 
            error: error.message, 
            filepath: filePath 
          };
        }
      });

      const batchResults = await Promise.allSettled(batchPromises);
      batchResults.forEach(result => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          results.push({ 
            success: false, 
            error: result.reason.message || 'Analysis failed' 
          });
        }
      });
    }

    return {
      total: filePaths.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results: results
    };
  }
}

export default MediaAnalysisService;
