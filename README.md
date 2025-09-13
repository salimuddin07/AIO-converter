# AIO Convert - All-in-One Media Converter

> **Founded by [Salimuddin](https://github.com/salimuddin93)** - Full-Stack Developer & Media Processing Expert

A comprehensive, modern media conversion platform built with Node.js and React. This application provides a unified interface for converting, processing, and manipulating various media formats including images, videos, and GIFs.

[![GitHub](https://img.shields.io/badge/GitHub-salimuddin93-181717?style=for-the-badge&logo=github)](https://github.com/salimuddin93)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-salimuddin--shaikh-0077B5?style=for-the-badge&logo=linkedin)](https://www.linkedin.com/in/salimuddin-shaikh-330a7b2a5)
[![Instagram](https://img.shields.io/badge/Instagram-@salimuddin__shaikh__786-E4405F?style=for-the-badge&logo=instagram)](https://www.instagram.com/salimuddin_shaikh_786)

## 🚀 Features

### Image Processing
- **Format Conversion**: JPEG, PNG, WebP, AVIF, GIF, BMP, TIFF, SVG
- **Image Manipulation**: Resize, crop, rotate, optimize, apply effects
- **Intelligent Service Selection**: Automatically chooses optimal processing library (Sharp, Jimp, ImageMagick)
- **Batch Processing**: Convert multiple files simultaneously
- **Advanced Effects**: Filters, overlays, watermarks, text addition

### Video Processing  
- **Format Conversion**: MP4, AVI, MOV, WebM, MKV, M4V, 3GP, FLV
- **Video Manipulation**: Split, merge, resize, quality adjustment
- **Scene Detection**: Intelligent video segmentation
- **Frame Extraction**: Extract specific frames or sequences
- **Web Optimization**: Multiple quality presets for web delivery

### GIF Processing
- **GIF Creation**: Convert videos/images to animated GIFs  
- **Frame Manipulation**: Extract, edit, and reassemble GIF frames
- **Optimization**: Size and quality optimization for web
- **Scene Filtering**: Smart frame selection based on content analysis
- **Text Overlay**: Add animated text to GIFs

### Modern Architecture
- **Consolidated Services**: Replaced 20+ duplicate services with 3 unified processors
- **Intelligent Service Selection**: Automatic optimal library selection based on operation and file characteristics
- **Event-Driven Processing**: Real-time progress tracking and status updates
- **Clean API Design**: RESTful endpoints with comprehensive error handling
- **Factory Pattern**: Centralized service management and configuration

## 📁 Project Structure

```
📦 GIF converter/
├── 📂 backend/                 # Node.js Express API
│   ├── 📂 src/
│   │   ├── 📂 controllers/     # Request handlers
│   │   ├── 📂 routes/          # API route definitions
│   │   ├── 📂 services/        # Core processing services
│   │   │   ├── 📄 image-processor.js    # Unified image processing
│   │   │   ├── 📄 video-processor.js    # Unified video processing
│   │   │   ├── 📄 gif-processor.js      # Unified GIF processing
│   │   │   └── 📄 index.js              # ServiceFactory & orchestration
│   │   ├── 📂 lib/             # Utility libraries
│   │   │   └── 📄 file-paths.js         # Centralized file management
│   │   ├── 📂 middleware/      # Express middleware
│   │   ├── 📂 config/          # Configuration files
│   │   ├── 📄 app.js           # Express application setup
│   │   └── 📄 server.js        # Server entry point
│   ├── 📄 package.json
│   └── 📄 eslint.config.js
├── 📂 frontend/                # React SPA
│   ├── 📂 src/
│   │   ├── 📂 components/      # React components
│   │   ├── 📂 utils/           # Frontend utilities
│   │   ├── 📄 App.jsx          # Main application component
│   │   └── 📄 main.jsx         # React entry point
│   ├── 📄 package.json
│   ├── 📄 vite.config.js
│   └── 📄 index.html
├── 📄 README.md                # This file
└── 📄 ARCHITECTURE.md          # Detailed architecture documentation
```

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 18+ and npm
- FFmpeg (for video processing)
- ImageMagick (for advanced image operations)

### Backend Setup
```bash
cd backend
npm install
npm run dev    # Development server with hot reload
npm start      # Production server
```

### Frontend Setup  
```bash
cd frontend
npm install
npm run dev    # Development server with hot reload
npm run build  # Production build
```

### Environment Configuration
Create `.env` files in both backend and frontend directories:

**Backend `.env`:**
```env
NODE_ENV=development
PORT=3001
OPENAI_API_KEY=your_openai_key_here
MAX_FILE_SIZE_MB=500
MAX_BATCH_COUNT=20
```

**Frontend `.env`:**
```env
VITE_API_BASE_URL=http://localhost:3001
VITE_MAX_FILE_SIZE=500
```

## 🔧 Core Services Architecture

### ImageProcessor
The consolidated image processing service that intelligently selects the optimal library:

```javascript
import { imageProcessor } from './services/index.js';

// Automatic optimal library selection
const result = await imageProcessor.convertImage('input.jpg', {
  format: 'webp',
  quality: 85,
  width: 1200
});

// Batch processing with concurrency control  
const results = await imageProcessor.batchConvert(files, {
  format: 'webp',
  concurrent: 4
});
```

### VideoProcessor  
Event-driven video processing with progress tracking:

```javascript  
import { videoProcessor } from './services/index.js';

// Set up event listeners
videoProcessor.on('progress', (progress) => {
  console.log(`Processing: ${progress.percent}%`);
});

// Convert with quality presets
const result = await videoProcessor.convertVideo('input.mp4', {
  format: 'webm',
  quality: 'high',
  width: 1920,
  height: 1080
});
```

### GifProcessor
Advanced GIF creation with scene detection:

```javascript
import { gifProcessor } from './services/index.js';

// Create optimized GIF from video  
const result = await gifProcessor.createFromVideo('input.mp4', {
  fps: 15,
  width: 500,
  duration: 10,
  sceneDetection: true
});

// Extract frames with filtering
const frames = await gifProcessor.extractFrames('input.gif', {
  sceneThreshold: 0.3,
  maxFrames: 50
});
```

## 🎯 API Endpoints

### Image Operations
- `POST /api/convert/image` - Convert image formats
- `POST /api/convert/batch` - Batch image conversion
- `POST /api/image/resize` - Resize images  
- `POST /api/image/effects` - Apply effects and filters

### Video Operations
- `POST /api/convert/video` - Convert video formats
- `POST /api/video/split` - Split videos into segments
- `POST /api/video/extract` - Extract frames from video
- `GET /api/video/status/:jobId` - Get conversion status

### GIF Operations  
- `POST /api/gif/create` - Create GIF from video/images
- `POST /api/gif/split` - Extract frames from GIF
- `POST /api/gif/optimize` - Optimize GIF size and quality
- `POST /api/gif/text` - Add text overlay to GIF

### Utility Endpoints
- `GET /api/files/list` - List processed files
- `GET /api/files/download/:id` - Download processed files
- `DELETE /api/files/cleanup` - Clean up temporary files

## 🧪 Development

### Code Quality
```bash
# Backend linting
cd backend
npm run lint        # Check code style
npm run lint:fix    # Auto-fix style issues

# Frontend linting  
cd frontend
npm run lint        # Check code style
npm run lint:fix    # Auto-fix style issues
```

### Project Standards
- **ES Modules**: All code uses modern ES module syntax
- **Async/Await**: Promise-based asynchronous operations
- **Error Handling**: Comprehensive error catching and user-friendly messages
- **Documentation**: JSDoc comments for all public functions
- **Type Safety**: Runtime type checking and validation
- **Security**: Input validation, file type restrictions, path traversal protection

### Service Factory Pattern
The project uses a centralized ServiceFactory for intelligent service selection:

```javascript
import { serviceFactory } from './services/index.js';

// Get optimal service for file type and operation
const service = serviceFactory.getServiceFor('.mp4', 'convert');
const result = await service.convertVideo(inputPath, options);

// Get services by capability
const videoServices = serviceFactory.getServicesByCategory('video');
```

## 🚀 Deployment

### Production Build
```bash
# Backend (API server)
cd backend  
npm start

# Frontend (Static files)
cd frontend
npm run build
# Deploy dist/ folder to CDN/web server
```

### Environment Variables
Ensure all production environment variables are configured:
- API endpoints
- File size limits  
- Storage paths
- External service API keys

## 🤝 Contributing

1. **Code Style**: Follow the ESLint configuration
2. **Documentation**: Add JSDoc comments for new functions
3. **Testing**: Test all new features thoroughly
4. **Service Integration**: Use the ServiceFactory pattern for new services
5. **Error Handling**: Implement comprehensive error handling

## 📋 Recent Refactoring

This project underwent a major refactoring to improve code quality and maintainability:

### ✅ Completed Improvements
- **Service Consolidation**: Replaced 20+ duplicate services with 3 unified processors
- **Architecture Modernization**: Implemented ServiceFactory pattern and WorkflowOrchestrator  
- **Code Cleanup**: Removed corrupted files and duplicate components
- **Import Path Updates**: Centralized utilities and updated all import statements
- **Component Consolidation**: Removed duplicate Header/Footer/WebP components
- **Documentation**: Added comprehensive inline documentation
- **Configuration**: Added ESLint configuration and improved npm scripts

### 🔧 Technical Debt Resolved
- Fixed severely corrupted `split.js` route file (2638+ lines of duplicate imports)
- Eliminated service overlap and confusion
- Standardized file path utilities
- Improved error handling consistency
- Enhanced code organization and modularity

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🔗 Related Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Detailed technical architecture
- [API Documentation](./docs/api.md) - Complete API reference
- [Development Guide](./docs/development.md) - Development workflow and guidelines

---

**Built with ❤️ for modern media processing needs**
  - Automatic scene-based splitting using AI detection
  - Progress tracking for long operations
  - Batch download of all segments as ZIP
- **GIF Frame Extraction**:
  - Extract all frames from animated GIFs
  - Scene-based frame extraction with similarity detection
  - Multiple output formats (PNG, JPG, WebP)
  - Duplicate frame filtering
  - Batch frame downloads

### 🛠️ **Advanced Features**
- **Real-time Progress Tracking**: Monitor conversion progress with detailed status updates
- **Job Management**: Queue multiple operations with unique job IDs
- **Automatic Cleanup**: Smart temporary file management
- **API-First Design**: RESTful API with comprehensive endpoints
- **Error Handling**: Robust error handling with detailed feedback
- **Mobile Responsive**: Works seamlessly across all devices

## 🏗️ **Tech Stack**

### **Backend**
- **Runtime**: Node.js 18+ with Express.js
- **Media Processing**: 
  - FFmpeg with fluent-ffmpeg for video operations
  - Sharp for image processing
  - ImageMagick integration for advanced operations
- **File Handling**: Multer for uploads, Archiver for ZIP creation
- **Architecture**: EventEmitter-based services for scalable processing
- **API**: RESTful design with comprehensive error handling

### **Frontend**
- **Framework**: React 18 with modern hooks
- **Build Tool**: Vite for fast development and optimized builds
- **Styling**: Modern CSS with responsive design
- **UI/UX**: Professional interface with progress indicators
- **Notifications**: Smart notification system for user feedback

### **Development & Testing**
- **Testing**: Jest + Supertest for comprehensive API testing
- **Development**: Hot reload with Vite dev server
- **Code Quality**: ESLint configuration for consistent code style
- **Environment**: Configurable environment variables

## 📋 **Prerequisites**

- **Node.js**: Version 18.0.0 or higher
- **FFmpeg**: Required for video processing (automatically handled by ffmpeg-static)
- **RAM**: Minimum 4GB recommended for large media files
- **Storage**: Adequate space for temporary file processing

## ⚡ **Quick Start**

### **1. Clone Repository**
```bash
git clone https://github.com/salimuddin93/gif-converter.git
cd gif-converter
```

### **2. Install Dependencies**
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### **3. Start Development Servers**

**Backend Server:**
```bash
cd backend
npm run dev
```
Server runs on http://localhost:4000

**Frontend Server:**
```bash
cd frontend
npm run dev
```
Frontend runs on http://localhost:5173

### **4. Access Application**
Open http://localhost:5173 in your browser to start using AIO Convert!

## 🔧 **Configuration**

### **Environment Variables**
Create a `.env` file in the `backend` directory:

```env
# Server Configuration
PORT=4000
NODE_ENV=development

# File Processing
MAX_FILE_SIZE_MB=500
MAX_BATCH_COUNT=50
TEMP_DIR=./temp
OUTPUT_DIR=./output

# Cleanup Settings
FILE_TTL_MINUTES=60
CLEANUP_INTERVAL_CRON="*/30 * * * *"

# Image Quality
JPEG_QUALITY=85
PNG_COMPRESSION=6
WEBP_QUALITY=80

# Video Processing
FFMPEG_TIMEOUT=300000
VIDEO_QUALITY_PRESET=medium
```

## 📡 **API Documentation**

### **Image Conversion**

#### **Convert Images**
```http
POST /api/convert
Content-Type: multipart/form-data

files: <image files>
targetFormat: png|jpg|jpeg|gif|webp|bmp
quality: 1-100 (optional)
singleGif: true|false (optional)
gif.frameDelay: <milliseconds> (optional)
gif.loop: <number> (optional, 0 = infinite)
```

**Response:**
```json
{
  "results": [
    {
      "originalName": "image1.png",
      "convertedName": "converted_1234567890.jpg",
      "url": "/api/files/converted_1234567890.jpg",
      "sizeBytes": 245760,
      "mimeType": "image/jpeg",
      "dimensions": { "width": 1920, "height": 1080 }
    }
  ]
}
```

### **Video Processing**

#### **Convert Video to GIF**
```http
POST /api/video/to-gif
Content-Type: multipart/form-data

video: <video file>
startTime: <seconds> (optional)
endTime: <seconds> (optional)
fps: <frames per second> (optional)
quality: low|medium|high|custom (optional)
width: <pixels> (optional)
height: <pixels> (optional)
```

#### **Split Video**
```http
POST /api/split/video
Content-Type: multipart/form-data

video: <video file>
splitBy: manual|scenes
segments: [{"start": 0, "end": 30}, {"start": 30, "end": 60}] (for manual)
sceneThreshold: 0.1-1.0 (for scene detection)
maxSegments: <number>
outputFormat: mp4|avi|webm|mov
quality: low|medium|high|custom
```

### **GIF Processing**

#### **Split GIF into Frames**
```http
POST /api/split/gif
Content-Type: multipart/form-data

image: <gif file>
outputFormat: png|jpg|jpeg|webp
splitBy: frames|scenes
quality: 1-100
resize: <width>x<height> (optional)
skipDuplicates: true|false
maxFrames: <number>
```

### **Job Management**

#### **Check Job Status**
```http
GET /api/split/video/status/{jobId}
GET /api/split/gif/status/{jobId}
```

**Response:**
```json
{
  "success": true,
  "jobId": "uuid-string",
  "status": "processing|completed|failed",
  "progress": {
    "totalSegments": 10,
    "completedSegments": 7,
    "percentage": 70
  },
  "result": { /* job results */ },
  "error": null
}
```

#### **Download Results**
```http
GET /api/split/video/download/{jobId}/{filename}    # Individual file
GET /api/split/video/download-all/{jobId}           # ZIP archive
GET /api/split/gif/download/{jobId}/{filename}      # Individual frame
GET /api/split/gif/download-zip/{jobId}             # ZIP archive
```

#### **Cancel Job**
```http
POST /api/split/video/cancel/{jobId}
POST /api/split/gif/cancel/{jobId}
```

### **File Management**

#### **Serve Converted Files**
```http
GET /api/files/{filename}
```

#### **Health Check**
```http
GET /health
```

## 🧪 **Testing**

### **Run Backend Tests**
```bash
cd backend
npm test
```

### **Run Frontend Tests**
```bash
cd frontend
npm test
```

### **API Testing with curl**
```bash
# Convert image
curl -X POST http://localhost:4000/api/convert \
  -F "files=@image.png" \
  -F "targetFormat=jpg" \
  -F "quality=85"

# Split video by scenes
curl -X POST http://localhost:4000/api/split/video \
  -F "video=@video.mp4" \
  -F "splitBy=scenes" \
  -F "sceneThreshold=0.3" \
  -F "outputFormat=mp4"
```

## 📦 **Deployment**

### **Production Build**
```bash
# Build frontend
cd frontend
npm run build

# Start production server
cd ../backend
npm start
```

### **Docker Deployment**
```dockerfile
# Dockerfile example
FROM node:18-alpine

# Install FFmpeg
RUN apk add --no-cache ffmpeg

# Copy and install dependencies
WORKDIR /app
COPY package*.json ./
RUN npm install --production

# Copy source code
COPY . .

EXPOSE 4000
CMD ["npm", "start"]
```

## 🔒 **Security Features**

- **File Type Validation**: Strict MIME type checking
- **File Size Limits**: Configurable upload size restrictions
- **Input Sanitization**: Comprehensive input validation
- **Temporary File Cleanup**: Automatic cleanup prevents disk overflow
- **Error Handling**: Detailed errors without exposing internal structure
- **CORS Configuration**: Proper cross-origin resource sharing setup

## 📈 **Performance Optimization**

- **Streaming Processing**: Large files processed in streams
- **Memory Management**: Efficient memory usage for large operations
- **Concurrent Processing**: Multiple jobs handled simultaneously
- **Caching Strategy**: Smart caching for frequently accessed files
- **Progress Tracking**: Real-time progress updates for long operations

## 🛣️ **Roadmap**

### **Phase 1: Enhanced Media Support**
- [ ] Audio file processing (MP3, WAV, FLAC)
- [ ] PDF to image conversion
- [ ] Advanced image filters and effects
- [ ] Bulk operations API

### **Phase 2: AI Integration**
- [ ] Smart image upscaling
- [ ] Automatic image enhancement
- [ ] Content-aware cropping
- [ ] Background removal

### **Phase 3: Cloud Integration**
- [ ] Cloud storage integration (AWS S3, Google Drive)
- [ ] CDN integration for faster delivery
- [ ] User accounts and history
- [ ] API rate limiting and authentication

## 🤝 **Contributing**

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit changes**: `git commit -m 'Add amazing feature'`
4. **Push to branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### **Development Guidelines**
- Follow existing code style and conventions
- Add tests for new features
- Update documentation for API changes
- Ensure all tests pass before submitting PR

## 📝 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 **About the Developer**

**Salimuddin** is a passionate Full-Stack Developer and Media Processing Expert with extensive experience in building scalable web applications and media processing solutions.

### **Connect with Salimuddin**
- 🐙 **GitHub**: [salimuddin93](https://github.com/salimuddin93)
- 💼 **LinkedIn**: [salimuddin-shaikh](https://www.linkedin.com/in/salimuddin-shaikh-330a7b2a5)
- 📸 **Instagram**: [@salimuddin_shaikh_786](https://www.instagram.com/salimuddin_shaikh_786)
- 🐦 **X (Twitter)**: [@salim_sk_7860](https://x.com/salim_sk_7860)
- 📘 **Facebook**: [salimuddin.shaikh.7](https://www.facebook.com/salimuddin.shaikh.7)

## 🎯 **Support**

If you encounter any issues or have questions:

1. **Check the Documentation**: Most common issues are covered above
2. **Search Issues**: Check if your issue already exists in GitHub Issues
3. **Create New Issue**: If you can't find a solution, create a detailed issue report
4. **Contact Developer**: Reach out through any of the social media links above

## ⭐ **Show Your Support**

If you find this project helpful, please consider:
- Giving it a ⭐ on GitHub
- Sharing it with others who might benefit
- Contributing to the codebase
- Following the developer on social media

---

<div align="center">

**Built with ❤️ by [Salimuddin](https://github.com/salimuddin93)**

*Professional Media Processing Made Simple*

</div>