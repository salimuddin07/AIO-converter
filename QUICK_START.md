# 🎯 Quick Start Guide - Windows Native App

## For Users (Running the App)

### Download and Install

1. Download the latest installer:
   - `AIO Converter-1.0.0-x64.exe` (64-bit Windows - Recommended)
   - `AIO Converter-1.0.0-ia32.exe` (32-bit Windows)
   - `AIO Converter-1.0.0-portable.exe` (Portable - No installation)

2. Run the installer and follow the wizard

3. Launch from Desktop shortcut or Start Menu

That's it! The app runs completely offline.

## For Developers (Building the App)

### Prerequisites
- Node.js 18+ (https://nodejs.org/)
- Windows 10/11
- 2 GB free disk space

### Quick Build (3 Commands)

```powershell
# 1. Install everything
npm run install:all

# 2. Install Electron tools
npm install

# 3. Build for Windows
.\build-windows.bat
```

Your installer will be in the `dist/` folder!

### Development Mode

Test the app during development:

```powershell
# Option 1: Use the batch file
.\dev-electron.bat

# Option 2: Manual steps
# Terminal 1:
cd backend
npm run dev

# Terminal 2:
npm run dev:electron
```

## Features

✅ **100% Offline** - No internet required  
✅ **Private** - Files never leave your computer  
✅ **Fast** - Direct file system access  
✅ **Native** - True Windows application  
✅ **Complete** - All web features included  

## File Structure

```
dist/                              # Built installers
  ├── AIO Converter-1.0.0-x64.exe      # 64-bit installer
  └── AIO Converter-1.0.0-portable.exe # Portable version

electron/                          # Electron main process
  ├── main.js                      # Window management
  └── preload.js                   # Secure IPC bridge

frontend/dist/                     # Built React app
backend/src/                       # Express server
```

## Common Tasks

### Build 64-bit Installer
```powershell
npm run build:win
```

### Build Portable Version
```powershell
npm run build:win-portable
```

### Clean and Rebuild
```powershell
npm run clean
npm run install:all
npm run build:win
```

### Update Frontend
```powershell
cd frontend
npm run build
cd ..
```

## Troubleshooting

### Build fails with "icon not found"
**Solution**: Create `build/icon.ico` and `public/icon.png`  
See: `build/ICON_README.md`

### Port 3003 already in use
**Solution**: Kill the process or change port in `backend/src/config/index.js`
```powershell
netstat -ano | findstr :3003
taskkill /PID <PID> /F
```

### Native modules error
**Solution**: Rebuild for Electron
```powershell
cd backend
npm rebuild sharp --update-binary
npm rebuild canvas --update-binary
```

## Documentation

📖 **Full Setup Guide**: `ELECTRON_SETUP.md`  
📦 **Icon Guide**: `build/ICON_README.md`  
🏗️ **Architecture**: `ARCHITECTURE.md`  
📝 **Main README**: `README.md`  

## Support

🐛 Report issues: https://github.com/salimuddin07/GIF-converter/issues  
💬 Discussions: https://github.com/salimuddin07/GIF-converter/discussions  

---

**Made with ❤️ by [Salimuddin](https://github.com/salimuddin07)**
