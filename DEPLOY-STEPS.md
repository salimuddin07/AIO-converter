# 🚀 Step-by-Step Deployment Guide

## ✅ Backend is Working Locally!
Your backend is now running successfully on port 5001.

## 🎯 Deployment Plan

### Option 1: Railway (Recommended) - Easiest
### Option 2: Render - Free tier available  
### Option 3: DigitalOcean - More control

Let's go with **Railway** as it's the most straightforward:

---

## 📋 Railway Deployment Steps

### 1. Prepare Your Repository

**Current Status:** ✅ Your code is ready for deployment!

**Make sure you have:**
- ✅ Fixed import paths (done)
- ✅ Dockerfile created (done)
- ✅ railway.toml config (done)
- ✅ Backend working locally (confirmed)

### 2. Push to GitHub

```bash
# If not already done
git add .
git commit -m "Prepare for deployment with proper file naming and Docker config"
git push origin main
```

### 3. Deploy to Railway

1. **Go to [railway.app](https://railway.app)**
2. **Sign up/Login with GitHub**
3. **Click "New Project"**
4. **Select "Deploy from GitHub repo"**
5. **Choose your `GIF-converter` repository**
6. **Railway will automatically detect the Dockerfile**

### 4. Set Environment Variables

In Railway dashboard, add these environment variables:

```
NODE_ENV=production
PORT=8080
MAX_FILE_SIZE_GB=500
MAX_BATCH_COUNT=20
CORS_ORIGIN=*
```

### 5. Deploy Backend

- Railway will automatically build using your Dockerfile
- Wait for deployment to complete (~5-10 minutes)
- Copy your Railway backend URL (e.g., `https://your-app.railway.app`)

---

## 🌐 Frontend Deployment to Vercel

### 1. Update Frontend Environment

Create `frontend/.env`:
```
VITE_API_BASE_URL=https://your-railway-url.railway.app
VITE_MAX_FILE_SIZE=500
```

### 2. Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy frontend
cd frontend
vercel --prod
```

Or use the Vercel dashboard:
1. Import your GitHub repo
2. Set root directory to `frontend`
3. Set build command: `npm run build`
4. Set output directory: `dist`

### 3. Update CORS

Update your Railway environment:
```
CORS_ORIGIN=https://your-vercel-app.vercel.app
```

---

## 🔧 Alternative: Render Deployment

If you prefer Render (has free tier):

1. **Go to [render.com](https://render.com)**
2. **Connect your GitHub repo**
3. **Create a new "Web Service"**
4. **Use these settings:**
   - Build Command: `cd backend && npm install`
   - Start Command: `cd backend && npm start`
   - Environment: Node
   - Plan: Free (or paid for better performance)

---

## 🧪 Test Your Deployment

After deployment, test these endpoints:

```bash
# Health check
curl https://your-backend-url.railway.app/health

# Test conversion endpoint
curl -X POST https://your-backend-url.railway.app/api/convert \
  -F "files=@test-image.jpg" \
  -F "targetFormat=png"
```

---

## 🎉 You're Ready to Deploy!

Your project structure is now perfect for deployment:

✅ **Professional file naming**  
✅ **Proper import paths**  
✅ **Docker configuration**  
✅ **Backend tested and working**  
✅ **Deployment configs ready**  

**Next step:** Choose Railway or Render and follow the steps above!

Would you like me to help you with any specific deployment step?