import React, { useState } from 'react';

export default function ElectronApiTest() {
  const [testResults, setTestResults] = useState([]);
  const [isRunning, setIsRunning] = useState(false);

  const addResult = (test, status, message) => {
    setTestResults(prev => [...prev, { test, status, message, time: new Date().toLocaleTimeString() }]);
  };

  const runTests = async () => {
    setIsRunning(true);
    setTestResults([]);

    // Test 1: Check if Electron API is available
    try {
      const isElectron = typeof window !== 'undefined' && window.electronAPI !== undefined;
      addResult('Electron API Detection', isElectron ? 'PASS' : 'FAIL', 
        isElectron ? 'window.electronAPI is available' : 'window.electronAPI is not available');
      
      if (!isElectron) {
        setIsRunning(false);
        return;
      }

      // Test 2: Check app info
      try {
        const appInfo = await window.electronAPI.getAppInfo();
        addResult('App Info', 'PASS', `Got app info: ${appInfo.name} v${appInfo.version}`);
      } catch (error) {
        addResult('App Info', 'FAIL', `Error: ${error.message}`);
      }

      // Test 3: Test file write/read
      try {
        const testData = 'Hello Electron!';
        const writeResult = await window.electronAPI.writeFile({
          filePath: 'test_electron_api.txt',
          data: Buffer.from(testData).toString('base64'),
          encoding: 'base64'
        });
        
        if (writeResult.success) {
          addResult('File Write', 'PASS', `File written to: ${writeResult.filePath}`);
          
          // Try to read it back
          try {
            const readResult = await window.electronAPI.readFile(writeResult.filePath);
            const readData = Buffer.from(readResult, 'base64').toString('utf8');
            
            if (readData === testData) {
              addResult('File Read', 'PASS', `File read successfully: "${readData}"`);
            } else {
              addResult('File Read', 'FAIL', `Data mismatch: expected "${testData}", got "${readData}"`);
            }
          } catch (error) {
            addResult('File Read', 'FAIL', `Read error: ${error.message}`);
          }
        } else {
          addResult('File Write', 'FAIL', writeResult.error || 'Unknown write error');
        }
      } catch (error) {
        addResult('File Write', 'FAIL', `Write error: ${error.message}`);
      }

      // Test 4: Test image conversion (if Sharp is available)
      try {
        // Create a tiny test image (1x1 pixel PNG)
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'red';
        ctx.fillRect(0, 0, 1, 1);
        
        canvas.toBlob(async (blob) => {
          try {
            const arrayBuffer = await blob.arrayBuffer();
            const writeResult = await window.electronAPI.writeFile({
              filePath: 'test_image.png',
              data: arrayBuffer
            });
            
            if (writeResult.success) {
              const convertResult = await window.electronAPI.convertImage({
                inputPath: writeResult.filePath,
                outputPath: 'test_converted.jpg',
                format: 'jpg',
                quality: 80
              });
              
              if (convertResult.success) {
                addResult('Image Conversion', 'PASS', `Image converted successfully to: ${convertResult.outputPath}`);
              } else {
                addResult('Image Conversion', 'FAIL', convertResult.error || 'Conversion failed');
              }
            }
          } catch (error) {
            addResult('Image Conversion', 'FAIL', `Error: ${error.message}`);
          }
        }, 'image/png');
      } catch (error) {
        addResult('Image Conversion', 'FAIL', `Setup error: ${error.message}`);
      }

    } catch (error) {
      addResult('General Error', 'FAIL', error.message);
    }

    setIsRunning(false);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>🧪 Electron API Test Suite</h1>
      <p>This tool tests if the Electron backend integration is working correctly.</p>
      
      <button 
        onClick={runTests} 
        disabled={isRunning}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          backgroundColor: isRunning ? '#ccc' : '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: isRunning ? 'not-allowed' : 'pointer',
          marginBottom: '20px'
        }}
      >
        {isRunning ? '🔄 Running Tests...' : '▶️ Run Tests'}
      </button>

      {testResults.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <h2>Test Results:</h2>
          <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px' }}>
            {testResults.map((result, index) => (
              <div 
                key={index}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 12px',
                  margin: '5px 0',
                  backgroundColor: result.status === 'PASS' ? '#d4edda' : '#f8d7da',
                  border: `1px solid ${result.status === 'PASS' ? '#c3e6cb' : '#f5c6cb'}`,
                  borderRadius: '4px'
                }}
              >
                <div>
                  <strong>{result.test}</strong>: {result.message}
                </div>
                <div style={{ 
                  padding: '2px 8px', 
                  borderRadius: '12px',
                  backgroundColor: result.status === 'PASS' ? '#28a745' : '#dc3545',
                  color: 'white',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}>
                  {result.status}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#e9ecef', borderRadius: '8px' }}>
        <h3>What this tests:</h3>
        <ul>
          <li><strong>Electron API Detection</strong> - Is window.electronAPI available?</li>
          <li><strong>App Info</strong> - Can we get basic app information?</li>
          <li><strong>File Operations</strong> - Can we write and read files?</li>
          <li><strong>Image Conversion</strong> - Is Sharp working for image processing?</li>
        </ul>
        
        <p><strong>Expected Results in Desktop Mode:</strong> All tests should PASS</p>
        <p><strong>Expected Results in Browser Mode:</strong> First test should FAIL (Electron API not available)</p>
      </div>
    </div>
  );
}