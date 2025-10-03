/**
 * Enhanced GIF Creator Component
 * Uses Framer Motion for smooth animations and provides advanced GIF creation features
 */

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { gsap } from 'gsap';
import { NotificationService } from '../utils/NotificationService.js';
import { realAPI, getApiUrl } from '../utils/apiConfig.js';

export default function EnhancedGifCreator({ onClose }) {
  const [activeTab, setActiveTab] = useState('video');
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [options, setOptions] = useState({
    startTime: 0,
    duration: 3,
    fps: 15,
    quality: 'high',
    width: '',
    height: '',
    optimization: 'medium',
    effects: []
  });

  const fileInputRef = useRef(null);
  const resultRef = useRef(null);

  const effects = [
    { id: 'grayscale', name: 'Grayscale', type: 'grayscale' },
    { id: 'reverse', name: 'Reverse', type: 'reverse' },
    { id: 'speed_2x', name: 'Speed 2x', type: 'speed', value: 2 },
    { id: 'speed_05x', name: 'Speed 0.5x', type: 'speed', value: 0.5 },
    { id: 'brightness', name: 'Brightness +0.2', type: 'brightness', value: 0.2 },
    { id: 'contrast', name: 'High Contrast', type: 'contrast', value: 1.5 }
  ];

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(selectedFiles);
    setResult(null);

    // Animate file list entrance
    if (selectedFiles.length > 0) {
      gsap.from('.file-list', {
        duration: 0.5,
        y: 20,
        opacity: 0,
        ease: 'power2.out'
      });
    }
  };

  const toggleEffect = (effect) => {
    setOptions(prev => {
      const newEffects = prev.effects.find(e => e.id === effect.id)
        ? prev.effects.filter(e => e.id !== effect.id)
        : [...prev.effects, effect];
      
      return { ...prev, effects: newEffects };
    });
  };

  const createGif = async () => {
    if (files.length === 0) {
      NotificationService.toast('Please select files first', 'warning');
      return;
    }

    setLoading(true);
    const progressNotification = NotificationService.progressToast(
      'Creating GIF...', 
      'Processing your files'
    );

    try {
      let result;
      
      if (activeTab === 'video') {
        // Prepare video options
        const videoOptions = {
          startTime: options.startTime,
          duration: options.duration,
          fps: options.fps,
          quality: options.quality,
          optimization: options.optimization
        };
        
        if (options.width) videoOptions.width = options.width;
        if (options.height) videoOptions.height = options.height;
        if (options.effects.length > 0) videoOptions.effects = options.effects;

        result = await realAPI.createGifFromVideo(files[0], videoOptions);
        setResult(result);

        progressNotification.close();
        NotificationService.success('GIF created successfully!');

        // Animate result appearance
        setTimeout(() => {
          if (resultRef.current) {
            gsap.from(resultRef.current, {
              duration: 0.8,
              scale: 0.8,
              opacity: 0,
              ease: 'back.out(1.7)'
            });
          }
        }, 100);

      } else if (activeTab === 'images') {
        // Prepare image options
        const imageOptions = {
          fps: options.fps,
          quality: options.quality,
          loop: 'true'
        };
        
        if (options.width) imageOptions.width = options.width;
        if (options.height) imageOptions.height = options.height;

        result = await realAPI.createGifFromImages(files, imageOptions);
      }

      setResult(result);
      progressNotification.close();
      NotificationService.success(activeTab === 'video' ? 'GIF created successfully!' : 'GIF created from images!');

      // Animate result appearance
      setTimeout(() => {
        if (resultRef.current) {
          gsap.from(resultRef.current, {
            duration: 0.8,
            scale: 0.8,
            opacity: 0,
            ease: 'back.out(1.7)'
          });
        }
      }, 100);

    } catch (error) {
      console.error('GIF creation error:', error);
      progressNotification.close();
      NotificationService.error('GIF Creation Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadResult = () => {
    if (result && result.result) {
      const link = document.createElement('a');
      link.href = getApiUrl(result.result.downloadUrl);
      link.download = result.result.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      NotificationService.toast('Download started!', 'success');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -50 }}
      className="enhanced-gif-creator"
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        background: 'white',
        borderRadius: '16px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
        width: '90%',
        maxWidth: '800px',
        maxHeight: '90vh',
        overflow: 'auto',
        zIndex: 1000,
        padding: '24px'
      }}
    >
      <div className="header" style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0, color: '#333', fontSize: '24px' }}>🎞️ Enhanced GIF Creator</h2>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            padding: '8px',
            borderRadius: '8px',
            transition: 'background 0.2s'
          }}
          onMouseOver={(e) => e.target.style.background = '#f5f5f5'}
          onMouseOut={(e) => e.target.style.background = 'none'}
        >
          ×
        </button>
      </div>

      {/* Tab Selection */}
      <div className="tabs" style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        {['video', 'images'].map((tab) => (
          <motion.button
            key={tab}
            onClick={() => setActiveTab(tab)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{
              padding: '12px 24px',
              border: 'none',
              borderRadius: '8px',
              background: activeTab === tab ? '#007bff' : '#f8f9fa',
              color: activeTab === tab ? 'white' : '#333',
              cursor: 'pointer',
              fontWeight: '500',
              transition: 'all 0.3s ease'
            }}
          >
            {tab === 'video' ? '🎥 Video to GIF' : '🖼️ Images to GIF'}
          </motion.button>
        ))}
      </div>

      {/* File Upload */}
      <div className="upload-section" style={{ marginBottom: '24px' }}>
        <input
          ref={fileInputRef}
          type="file"
          multiple={activeTab === 'images'}
          accept={activeTab === 'video' ? 'video/*' : 'image/*'}
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
        
        <motion.button
          onClick={() => fileInputRef.current?.click()}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          style={{
            width: '100%',
            padding: '20px',
            border: '2px dashed #007bff',
            borderRadius: '12px',
            background: '#f8f9ff',
            color: '#007bff',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: '500'
          }}
        >
          {activeTab === 'video' 
            ? '📹 Select Video File' 
            : '🖼️ Select Multiple Images'}
        </motion.button>

        {/* File List */}
        <AnimatePresence>
          {files.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="file-list"
              style={{
                marginTop: '16px',
                padding: '16px',
                background: '#f8f9fa',
                borderRadius: '8px'
              }}
            >
              <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#666' }}>
                Selected Files ({files.length})
              </h4>
              {files.map((file, index) => (
                <div key={index} style={{
                  padding: '8px',
                  background: 'white',
                  borderRadius: '6px',
                  marginBottom: '4px',
                  fontSize: '14px'
                }}>
                  {file.name}
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Options */}
      <div className="options" style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '18px', marginBottom: '16px', color: '#333' }}>⚙️ Options</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          {activeTab === 'video' && (
            <>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
                  Start Time (seconds)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={options.startTime}
                  onChange={(e) => setOptions(prev => ({ ...prev, startTime: parseFloat(e.target.value) || 0 }))}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '6px'
                  }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
                  Duration (seconds)
                </label>
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={options.duration}
                  onChange={(e) => setOptions(prev => ({ ...prev, duration: parseFloat(e.target.value) || 1 }))}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '6px'
                  }}
                />
              </div>
            </>
          )}

          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
              FPS
            </label>
            <select
              value={options.fps}
              onChange={(e) => setOptions(prev => ({ ...prev, fps: parseInt(e.target.value) }))}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '6px'
              }}
            >
              <option value={10}>10 FPS</option>
              <option value={15}>15 FPS</option>
              <option value={20}>20 FPS</option>
              <option value={25}>25 FPS</option>
              <option value={30}>30 FPS</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
              Quality
            </label>
            <select
              value={options.quality}
              onChange={(e) => setOptions(prev => ({ ...prev, quality: e.target.value }))}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '6px'
              }}
            >
              <option value="high">High Quality</option>
              <option value="medium">Medium Quality</option>
              <option value="low">Low Quality</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
              Width (optional)
            </label>
            <input
              type="number"
              placeholder="Auto"
              value={options.width}
              onChange={(e) => setOptions(prev => ({ ...prev, width: e.target.value }))}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '6px'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
              Height (optional)
            </label>
            <input
              type="number"
              placeholder="Auto"
              value={options.height}
              onChange={(e) => setOptions(prev => ({ ...prev, height: e.target.value }))}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '6px'
              }}
            />
          </div>
        </div>

        {/* Effects (Video only) */}
        {activeTab === 'video' && (
          <div style={{ marginTop: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
              ✨ Effects
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {effects.map((effect) => (
                <motion.button
                  key={effect.id}
                  onClick={() => toggleEffect(effect)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  style={{
                    padding: '6px 12px',
                    border: 'none',
                    borderRadius: '20px',
                    background: options.effects.find(e => e.id === effect.id) ? '#007bff' : '#e9ecef',
                    color: options.effects.find(e => e.id === effect.id) ? 'white' : '#333',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: '500'
                  }}
                >
                  {effect.name}
                </motion.button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Action Button */}
      <motion.button
        onClick={createGif}
        disabled={loading || files.length === 0}
        whileHover={!loading && files.length > 0 ? { scale: 1.02 } : {}}
        whileTap={!loading && files.length > 0 ? { scale: 0.98 } : {}}
        style={{
          width: '100%',
          padding: '16px',
          background: loading || files.length === 0 ? '#ccc' : '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontSize: '16px',
          fontWeight: '600',
          cursor: loading || files.length === 0 ? 'not-allowed' : 'pointer',
          marginBottom: '24px'
        }}
      >
        {loading ? '🔄 Creating GIF...' : '🚀 Create GIF'}
      </motion.button>

      {/* Result */}
      <AnimatePresence>
        {result && (
          <motion.div
            ref={resultRef}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              padding: '20px',
              background: '#f8f9fa',
              borderRadius: '12px',
              textAlign: 'center'
            }}
          >
            <h3 style={{ color: '#28a745', marginBottom: '16px' }}>✅ GIF Created Successfully!</h3>
            <p style={{ marginBottom: '16px', color: '#666' }}>
              Size: {(result.result.size / 1024).toFixed(1)} KB
            </p>
            
            <motion.button
              onClick={downloadResult}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{
                padding: '12px 24px',
                background: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              📥 Download GIF
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}