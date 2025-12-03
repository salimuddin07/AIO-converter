# 🚀 AIO Converter - All-in-One Media Processing Desktop App

> **Created by [Salimuddin](https://github.com/salimuddin07)** - A comprehensive desktop application for all your media conversion needs

[![Desktop App](https://img.shields.io/badge/Platform-Desktop%20App-blue.svg)](https://github.com/salimuddin07/GIF-converter)
[![Electron](https://img.shields.io/badge/Built%20with-Electron-47848f.svg)](https://www.electronjs.org/)
[![React](https://img.shields.io/badge/Frontend-React%2018-61dafb.svg)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Backend-Node.js-339933.svg)](https://nodejs.org/)

## ✨ **What is AIO Converter?**

AIO Converter is a **powerful desktop application** that provides comprehensive media processing capabilities right on your computer. Built with Electron, React, and Node.js, it offers **100% local processing** with no internet required, ensuring complete privacy and speed.

### 🎯 **Key Highlights**

- 🖥️ **Native Desktop App** - Full-featured Electron application for Windows, macOS, and Linux
- 🔒 **100% Local Processing** - No internet required, your files never leave your computer  
- 📁 **Multi-Format Support** - Images, videos, GIFs, PDFs, and documents
- ⚡ **High Performance** - Powered by FFmpeg, Sharp, and optimized processing pipelines
- 🎨 **Modern UI** - Beautiful, responsive interface built with React
- 📊 **Real-time Progress** - Live conversion status and progress tracking

## 🌟 **Core Features**

### 📸 **Image Processing**
- **Format Conversion**: JPEG, PNG, WebP, AVIF, GIF, BMP, TIFF, SVG
- **Batch Processing**: Convert multiple files simultaneously
- **Image Optimization**: Smart compression and quality adjustment
- **Resize & Crop**: Intelligent resizing with aspect ratio preservation
- **Effects & Filters**: Apply various effects and enhancements

### 🎬 **Video Processing**
- **Format Conversion**: MP4, AVI, MOV, WebM, MKV, M4V, 3GP, FLV
- **Video to GIF**: Convert videos to animated GIFs with quality control
- **Frame Extraction**: Extract specific frames or entire sequences
- **Video Splitting**: Split videos into segments with audio preservation
- **Quality Presets**: Multiple quality options for different use cases

### 🎭 **GIF Operations**
- **GIF Creation**: Create animated GIFs from videos or image sequences
- **Frame Extraction**: Extract individual frames with ZIP download
- **GIF Splitting**: Break down GIFs into component images
- **Optimization**: Reduce file size while maintaining quality
- **Animation Control**: Adjust timing, loops, and effects

### 📄 **Document Processing**
- **PDF to Markdown**: Convert PDF documents to Markdown format
- **Multiple PDF Support**: Process single or multiple PDFs simultaneously
- **Text Extraction**: Intelligent text extraction with formatting preservation
- **Batch Conversion**: Convert multiple documents at once

### 🛠️ **Advanced Tools**
- **Text to Image**: Generate images from text with custom styling
- **Image Editor**: Built-in image editing capabilities
- **WebP Converter**: Modern format conversion for web optimization
- **File Manager**: Organize and manage your converted files

## 📦 **Installation & Setup**

### **System Requirements**
- Windows 10/11, macOS 10.15+, or Linux
- 4GB RAM minimum (8GB recommended)
- 2GB free disk space
- Node.js 18+ (for development)

### **Quick Start (Users)**
1. Download the latest release from [Releases](https://github.com/salimuddin07/GIF-converter/releases)
2. Install the application
3. Launch AIO Converter
4. Start converting your media files!

### **Development Setup**
```bash
# Clone the repository
git clone https://github.com/salimuddin07/GIF-converter.git
cd "AIO converter"

# Install dependencies
npm install

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies  
cd ../frontend && npm install

# Build frontend
cd ../frontend && npm run build

# Run the desktop application
cd .. && npm run electron
```

## 🏗️ **Project Architecture**

```
AIO Converter/
├── 📂 electron/                # Desktop Application
│   ├── 📄 main.js              # Main Electron process with IPC handlers
│   ├── 📄 preload.js           # Secure preload script
│   └── 📄 package.json         # Electron configuration
├── 📂 frontend/                # React Frontend
│   ├── 📂 src/
│   │   ├── 📂 components/      # UI Components
│   │   │   ├── 📄 MainConversionInterface.jsx
│   │   │   ├── 📄 VideoToGifConverter.jsx
│   │   │   ├── 📄 PdfToMarkdownConverter.jsx
│   │   │   ├── 📄 FrameSplitter.jsx
│   │   │   ├── 📄 ImageEditor.jsx
│   │   │   └── 📄 ... (20+ components)
│   │   ├── 📂 utils/           # Utility functions
│   │   │   ├── 📄 unifiedAPI.js # Desktop API interface
│   │   │   └── 📄 downloadUtils.js
│   │   ├── 📄 App.jsx          # Main React app
│   │   └── 📄 main.jsx         # Entry point
│   ├── 📄 package.json
│   └── 📄 vite.config.js       # Vite build configuration
├── 📂 backend/                 # Processing Backend
│   ├── 📂 src/
│   │   ├── 📂 services/        # Core processing services
│   │   │   ├── 📄 ImageProcessingService.js
│   │   │   ├── 📄 VideoProcessingService.js
│   │   │   ├── 📄 GifProcessingService.js
│   │   │   └── 📄 ... (15+ services)
│   │   └── 📂 routes/          # API endpoints
│   └── 📄 package.json
├── 📂 temp/                    # Temporary processing files
├── 📂 logs/                    # Application logs
├── 📄 package.json             # Root configuration
├── 📄 electron-builder.yml     # Build configuration
└── 📄 README.md               # This file
```

## 🎮 **How to Use**

### **1. Image Conversion**
1. Select the **Image Converter** tool
2. Drop your images or click to browse
3. Choose output format (JPEG, PNG, WebP, etc.)
4. Adjust quality settings if needed
5. Click **Convert** and download results

### **2. Video to GIF**
1. Open the **Video to GIF** converter
2. Upload your video file
3. Set start/end times (optional)
4. Choose quality and dimensions
5. Convert and preview your GIF

### **3. PDF to Markdown**
1. Launch **PDF to Markdown** tool
2. Select single or multiple PDF files
3. Click **Convert**
4. Download individual or batch results

### **4. Frame Extraction**
1. Use **Frame Splitter** tool
2. Upload video or GIF file
3. Choose extraction settings
4. Download individual frames or ZIP archive

## 🔧 **Configuration**

### **Environment Variables**
Create a `.env` file in the root directory:

```env
# Application Settings
NODE_ENV=production
LOG_LEVEL=info

# Processing Limits
MAX_FILE_SIZE_GB=25
MAX_CONCURRENT_JOBS=3
TEMP_FILE_TTL_HOURS=24

# Quality Settings
DEFAULT_IMAGE_QUALITY=85
DEFAULT_VIDEO_QUALITY=medium
DEFAULT_GIF_FPS=15
```

## 🚀 **Build & Package**

### **Development Build**
```bash
# Start development mode
npm run dev

# Frontend only
npm run dev:frontend

# Backend only
npm run dev:backend
```

### **Production Build**
```bash
# Build frontend
cd frontend && npm run build

# Package desktop app
npm run build:electron

# Create installer
npm run pack:production
```

The packaged application will be in `dist-packager/AIO Converter-win32-x64/`

## 🧪 **Testing**

### **Manual Testing**
1. Run the packaged application
2. Test all conversion tools
3. Verify file downloads work
4. Check error handling

### **Automated Testing**
```bash
# Run backend tests
cd backend && npm test

# Run frontend tests  
cd frontend && npm test

# Test all libraries
cd backend && node library-test.js
```

## 🔍 **Troubleshooting**

### **Common Issues**

| Issue | Solution |
|-------|----------|
| App won't start | Check Node.js version (18+ required) |
| Conversion fails | Ensure sufficient disk space and memory |
| Missing FFmpeg | FFmpeg is bundled, restart the app |
| Files not downloading | Check temp directory permissions |
| API errors | Restart the application |

### **Debug Mode**
```bash
# Enable debug logging
set DEBUG=* && npm run electron

# Check logs
tail -f logs/application.log
```

## 📊 **Performance**

### **Benchmarks**
- **Image Conversion**: 50+ images/minute
- **Video Processing**: 1080p @ 60fps real-time
- **GIF Creation**: 30-second videos in <60 seconds
- **PDF Conversion**: 100+ pages/minute
- **Memory Usage**: <500MB average

### **Optimization Tips**
- Close other applications for better performance
- Use SSD storage for faster file I/O
- Process larger files in smaller batches
- Keep temp directory on fastest drive

## 🛣️ **Roadmap**

### **Version 2.0 (Planned)**
- [ ] Audio file processing (MP3, WAV, FLAC)
- [ ] Advanced video effects and filters
- [ ] AI-powered image enhancement
- [ ] Batch operation scheduling
- [ ] Plugin system for custom tools

### **Version 2.5 (Future)**
- [ ] Cloud storage integration
- [ ] Mobile companion app
- [ ] Advanced PDF editing
- [ ] OCR text extraction
- [ ] Multi-language support

## 🤝 **Contributing**

We welcome contributions from the community! Please read our [Contributing Guidelines](CONTRIBUTING.md) before submitting pull requests.

### **Development Process**
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

### **Code Style**
- Use ESLint configuration
- Follow React best practices
- Write clear commit messages
- Add JSDoc comments for functions

## 📜 **License**

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 **About the Developer**

**Salimuddin** is a passionate Full-Stack Developer specializing in desktop applications, web development, and media processing solutions.

### **Connect with Me**
- 🐙 **GitHub**: [@salimuddin07](https://github.com/salimuddin07)
- 💼 **LinkedIn**: [salimuddin-shaikh](https://www.linkedin.com/in/salimuddin-shaikh-330a7b2a5)
- 📧 **Email**: salimuddin.dev@gmail.com
- 🌐 **Portfolio**: [Coming Soon]

## ⭐ **Star this Project**

If you find AIO Converter useful, please consider giving it a ⭐ star on GitHub! It helps others discover this project and motivates continued development.

## 📞 **Support**

Need help or have questions?

- 📖 Check the [Documentation](docs/)
- 🐛 Report bugs via [GitHub Issues](https://github.com/salimuddin07/GIF-converter/issues)
- 💡 Request features via [Discussions](https://github.com/salimuddin07/GIF-converter/discussions)
- 📧 Email: support@aioconverter.dev

---

<div align="center">

**🚀 AIO Converter - Making Media Processing Simple**

*Built with ❤️ using Electron, React, and Node.js*

**[Download Now](https://github.com/salimuddin07/GIF-converter/releases) | [View Source](https://github.com/salimuddin07/GIF-converter) | [Report Issues](https://github.com/salimuddin07/GIF-converter/issues)**

</div>