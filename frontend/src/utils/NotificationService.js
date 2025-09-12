import Swal from 'sweetalert2';
import { colorVariations } from './polishedHelpers';

// Professional notification themes
const themes = {
  default: {
    background: '#ffffff',
    color: '#545454',
    confirmButtonColor: colorVariations('#1976d2').base,
    cancelButtonColor: colorVariations('#6c757d').base
  },
  dark: {
    background: '#2c3e50',
    color: '#ffffff',
    confirmButtonColor: colorVariations('#3498db').base,
    cancelButtonColor: colorVariations('#95a5a6').base
  },
  elegant: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#ffffff',
    confirmButtonColor: '#ffffff',
    cancelButtonColor: 'rgba(255,255,255,0.3)'
  },
  minimal: {
    background: '#f8f9fa',
    color: '#495057',
    confirmButtonColor: '#28a745',
    cancelButtonColor: '#dc3545'
  }
};

// Custom SweetAlert2 configuration
const createSwal = (theme = 'default') => {
  return Swal.mixin({
    ...themes[theme],
    customClass: {
      container: 'swal-container',
      popup: 'swal-popup',
      header: 'swal-header',
      title: 'swal-title',
      closeButton: 'swal-close',
      icon: 'swal-icon',
      image: 'swal-image',
      content: 'swal-content',
      input: 'swal-input',
      actions: 'swal-actions',
      confirmButton: 'swal-confirm',
      cancelButton: 'swal-cancel'
    },
    buttonsStyling: false,
    showClass: {
      popup: 'animate__animated animate__zoomIn animate__faster'
    },
    hideClass: {
      popup: 'animate__animated animate__zoomOut animate__faster'
    }
  });
};

