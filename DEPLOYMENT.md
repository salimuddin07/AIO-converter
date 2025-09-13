# Deployment Guide

## Why Not Vercel for Backend?

Vercel is designed for serverless functions and static sites. Your backend has:
- Persistent file storage needs
- Heavy media processing (FFmpeg, ImageMagick, Sharp)
- Long-running operations
- Large binary dependencies

These don't work well with Vercel's serverless environment.

## Recommended Deployment

### Frontend: Vercel ✅
- Perfect for React/Vite applications
- Automatic builds and deployments
- CDN distribution
- Free tier available

### Backend: Railway/Render/DigitalOcean ✅
- Full Node.js environment support
- Persistent storage
- Docker support
- Handle heavy processing

## Step-by-Step Deployment

### 1. Backend Deployment (Railway)

1. **Sign up at [Railway](https://railway.app)**
2. **Connect your GitHub repository**
3. **Create a new project from repo**
4. **Railway will detect Dockerfile automatically**
5. **Set environment variables:**
   ```
   NODE_ENV=production
   PORT=8080
   MAX_FILE_SIZE_MB=500
   CORS_ORIGIN=https://your-app.vercel.app
   ```
6. **Deploy** - Railway handles the rest!

### 2. Frontend Deployment (Vercel)

1. **Update `frontend/.env`:**
   ```
   VITE_API_BASE_URL=https://your-app.railway.app
   ```

2. **Deploy to Vercel:**
   ```bash
   cd frontend
   npm run build
   vercel --prod
   ```

3. **Update backend CORS_ORIGIN** with your Vercel URL

### 3. Alternative: All-in-One VPS

Deploy both frontend and backend on:
- DigitalOcean Droplet
- AWS EC2
- Google Cloud Compute Engine
- Linode

Use the included Dockerfile and serve frontend as static files.

## Why This Architecture Works

- **Frontend**: Static files (perfect for CDN)
- **Backend**: Full server environment (needed for media processing)
- **Separation**: Independent scaling and deployment
- **Cost Effective**: Use appropriate services for each component