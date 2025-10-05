# Quick Fix for Testing (Temporary Solution)

If you want to test your Vercel deployment immediately without waiting for a full Render deployment, you can use ngrok to expose your local backend with HTTPS:

## Option 1: Using ngrok (Temporary)

### 1. Install ngrok
```bash
# Download from https://ngrok.com or use package manager
npm install -g ngrok
# or
choco install ngrok
```

### 2. Start your local backend
```bash
cd backend
npm start
```

### 3. In another terminal, expose it with HTTPS
```bash
ngrok http 3003
```

### 4. Copy the HTTPS URL (something like https://abc123.ngrok.io)

### 5. Update your production env
```bash
# In frontend/.env.production
VITE_BACKEND_URL=https://abc123.ngrok.io
```

### 6. Commit and push to trigger Vercel redeploy

## Option 2: Use Render (Recommended for Production)

Follow the PRODUCTION_DEPLOY.md guide for a proper production setup.

## Why This Fixes the CSP Error

The CSP error occurs because:
1. Your Vercel app runs on HTTPS
2. Your local backend runs on HTTP
3. Browsers block HTTP requests from HTTPS pages (mixed content)
4. CSP policy enforces this with `connect-src 'self' https: wss:`

The solution requires an HTTPS backend URL, which you get from:
- Render deployment (permanent solution)
- ngrok tunnel (temporary testing)
- Any other cloud provider with HTTPS support