// Notification service
export const NotificationService = {
  
  // Success notifications
  success: (title, message, options = {}) => {
    return createSwal(options.theme).fire({
      icon: 'success',
      title: title,
      text: message,
      timer: options.timer || 3000,
      timerProgressBar: true,
      showConfirmButton: options.showConfirmButton !== false,
      confirmButtonText: options.confirmButtonText || 'Great!',
      ...options
    });
  },

  // Error notifications
  error: (title, message, options = {}) => {
    return createSwal(options.theme).fire({
      icon: 'error',
      title: title,
      text: message,
      confirmButtonText: options.confirmButtonText || 'Try Again',
      confirmButtonColor: colorVariations('#dc3545').base,
      ...options
    });
  },

  // Warning notifications
  warning: (title, message, options = {}) => {
    return createSwal(options.theme).fire({
      icon: 'warning',
      title: title,
      text: message,
      showCancelButton: options.showCancelButton !== false,
      confirmButtonText: options.confirmButtonText || 'Continue',
      cancelButtonText: options.cancelButtonText || 'Cancel',
      confirmButtonColor: colorVariations('#ffc107').base,
      ...options
    });
  },

  // Info notifications
  info: (title, message, options = {}) => {
    return createSwal(options.theme).fire({
      icon: 'info',
      title: title,
      text: message,
      confirmButtonText: options.confirmButtonText || 'Got it',
      confirmButtonColor: colorVariations('#17a2b8').base,
      ...options
    });
  },

  // Question prompts
  question: (title, message, options = {}) => {
    return createSwal(options.theme).fire({
      icon: 'question',
      title: title,
      text: message,
      showCancelButton: true,
      confirmButtonText: options.confirmButtonText || 'Yes',
      cancelButtonText: options.cancelButtonText || 'No',
      confirmButtonColor: colorVariations('#28a745').base,
      cancelButtonColor: colorVariations('#6c757d').base,
      ...options
    });
  },

  // Loading notifications
  loading: (title = 'Processing...', message = 'Please wait while we process your request') => {
    return Swal.fire({
      title: title,
      text: message,
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });
  },

  // Progress notifications
  progress: (title, initialProgress = 0) => {
    let progressInterval;
    
    const swal = Swal.fire({
      title: title,
      html: `
        <div class="progress-container" style="margin: 20px 0;">
          <div class="progress-bar" style="
            width: 100%;
            height: 20px;
            background: #e9ecef;
            border-radius: 10px;
            overflow: hidden;
          ">
            <div class="progress-fill" style="
              height: 100%;
              background: linear-gradient(90deg, ${colorVariations('#28a745').base}, ${colorVariations('#28a745').lighter});
              width: ${initialProgress}%;
              transition: width 0.3s ease;
              border-radius: 10px;
            "></div>
          </div>
          <div class="progress-text" style="margin-top: 10px; font-size: 14px; color: #6c757d;">
            ${initialProgress}% Complete
          </div>
        </div>
      `,
      showConfirmButton: false,
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => {
        // Animation for progress bar
        const progressFill = document.querySelector('.progress-fill');
        const progressText = document.querySelector('.progress-text');
        
        window.updateProgress = (progress) => {
          if (progressFill && progressText) {
            progressFill.style.width = `${progress}%`;
            progressText.textContent = `${progress}% Complete`;
          }
        };
      }
    });

    return {
      updateProgress: (progress) => {
        if (window.updateProgress) {
          window.updateProgress(progress);
        }
      },
      close: () => swal.close()
    };
  },

  // Toast notifications
  toast: (message, type = 'info', options = {}) => {
    const Toast = Swal.mixin({
      toast: true,
      position: options.position || 'top-end',
      showConfirmButton: false,
      timer: options.timer || 3000,
      timerProgressBar: true,
      didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer);
        toast.addEventListener('mouseleave', Swal.resumeTimer);
      }
    });

    return Toast.fire({
      icon: type,
      title: message
    });
  },

  // Custom HTML notifications
  custom: (htmlContent, options = {}) => {
    return createSwal(options.theme).fire({
      html: htmlContent,
      showCloseButton: options.showCloseButton !== false,
      showConfirmButton: options.showConfirmButton !== false,
      confirmButtonText: options.confirmButtonText || 'OK',
      ...options
    });
  },

  // File upload progress
  uploadProgress: (fileName) => {
    return Swal.fire({
      title: 'Uploading File',
      html: `
        <div style="text-align: left; margin: 20px 0;">
          <div style="font-weight: bold; margin-bottom: 10px;">${fileName}</div>
          <div class="upload-progress" style="
            width: 100%;
            height: 6px;
            background: #e9ecef;
            border-radius: 3px;
            overflow: hidden;
            margin-bottom: 10px;
          ">
            <div class="upload-bar" style="
              height: 100%;
              background: linear-gradient(90deg, ${colorVariations('#007bff').base}, ${colorVariations('#007bff').lighter});
              width: 0%;
              transition: width 0.3s ease;
              border-radius: 3px;
            "></div>
          </div>
          <div class="upload-status" style="font-size: 12px; color: #6c757d;">
            Preparing upload...
          </div>
        </div>
      `,
      showConfirmButton: false,
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => {
        window.updateUploadProgress = (progress, status) => {
          const bar = document.querySelector('.upload-bar');
          const statusEl = document.querySelector('.upload-status');
          if (bar) bar.style.width = `${progress}%`;
          if (statusEl) statusEl.textContent = status || `${progress}% complete`;
        };
      }
    });
  },

  // Confirmation with custom actions
  confirmAction: (title, message, actionText = 'Confirm', dangerMode = false) => {
    return createSwal().fire({
      title: title,
      text: message,
      icon: dangerMode ? 'warning' : 'question',
      showCancelButton: true,
      confirmButtonText: actionText,
      cancelButtonText: 'Cancel',
      confirmButtonColor: dangerMode ? colorVariations('#dc3545').base : colorVariations('#28a745').base,
      cancelButtonColor: colorVariations('#6c757d').base,
      reverseButtons: true,
      focusCancel: dangerMode
    });
  },

  // Input prompt with validation
  inputPrompt: (title, inputType = 'text', placeholder = '', validator = null) => {
    return createSwal().fire({
      title: title,
      input: inputType,
      inputPlaceholder: placeholder,
      showCancelButton: true,
      confirmButtonText: 'Submit',
      cancelButtonText: 'Cancel',
      inputValidator: (value) => {
        if (!value) {
          return 'This field is required!';
        }
        if (validator && typeof validator === 'function') {
          return validator(value);
        }
      }
    });
  },

  // Multiple choice selection
  select: (title, options, selectedValue = '') => {
    const optionsHtml = Object.entries(options)
      .map(([value, text]) => `<option value="${value}" ${value === selectedValue ? 'selected' : ''}>${text}</option>`)
      .join('');

    return createSwal().fire({
      title: title,
      input: 'select',
      inputOptions: options,
      inputValue: selectedValue,
      showCancelButton: true,
      confirmButtonText: 'Select',
      cancelButtonText: 'Cancel'
    });
  },

  // Image preview notification
  imagePreview: (title, imageUrl, options = {}) => {
    return createSwal(options.theme).fire({
      title: title,
      imageUrl: imageUrl,
      imageAlt: options.imageAlt || 'Preview',
      imageWidth: options.imageWidth || 400,
      imageHeight: options.imageHeight || 300,
      confirmButtonText: options.confirmButtonText || 'Close',
      ...options
    });
  },

  // Conversion complete notification
  conversionComplete: (results, options = {}) => {
    const resultsHtml = results.map(result => `
      <div style="
        border: 1px solid #e9ecef;
        border-radius: 8px;
        padding: 16px;
        margin: 8px 0;
        text-align: left;
        background: #f8f9fa;
      ">
        <div style="font-weight: bold; color: #495057; margin-bottom: 8px;">
          ${result.originalName} → ${result.convertedName}
        </div>
        <div style="font-size: 12px; color: #6c757d;">
          Size: ${(result.sizeBytes / 1024).toFixed(1)} KB
          ${result.dimensions ? `• ${result.dimensions.width}×${result.dimensions.height}` : ''}
        </div>
      </div>
    `).join('');

    return createSwal(options.theme).fire({
      icon: 'success',
      title: 'Conversion Complete!',
      html: `
        <div style="margin: 20px 0;">
          <p style="margin-bottom: 16px; color: #495057;">
            Successfully converted ${results.length} file${results.length > 1 ? 's' : ''}:
          </p>
          ${resultsHtml}
        </div>
      `,
      confirmButtonText: 'Download All',
      showCancelButton: true,
      cancelButtonText: 'Close',
      confirmButtonColor: colorVariations('#28a745').base,
      ...options
    });
  }
};

