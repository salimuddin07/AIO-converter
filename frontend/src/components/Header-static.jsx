import React from 'react';

export default function Header({ onNavigate, currentPage = 'home' }) {
  const handleNavClick = (e, page) => {
    e.preventDefault();
    if (onNavigate) {
      onNavigate(page);
    }
  };

  // Determine if we should show submenus
  const showVideoSubmenu = currentPage && currentPage.includes('video');
  const showWebPSubmenu = currentPage && currentPage.includes('webp');

  return (
    <>
      <div id="header">
        <a id="logo" href="/" title="Online animated GIF tools" onClick={(e) => handleNavClick(e, 'home')}>
          GifMaster.com <span>Animated GIFs Made Easy</span>
        </a>
        
        <div id="hdr" className="ads leaderboard">
          {/* Ad space placeholder */}
        </div>
        
        <nav>
          <ul id="menu">
            <li className={currentPage === 'maker' ? 'active' : ''}><a className="gifmaker" href="/maker" onClick={(e) => handleNavClick(e, 'maker')} title="Make animated GIF from still frames or edit frame order and duration of existing GIF">GIF Maker</a></li>
            <li className={currentPage === 'video-to-gif' ? 'active' : ''}><a className="video" href="/video-to-gif" onClick={(e) => handleNavClick(e, 'video-to-gif')} title="Video to GIF converter">Video to GIF</a></li>
            <li><a className="resize" href="/resize" onClick={(e) => handleNavClick(e, 'resize')} title="Resize animated image">Resize</a></li>
            <li><a className="rotate" href="/rotate" onClick={(e) => handleNavClick(e, 'rotate')} title="Rotate / reverse animated GIFs and images">Rotate</a></li>
            <li><a className="crop" href="/crop" onClick={(e) => handleNavClick(e, 'crop')} title="Crop selection of image">Crop</a></li>
            <li><a className="optimize" href="/optimize" onClick={(e) => handleNavClick(e, 'optimize')} title="Reduce animation size">Optimize</a></li>
            <li><a className="effects" href="/effects" onClick={(e) => handleNavClick(e, 'effects')} title="Add effects to images and animations">Effects</a></li>
            <li className={currentPage === 'split' ? 'active' : ''}><a className="split" href="/split" onClick={(e) => handleNavClick(e, 'split')} title="Split GIF image to frames">Split</a></li>
            <li className={currentPage === 'add-text' ? 'active' : ''}><a className="add-text" href="/add-text" onClick={(e) => handleNavClick(e, 'add-text')} title="Write text over GIF image">Add text</a></li>
            <li className={currentPage && currentPage.includes('webp') ? 'active' : ''}><a className="webp" href="/webp-maker" onClick={(e) => handleNavClick(e, 'webp-maker')} title="Animated WebP maker and tools">WebP</a></li>
            <li><a className="apng" href="/apng-maker" onClick={(e) => handleNavClick(e, 'apng-maker')} title="Animated PNG (APNG) maker and tools">APNG</a></li>
            <li><a className="avif" href="/avif-maker" onClick={(e) => handleNavClick(e, 'avif-maker')} title="AVIF tools">AVIF</a></li>
            <li><a className="jxl" href="/jxl-maker" onClick={(e) => handleNavClick(e, 'jxl-maker')} title="JPEG XL tools">JXL</a></li>
          </ul>
        </nav>
        <div className="c"></div>
      </div>
      
      {showVideoSubmenu && (
        <div id="submenu">
          <img src="/images/video-logo.png" alt="" title="Video tools" id="sub-logo" width="22" height="22" />
          <ul>
            <li className={currentPage === 'video-to-gif' ? 'active' : ''}>
              <a href="/video-to-gif" onClick={(e) => handleNavClick(e, 'video-to-gif')}>Video to GIF</a>
            </li>
            <li><a href="/gif-to-mp4" onClick={(e) => handleNavClick(e, 'gif-to-mp4')}>GIF to MP4</a></li>
            <li><a href="/rotate-video" onClick={(e) => handleNavClick(e, 'rotate-video')}>Rotate video</a></li>
            <li><a href="/resize-video" onClick={(e) => handleNavClick(e, 'resize-video')}>Resize</a></li>
            <li><a href="/reverse-video" onClick={(e) => handleNavClick(e, 'reverse-video')}>Reverse</a></li>
            <li><a href="/cut-video" onClick={(e) => handleNavClick(e, 'cut-video')}>Cut video</a></li>
            <li><a href="/crop-video" onClick={(e) => handleNavClick(e, 'crop-video')}>Crop video</a></li>
            <li><a href="/video-speed" onClick={(e) => handleNavClick(e, 'video-speed')}>Video speed</a></li>
            <li><a href="/mute-video" onClick={(e) => handleNavClick(e, 'mute-video')}>Mute</a></li>
            <li><a href="/merge-videos" onClick={(e) => handleNavClick(e, 'merge-videos')}>Merge</a></li>
            <li><a href="/video-to-jpg" onClick={(e) => handleNavClick(e, 'video-to-jpg')}>Video to JPG</a></li>
            <li><a href="/video-to-png" onClick={(e) => handleNavClick(e, 'video-to-png')}>Video to PNG</a></li>
          </ul>
        </div>
      )}

      {showWebPSubmenu && (
        <div id="submenu">
          <img src="/images/webp-logo.png" alt="" title="WebP tools" id="sub-logo" width="22" height="22" />
          <ul>
            <li className={currentPage === 'webp-maker' ? 'active' : ''}>
              <a href="/webp-maker" onClick={(e) => handleNavClick(e, 'webp-maker')}>Animated WebP Maker</a>
            </li>
            <li><a href="/webp-to-gif" onClick={(e) => handleNavClick(e, 'webp-to-gif')}>WebP to GIF</a></li>
            <li><a href="/webp-to-png" onClick={(e) => handleNavClick(e, 'webp-to-png')}>WebP to PNG</a></li>
            <li><a href="/webp-to-jpg" onClick={(e) => handleNavClick(e, 'webp-to-jpg')}>WebP to JPG</a></li>
            <li><a href="/gif-to-webp" onClick={(e) => handleNavClick(e, 'gif-to-webp')}>GIF to WebP</a></li>
            <li><a href="/png-to-webp" onClick={(e) => handleNavClick(e, 'png-to-webp')}>PNG to WebP</a></li>
            <li><a href="/jpg-to-webp" onClick={(e) => handleNavClick(e, 'jpg-to-webp')}>JPG to WebP</a></li>
            <li><a href="/webp-resize" onClick={(e) => handleNavClick(e, 'webp-resize')}>Resize WebP</a></li>
            <li><a href="/webp-crop" onClick={(e) => handleNavClick(e, 'webp-crop')}>Crop WebP</a></li>
            <li><a href="/webp-rotate" onClick={(e) => handleNavClick(e, 'webp-rotate')}>Rotate WebP</a></li>
            <li><a href="/webp-effects" onClick={(e) => handleNavClick(e, 'webp-effects')}>WebP Effects</a></li>
            <li><a href="/webp-optimize" onClick={(e) => handleNavClick(e, 'webp-optimize')}>Optimize WebP</a></li>
          </ul>
        </div>
      )}
    </>
  );
}
