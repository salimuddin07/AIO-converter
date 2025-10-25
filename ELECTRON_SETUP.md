# 🚀 AIO Converter - Windows Native Application Setup

## 📋 Overview

This guide explains how to convert the AIO Converter web application into a fully Windows-native desktop application using Electron. The application will run completely offline with all processing done locally on your Windows machine.

## ✨ Features of the Windows Native App

- 🖥️ **True Windows Application**: Native window, taskbar integration, system tray support
- 🔒 **100% Offline**: No internet required after installation
- 📦 **Self-Contained**: All dependencies bundled in the installer
- 🎨 **Native UI**: Windows file dialogs, notifications, and menus
- ⚡ **Fast**: Direct file system access, no upload/download delays
- 🔐 **Secure**: Context isolation, sandboxed renderer process
- 🎯 **Portable**: Optional portable executable (no installation required)

## 📦 Prerequisites

### Required Software

1. **Node.js** (v18.0.0 or higher)
   - Download: https://nodejs.org/
   - Verify: `node --version`

2. **npm** (v8.0.0 or higher)
   - Included with Node.js
   - Verify: `npm --version`

3. **Git** (optional, for version control)
   - Download: https://git-scm.com/

### System Requirements

- **OS**: Windows 10 or Windows 11 (64-bit recommended)
- **RAM**: 4 GB minimum, 8 GB recommended
- **Storage**: 2 GB free space for development, 500 MB for built app
- **CPU**: Any modern processor (x64 or x86)

## 🛠️ Initial Setup

### 1. Install Dependencies

```powershell
# Install all dependencies (root, backend, and frontend)
npm run install:all

# Or install separately
npm install                    # Root dependencies
cd backend && npm install      # Backend dependencies
cd ../frontend && npm install  # Frontend dependencies
```

### 2. Install Electron Dependencies

```powershell
# Make sure you're in the root directory
npm install electron electron-builder cross-env --save-dev
```

### 3. Set Up Icons

The application needs proper icons for Windows:

1. **Create or obtain an icon** (512x512 PNG recommended)
2. **Convert to ICO format**: Use https://icoconvert.com/
3. **Place icons**:
   ```
   build/icon.ico       (Windows application icon)
   build/icon.png       (Source PNG)
   public/icon.png      (Runtime icon)
   ```

See `build/ICON_README.md` for detailed icon requirements.

## 🔧 Development Mode

### Option 1: Web Development (Default)

Run the app in browser mode for rapid development:

```powershell
# Terminal 1: Start backend
npm run dev:backend

# Terminal 2: Start frontend
npm run dev:frontend

# Or both together
npm run dev
```

- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:3003

### Option 2: Electron Development

Test the Electron desktop app during development:

```powershell
# Step 1: Build the frontend
cd frontend
npm run build
cd ..

# Step 2: Start backend in one terminal
npm run dev:backend

# Step 3: Start Electron in another terminal
npm run dev:electron
```

Or use the provided batch file:

```powershell
.\dev-electron.bat
```

### Development Tips

- **Hot Reload**: Changes to frontend require rebuild (`npm run build:frontend`)
- **Backend Changes**: Automatically reloaded by nodemon in dev:backend
- **Electron Main Process**: Changes require restarting `npm run dev:electron`
- **DevTools**: Automatically opened in development mode

## 📦 Building for Windows

### Quick Build Commands

```powershell
# 64-bit installer (recommended)
npm run build:win

# 32-bit installer (for older systems)
npm run build:win32

# Portable executable (no installation required)
npm run build:win-portable

# Both 64-bit and 32-bit installers
npm run build:all
```

Or use the convenient batch file:

```powershell
.\build-windows.bat
```

### Build Process Explained

1. **Frontend Build**: Vite compiles React app to static files
2. **Dependency Resolution**: electron-builder identifies native modules
3. **Resource Packaging**: FFmpeg, Sharp, Canvas binaries bundled
4. **ASar Archive**: App files compressed into app.asar
5. **Installer Creation**: NSIS creates Windows installer
6. **Portable Creation**: Optional standalone executable

