class EmotionService {
  constructor() {
    this.isInitialized = false;
    this.initializationPromise = null;
    this.apiBaseUrl = process.env.REACT_APP_API_URL || 
      (window.location.hostname === 'localhost' ? 'http://localhost:8001/api/v1' : 'https://your-backend-url.com/api/v1');
  }

  async initialize() {
    if (this.isInitialized) {
      return;
    }

    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this._initializeBackend();
    await this.initializationPromise;
    this.isInitialized = true;
  }

  async _initializeBackend() {
    try {
      console.log('Initializing emotion recognition backend...');
      
      // Initialize the backend model
      const response = await fetch(`${this.apiBaseUrl}/emotion/test/initialize-model`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`Backend initialization failed: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Emotion recognition backend initialized successfully:', result.message);
    } catch (error) {
      console.error('Failed to initialize emotion recognition backend:', error);
      throw error;
    }
  }

  async analyzeEmotion(audioBlob) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      console.log('Analyzing emotion from audio...');
      
      // Convert audio to WAV format if needed
      const wavBlob = await this.convertToWav(audioBlob);
      
      // Send audio to backend for analysis
      const formData = new FormData();
      formData.append('audio_file', wavBlob, 'audio.wav');
      
      const response = await fetch(`${this.apiBaseUrl}/emotion/test/analyze-audio`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Analysis failed');
      }

      const data = result.data || {};
      const dominantEmotion = data.dominant_emotion || data.dominantEmotion || 'neutral';
      const confidence = typeof data.confidence === 'number' ? data.confidence : 0;

      // Normalize keys for UI consumption (camelCase expected by components)
      const normalized = {
        ...data,
        dominantEmotion,
        confidence,
        emotionColor: data.emotion_color || data.emotionColor || this.getEmotionColor(dominantEmotion),
        emotionEmoji: data.emotion_emoji || data.emotionEmoji || this.getEmotionEmoji(dominantEmotion)
      };

      return normalized;
    } catch (error) {
      console.error('Error analyzing emotion:', error);
      return {
        error: error.message,
        emotions: {},
        dominantEmotion: 'neutral',
        confidence: 0,
        emotionColor: '#6b7280',
        emotionEmoji: '😐'
      };
    }
  }

  async convertToWav(audioBlob) {
    try {
      // If it's already a WAV file, return as is
      if (audioBlob.type === 'audio/wav') {
        return audioBlob;
      }

      // For other formats, we'll create a simple WAV header
      // This is a basic implementation - in production you might want to use a proper audio library
      const arrayBuffer = await audioBlob.arrayBuffer();
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      // Convert to WAV format
      const wavBuffer = this.audioBufferToWav(audioBuffer);
      return new Blob([wavBuffer], { type: 'audio/wav' });
    } catch (error) {
      console.warn('Could not convert audio to WAV, using original format:', error);
      return audioBlob;
    }
  }

  audioBufferToWav(buffer) {
    const length = buffer.length;
    const sampleRate = buffer.sampleRate;
    const numberOfChannels = buffer.numberOfChannels;
    const arrayBuffer = new ArrayBuffer(44 + length * numberOfChannels * 2);
    const view = new DataView(arrayBuffer);
    
    // WAV header
    const writeString = (offset, string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + length * numberOfChannels * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numberOfChannels * 2, true);
    view.setUint16(32, numberOfChannels * 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, length * numberOfChannels * 2, true);
    
    // Convert audio data
    let offset = 44;
    for (let i = 0; i < length; i++) {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
        view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
        offset += 2;
      }
    }
    
    return arrayBuffer;
  }

  async analyzeEmotionFromAudioData(audioData, sampleRate = 16000) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      console.log('Analyzing emotion from audio data...');
      
      // Create audio blob from data
      const audioBlob = new Blob([audioData], { type: 'audio/wav' });
      
      return await this.analyzeEmotion(audioBlob);
    } catch (error) {
      console.error('Error analyzing emotion from audio data:', error);
      return {
        error: error.message,
        emotions: {},
        dominantEmotion: 'neutral',
        confidence: 0,
        emotionColor: '#6b7280',
        emotionEmoji: '😐'
      };
    }
  }

  getEmotionColor(emotion) {
    const emotionColors = {
      'angry': '#ef4444',      // red
      'calm': '#10b981',       // emerald
      'disgust': '#8b5cf6',    // violet
      'fearful': '#f59e0b',    // amber
      'happy': '#f59e0b',      // yellow
      'neutral': '#6b7280',    // gray
      'sad': '#3b82f6',        // blue
      'surprised': '#ec4899'   // pink
    };
    return emotionColors[emotion] || '#6b7280';
  }

  getEmotionEmoji(emotion) {
    const emotionEmojis = {
      'angry': '😠',
      'calm': '😌',
      'disgust': '🤢',
      'fearful': '😨',
      'happy': '😊',
      'neutral': '😐',
      'sad': '😢',
      'surprised': '😲'
    };
    return emotionEmojis[emotion] || '😐';
  }

  getEmotionDescription(emotion) {
    const descriptions = {
      'angry': 'Feeling frustrated or irritated',
      'calm': 'Feeling peaceful and relaxed',
      'disgust': 'Feeling repulsed or revolted',
      'fearful': 'Feeling scared or anxious',
      'happy': 'Feeling joyful and positive',
      'neutral': 'Feeling balanced and composed',
      'sad': 'Feeling down or melancholic',
      'surprised': 'Feeling astonished or amazed'
    };
    return descriptions[emotion] || 'Emotional state detected';
  }

  // Real-time emotion analysis for streaming audio
  async analyzeStreamingEmotion(audioChunks) {
    try {
      if (!audioChunks || audioChunks.length === 0) {
        return {
          emotions: {},
          dominantEmotion: 'neutral',
          confidence: 0,
          emotionColor: '#6b7280',
          emotionEmoji: '😐'
        };
      }

      // Combine audio chunks with proper MIME type
      const mimeType = audioChunks[0]?.type || 'audio/webm';
      const combinedAudio = new Blob(audioChunks, { type: mimeType });
      
      return await this.analyzeEmotion(combinedAudio);
    } catch (error) {
      console.error('Error analyzing streaming emotion:', error);
      return {
        error: error.message,
        emotions: {},
        dominantEmotion: 'neutral',
        confidence: 0,
        emotionColor: '#6b7280',
        emotionEmoji: '😐'
      };
    }
  }

  // Get all available emotions with their properties
  getAllEmotions() {
    return [
      { emotion: 'angry', color: this.getEmotionColor('angry'), emoji: this.getEmotionEmoji('angry'), description: this.getEmotionDescription('angry') },
      { emotion: 'calm', color: this.getEmotionColor('calm'), emoji: this.getEmotionEmoji('calm'), description: this.getEmotionDescription('calm') },
      { emotion: 'disgust', color: this.getEmotionColor('disgust'), emoji: this.getEmotionEmoji('disgust'), description: this.getEmotionDescription('disgust') },
      { emotion: 'fearful', color: this.getEmotionColor('fearful'), emoji: this.getEmotionEmoji('fearful'), description: this.getEmotionDescription('fearful') },
      { emotion: 'happy', color: this.getEmotionColor('happy'), emoji: this.getEmotionEmoji('happy'), description: this.getEmotionDescription('happy') },
      { emotion: 'neutral', color: this.getEmotionColor('neutral'), emoji: this.getEmotionEmoji('neutral'), description: this.getEmotionDescription('neutral') },
      { emotion: 'sad', color: this.getEmotionColor('sad'), emoji: this.getEmotionEmoji('sad'), description: this.getEmotionDescription('sad') },
      { emotion: 'surprised', color: this.getEmotionColor('surprised'), emoji: this.getEmotionEmoji('surprised'), description: this.getEmotionDescription('surprised') }
    ];
  }
}

// Create singleton instance
const emotionService = new EmotionService();

export default emotionService;

