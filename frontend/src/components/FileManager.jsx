import React, { useEffect, useRef, useState } from 'react';
import Sortable from 'sortablejs';
import { colorVariations } from '../utils/polishedHelpers';
import NotificationService from '../utils/NotificationService';

const FileManager = ({ 
  files = [], 
  onFilesReorder, 
  onFileRemove,
  onFileAdd,
  acceptedTypes = ['image/*'],
  maxFiles = 10,
  multiple = true,
  showPreview = true,
  allowDuplicates = false
}) => {
  const containerRef = useRef(null);
  const sortableInstance = useRef(null);
  const fileInputRef = useRef(null);
  const [draggedOver, setDraggedOver] = useState(false);
  const [fileList, setFileList] = useState(files);

  useEffect(() => {
    if (containerRef.current) {
      // Initialize Sortable
      sortableInstance.current = new Sortable(containerRef.current, {
        animation: 300,
        ghostClass: 'sortable-ghost',
        chosenClass: 'sortable-chosen',
        dragClass: 'sortable-drag',
        handle: '.drag-handle',
        filter: '.no-drag',
        preventOnFilter: false,
        onStart: (evt) => {
          evt.item.classList.add('dragging');
        },
        onEnd: (evt) => {
          evt.item.classList.remove('dragging');
          
          // Update file order
          const newOrder = Array.from(containerRef.current.children).map((item, index) => ({
            ...fileList[parseInt(item.dataset.index)],
            order: index
          }));
          
          setFileList(newOrder);
          if (onFilesReorder) {
            onFilesReorder(newOrder);
          }
        }
      });
    }

    return () => {
      if (sortableInstance.current) {
        sortableInstance.current.destroy();
      }
    };
  }, [fileList, onFilesReorder]);

  useEffect(() => {
    setFileList(files);
  }, [files]);

  const handleDragOver = (e) => {
    e.preventDefault();
    setDraggedOver(true);
  };

  const handleDragLeave = (e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDraggedOver(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDraggedOver(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    addFiles(droppedFiles);
  };

  const handleFileInput = (e) => {
    const selectedFiles = Array.from(e.target.files);
    addFiles(selectedFiles);
    e.target.value = ''; // Reset input
  };

  const addFiles = (newFiles) => {
    let validFiles = newFiles.filter(file => {
      // Check file type
      if (acceptedTypes.length > 0) {
        const isValidType = acceptedTypes.some(type => {
          if (type.endsWith('/*')) {
            return file.type.startsWith(type.slice(0, -2));
          }
          return file.type === type;
        });
        if (!isValidType) {
          NotificationService.warning('Invalid File Type', `${file.name} is not an accepted file type.`);
          return false;
        }
      }

      // Check for duplicates
      if (!allowDuplicates) {
        const duplicate = fileList.find(f => f.name === file.name && f.size === file.size);
        if (duplicate) {
          NotificationService.info('Duplicate File', `${file.name} is already in the list.`);
          return false;
        }
      }

      return true;
    });

    // Check file count limit
    if (fileList.length + validFiles.length > maxFiles) {
      const allowedCount = maxFiles - fileList.length;
      validFiles = validFiles.slice(0, allowedCount);
      NotificationService.warning('File Limit Exceeded', `Only ${allowedCount} more files can be added (limit: ${maxFiles}).`);
    }

    if (validFiles.length === 0) return;

    const filesWithPreview = validFiles.map((file, index) => ({
      id: Date.now() + index,
      file: file,
      name: file.name,
      size: file.size,
      type: file.type,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
      order: fileList.length + index,
      progress: 0,
      status: 'ready' // 'ready', 'uploading', 'completed', 'error'
    }));

    const updatedFiles = [...fileList, ...filesWithPreview];
    setFileList(updatedFiles);
    
    if (onFileAdd) {
      onFileAdd(filesWithPreview);
    }

    NotificationService.success('Files Added', `${validFiles.length} file${validFiles.length > 1 ? 's' : ''} added successfully.`);
  };

  const removeFile = (fileId) => {
    const fileToRemove = fileList.find(f => f.id === fileId);
    
    NotificationService.confirmAction(
      'Remove File',
      `Are you sure you want to remove "${fileToRemove?.name}"?`,
      'Remove',
      true
    ).then((result) => {
      if (result.isConfirmed) {
        // Clean up object URL for images
        if (fileToRemove?.preview) {
          URL.revokeObjectURL(fileToRemove.preview);
        }
        
        const updatedFiles = fileList.filter(f => f.id !== fileId);
        setFileList(updatedFiles);
        
        if (onFileRemove) {
          onFileRemove(fileToRemove, updatedFiles);
        }
        
        NotificationService.toast('File removed', 'success');
      }
    });
  };

  const clearAllFiles = () => {
    if (fileList.length === 0) return;
    
    NotificationService.confirmAction(
      'Clear All Files',
      'Are you sure you want to remove all files?',
      'Clear All',
      true
    ).then((result) => {
      if (result.isConfirmed) {
        // Clean up all object URLs
        fileList.forEach(file => {
          if (file.preview) {
            URL.revokeObjectURL(file.preview);
          }
        });
        
        setFileList([]);
        
        if (onFileRemove) {
          onFileRemove(null, []);
        }
        
        NotificationService.success('Cleared', 'All files have been removed.');
      }
    });
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const FileItem = ({ fileData, index }) => (
    <div
      className="sortable-file-item"
      data-index={index}
      style={{
        background: 'white',
        borderRadius: '12px',
        padding: '16px',
        margin: '8px 0',
        border: '2px solid #e9ecef',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        transition: 'all 0.3s ease',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        gap: '16px'
      }}
    >
      {/* Drag Handle */}
      <div
        className="drag-handle"
        style={{
          cursor: 'move',
          padding: '8px',
          borderRadius: '6px',
          background: colorVariations('#6c757d').transparent,
          color: colorVariations('#6c757d').base,
          fontSize: '18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        title="Drag to reorder"
      >
        ⋮⋮
      </div>

      {/* File Preview */}
      {showPreview && fileData.preview && (
        <div
          className="file-preview"
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '8px',
            overflow: 'hidden',
            background: '#f8f9fa',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <img
            src={fileData.preview}
            alt={fileData.name}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          />
        </div>
      )}

      {/* File Info */}
      <div className="file-info" style={{ flex: 1, minWidth: 0 }}>
        <div
          className="file-name"
          style={{
            fontWeight: '600',
            fontSize: '14px',
            color: '#495057',
            marginBottom: '4px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
          title={fileData.name}
        >
          {fileData.name}
        </div>
        
        <div
          className="file-meta"
          style={{
            fontSize: '12px',
            color: '#6c757d',
            display: 'flex',
            gap: '12px'
          }}
        >
          <span>{formatFileSize(fileData.size)}</span>
          <span>{fileData.type}</span>
          {fileData.status && (
            <span
              className={`status-${fileData.status}`}
              style={{
                padding: '2px 8px',
                borderRadius: '4px',
                background: fileData.status === 'ready' ? colorVariations('#28a745').transparent :
                          fileData.status === 'uploading' ? colorVariations('#007bff').transparent :
                          fileData.status === 'completed' ? colorVariations('#28a745').transparent :
                          colorVariations('#dc3545').transparent,
                color: fileData.status === 'ready' ? colorVariations('#28a745').base :
                      fileData.status === 'uploading' ? colorVariations('#007bff').base :
                      fileData.status === 'completed' ? colorVariations('#28a745').base :
                      colorVariations('#dc3545').base,
                fontSize: '10px',
                fontWeight: '600',
                textTransform: 'uppercase'
              }}
            >
              {fileData.status}
            </span>
          )}
        </div>

        {/* Progress Bar */}
        {fileData.status === 'uploading' && (
          <div
            className="progress-bar"
            style={{
              width: '100%',
              height: '4px',
              background: '#e9ecef',
              borderRadius: '2px',
              marginTop: '8px',
              overflow: 'hidden'
            }}
          >
            <div
              className="progress-fill"
              style={{
                height: '100%',
                background: colorVariations('#007bff').base,
                width: `${fileData.progress}%`,
                transition: 'width 0.3s ease',
                borderRadius: '2px'
              }}
            />
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="file-actions" style={{ display: 'flex', gap: '8px' }}>
        <button
          className="action-button preview-btn no-drag"
          onClick={() => {
            if (fileData.preview) {
              NotificationService.imagePreview(fileData.name, fileData.preview);
            }
          }}
          disabled={!fileData.preview}
          style={{
            padding: '8px',
            border: 'none',
            borderRadius: '6px',
            background: fileData.preview ? colorVariations('#17a2b8').transparent : '#f8f9fa',
            color: fileData.preview ? colorVariations('#17a2b8').base : '#6c757d',
            cursor: fileData.preview ? 'pointer' : 'not-allowed',
            fontSize: '14px',
            transition: 'all 0.3s ease'
          }}
          title="Preview"
        >
          👁️
        </button>
        
        <button
          className="action-button remove-btn no-drag"
          onClick={() => removeFile(fileData.id)}
          style={{
            padding: '8px',
            border: 'none',
            borderRadius: '6px',
            background: colorVariations('#dc3545').transparent,
            color: colorVariations('#dc3545').base,
            cursor: 'pointer',
            fontSize: '14px',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = colorVariations('#dc3545').base;
            e.target.style.color = 'white';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = colorVariations('#dc3545').transparent;
            e.target.style.color = colorVariations('#dc3545').base;
          }}
          title="Remove"
        >
          🗑️
        </button>
      </div>
    </div>
  );

  return (
    <div className="sortable-file-manager" style={{ width: '100%' }}>
      {/* Drop Zone */}
      <div
        className={`drop-zone ${draggedOver ? 'drag-over' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: `3px dashed ${draggedOver ? colorVariations('#007bff').base : '#dee2e6'}`,
          borderRadius: '12px',
          padding: '40px 20px',
          textAlign: 'center',
          background: draggedOver ? colorVariations('#007bff').transparent : '#f8f9fa',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          marginBottom: '20px'
        }}
      >
        <div
          className="drop-zone-icon"
          style={{
            fontSize: '48px',
            marginBottom: '16px',
            color: draggedOver ? colorVariations('#007bff').base : '#6c757d'
          }}
        >
          📁
        </div>
        
        <div
          className="drop-zone-text"
          style={{
            fontSize: '18px',
            fontWeight: '600',
            color: draggedOver ? colorVariations('#007bff').base : '#495057',
            marginBottom: '8px'
          }}
        >
          {draggedOver ? 'Drop files here' : 'Drag & Drop Files'}
        </div>
        
        <div
          className="drop-zone-subtext"
          style={{
            fontSize: '14px',
            color: '#6c757d'
          }}
        >
          or click to browse files
        </div>
        
        {acceptedTypes.length > 0 && (
          <div
            className="accepted-types"
            style={{
              fontSize: '12px',
              color: '#6c757d',
              marginTop: '8px'
            }}
          >
            Accepted: {acceptedTypes.join(', ')}
          </div>
        )}
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple={multiple}
        accept={acceptedTypes.join(',')}
        onChange={handleFileInput}
        style={{ display: 'none' }}
      />

      {/* File List Header */}
      {fileList.length > 0 && (
        <div
          className="file-list-header"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px',
            background: 'white',
            borderRadius: '8px',
            marginBottom: '16px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}
        >
          <div style={{ fontSize: '16px', fontWeight: '600', color: '#495057' }}>
            {fileList.length} file{fileList.length !== 1 ? 's' : ''} selected
          </div>
          
          <button
            onClick={clearAllFiles}
            style={{
              padding: '8px 16px',
              border: 'none',
              borderRadius: '6px',
              background: colorVariations('#dc3545').base,
              color: 'white',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = colorVariations('#dc3545').darker;
            }}
            onMouseLeave={(e) => {
              e.target.style.background = colorVariations('#dc3545').base;
            }}
          >
            Clear All
          </button>
        </div>
      )}

      {/* Sortable File List */}
      <div
        ref={containerRef}
        className="sortable-container"
        style={{
          minHeight: fileList.length === 0 ? '0' : '100px'
        }}
      >
        {fileList.map((fileData, index) => (
          <FileItem
            key={fileData.id}
            fileData={fileData}
            index={index}
          />
        ))}
      </div>

      {/* Empty State */}
      {fileList.length === 0 && (
        <div
          className="empty-state"
          style={{
            textAlign: 'center',
            padding: '40px',
            color: '#6c757d'
          }}
        >
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📄</div>
          <div style={{ fontSize: '16px', fontWeight: '500' }}>
            No files selected
          </div>
          <div style={{ fontSize: '14px', marginTop: '8px' }}>
            Add files using the drop zone above
          </div>
        </div>
      )}

      {/* CSS Styles */}
      <style jsx>{`
        .sortable-ghost {
          opacity: 0.4;
          transform: rotate(2deg);
        }
        
        .sortable-chosen {
          background: ${colorVariations('#007bff').transparent} !important;
          border-color: ${colorVariations('#007bff').base} !important;
        }
        
        .sortable-drag {
          transform: rotate(-2deg);
          box-shadow: 0 8px 24px rgba(0,0,0,0.15) !important;
        }
        
        .dragging {
          z-index: 1000;
        }
        
        .drop-zone.drag-over {
          animation: pulseGlow 0.8s ease-in-out infinite alternate;
        }
        
        @keyframes pulseGlow {
          0% { box-shadow: 0 0 5px ${colorVariations('#007bff').semiTransparent}; }
          100% { box-shadow: 0 0 20px ${colorVariations('#007bff').semiTransparent}; }
        }
        
        .file-item:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(0,0,0,0.15) !important;
        }
        
        .action-button:hover {
          transform: scale(1.1);
        }
      `}</style>
    </div>
  );
};

// Sortable grid layout for file thumbnails
export const SortableImageGrid = ({ 
  images = [], 
  onImagesReorder,
  onImageRemove,
  columns = 4,
  showOverlay = true 
}) => {
  const containerRef = useRef(null);
  const [imageList, setImageList] = useState(images);

  useEffect(() => {
    if (containerRef.current) {
      const sortable = new Sortable(containerRef.current, {
        animation: 300,
        ghostClass: 'grid-ghost',
        chosenClass: 'grid-chosen',
        onEnd: (evt) => {
          const newOrder = Array.from(containerRef.current.children).map((item, index) => ({
            ...imageList[parseInt(item.dataset.index)],
            order: index
          }));
          
          setImageList(newOrder);
          if (onImagesReorder) {
            onImagesReorder(newOrder);
          }
        }
      });

      return () => sortable.destroy();
    }
  }, [imageList, onImagesReorder]);

  useEffect(() => {
    setImageList(images);
  }, [images]);

  return (
    <div
      ref={containerRef}
      className="sortable-grid"
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: '16px',
        padding: '16px'
      }}
    >
      {imageList.map((image, index) => (
        <div
          key={image.id}
          data-index={index}
          className="grid-item"
          style={{
            position: 'relative',
            aspectRatio: '1',
            borderRadius: '12px',
            overflow: 'hidden',
            cursor: 'move',
            background: 'white',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            transition: 'all 0.3s ease'
          }}
        >
          <img
            src={image.src || image.preview}
            alt={image.name}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          />
          
          {showOverlay && (
            <div
              className="image-overlay"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(to bottom, rgba(0,0,0,0.7), transparent, rgba(0,0,0,0.7))',
                opacity: 0,
                transition: 'opacity 0.3s ease',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '12px'
              }}
              onMouseEnter={(e) => e.target.style.opacity = '1'}
              onMouseLeave={(e) => e.target.style.opacity = '0'}
            >
              <div
                className="image-name"
                style={{
                  color: 'white',
                  fontSize: '12px',
                  fontWeight: '600',
                  textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {image.name}
              </div>
              
              <div className="image-actions" style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => onImageRemove && onImageRemove(image.id)}
                  style={{
                    background: 'rgba(220, 53, 69, 0.8)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    color: 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  🗑️
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
      
      <style jsx>{`
        .grid-ghost {
          opacity: 0.3;
          transform: scale(0.95) rotate(3deg);
        }
        
        .grid-chosen {
          transform: scale(1.05);
          box-shadow: 0 8px 24px rgba(0,0,0,0.2) !important;
          z-index: 1000;
        }
        
        .grid-item:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 20px rgba(0,0,0,0.15) !important;
        }
      `}</style>
    </div>
  );
};

export default FileManager;
