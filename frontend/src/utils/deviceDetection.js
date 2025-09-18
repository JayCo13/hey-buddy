/**
 * Device Detection Utility
 * Detects device capabilities and provides optimized settings
 */

class DeviceDetection {
  constructor() {
    this.isMobile = this.detectMobile();
    this.isLowMemory = this.detectLowMemory();
    this.isSlowConnection = this.detectSlowConnection();
    this.deviceCapabilities = this.assessCapabilities();
  }

  /**
   * Detect if device is mobile
   */
  detectMobile() {
    const userAgent = navigator.userAgent.toLowerCase();
    const mobileKeywords = ['android', 'iphone', 'ipad', 'ipod', 'blackberry', 'windows phone'];
    
    // Check user agent
    const isMobileUA = mobileKeywords.some(keyword => userAgent.includes(keyword));
    
    // Check screen size
    const isMobileScreen = window.innerWidth <= 768;
    
    // Check touch capability
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    return isMobileUA || (isMobileScreen && isTouchDevice);
  }

  /**
   * Detect if device has low memory
   */
  detectLowMemory() {
    // Check if device memory API is available
    if ('deviceMemory' in navigator) {
      return navigator.deviceMemory <= 2; // Less than 2GB (more permissive)
    }
    
    // Fallback: don't assume mobile devices have low memory
    // Modern mobile devices can handle Whisper
    return false;
  }

  /**
   * Detect if connection is slow
   */
  detectSlowConnection() {
    if ('connection' in navigator) {
      const connection = navigator.connection;
      return connection.effectiveType === 'slow-2g' || 
             connection.effectiveType === '2g' || 
             connection.effectiveType === '3g';
    }
    return false;
  }

  /**
   * Assess device capabilities for AI model loading
   */
  assessCapabilities() {
    const capabilities = {
      canLoadAIModels: true,
      recommendedModelSize: 'tiny',
      maxMemoryUsage: 'low',
      fallbackMode: false
    };

    // Only disable AI models for very constrained devices
    // Allow Whisper on most modern devices
    
    // Very old devices with very small screens
    if (this.isMobile && window.innerWidth < 320) {
      capabilities.canLoadAIModels = false;
      capabilities.fallbackMode = true;
      capabilities.maxMemoryUsage = 'minimal';
    }
    
    // Very slow connections (2G only)
    if (this.isSlowConnection && navigator.connection?.effectiveType === '2g') {
      capabilities.canLoadAIModels = false;
      capabilities.fallbackMode = true;
    }
    
    // Extremely low memory devices (less than 2GB)
    if ('deviceMemory' in navigator && navigator.deviceMemory <= 2) {
      capabilities.canLoadAIModels = false;
      capabilities.fallbackMode = true;
      capabilities.maxMemoryUsage = 'minimal';
    }

    return capabilities;
  }

  /**
   * Get optimized settings for the device
   */
  getOptimizedSettings() {
    return {
      useAIModels: this.deviceCapabilities.canLoadAIModels,
      fallbackMode: this.deviceCapabilities.fallbackMode,
      modelSize: this.deviceCapabilities.recommendedModelSize,
      memoryLimit: this.deviceCapabilities.maxMemoryUsage,
      audioQuality: this.isMobile ? 'low' : 'high',
      sampleRate: this.isMobile ? 8000 : 16000,
      enableWakeWordDetection: !this.deviceCapabilities.fallbackMode
    };
  }

  /**
   * Check if WebAssembly is supported
   */
  isWebAssemblySupported() {
    try {
      return typeof WebAssembly === 'object' && 
             typeof WebAssembly.instantiate === 'function';
    } catch (e) {
      return false;
    }
  }

  /**
   * Get memory usage estimate
   */
  getMemoryEstimate() {
    if ('memory' in performance) {
      return {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
        limit: performance.memory.jsHeapSizeLimit
      };
    }
    return null;
  }

  /**
   * Check if device can handle AI model loading
   */
  canHandleAIModels() {
    // Check WebAssembly support
    if (!this.isWebAssemblySupported()) {
      console.log('WebAssembly not supported');
      return false;
    }

    // Check memory (more permissive)
    const memory = this.getMemoryEstimate();
    if (memory && memory.limit < 50 * 1024 * 1024) { // Less than 50MB (more permissive)
      console.log('Memory too low:', memory.limit / 1024 / 1024, 'MB');
      return false;
    }

    // Check device capabilities
    const canLoad = this.deviceCapabilities.canLoadAIModels;
    console.log('Device can load AI models:', canLoad);
    return canLoad;
  }
}

// Create singleton instance
const deviceDetection = new DeviceDetection();

export default deviceDetection;
