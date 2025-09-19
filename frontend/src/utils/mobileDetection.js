/**
 * Mobile Detection Utility
 * Detects mobile devices and their capabilities for fallback implementations
 */

export const isMobileDevice = () => {
  // Check user agent
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;
  const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
  
  // Check screen size
  const isSmallScreen = window.innerWidth <= 768 || window.innerHeight <= 768;
  
  // Check touch capability
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  
  // Check for mobile-specific features
  const isMobileUA = mobileRegex.test(userAgent);
  
  return isMobileUA || (isSmallScreen && isTouchDevice);
};

export const isLowMemoryDevice = () => {
  // Check available memory (if supported)
  if ('memory' in performance) {
    const memory = performance.memory;
    const availableMemoryMB = memory.jsHeapSizeLimit / (1024 * 1024);
    return availableMemoryMB < 512; // Less than 512MB available
  }
  
  // Fallback: assume mobile devices have limited memory
  return isMobileDevice();
};

export const supportsWebAssembly = () => {
  try {
    if (typeof WebAssembly === 'object' && typeof WebAssembly.instantiate === 'function') {
      const module = new WebAssembly.Module(Uint8Array.of(0x0, 0x61, 0x73, 0x6d, 0x1, 0x0, 0x0, 0x0));
      if (module instanceof WebAssembly.Module) {
        return new WebAssembly.Instance(module) instanceof WebAssembly.Instance;
      }
    }
  } catch (e) {
    return false;
  }
  return false;
};

export const getDeviceCapabilities = () => {
  return {
    isMobile: isMobileDevice(),
    isLowMemory: isLowMemoryDevice(),
    supportsWASM: supportsWebAssembly(),
    supportsWebSpeechAPI: 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window,
    supportsMediaRecorder: typeof MediaRecorder !== 'undefined',
    supportsAudioContext: typeof AudioContext !== 'undefined' || typeof webkitAudioContext !== 'undefined'
  };
};

export const shouldUseMobileFallback = () => {
  const capabilities = getDeviceCapabilities();
  
  // Use mobile fallback if:
  // 1. Mobile device AND low memory, OR
  // 2. Mobile device AND no WASM support, OR  
  // 3. Low memory device regardless of mobile status
  return capabilities.isMobile && (capabilities.isLowMemory || !capabilities.supportsWASM) ||
         capabilities.isLowMemory;
};
