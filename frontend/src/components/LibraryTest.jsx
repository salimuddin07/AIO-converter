import React, { useEffect, useState } from 'react';

// Test component to check if all libraries are working
const LibraryTest = () => {
  const [testResults, setTestResults] = useState([]);

  useEffect(() => {
    async function testLibraries() {
      const results = [];

      // Test GSAP
      try {
        const { gsap } = await import('gsap');
        gsap.set('body', {opacity: 1}); // Simple test
        results.push({ lib: 'GSAP', status: 'OK', message: 'Animation library loaded' });
      } catch (e) {
        results.push({ lib: 'GSAP', status: 'FAILED', message: e.message });
      }

      // Test Framer Motion
      try {
        const { motion } = await import('framer-motion');
        results.push({ lib: 'Framer Motion', status: 'OK', message: 'Animation library loaded' });
      } catch (e) {
        results.push({ lib: 'Framer Motion', status: 'FAILED', message: e.message });
      }

      // Test AnimJS
      try {
        const anime = await import('animejs');
        results.push({ lib: 'AnimeJS', status: 'OK', message: 'Animation library loaded' });
      } catch (e) {
        results.push({ lib: 'AnimeJS', status: 'FAILED', message: e.message });
      }

      // Test Lottie
      try {
        const lottie = await import('lottie-web');
        results.push({ lib: 'Lottie Web', status: 'OK', message: 'Animation library loaded' });
      } catch (e) {
        results.push({ lib: 'Lottie Web', status: 'FAILED', message: e.message });
      }

      // Test Three.js
      try {
        const THREE = await import('three');
        results.push({ lib: 'Three.js', status: 'OK', message: '3D library loaded' });
      } catch (e) {
        results.push({ lib: 'Three.js', status: 'FAILED', message: e.message });
      }

      // Test Konva
      try {
        const Konva = await import('konva');
        results.push({ lib: 'Konva', status: 'OK', message: '2D canvas library loaded' });
      } catch (e) {
        results.push({ lib: 'Konva', status: 'FAILED', message: e.message });
      }

      // Test P5.js
      try {
        const p5 = await import('p5');
        results.push({ lib: 'P5.js', status: 'OK', message: 'Creative coding library loaded' });
      } catch (e) {
        results.push({ lib: 'P5.js', status: 'FAILED', message: e.message });
      }

      // Test D3
      try {
        const d3 = await import('d3');
        results.push({ lib: 'D3.js', status: 'OK', message: 'Data visualization library loaded' });
      } catch (e) {
        results.push({ lib: 'D3.js', status: 'FAILED', message: e.message });
      }

      setTestResults(results);
    }

    testLibraries();
  }, []);

  const passedTests = testResults.filter(r => r.status === 'OK').length;
  const failedTests = testResults.filter(r => r.status === 'FAILED').length;

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h2>🧪 Frontend Library Test Results</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <strong>Summary:</strong> ✅ {passedTests} Passed, ❌ {failedTests} Failed
      </div>

      <div>
        {testResults.map((result, index) => (
          <div 
            key={index} 
            style={{
              padding: '10px',
              margin: '5px 0',
              backgroundColor: result.status === 'OK' ? '#d4edda' : '#f8d7da',
              borderLeft: `4px solid ${result.status === 'OK' ? '#28a745' : '#dc3545'}`,
              borderRadius: '4px'
            }}
          >
            <strong>{result.status === 'OK' ? '✅' : '❌'} {result.lib}</strong>
            <div style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>
              {result.message}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LibraryTest;