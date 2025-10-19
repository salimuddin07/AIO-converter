import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';

// Check if running in Electron
const isElectron = typeof window !== 'undefined' && window.electronAPI !== undefined;

// Log startup info
console.log('🚀 AIO Converter Starting...');
console.log('📦 Mode:', isElectron ? 'Desktop (Electron)' : 'Browser (Web)');
console.log('🔧 Electron API Available:', !!window.electronAPI);

if (isElectron) {
  console.log('✅ Running as Desktop App - Using local processing');
  // Get app info from Electron
  window.electronAPI.getAppInfo().then(info => {
    console.log('📱 App Info:', info);
  }).catch(err => {
    console.warn('Could not get app info:', err);
  });
} else {
  console.log('⚠️ Running in Browser - Backend server required at http://localhost:3003');
}

createRoot(document.getElementById('root')).render(<App />);
