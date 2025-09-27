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
  baseUrl: "",
  endpoints: {},
  local: LOCAL_CONFIG,
  isLocal: true,
  getLocalConfig: () => LOCAL_CONFIG
};

export const validateFile = (file, type = "image") => {
  if (file.type === "application/pdf") {
    type = "pdf";
  }
  
  const maxSize = LOCAL_CONFIG.processing.maxFileSize[type] * 1024 * 1024;
  
  if (file.size > maxSize) {
    throw new Error(`File too large. Maximum ${LOCAL_CONFIG.processing.maxFileSize[type]}MB allowed.`);
  }
  
  const supportedTypes = LOCAL_CONFIG.processing.supportedFormats.input;
  const fileExtension = file.name.split(".").pop().toLowerCase();
  
  if (!supportedTypes.includes(fileExtension)) {
    throw new Error(`Unsupported file type: ${fileExtension}`);
  }
  
  return true;
};

// Mock localAPI for basic functionality
export const localAPI = {
  convert: async (file, format, quality) => {
    console.log(`Converting ${file.name} to ${format}`);
    return {
      success: true,
      message: `Converted ${file.name} to ${format}`,
      result: { downloadUrl: '#', filename: `converted.${format}` }
    };
  },
  
  resize: async (file, width, height, maintainAspectRatio) => {
    console.log(`Resizing ${file.name} to ${width}x${height}`);
    return {
      success: true,
      message: `Resized ${file.name}`,
      result: { downloadUrl: '#', filename: `resized_${file.name}` }
    };
  },
  
  rotate: async (file, degrees) => {
    console.log(`Rotating ${file.name} by ${degrees} degrees`);
    return {
      success: true,
      message: `Rotated ${file.name}`,
      result: { downloadUrl: '#', filename: `rotated_${file.name}` }
    };
  },
  
  addText: async (file, text, options) => {
    console.log(`Adding text "${text}" to ${file.name}`);
    return {
      success: true,
      message: `Added text to ${file.name}`,
      result: { downloadUrl: '#', filename: `text_${file.name}` }
    };
  },
  
  videoToGif: async (file, options) => {
    console.log(`Converting video ${file.name} to GIF`);
    return {
      success: true,
      message: `Converted ${file.name} to GIF`,
      result: { downloadUrl: '#', filename: `${file.name.split('.')[0]}.gif` }
    };
  },
  
  splitGif: async (file) => {
    console.log(`Splitting GIF ${file.name}`);
    return {
      success: true,
      message: `Split ${file.name}`,
      result: { downloadUrl: '#', filename: `split_${file.name}` }
    };
  }
};

// Download file function
export const downloadFile = (url, filename) => {
  console.log(`Download requested: ${filename}`);
  alert(`Download feature will be implemented with actual processing. File: ${filename}`);
};

export default API_CONFIG;
