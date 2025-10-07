/**
 * User Profile Service - Manages user memory, relationship, and personality
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8001/api/v1';

class ProfileService {
  constructor() {
    this.currentProfile = null;
    this.userId = localStorage.getItem('user_id') || 'default_user';
    this.userName = localStorage.getItem('user_name') || 'Jayden';
  }

  /**
   * Get user profile
   */
  async getProfile() {
    try {
      const response = await fetch(`${API_BASE_URL}/profile/${this.userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get profile: ${response.statusText}`);
      }

      const data = await response.json();
      this.currentProfile = data.profile;
      return data.profile;
    } catch (error) {
      console.error('Error getting profile:', error);
      return null;
    }
  }

  /**
   * Create or update user profile
   */
  async createProfile(name = this.userName) {
    try {
      const response = await fetch(`${API_BASE_URL}/profile/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: this.userId,
          name: name
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to create profile: ${response.statusText}`);
      }

      const data = await response.json();
      this.currentProfile = data.profile;
      return data.profile;
    } catch (error) {
      console.error('Error creating profile:', error);
      return null;
    }
  }

  /**
   * Log user interaction (updates relationship score)
   */
  async logInteraction(interactionType = 'message') {
    try {
      const response = await fetch(`${API_BASE_URL}/profile/interaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: this.userId,
          interaction_type: interactionType
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to log interaction: ${response.statusText}`);
      }

      const data = await response.json();
      this.currentProfile = data.profile;
      return data.relationship_progress;
    } catch (error) {
      console.error('Error logging interaction:', error);
      return null;
    }
  }

  /**
   * Update user mood
   */
  async updateMood(mood, context = '') {
    try {
      const response = await fetch(`${API_BASE_URL}/profile/mood`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: this.userId,
          mood: mood,
          context: context
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to update mood: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error updating mood:', error);
      return null;
    }
  }

  /**
   * Update user status (for Reactive Mode)
   */
  async updateStatus(status, quietMinutes = null) {
    try {
      const response = await fetch(`${API_BASE_URL}/profile/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: this.userId,
          status: status,
          quiet_minutes: quietMinutes
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to update status: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error updating status:', error);
      return null;
    }
  }

  /**
   * Add memorable moment
   */
  async addMemory(moment, importance = 5) {
    try {
      const response = await fetch(`${API_BASE_URL}/profile/memory`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: this.userId,
          moment: moment,
          importance: importance
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to add memory: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error adding memory:', error);
      return null;
    }
  }

  /**
   * Update preferences
   */
  async updatePreferences(preferences) {
    try {
      const response = await fetch(`${API_BASE_URL}/profile/preferences`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: this.userId,
          preferences: preferences
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to update preferences: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error updating preferences:', error);
      return null;
    }
  }

  /**
   * Get conversation context for AI
   */
  async getContext() {
    try {
      const response = await fetch(`${API_BASE_URL}/profile/${this.userId}/context`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get context: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error getting context:', error);
      return null;
    }
  }

  /**
   * Get cached profile
   */
  getCachedProfile() {
    return this.currentProfile;
  }

  /**
   * Set user info
   */
  setUserInfo(userId, userName) {
    this.userId = userId;
    this.userName = userName;
    localStorage.setItem('user_id', userId);
    localStorage.setItem('user_name', userName);
  }

  /**
   * Get relationship level display info
   */
  getRelationshipInfo(level) {
    const levels = {
      'stranger': {
        emoji: '👋',
        color: '#gray-400',
        description: 'Just getting to know each other'
      },
      'acquaintance': {
        emoji: '😊',
        color: '#blue-400',
        description: 'We\'ve chatted a few times'
      },
      'friend': {
        emoji: '😄',
        color: '#green-400',
        description: 'We\'re friends now!'
      },
      'close_friend': {
        emoji: '💙',
        color: '#purple-400',
        description: 'We\'re close friends!'
      },
      'best_friend': {
        emoji: '💖',
        color: '#pink-400',
        description: 'Best friends forever!'
      }
    };

    return levels[level] || levels['stranger'];
  }
}

// Create singleton instance
const profileService = new ProfileService();

export default profileService;

