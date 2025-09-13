import path from 'path';
import fs from 'fs/promises';
import { statSync } from 'fs';
import { v4 as uuid } from 'uuid';
import { outputDir } from '../lib/file-paths.js';

/**
 * Video.js Integration Service
 * Specializes in: Video player integration, streaming optimization, video metadata for web
 * Best for: Frontend video player setup, streaming configurations, web-optimized video processing
 */
class VideoJSService {
  constructor() {
    this.videoJSDefaults = {
      controls: true,
      responsive: true,
      fluid: true,
      preload: 'metadata',
      techOrder: ['html5'],
      html5: {
        vhs: {
          overrideNative: true
        }
      }
    };

    this.supportedFormats = {
      web: ['mp4', 'webm', 'ogg'],
      streaming: ['m3u8', 'mpd'],
      fallback: ['mp4']
    };
  }

  /**
   * Generate Video.js configuration for web player
   */
  generateVideoJSConfig(videoPath, options = {}) {
    try {
      const config = {
        ...this.videoJSDefaults,
        ...options
      };

      const videoInfo = this.getVideoInfo(videoPath);
      
      // Generate sources array for different formats
      const sources = this.generateVideoSources(videoPath, options.formats || ['mp4']);
      
      // Add poster image if available
      const poster = options.poster || this.generatePosterPath(videoPath);
      
      const videoJSConfig = {
        ...config,
        sources: sources,
        poster: poster,
        tracks: options.tracks || [],
        plugins: this.setupPlugins(options.plugins || {}),
        playbackRates: options.playbackRates || [0.5, 1, 1.25, 1.5, 2],
        responsive: true,
        breakpoints: {
          tiny: 300,
          xsmall: 400,
          small: 500,
          medium: 600,
          large: 700,
          xlarge: 800,
          huge: 900
        }
      };

      // Add quality selector if multiple qualities available
      if (options.qualities && options.qualities.length > 1) {
        videoJSConfig.plugins.qualitySelector = {
          default: 'auto',
          sources: this.generateQualitySourcesre(videoPath, options.qualities)
        };
      }

      return {
        config: videoJSConfig,
        videoInfo: videoInfo,
        initialization: this.generateInitializationCode(videoJSConfig)
      };
    } catch (error) {
      console.error('Video.js config generation failed:', error);
      throw new Error(`Video.js config generation failed: ${error.message}`);
    }
  }

  /**
   * Generate video sources for different formats
   */
  generateVideoSources(videoPath, formats) {
    const sources = [];
    const baseName = path.parse(videoPath).name;
    const baseDir = path.dirname(videoPath);

    formats.forEach(format => {
      let type, src;
      
      switch (format) {
        case 'mp4':
          type = 'video/mp4';
          src = path.join(baseDir, `${baseName}.mp4`);
          break;
        case 'webm':
          type = 'video/webm';
          src = path.join(baseDir, `${baseName}.webm`);
          break;
        case 'ogg':
          type = 'video/ogg';
          src = path.join(baseDir, `${baseName}.ogg`);
          break;
        case 'm3u8':
          type = 'application/x-mpegURL';
          src = path.join(baseDir, `${baseName}.m3u8`);
          break;
        case 'mpd':
          type = 'application/dash+xml';
          src = path.join(baseDir, `${baseName}.mpd`);
          break;
      }

      if (type && src) {
        sources.push({ type, src: this.toWebPath(src) });
      }
    });

    return sources;
  }

  /**
   * Generate quality sources for adaptive streaming
   */
  generateQualitySourcesre(videoPath, qualities) {
    const sources = {};
    const baseName = path.parse(videoPath).name;
    const baseDir = path.dirname(videoPath);

    qualities.forEach(quality => {
      const qualityKey = quality.label || `${quality.height}p`;
      sources[qualityKey] = [{
        type: 'video/mp4',
        src: this.toWebPath(path.join(baseDir, `${baseName}_${quality.height}p.mp4`))
      }];
    });

    return sources;
  }

  /**
   * Setup Video.js plugins
   */
  setupPlugins(pluginsConfig) {
    const plugins = {};

    // Quality selector plugin
    if (pluginsConfig.qualitySelector !== false) {
      plugins.qualitySelector = pluginsConfig.qualitySelector || {
        default: 'auto'
      };
    }

    // Hotkeys plugin
    if (pluginsConfig.hotkeys !== false) {
      plugins.hotkeys = pluginsConfig.hotkeys || {
        volumeStep: 0.1,
        seekStep: 5,
        enableModifiersForNumbers: false
      };
    }

    // Overlay plugin
    if (pluginsConfig.overlay) {
      plugins.overlay = pluginsConfig.overlay;
    }

    // Analytics plugin
    if (pluginsConfig.analytics) {
      plugins.analytics = pluginsConfig.analytics;
    }

    return plugins;
  }

