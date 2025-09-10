# Image Converter

Full-stack web application to upload, convert, and download images (PNG, JPG/JPEG, GIF, SVG) and create animated GIFs from multiple frames.

## Features
- Drag & drop multi-file upload
- Convert between PNG, JPG, GIF (static or animated)
- Animated GIF creation (frame delay & loop control)
- Batch processing
- Preview & download converted images
- Automatic cleanup of temporary & output files

## Tech Stack
Backend: Node.js (Express, sharp, gifencoder, multer)  
Frontend: React (Vite)  
Testing: Jest + Supertest  

## Getting Started
### Prerequisites
- Node.js 18+

### Install
```powershell
cd "backend"
npm install
cd ..\frontend
npm install
```

### Run Backend
```powershell
cd "backend"
npm run dev
```
Backend runs on http://localhost:4000

### Run Frontend (Dev)
```powershell
cd "frontend"
npm run dev
```
If proxy issues occur (Failed to fetch), set an explicit backend URL:
```powershell
$env:VITE_BACKEND_URL="http://localhost:4000"; npm run dev
```
Visit the printed Vite dev server URL (default http://localhost:5173) – ensure proxy or manual fetch path adjustment if needed.

### API
POST /api/convert  
Form fields:
- files: one or more image files
- targetFormat: png|jpg|gif
- gif.frameDelay (optional, ms)
- gif.loop (optional, 0=inf)
- singleGif (optional, true) -> Only when targetFormat=gif with a single image; if omitted and only one file, a PNG is returned instead preserving transparency.

Response:
```json
{ "results": [ { "originalName": "...", "convertedName": "...", "url": "/api/files/...", "sizeBytes": 1234, "mimeType": "image/png" } ] }
```

GET /api/files/:filename – serve converted file.

GET /health – service status.

### Testing
```powershell
cd backend
npm test
```

### Environment Variables
Centralized in `backend/src/config/index.js`. Common overrides:
```
PORT=4000
MAX_FILE_SIZE_MB=10
FILE_TTL_MINUTES=30
CLEANUP_INTERVAL_CRON=*/15 * * * *
JPEG_QUALITY=80
```

### Notes
- Current frontend expects same-origin; if serving separately, configure a proxy (e.g., Vite devServer.proxy) or adjust fetch base URL.
- SVG to GIF multi-frame uses rasterization via sharp implicitly.

### Future Enhancements
Refer to `ARCHITECTURE.md` roadmap section.

## License
MIT (add license file if needed).
