const LOCAL_CONFIG = {
  processing: {
    maxFileSize: {
      image: 25,
      video: 100,
      pdf: 25
    },
    supportedFormats: {
      input: ["jpg", "jpeg", "png", "gif", "bmp", "webp", "mp4", "avi", "mov", "wmv", "pdf"],
      output: ["jpg", "jpeg", "png", "gif", "webp", "pdf", "md"]
    },
    quality: {
      default: 0.8,
      high: 0.9,
      medium: 0.7,
      low: 0.5
    }
  },
  features: {
    imageConversion: true,
    gifCreation: true,
    videoToGif: true,
    imageEditing: true,
    textToImage: true,
    imageSplitting: true,
    webpConversion: true,
    pdfToMarkdown: true
  }
};

export const API_CONFIG = {
  baseUrl: "http://localhost:3003",
  endpoints: {
    // Conversion routes
    convert: "/api/convert",
    convertTest: "/api/convert/test",
    
    // Video routes
    videoUpload: "/api/video/upload",
    videoInfo: "/api/video/info",
    videoConvert: "/api/video/convert", 
    videoPreview: "/api/video/preview",
    videoGifPreview: "/api/video/gif-preview",
    videoDownload: "/api/video/download",
    videoCleanup: "/api/video/cleanup",
    
    // Text routes
    textUpload: "/api/text/upload",
    textUploadUrl: "/api/text/upload-url", 
    textAddText: "/api/text/add-text",
    textFonts: "/api/text/fonts",
    textFormats: "/api/text/formats",
    textPreview: "/api/text/preview",
    textDownload: "/api/text/download",
    
    // Split routes
    splitVideo: "/api/split/video",
    splitGif: "/api/split/gif", 
    splitStatus: "/api/split/status",
    
    // AI routes
    ai: "/api/ai",
    aiDescribe: "/api/ai/describe",
    
    // File routes
    files: "/api/files",
    
    // WebP routes
    webp: "/api/webp",
    webpInfo: "/api/webp-info",
    
    // Enhanced GIF routes
    enhancedGif: "/api/enhanced-gif",
    
    // Modern format routes
    modern: "/api/modern"
  },
  local: LOCAL_CONFIG,
  isLocal: true,
  getLocalConfig: () => LOCAL_CONFIG
};

// Get API URL helper function
export const getApiUrl = (endpoint) => {
  return `${API_CONFIG.baseUrl}${API_CONFIG.endpoints[endpoint] || endpoint}`;
};

export const validateFile = (file, type = "image") => {
  const appendFormOptions = (formData, options = {}) => {
    Object.entries(options).forEach(([key, value]) => {
      if (value === undefined || value === null) {
        return;
      }

      if (typeof value === 'object' && !(value instanceof File) && !(value instanceof Blob)) {
        formData.append(key, JSON.stringify(value));
      } else {
        formData.append(key, value);
      }
    });
  };
  if (file.type === "application/pdf") {
    type = "pdf";
  }
  
  const maxSize = LOCAL_CONFIG.processing.maxFileSize[type] * 1024 * 1024;
  
  if (file.size > maxSize) {
    throw new Error(`File too large. Maximum ${LOCAL_CONFIG.processing.maxFileSize[type]}GB allowed.`);
  }
  
  const supportedTypes = LOCAL_CONFIG.processing.supportedFormats.input;
  const fileExtension = file.name.split(".").pop().toLowerCase();
  
  if (!supportedTypes.includes(fileExtension)) {
    throw new Error(`Unsupported file type: ${fileExtension}`);
  }
  
  return true;
};

