# 🚀 Frontend Deployment to Vercel - Step by Step

## ✅ Prerequisites Completed
- ✅ Frontend builds successfully
- ✅ Vercel configuration ready
- ✅ Environment variables set

## 🌐 Deploy to Vercel

### Method 1: Using Vercel Dashboard (Recommended)

1. **Go to [vercel.com](https://vercel.com)**
2. **Sign up/Login with GitHub**
3. **Click "New Project"**
4. **Import your `GIF-converter` repository**
5. **Configure the project:**
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`

6. **Set Environment Variables:**
   ```
   VITE_API_BASE_URL=http://localhost:5001
   VITE_MAX_FILE_SIZE=500
   VITE_APP_NAME=AIO Convert
   VITE_VERSION=1.0.0
   ```

7. **Click "Deploy"**

### Method 2: Using Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Navigate to project root
cd "C:\MyPersonelProjects\GIF converter"

# Deploy
vercel --prod

# When prompted:
# - Project Name: gif-converter-frontend
# - Root Directory: frontend
# - Build Command: npm run build
# - Output Directory: dist
```

## 🔧 After Frontend Deployment

1. **Copy your Vercel URL** (e.g., `https://gif-converter-frontend.vercel.app`)
2. **Configure your backend host** (Render, self-managed server, etc.) and make sure CORS allows the Vercel domain.
3. **Update frontend environment variables** with your backend URL (`VITE_API_BASE_URL=https://your-backend.example.com`).

> Railway hosting was retired on 2025-10-04. Use your preferred Node.js hosting provider instead.

## 🎯 Next Steps

1. **Deploy frontend to Vercel first** (using steps above)
2. **Deploy the backend to your chosen host**
3. **Update environment variables** to connect them
4. **Test the full application**

Your frontend is ready to deploy! 🚀