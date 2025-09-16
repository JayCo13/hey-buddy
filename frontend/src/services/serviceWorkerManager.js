/**
 * Service Worker Manager
 * Handles background AI initialization and communication with service worker
 */

class ServiceWorkerManager {
  constructor() {
    this.isSupported = 'serviceWorker' in navigator;
    this.registration = null;
    this.aiInitialized = false;
    this.listeners = new Map();
  }

  /**
   * Register service worker
   */
  async register() {
    if (!this.isSupported) {
      console.warn('Service Worker not supported');
      return false;
    }

    try {
      this.registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered:', this.registration);
      
      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', this.handleMessage.bind(this));
      
      return true;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return false;
    }
  }

  /**
   * Handle messages from service worker
   */
  handleMessage(event) {
    const { type, status, error } = event.data;
    
    switch (type) {
      case 'AI_INITIALIZED':
        console.log('AI initialized in background:', status);
        this.aiInitialized = true;
        this.notifyListeners('aiInitialized', status);
        break;
        
      case 'AI_INITIALIZATION_FAILED':
        console.warn('AI initialization failed in background:', error);
        this.aiInitialized = false;
        this.notifyListeners('aiInitializationFailed', error);
        break;
    }
  }

  /**
   * Start background AI initialization
   */
  async startBackgroundAIInitialization() {
    if (!this.registration || !this.registration.active) {
      console.warn('Service Worker not available for AI initialization');
      return false;
    }

    try {
      // Check if AI is already initialized
      const aiStatus = await this.getAIStatus();
      if (aiStatus.initialized) {
        console.log('AI already initialized in background');
        this.aiInitialized = true;
        return true;
      }

      // Start background initialization
      this.registration.active.postMessage({
        type: 'INITIALIZE_AI'
      });
      
      console.log('Background AI initialization started');
      return true;
    } catch (error) {
      console.error('Failed to start background AI initialization:', error);
      return false;
    }
  }

  /**
   * Get AI initialization status
   */
  async getAIStatus() {
    try {
      const response = await fetch('/ai-status');
      return await response.json();
    } catch (error) {
      console.warn('Failed to get AI status:', error);
      return { initialized: false, timestamp: Date.now() };
    }
  }

  /**
   * Add event listener
   */
  addEventListener(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  /**
   * Remove event listener
   */
  removeEventListener(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * Notify listeners
   */
  notifyListeners(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in event listener:', error);
        }
      });
    }
  }

  /**
   * Check if AI is ready
   */
  isAIReady() {
    return this.aiInitialized;
  }

  /**
   * Get service worker status
   */
  getStatus() {
    return {
      isSupported: this.isSupported,
      isRegistered: !!this.registration,
      isActive: !!this.registration?.active,
      aiInitialized: this.aiInitialized
    };
  }
}

// Create singleton instance
const serviceWorkerManager = new ServiceWorkerManager();

export default serviceWorkerManager;