  /**
   * Generate Video.js initialization code
   */
  generateInitializationCode(config) {
    const configJSON = JSON.stringify(config, null, 2);
    
    return `
// Video.js Player Initialization
import videojs from 'video.js';
import 'video.js/dist/video-js.css';

// Initialize player
const player = videojs('video-player', ${configJSON}, function() {
  console.log('Video.js player is ready');
  
  // Player ready callbacks
  this.on('loadedmetadata', function() {
    console.log('Video metadata loaded');
  });
  
  this.on('play', function() {
    console.log('Video started playing');
  });
  
  this.on('ended', function() {
    console.log('Video ended');
  });
  
  this.on('error', function() {
    console.error('Video playback error:', this.error());
  });
});

// Responsive handling
player.ready(function() {
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  if (isMobile) {
    player.addClass('vjs-mobile');
  }
  
  // Handle orientation changes
  window.addEventListener('orientationchange', function() {
    setTimeout(() => {
      player.trigger('resize');
    }, 100);
  });
});

export default player;
    `;
  }

  /**
   * Create optimized web video versions
   */
  async createWebOptimizedVersions(videoPath, options = {}) {
    try {
      const {
        qualities = [
          { height: 480, bitrate: '1000k' },
          { height: 720, bitrate: '2500k' },
          { height: 1080, bitrate: '5000k' }
        ],
        formats = ['mp4', 'webm'],
        createPoster = true,
        createThumbnails = true
      } = options;

      const results = {
        qualities: [],
        formats: [],
        poster: null,
        thumbnails: [],
        manifest: null
      };

      const baseName = path.parse(videoPath).name;

      // Create different quality versions
      for (const quality of qualities) {
        const qualityResult = await this.createQualityVersion(videoPath, quality);
        results.qualities.push(qualityResult);
      }

      // Create different format versions
      for (const format of formats) {
        const formatResult = await this.createFormatVersion(videoPath, format);
        results.formats.push(formatResult);
      }

      // Create poster image
      if (createPoster) {
        results.poster = await this.createPosterImage(videoPath);
      }

      // Create thumbnail sprites
      if (createThumbnails) {
        results.thumbnails = await this.createThumbnailSprite(videoPath);
      }

      // Create HLS manifest if requested
      if (options.hls) {
        results.manifest = await this.createHLSManifest(videoPath, qualities);
      }

      return results;
    } catch (error) {
      console.error('Web optimization failed:', error);
      throw new Error(`Web optimization failed: ${error.message}`);
    }
  }

  /**
   * Create quality version of video
   */
  async createQualityVersion(videoPath, quality) {
    // This would integrate with FFmpeg service for actual conversion
    // For now, return placeholder
    const outputName = `${path.parse(videoPath).name}_${quality.height}p.mp4`;
    const outputPath = path.join(outputDir, outputName);

    return {
      quality: quality,
      outName: outputName,
      path: outputPath,
      height: quality.height,
      bitrate: quality.bitrate
    };
  }

  /**
   * Create format version of video
   */
  async createFormatVersion(videoPath, format) {
    // This would integrate with FFmpeg service for actual conversion
    const outputName = `${path.parse(videoPath).name}.${format}`;
    const outputPath = path.join(outputDir, outputName);

    return {
      format: format,
      outName: outputName,
      path: outputPath,
      type: this.getVideoTypeForFormat(format)
    };
  }

  /**
   * Create poster image from video
   */
  async createPosterImage(videoPath, timeOffset = '00:00:01') {
    // This would integrate with FFmpeg service for actual poster generation
    const outputName = `${path.parse(videoPath).name}_poster.jpg`;
    const outputPath = path.join(outputDir, outputName);

    return {
      outName: outputName,
      path: outputPath,
      timeOffset: timeOffset,
      type: 'image/jpeg'
    };
  }

  /**
   * Create thumbnail sprite for scrubbing
   */
  async createThumbnailSprite(videoPath, options = {}) {
    const {
      interval = 10, // seconds
      width = 120,
      height = 68,
      columns = 10
    } = options;

    // This would integrate with FFmpeg service for actual sprite generation
    const spriteOutputName = `${path.parse(videoPath).name}_sprite.jpg`;
    const vttOutputName = `${path.parse(videoPath).name}_sprite.vtt`;
    
    const spriteOutputPath = path.join(outputDir, spriteOutputName);
    const vttOutputPath = path.join(outputDir, vttOutputName);

    return {
      sprite: {
        outName: spriteOutputName,
        path: spriteOutputPath,
        width: width * columns,
        height: height,
        thumbWidth: width,
        thumbHeight: height
      },
      vtt: {
        outName: vttOutputName,
        path: vttOutputPath,
        interval: interval
      }
    };
  }

