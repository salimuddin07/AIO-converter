# Production Deployment Guide

## Backend Deployment (Render)

### 1. Create Render Account
- Go to [render.com](https://render.com)
- Sign up/login with your GitHub account

### 2. Deploy Backend
1. Click "New +" → "Web Service"
2. Connect your GitHub repository
3. Select this repository
4. Configure the service:
   - **Name**: `gif-converter-backend` (or your preferred name)
   - **Region**: Choose closest to your users
   - **Branch**: `main`
   - **Root Directory**: Leave empty
   - **Environment**: `Node`
   - **Build Command**: `cd backend && npm install --omit=dev`
   - **Start Command**: `cd backend && npm start`
   - **Node Version**: 20.x (auto-detected from .nvmrc)

5. Environment Variables (if needed):
   - `NODE_ENV`: `production`
   - Add any API keys (OpenAI, etc.) if you use them

6. Click "Create Web Service"

### Alternative: Use render.yaml (Recommended)
Since we have a `render.yaml` file, Render should automatically detect the configuration:
1. Just connect the repository
2. Render will read the configuration from `render.yaml`
3. Click "Create Web Service"

### 3. Get Your Backend URL
After deployment completes, you'll get a URL like:
`https://gif-converter-backend.onrender.com`

### 4. Update Frontend Configuration
1. Edit `frontend/.env.production`
2. Replace the placeholder with your actual backend URL:
   ```
   VITE_BACKEND_URL=https://gif-converter-backend.onrender.com
   ```

### 5. Redeploy Frontend on Vercel
1. Commit and push your changes
2. Vercel will automatically redeploy
3. Or manually trigger deployment in Vercel dashboard

## Common Deployment Issues & Solutions

### Node Version Issues
- ✅ Fixed: Updated to Node 20 (from 18)
- ✅ Fixed: Added .nvmrc file for version specification

### Package Warnings
- ✅ Fixed: Updated `multer` to v2.x (security fix)
- ✅ Fixed: Updated `uuid` to v10.x (deprecation fix)
- ✅ Fixed: Changed `--only=production` to `--omit=dev`

### Build Issues
If build still fails:
1. Check Render build logs
2. Ensure all files are committed to git
3. Try clearing Render cache and rebuilding

### Runtime Issues
If backend starts but crashes:
1. Check Render logs for errors
2. Verify all required system dependencies are installed
3. Check memory usage (free tier has limits)

## Troubleshooting

### Backend Issues
- Check Render logs if deployment fails
- Ensure all dependencies are in package.json
- Verify port configuration (Render assigns PORT automatically)

### Frontend Connection Issues
- Ensure backend URL in .env.production is correct
- Check that backend URL uses HTTPS
- Verify CSP settings allow your backend domain

### CSP Issues
If you get CSP errors after deployment:
1. ✅ Already updated `frontend/vercel.json`
2. CSP now allows `https://*.onrender.com`

## Cost Considerations
- Render free tier has 750 hours/month
- Backend will sleep after 15 minutes of inactivity
- First request after sleep takes ~30 seconds to wake up
- Consider upgrading to paid plan for production use

## Environment Variables
Set these in Render dashboard if needed:
- `OPENAI_API_KEY` (if using AI features)
- `NODE_ENV=production` (already set in render.yaml)
- Any other secrets your app requires