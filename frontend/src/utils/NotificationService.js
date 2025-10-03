export const NotificationService = {
  success: (message) => {
    console.log('✅ Success:', message);
  },
  
  error: (message) => {
    console.error('❌ Error:', message);
  },
  
  info: (message) => {
    console.log('ℹ️ Info:', message);
  },
  
  warning: (message) => {
    console.warn('⚠️ Warning:', message);
  },

  toast: (message, type = 'info', options = {}) => {
    const emoji = type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️';
    console.log(`${emoji} ${message}`);
    
    // Create a simple toast notification
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : type === 'warning' ? '#ff9800' : '#2196F3'};
      color: white;
      padding: 15px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 14px;
      max-width: 350px;
      animation: slideIn 0.3s ease-out;
    `;
    
    toast.innerHTML = `${emoji} ${message}`;
    document.body.appendChild(toast);
    
    // Add CSS animation
    if (!document.getElementById('toast-styles')) {
      const style = document.createElement('style');
      style.id = 'toast-styles';
      style.textContent = `
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(100%); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }
    
    // Remove after timer
    setTimeout(() => {
      toast.style.animation = 'slideOut 0.3s ease-in';
      setTimeout(() => {
        if (document.body.contains(toast)) {
          document.body.removeChild(toast);
        }
      }, 300);
    }, options.timer || 3000);
  },

  progressToast: (title = 'Processing...', message = '') => {
    if (typeof document === 'undefined') {
      console.log(`⏳ ${title}${message ? ` - ${message}` : ''}`);
      return {
        update: () => {},
        close: () => {}
      };
    }

    const wrapper = document.createElement('div');
    wrapper.style.cssText = `
      position: fixed;
      top: 24px;
      right: 24px;
      background: rgba(33, 33, 33, 0.95);
      color: #fff;
      padding: 18px 22px;
      border-radius: 12px;
      box-shadow: 0 12px 24px rgba(15, 23, 42, 0.25);
      z-index: 10001;
      width: 320px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      display: flex;
      flex-direction: column;
      gap: 8px;
      animation: slideIn 0.3s ease-out;
    `;

    const titleEl = document.createElement('strong');
    titleEl.textContent = title;
    titleEl.style.fontSize = '15px';

    const messageEl = document.createElement('span');
    messageEl.textContent = message;
    messageEl.style.fontSize = '13px';
    messageEl.style.opacity = message ? '0.85' : '0.6';

    const progressBar = document.createElement('div');
    progressBar.style.cssText = `
      height: 4px;
      background: rgba(255, 255, 255, 0.15);
      border-radius: 999px;
      overflow: hidden;
    `;

    const progressFill = document.createElement('div');
    progressFill.style.cssText = `
      height: 100%;
      width: 10%;
      background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
      border-radius: inherit;
      transition: width 0.2s ease;
    `;

    progressBar.appendChild(progressFill);

    wrapper.appendChild(titleEl);
    wrapper.appendChild(messageEl);
    wrapper.appendChild(progressBar);

    document.body.appendChild(wrapper);

    let closed = false;
    const close = () => {
      if (closed) return;
      closed = true;
      wrapper.style.animation = 'slideOut 0.3s ease-in';
      setTimeout(() => {
        if (document.body.contains(wrapper)) {
          document.body.removeChild(wrapper);
        }
      }, 280);
    };

    return {
      update: ({ title: nextTitle, message: nextMessage, progress } = {}) => {
        if (closed) return;
        if (typeof nextTitle === 'string') {
          titleEl.textContent = nextTitle;
        }
        if (typeof nextMessage === 'string') {
          messageEl.textContent = nextMessage;
          messageEl.style.opacity = nextMessage ? '0.85' : '0.6';
        }
        if (typeof progress === 'number') {
          const clamped = Math.max(0, Math.min(100, progress));
          progressFill.style.width = `${clamped}%`;
        }
      },
      close
    };
  }
};
