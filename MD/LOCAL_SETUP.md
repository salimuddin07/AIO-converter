# Local Backend Setup Guide

## Overview
This project now runs exclusively on the local backend. Railway hosting was retired on 2025-10-04 to avoid server errors and simplify the workflow.

## Backend Setup

### 1. Start the Local Backend
```bash
cd backend
npm install
npm start
```

The backend will run on `http://localhost:5000`

### 2. Verify Backend is Running
Open your browser and go to: `http://localhost:5000/api/convert/test`
You should see a response like: `{"success":true,"message":"Test route working"}`

## Frontend Setup

### 1. Start the Frontend (Vercel)
```bash
cd frontend
npm install
npm run dev
```

The frontend will run on `http://localhost:3000` (or the port Vite assigns)

### 2. Environment Configuration
The frontend is configured to use the local backend at `http://localhost:5000`.
> Railway hosting has been removed; no external backend is configured by default.

## Modified Files

### Frontend Components Updated:
- `frontend/src/components/MainConversionInterface.jsx` - Main conversion logic
- `frontend/src/components/AddText.jsx` - Text overlay functionality  
- `frontend/src/components/VideoResults.jsx` - Video processing results

### Environment Files Updated:
- `frontend/.env.production` - Points to the local backend by default

## Code Structure

Each component now has clearly marked sections:

```javascript
// Local backend (active)
const base = 'http://localhost:5000';
```

## Troubleshooting

### Backend Won't Start
- Check if port 5000 is available
- Try running on port 5001: Change backend port in `backend/server.js`
- Update frontend components to match the new port

### Frontend Can't Connect
- Ensure backend is running first
- Check browser console for CORS errors
- Verify the port numbers match between frontend and backend

### API Errors
- Check backend terminal for error logs
- Verify API endpoints are working: `http://localhost:5000/api/convert/test`
- Check network tab in browser dev tools

## Benefits of Local Setup

1. **No Server Downtime**: Your local server won't randomly go down
2. **Faster Development**: No network latency to external servers
3. **Full Control**: You can debug and modify backend code in real-time
4. **No Deployment Issues**: No need to wait for Railway builds
5. **Cost Effective**: No hosting costs while developing locally