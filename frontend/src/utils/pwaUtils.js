// PWA Utilities for Hey Buddy

/**
 * Check if the app is running in standalone PWA mode
 * @returns {boolean} True if running as standalone PWA
 */
export const isStandalonePWA = () => {
  // Check if running in standalone mode
  if (window.matchMedia('(display-mode: standalone)').matches) {
    return true;
  }
  
  // Check for iOS Safari standalone mode
  if (window.navigator.standalone === true) {
    return true;
  }
  
  // Check for Android Chrome standalone mode
  if (window.matchMedia('(display-mode: fullscreen)').matches) {
    return true;
  }
  
  return false;
};

/**
 * Check if the app can be installed as PWA
 * @returns {boolean} True if PWA installation is available
 */
export const canInstallPWA = () => {
  return 'serviceWorker' in navigator && 'BeforeInstallPromptEvent' in window;
};

/**
 * Get PWA display mode
 * @returns {string} Current display mode
 */
export const getPWADisplayMode = () => {
  if (window.matchMedia('(display-mode: standalone)').matches) {
    return 'standalone';
  }
  if (window.matchMedia('(display-mode: fullscreen)').matches) {
    return 'fullscreen';
  }
  if (window.matchMedia('(display-mode: minimal-ui)').matches) {
    return 'minimal-ui';
  }
  return 'browser';
};

/**
 * Check if device supports safe area insets (notched devices)
 * @returns {boolean} True if device has safe area insets
 */
export const hasSafeAreaInsets = () => {
  const testElement = document.createElement('div');
  testElement.style.paddingTop = 'env(safe-area-inset-top)';
  document.body.appendChild(testElement);
  const hasInsets = getComputedStyle(testElement).paddingTop !== '0px';
  document.body.removeChild(testElement);
  return hasInsets;
};

/**
 * Add PWA-specific event listeners
 * @param {Function} onStandaloneChange - Callback when standalone mode changes
 */
export const addPWAEventListeners = (onStandaloneChange) => {
  // Listen for display mode changes
  const standaloneMediaQuery = window.matchMedia('(display-mode: standalone)');
  const fullscreenMediaQuery = window.matchMedia('(display-mode: fullscreen)');
  
  const handleDisplayModeChange = () => {
    const isStandalone = isStandalonePWA();
    onStandaloneChange(isStandalone);
  };
  
  standaloneMediaQuery.addEventListener('change', handleDisplayModeChange);
  fullscreenMediaQuery.addEventListener('change', handleDisplayModeChange);
  
  // Return cleanup function
  return () => {
    standaloneMediaQuery.removeEventListener('change', handleDisplayModeChange);
    fullscreenMediaQuery.removeEventListener('change', handleDisplayModeChange);
  };
};

/**
 * Force fullscreen mode for PWA
 */
export const forceFullscreenMode = () => {
  // Add CSS class to force fullscreen
  document.documentElement.classList.add('pwa-fullscreen');
  document.body.classList.add('pwa-fullscreen');
  
  // Add inline styles as backup
  const style = document.createElement('style');
  style.textContent = `
    .pwa-fullscreen {
      height: 100vh !important;
      height: 100dvh !important;
      width: 100vw !important;
      margin: 0 !important;
      padding: 0 !important;
      overflow-x: hidden !important;
    }
    
    html.pwa-fullscreen, body.pwa-fullscreen {
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      right: 0 !important;
      bottom: 0 !important;
    }
  `;
  document.head.appendChild(style);
  
  // Try to hide address bar on mobile
  if (window.screen && window.screen.orientation) {
    setTimeout(() => {
      window.scrollTo(0, 1);
    }, 100);
  }
};

/**
 * Check if browser UI is visible (debugging helper)
 */
export const checkBrowserUI = () => {
  const windowHeight = window.innerHeight;
  const screenHeight = window.screen ? window.screen.height : windowHeight;
  const availableHeight = window.screen ? window.screen.availHeight : windowHeight;
  
  const hasVisibleUI = windowHeight < availableHeight * 0.9;
  
  return {
    windowHeight,
    screenHeight,
    availableHeight,
    hasVisibleUI,
    heightRatio: windowHeight / availableHeight
  };
};

/**
 * Log PWA status for debugging
 */
export const logPWAStatus = () => {
  const uiStatus = checkBrowserUI();
  
  console.log('🔧 PWA Status:', {
    isStandalone: isStandalonePWA(),
    displayMode: getPWADisplayMode(),
    canInstall: canInstallPWA(),
    hasSafeAreas: hasSafeAreaInsets(),
    userAgent: navigator.userAgent,
    standalone: window.navigator.standalone,
    serviceWorkerSupported: 'serviceWorker' in navigator,
    browserUI: uiStatus
  });
  
  if (uiStatus.hasVisibleUI) {
    console.warn('⚠️ Browser UI appears to be visible. Height ratio:', uiStatus.heightRatio);
    console.warn('💡 Try: 1) Reinstall PWA, 2) Open from home screen, 3) Check manifest.json');
  } else {
    console.log('✅ App appears to be running fullscreen');
  }
};