  /**
   * Create HLS manifest
   */
  async createHLSManifest(videoPath, qualities) {
    const baseName = path.parse(videoPath).name;
    const masterPlaylist = `${baseName}_master.m3u8`;
    const masterPlaylistPath = path.join(outputDir, masterPlaylist);

    let manifestContent = '#EXTM3U\n#EXT-X-VERSION:3\n\n';

    qualities.forEach(quality => {
      const bandwidth = parseInt(quality.bitrate.replace('k', '000'));
      const playlistName = `${baseName}_${quality.height}p.m3u8`;
      
      manifestContent += `#EXT-X-STREAM-INF:BANDWIDTH=${bandwidth},RESOLUTION=1280x${quality.height}\n`;
      manifestContent += `${playlistName}\n`;
    });

    await fs.writeFile(masterPlaylistPath, manifestContent, 'utf8');

    return {
      outName: masterPlaylist,
      path: masterPlaylistPath,
      type: 'application/x-mpegURL',
      qualities: qualities.length
    };
  }

  /**
   * Get video type for format
   */
  getVideoTypeForFormat(format) {
    const types = {
      'mp4': 'video/mp4',
      'webm': 'video/webm',
      'ogg': 'video/ogg',
      'm3u8': 'application/x-mpegURL',
      'mpd': 'application/dash+xml'
    };
    return types[format] || 'video/mp4';
  }

  /**
   * Get basic video info
   */
  getVideoInfo(videoPath) {
    const stats = statSync(videoPath);
    const parsed = path.parse(videoPath);
    
    return {
      name: parsed.name,
      extension: parsed.ext,
      size: stats.size,
      path: videoPath,
      webPath: this.toWebPath(videoPath)
    };
  }

  /**
   * Convert file path to web-accessible path
   */
  toWebPath(filePath) {
    // Convert Windows paths to web paths
    return filePath.replace(/\\/g, '/').replace(/^[A-Z]:/, '');
  }

  /**
   * Generate HTML template for Video.js player
   */
  generatePlayerHTML(config, options = {}) {
    const {
      containerId = 'video-container',
      videoId = 'video-player',
      width = '100%',
      height = '400px',
      className = 'video-js vjs-default-skin'
    } = options;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Video Player</title>
    
    <!-- Video.js CSS -->
    <link href="https://vjs.zencdn.net/8.23.4/video.min.css" rel="stylesheet">
    
    <!-- Custom styles -->
    <style>
        #${containerId} {
            max-width: 100%;
            margin: 20px auto;
        }
        
        .${className.replace(/ /g, '.')} {
            width: ${width};
            height: ${height};
        }
        
        @media (max-width: 768px) {
            .${className.replace(/ /g, '.')} {
                height: 250px;
            }
        }
    </style>
</head>
<body>
    <div id="${containerId}">
        <video
            id="${videoId}"
            class="${className}"
            controls
            preload="metadata"
            data-setup='${JSON.stringify(config)}'
        >
            ${config.sources.map(source => 
              `<source src="${source.src}" type="${source.type}">`
            ).join('\n            ')}
            
            <p class="vjs-no-js">
                To view this video please enable JavaScript, and consider upgrading to a web browser that
                <a href="https://videojs.com/html5-video-support/" target="_blank">supports HTML5 video</a>.
            </p>
        </video>
    </div>

    <!-- Video.js JavaScript -->
    <script src="https://vjs.zencdn.net/8.23.4/video.min.js"></script>
    
    <script>
        // Initialize Video.js player
        var player = videojs('${videoId}');
        
        player.ready(function() {
            console.log('Video.js player initialized successfully');
        });
    </script>
</body>
</html>
    `;
  }

  /**
   * Validate video compatibility for web playback
   */
  validateWebCompatibility(videoInfo) {
    const compatibility = {
      isCompatible: true,
      issues: [],
      recommendations: []
    };

    // Check format
    if (!this.supportedFormats.web.includes(videoInfo.extension.toLowerCase().replace('.', ''))) {
      compatibility.isCompatible = false;
      compatibility.issues.push(`Format ${videoInfo.extension} not web-compatible`);
      compatibility.recommendations.push('Convert to MP4, WebM, or OGG format');
    }

    // Check file size (rough estimate for web optimization)
    if (videoInfo.size > 100 * 1024 * 1024) { // 100MB
      compatibility.issues.push('Large file size may cause loading issues');
      compatibility.recommendations.push('Consider creating multiple quality versions');
    }

    return compatibility;
  }
}

export default VideoJSService;