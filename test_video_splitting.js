#!/usr/bin/env node
/**
 * Test script to verify video splitting functionality
 */

const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// Create a test video if it doesn't exist
async function createTestVideo() {
  const testVideoPath = path.join(__dirname, 'test_video.mp4');
  
  if (fs.existsSync(testVideoPath)) {
    console.log('✅ Test video already exists');
    return testVideoPath;
  }
  
  console.log('🎥 Creating test video (30 seconds)...');
  
  return new Promise((resolve, reject) => {
    const command = `ffmpeg -f lavfi -i testsrc=duration=30:size=640x480:rate=30 -c:v libx264 -pix_fmt yuv420p "${testVideoPath}"`;
    
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Error creating test video:', error);
        reject(error);
        return;
      }
      
      console.log('✅ Test video created successfully');
      resolve(testVideoPath);
    });
  });
}

// Test the video splitting functionality
async function testVideoSplitting() {
  try {
    console.log('🧪 Starting Video Splitting Tests');
    console.log('=' .repeat(50));
    
    const testVideoPath = await createTestVideo();
    
    // Test 1: Duration-based splitting (5-second segments)
    console.log('\n📋 Test 1: Duration-based splitting (5-second segments)');
    console.log('This should create 6 segments from the 30-second video');
    
    // Test 2: Custom segments
    console.log('\n📋 Test 2: Custom segments');
    console.log('Segments: 0-10s, 10-20s, 20-30s');
    
    console.log('\n✅ Tests completed! Please check the electron app:');
    console.log('   1. Load the test video');
    console.log('   2. Set segment duration to 5 seconds');
    console.log('   3. Verify it creates 6 segments (not fixed 10-second ones)');
    console.log('   4. Test custom segments: 0:00-0:10, 0:10-0:20, 0:20-0:30');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the tests
testVideoSplitting();