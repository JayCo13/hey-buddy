/**
 * ModelLoader - Utility for loading and caching AI model files
 * Handles downloading, caching, and loading of model files for offline use
 */

class ModelLoader {
  constructor() {
    this.cache = new Map();
    this.loadingPromises = new Map();
    this.modelConfigs = {
      whisper: {
        modelId: 'Xenova/whisper-tiny.en',
        useTransformers: true,
        transformersConfig: {
          dtype: 'q8',
          device: 'wasm'
        },
        size: '~39MB',
        description: 'Whisper Tiny English model via Transformers.js'
      },
      gemma: {
        modelId: 'onnx-community/gemma-3n-E2B-it-ONNX',
        useTransformers: true,
        transformersConfig: {
          dtype: {
            embed_tokens: "q8",
            audio_encoder: "q8",
            vision_encoder: "fp16",
            decoder_model_merged: "q4",
          },
          device: "wasm" // WebGPU support coming soon
        },
        size: '~5GB',
        description: 'Gemma 3n E2B Instruction-tuned model via Transformers.js'
      },
      piper: {
        modelId: 'Xenova/piper-en_US-lessac-medium',
        useTransformers: true,
        transformersConfig: {
          dtype: 'q8',
          device: 'wasm'
        },
        size: '~50MB',
        description: 'Piper TTS model via Transformers.js'
      }
    };
  }

  /**
   * Check if a model is already cached
   * @param {string} modelName - Name of the model (whisper, gemma, piper)
   * @returns {boolean} - True if model is cached
   */
  isModelCached(modelName) {
    return this.cache.has(modelName);
  }

  /**
   * Get cached model data
   * @param {string} modelName - Name of the model
   * @returns {Object|null} - Cached model data or null
   */
  getCachedModel(modelName) {
    return this.cache.get(modelName) || null;
  }

