import React, { useEffect, useRef } from 'react';
import { ReactFullpage } from '@fullpage/react-fullpage';

const MainNavigation = ({ children, options = {}, onSectionChange }) => {
  const defaultOptions = {
    // Navigation
    menu: '#navigation',
    navigation: true,
    navigationPosition: 'right',
    navigationTooltips: [],
    sectionsColor: [],
    
    // Scrolling
    scrollingSpeed: 700,
    autoScrolling: true,
    fitToSection: true,
    fitToSectionDelay: 1000,
    scrollBar: false,
    easing: 'easeInOutCubic',
    easingcss3: 'ease',
    
    // Accessibility
    keyboardScrolling: true,
    animateAnchor: true,
    recordHistory: true,
    
    // Design
    verticalCentered: true,
    paddingTop: 0,
    paddingBottom: 0,
    
    // Custom callbacks
    onLeave: (origin, destination, direction) => {
      if (onSectionChange) {
        onSectionChange(origin, destination, direction);
      }
    },
    
    afterLoad: (origin, destination, direction) => {
      // Add entrance animations here
      const section = destination.item;
      section.classList.add('section-loaded');
    },
    
    afterResize: (width, height) => {
      // Handle responsive behavior
    },
    
    ...options
  };

  return (
    <ReactFullpage
      {...defaultOptions}
      render={({ state, fullpageApi }) => {
        return (
          <ReactFullpage.Wrapper>
            {children}
          </ReactFullpage.Wrapper>
        );
      }}
    />
  );
};

// Enhanced section component with animations
export const FullPageSection = ({ 
  children, 
  className = '', 
  background = 'transparent',
  animationType = 'fadeInUp',
  delay = 0 
}) => {
  return (
    <div 
      className={`section ${className}`}
      style={{
        background: background,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <div 
        className={`section-content animate__animated animate__${animationType}`}
        style={{
          animationDelay: `${delay}ms`,
          width: '100%',
          maxWidth: '1200px',
          padding: '0 20px'
        }}
      >
        {children}
      </div>
    </div>
  );
};

// Professional hero section with parallax effect
export const HeroSection = ({ 
  title, 
  subtitle, 
  backgroundImage, 
  overlay = true,
  overlayColor = 'rgba(0,0,0,0.5)',
  children
}) => {
  return (
    <FullPageSection
      className="hero-section"
      background={backgroundImage ? `url(${backgroundImage})` : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}
      animationType="zoomIn"
    >
      {overlay && (
        <div 
          className="hero-overlay"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: overlayColor,
            zIndex: 1
          }}
        />
      )}
      
      <div 
        className="hero-content"
        style={{
          textAlign: 'center',
          color: 'white',
          zIndex: 2,
          position: 'relative'
        }}
      >
        {title && (
          <h1 
            className="hero-title animate__animated animate__fadeInDown"
            style={{
              fontSize: '3.5rem',
              fontWeight: '700',
              marginBottom: '1rem',
              textShadow: '0 2px 4px rgba(0,0,0,0.3)'
            }}
          >
            {title}
          </h1>
        )}
        
        {subtitle && (
          <p 
            className="hero-subtitle animate__animated animate__fadeInUp animate__delay-1s"
            style={{
              fontSize: '1.2rem',
              fontWeight: '300',
              marginBottom: '2rem',
              opacity: 0.9
            }}
          >
            {subtitle}
          </p>
        )}
        
        <div className="hero-actions animate__animated animate__fadeInUp animate__delay-2s">
          {children}
        </div>
      </div>
    </FullPageSection>
  );
};