// Real API for backend communication
export const realAPI = {
  // Convert image formats
  convert: async (files, outputFormat, quality) => {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    formData.append('outputFormat', outputFormat);
    formData.append('quality', quality || 0.8);
    
    const response = await fetch(getApiUrl('convert'), {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  },

  // Video to GIF conversion
  videoToGif: async (videoFile, options = {}) => {
    const formData = new FormData();
    formData.append('video', videoFile);
    
    // Add options
    Object.keys(options).forEach(key => {
      formData.append(key, options[key]);
    });
    
    const response = await fetch(getApiUrl('videoUpload'), {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`Video upload failed: ${response.status}`);
    }
    
    return await response.json();
  },

  // Upload video from URL
  uploadVideoFromUrl: async (url) => {
    const formData = new FormData();
    formData.append('url', url);
    
    const response = await fetch(getApiUrl('videoUpload'), {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`Video URL upload failed: ${response.status}`);
    }
    
    return await response.json();
  },

  // Get video info
  getVideoInfo: async (videoId) => {
    const response = await fetch(getApiUrl('videoInfo') + `/${videoId}`);
    if (!response.ok) {
      throw new Error(`Failed to get video info: ${response.status}`);
    }
    return await response.json();
  },

  // Convert video to GIF
  convertVideoToGif: async (videoId, options) => {
    const response = await fetch(getApiUrl('videoConvert'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ videoId, ...options })
    });
    
    if (!response.ok) {
      throw new Error(`Video conversion failed: ${response.status}`);
    }
    
    return await response.json();
  },

  // Add text to image
  addText: async (imageFile, text, options = {}) => {
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('text', text);
    
    Object.keys(options).forEach(key => {
      formData.append(key, options[key]);
    });
    
    const response = await fetch(getApiUrl('textAddText'), {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`Add text failed: ${response.status}`);
    }
    
    return await response.json();
  },

  // Split GIF
  splitGif: async (gifFile, options = {}) => {
    const formData = new FormData();
    formData.append('gif', gifFile);
    Object.entries(options).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        formData.append(key, value);
      }
    });
    
    const response = await fetch(getApiUrl('splitGif'), {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`GIF split failed: ${response.status}`);
    }
    
    return await response.json();
  },

  // Split GIF from URL
  splitGifFromUrl: async (url, options = {}) => {
    const formData = new FormData();
    formData.append('url', url);
    Object.entries(options).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        formData.append(key, value);
      }
    });
    
    const response = await fetch(getApiUrl('splitGif'), {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`GIF split from URL failed: ${response.status}`);
    }
    
    return await response.json();
  },

  // Split Video into frames
  splitVideo: async (videoFile, options = {}) => {
    const formData = new FormData();
    if (videoFile) {
      formData.append('video', videoFile);
    }

    Object.entries(options).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        formData.append(key, value);
      }
    });

    const response = await fetch(getApiUrl('splitVideo'), {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Video split failed: ${response.status}`);
    }

    return await response.json();
  },

  splitVideoFromUrl: async (url, options = {}) => {
    const formData = new FormData();
    formData.append('url', url);

    Object.entries(options).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        formData.append(key, value);
      }
    });

    const response = await fetch(getApiUrl('splitVideo'), {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Video split from URL failed: ${response.status}`);
    }

    return await response.json();
  },

  // Upload image for text addition
  uploadImage: async (imageFile) => {
    const formData = new FormData();
    formData.append('image', imageFile);
    
    const response = await fetch(getApiUrl('textUpload'), {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`Image upload failed: ${response.status}`);
    }
    
    return await response.json();
  },

  // Upload image from URL for text addition
  uploadImageFromUrl: async (imageUrl) => {
    const response = await fetch(getApiUrl('textUpload') + '-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageUrl })
    });
    
    if (!response.ok) {
      throw new Error(`Image URL upload failed: ${response.status}`);
    }
    
    return await response.json();
  },

  // Get available fonts
  getFonts: async () => {
    const response = await fetch(getApiUrl('textFonts'));
    if (!response.ok) {
      throw new Error(`Failed to get fonts: ${response.status}`);
    }
    return await response.json();
  },

  // Preview text on image
  previewText: async (fileId, textConfig) => {
    const response = await fetch(getApiUrl('textPreview'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileId,
        ...textConfig,
        frameRange: { start: textConfig.frameStart, end: textConfig.frameEnd }
      })
    });
    
    if (!response.ok) {
      throw new Error(`Text preview failed: ${response.status}`);
    }
    
    return await response.json();
  },

  // Test API connection
  testConnection: async () => {
    try {
      const response = await fetch(getApiUrl('convertTest'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ test: 'connection' })
      });
      
      if (!response.ok) {
        throw new Error(`Test failed: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API Connection Test Failed:', error);
      throw error;
    }
  },

  // AI describe image
  describeImage: async (imageName) => {
    const response = await fetch(getApiUrl('aiDescribe'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: imageName })
    });
    
    if (!response.ok) {
      throw new Error(`Image description failed: ${response.status}`);
    }
    
    return await response.json();
  },

  // WebP conversion methods
  convertToWebp: async (files, settings = {}) => {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('images', file);
    });
    
    Object.entries(settings).forEach(([key, value]) => {
      formData.append(key, value);
    });
    
    const response = await fetch(getApiUrl('webp') + '/convert', {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`WebP conversion failed: ${response.status}`);
    }
    
    return await response.json();
  },

  decodeWebp: async (files, settings = {}) => {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('webp_files', file);
    });
    
    Object.entries(settings).forEach(([key, value]) => {
      formData.append(key, value);
    });
    
    const response = await fetch(getApiUrl('webp') + '/decode', {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`WebP decoding failed: ${response.status}`);
    }
    
    return await response.json();
  },

  createApngSequence: async (files, settings = {}) => {
    if (!files || files.length === 0) {
      throw new Error('Select at least one frame to build an APNG');
    }

    const formData = new FormData();
    files.forEach((file) => formData.append('images', file));
    appendFormOptions(formData, settings);

    const response = await fetch(getApiUrl('modern') + '/create-apng', {
      method: 'POST',
      body: formData
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload.success === false) {
      throw new Error(payload?.details || payload?.error || 'APNG creation failed');
    }

    return payload.result;
  },

  convertToAvifModern: async (files, settings = {}) => {
    if (!files || files.length === 0) {
      throw new Error('Select at least one image to convert to AVIF');
    }

    const results = [];
    for (const file of files) {
      const formData = new FormData();
      formData.append('image', file);
      appendFormOptions(formData, settings);

      const response = await fetch(getApiUrl('modern') + '/to-avif', {
        method: 'POST',
        body: formData
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok || payload.success === false) {
        throw new Error(payload?.details || payload?.error || `Failed to convert ${file.name} to AVIF`);
      }

      results.push({
        originalName: file.name,
        originalSize: file.size,
        ...payload.result
      });
    }

    return results;
  },

  convertToJxl: async (files, settings = {}) => {
    if (!files || files.length === 0) {
      throw new Error('Select at least one image to convert to JPEG XL');
    }

    const results = [];
    for (const file of files) {
      const formData = new FormData();
      formData.append('image', file);
      appendFormOptions(formData, settings);

      const response = await fetch(getApiUrl('modern') + '/to-jxl', {
        method: 'POST',
        body: formData
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok || payload.success === false) {
        throw new Error(payload?.details || payload?.error || `Failed to convert ${file.name} to JXL`);
      }

      results.push({
        originalName: file.name,
        originalSize: file.size,
        ...payload.result
      });
    }

    return results;
  },

  getModernFormatInfo: async (format) => {
    const response = await fetch(getApiUrl('modern') + `/format-info/${format}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch modern format info for ${format}`);
    }
    return await response.json();
  },

  compareModernFormats: async (file) => {
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch(getApiUrl('modern') + '/compare-formats', {
      method: 'POST',
      body: formData
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload.success === false) {
      throw new Error(payload?.details || payload?.error || 'Format comparison failed');
    }

    return payload;
  },

  // Enhanced GIF creation methods
  createGifFromVideo: async (videoFile, options = {}) => {
    const formData = new FormData();
    formData.append('video', videoFile);
    
    Object.entries(options).forEach(([key, value]) => {
      if (key === 'effects' && Array.isArray(value)) {
        formData.append(key, JSON.stringify(value));
      } else {
        formData.append(key, value);
      }
    });
    
    const response = await fetch(getApiUrl('enhancedGif') + '/video-to-gif', {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`GIF creation from video failed: ${response.status}`);
    }
    
    return await response.json();
  },

  createGifFromImages: async (imageFiles, options = {}) => {
    const formData = new FormData();
    imageFiles.forEach(file => {
      formData.append('images', file);
    });
    
    Object.entries(options).forEach(([key, value]) => {
      formData.append(key, value);
    });
    
    const response = await fetch(getApiUrl('enhancedGif') + '/images-to-gif', {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      let message = `GIF creation from images failed: ${response.status}`;
      try {
        const errorPayload = await response.json();
        if (errorPayload?.error) {
          message = `${errorPayload.error}${errorPayload.details ? ` - ${errorPayload.details}` : ''}`;
        }
      } catch (parseError) {
        // ignore body parse issues
      }
      throw new Error(message);
    }
    
    return await response.json();
  }
};

// Use real API instead of mock API
export const localAPI = realAPI;

// Download file function for real file downloads
export const downloadFile = async (url, filename) => {
  try {
    console.log(`Downloading: ${filename} from ${url}`);
    
    // If it's a relative URL, make it absolute
    const downloadUrl = url.startsWith('http') ? url : `${API_CONFIG.baseUrl}${url}`;
    
    const response = await fetch(downloadUrl);
    if (!response.ok) {
      throw new Error(`Download failed: ${response.status}`);
    }
    
    const blob = await response.blob();
    const downloadLink = document.createElement('a');
    downloadLink.href = URL.createObjectURL(blob);
    downloadLink.download = filename;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(downloadLink.href);
    
    console.log(`Successfully downloaded: ${filename}`);
  } catch (error) {
    console.error('Download error:', error);
    alert(`Download failed: ${error.message}`);
  }
};

export default API_CONFIG;