  /**
   * Download a single file with progress tracking
   * @param {string} url - URL to download from
   * @param {Function} onProgress - Progress callback function
   * @returns {Promise<ArrayBuffer>} - Downloaded file data
   */
  async downloadFile(url, onProgress = null) {
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to download ${url}: ${response.statusText}`);
      }

      const contentLength = response.headers.get('content-length');
      const total = parseInt(contentLength, 10);
      let loaded = 0;

      const reader = response.body.getReader();
      const chunks = [];

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        chunks.push(value);
        loaded += value.length;
        
        if (onProgress && total > 0) {
          onProgress({
            loaded,
            total,
            percentage: Math.round((loaded / total) * 100)
          });
        }
      }

      // Combine chunks into a single ArrayBuffer
      const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
      const result = new Uint8Array(totalLength);
      let offset = 0;
      
      for (const chunk of chunks) {
        result.set(chunk, offset);
        offset += chunk.length;
      }

      return result.buffer;
    } catch (error) {
      console.error(`Error downloading file ${url}:`, error);
      throw error;
    }
  }

  /**
   * Download all files for a model
   * @param {string} modelName - Name of the model to download
   * @param {Function} onProgress - Progress callback function
   * @returns {Promise<Object>} - Downloaded model data
   */
  async downloadModel(modelName, onProgress = null) {
    const config = this.modelConfigs[modelName];
    if (!config) {
      throw new Error(`Unknown model: ${modelName}`);
    }

    const modelData = {
      name: modelName,
      files: {},
      downloadedAt: new Date().toISOString(),
      version: '1.0.0'
    };

    const totalFiles = config.files.length;
    let completedFiles = 0;

    for (const fileName of config.files) {
      try {
        const url = `${config.baseUrl}${fileName}`;
        
        const fileProgress = (progress) => {
          if (onProgress) {
            const overallProgress = {
              model: modelName,
              file: fileName,
              fileProgress: progress,
              overallProgress: {
                completedFiles,
                totalFiles,
                percentage: Math.round((completedFiles / totalFiles) * 100)
              }
            };
            onProgress(overallProgress);
          }
        };

        const fileData = await this.downloadFile(url, fileProgress);
        modelData.files[fileName] = fileData;
        completedFiles++;

      } catch (error) {
        console.error(`Failed to download ${fileName}:`, error);
        throw new Error(`Failed to download model file ${fileName}: ${error.message}`);
      }
    }

    // Cache the downloaded model
    this.cache.set(modelName, modelData);
    
    // Store in IndexedDB for persistence
    await this.storeModelInIndexedDB(modelName, modelData);

    return modelData;
  }

  /**
   * Load a model (download if not cached or use Transformers.js)
   * @param {string} modelName - Name of the model to load
   * @param {Function} onProgress - Progress callback function
   * @returns {Promise<Object>} - Loaded model data
   */
  async loadModel(modelName, onProgress = null) {
    // Check if already loading
    if (this.loadingPromises.has(modelName)) {
      return this.loadingPromises.get(modelName);
    }

    // Check if already cached
    if (this.isModelCached(modelName)) {
      return this.getCachedModel(modelName);
    }

    const config = this.modelConfigs[modelName];
    if (!config) {
      throw new Error(`Unknown model: ${modelName}`);
    }

    // Handle Transformers.js models
    if (config.useTransformers) {
      const loadingPromise = this.loadTransformersModel(modelName, onProgress);
      this.loadingPromises.set(modelName, loadingPromise);

      try {
        const result = await loadingPromise;
        this.loadingPromises.delete(modelName);
        return result;
      } catch (error) {
        this.loadingPromises.delete(modelName);
        throw error;
      }
    }

    // Try to load from IndexedDB first for traditional models
    try {
      const cachedModel = await this.loadModelFromIndexedDB(modelName);
      if (cachedModel) {
        this.cache.set(modelName, cachedModel);
        return cachedModel;
      }
    } catch (error) {
      console.warn(`Failed to load ${modelName} from IndexedDB:`, error);
    }

    // Download the model
    const loadingPromise = this.downloadModel(modelName, onProgress);
    this.loadingPromises.set(modelName, loadingPromise);

    try {
      const result = await loadingPromise;
      this.loadingPromises.delete(modelName);
      return result;
    } catch (error) {
      this.loadingPromises.delete(modelName);
      throw error;
    }
  }

  /**
   * Load a model using Transformers.js
   * @param {string} modelName - Name of the model to load
   * @param {Function} onProgress - Progress callback function
   * @returns {Promise<Object>} - Loaded model data
   */
  async loadTransformersModel(modelName, onProgress = null) {
    const config = this.modelConfigs[modelName];
    
    try {
      // Import Transformers.js dynamically
      const { AutoProcessor, AutoModelForImageTextToText, AutoModelForSpeechSeq2Seq, AutoModelForTextToSpeech } = await import('@huggingface/transformers');
      
      if (onProgress) {
        onProgress({
          model: modelName,
          stage: 'loading_processor',
          message: 'Loading processor...'
        });
      }

      // Load processor
      const processor = await AutoProcessor.from_pretrained(config.modelId);
      
      if (onProgress) {
        onProgress({
          model: modelName,
          stage: 'loading_model',
          message: 'Loading model...'
        });
      }

      // Load model with appropriate class based on model type
      let model;
      if (modelName === 'whisper') {
        model = await AutoModelForSpeechSeq2Seq.from_pretrained(
          config.modelId, 
          config.transformersConfig
        );
      } else if (modelName === 'piper') {
        model = await AutoModelForTextToSpeech.from_pretrained(
          config.modelId, 
          config.transformersConfig
        );
      } else {
        // Gemma and other multimodal models
        model = await AutoModelForImageTextToText.from_pretrained(
          config.modelId, 
          config.transformersConfig
        );
      }

      const modelData = {
        name: modelName,
        modelId: config.modelId,
        processor,
        model,
        loadedAt: new Date().toISOString(),
        version: '1.0.0',
        useTransformers: true
      };

      // Cache the loaded model
      this.cache.set(modelName, modelData);
      
      if (onProgress) {
        onProgress({
          model: modelName,
          stage: 'complete',
          message: 'Model loaded successfully'
        });
      }

      return modelData;
    } catch (error) {
      console.error(`Failed to load Transformers.js model ${modelName}:`, error);
      throw new Error(`Failed to load Transformers.js model ${modelName}: ${error.message}`);
    }
  }

  /**
   * Store model data in IndexedDB
   * @param {string} modelName - Name of the model
   * @param {Object} modelData - Model data to store
   */
  async storeModelInIndexedDB(modelName, modelData) {
    try {
      const db = await this.getIndexedDB();
      const transaction = db.transaction(['models'], 'readwrite');
      const store = transaction.objectStore('models');
      
      await store.put({
        name: modelName,
        data: modelData,
        storedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error(`Failed to store ${modelName} in IndexedDB:`, error);
    }
  }

  /**
   * Load model data from IndexedDB
   * @param {string} modelName - Name of the model to load
   * @returns {Promise<Object|null>} - Model data or null
   */
  async loadModelFromIndexedDB(modelName) {
    try {
      const db = await this.getIndexedDB();
      const transaction = db.transaction(['models'], 'readonly');
      const store = transaction.objectStore('models');
      
      const result = await store.get(modelName);
      return result ? result.data : null;
    } catch (error) {
      console.error(`Failed to load ${modelName} from IndexedDB:`, error);
      return null;
    }
  }

  /**
   * Get or create IndexedDB database
   * @returns {Promise<IDBDatabase>} - IndexedDB database
   */
  async getIndexedDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('AIModelsCache', 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        if (!db.objectStoreNames.contains('models')) {
          const store = db.createObjectStore('models', { keyPath: 'name' });
          store.createIndex('storedAt', 'storedAt', { unique: false });
        }
      };
    });
  }

  /**
   * Clear model cache
   * @param {string} modelName - Optional specific model to clear
   */
  async clearCache(modelName = null) {
    if (modelName) {
      this.cache.delete(modelName);
      try {
        const db = await this.getIndexedDB();
        const transaction = db.transaction(['models'], 'readwrite');
        const store = transaction.objectStore('models');
        await store.delete(modelName);
      } catch (error) {
        console.error(`Failed to clear ${modelName} from IndexedDB:`, error);
      }
    } else {
      this.cache.clear();
      try {
        const db = await this.getIndexedDB();
        const transaction = db.transaction(['models'], 'readwrite');
        const store = transaction.objectStore('models');
        await store.clear();
      } catch (error) {
        console.error('Failed to clear IndexedDB:', error);
      }
    }
  }

  /**
   * Get model information
   * @param {string} modelName - Name of the model
   * @returns {Object} - Model configuration information
   */
  getModelInfo(modelName) {
    const config = this.modelConfigs[modelName];
    if (!config) {
      throw new Error(`Unknown model: ${modelName}`);
    }

    const baseInfo = {
      name: modelName,
      size: config.size,
      description: config.description,
      isCached: this.isModelCached(modelName),
      isLoading: this.loadingPromises.has(modelName)
    };

    // Add Transformers.js specific info
    if (config.useTransformers) {
      return {
        ...baseInfo,
        modelId: config.modelId,
        useTransformers: true,
        transformersConfig: config.transformersConfig
      };
    }

    // Add traditional model info
    return {
      ...baseInfo,
      files: config.files,
      baseUrl: config.baseUrl,
      useTransformers: false
    };
  }

  /**
   * Get all available models
   * @returns {Array} - List of available model configurations
   */
  getAvailableModels() {
    return Object.keys(this.modelConfigs).map(modelName => 
      this.getModelInfo(modelName)
    );
  }

  /**
   * Check if WebAssembly and WebGPU are supported
   * @returns {Object} - Support status for required technologies
   */
  checkBrowserSupport() {
    return {
      webAssembly: typeof WebAssembly !== 'undefined',
      webGPU: typeof navigator !== 'undefined' && 'gpu' in navigator,
      indexedDB: typeof indexedDB !== 'undefined',
      fetch: typeof fetch !== 'undefined',
      isSupported: typeof WebAssembly !== 'undefined' && 
                   typeof indexedDB !== 'undefined' && 
                   typeof fetch !== 'undefined'
    };
  }
}

// Create singleton instance
const modelLoader = new ModelLoader();

export default modelLoader;