// Feature showcase section
export const FeatureSection = ({ 
  title, 
  features = [], 
  background = 'white',
  layout = 'grid' // 'grid', 'horizontal', 'vertical'
}) => {
  return (
    <FullPageSection
      className="feature-section"
      background={background}
      animationType="fadeInUp"
    >
      <div style={{ textAlign: 'center', width: '100%' }}>
        {title && (
          <h2 
            className="section-title animate__animated animate__fadeInDown"
            style={{
              fontSize: '2.5rem',
              fontWeight: '600',
              marginBottom: '3rem',
              color: '#333'
            }}
          >
            {title}
          </h2>
        )}
        
        <div 
          className={`features-container features-${layout}`}
          style={{
            display: layout === 'grid' ? 'grid' : 'flex',
            gridTemplateColumns: layout === 'grid' ? 'repeat(auto-fit, minmax(300px, 1fr))' : 'none',
            flexDirection: layout === 'vertical' ? 'column' : 'row',
            gap: '2rem',
            alignItems: 'center',
            justifyContent: 'center',
            flexWrap: layout === 'horizontal' ? 'wrap' : 'nowrap'
          }}
        >
          {features.map((feature, index) => (
            <div 
              key={index}
              className={`feature-card animate__animated animate__fadeInUp`}
              style={{
                animationDelay: `${index * 200}ms`,
                background: 'white',
                borderRadius: '16px',
                padding: '2rem',
                boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                textAlign: 'center',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px)';
                e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.1)';
              }}
            >
              {feature.icon && (
                <div 
                  className="feature-icon"
                  style={{
                    fontSize: '3rem',
                    marginBottom: '1rem',
                    color: feature.color || '#667eea'
                  }}
                >
                  {feature.icon}
                </div>
              )}
              
              <h3 
                style={{
                  fontSize: '1.5rem',
                  fontWeight: '600',
                  marginBottom: '1rem',
                  color: '#333'
                }}
              >
                {feature.title}
              </h3>
              
              <p 
                style={{
                  color: '#666',
                  lineHeight: '1.6',
                  margin: 0
                }}
              >
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </FullPageSection>
  );
};

// Statistics/metrics section
export const StatsSection = ({ 
  title, 
  stats = [], 
  background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
}) => {
  return (
    <FullPageSection
      className="stats-section"
      background={background}
      animationType="zoomIn"
    >
      <div style={{ textAlign: 'center', width: '100%', color: 'white' }}>
        {title && (
          <h2 
            className="section-title animate__animated animate__fadeInDown"
            style={{
              fontSize: '2.5rem',
              fontWeight: '600',
              marginBottom: '3rem',
              textShadow: '0 2px 4px rgba(0,0,0,0.3)'
            }}
          >
            {title}
          </h2>
        )}
        
        <div 
          className="stats-container"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '3rem',
            maxWidth: '800px',
            margin: '0 auto'
          }}
        >
          {stats.map((stat, index) => (
            <div 
              key={index}
              className={`stat-item animate__animated animate__fadeInUp`}
              style={{
                animationDelay: `${index * 200}ms`,
                textAlign: 'center'
              }}
            >
              <div 
                className="stat-value"
                style={{
                  fontSize: '3rem',
                  fontWeight: '700',
                  marginBottom: '0.5rem',
                  color: stat.color || 'white'
                }}
              >
                {stat.value}
              </div>
              
              <div 
                className="stat-label"
                style={{
                  fontSize: '1.1rem',
                  fontWeight: '300',
                  opacity: 0.9,
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}
              >
                {stat.label}
              </div>
              
              {stat.description && (
                <div 
                  className="stat-description"
                  style={{
                    fontSize: '0.9rem',
                    marginTop: '0.5rem',
                    opacity: 0.8
                  }}
                >
                  {stat.description}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </FullPageSection>
  );
};

// Contact/CTA section
export const CTASection = ({ 
  title, 
  subtitle, 
  buttons = [],
  background = '#f8f9fa' 
}) => {
  return (
    <FullPageSection
      className="cta-section"
      background={background}
      animationType="bounceIn"
    >
      <div style={{ textAlign: 'center', width: '100%' }}>
        {title && (
          <h2 
            className="section-title animate__animated animate__fadeInDown"
            style={{
              fontSize: '2.5rem',
              fontWeight: '600',
              marginBottom: '1rem',
              color: '#333'
            }}
          >
            {title}
          </h2>
        )}
        
        {subtitle && (
          <p 
            className="section-subtitle animate__animated animate__fadeInUp animate__delay-1s"
            style={{
              fontSize: '1.2rem',
              color: '#666',
              marginBottom: '3rem',
              maxWidth: '600px',
              margin: '0 auto 3rem'
            }}
          >
            {subtitle}
          </p>
        )}
        
        <div 
          className="cta-buttons animate__animated animate__fadeInUp animate__delay-2s"
          style={{
            display: 'flex',
            gap: '1rem',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}
        >
          {buttons.map((button, index) => (
            <button 
              key={index}
              className="cta-button"
              style={{
                padding: '1rem 2rem',
                fontSize: '1.1rem',
                fontWeight: '600',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                background: button.primary ? '#667eea' : 'transparent',
                color: button.primary ? 'white' : '#667eea',
                border: button.primary ? 'none' : '2px solid #667eea',
                textDecoration: 'none',
                display: 'inline-block'
              }}
              onClick={button.onClick}
              onMouseEnter={(e) => {
                if (button.primary) {
                  e.currentTarget.style.background = '#5a6fd8';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                } else {
                  e.currentTarget.style.background = '#667eea';
                  e.currentTarget.style.color = 'white';
                }
              }}
              onMouseLeave={(e) => {
                if (button.primary) {
                  e.currentTarget.style.background = '#667eea';
                  e.currentTarget.style.transform = 'translateY(0)';
                } else {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#667eea';
                }
              }}
            >
              {button.text}
            </button>
          ))}
        </div>
      </div>
    </FullPageSection>
  );
};

// Navigation component for FullPage
export const MainNavigation = ({ 
  sections = [], 
  activeSection = 0,
  position = 'right' // 'left', 'right', 'top', 'bottom'
}) => {
  return (
    <nav 
      id="navigation"
      className={`fullpage-navigation navigation-${position}`}
      style={{
        position: 'fixed',
        zIndex: 1000,
        ...(position === 'right' && { right: '30px', top: '50%', transform: 'translateY(-50%)' }),
        ...(position === 'left' && { left: '30px', top: '50%', transform: 'translateY(-50%)' }),
        ...(position === 'top' && { top: '30px', left: '50%', transform: 'translateX(-50%)' }),
        ...(position === 'bottom' && { bottom: '30px', left: '50%', transform: 'translateX(-50%)' })
      }}
    >
      <ul style={{ 
        listStyle: 'none', 
        padding: 0, 
        margin: 0,
        display: 'flex',
        flexDirection: position === 'top' || position === 'bottom' ? 'row' : 'column',
        gap: '12px'
      }}>
        {sections.map((section, index) => (
          <li key={index}>
            <a
              href={`#${section.anchor}`}
              className={`nav-item ${index === activeSection ? 'active' : ''}`}
              title={section.tooltip}
              style={{
                display: 'block',
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: index === activeSection ? '#667eea' : 'rgba(255,255,255,0.5)',
                border: '2px solid #667eea',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                if (index !== activeSection) {
                  e.currentTarget.style.background = 'rgba(102, 126, 234, 0.7)';
                }
              }}
              onMouseLeave={(e) => {
                if (index !== activeSection) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.5)';
                }
              }}
            />
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default MainNavigation;