### Build Output

After building, find your installers in the `dist/` directory:

```
dist/
  ├── AIO Converter-1.0.0-x64.exe          (64-bit installer)
  ├── AIO Converter-1.0.0-ia32.exe         (32-bit installer)
  ├── AIO Converter-1.0.0-portable.exe     (Portable app)
  └── win-unpacked/                         (Unpacked application)
```

### Installer Features

The Windows installer includes:

- ✅ Custom installation directory selection
- ✅ Desktop shortcut creation
- ✅ Start menu integration
- ✅ File association (.gif, .png, .jpg, etc.)
- ✅ Automatic uninstaller
- ✅ Application data cleanup on uninstall

## 🚀 Running the Built Application

### From Installer

1. Double-click the `.exe` installer
2. Follow the installation wizard
3. Launch from Desktop or Start Menu shortcut

### From Portable Executable

1. Double-click `AIO Converter-1.0.0-portable.exe`
2. No installation required
3. Data stored in same directory as executable

### First Launch

On first launch, the app will:

1. Start the embedded backend server (port 3003)
2. Open the main application window
3. Initialize temporary directories
4. Check for required resources (FFmpeg, etc.)

## 🔍 Troubleshooting

### Build Issues

**Problem**: `electron-builder: command not found`

```powershell
# Solution: Install electron-builder locally
npm install electron-builder --save-dev
```

**Problem**: Icon not found during build

```powershell
# Solution: Create placeholder icon
# Place a PNG file at build/icon.png and public/icon.png
# See build/ICON_README.md for details
```

**Problem**: Native module errors (Sharp, Canvas)

```powershell
# Solution: Rebuild native modules for Electron
npm run postinstall
cd backend
npm rebuild sharp --update-binary
npm rebuild canvas --update-binary
```

### Runtime Issues

**Problem**: Application won't start

```powershell
# Solution 1: Check port availability
netstat -ano | findstr :3003
# If port is in use, kill the process or change port in backend/src/config/index.js

# Solution 2: Check logs
# Look for error messages in the Electron developer console
# Press Ctrl+Shift+I in the app window
```

**Problem**: FFmpeg not found

```powershell
# Solution: Verify FFmpeg is bundled
# Check dist/win-unpacked/resources/ffmpeg/
# Should contain ffmpeg.exe and ffprobe.exe
```

**Problem**: File conversion fails

```powershell
# Solution: Check backend logs in the app's DevTools (Ctrl+Shift+I)
# Common causes:
# - Missing file permissions
# - Insufficient disk space
# - Corrupted input files
```

### Development Issues

**Problem**: Changes not reflected in Electron app

```powershell
# Solution: Rebuild frontend
cd frontend
npm run build
cd ..
# Then restart: npm run dev:electron
```

**Problem**: Backend port conflict

```powershell
# Solution: Change port in backend/src/config/index.js
export const config = {
  port: 3004,  // Change from 3003
  // ...
};
```

## 🎯 Advanced Configuration

### Custom Port Configuration

Edit `backend/src/config/index.js`:

```javascript
export const config = {
  port: parseInt(process.env.PORT || '3003', 10),
  // Change default port here if needed
};
```

### Build Configuration

Edit `electron-builder.yml` to customize:

- App name and ID
- Installer settings
- File associations
- Compression level
- Extra resources

### Window Configuration

Edit `electron/main.js` to customize:

```javascript
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,        // Change window width
    height: 900,        // Change window height
    minWidth: 800,      // Minimum width
    minHeight: 600,     // Minimum height
    // ... other options
  });
}
```

## 📊 Application Architecture

### Components

