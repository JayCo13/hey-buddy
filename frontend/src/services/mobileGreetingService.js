/**
 * Mobile Greeting Service
 * Lightweight greeting service for mobile devices
 * Uses simple templates instead of AI models
 */

class MobileGreetingService {
  constructor() {
    this.userName = 'User';
    this.isInitialized = false;
    this.greetings = this.generateGreetingTemplates();
  }

  /**
   * Generate greeting templates for different times and moods
   */
  generateGreetingTemplates() {
    const timeOfDay = this.getTimeOfDay();
    
    return {
      morning: [
        { text: `Good morning ${this.userName}! Ready to start your day?`, emoji: '🌅', mood: 'energetic' },
        { text: `Morning ${this.userName}! What's on your agenda today?`, emoji: '☀️', mood: 'cheerful' },
        { text: `Hey ${this.userName}! Let's make today productive!`, emoji: '🚀', mood: 'motivated' }
      ],
      afternoon: [
        { text: `Good afternoon ${this.userName}! How's your day going?`, emoji: '🌤️', mood: 'friendly' },
        { text: `Afternoon ${this.userName}! Need help with anything?`, emoji: '💪', mood: 'helpful' },
        { text: `Hey ${this.userName}! What can I assist you with?`, emoji: '🤝', mood: 'supportive' }
      ],
      evening: [
        { text: `Good evening ${this.userName}! How was your day?`, emoji: '🌆', mood: 'calm' },
        { text: `Evening ${this.userName}! Ready to wind down?`, emoji: '🌙', mood: 'relaxed' },
        { text: `Hey ${this.userName}! What's on your mind?`, emoji: '✨', mood: 'thoughtful' }
      ],
      night: [
        { text: `Good night ${this.userName}! Sleep well!`, emoji: '🌙', mood: 'peaceful' },
        { text: `Night ${this.userName}! Sweet dreams!`, emoji: '😴', mood: 'gentle' },
        { text: `Hey ${this.userName}! Time to rest!`, emoji: '🌌', mood: 'serene' }
      ]
    };
  }

  /**
   * Get current time of day
   */
  getTimeOfDay() {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 22) return 'evening';
    return 'night';
  }

  /**
   * Initialize the mobile greeting service
   */
  async initialize() {
    try {
      console.log('Initializing mobile greeting service...');
      
      // Set user name from localStorage or default
      const savedName = localStorage.getItem('hey-buddy-username');
      if (savedName) {
        this.userName = savedName;
      }
      
      this.isInitialized = true;
      console.log('Mobile greeting service initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize mobile greeting service:', error);
      return false;
    }
  }

  /**
   * Generate a greeting
   */
  async generateGreeting() {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const timeOfDay = this.getTimeOfDay();
    const timeGreetings = this.greetings[timeOfDay];
    
    // Select random greeting for the time of day
    const randomIndex = Math.floor(Math.random() * timeGreetings.length);
    const selectedGreeting = timeGreetings[randomIndex];
    
    // Add context and suggestions
    const greeting = {
      ...selectedGreeting,
      timeOfDay,
      context: {
        suggestions: this.getContextualSuggestions(timeOfDay),
        activities: this.getContextualActivities(timeOfDay)
      },
      timestamp: new Date().toISOString(),
      type: 'mobile_greeting'
    };
    
    console.log('Generated mobile greeting:', greeting);
    return greeting;
  }

  /**
   * Get contextual suggestions based on time of day
   */
  getContextualSuggestions(timeOfDay) {
    const suggestions = {
      morning: [
        'Check your daily tasks',
        'Review your schedule',
        'Set daily goals',
        'Start voice recording'
      ],
      afternoon: [
        'Check your progress',
        'Add new notes',
        'Review tasks',
        'Take a break'
      ],
      evening: [
        'Review your day',
        'Plan for tomorrow',
        'Relax and unwind',
        'Check your notes'
      ],
      night: [
        'Prepare for sleep',
        'Review tomorrow\'s tasks',
        'Set morning reminders',
        'Good night!'
      ]
    };
    
    return suggestions[timeOfDay] || suggestions.morning;
  }

  /**
   * Get contextual activities based on time of day
   */
  getContextualActivities(timeOfDay) {
    const activities = {
      morning: ['Planning', 'Goal setting', 'Task review', 'Voice recording'],
      afternoon: ['Progress tracking', 'Note taking', 'Task updates', 'Voice recording'],
      evening: ['Day review', 'Planning', 'Relaxation', 'Voice recording'],
      night: ['Preparation', 'Planning', 'Rest', 'Voice recording']
    };
    
    return activities[timeOfDay] || activities.morning;
  }

  /**
   * Set user name
   */
  setUserName(name) {
    this.userName = name;
    localStorage.setItem('hey-buddy-username', name);
    // Regenerate greetings with new name
    this.greetings = this.generateGreetingTemplates();
  }

  /**
   * Get service status
   */
  getServiceStatus() {
    return {
      isInitialized: this.isInitialized,
      userName: this.userName,
      timeOfDay: this.getTimeOfDay(),
      type: 'mobile_greeting_service'
    };
  }

  /**
   * Generate a quick greeting without AI
   */
  generateQuickGreeting() {
    const timeOfDay = this.getTimeOfDay();
    const quickGreetings = {
      morning: `Good morning ${this.userName}! Ready to start your day?`,
      afternoon: `Good afternoon ${this.userName}! How can I help?`,
      evening: `Good evening ${this.userName}! How was your day?`,
      night: `Good night ${this.userName}! Sleep well!`
    };
    
    return {
      text: quickGreetings[timeOfDay],
      emoji: timeOfDay === 'morning' ? '🌅' : timeOfDay === 'afternoon' ? '🌤️' : timeOfDay === 'evening' ? '🌆' : '🌙',
      mood: 'friendly',
      timeOfDay,
      timestamp: new Date().toISOString(),
      type: 'quick_greeting'
    };
  }
}

export default MobileGreetingService;
