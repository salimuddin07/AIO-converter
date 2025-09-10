# Image Converter Architecture

## Overview
A full-stack web application enabling users to upload images (single or batch), convert them between formats (PNG, JPEG, JPG, GIF, SVG -> raster), and generate animated GIFs. The system provides previews, download links, and cleans up temporary files automatically.

## Tech Stack (Initial Implementation)
- Backend: Node.js (Express)
- Image Processing: sharp (raster conversions & resizing), gifencoder (animated GIF assembly), svg2img (render SVG to PNG buffer) if needed later
- File Upload Middleware: multer
- Task Scheduling / Cleanup: node-cron
- Testing: Jest + Supertest
- Frontend: React (Vite) with Fetch API
- Dev Tooling: nodemon (dev), eslint (optional future), cross-env for portability

## Key Directories
```
backend/
  package.json
  server.js
  src/
    app.js
    config/
      index.js
    routes/
      convert.js
    services/
      conversionService.js
      gifService.js
      cleanupService.js
    middleware/
      errorHandler.js
      validateFiles.js
    utils/
      filePaths.js
    temp/ (runtime generated)
    output/ (runtime generated)
frontend/
  (Vite React project structure)
```

## Data Flow
1. User selects or drags files into UI.
2. Frontend validates (extensions, size) then POSTs multipart/form-data to `/api/convert` with:
   - files[]: uploaded images
   - targetFormat: png|jpg|jpeg|gif|svg
   - (optional) gif.frameDelay (ms), gif.loop (int)
3. Backend validates files (MIME + size), stores in temp folder via multer.
4. For each file or batch:
   - If target is GIF and multiple frames provided -> assemble animated GIF.
   - If single file to GIF -> convert raster or rendered SVG to GIF (single-frame loop respecting transparency).
   - Else standard format conversion using sharp.
5. Converted files written to `output/` with UUID-based names; metadata captured for response.
6. Response JSON includes array of `{originalName, convertedName, url, sizeBytes, mimeType}`.
7. Frontend fetches preview via returned URLs and renders side-by-side list with download buttons (direct GET).
8. Cleanup job periodically deletes files older than TTL (e.g., 30 minutes) from temp & output.

## API Endpoints (Initial)
| Method | Path | Description |
|--------|------|-------------|
| POST | /api/convert | Upload & convert images (single/batch) |
| GET  | /api/files/:filename | Serve converted file (download/preview) |
| GET  | /health | Basic health check |

## Conversion Logic
- Standard: Use sharp to read input buffer and output to desired format preserving transparency (PNG/GIF) and quality.
- JPEG quality default 80 (configurable via env var `JPEG_QUALITY`).
- PNG compression level default sharp defaults (can tune later).
- SVG Handling: sharp can rasterize SVG directly when fed buffer. For animated GIF creation from SVG frames, each SVG is rendered to PNG buffer first.
- Animated GIF: Use gifencoder.
  - Determine dimensions: by first frame (resize others to match via sharp to maintain consistency).
  - Frame delay: from `gif.frameDelay` (default 100ms).
  - Loop count: from `gif.loop` (default 0 infinite).

## Validation Rules
- Supported extensions: .png .jpg .jpeg .gif .svg .bmp .tiff
- Max per-file size: 10 MB (configurable: `MAX_FILE_SIZE_MB`).
- Max batch count: 30 files.
- Reject if any file invalid; return structured error JSON `{error: {code, message, details[]}}`.

## Error Handling
- Central error middleware converting thrown `AppError` objects to JSON.
- Unexpected errors logged with stack (omit stack in production response).

## Temporary Storage Strategy
- `temp/` for raw uploads named with UUID + original extension.
- `output/` for converted results named with UUID + target extension.
- Cleanup cron runs every 15 minutes removing files older than 30 minutes (configurable).

## Security & Hardening (Future)
- Limit MIME sniffing by reading initial file bytes.
- Rate limiting & API keys when auth added.
- Sanitize file names; no user-controlled path segments.
- Consider streaming large files; currently buffer-based approach acceptable (<10MB).

## Future Enhancements
- Resize/crop parameters (width, height, fit) via query/body.
- User auth & persistent history (DB + S3 storage).
- WebSocket progress for long-running batches.
- Image optimization toggles (lossless/lossy, quality sliders).
- Queue system (BullMQ) when scaling.

## Environment Variables
| Name | Default | Purpose |
|------|---------|---------|
| PORT | 4000 | HTTP server port |
| MAX_FILE_SIZE_MB | 10 | Upload size limit per file |
| CLEANUP_INTERVAL_CRON | */15 * * * * | Cron schedule for cleanup |
| FILE_TTL_MINUTES | 30 | Minutes before temp/output deletion |
| JPEG_QUALITY | 80 | JPEG output quality setting |

## Testing Strategy
- Unit: services (conversionService, gifService) with mock input buffers.
- Integration: POST /api/convert happy paths & validation failures using Supertest.
- Health: GET /health returns 200 JSON.

## Performance Considerations
- sharp uses libvips for efficiency; parallel conversions limited by Node event loop, potential future worker threads for CPU heavy tasks.
- Stream GIF encoder output directly to file to reduce memory.

## Accessibility & UX
- Keyboard navigable drag/drop area.
- ARIA live region for status updates.
- Clear error messages and progress indicators.

## Logging
- Minimal console logging in dev; structured logger (pino/winston) could be added later.

## Diagram (Textual Sequence)
User -> Frontend: select files
Frontend -> Backend: POST /api/convert (multipart)
Backend -> Temp storage: write uploads
Backend -> Services: convert/generate
Backend -> Output storage: write results
Backend -> Frontend: JSON metadata
Frontend -> Backend: GET /api/files/:filename (preview/download)
Cleanup cron -> Temp/Output: delete expired

---
Initial implementation will cover only explicitly listed initial endpoints and conversion behaviors.
