/**
 * Image Generation Service - Uses Bytez API for emotion-based images
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8001/api/v1';

class ImageService {
  constructor() {
    this.imageCache = new Map(); // Cache generated images
    this.cacheTimeout = 60 * 60 * 1000; // 1 hour cache
  }

  /**
   * Generate emotion-based image
   */
  async generateEmotionImage(emotion, context = null, style = 'photorealistic') {
    try {
      // Check cache first
      const cacheKey = `emotion_${emotion}_${style}`;
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        console.log('🎨 Using cached emotion image');
        return cached;
      }

      console.log(`🎨 Generating emotion image for: ${emotion}`);

      const response = await fetch(`${API_BASE_URL}/image/emotion`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          emotion: emotion,
          context: context,
          style: style
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to generate emotion image: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success && data.image) {
        // Cache the image
        this.addToCache(cacheKey, data.image);
        console.log('🎨 Emotion image generated successfully');
        return data.image;
      }

      return null;
    } catch (error) {
      console.error('Error generating emotion image:', error);
      return null;
    }
  }

  /**
   * Generate greeting image based on time and mood
   */
  async generateGreetingImage(timeOfDay, mood, style = 'photorealistic') {
    try {
      // Check cache first
      const cacheKey = `greeting_${timeOfDay}_${mood}_${style}`;
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        console.log('🎨 Using cached greeting image');
        return cached;
      }

      console.log(`🎨 Generating greeting image for: ${timeOfDay} / ${mood}`);

      const response = await fetch(`${API_BASE_URL}/image/greeting`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          time_of_day: timeOfDay,
          mood: mood,
          style: style
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to generate greeting image: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success && data.image) {
        // Cache the image
        this.addToCache(cacheKey, data.image);
        console.log('🎨 Greeting image generated successfully');
        return data.image;
      }

      return null;
    } catch (error) {
      console.error('Error generating greeting image:', error);
      return null;
    }
  }

  /**
   * Get available models
   */
  async getAvailableModels() {
    try {
      const response = await fetch(`${API_BASE_URL}/image/models`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get models: ${response.statusText}`);
      }

      const data = await response.json();
      return data.models || [];
    } catch (error) {
      console.error('Error getting models:', error);
      return [];
    }
  }

  /**
   * Add image to cache
   */
  addToCache(key, image) {
    this.imageCache.set(key, {
      image: image,
      timestamp: Date.now()
    });
  }

  /**
   * Get image from cache
   */
  getFromCache(key) {
    const cached = this.imageCache.get(key);
    
    if (cached) {
      const age = Date.now() - cached.timestamp;
      
      if (age < this.cacheTimeout) {
        return cached.image;
      } else {
        // Expired, remove from cache
        this.imageCache.delete(key);
      }
    }
    
    return null;
  }

  /**
   * Clear image cache
   */
  clearCache() {
    this.imageCache.clear();
    console.log('🎨 Image cache cleared');
  }

  /**
   * Preload emotion images for common emotions
   */
  async preloadCommonEmotions() {
    const commonEmotions = ['happy', 'calm', 'excited', 'neutral'];
    const style = 'photorealistic';

    console.log('🎨 Preloading common emotion images...');

    const promises = commonEmotions.map(emotion => 
      this.generateEmotionImage(emotion, null, style)
    );

    try {
      await Promise.all(promises);
      console.log('🎨 Common emotion images preloaded');
    } catch (error) {
      console.error('Error preloading emotion images:', error);
    }
  }
}

// Create singleton instance
const imageService = new ImageService();

export default imageService;

