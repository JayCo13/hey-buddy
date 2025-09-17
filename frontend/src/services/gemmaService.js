/**
 * GemmaService - Text processing service using Gemma 3n model via Transformers.js
 * Provides text summarization, question answering, and other NLP tasks
 */

class GemmaService {
  constructor() {
    this.model = null;
    this.processor = null;
    this.isInitialized = false;
    this.isLoading = false;
    this.maxTokens = 2048;
    this.temperature = 0.7;
  }

  /**
   * Initialize the Gemma model using Transformers.js
   * @param {Function} onProgress - Progress callback for model loading
   * @returns {Promise<boolean>} - True if initialization successful
   */
  async initialize(onProgress = null) {
    if (this.isInitialized) {
      return true;
    }

    if (this.isLoading) {
      // Wait for existing loading to complete
      while (this.isLoading) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return this.isInitialized;
    }

    this.isLoading = true;

    try {
      if (onProgress) {
        onProgress({ stage: 'loading_transformers', message: 'Loading Transformers.js...' });
      }

      // Import Transformers.js with error handling
      let AutoProcessor, AutoModelForImageTextToText;
      try {
        const transformers = await import('@huggingface/transformers');
        AutoProcessor = transformers.AutoProcessor;
        AutoModelForImageTextToText = transformers.AutoModelForImageTextToText;
      } catch (importError) {
        console.warn('Failed to import Transformers.js, AI features will be disabled:', importError.message);
        // Don't throw error, just mark as not initialized
        this.isInitialized = false;
        this.isLoading = false;
        return false;
      }

      if (onProgress) {
        onProgress({ stage: 'loading_processor', message: 'Loading Gemma processor...' });
      }

      // Load processor
      this.processor = await AutoProcessor.from_pretrained('onnx-community/gemma-3n-E2B-it-ONNX');

      if (onProgress) {
        onProgress({ stage: 'loading_model', message: 'Loading Gemma model...' });
      }

      // Load model
      this.model = await AutoModelForImageTextToText.from_pretrained('onnx-community/gemma-3n-E2B-it-ONNX', {
        dtype: {
          embed_tokens: "q8",
          audio_encoder: "q8",
          vision_encoder: "fp16",
          decoder_model_merged: "q4",
        },
        device: "wasm"
      });

      this.isInitialized = true;
      console.log('Gemma model initialized successfully with Transformers.js');
      
      if (onProgress) {
        onProgress({ stage: 'complete', message: 'Gemma ready!' });
      }
      
      return true;

    } catch (error) {
      console.error('Failed to initialize Gemma model:', error);
      this.isInitialized = false;
      throw error;
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Summarize text
   * @param {string} text - Text to summarize
   * @param {Object} options - Summarization options
   * @returns {Promise<string>} - Summarized text
   */
  async summarizeText(text, options = {}) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const maxLength = options.maxLength || 150;
      const prompt = `Summarize the following text in ${maxLength} words or less:\n\n${text}\n\nSummary:`;
      
      const summary = await this.generateText(prompt, {
        maxTokens: Math.min(maxLength * 2, 500),
        temperature: 0.3,
        ...options
      });

      return summary.trim();

    } catch (error) {
      console.error('Text summarization failed:', error);
      throw new Error(`Text summarization failed: ${error.message}`);
    }
  }

  /**
   * Answer questions about text
   * @param {string} text - Context text
   * @param {string} question - Question to answer
   * @param {Object} options - Answer options
   * @returns {Promise<string>} - Answer to the question
   */
  async answerQuestion(text, question, options = {}) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const prompt = `Context: ${text}\n\nQuestion: ${question}\n\nAnswer:`;
      
      const answer = await this.generateText(prompt, {
        maxTokens: options.maxTokens || 200,
        temperature: 0.1,
        ...options
      });

