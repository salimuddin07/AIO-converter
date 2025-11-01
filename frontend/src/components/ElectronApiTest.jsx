import React, { useState, useEffect } from 'react';
import { api } from '../utils/unifiedAPI.js';

export default function ElectronApiTest() {
  const [testResults, setTestResults] = useState({});
  const [isElectron, setIsElectron] = useState(false);

  useEffect(() => {
    // Test environment detection
    setIsElectron(api.isElectron);
    
    // Run basic tests
    runTests();
  }, []);

  const runTests = async () => {
    const results = {};
    
    // Test 1: Environment detection
    results.environmentTest = {
      name: "Environment Detection",
      passed: api.isElectron,
      details: api.isElectron ? "✅ Detected Electron environment" : "❌ Not detected as Electron"
    };

    // Test 2: Check if electronAPI is available
    results.electronApiTest = {
      name: "Electron API Availability", 
      passed: typeof window !== 'undefined' && window.electronAPI !== undefined,
      details: (typeof window !== 'undefined' && window.electronAPI !== undefined) 
        ? "✅ window.electronAPI is available" 
        : "❌ window.electronAPI is not available"
    };

    // Test 3: Check specific API methods
    if (typeof window !== 'undefined' && window.electronAPI) {
      const methods = ['writeFile', 'createGifFromImages', 'convertVideo', 'splitGif', 'extractVideoFrames', 'extractGifFrames'];
      const availableMethods = methods.filter(method => typeof window.electronAPI[method] === 'function');
      
      results.apiMethodsTest = {
        name: "API Methods Available",
        passed: availableMethods.length === methods.length,
        details: `✅ ${availableMethods.length}/${methods.length} methods available: ${availableMethods.join(', ')}`
      };
    }

    // Test 4: App info
    try {
      if (api.isElectron) {
        const appInfo = await api.getAppInfo();
        results.appInfoTest = {
          name: "App Info IPC Call",
          passed: !!appInfo,
          details: appInfo ? `✅ Got app info: ${appInfo.name} v${appInfo.version}` : "❌ Failed to get app info"
        };
      }
    } catch (error) {
      results.appInfoTest = {
        name: "App Info IPC Call",
        passed: false,
        details: `❌ Error: ${error.message}`
      };
    }

    setTestResults(results);
  };

  const testGifCreation = async () => {
    // This would test actual functionality but we need a file input for that
    console.log('🧪 Would test GIF creation here with actual files');
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h2>🔬 Electron Backend Integration Test</h2>
      
      <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: isElectron ? '#e8f5e8' : '#ffeaa7', borderRadius: '8px' }}>
        <strong>Environment: </strong>
        {isElectron ? '✅ Electron Desktop App' : '❌ Browser/Web App'}
      </div>

      <h3>Test Results:</h3>
      {Object.entries(testResults).map(([key, result]) => (
        <div key={key} style={{ 
          margin: '10px 0', 
          padding: '12px', 
          backgroundColor: result.passed ? '#e8f5e8' : '#ffe0e0',
          borderRadius: '6px',
          border: `2px solid ${result.passed ? '#4caf50' : '#f44336'}`
        }}>
          <strong>{result.name}:</strong> {result.details}
        </div>
      ))}

      <div style={{ marginTop: '20px' }}>
        <h3>Manual Checks:</h3>
        <ul>
          <li>Open DevTools → Network tab → Look for requests to localhost:3003 (should be NONE)</li>
          <li>Open DevTools → Console tab → Check for errors (should be minimal/none)</li>
          <li>Try uploading a file to any tool → Look for progress indicators and download buttons</li>
        </ul>
      </div>

      <button 
        onClick={runTests}
        style={{
          padding: '10px 20px',
          backgroundColor: '#2196f3',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          marginTop: '10px'
        }}
      >
        🔄 Re-run Tests
      </button>
    </div>
  );
}