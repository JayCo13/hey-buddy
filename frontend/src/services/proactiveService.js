/**
 * Proactive Engagement Service - Makes AI initiate conversations
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8001/api/v1';

class ProactiveService {
  constructor() {
    this.checkInterval = null;
    this.defaultCheckIntervalMs = 30 * 60 * 1000; // 30 minutes
    this.onProactiveMessageCallback = null;
    this.userId = localStorage.getItem('user_id') || 'default_user';
    this.isEnabled = true;
  }

  /**
   * Start proactive engagement monitoring
   */
  startMonitoring(checkIntervalMs = this.defaultCheckIntervalMs) {
    if (this.checkInterval) {
      console.log('⚡ Proactive monitoring already running');
      return;
    }

    console.log(`⚡ Starting proactive engagement monitoring (check every ${checkIntervalMs / 60000} minutes)`);
    
    // Check immediately on start
    this.checkForProactiveMessage();

    // Then check periodically
    this.checkInterval = setInterval(() => {
      this.checkForProactiveMessage();
    }, checkIntervalMs);
  }

  /**
   * Stop proactive engagement monitoring
   */
  stopMonitoring() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      console.log('⚡ Proactive monitoring stopped');
    }
  }

  /**
   * Check if AI should send proactive message
   */
  async checkForProactiveMessage() {
    if (!this.isEnabled) {
      console.log('⚡ Proactive engagement disabled');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/proactive/check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: this.userId
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to check proactive message: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.should_send && data.message) {
        console.log('⚡ Proactive message triggered:', data.message);
        
        // Trigger callback
        if (this.onProactiveMessageCallback) {
          this.onProactiveMessageCallback(data);
        }
      } else {
        console.log('⚡ No proactive message needed:', data.reason || 'Not time yet');
      }

      return data;
    } catch (error) {
      console.error('Error checking proactive message:', error);
      return null;
    }
  }

  /**
   * Get proactive schedule
   */
  async getSchedule() {
    try {
      const response = await fetch(`${API_BASE_URL}/proactive/schedule/${this.userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get schedule: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error getting schedule:', error);
      return null;
    }
  }

  /**
   * Update proactive schedule
   */
  async updateSchedule(proactiveEnabled, preferredContactTimes = null) {
    try {
      const url = new URL(`${API_BASE_URL}/proactive/schedule/${this.userId}/update`);
      
      if (proactiveEnabled !== null) {
        url.searchParams.append('proactive_enabled', proactiveEnabled);
      }
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: preferredContactTimes ? JSON.stringify({
          preferred_contact_times: preferredContactTimes
        }) : null
      });

      if (!response.ok) {
        throw new Error(`Failed to update schedule: ${response.statusText}`);
      }

      const data = await response.json();
      this.isEnabled = proactiveEnabled;
      return data;
    } catch (error) {
      console.error('Error updating schedule:', error);
      return null;
    }
  }

  /**
   * Set callback for proactive messages
   */
  setOnProactiveMessageCallback(callback) {
    this.onProactiveMessageCallback = callback;
  }

  /**
   * Set user ID
   */
  setUserId(userId) {
    this.userId = userId;
    localStorage.setItem('user_id', userId);
  }

  /**
   * Enable/disable proactive engagement
   */
  setEnabled(enabled) {
    this.isEnabled = enabled;
    console.log(`⚡ Proactive engagement ${enabled ? 'enabled' : 'disabled'}`);
  }
}

// Create singleton instance
const proactiveService = new ProactiveService();

export default proactiveService;

