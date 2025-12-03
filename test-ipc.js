/**
 * Test script to verify IPC handlers work correctly
 * This simulates the frontend calls and tests for cloning errors
 */

const { app, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs').promises;

// Test data
const testImagePath = path.join(__dirname, 'test-image.png');
const testVideoPath = path.join(__dirname, 'test-video.mp4');

async function createTestFiles() {
  try {
    // Create a simple test image (1x1 PNG)
    const pngData = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
      0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0xD7, 0x63, 0xF8, 0x0F, 0x00, 0x00,
      0x01, 0x00, 0x01, 0x5C, 0xC2, 0x8A, 0xB8, 0x00, 0x00, 0x00, 0x00, 0x49,
      0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
    ]);
    
    await fs.writeFile(testImagePath, pngData);
    console.log('✅ Created test image:', testImagePath);
    
    return testImagePath;
  } catch (error) {
    console.error('❌ Failed to create test files:', error);
    throw error;
  }
}

async function testIpcHandlers() {
  console.log('🧪 Starting IPC handler tests...');
  
  try {
    const testImage = await createTestFiles();
    
    // Test data that should be serializable
    const testCases = [
      {
        name: 'convertToWebp',
        handler: 'convertToWebp',
        data: { inputPath: testImage, options: { quality: 80 } }
      },
      {
        name: 'decodeWebp', 
        handler: 'decodeWebp',
        data: { inputPath: testImage, options: {} }
      },
      {
        name: 'describeImage',
        handler: 'describeImage', 
        data: { inputPath: testImage, options: {} }
      },
      {
        name: 'add-text-to-image',
        handler: 'add-text-to-image',
        data: { inputPath: testImage, text: 'Test', options: {} }
      }
    ];
    
    for (const testCase of testCases) {
      try {
        console.log(`\n🔍 Testing ${testCase.name}...`);
        console.log('📤 Sending data:', JSON.stringify(testCase.data, null, 2));
        
        // Simulate the IPC call
        const result = await new Promise((resolve, reject) => {
          // Find the handler
          const handlers = ipcMain._events || {};
          const handlerName = `invoke:${testCase.handler}`;
          
          if (handlers[handlerName]) {
            const handler = handlers[handlerName][0];
            if (handler) {
              // Call the handler with mock event
              const mockEvent = { sender: { send: () => {} } };
              handler(mockEvent, testCase.data)
                .then(resolve)
                .catch(reject);
            } else {
              reject(new Error(`Handler not found: ${testCase.handler}`));
            }
          } else {
            reject(new Error(`Handler not registered: ${testCase.handler}`));
          }
        });
        
        console.log(`✅ ${testCase.name} completed successfully`);
        
      } catch (error) {
        console.error(`❌ ${testCase.name} failed:`, error.message);
        if (error.message.includes('could not be cloned')) {
          console.error('🚨 CLONING ERROR DETECTED - This needs to be fixed!');
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Test setup failed:', error);
  }
  
  console.log('\n🏁 Test completed');
}

// Run the test if this script is executed directly
if (require.main === module) {
  // Load the main.js file to register handlers
  require('./electron/main.js');
  
  // Wait a bit for handlers to register
  setTimeout(() => {
    testIpcHandlers().catch(console.error);
  }, 1000);
}

module.exports = { testIpcHandlers, createTestFiles };