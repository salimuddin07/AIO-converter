import React, { useState, useEffect } from 'react';
import { getApiUrl } from '../utils/unifiedAPI.js';

export default function ApiTest() {
  const [testResults, setTestResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const runApiTests = async () => {
    setLoading(true);
    const tests = [
      { name: 'Text Fonts API', endpoint: '/api/text/fonts' },
      { name: 'Health Check', endpoint: '/' },
      { name: 'Static Files', endpoint: '/test' }
    ];

    const results = [];
    for (const test of tests) {
      try {
        const response = await fetch(getApiUrl(test.endpoint));
        const status = response.ok ? 'SUCCESS' : 'FAILED';
        results.push({
          ...test,
          status,
          statusCode: response.status,
          timestamp: new Date().toLocaleTimeString()
        });
      } catch (error) {
        results.push({
          ...test,
          status: 'ERROR',
          error: error.message,
          timestamp: new Date().toLocaleTimeString()
        });
      }
    }
    setTestResults(results);
    setLoading(false);
  };

  useEffect(() => {
    runApiTests();
  }, []);

  return (
    <div style={{ padding: '20px', backgroundColor: '#f5f5f5', margin: '20px', borderRadius: '8px' }}>
      <h3>Frontend-Backend API Integration Test</h3>
      <button 
        onClick={runApiTests} 
        disabled={loading}
        style={{ 
          padding: '10px 20px', 
          backgroundColor: loading ? '#ccc' : '#007bff', 
          color: 'white', 
          border: 'none', 
          borderRadius: '4px',
          marginBottom: '20px'
        }}
      >
        {loading ? 'Testing...' : 'Run API Tests'}
      </button>
      
      <div>
        {testResults.map((result, index) => (
          <div 
            key={index} 
            style={{ 
              padding: '10px', 
              margin: '5px 0', 
              backgroundColor: result.status === 'SUCCESS' ? '#d4edda' : '#f8d7da',
              borderRadius: '4px',
              border: `1px solid ${result.status === 'SUCCESS' ? '#c3e6cb' : '#f5c6cb'}`
            }}
          >
            <strong>{result.name}</strong> - {result.status}
            <br />
            <small>
              Endpoint: {result.endpoint} | 
              {result.statusCode && ` Status: ${result.statusCode} |`}
              {result.error && ` Error: ${result.error} |`}
              Time: {result.timestamp}
            </small>
          </div>
        ))}
      </div>
    </div>
  );
}