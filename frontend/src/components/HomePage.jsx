import React from 'react';

export default function HomePage({ onNavigate }) {
  const handleNavClick = (e, page) => {
    e.preventDefault();
    if (onNavigate) {
      onNavigate(page);
    }
  };

  return (
    <div id="main">
      <h1 style={{textAlign: 'center'}}>Online GIF maker and image editor</h1>
      
      <ul id="giftools-menu">
        <li className="video-to-gif">
          <a href="/video-to-gif" onClick={(e) => handleNavClick(e, 'video-to-gif')} title="Video to GIF online converter">Video to GIF</a>
        </li>
        <li className="add-text">
          <a href="/add-text" onClick={(e) => handleNavClick(e, 'add-text')} title="Add text overlays to animated images">Add Text</a>
        </li>
        <li className="resize">
          <a href="/resize" onClick={(e) => handleNavClick(e, 'resize')} title="Resize GIFs and other animated images">Resizer</a>
        </li>
        <li className="optim">
          <a href="/optimize" onClick={(e) => handleNavClick(e, 'optimize')} title="Optimize animated GIFs for file size and performance">Optimizer</a>
        </li>
        <li className="maker">
          <a href="/maker" onClick={(e) => handleNavClick(e, 'maker')} title="Make animated GIF from multiple images">GIF Maker</a>
        </li>
      </ul>
      
      <p id="site-description">
        GifMaster.com is a simple, free online GIF maker and toolset for basic animated image editing.<br/>
        Here you can create, edit and convert GIF, APNG, WebP, MNG and AVIF animations.
      </p>
      
      <div id="share" className="index"></div>
      
      <div id="news">
        <h2>GifMaster.com news and updates</h2>
        <ul className="tweet_list">
          <li>
            <span className="date">Sep 12, 2025</span>
            <p>Welcome to GifMaster.com - your new online GIF creation and editing platform!</p>
          </li>
          <li>
            <span className="date">Sep 12, 2025</span>
            <p>All major features are now available: GIF creation, video conversion, resize, optimize, and more.</p>
          </li>
          <li>
            <span className="date">Sep 12, 2025</span>
            <p>Added support for SVG to transparent background conversion with color preservation.</p>
          </li>
          <li>
            <span className="date">Sep 12, 2025</span>
            <p>Professional animated GIF maker with advanced controls like crossfading, frame delays, and transparency.</p>
          </li>
        </ul>
      </div>
    </div>
  );
}
