import React from 'react';

export default function Sidebar() {
  return (
    <aside id="sidebar">
      <div id="ad1" className="sky ads sidebar_ad">
        {/* Advertisement placeholder */}
        <div style={{
          width: '300px',
          height: '250px',
          backgroundColor: '#f0f0f0',
          border: '1px solid #ddd',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#999',
          fontSize: '14px'
        }}>
          Advertisement
        </div>
      </div>
      <br/>
      <div id="ad2" className="sky ads sidebar_ad">
        {/* Advertisement placeholder */}
        <div style={{
          width: '300px',
          height: '600px',
          backgroundColor: '#f0f0f0',
          border: '1px solid #ddd',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#999',
          fontSize: '14px'
        }}>
          Advertisement
        </div>
      </div>
    </aside>
  );
}
