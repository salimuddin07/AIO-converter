// API configuration for local backend
const API_CONFIG = {
  // Use localhost for both development and production (for now)
  baseURL: import.meta.env.VITE_BACKEND_URL || 'http://localhost:3003',
  
  // Comment out Railway URL - using local backend
  // railwayURL: 'https://gif-backend-production.up.railway.app',
  
  timeout: 30000,
  
  // API endpoints
  endpoints: {
    convert: '/api/convert',
    video: {
      upload: '/api/video/upload',
      info: '/api/video/info',
      convert: '/api/video/convert'
    },
    text: {
      upload: '/api/text/upload',
      uploadUrl: '/api/text/upload-url',
      fonts: '/api/text/fonts',
      preview: '/api/text/preview',
      addText: '/api/text/add-text'
    },
    ai: {
      describe: '/api/ai/describe'
    },
    split: '/api/split',
    webp: '/api/webp'
  }
};

// Helper function to get full URL
export const getApiUrl = (endpoint) => {
  const base = API_CONFIG.baseURL;
  console.log(`🔗 API Call: ${base}${endpoint}`);
  return `${base}${endpoint}`;
};

// Helper function to make API calls with error handling
export const apiCall = async (endpoint, options = {}) => {
  const url = getApiUrl(endpoint);
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: API_CONFIG.timeout,
  };
  
  try {
    console.log(`🚀 Making API call to: ${url}`);
    const response = await fetch(url, { ...defaultOptions, ...options });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response;
  } catch (error) {
    console.error(`❌ API call failed for ${url}:`, error);
    throw error;
  }
};

export default API_CONFIG;