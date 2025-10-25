# AIO Converter - All-in-One Media Converter 🚀

> **Created by [Salimuddin](https://github.com/salimuddin07)** - Full-Stack Developer & Media Processing Expert

A comprehensive, modern media conversion platform featuring both **web application** and **desktop app** capabilities. Built with Node.js, React, and Electron with professional-grade architecture, properly named services, and **all libraries fully tested and working**.

## ✅ **Current Status: FULLY OPERATIONAL DUAL-MODE PLATFORM**

### 🖥️ **Desktop Application (Electron)**
- ✅ **Native Desktop App** - Full-featured Electron application
- ✅ **Local Processing** - No internet required, complete privacy
- ✅ **File System Access** - Direct file management and organization
- ✅ **Video Splitting with Audio** - Advanced FFmpeg integration with AAC encoding
- ✅ **Segment Renaming** - Click-to-rename video segments for organization
- ✅ **Real-time Preview** - Instant video segment previews and downloads

### 🌐 **Web Application**
- ✅ **Browser-based Interface** - Access from any modern web browser
- ✅ **Progressive Web App** - Responsive design across all devices
- ✅ **Cloud Processing** - Server-side media processing
- ✅ **Real-time Progress** - Live conversion status updates

**Backend Libraries:**
- ✅ **Sharp** - High-performance image processing 
- ✅ **FFmpeg** - Video conversion and manipulation with audio preservation
- ✅ **Canvas** - Server-side graphics rendering
- ✅ **Jimp** - Pure JavaScript image processing
- ✅ **WebP Service** - WebP conversion (Sharp fallback implemented)
- ✅ **GIF Encoder** - Animated GIF creation

**Frontend Libraries:**
- ✅ **GSAP** - High-performance animations
- ✅ **Framer Motion** - React animation framework
- ✅ **AnimeJS** - Lightweight animation library
- ✅ **Lottie Web** - After Effects animations
- ✅ **Three.js** - 3D graphics and WebGL
- ✅ **Konva** - 2D canvas library
- ✅ **P5.js** - Creative coding framework
- ✅ **D3.js** - Data visualization

**Development Servers:**
- ✅ **Frontend Server**: Running on `http://localhost:3001` (Vite)
- ✅ **Backend Server**: Running on `http://localhost:3003` (Express)
- ✅ **Desktop App**: Electron with local processing capabilities
- ✅ **Functionality Tester**: Available at `http://localhost:3003/functionality`


## 🚀 Features

### **📊 Current Project Status (Updated October 25, 2025)**
🟢 **FULLY OPERATIONAL** - All libraries tested and working  
🟢 **Desktop App Ready** - Native Electron application with local processing  
🟢 **Web App Ready** - Browser-based interface with cloud processing  
🟢 **Library Compatibility** - All Windows/macOS/Linux binary issues resolved  
🟢 **Audio Preservation** - FFmpeg configured for proper audio handling  
🟢 **Video Splitting** - Advanced segment creation with renaming capabilities  
🟢 **Testing Infrastructure** - Comprehensive validation system in place  
🟢 **Clean Architecture** - Professional service organization implemented  

### 🖥️ Desktop Application Features
- **🎬 Advanced Video Splitting**: Split videos into custom durations with preserved audio
- **🏷️ Segment Renaming**: Click-to-rename video segments for better organization
- **📱 Real-time Preview**: Instant video segment previews with download options
- **🔒 Complete Privacy**: All processing happens locally, no data leaves your computer
- **📁 File System Integration**: Direct access to your local files and folders
- **⚡ High Performance**: Native desktop performance with FFmpeg integration

### 🌐 Web Application Features
- **☁️ Cloud Processing**: Server-side conversion for any device
- **📊 Real-time Progress**: Live updates during conversion processes
- **🔄 Batch Operations**: Process multiple files simultaneously
- **📱 Responsive Design**: Works perfectly on desktop, tablet, and mobile
- **🌍 Cross-platform**: Access from any modern web browser

### Image Processing
- **Format Conversion**: JPEG, PNG, WebP, AVIF, GIF, BMP, TIFF, SVG
- **Image Manipulation**: Resize, crop, rotate, optimize, apply effects
- **Intelligent Service Selection**: Automatically chooses optimal processing library (Sharp, Jimp, ImageMagick)
- **Batch Processing**: Convert multiple files simultaneously
- **Advanced Effects**: Filters, overlays, watermarks, text addition
  

### Video Processing  
- **Format Conversion**: MP4, AVI, MOV, WebM, MKV, M4V, 3GP, FLV
- **Advanced Video Splitting**: Split videos by duration or custom segments with audio preservation
- **Video Segment Renaming**: Organize clips with custom names (Intro, Hook, Outro, etc.)
- **Audio Preservation**: Proper AAC encoding ensures audio quality in all segments
- **Quality Control**: Multiple quality presets for web delivery
- **Frame Extraction**: Extract specific frames or sequences
- **Real-time Preview**: Instant preview of video segments with download options

### GIF Processing
- **GIF Creation**: Convert videos/images to animated GIFs  
- **Frame Manipulation**: Extract, edit, and reassemble GIF frames
- **Optimization**: Size and quality optimization for web
- **Scene Filtering**: Smart frame selection based on content analysis
- **Text Overlay**: Add animated text to GIFs

### Desktop Application Exclusive Features
- **🎯 Click-to-Rename Segments**: Instantly rename video segments for better organization
- **📁 Local File Management**: Direct access to your computer's file system
- **🔒 Complete Privacy**: No internet required, all processing happens locally
- **⚡ Native Performance**: Full desktop application performance
- **🎬 Advanced FFmpeg Integration**: Professional-grade video processing
- **📱 Instant Preview**: Real-time video segment previews with working audio

### Modern Architecture
- **Dual-Mode Platform**: Both web and desktop applications from same codebase
- **Consolidated Services**: Replaced 20+ duplicate services with 3 unified processors
- **Intelligent Service Selection**: Automatic optimal library selection based on operation and file characteristics
- **Event-Driven Processing**: Real-time progress tracking and status updates
- **Clean API Design**: RESTful endpoints with comprehensive error handling
- **Factory Pattern**: Centralized service management and configuration
- **Electron Integration**: Native desktop capabilities with IPC communication

### Document Processing
- **PDF to Markdown**: Convert PDF documents to markdown format
- **Images to PDF**: Bundle multiple images into a single PDF document
  

## 📁 Project Structure

```
📦 GIF converter/
├── 📂 backend/                 # Node.js Express API
│   ├── 📂 src/
│   │   ├── 📂 controllers/     # Request handlers
│   │   │   └── 📄 webpController.js         # WebP-specific operations
│   │   ├── 📂 routes/          # API route definitions (NEW PROPER NAMING!)
│   │   │   ├── 📄 ConversionRoutes.js       # Main conversion endpoints
│   │   │   ├── 📄 SplitRoutes.js           # Video/GIF splitting operations
│   │   │   ├── 📄 VideoRoutes.js           # Video processing endpoints
│   │   │   ├── 📄 AiRoutes.js              # AI-powered enhancements
│   │   │   ├── 📄 TextRoutes.js            # Text processing operations
│   │   │   ├── 📄 FileRoutes.js            # File management endpoints
│   │   │   └── 📄 WebpRoutes.js            # WebP conversion routes
│   │   ├── 📂 services/        # Core processing services (COMPLETELY REFACTORED!)
│   │   │   ├── 📄 ImageProcessingService.js # Unified image processing
│   │   │   ├── 📄 VideoProcessingService.js # Unified video processing  
│   │   │   ├── 📄 GifProcessingService.js   # Unified GIF processing
│   │   │   ├── 📄 AiService.js              # AI-powered enhancements
│   │   │   ├── 📄 CleanupService.js         # File cleanup management
│   │   │   ├── 📄 ConversionService.js      # General conversion utilities
│   │   │   ├── 📄 EditService.js            # Image editing operations
│   │   │   ├── 📄 FfmpegService.js          # FFmpeg wrapper service
│   │   │   ├── 📄 GifService.js             # Advanced GIF operations
│   │   │   ├── 📄 SplitService.js           # Media splitting utilities
│   │   │   ├── 📄 TextService.js            # Text overlay processing
│   │   │   ├── 📄 VideoService.js           # Video manipulation tools
│   │   │   ├── 📄 WebPService.js            # WebP format handling
│   │   │   ├── 📄 SharpService.js           # Sharp image processing
│   │   │   ├── 📄 JimpService.js            # Pure JS image processing
│   │   │   ├── 📄 ImageMagickService.js     # ImageMagick integration
│   │   │   ├── 📄 EnhancedConversionService.js # Advanced conversions
│   │   │   ├── 📄 EnhancedJimpService.js    # Extended Jimp functionality
│   │   │   ├── 📄 MediaAnalysisService.js   # Media analysis tools
│   │   │   ├── 📄 CanvasGraphicsService.js  # Canvas-based graphics
│   │   │   ├── 📄 VideoJSService.js         # Video.js integration
│   │   │   ├── 📄 VideoSplitterService.js   # Video splitting utilities
│   │   │   └── 📄 index.js                  # ServiceFactory & Registry
│   │   ├── 📂 utils/           # Utility libraries (RENAMED FROM lib/)
│   │   │   └── 📄 FilePathUtils.js          # Centralized file management
│   │   ├── 📂 middleware/      # Express middleware (PROPER NAMING!)
│   │   │   ├── 📄 ErrorHandler.js           # Error handling middleware
│   │   │   └── 📄 FileValidator.js          # File validation middleware
│   │   ├── 📂 config/          # Configuration files
│   │   │   └── 📄 index.js                  # Main configuration
│   │   ├── 📄 app.js           # Express application setup
│   │   └── 📄 server.js        # Server entry point
│   ├── 📄 package.json
│   └── 📄 eslint.config.js
├── 📂 electron/                # Desktop Application
│   ├── 📄 main.js              # Electron main process with IPC handlers
│   ├── 📄 preload.js           # Secure preload script
│   └── 📄 main-old.js          # Legacy main process backup
├── 📂 frontend/                # React SPA
│   ├── 📂 src/
│   │   ├── 📂 components/      # React components (RENAMED & ORGANIZED!)
│   │   │   ├── 📄 MainConversionInterface.jsx   # Main conversion UI
│   │   │   ├── 📄 ProgressVisualization.jsx     # Progress tracking
│   │   │   ├── 📄 MainNavigation.jsx            # Navigation component
│   │   │   ├── 📄 ImageEditor.jsx               # Image editing interface
│   │   │   ├── 📄 FileManager.jsx               # File management UI
│   │   │   ├── 📄 VideoToGifConverter.jsx       # Video to GIF converter
│   │   │   ├── 📄 WebPConverter.jsx             # WebP conversion UI
│   │   │   ├── 📄 GifSplitter.jsx               # GIF splitting interface
│   │   │   ├── 📄 AddText.jsx                   # Text overlay component
│   │   │   ├── 📄 AdvancedUploadArea.jsx        # Advanced file upload
│   │   │   ├── � Footer.jsx                    # Footer component
│   │   │   ├── 📄 Header.jsx                    # Header component
│   │   │   ├── 📄 HomePage.jsx                  # Home page component
│   │   │   ├── 📄 Results.jsx                   # Results display
│   │   │   ├── 📄 Sidebar.jsx                   # Sidebar navigation
│   │   │   ├── 📄 SplitResults.jsx              # Split results display
│   │   │   ├── 📄 UploadArea.jsx                # File upload area
│   │   │   └── 📄 VideoResults.jsx              # Video results display
│   │   ├── �📂 utils/           # Frontend utilities
│   │   │   ├── 📄 NotificationService.js        # Notification system
│   │   │   └── 📄 polishedHelpers.js           # UI helper functions
│   │   ├── 📄 App.jsx          # Main application component
│   │   ├── 📄 main.jsx         # React entry point
│   │   └── 📄 aio-convert-style.css # Main stylesheet
│   ├── 📄 package.json
│   ├── 📄 vite.config.js
│   └── 📄 index.html
├── 📂 logs/                    # Application logs
├── 📂 output/                  # Processed file output
├── 📂 public/                  # Static assets
│   └── 📂 static/
├── 📂 temp/                    # Temporary processing files
├── 📂 uploads/                 # Uploaded files
├── 📄 README.md                # This file
├── 📄 ARCHITECTURE.md          # Detailed architecture documentation
└── 📄 package.json             # Root package configuration
```

## 🧪 **Library Testing & Validation**

### **Backend Library Testing**
All backend libraries have been thoroughly tested and verified:

```bash
cd backend
node library-test.js
```

**Test Results:**
```
Testing key libraries...

✅ Sharp: Working
✅ FFmpeg: Working  
✅ Canvas: Working
✅ Jimp: Working
✅ WebP Service: Working (Sharp fallback)
✅ GIF Encoder: Working

=== SUMMARY ===
✅ Passed: 6
❌ Failed: 0
```

### **Frontend Library Testing**
Frontend libraries tested through browser component:

- Access http://localhost:3001 and click "Library Test" 
- All animation and graphics libraries load successfully
- React components verify GSAP, Framer Motion, AnimeJS, Lottie, Three.js, Konva, P5.js, D3.js

### **Key Fixes Applied**
✅ **WebP Service Fix**: Removed problematic `node-webp`, implemented Sharp fallback  
✅ **Functionality Tester**: Added route at `/functionality` with proper HTML serving  
✅ **Library Compatibility**: All Windows binary issues resolved  
✅ **Service Architecture**: Clean imports and error handling throughout

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 18+ and npm
- FFmpeg (for video processing - included via ffmpeg-static in desktop app)
- ImageMagick (for advanced image operations)

### Quick Start - Desktop Application (Recommended)
```bash
# Clone the repository
git clone https://github.com/salimuddin07/GIF-converter.git
cd "AIO converter"

# Install dependencies
npm install

# Run the desktop application
npm run electron
```

### Quick Start - Web Application
```bash
# Backend Setup
cd backend
npm install
npm run dev    # Development server with hot reload

# Frontend Setup (in new terminal)
cd frontend
npm install
npm run dev    # Development server with hot reload
```

### Environment Configuration
Create `.env` files in both backend and frontend directories:

**Backend `.env`:**
```env
NODE_ENV=development
PORT=3003
OPENAI_API_KEY=your_openai_key_here
MAX_FILE_SIZE_GB=500
MAX_BATCH_COUNT=20
```

**Frontend `.env`:**
```env
VITE_API_BASE_URL=http://localhost:3003
VITE_MAX_FILE_SIZE=500
```
# GIF Converter

All-in-one media conversion toolkit powered by an Express (Node.js) backend and a Vite + React frontend. The application handles image, GIF, video, and document workflows with optimized processing pipelines and a modular service architecture.

- **Live targets**: convert, compress, and split media assets, extract frames, generate GIFs, and transform PDFs to Markdown.
- **Modern foundations**: FFmpeg, Sharp, Canvas, Jimp, and pdfjs-dist on the backend; React, Vite, and Tailwind-friendly styling on the frontend.
- **Production ready**: includes CSP-aware deployment guidance, mixed-content protections, and background cleanup jobs.

> Need more architectural depth? See [`ARCHITECTURE.md`](./ARCHITECTURE.md) for service diagrams and routing details.

---

## ✨ Features

| Category | Highlights |
| --- | --- |
| Image | Format conversion (JPEG/PNG/WebP/AVIF/JXL), resizing, optimization, overlays, batch jobs |
| Video | Format conversion, video splitting, frame extraction, optimized presets for web delivery |
| GIF | Create GIFs from videos or image sequences, split & edit frames, apply text and effects |
| Documents | PDF → Markdown conversion, images → PDF bundling |
| UX & Ops | Dynamic backend detection, progress visualisations, asset cleanup scheduler, CSP-safe frontend |

---

## 🧱 Tech Stack

- **Frontend:** React 18, Vite 5, modern CSS (with room for Tailwind/utility layers), pdfjs-dist, GSAP + motion libraries
- **Backend:** Node.js 18+, Express, Sharp, FFmpeg (via fluent-ffmpeg/ffmpeg-static), Canvas, Jimp, ImageMagick helpers
- **Tooling:** npm workspaces, ESLint, Nodemon, Concurrent dev runners, Vercel-ready frontend build

---

## 🗺️ Architecture at a Glance

- `backend/` exposes REST routes grouped by capability (conversion, split, AI, text, modern formats) backed by service modules.
- `frontend/` provides a single-page application that detects the backend URL at runtime and wraps network calls with mixed-content guards.
- A scheduled cleanup job purges temporary artifacts (`temp/`, `public/static/`) to keep disk usage predictable.
- Environment-variable driven configuration allows the same code base to run locally, on-prem, or in the cloud.

---

## 📁 Repository Layout

```
gif-converter/
├── backend/              # Express API and processing services
│   ├── src/
│   │   ├── controllers/  # Route handlers (e.g., WebP controller)
│   │   ├── routes/       # REST endpoints grouped by feature
│   │   ├── services/     # Image, video, GIF, AI, and utility services
│   │   ├── middleware/   # Error handling, file validation
│   │   ├── config/       # Centralised configuration helpers
│   │   └── app.js        # Express app wiring
│   ├── server.js         # HTTP server & cleanup scheduler
│   └── package.json
├── frontend/             # React application (Vite)
│   ├── src/
│   │   ├── components/   # Feature-specific UI modules
│   │   ├── utils/        # API client, pdf helpers, formatting
│   │   ├── App.jsx       # App shell
│   │   └── main.jsx      # Vite entry
│   ├── public/
│   ├── index.html
│   └── package.json
├── public/static/        # Generated media outputs (served by backend)
├── logs/                 # Text logs (rotated by cleanup job)
├── Dockerfile            # Containerised build (optional)
├── render.yaml           # Example Render.com spec (optional)
├── README.md             # This document
└── package.json          # Workspace & shared scripts
```

---

## ✅ Prerequisites

| Requirement | Notes |
| --- | --- |
| Node.js ≥ 18 & npm ≥ 8 | Required for both frontend and backend; npm 8+ enables workspace installs |
| FFmpeg | Needed for video/GIF manipulation. Install via package manager (`choco install ffmpeg` on Windows, `brew install ffmpeg` on macOS) or download binaries from [ffmpeg.org](https://ffmpeg.org/). |
| ImageMagick | Unlocks additional raster/vector conversions (`choco install imagemagick` or `brew install imagemagick`). |
| Build tools (Windows) | Sharp/Canvas require native build tools. Install “Desktop development with C++” workload (Visual Studio Build Tools) and the Windows 10 SDK. |

Optional services such as OpenAI require corresponding API keys (see environment variables below).

---

## 🚀 Quick Start

```powershell
# 1. Install all workspaces (root + backend + frontend)
npm install

# 2. Start both servers with hot reload
npm run dev

# Frontend: http://localhost:3001
# Backend:  http://localhost:3003
```

> **Tip:** Run `npm run dev:backend` or `npm run dev:frontend` from the repository root if you want to start either stack individually.

Stop the servers with `Ctrl+C`. Nodemon (backend) and Vite (frontend) automatically reload on file changes.

---

## 🔐 Environment Variables

Create `.env` files in both the `backend/` and `frontend/` folders. The application provides sensible defaults but configuring these variables keeps behaviour predictable.

### Backend (`backend/.env`)

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `3003` | HTTP port for the Express API. |
| `MAX_FILE_SIZE_GB` | `10` | Maximum upload size per file. |
| `MAX_BATCH_COUNT` | `30` | Max items in a batch conversion request. |
| `JPEG_QUALITY` | `80` | Default quality for JPEG outputs. |
| `FILE_TTL_MINUTES` | `30` | Retention window for temporary assets before cleanup. |
| `OPENAI_API_KEY` | *(unset)* | Enables AI-powered features when provided. |

### Frontend (`frontend/.env`)

| Variable | Description |
| --- | --- |
| `VITE_BACKEND_URL` | Preferred backend base URL (e.g., `http://localhost:3003` for local dev or `https://api.example.com` in production). |
| `VITE_API_BASE_URL` / `VITE_BACKEND_BASE_URL` / `VITE_APP_BACKEND_URL` | Legacy aliases also honoured at runtime. |
| `VITE_MAX_FILE_SIZE` | Optional UI limit (in MB) shown to users. |

> When the frontend is hosted over HTTPS (e.g., on Vercel), the backend **must** be available over HTTPS. Otherwise the browser will block requests; the app now surfaces a mixed-content warning explaining how to fix it.

---

## 🧑‍💻 Development Scripts

| Command | Location | Description |
| --- | --- | --- |
| `npm run dev` | root | Start backend (nodemon) + frontend (Vite) concurrently. |
| `npm run dev:backend` | root | Start only the Express API. |
| `npm run dev:frontend` | root | Start only the React SPA. |
| `npm run lint` | root | Run ESLint for both workspaces. |
| `npm run lint:fix` | root | Auto-fix lint issues. |
| `npm run clean` | root | Remove all `node_modules` folders (useful before reinstalling deps). |

Backend and frontend packages also expose their own `npm run lint`, `npm run build`, etc.

---

## 🏗️ Production Build & Deployment

### Build artifacts locally

```powershell
# Frontend bundle (outputs to frontend/dist)
cd frontend
npm run build

# Backend production start
cd ../backend
npm install --production
npm start
```

### Deploying the frontend (Vercel or static hosting)

1. Set `VITE_BACKEND_URL` (or `VITE_API_BASE_URL`) in the deployment environment to the HTTPS endpoint of your backend.
2. Trigger a Vercel build; the production bundle lives in `frontend/dist`.
3. Ensure your hosting configuration includes the CSP headers from `frontend/vercel.json`.

### Deploying the backend

The backend is a standard Node.js server; you can:

- Deploy to services like Render, Railway, Fly.io, or a VPS (see `render.yaml` for a template).
- Provide the same environment variables shown above.
- Expose the server via HTTPS (use a reverse proxy such as Nginx or a managed certificate service).

---

## 🗂️ Storage & Housekeeping

- **Temporary files** live in `temp/` and `public/static/`. A scheduled cleanup job removes stale assets based on `FILE_TTL_MINUTES`.
- **Logs** are written to `logs/`. Rotate or prune them regularly if deploying long-term.
- Use `npm run clean` (root) to delete workspace dependencies before reinstalling modules.
- For manual cleanup, you can also empty `public/static` and `temp`—the app recreates them at startup if missing.

---

## 🛠️ Troubleshooting

| Symptom | Likely Cause | Fix |
| --- | --- | --- |
| `TypeError: Failed to fetch` with a mixed-content warning | Frontend served over HTTPS while backend uses HTTP | Host the backend behind HTTPS and update `VITE_BACKEND_URL`. |
| `Error: spawn ffmpeg ENOENT` | FFmpeg binary missing | Install FFmpeg and ensure it is on your system PATH. |
| `sharp`/`canvas` install failures (Windows) | Native build tools missing | Install Visual Studio Build Tools (C++ workload) and retry `npm install`. |
| Large bundle warning during `npm run build` | Feature-rich frontend | Consider enabling code-splitting or lazy-loading if bundle size becomes an issue. |
| Temp folders filling up | Long-running processing jobs | Lower `FILE_TTL_MINUTES` or run a periodic cleanup job (`CleanupService`). |

---

## 🤝 Contributing

1. Fork the repository and create a feature branch.
2. Follow the existing service/component patterns.
3. Run `npm run lint` (and relevant builds) before submitting a pull request.

Bug reports and feature suggestions are welcome via GitHub issues.

---

## 📄 License

Distributed under the MIT License (see `package.json`).

---

### Maintainer

Built and maintained by [Salimuddin](https://github.com/salimuddin07). Feel free to reach out for professional support or custom integrations.

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
MAX_FILE_SIZE_GB=500
MAX_BATCH_COUNT=20
```

**Frontend `.env`:**
```env
VITE_API_BASE_URL=http://localhost:3001
VITE_MAX_FILE_SIZE=500
```

## 🔧 Core Services Architecture

### Modern Service Organization
This project features a completely refactored service architecture with proper naming conventions:

### ImageProcessingService.js
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

### VideoProcessingService.js  
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

### GifProcessingService.js
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

### ServiceFactory Pattern
Centralized service management with intelligent selection:

```javascript
import { serviceFactory } from './services/index.js';

// Get optimal service for file type and operation
const service = serviceFactory.getServiceFor('.mp4', 'convert');
const result = await service.convertVideo(inputPath, options);

// Get services by capability
const videoServices = serviceFactory.getServicesByCategory('video');
```

## 🎯 API Endpoints

### Image Operations
- `POST /api/convert` - Convert image formats (via ConversionRoutes.js)
- `POST /api/convert/batch` - Batch image conversion
- `POST /api/convert/gif-editor` - Advanced GIF editing
- `POST /api/convert/validate` - Validate conversion options

### Video Operations
- `POST /api/video/convert` - Convert video formats (via VideoRoutes.js)
- `POST /api/split/video` - Split videos into segments (via SplitRoutes.js)
- `GET /api/split/video/status/:jobId` - Get video processing status
- `GET /api/split/video/download/:jobId` - Download processed video segments

### GIF Operations  
- `POST /api/convert/gif-advanced` - Advanced GIF processing
- `POST /api/split/gif` - Extract frames from GIF (via SplitRoutes.js)
- `GET /api/split/gif/status/:jobId` - Get GIF processing status
- `GET /api/split/gif/download-zip/:jobId` - Download extracted frames

### WebP Operations
- `POST /api/webp/convert` - WebP conversion (via WebpRoutes.js)
- `POST /api/webp/batch` - Batch WebP processing

### Text & AI Operations
- `POST /api/text/overlay` - Add text overlays (via TextRoutes.js)
- `POST /api/ai/enhance` - AI-powered enhancements (via AiRoutes.js)

### File Management
- `GET /api/files/:filename` - Download processed files (via FileRoutes.js)
- `GET /api/files/list` - List available files
- `DELETE /api/files/cleanup` - Clean up temporary files
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

## 🚀 **Deployment**

### **⚠️ Important: Current Architecture**
**This project is fully functional locally with all libraries working.** For production deployment:

#### **Frontend → Vercel (Recommended)**
```bash
# Deploy frontend to Vercel
cd frontend
npm run build
vercel --prod
```

#### **Backend → Render/DigitalOcean/Self-managed**

> Railway deployment was retired on 2025-10-04. Use your preferred Node.js host instead.

**Suggested host (Render)**
1. Connect GitHub repo to Render
2. Use Web Service deployment
3. Build Command: `cd backend && npm install`
4. Start Command: `cd backend && npm start`

**✅ All Required Dependencies Included:**
- FFmpeg: Included via `ffmpeg-static`
- Sharp: Native binary compilation handled automatically
- Canvas: Native dependencies auto-installed
- All other libraries: Pure JavaScript, no binary dependencies

### **Environment Configuration**

**Frontend Environment (.env)**
```env
VITE_API_BASE_URL=http://localhost:3003
VITE_MAX_FILE_SIZE=500
```

**Backend Environment (.env)**
```env
NODE_ENV=development
PORT=3003
MAX_FILE_SIZE_GB=500
MAX_BATCH_COUNT=20
OPENAI_API_KEY=your_openai_key_here
CORS_ORIGIN=http://localhost:3001
```

**Production Environment (Self-hosted)**
```env
NODE_ENV=production
PORT=8080
MAX_FILE_SIZE_GB=500
MAX_BATCH_COUNT=20
OPENAI_API_KEY=your_openai_key_here
CORS_ORIGIN=https://your-frontend-url.vercel.app
```

### **Deployment Steps**

1. **Deploy Backend First**:
  - Push code to GitHub
  - Connect to your hosting provider
   - Set environment variables
   - Get backend URL

2. **Deploy Frontend**:
   - Update `VITE_API_BASE_URL` with backend URL
   - Deploy to Vercel
   - Update CORS_ORIGIN in backend with frontend URL

3. **Test Connection**:
   - Verify API endpoints work
   - Test file uploads/downloads
   - Check CORS configuration

## 🤝 Contributing

1. **Code Style**: Follow the ESLint configuration
2. **Documentation**: Add JSDoc comments for new functions
3. **Testing**: Test all new features thoroughly
4. **Service Integration**: Use the ServiceFactory pattern for new services
5. **Error Handling**: Implement comprehensive error handling

## 📋 Recent Major Improvements ✅

### **✅ Desktop Application Features (October 2025)**
- **🎬 Advanced Video Splitting**: Fixed race condition bug, now properly returns video segments
- **🔊 Audio Preservation**: Implemented FFmpeg with AAC encoding for perfect audio quality
- **🏷️ Segment Renaming**: Click-to-rename functionality for organizing video clips
- **📱 Real-time Preview**: Fixed file:// URL handling for instant video segment previews
- **🔒 Local Processing**: Complete privacy with no internet dependency
- **⚡ Native Performance**: Full Electron integration with IPC communication

### **✅ Complete Library Validation (September 2025)**
- **All Backend Libraries Tested**: 6/6 libraries working perfectly
- **All Frontend Libraries Verified**: 8/8 animation libraries functional  
- **WebP Service Fixed**: Implemented Sharp fallback for reliable WebP conversion
- **Functionality Tester Added**: Full testing interface at `/functionality`
- **Development Environment**: Both servers running cleanly on ports 3001/3003

### **✅ Architecture Enhancements**
- **Service Factory Pattern**: Centralized service management implemented
- **Error Handling**: Comprehensive error catching with user-friendly messages
- **Library Fallbacks**: Graceful degradation when specific libraries unavailable
- **Testing Infrastructure**: Automated library validation and browser testing
- **Code Quality**: ESLint configuration and consistent code standards

### **✅ File Structure Improvements**

This project underwent a comprehensive refactoring with professional naming conventions:

### ✅ File Structure Improvements
- **Services Renamed**: All services now use proper PascalCase with descriptive suffixes
  - `image-processor.js` → `ImageProcessingService.js`
  - `video-processor.js` → `VideoProcessingService.js` 
  - `gif-processor.js` → `GifProcessingService.js`
  - `aiService.js` → `AiService.js`
  - `cleanupService.js` → `CleanupService.js`
  - And 15+ more services properly renamed

- **Routes Renamed**: All route files now clearly indicate their purpose
  - `convert.js` → `ConversionRoutes.js`
  - `split.js` → `SplitRoutes.js`
  - `video.js` → `VideoRoutes.js`
  - `ai.js` → `AiRoutes.js`
  - `text.js` → `TextRoutes.js`
  - `files.js` → `FileRoutes.js`
  - `webp.js` → `WebpRoutes.js`

- **Utilities Reorganized**: Better structure and naming
  - `lib/` directory → `utils/` directory
  - `file-paths.js` → `FilePathUtils.js`
  - `errorHandler.js` → `ErrorHandler.js`
  - `validateFiles.js` → `FileValidator.js`

- **Frontend Components**: React components now have clear, descriptive names
  - `AIOConvertMainInterface.jsx` → `MainConversionInterface.jsx`
  - `D3ProgressVisualization.jsx` → `ProgressVisualization.jsx`
  - `FullPageNavigation.jsx` → `MainNavigation.jsx`
  - `KonvaImageEditor.jsx` → `ImageEditor.jsx`
  - `SortableFileManager.jsx` → `FileManager.jsx`
  - `VideoToGif.jsx` → `VideoToGifConverter.jsx`

### ✅ Import System Overhaul
- **All Import Statements Updated**: Every import throughout the entire codebase has been updated
- **Path Consistency**: All utilities now use consistent `../utils/FilePathUtils.js` paths
- **Service References**: All service imports use the new proper names
- **Component References**: All React component imports and function names updated

### ✅ Code Quality Improvements
- **Professional Naming**: All files now follow industry-standard naming conventions
- **Better Organization**: Clear separation of concerns with descriptive file names
- **Improved Maintainability**: Much easier to locate and understand code purpose
- **Enhanced Readability**: Self-documenting file names that explain functionality

### 🔧 Technical Benefits Achieved
- **Service Consolidation**: Unified processors replace 20+ duplicate services
- **Architecture Modernization**: ServiceFactory pattern and WorkflowOrchestrator implemented
- **Documentation**: Comprehensive inline documentation added
- **Error Handling**: Improved consistency across all services
- **Modularity**: Clean separation between services, routes, and utilities

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

### **Backend (All Libraries Verified ✅)**
- **Runtime**: Node.js 22.15.0 with Express.js
- **Media Processing**: 
  - ✅ **Sharp** v0.33.5 - High-performance image processing
  - ✅ **FFmpeg** (fluent-ffmpeg + ffmpeg-static) - Video operations
  - ✅ **Canvas** v3.2.0 - Server-side graphics rendering
  - ✅ **Jimp** v1.6.0 - Pure JavaScript image processing
  - ✅ **GIF Encoder 2** v1.0.5 - Animated GIF creation
- **File Handling**: Multer for uploads, Archiver for ZIP creation
- **Architecture**: EventEmitter-based services for scalable processing
- **API**: RESTful design with comprehensive error handling

### **Frontend (All Libraries Verified ✅)**
- **Framework**: React 18 with modern hooks
- **Build Tool**: Vite 5.4.20 for fast development and optimized builds
- **Animation Libraries**:
  - ✅ **GSAP** v3.13.0 - High-performance animations
  - ✅ **Framer Motion** v12.23.13 - React animation framework
  - ✅ **AnimeJS** v4.1.3 - Lightweight animation library
  - ✅ **Lottie Web** v5.13.0 - After Effects animations
  - ✅ **Three.js** - 3D graphics and WebGL
  - ✅ **Konva** v10.0.2 - 2D canvas library
  - ✅ **P5.js** v2.0.5 - Creative coding framework
  - ✅ **D3.js** v7.9.0 - Data visualization
- **Styling**: Modern CSS with responsive design
- **UI/UX**: Professional interface with progress indicators

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
git clone https://github.com/salimuddin07/GIF-converter.git
cd "GIF converter"
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
✅ Server runs on http://localhost:3003

**Frontend Server:**
```bash
cd frontend
npm run dev
```
✅ Frontend runs on http://localhost:3001

### **4. Access Application**
- **Main App**: http://localhost:3001
- **API Documentation**: http://localhost:3003 
- **Functionality Tester**: http://localhost:3003/functionality

### **5. Test Libraries**
```bash
# Test all backend libraries
cd backend
node library-test.js
```
**Expected Output:** ✅ All 6 libraries working!

## 🔧 **Configuration**

### **Environment Variables**
Create a `.env` file in the `backend` directory:

```env
# Server Configuration
PORT=4000
NODE_ENV=development

# File Processing
MAX_FILE_SIZE_GB=500
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

## 👨‍💻 About the Developer

**Salimuddin** is a passionate Full-Stack Developer and Media Processing Expert with extensive experience in building scalable web applications and media processing solutions.

### **Connect with Salimuddin**
- 🐙 **GitHub**: [salimuddin07](https://github.com/salimuddin07)
- 💼 **LinkedIn**: [salimuddin-shaikh](https://www.linkedin.com/in/salimuddin-shaikh-330a7b2a5)
- 📸 **Instagram**: [@salimuddin_shaikh_786](https://www.instagram.com/salimuddin_shaikh_786)

---

<div align="center">

**✅ Project Status: DUAL-MODE PLATFORM FULLY OPERATIONAL**  
**🚀 Last Updated: October 25, 2025**

**Built with ❤️ by [Salimuddin](https://github.com/salimuddin07)**

*Professional Media Processing with Desktop & Web Applications*

🟢 **Desktop App**: Native Electron with local processing  
🟢 **Web App**: React SPA with cloud processing  
🟢 **Backend**: 6/6 Libraries Working  
🟢 **Frontend**: 8/8 Libraries Working  
🟢 **Video Splitting**: Advanced with audio preservation & renaming  
🟢 **Testing**: Functionality tester available  

</div>
