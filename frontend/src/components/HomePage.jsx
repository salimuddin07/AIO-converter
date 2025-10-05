import React, { useState, useEffect } from 'react';
import ProgressVisualization from './ProgressVisualization.jsx';
import { colors, colorVariations, buttonStyles } from '../utils/polishedHelpers.js';
import { NotificationService } from '../utils/NotificationService.js';

export default function HomePage({ onNavigate }) {
  const [featuredStats, setFeaturedStats] = useState({
    conversions: 1247,
    users: 523,
    filesProcessed: 8932
  });

  // Animate stats on load
  useEffect(() => {
    // Show welcome notification
    NotificationService.toast('Welcome to Professional GIF Converter!', 'success', { 
      timer: 4000,
      position: 'top-center'
    });
  }, []);

  const handleNavClick = (e, page) => {
    e.preventDefault();
    if (onNavigate) {
      onNavigate(page);
    }
  };

  const features = [
    {
      icon: '🎬',
      title: 'Video to GIF',
      description: 'Convert videos to high-quality animated GIFs with advanced controls',
      page: 'video-to-gif',
      color: colors.primary
    },
    {
      icon: '🎨',
      title: 'Image Editor',
      description: 'Professional image editing with Konva.js canvas tools',
      page: 'image-editor',
      color: colors.info
    },
    {
      icon: '⚡',
      title: 'GIF Maker',
      description: 'Create stunning animated GIFs from multiple images',
      page: 'maker',
      color: colors.success
    },
    {
      icon: '✂️',
      title: 'GIF Splitter',
      description: 'Extract individual frames from animated GIFs',
      page: 'split',
      color: colors.warning
    },
    {
      icon: '🔧',
      title: 'Optimizer',
      description: 'Reduce file size while maintaining quality',
      page: 'optimize',
      color: colors.error
    }
  ];

  return (
    <div id="main" style={{ padding: '2rem 0' }}>
      {/* Hero Section */}
      <div style={{
        textAlign: 'center',
        marginBottom: '4rem',
        padding: '3rem 2rem',
        background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
        borderRadius: '20px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23667eea" fill-opacity="0.05"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
          opacity: 0.3
        }} />
        
        <h1 className="animate__animated animate__fadeInDown" style={{
          fontSize: '3.5rem',
          fontWeight: '800',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '1rem',
          position: 'relative',
          zIndex: 1
        }}>
          Professional GIF Converter
        </h1>
        
        <p className="animate__animated animate__fadeInUp animate__delay-1s" style={{
          fontSize: '1.3rem',
          color: colors.textSecondary,
          maxWidth: '600px',
          margin: '0 auto 2rem',
          lineHeight: 1.6,
          position: 'relative',
          zIndex: 1
        }}>
          Create, edit, and optimize animated GIFs with professional-grade tools.
          Featuring advanced libraries like D3.js, Konva.js, and SweetAlert2.
        </p>

        {/* Featured Stats */}
        <div className="animate__animated animate__fadeInUp animate__delay-2s" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '2rem',
          maxWidth: '600px',
          margin: '0 auto',
          position: 'relative',
          zIndex: 1
        }}>
          <div style={{ textAlign: 'center' }}>
            <ProgressVisualization
              progress={85}
              total={100}
              type="circular"
              color={colors.primary}
              size={80}
              animated={true}
              showValue={false}
              label=""
            />
            <div style={{ fontSize: '1.8rem', fontWeight: '700', color: colors.primary, marginTop: '0.5rem' }}>
              {featuredStats.conversions}+
            </div>
            <div style={{ fontSize: '0.9rem', color: colors.textSecondary }}>
              Conversions Today
            </div>
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <ProgressVisualization
              progress={92}
              total={100}
              type="circular"
              color={colors.success}
              size={80}
              animated={true}
              showValue={false}
              label=""
            />
            <div style={{ fontSize: '1.8rem', fontWeight: '700', color: colors.success, marginTop: '0.5rem' }}>
              {featuredStats.users}+
            </div>
            <div style={{ fontSize: '0.9rem', color: colors.textSecondary }}>
              Active Users
            </div>
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <ProgressVisualization
              progress={78}
              total={100}
              type="circular"
              color={colors.warning}
              size={80}
              animated={true}
              showValue={false}
              label=""
            />
            <div style={{ fontSize: '1.8rem', fontWeight: '700', color: colors.warning, marginTop: '0.5rem' }}>
              {featuredStats.filesProcessed}+
            </div>
            <div style={{ fontSize: '0.9rem', color: colors.textSecondary }}>
              Files Processed
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div style={{ marginBottom: '4rem' }}>
        <h2 style={{
          textAlign: 'center',
          fontSize: '2.5rem',
          fontWeight: '700',
          marginBottom: '3rem',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Professional Tools
        </h2>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '2rem',
          padding: '0 1rem'
        }}>
          {features.map((feature, index) => (
            <div
              key={feature.page}
              className={`feature-card animate__animated animate__fadeInUp hover-lift`}
              style={{
                animationDelay: `${index * 150}ms`,
                background: 'white',
                borderRadius: '16px',
                padding: '2rem',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                border: '1px solid rgba(255,255,255,0.2)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                position: 'relative',
                overflow: 'hidden'
              }}
              onClick={(e) => handleNavClick(e, feature.page)}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)';
                e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.15)';
                e.currentTarget.style.borderColor = feature.color;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.1)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
              }}
            >
              <div style={{
                position: 'absolute',
                top: '-50%',
                right: '-50%',
                width: '100px',
                height: '100px',
                background: `linear-gradient(135deg, ${colorVariations(feature.color).transparent}, ${colorVariations(feature.color).semiTransparent})`,
                borderRadius: '50%',
                opacity: 0.5
              }} />
              
              <div style={{
                fontSize: '4rem',
                marginBottom: '1rem',
                position: 'relative',
                zIndex: 1
              }}>
                {feature.icon}
              </div>
              
              <h3 style={{
                fontSize: '1.5rem',
                fontWeight: '700',
                marginBottom: '1rem',
                color: colors.text,
                position: 'relative',
                zIndex: 1
              }}>
                {feature.title}
              </h3>
              
              <p style={{
                color: colors.textSecondary,
                lineHeight: 1.6,
                marginBottom: '1.5rem',
                position: 'relative',
                zIndex: 1
              }}>
                {feature.description}
              </p>
              
              <button
                style={{
                  background: `linear-gradient(135deg, ${feature.color}, ${colorVariations(feature.color).darker})`,
                  border: 'none',
                  color: 'white',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  zIndex: 1
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = `0 4px 15px ${colorVariations(feature.color).semiTransparent}`;
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = 'none';
                }}
              >
                Get Started
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Technology Showcase */}
      <div style={{
        textAlign: 'center',
        padding: '3rem 2rem',
        background: 'linear-gradient(135deg, rgba(118, 75, 162, 0.1) 0%, rgba(102, 126, 234, 0.1) 100%)',
        borderRadius: '20px',
        marginBottom: '3rem'
      }}>
        <h3 style={{
          fontSize: '2rem',
          fontWeight: '700',
          marginBottom: '2rem',
          background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Powered by Professional Libraries
        </h3>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '2rem',
          maxWidth: '800px',
          margin: '0 auto'
        }}>
          {[
            { name: 'D3.js', desc: 'Data Visualization', icon: '📊' },
            { name: 'Konva.js', desc: 'Canvas Graphics', icon: '🎨' },
            { name: 'SweetAlert2', desc: 'Beautiful Notifications', icon: '🔔' },
            { name: 'Polished', desc: 'CSS Utilities', icon: '✨' },
            { name: 'Sortable.js', desc: 'Drag & Drop', icon: '↕️' },
            { name: 'FullPage.js', desc: 'Smooth Navigation', icon: '🌐' }
          ].map((tech, index) => (
            <div
              key={tech.name}
              className="animate__animated animate__zoomIn"
              style={{
                animationDelay: `${index * 100}ms`,
                background: 'rgba(255,255,255,0.8)',
                borderRadius: '12px',
                padding: '1.5rem 1rem',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.3)'
              }}
            >
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{tech.icon}</div>
              <div style={{ fontSize: '1.1rem', fontWeight: '600', color: colors.text }}>{tech.name}</div>
              <div style={{ fontSize: '0.9rem', color: colors.textSecondary }}>{tech.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Start Button */}
      <div style={{ textAlign: 'center', marginTop: '3rem' }}>
        <button
          className="animate__animated animate__pulse animate__infinite"
          onClick={(e) => handleNavClick(e, 'maker')}
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            border: 'none',
            color: 'white',
            padding: '1rem 3rem',
            borderRadius: '50px',
            fontSize: '1.2rem',
            fontWeight: '700',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: '0 8px 30px rgba(102, 126, 234, 0.3)'
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'scale(1.05)';
            e.target.style.boxShadow = '0 12px 40px rgba(102, 126, 234, 0.4)';
            e.target.classList.remove('animate__pulse');
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'scale(1)';
            e.target.style.boxShadow = '0 8px 30px rgba(102, 126, 234, 0.3)';
            e.target.classList.add('animate__pulse');
          }}
        >
          Start Converting Now! 🚀
        </button>
      </div>
    </div>
  );
}
