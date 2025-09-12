import React from 'react';

export default function Header({ onNavigate }) {
  const handleNavClick = (e, page) => {
    e.preventDefault();
    if (onNavigate) {
      onNavigate(page);
    }
  };

  return (
    <div id="header">
      <a id="logo" href="/" title="Online animated GIF tools" onClick={(e) => handleNavClick(e, 'home')}>
        GifMaster.com <span>Animated GIFs Made Easy</span>
      </a>
      
      <div id="hdr" className="ads leaderboard">
        {/* Ad space placeholder */}
      </div>
      
      <nav>
        <ul id="menu">
          <li><a className="gifmaker" href="/maker" onClick={(e) => handleNavClick(e, 'maker')} title="Make animated GIF from still frames or edit frame order and duration of existing GIF">GIF Maker</a></li>
          <li><a className="video" href="/video-to-gif" onClick={(e) => handleNavClick(e, 'video-to-gif')} title="Video to GIF converter">Video to GIF</a></li>
          <li><a className="resize" href="/resize" onClick={(e) => handleNavClick(e, 'resize')} title="Resize animated image">Resize</a></li>
          <li><a className="rotate" href="/rotate" onClick={(e) => handleNavClick(e, 'rotate')} title="Rotate / reverse animated GIFs and images">Rotate</a></li>
          <li><a className="crop" href="/crop" onClick={(e) => handleNavClick(e, 'crop')} title="Crop selection of image">Crop</a></li>
          <li><a className="optimize" href="/optimize" onClick={(e) => handleNavClick(e, 'optimize')} title="Reduce animation size">Optimize</a></li>
          <li><a className="effects" href="/effects" onClick={(e) => handleNavClick(e, 'effects')} title="Add effects to images and animations">Effects</a></li>
          <li><a className="split" href="/split" onClick={(e) => handleNavClick(e, 'split')} title="Split GIF image to frames">Split</a></li>
          <li><a className="add-text" href="/add-text" onClick={(e) => handleNavClick(e, 'add-text')} title="Write text over GIF image">Add text</a></li>
          <li><a className="webp" href="/webp-maker" onClick={(e) => handleNavClick(e, 'webp-maker')} title="Animated WebP maker and tools">WebP</a></li>
          <li><a className="apng" href="/apng-maker" onClick={(e) => handleNavClick(e, 'apng-maker')} title="Animated PNG (APNG) maker and tools">APNG</a></li>
          <li><a className="avif" href="/avif-maker" onClick={(e) => handleNavClick(e, 'avif-maker')} title="AVIF tools">AVIF</a></li>
          <li><a className="jxl" href="/jxl-maker" onClick={(e) => handleNavClick(e, 'jxl-maker')} title="JPEG XL tools">JXL</a></li>
        </ul>
      </nav>
      <div className="c"></div>
    </div>
  );
}