      return answer.trim();

    } catch (error) {
      console.error('Question answering failed:', error);
      throw new Error(`Question answering failed: ${error.message}`);
    }
  }

  /**
   * Generate text based on prompt using Transformers.js
   * @param {string} prompt - Input prompt
   * @param {Object} options - Generation options
   * @returns {Promise<string>} - Generated text
   */
  async generateText(prompt, options = {}) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const maxTokens = options.maxTokens || this.maxTokens;
      const temperature = options.temperature || this.temperature;
      
      // Prepare inputs using processor
      const inputs = await this.processor(prompt);
      
      // Generate text
      const outputs = await this.model.generate({
        ...inputs,
        max_new_tokens: maxTokens,
        temperature: temperature,
        do_sample: temperature > 0,
        pad_token_id: this.processor.tokenizer.eos_token_id
      });

      // Decode the output
      const generatedText = this.processor.tokenizer.decode(outputs[0], {
        skip_special_tokens: true
      });
      
      return generatedText.trim();

    } catch (error) {
      console.error('Text generation failed:', error);
      throw new Error(`Text generation failed: ${error.message}`);
    }
  }

  /**
   * Extract key points from text
   * @param {string} text - Text to extract key points from
   * @param {Object} options - Extraction options
   * @returns {Promise<string>} - Key points
   */
  async extractKeyPoints(text, options = {}) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const maxPoints = options.maxPoints || 5;
      const prompt = `Extract the ${maxPoints} most important key points from the following text:\n\n${text}\n\nKey Points:`;
      
      const keyPoints = await this.generateText(prompt, {
        maxTokens: maxPoints * 50,
        temperature: 0.2,
        ...options
      });

      return keyPoints.trim();

    } catch (error) {
      console.error('Key points extraction failed:', error);
      throw new Error(`Key points extraction failed: ${error.message}`);
    }
  }

  /**
   * Analyze sentiment of text
   * @param {string} text - Text to analyze
   * @param {Object} options - Analysis options
   * @returns {Promise<string>} - Sentiment analysis
   */
  async analyzeSentiment(text, options = {}) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const prompt = `Analyze the sentiment of the following text. Respond with one word: positive, negative, or neutral:\n\n${text}\n\nSentiment:`;
      
      const sentiment = await this.generateText(prompt, {
        maxTokens: 10,
        temperature: 0.1,
        ...options
      });

      return sentiment.trim().toLowerCase();

    } catch (error) {
      console.error('Sentiment analysis failed:', error);
      throw new Error(`Sentiment analysis failed: ${error.message}`);
    }
  }

  /**
   * Translate text to another language
   * @param {string} text - Text to translate
   * @param {string} targetLanguage - Target language
   * @param {Object} options - Translation options
   * @returns {Promise<string>} - Translated text
   */
  async translateText(text, targetLanguage, options = {}) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const prompt = `Translate the following text to ${targetLanguage}:\n\n${text}\n\nTranslation:`;
      
      const translation = await this.generateText(prompt, {
        maxTokens: text.length * 2,
        temperature: 0.3,
        ...options
      });

      return translation.trim();

    } catch (error) {
      console.error('Text translation failed:', error);
      throw new Error(`Text translation failed: ${error.message}`);
    }
  }

  /**
   * Generate creative content
   * @param {string} prompt - Creative prompt
   * @param {Object} options - Generation options
   * @returns {Promise<string>} - Generated creative content
   */
  async generateCreativeContent(prompt, options = {}) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const creativePrompt = `Create creative content based on this prompt: ${prompt}\n\nContent:`;
      
      const content = await this.generateText(creativePrompt, {
        maxTokens: options.maxTokens || 500,
        temperature: options.temperature || 0.8,
        ...options
      });

      return content.trim();

    } catch (error) {
      console.error('Creative content generation failed:', error);
      throw new Error(`Creative content generation failed: ${error.message}`);
    }
  }

  /**
   * Check if the service is ready
   * @returns {boolean} - True if initialized and ready
   */
  isReady() {
    return this.isInitialized && this.model && this.processor;
  }

  /**
   * Get service status
   * @returns {Object} - Service status information
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      isLoading: this.isLoading,
      isReady: this.isReady(),
      maxTokens: this.maxTokens,
      temperature: this.temperature
    };
  }

  /**
   * Set generation parameters
   * @param {Object} params - Parameters to set
   */
  setParameters(params) {
    if (params.maxTokens !== undefined) {
      this.maxTokens = params.maxTokens;
    }
    if (params.temperature !== undefined) {
      this.temperature = params.temperature;
    }
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    this.model = null;
    this.processor = null;
    this.isInitialized = false;
    this.isLoading = false;
  }
}

// Create singleton instance
const gemmaService = new GemmaService();

export default gemmaService;