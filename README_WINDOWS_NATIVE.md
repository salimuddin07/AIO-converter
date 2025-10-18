# 🚀 AIO Converter - Now Available as Windows Desktop App!

## 🎉 NEW: Windows Native Application

**AIO Converter is now available as a fully native Windows desktop application!**

### Download Options

1. **Windows Installer** (Recommended)
   - One-click installation
   - Desktop shortcut
   - Start menu integration
   - File associations

2. **Portable Version**
   - No installation required
   - Run from USB drive
   - Perfect for portable use

### Key Features of Native App

- 🖥️ **True Windows Application**: Native window, menus, and dialogs
- 🔒 **100% Offline**: No internet connection required
- 📦 **Self-Contained**: All dependencies bundled
- ⚡ **Lightning Fast**: Direct file system access
- 🔐 **Completely Private**: Files never leave your computer
- 🎯 **Professional**: Taskbar, system tray, notifications

## 📥 Quick Start

### For Users

1. Download the installer from the [Releases](https://github.com/salimuddin07/GIF-converter/releases) page
2. Run `AIO Converter-1.0.0-x64.exe`
3. Follow the installation wizard
4. Launch from Desktop or Start Menu

**That's it!** The app runs completely offline.

### For Developers

See the detailed guides:
- 📖 **[QUICK_START.md](QUICK_START.md)** - Quick reference
- 📚 **[ELECTRON_SETUP.md](ELECTRON_SETUP.md)** - Complete setup guide
- 📋 **[WINDOWS_NATIVE_SUMMARY.md](WINDOWS_NATIVE_SUMMARY.md)** - Implementation details

Quick build:
```powershell
npm run install:all
npm install
.\build-windows.bat
```

## 🌐 Web Version Still Available

The web version continues to work at: https://your-web-deployment.com

**Choose what works for you:**
- **Desktop App**: Best for regular use, offline work, and maximum privacy
- **Web Version**: Best for quick one-time conversions, any device access

---

## 📖 Documentation

| Document | Purpose |
|----------|---------|
| [QUICK_START.md](QUICK_START.md) | Quick reference for common tasks |
| [ELECTRON_SETUP.md](ELECTRON_SETUP.md) | Complete Windows app setup guide |
| [WINDOWS_NATIVE_SUMMARY.md](WINDOWS_NATIVE_SUMMARY.md) | Technical implementation details |
| [README.md](README.md) | This file - project overview |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Application architecture |
| [build/ICON_README.md](build/ICON_README.md) | Icon creation guide |

---

## 🛠️ Technology Stack

### Desktop Application
- **Framework**: Electron 28
- **Frontend**: React 18 + Vite
- **Backend**: Node.js + Express
- **Packaging**: electron-builder

### Processing Libraries
- **Images**: Sharp, Jimp, Canvas
- **Videos**: FFmpeg
- **GIFs**: gif-encoder-2
- **PDFs**: pdf-lib, pdfjs-dist

---

## ⚡ Features

### Image Processing
- ✅ Format conversion (PNG, JPEG, WebP, GIF, BMP, TIFF, SVG)
- ✅ Batch processing
- ✅ Resize, crop, rotate
- ✅ Filters and effects
- ✅ Optimization

### Video Processing
- ✅ Format conversion (MP4, AVI, MOV, WebM, MKV)
- ✅ Video splitting
- ✅ Frame extraction
- ✅ Quality adjustment
- ✅ Scene detection

### GIF Tools
- ✅ Create GIFs from images
- ✅ Create GIFs from videos
- ✅ Split GIFs into frames
- ✅ Optimization
- ✅ Text overlay

### Modern Formats
- ✅ WebP conversion
- ✅ AVIF support
- ✅ APNG creation
- ✅ JXL (JPEG XL) support

### Document Processing
- ✅ PDF to Markdown
- ✅ Images to PDF
- ✅ Markdown to PDF

---

## 🖥️ System Requirements

### Windows Desktop App
- **OS**: Windows 10 or Windows 11 (64-bit recommended)
- **RAM**: 4 GB minimum, 8 GB recommended
- **Storage**: 500 MB free space
- **CPU**: Any modern processor

### Web Version
- **Browser**: Chrome, Firefox, Edge, Safari (latest versions)
- **Internet**: Required for web version only

---

## 🔒 Privacy & Security

### Desktop App
- ✅ All processing happens locally on your computer
- ✅ No files are uploaded to any server
- ✅ No internet connection required after installation
- ✅ No telemetry or tracking
- ✅ Your data stays on your machine

### Web Version
- ✅ Files processed on server (secure connection)
- ✅ Automatic file deletion after processing
- ✅ No long-term storage of user files

---

## 🚀 Getting Started (Developers)

### Prerequisites
- Node.js 18+ 
- npm 8+
- Windows 10/11 (for building Windows app)

### Installation

```powershell
# Clone the repository
git clone https://github.com/salimuddin07/GIF-converter.git
cd GIF-converter

# Install all dependencies
npm run install:all

# Install Electron dependencies (for desktop app)
npm install
```

### Development

#### Web Version
```powershell
# Start backend and frontend (web mode)
npm run dev

# Frontend: http://localhost:3001
# Backend: http://localhost:3003
```

#### Desktop App
```powershell
# Start in Electron mode
.\dev-electron.bat

# Or manually:
# Terminal 1:
npm run dev:backend

# Terminal 2:
npm run dev:electron
```

### Building

#### Desktop App
```powershell
# Build Windows installer
.\build-windows.bat

# Or manually:
npm run build:win          # 64-bit installer
npm run build:win-portable # Portable version
npm run build:all          # All versions
```

#### Web Version
```powershell
# Build frontend
npm run build:frontend
```

---

## 📦 Project Structure

```
AIO Converter/
├── electron/               # Desktop app - Electron main process
│   ├── main.js            # Window management, IPC
│   └── preload.js         # Secure IPC bridge
│
├── frontend/              # React application
│   ├── src/
│   │   ├── components/    # React components
│   │   └── utils/
│   │       └── electronAPI.js  # Desktop app APIs
│   └── dist/              # Built frontend
│
├── backend/               # Express server
│   ├── src/
│   │   ├── services/      # Processing services
│   │   ├── routes/        # API routes
│   │   └── config/        # Configuration
│   └── server.js          # Server entry
│
├── build/                 # Build resources (icons, etc.)
├── scripts/               # Build and utility scripts
├── dist/                  # Built installers (after build)
│
├── package.json           # Root package with scripts
├── electron-builder.yml   # Electron build config
└── [Documentation files]
```

---

## 🎯 Available Scripts

### Development
```powershell
npm run dev              # Start web version (frontend + backend)
npm run dev:backend      # Start backend only
npm run dev:frontend     # Start frontend only
npm run dev:electron     # Start Electron app
```

### Building
```powershell
npm run build:frontend   # Build React app
npm run build:win        # Build Windows installer
npm run build:win-portable  # Build portable version
npm run build:all        # Build all Windows versions
```

### Utilities
```powershell
npm run install:all      # Install all dependencies
npm run clean            # Clean node_modules
npm run clean:build      # Clean build artifacts
npm run lint             # Lint all code
npm run lint:fix         # Fix linting issues
```

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines
- Follow existing code style
- Test on both web and desktop versions
- Update documentation for new features
- Add tests where applicable

---

## 🐛 Bug Reports

Found a bug? Please open an issue with:

- Description of the bug
- Steps to reproduce
- Expected vs actual behavior
- Screenshots (if applicable)
- System info (Windows version, Node version, etc.)

---

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Salimuddin**

- GitHub: [@salimuddin07](https://github.com/salimuddin07)
- Repository: [GIF-converter](https://github.com/salimuddin07/GIF-converter)

---

## 🙏 Acknowledgments

- Electron team for the amazing framework
- All open-source library maintainers
- FFmpeg for powerful media processing
- Sharp for high-performance image processing
- The React and Node.js communities

---

## ⭐ Star This Project

If you find this project useful, please consider giving it a star on GitHub! It helps others discover the project.

---

## 📞 Support

- **Documentation**: See the guides in this repository
- **Issues**: [GitHub Issues](https://github.com/salimuddin07/GIF-converter/issues)
- **Discussions**: [GitHub Discussions](https://github.com/salimuddin07/GIF-converter/discussions)

---

**Made with ❤️ by Salimuddin**
