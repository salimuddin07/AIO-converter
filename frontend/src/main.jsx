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
  console.error('❌ This app requires the desktop version. Please use the Electron application.');
  // Show error message to user
  document.getElementById('root').innerHTML = `
    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; text-align: center; padding: 20px; font-family: Arial, sans-serif;">
      <h1 style="color: #e53e3e;">Desktop App Required</h1>
      <p style="color: #666; margin-bottom: 20px;">This application only works as a desktop app. Please download and run the desktop version.</p>
      <p style="color: #666;">No web server or browser version is available.</p>
    </div>
  `;
}

createRoot(document.getElementById('root')).render(<App />);
