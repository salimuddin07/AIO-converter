import React, { useEffect, useState } from 'react';
import AIOConvertMainInterface from './components/AIOConvertMainInterface.jsx';
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import NotificationService from './utils/NotificationService.js';
import './aio-convert-style.css';

export default function App() {
  const [results, setResults] = useState([]);
  const [splitResults, setSplitResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [aiStatus, setAiStatus] = useState(null);
  const [currentPage, setCurrentPage] = useState('home');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [conversionStats, setConversionStats] = useState({
    totalConversions: 0,
    successfulConversions: 0,
    failedConversions: 0,
    averageTime: 0
  });
  
  useEffect(() => {
    const base = import.meta.env.VITE_BACKEND_URL || '';
    
    // Show loading toast for AI status check
    NotificationService.toast('Initializing application...', 'info', { timer: 2000 });
    
    fetch(base + '/api/ai/status')
      .then(r => r.json())
      .then(status => {
        setAiStatus(status);
        NotificationService.success(
          'Application Ready!', 
          'All services are operational and ready to use.',
          { timer: 3000 }
        );
      })
      .catch(() => {
        NotificationService.warning(
          'Limited Functionality',
          'Some AI features may not be available.',
          { timer: 4000 }
        );
      });
  }, []);

  async function handleConvert({ files, targetFormat, gifOptions, videoOptions, webpOptions, imageUrl }) {
    setError(null);
    setLoading(true);
    setUploadProgress(0);
    
    // Show progress notification
    const progressNotification = NotificationService.progress('Converting Files', 0);
    
    try {
      // Update stats
      setConversionStats(prev => ({
        ...prev,
        totalConversions: prev.totalConversions + 1
      }));

      const form = new FormData();
      
      // Handle files or image URL
      if (files && files.length > 0) {
        files.forEach(f => {
          if (f.url) {
            // Handle URL-based file
            form.append('imageUrl', f.url);
          } else {
            form.append('files', f);
          }
        });
      } else if (imageUrl) {
        form.append('imageUrl', imageUrl);
      }
      
      form.append('targetFormat', targetFormat);
      
      if (targetFormat === 'gif' && gifOptions) {
        if (gifOptions.frameDelays && gifOptions.frameDelays.length > 0) {
          gifOptions.frameDelays.forEach((delay, i) => {
            form.append(`frameDelay_${i}`, delay);
          });
        } else if (gifOptions.frameDelay) {
          form.append('gif.frameDelay', gifOptions.frameDelay);
        }
        if (gifOptions.loop !== undefined) form.append('gif.loop', gifOptions.loop);
        if (gifOptions.quality) form.append('gif.quality', gifOptions.quality);
        if (gifOptions.globalColormap) form.append('gif.globalColormap', 'true');
        if (gifOptions.crossfade) {
          form.append('gif.crossfade', 'true');
          form.append('gif.crossfadeFrames', gifOptions.crossfadeFrames || 10);
          form.append('gif.crossfadeDelay', gifOptions.crossfadeDelay || 6);
        }
        if (gifOptions.noStack) form.append('gif.noStack', 'true');
        if (gifOptions.keepFirst) form.append('gif.keepFirst', 'true');
        if (gifOptions.skipFirst) form.append('gif.skipFirst', 'true');
      }
      
      if ((targetFormat === 'mp4' || targetFormat === 'frames') && videoOptions) {
        if (videoOptions.frameRate) form.append('video.frameRate', videoOptions.frameRate);
        if (videoOptions.quality) form.append('video.quality', videoOptions.quality);
      }
      
      if (targetFormat === 'webp' && webpOptions) {
        if (webpOptions.quality) form.append('webp.quality', webpOptions.quality);
        if (webpOptions.method !== undefined) form.append('webp.method', webpOptions.method);
        if (webpOptions.lossless) form.append('webp.lossless', 'true');
        if (webpOptions.animated) form.append('webp.animated', 'true');
        if (webpOptions.loop !== undefined) form.append('webp.loop', webpOptions.loop);
        if (webpOptions.frameDelay) form.append('webp.frameDelay', webpOptions.frameDelay);
        if (webpOptions.backgroundAlpha !== undefined) form.append('webp.backgroundAlpha', webpOptions.backgroundAlpha);
      }

      const base = import.meta.env.VITE_BACKEND_URL || '';
      
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const newProgress = Math.min(prev + Math.random() * 10, 90);
          progressNotification.updateProgress(newProgress);
          return newProgress;
        });
      }, 200);

      let res;
      try {
        res = await fetch(base + '/api/convert', { method: 'POST', body: form });
      } catch (e1) {
        console.warn('Primary fetch failed, attempting direct backend http://localhost:5001');
        const fallback = 'http://localhost:5001';
        res = await fetch(fallback + '/api/convert', { method: 'POST', body: form });
      }
      
      clearInterval(progressInterval);
      progressNotification.updateProgress(100);
      
      let data; 
      try { 
        data = await res.json(); 
      } catch { 
        data = {}; 
      }
      
      if (!res.ok) {
        const details = data?.error?.details ? `: ${data.error.details.join('; ')}` : '';
        const errorMessage = data.error?.message || `Conversion failed${details}`;
        
        // Update failure stats
        setConversionStats(prev => ({
          ...prev,
          failedConversions: prev.failedConversions + 1
        }));
        
        throw new Error(errorMessage);
      }
      
      // Update success stats
      setConversionStats(prev => ({
        ...prev,
        successfulConversions: prev.successfulConversions + 1
      }));
      
      setResults(data.results || []);
      progressNotification.close();
      
      // Show conversion complete notification
      NotificationService.conversionComplete(data.results || [], {
        confirmButtonText: 'Download All',
        cancelButtonText: 'View Results'
      }).then((result) => {
        if (result.isConfirmed && data.results) {
          // Download all files
          data.results.forEach((file, index) => {
            setTimeout(() => {
              const link = document.createElement('a');
              link.href = `${base}${file.url}`;
              link.download = file.convertedName;
              link.click();
            }, index * 500); // Stagger downloads
          });
        }
      });
      
    } catch (e) {
      console.error('Upload error', e);
      const errorMessage = `Upload failed: ${e.message}`;
      setError(errorMessage);
      
      progressNotification.close();
      
      NotificationService.error(
        'Conversion Failed',
        e.message,
        { 
          confirmButtonText: 'Try Again',
          showCancelButton: true,
          cancelButtonText: 'Cancel'
        }
      );
      
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  }

  // Split GIF functionality
  async function handleSplit({ file, url }) {
    setError(null);
    setLoading(true);
    setSplitResults(null);
    
    try {
      const form = new FormData();
      if (file) {
        form.append('file', file);
      }
      if (url) {
        form.append('url', url);
      }
      
      const base = import.meta.env.VITE_BACKEND_URL || '';
      let res;
      try {
        res = await fetch(base + '/api/split/split', { method: 'POST', body: form });
      } catch (e1) {
        console.warn('Primary fetch failed, attempting direct backend http://localhost:4001');
        const fallback = 'http://localhost:4001';
        res = await fetch(fallback + '/api/split/split', { method: 'POST', body: form });
      }
      
      let data;
      try {
        data = await res.json();
      } catch {
        data = {};
      }
      
      if (!res.ok) {
        throw new Error(data.error || `Split failed: ${res.status}`);
      }
      
      setSplitResults(data);
    } catch (e) {
      console.error('Split error', e);
      setError(`Split failed: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }

  // Handle editing animation from split results
  const handleEditAnimation = () => {
    // Switch to maker page and pre-populate with frames
    setCurrentPage('maker');
    // In a real implementation, you'd pass the frame data
  };

  // Handle ZIP download
  const handleDownloadZip = () => {
    if (splitResults && splitResults.zipUrl) {
      const base = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4001';
      window.open(base + splitResults.zipUrl, '_blank');
    }
  };

  // Navigation handler for future routing
  const handleNavigation = (page) => {
    setCurrentPage(page);
  };

  const renderCurrentPage = () => {
    const containerStyle = {
      minHeight: '60vh',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      borderRadius: '16px',
      padding: '2rem',
      margin: '1rem 0',
      boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
    };

    switch(currentPage) {
      case 'maker':
        return (
          <div id="main" style={containerStyle} className="app-container animate__animated animate__fadeIn">
            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ 
                fontSize: '2.5rem', 
                fontWeight: '700', 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                marginBottom: '1rem'
              }}>
                Professional Image Converter
              </h2>
              
              {/* Advanced file manager with drag & drop */}
              <SortableFileManager
                files={selectedFiles}
                onFilesReorder={handleFilesReorder}
                onFileAdd={handleFileAdd}
                onFileRemove={handleFileRemove}
                acceptedTypes={['image/*', 'video/*']}
                maxFiles={20}
                multiple={true}
                showPreview={true}
              />
              
              {/* Progress visualization */}
              {loading && (
                <div style={{ margin: '2rem 0', textAlign: 'center' }}>
                  <D3ProgressVisualization
                    progress={uploadProgress}
                    total={100}
                    type="circular"
                    color={colors.primary}
                    size={200}
                    animated={true}
                    showValue={true}
                    label="Processing"
                  />
                </div>
              )}
              
              {/* Enhanced upload area */}
              <AdvancedUploadArea onConvert={handleConvert} loading={loading} />
            </div>
            
            {error && (
              <div 
                role="alert" 
                className="error animate__animated animate__shakeX"
                style={{
                  color: colors.error,
                  padding: '1rem',
                  margin: '1rem 0',
                  background: colorVariations(colors.error).transparent,
                  border: `2px solid ${colors.error}`,
                  borderRadius: '12px',
                  fontSize: '1.1rem'
                }}
              >
                {error}
              </div>
            )}
            
            <Results results={results} />
            
            {/* Statistics Dashboard */}
            {conversionStats.totalConversions > 0 && (
              <div style={{ marginTop: '2rem' }}>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: colors.text }}>
                  Conversion Statistics
                </h3>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '1rem'
                }}>
                  <div style={{
                    background: 'white',
                    padding: '1.5rem',
                    borderRadius: '12px',
                    textAlign: 'center',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}>
                    <div style={{ fontSize: '2rem', fontWeight: '700', color: colors.primary }}>
                      {conversionStats.totalConversions}
                    </div>
                    <div style={{ fontSize: '0.9rem', color: colors.textSecondary }}>
                      Total Conversions
                    </div>
                  </div>
                  
                  <div style={{
                    background: 'white',
                    padding: '1.5rem',
                    borderRadius: '12px',
                    textAlign: 'center',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}>
                    <div style={{ fontSize: '2rem', fontWeight: '700', color: colors.success }}>
                      {conversionStats.successfulConversions}
                    </div>
                    <div style={{ fontSize: '0.9rem', color: colors.textSecondary }}>
                      Successful
                    </div>
                  </div>
                  
                  <div style={{
                    background: 'white',
                    padding: '1.5rem',
                    borderRadius: '12px',
                    textAlign: 'center',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}>
                    <div style={{ fontSize: '2rem', fontWeight: '700', color: colors.error }}>
                      {conversionStats.failedConversions}
                    </div>
                    <div style={{ fontSize: '0.9rem', color: colors.textSecondary }}>
                      Failed
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
        
      case 'split':
        return (
          <div style={containerStyle} className="app-container animate__animated animate__fadeIn">
            <h2 style={{ 
              fontSize: '2.5rem', 
              fontWeight: '700', 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '2rem'
            }}>
              GIF Frame Splitter
            </h2>
            
            <GifSplitter onSplit={handleSplit} loading={loading} />
            
            {loading && (
              <div style={{ margin: '2rem 0', textAlign: 'center' }}>
                <D3ProgressVisualization
                  progress={75}
                  total={100}
                  type="wave"
                  color={colors.info}
                  size={300}
                  animated={true}
                  showValue={true}
                  label="Splitting GIF"
                />
              </div>
            )}
            
            {error && (
              <div 
                role="alert" 
                className="error animate__animated animate__shakeX"
                style={{
                  color: colors.error,
                  padding: '1rem',
                  margin: '1rem 0',
                  background: colorVariations(colors.error).transparent,
                  border: `2px solid ${colors.error}`,
                  borderRadius: '12px'
                }}
              >
                {error}
              </div>
            )}
            
            {splitResults && (
              <div className="animate__animated animate__fadeInUp">
                <SplitResults 
                  frames={splitResults.frames} 
                  onEditAnimation={handleEditAnimation}
                  onDownloadZip={handleDownloadZip}
                />
              </div>
            )}
          </div>
        );
        
      case 'video-to-gif':
        return (
          <div style={containerStyle} className="app-container animate__animated animate__fadeIn">
            <VideoToGif />
          </div>
        );
        
      case 'add-text':
        return (
          <div style={containerStyle} className="app-container animate__animated animate__fadeIn">
            <AddText />
          </div>
        );

      case 'webp-maker':
        return (
          <div style={containerStyle} className="app-container animate__animated animate__fadeIn">
            <WebPMaker onConvert={handleConvert} loading={loading} />
            
            {error && (
              <div 
                role="alert" 
                className="error animate__animated animate__shakeX"
                style={{
                  color: colors.error,
                  padding: '1rem',
                  margin: '1rem 0',
                  background: colorVariations(colors.error).transparent,
                  border: `2px solid ${colors.error}`,
                  borderRadius: '12px'
                }}
              >
                {error}
              </div>
            )}
            
            <Results results={results} />
          </div>
        );
        
      case 'image-editor':
        return (
          <div style={containerStyle} className="app-container animate__animated animate__fadeIn">
            <h2 style={{ 
              fontSize: '2.5rem', 
              fontWeight: '700', 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '2rem'
            }}>
              Professional Image Editor
            </h2>
            
            <KonvaImageEditor
              width={800}
              height={600}
              tools={['text', 'draw', 'crop', 'filters']}
              onSave={(imageData) => {
                NotificationService.success(
                  'Image Saved!',
                  'Your edited image has been saved successfully.',
                  { timer: 3000 }
                );
              }}
            />
          </div>
        );
        
      default:
        return (
          <div className="app-container animate__animated animate__fadeIn">
            <HomePage onNavigate={navigateToPage} />
          </div>
        );
    }
  };

  return (
    <div className="ww" id="wrapper" style={{ 
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      minHeight: '100vh'
    }}>
      <Header onNavigate={navigateToPage} currentPage={currentPage} />
      
      <div id="content" style={{ position: 'relative' }}>
        <Sidebar />
        
        {/* Enhanced main content area */}
        <div style={{ 
          padding: '2rem',
          background: 'rgba(255,255,255,0.1)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          margin: '1rem',
          boxShadow: '0 8px 32px rgba(31, 38, 135, 0.37)',
          border: '1px solid rgba(255, 255, 255, 0.18)'
        }}>
          {renderCurrentPage()}
        </div>
        
        {/* Floating action button for quick access */}
        <div style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          zIndex: 1000
        }}>
          <button
            onClick={() => {
              NotificationService.custom(`
                <div style="text-align: center; padding: 20px;">
                  <h3 style="margin-bottom: 20px; color: #333;">Quick Actions</h3>
                  <div style="display: flex; flex-direction: column; gap: 12px;">
                    <button onclick="window.quickNavigate('maker')" style="padding: 12px; border: none; border-radius: 8px; background: #667eea; color: white; cursor: pointer;">Convert Images</button>
                    <button onclick="window.quickNavigate('video-to-gif')" style="padding: 12px; border: none; border-radius: 8px; background: #764ba2; color: white; cursor: pointer;">Video to GIF</button>
                    <button onclick="window.quickNavigate('add-text')" style="padding: 12px; border: none; border-radius: 8px; background: #f093fb; color: white; cursor: pointer;">Add Text</button>
                    <button onclick="window.quickNavigate('image-editor')" style="padding: 12px; border: none; border-radius: 8px; background: #4facfe; color: white; cursor: pointer;">Image Editor</button>
                    <button onclick="window.quickNavigate('split')" style="padding: 12px; border: none; border-radius: 8px; background: #43e97b; color: white; cursor: pointer;">Split GIF</button>
                  </div>
                </div>
              `, {
                showConfirmButton: false,
                showCloseButton: true,
                width: '400px'
              });
              
              // Add global quick navigation function
              window.quickNavigate = (page) => {
                navigateToPage(page);
                NotificationService.close();
              };
            }}
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              border: 'none',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              fontSize: '24px',
              cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'scale(1.1) rotate(10deg)';
              e.target.style.boxShadow = '0 8px 30px rgba(0,0,0,0.4)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'scale(1) rotate(0deg)';
              e.target.style.boxShadow = '0 4px 20px rgba(0,0,0,0.3)';
            }}
            title="Quick Actions"
          >
            ⚡
          </button>
        </div>
        
        <div className="c"></div>
      </div>
      
      <Footer />
      
      {/* Global styles for enhanced UI */}
      <style jsx global>{`
        * {
          box-sizing: border-box;
        }
        
        body {
          margin: 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
            'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
            sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
        
        .animate__animated {
          animation-duration: 0.5s;
          animation-fill-mode: both;
        }
        
        .animate__faster {
          animation-duration: 0.3s;
        }
        
        .glass-effect {
          background: rgba(255, 255, 255, 0.25);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.18);
          border-radius: 16px;
        }
        
        .hover-lift {
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        
        .hover-lift:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 25px rgba(0,0,0,0.15);
        }
        
        .btn-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          color: white;
          padding: 12px 24px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        
        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
        }
        
        .card-enhanced {
          background: white;
          border-radius: 16px;
          padding: 1.5rem;
          box-shadow: 0 4px 20px rgba(0,0,0,0.1);
          transition: all 0.3s ease;
          border: 1px solid rgba(255,255,255,0.2);
        }
        
        .card-enhanced:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 30px rgba(0,0,0,0.15);
        }
        
        .gradient-text {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          font-weight: 700;
        }
      `}</style>
    </div>
  );
}