```
┌─────────────────────────────────────────┐
│         Electron Main Process            │
│  (Window Management, IPC, Native APIs)   │
└─────────────┬───────────────────────────┘
              │
    ┌─────────┴─────────┐
    │                   │
┌───▼────────┐  ┌──────▼──────┐
│  Renderer  │  │   Backend   │
│  (React)   │  │  (Express)  │
│            │◄─┤             │
│ Frontend   │  │ Node Server │
│   UI       │  │  Port 3003  │
└────────────┘  └─────────────┘
                       │
              ┌────────┴────────┐
              │                 │
         ┌────▼────┐      ┌────▼─────┐
         │ FFmpeg  │      │  Sharp   │
         │ Service │      │  Canvas  │
         └─────────┘      └──────────┘
```

### File Structure

```
AIO Converter/
├── electron/                    # Electron main process
│   ├── main.js                 # Main process entry
│   └── preload.js              # Preload script (IPC bridge)
│
├── frontend/                    # React application
│   ├── src/
│   │   ├── utils/
│   │   │   └── electronAPI.js  # Electron API wrapper
│   │   └── components/         # React components
│   └── dist/                   # Built frontend (after build)
│
├── backend/                     # Express server
│   ├── src/
│   │   ├── config/             # Configuration
│   │   ├── services/           # Processing services
│   │   └── routes/             # API routes
│   └── server.js               # Server entry point
│
├── build/                       # Build resources
│   ├── icon.ico                # Application icon
│   └── installer.nsh           # NSIS script
│
├── scripts/                     # Build scripts
│   └── prepare-build.js        # Pre-build preparation
│
├── electron-builder.yml         # Electron builder config
└── package.json                # Root package config
```

## 🔐 Security Considerations

The Electron app implements several security best practices:

1. **Context Isolation**: Renderer process isolated from Node.js
2. **Preload Scripts**: Safe IPC communication bridge
3. **No Remote Module**: Remote module disabled
4. **Sandboxing**: Renderer process runs in sandbox
5. **CSP**: Content Security Policy enforced
6. **HTTPS**: External content only via HTTPS

## 📝 Distribution

### Code Signing (Optional but Recommended)

For production distribution, consider code signing:

1. **Obtain Certificate**: Get a code signing certificate from a CA
2. **Configure**: Add to `electron-builder.yml`
3. **Build**: Signed installers prevent security warnings

### Auto-Updates (Optional)

Configure auto-updates using electron-updater:

1. Set up GitHub Releases or custom update server
2. Configure publish settings in `electron-builder.yml`
3. Add update checking code to `electron/main.js`

### Distribution Checklist

Before distributing your app:

- [ ] Test on clean Windows installation
- [ ] Verify all features work offline
- [ ] Check file associations work correctly
- [ ] Test uninstaller removes all files
- [ ] Verify no console errors or warnings
- [ ] Test with Windows Defender and antivirus
- [ ] Create user documentation
- [ ] Add version information and changelog

## 🆘 Support & Resources

### Documentation

- **Electron Docs**: https://www.electronjs.org/docs
- **electron-builder**: https://www.electron.build/
- **Node.js API**: https://nodejs.org/api/

### Useful Commands

```powershell
# Clean everything and reinstall
npm run clean
npm run install:all

# Clean build artifacts
npm run clean:build

# Test build without creating installer
npm run pack

# Lint code
npm run lint
npm run lint:fix

# View app info
npm list electron
npm list electron-builder
```

### Getting Help

- Open an issue: https://github.com/salimuddin07/GIF-converter/issues
- Check existing issues for solutions
- Include error logs and system info

## 📚 Additional Resources

- `build/ICON_README.md` - Icon creation guide
- `ARCHITECTURE.md` - Application architecture
- `README.md` - General project information
- `LOCAL_SETUP.md` - Local development setup

## 🎉 Success!

You now have a fully Windows-native version of AIO Converter that runs completely offline. Users can convert, edit, and process media files without ever uploading them to a server, ensuring privacy and speed.

### What's Next?

- Customize the app icon and branding
- Add more features using Electron APIs
- Set up auto-updates for easier distribution
- Consider code signing for production
- Share your native Windows app with users!

---

**Created by [Salimuddin](https://github.com/salimuddin07)**  
**License**: MIT
