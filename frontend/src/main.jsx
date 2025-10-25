import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';

// Add global error handler for Electron IPC issues
window.addEventListener('unhandledrejection', (event) => {
  const errorMessage = event.reason?.message || String(event.reason);
  if (errorMessage.includes('message channel closed before a response was received')) {
    console.warn('🔇 Suppressing Electron IPC channel error (non-critical):', errorMessage);
    event.preventDefault(); // Prevent the error from appearing in console
    return;
  }
});

// Check if running in Electron
const isElectron = typeof window !== 'undefined' && window.electronAPI !== undefined;

// Log startup info
console.log('🚀 AIO Converter Starting...');
console.log('📦 Mode:', isElectron ? 'Desktop (Electron)' : 'Browser (Web)');
console.log('🔧 Electron API Available:', !!window.electronAPI);

if (isElectron) {
  console.log('✅ Running as Desktop App - Using local processing');
  // Get app info from Electron - with timeout and better error handling
  try {
    const appInfoPromise = window.electronAPI.getAppInfo();
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout after 5 seconds')), 5000)
    );
    
    Promise.race([appInfoPromise, timeoutPromise])
      .then(info => {
        console.log('📱 App Info:', info);
      })
      .catch(err => {
        console.warn('Could not get app info (this is not critical):', err);
        // Don't let this error block the app
      });
  } catch (err) {
    console.warn('Error initializing app info:', err);
  }
} else {
  console.log('⚠️ Running in Browser - Backend server required at http://localhost:3003');
}

createRoot(document.getElementById('root')).render(<App />);
