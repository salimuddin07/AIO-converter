#!/usr/bin/env node

/**
 * QUICK TEST SCRIPT
 * Tests if the Electron app is working properly
 */

const { app, BrowserWindow } = require('electron');
const path = require('path');

// Enable DevTools by default for testing
process.env.NODE_ENV = 'development';

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'electron', 'preload.js')
    }
  });

  // Load the app
  mainWindow.loadFile(path.join(__dirname, 'frontend', 'dist', 'index.html'));

  // Open DevTools automatically for testing
  mainWindow.webContents.openDevTools();

  // Log when ready
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('✅ App loaded successfully!');
    console.log('🔧 DevTools opened for debugging');
    console.log('📝 Check the Console tab for startup messages');
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