// CSS styles for enhanced appearance (inject into document head)
const injectStyles = () => {
  if (document.getElementById('swal-custom-styles')) return;
  
  const styles = document.createElement('style');
  styles.id = 'swal-custom-styles';
  styles.textContent = `
    .swal-popup {
      border-radius: 16px !important;
      box-shadow: 0 20px 40px rgba(0,0,0,0.1) !important;
    }
    
    .swal-title {
      font-weight: 600 !important;
      font-size: 20px !important;
    }
    
    .swal-confirm, .swal-cancel {
      border-radius: 8px !important;
      font-weight: 500 !important;
      padding: 12px 24px !important;
      border: none !important;
      cursor: pointer !important;
      transition: all 0.3s ease !important;
    }
    
    .swal-confirm:hover {
      transform: translateY(-2px) !important;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
    }
    
    .swal-cancel:hover {
      opacity: 0.8 !important;
    }
    
    .swal-input {
      border-radius: 8px !important;
      border: 2px solid #e9ecef !important;
      padding: 12px 16px !important;
      transition: border-color 0.3s ease !important;
    }
    
    .swal-input:focus {
      border-color: #007bff !important;
      box-shadow: 0 0 0 3px rgba(0,123,255,0.1) !important;
    }
    
    @keyframes progressAnimation {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(100%); }
    }
    
    .progress-bar {
      position: relative;
      overflow: hidden;
    }
    
    .progress-bar::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      bottom: 0;
      right: 0;
      background: linear-gradient(
        to right,
        transparent,
        rgba(255,255,255,0.4),
        transparent
      );
      animation: progressAnimation 2s infinite;
    }
  `;
  document.head.appendChild(styles);
};

// Initialize styles when module is imported
if (typeof document !== 'undefined') {
  injectStyles();
}

export default NotificationService;
