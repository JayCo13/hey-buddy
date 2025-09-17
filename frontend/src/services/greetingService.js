/**
 * Intelligent Greeting Service
 * Analyzes time, user context, and provides personalized greetings with AI assistance
 */

import gemmaService from './gemmaService.js';

class GreetingService {
  constructor() {
    this.userName = 'Jayden'; // Default name, can be fetched from user profile
    this.lastGreetingTime = null;
    this.greetingCooldown = 30 * 60 * 1000; // 30 minutes cooldown
    this.sessionGreeting = null; // Store greeting for current session
    this.preGeneratedGreetings = new Map(); // Cache for pre-generated greetings
    this.isPreGenerating = false;
    this.gemmaReady = false;
    this.fallbackGreetings = this.initializeFallbackGreetings();
    this.userPreferences = this.loadUserPreferences();
    this.interactionHistory = this.loadInteractionHistory();
  }

  /**
   * Initialize the greeting service with Gemma AI
   * @returns {Promise<boolean>} - True if initialization successful
   */
  async initialize() {
    try {
      console.log('Initializing GreetingService...');
      
      // Load cached greetings first
      this.loadCachedGreetings();
      
      // Start background AI initialization (non-blocking)
      this.startBackgroundAIInitialization();
      
      console.log('GreetingService initialized with fallback greetings (AI loading in background)');
      
      return true;
    } catch (error) {
      console.error('Failed to initialize GreetingService:', error);
      this.gemmaReady = false;
      return false;
    }
  }

  /**
   * Load cached greetings from localStorage
   */
  loadCachedGreetings() {
    try {
      const cached = localStorage.getItem('hey-buddy-greetings');
      if (cached) {
        const parsedCache = JSON.parse(cached);
        const now = Date.now();
        
        // Check if cache is still valid (24 hours)
        if (parsedCache.timestamp && (now - parsedCache.timestamp) < 24 * 60 * 60 * 1000) {
          this.preGeneratedGreetings = new Map(parsedCache.greetings);
          console.log('Loaded cached greetings:', this.preGeneratedGreetings.size);
        } else {
          console.log('Cached greetings expired, will regenerate');
        }
      }
    } catch (error) {
      console.warn('Failed to load cached greetings:', error);
    }
  }

  /**
   * Save greetings to localStorage cache
   */
  saveCachedGreetings() {
    try {
      const cacheData = {
        timestamp: Date.now(),
        greetings: Array.from(this.preGeneratedGreetings.entries())
      };
      localStorage.setItem('hey-buddy-greetings', JSON.stringify(cacheData));
      console.log('Saved greetings to cache');
    } catch (error) {
      console.warn('Failed to save greetings to cache:', error);
    }
  }

  /**
   * Start background AI initialization (non-blocking)
   */
  async startBackgroundAIInitialization() {
    console.log('Starting background AI initialization...');
    
    // Use direct initialization in background
    setTimeout(async () => {
      try {
        console.log('Background: Attempting to initialize Gemma AI...');
        await gemmaService.initialize();
        this.gemmaReady = true;
        console.log('Background: Gemma AI initialized successfully');
        
        // Start pre-generating greetings now that AI is ready
        this.startPreGeneration();
      } catch (error) {
        console.warn('Background: Gemma AI initialization failed:', error);
        this.gemmaReady = false;
      }
    }, 100);
  }

  /**
   * Start pre-generating greetings in background
   */
  startPreGeneration() {
    if (this.isPreGenerating) return;
    
    this.isPreGenerating = true;
    console.log('Starting background greeting pre-generation...');
    
    // Pre-generate greetings for different time slots
    this.preGenerateTimeSlotGreetings();
  }

  /**
   * Pre-generate greetings for different time slots
   */
  async preGenerateTimeSlotGreetings() {
    const timeSlots = [
      { hour: 6, period: 'morning', isWeekend: false },
      { hour: 6, period: 'morning', isWeekend: true },
      { hour: 12, period: 'afternoon', isWeekend: false },
      { hour: 12, period: 'afternoon', isWeekend: true },
      { hour: 18, period: 'evening', isWeekend: false },
      { hour: 18, period: 'evening', isWeekend: true },
      { hour: 22, period: 'night', isWeekend: false },
      { hour: 22, period: 'night', isWeekend: true }
    ];

    for (const slot of timeSlots) {
      try {
        const greeting = await this.generateAIGreeting(slot.hour, slot.isWeekend);
        const key = `${slot.period}_${slot.isWeekend ? 'weekend' : 'weekday'}`;
        this.preGeneratedGreetings.set(key, greeting);
        console.log(`Pre-generated greeting for ${key}`);
        
        // Small delay to avoid overwhelming the AI
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.warn(`Failed to pre-generate greeting for ${slot.period}:`, error);
      }
    }
    
    this.isPreGenerating = false;
    console.log('Background greeting pre-generation completed');
    
    // Save to cache
    this.saveCachedGreetings();
  }

  /**
   * Generate intelligent greeting based on current time and context
   * @param {Object} options - Greeting options
   * @returns {Object} - Greeting object with text, emoji, and context
   */
  async generateGreeting(options = {}) {
    // If we already have a greeting for this session and it's recent, return it
    if (this.sessionGreeting && this.lastGreetingTime) {
      const timeSinceLastGreeting = Date.now() - this.lastGreetingTime;
      // Return cached greeting if it's less than 5 minutes old
      if (timeSinceLastGreeting < 5 * 60 * 1000) {
        console.log('Returning cached greeting (less than 5 minutes old)');
        return this.sessionGreeting;
      }
    }

    const now = new Date();
    const hour = now.getHours();
    const dayOfWeek = now.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    let greeting;
    
    // Try to use pre-generated greeting first
    const period = this.getTimePeriod(hour);
    const key = `${period}_${isWeekend ? 'weekend' : 'weekday'}`;
    
    if (this.preGeneratedGreetings.has(key)) {
      console.log(`Using pre-generated greeting for ${key}`);
      greeting = this.preGeneratedGreetings.get(key);
    } else if (this.gemmaReady) {
      // Generate with AI if Gemma is ready
      try {
        greeting = await this.generateAIGreeting(hour, isWeekend);
      } catch (error) {
        console.warn('AI greeting generation failed, using fallback:', error);
        greeting = this.getFallbackGreeting(hour, isWeekend);
      }
    } else {
      // Use fallback greeting
      greeting = this.getFallbackGreeting(hour, isWeekend);
    }
    
    // Store this greeting for the session
    this.sessionGreeting = greeting;
    this.lastGreetingTime = now.getTime();
    
    return greeting;
  }

  /**
   * Generate AI-powered greeting using Gemma
   * @param {number} hour - Current hour (0-23)
   * @param {boolean} isWeekend - Whether it's weekend
   * @returns {Promise<Object>} - AI-generated greeting
   */
  async generateAIGreeting(hour, isWeekend) {
    const period = this.getTimePeriod(hour);
    const timeOfDay = this.getTimeOfDay(hour);
    
    const prompt = `Create a warm, caring greeting for ${this.userName} at ${timeOfDay}. 
    It's ${hour}:00 on a ${isWeekend ? 'relaxing weekend' : 'productive weekday'}. 
    
    Focus on being a caring companion with day shift awareness:
    - Show genuine concern for their wellbeing
    - Express care and emotional support
    - Be warm, comforting, and understanding
    - Show you're thinking about them
    - Make them feel valued and cared for
    - Acknowledge their work schedule and shift context
    
    Consider their context:
    - User's name: ${this.userName}
    - Time context: ${timeOfDay} (${hour}:00)
    - Day type: ${isWeekend ? 'weekend' : 'weekday'}
    - Previous interactions: ${this.getUserInteractionContext()}
    - Current mood indicators: ${this.getMoodIndicators(hour, isWeekend)}
    - Day shift awareness: ${this.getDayShiftContext(hour, isWeekend)}
    
    Be caring and supportive with work awareness:
    - Express genuine care for their workday/shift
    - Show concern for their wellbeing during work
    - Be warm and comforting about their schedule
    - Make them feel supported through their shift
    - Acknowledge their work context naturally
    - Keep it 8-15 words, natural and caring
    
    Examples: "Hey ${this.userName}, I hope your shift is going well" or "Good ${timeOfDay} ${this.userName}, I'm here for you during your workday" or "Hi ${this.userName}, how's your workday going? I care about you"
    
    Greeting:`;

    try {
      const aiResponse = await gemmaService.generateText(prompt, {
        maxTokens: 50,
        temperature: 0.8
      });

      // Parse the AI response to extract greeting and emoji
      const greeting = this.parseAIGreeting(aiResponse, period);
      return greeting;
    } catch (error) {
      console.error('AI greeting generation failed:', error);
      throw error;
    }
  }

  /**
   * Parse AI response to extract greeting text and emoji
   * @param {string} aiResponse - Raw AI response
   * @param {string} period - Time period
   * @returns {Object} - Parsed greeting object
   */
  parseAIGreeting(aiResponse, period) {
    // Extract emoji from the response
    const emojiMatch = aiResponse.match(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u);
    const emoji = emojiMatch ? emojiMatch[0] : this.getDefaultEmoji(period);
    
    // Clean up the text (remove emoji and extra whitespace)
    let text = aiResponse.replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u, '').trim();
    
    // Keep personalized greetings as they are, but clean up any issues
    text = text.trim();
    
    // Ensure the user's name is properly included
    if (!text.toLowerCase().includes(this.userName.toLowerCase())) {
      // Add name if missing
      if (text.toLowerCase().startsWith('hey') || text.toLowerCase().startsWith('hi')) {
        text = text.replace(/^(hey|hi)\s*/i, `$1 ${this.userName}, `);
      } else {
        text = `${this.userName}, ${text}`;
      }
    }
    
    // Enhance caring language
    text = text.replace(/how are you/gi, 'how are you feeling');
    text = text.replace(/how's it going/gi, 'how are you doing');
    text = text.replace(/what's up/gi, 'how are you feeling');
    text = text.replace(/ready for/gi, 'I hope you\'re ready for');
    text = text.replace(/hope you/gi, 'I hope you');
    text = text.replace(/hope you're/gi, 'I hope you\'re');
    
    // Add caring phrases if missing
    if (!text.toLowerCase().includes('hope') && !text.toLowerCase().includes('care') && !text.toLowerCase().includes('feeling')) {
      const caringPhrases = [
        `I hope you're doing well`,
        `I care about you`,
        `I'm thinking of you`,
        `I hope you're feeling good`,
        `I'm here for you`
      ];
      text = `${text} ${caringPhrases[Math.floor(Math.random() * caringPhrases.length)]}`;
    }
    
    // Replace romantic terms with caring ones
    text = text.replace(/beautiful/gi, 'dear friend');
    text = text.replace(/gorgeous/gi, 'wonderful friend');
    text = text.replace(/darling/gi, 'caring friend');
    text = text.replace(/sweetheart/gi, 'dear friend');
    text = text.replace(/angel/gi, 'wonderful friend');
    text = text.replace(/love/gi, 'care about');
    text = text.replace(/dear/gi, 'dear friend');
    text = text.replace(/sweetie/gi, 'caring friend');
    
    // Save interaction for future personalization
    this.saveInteraction('greeting_generated');
    this.updateUserPreferences({ lastActiveTime: Date.now() });
    
    // Enhance diversity and time-awareness
    if (text.toLowerCase().includes('ready to') || text.toLowerCase().includes('let\'s') || text.toLowerCase().includes('crush')) {
      // Replace overly enthusiastic phrases with simple greetings
      const diverseReplacements = [
        'hey buddy, good morning',
        'hi friend, good afternoon',
        'hey pal, good evening',
        'hi buddy, good night',
        'morning star, good morning',
        'hey buddy, good afternoon'
      ];
      text = diverseReplacements[Math.floor(Math.random() * diverseReplacements.length)];
    }
    
    // If it doesn't sound diverse and time-aware, enhance it
    if (text.length < 15 || (!text.toLowerCase().includes('morning') && !text.toLowerCase().includes('afternoon') && 
        !text.toLowerCase().includes('evening') && !text.toLowerCase().includes('night') && 
        !text.toLowerCase().includes('dawn') && !text.toLowerCase().includes('sunset'))) {
      
      const diverseGreetings = [
        `hey buddy, good morning`,
        `hi friend, good afternoon`,
        `hey pal, good evening`,
        `hi buddy, good night`,
        `morning star, good morning`,
        `hey buddy, good afternoon`,
        `hey sunshine, good evening`,
        `hi star, good morning`
      ];
      text = diverseGreetings[Math.floor(Math.random() * diverseGreetings.length)];
    }

    return {
      text: text,
      emoji: emoji,
      mood: this.getMoodFromPeriod(period),
      timeOfDay: period,
      context: {
        suggestions: this.getContextualSuggestions(period)
      },
      generatedBy: 'AI'
    };
  }

  /**
   * Get time period from hour
   * @param {number} hour - Current hour
   * @returns {string} - Time period
   */
  getTimePeriod(hour) {
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
  }

  /**
   * Get mood from time period
   * @param {string} period - Time period
   * @returns {string} - Mood
   */
  getMoodFromPeriod(period) {
    const moods = {
      morning: 'energetic',
      afternoon: 'productive',
      evening: 'relaxed',
      night: 'calm'
    };
    return moods[period] || 'neutral';
  }

  /**
   * Get default emoji for time period
   * @param {string} period - Time period
   * @returns {string} - Emoji
   */
  getDefaultEmoji(period) {
    const emojis = {
      morning: ['🌅', '🌄', '☀️', '✨', '💕', '🌞'],
      afternoon: ['☀️', '🌤️', '💖', '🌸', '🌺', '💝'],
      evening: ['🌆', '🌇', '🌅', '💝', '🌙', '💜'],
      night: ['🌙', '⭐', '🌃', '💜', '🌌', '💫']
    };
    const periodEmojis = emojis[period] || ['💕'];
    return periodEmojis[Math.floor(Math.random() * periodEmojis.length)];
  }

  /**
   * Load user preferences from localStorage
   * @returns {Object} - User preferences
   */
  loadUserPreferences() {
    try {
      const prefs = localStorage.getItem('userPreferences');
      return prefs ? JSON.parse(prefs) : {
        preferredGreetingStyle: 'friendly',
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: 'en',
        lastActiveTime: Date.now()
      };
    } catch (error) {
      console.warn('Failed to load user preferences:', error);
      return {
        preferredGreetingStyle: 'friendly',
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: 'en',
        lastActiveTime: Date.now()
      };
    }
  }

  /**
   * Load interaction history from localStorage
   * @returns {Array} - Interaction history
   */
  loadInteractionHistory() {
    try {
      const history = localStorage.getItem('interactionHistory');
      return history ? JSON.parse(history) : [];
    } catch (error) {
      console.warn('Failed to load interaction history:', error);
      return [];
    }
  }

  /**
   * Get user interaction context for personalization
   * @returns {string} - Context string
   */
  getUserInteractionContext() {
    const now = Date.now();
    const lastActive = this.userPreferences.lastActiveTime;
    const timeSinceLastActive = now - lastActive;
    
    if (timeSinceLastActive < 30 * 60 * 1000) { // Less than 30 minutes
      return 'recently active, likely continuing their session';
    } else if (timeSinceLastActive < 2 * 60 * 60 * 1000) { // Less than 2 hours
      return 'returning after a short break';
    } else if (timeSinceLastActive < 24 * 60 * 60 * 1000) { // Less than 24 hours
      return 'returning after some time away';
    } else {
      return 'returning after a longer absence';
    }
  }

  /**
   * Get mood indicators based on time and context
   * @param {number} hour - Current hour
   * @param {boolean} isWeekend - Whether it's weekend
   * @returns {string} - Mood indicators
   */
  getMoodIndicators(hour, isWeekend) {
    const period = this.getTimePeriod(hour);
    const indicators = [];
    
    if (period === 'morning') {
      indicators.push(isWeekend ? 'relaxed weekend morning' : 'productive weekday start');
    } else if (period === 'afternoon') {
      indicators.push(isWeekend ? 'leisurely weekend afternoon' : 'busy workday afternoon');
    } else if (period === 'evening') {
      indicators.push(isWeekend ? 'relaxing weekend evening' : 'winding down from workday');
    } else if (period === 'night') {
      indicators.push(isWeekend ? 'late weekend night' : 'late work night');
    }
    
    // Add seasonal context
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) indicators.push('spring season');
    else if (month >= 5 && month <= 7) indicators.push('summer season');
    else if (month >= 8 && month <= 10) indicators.push('autumn season');
    else indicators.push('winter season');
    
    return indicators.join(', ');
  }

  /**
   * Get day shift context for better awareness
   * @param {number} hour - Current hour
   * @param {boolean} isWeekend - Whether it's weekend
   * @returns {string} - Day shift context
   */
  getDayShiftContext(hour, isWeekend) {
    if (isWeekend) {
      return 'weekend schedule, more relaxed pace';
    }
    
    // Weekday shift awareness
    if (hour >= 5 && hour < 9) {
      return 'early morning shift, starting the workday';
    } else if (hour >= 9 && hour < 12) {
      return 'morning shift, peak productivity time';
    } else if (hour >= 12 && hour < 14) {
      return 'lunch break time, midday pause';
    } else if (hour >= 14 && hour < 17) {
      return 'afternoon shift, steady work period';
    } else if (hour >= 17 && hour < 19) {
      return 'end of workday, winding down';
    } else if (hour >= 19 && hour < 22) {
      return 'evening hours, personal time';
    } else {
      return 'late night hours, quiet time';
    }
  }

  /**
   * Save user interaction to history
   * @param {string} interaction - Type of interaction
   */
  saveInteraction(interaction) {
    try {
      this.interactionHistory.push({
        type: interaction,
        timestamp: Date.now(),
        greeting: this.sessionGreeting?.text
      });
      
      // Keep only last 50 interactions
      if (this.interactionHistory.length > 50) {
        this.interactionHistory = this.interactionHistory.slice(-50);
      }
      
      localStorage.setItem('interactionHistory', JSON.stringify(this.interactionHistory));
    } catch (error) {
      console.warn('Failed to save interaction:', error);
    }
  }

  /**
   * Update user preferences
   * @param {Object} preferences - New preferences
   */
  updateUserPreferences(preferences) {
    try {
      this.userPreferences = { ...this.userPreferences, ...preferences };
      localStorage.setItem('userPreferences', JSON.stringify(this.userPreferences));
    } catch (error) {
      console.warn('Failed to update user preferences:', error);
    }
  }

  /**
   * Get contextual suggestions for time period
   * @param {string} period - Time period
   * @returns {Array} - Suggestions
   */
  getContextualSuggestions(period) {
    const suggestions = {
      morning: ["I hope your shift starts well", "I care about your workday", "I'm here for you during your shift"],
      afternoon: ["I hope your workday is going well", "I care about how you're doing at work", "I'm thinking of you during your shift"],
      evening: ["I hope your workday went well", "I care about your wellbeing after work", "I'm here to support you after your shift"],
      night: ["I hope you're taking care of yourself after work", "I care about you after your shift", "I'm thinking of you after your workday"]
    };
    return suggestions[period] || ["I care about you"];
  }

  /**
   * Initialize fallback greetings
   * @returns {Object} - Fallback greetings
   */
  initializeFallbackGreetings() {
    return {
        morning: {
          weekday: [
            `Hey ${this.userName}, ready to start your morning shift?`,
            `Good morning ${this.userName}, I hope your workday goes smoothly`,
            `Morning ${this.userName}, I'm here to support you through your shift`,
            `Hey ${this.userName}, how are you feeling about today's work?`,
            `Good morning ${this.userName}, I hope you have a productive day`,
            `Hey ${this.userName}, I'm thinking of you as you start your day`,
            `Morning ${this.userName}, I care about how your workday goes`,
            `Good morning ${this.userName}, I'm here for you during your shift`
          ],
          weekend: [
            `Hey ${this.userName}, I hope you're enjoying your weekend morning`,
            `Good morning ${this.userName}, I hope you're feeling relaxed`,
            `Morning ${this.userName}, how are you doing this weekend?`,
            `Hey ${this.userName}, I hope you're having a peaceful day`,
            `Good morning ${this.userName}, I'm thinking of you`
          ]
        },
      afternoon: {
        weekday: [
          `Hey ${this.userName}, how's your afternoon shift going?`,
          `Good afternoon ${this.userName}, I hope your workday is going well`,
          `Afternoon ${this.userName}, I'm here to support you through your shift`,
          `Hey ${this.userName}, how are you feeling about your work today?`,
          `Good afternoon ${this.userName}, I hope you're staying energized`,
          `Hey ${this.userName}, I'm thinking of you during your workday`,
          `Afternoon ${this.userName}, I care about how you're doing at work`,
          `Good afternoon ${this.userName}, I'm here for you during your shift`
        ],
        weekend: [
          `Hey ${this.userName}, I hope you're enjoying your weekend afternoon`,
          `Good afternoon ${this.userName}, I hope you're feeling relaxed`,
          `Afternoon ${this.userName}, how are you doing this weekend?`,
          `Hey ${this.userName}, I hope you're having a peaceful day`,
          `Good afternoon ${this.userName}, I'm thinking of you`
        ]
      },
      evening: {
        weekday: [
          `Hey ${this.userName}, how was your workday? I hope it went well`,
          `Good evening ${this.userName}, I hope your shift went smoothly`,
          `Evening ${this.userName}, I'm here to support you after your workday`,
          `Hey ${this.userName}, I hope you're ready to relax after work`,
          `Good evening ${this.userName}, I'm thinking of you after your shift`,
          `Hey ${this.userName}, how are you feeling after your workday?`,
          `Evening ${this.userName}, I care about how your day went`,
          `Good evening ${this.userName}, I'm here for you after your shift`
        ],
        weekend: [
          `Hey ${this.userName}, I hope you're enjoying your weekend evening`,
          `Good evening ${this.userName}, I hope you're feeling peaceful`,
          `Evening ${this.userName}, how are you doing this weekend?`,
          `Hey ${this.userName}, I hope you're having a relaxing time`,
          `Good evening ${this.userName}, I'm thinking of you`
        ]
      },
      night: {
        weekday: [
          `Hey ${this.userName}, I hope you're doing well after your workday`,
          `Good night ${this.userName}, I hope your shift went smoothly`,
          `Night ${this.userName}, I'm here for you after your workday`,
          `Hey ${this.userName}, I hope you're taking care of yourself after work`,
          `Good night ${this.userName}, I'm thinking of you after your shift`,
          `Hey ${this.userName}, how are you feeling after your workday?`,
          `Night ${this.userName}, I care about how your day went`,
          `Good night ${this.userName}, I'm here for you after your shift`
        ],
        weekend: [
          `Hey ${this.userName}, I hope you're enjoying your weekend night`,
          `Good night ${this.userName}, I hope you're feeling peaceful`,
          `Night ${this.userName}, how are you doing this weekend?`,
          `Hey ${this.userName}, I hope you're having a relaxing time`,
          `Good night ${this.userName}, I'm here for you`
        ]
      }
    };
  }

  /**
   * Get fallback greeting
   * @param {number} hour - Current hour
   * @param {boolean} isWeekend - Whether it's weekend
   * @returns {Object} - Fallback greeting
   */
  getFallbackGreeting(hour, isWeekend) {
    const period = this.getTimePeriod(hour);
    const type = isWeekend ? 'weekend' : 'weekday';
    const greetings = this.fallbackGreetings[period][type];
    const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];
    
    return {
      text: randomGreeting,
      emoji: this.getDefaultEmoji(period),
      mood: this.getMoodFromPeriod(period),
      timeOfDay: period,
      context: {
        suggestions: this.getContextualSuggestions(period)
      },
      generatedBy: 'fallback'
    };
  }

  /**
   * Get time-based greeting
   * @param {number} hour - Current hour (0-23)
   * @param {boolean} isWeekend - Whether it's weekend
   * @returns {Object} - Time-based greeting
   */
  getTimeBasedGreeting(hour, isWeekend) {
    let greeting, emoji, mood;

    if (hour >= 5 && hour < 12) {
      // Morning (5 AM - 12 PM)
      const morningGreetings = isWeekend ? [
        `Hey ${this.userName}! Ready for an awesome day?`,
        `Morning ${this.userName}! Let's make today amazing!`,
        `Good morning ${this.userName}! What's the plan?`,
        `Hey there ${this.userName}! Ready to rock today?`,
        `Morning sunshine! How are you feeling today?`
      ] : [
        `Hey ${this.userName}! Ready to crush today?`,
        `Good morning ${this.userName}! Let's get things done!`,
        `Morning ${this.userName}! What's on your agenda?`,
        `Hey there! Ready to tackle the day?`,
        `Good morning! How are you feeling today?`
      ];
      greeting = morningGreetings[Math.floor(Math.random() * morningGreetings.length)];
      emoji = '🌅';
      mood = 'energetic';
    } else if (hour >= 12 && hour < 17) {
      // Afternoon (12 PM - 5 PM)
      const afternoonGreetings = isWeekend ? [
        `Hey ${this.userName}! How's your weekend going?`,
        `Afternoon ${this.userName}! Having fun?`,
        `Hey there! Enjoying your day off?`,
        `How's it going ${this.userName}?`,
        `Hey! What's up with your weekend?`
      ] : [
        `Hey ${this.userName}! How's your day going?`,
        `Afternoon ${this.userName}! Making progress?`,
        `Hey there! How's work treating you?`,
        `How's it going ${this.userName}?`,
        `Hey! What's happening today?`
      ];
      greeting = afternoonGreetings[Math.floor(Math.random() * afternoonGreetings.length)];
      emoji = '☀️';
      mood = 'productive';
    } else if (hour >= 17 && hour < 21) {
      // Evening (5 PM - 9 PM)
      const eveningGreetings = isWeekend ? [
        `Hey ${this.userName}! Ready to chill?`,
        `Evening ${this.userName}! How was your day?`,
        `Hey there! Time to relax?`,
        `How's your evening going ${this.userName}?`,
        `Hey! Ready to unwind?`
      ] : [
        `Hey ${this.userName}! Done with work?`,
        `Evening ${this.userName}! How was your day?`,
        `Hey there! Ready to call it a day?`,
        `How's your evening ${this.userName}?`,
        `Hey! Time to relax?`
      ];
      greeting = eveningGreetings[Math.floor(Math.random() * eveningGreetings.length)];
      emoji = '🌆';
      mood = 'relaxed';
    } else {
      // Night (9 PM - 5 AM)
      const nightGreetings = hour >= 21 ? [
        `Hey ${this.userName}! Still up?`,
        `Late night ${this.userName}! What's going on?`,
        `Hey there! Burning the midnight oil?`,
        `Still awake ${this.userName}?`,
        `Hey! What's keeping you up?`
      ] : [
        `Hey ${this.userName}! Working late?`,
        `Night shift ${this.userName}?`,
        `Hey there! Still at it?`,
        `Late night work ${this.userName}?`,
        `Hey! What's the late night plan?`
      ];
      greeting = nightGreetings[Math.floor(Math.random() * nightGreetings.length)];
      emoji = '🌙';
      mood = 'calm';
    }

    return {
      text: greeting,
      emoji,
      mood,
      timeOfDay: this.getTimeOfDay(hour)
    };
  }

  /**
   * Get contextual information based on current time and day
   * @param {Date} now - Current date
   * @param {boolean} isWeekend - Whether it's weekend
   * @returns {Object} - Contextual information
   */
  getContextualInfo(now, isWeekend) {
    const hour = now.getHours();
    const dayOfWeek = now.getDay();
    
    let context = {
      suggestions: [],
      weather: this.getWeatherContext(hour),
      activities: this.getActivitySuggestions(hour, isWeekend)
    };

    // Add time-specific suggestions
    if (hour >= 6 && hour < 9) {
      context.suggestions.push('Start your day with a quick voice memo');
      context.suggestions.push('Check your schedule for today');
      context.suggestions.push('Set your intentions for the day');
    } else if (hour >= 9 && hour < 12) {
      context.suggestions.push('Time for your morning tasks');
      context.suggestions.push('Any meetings to prepare for?');
      context.suggestions.push('Take a moment to organize your priorities');
    } else if (hour >= 12 && hour < 14) {
      context.suggestions.push('Lunch break - perfect time for a voice note');
      context.suggestions.push('Review your morning progress');
      context.suggestions.push('Take a well-deserved break');
    } else if (hour >= 14 && hour < 17) {
      context.suggestions.push('Afternoon productivity session');
      context.suggestions.push('Any afternoon meetings?');
      context.suggestions.push('Stay focused and energized');
    } else if (hour >= 17 && hour < 19) {
      context.suggestions.push('Wrap up your workday');
      context.suggestions.push('Plan for tomorrow');
      context.suggestions.push('Celebrate what you accomplished today');
    } else if (hour >= 19 && hour < 22) {
      context.suggestions.push('Evening relaxation time');
      context.suggestions.push('Reflect on your day');
      context.suggestions.push('Enjoy some quality time with yourself');
    } else {
      context.suggestions.push('Late night productivity or relaxation');
      context.suggestions.push('Time to wind down');
      context.suggestions.push('Remember to get some rest');
    }

    return context;
  }

  /**
   * Get weather context based on time
   * @param {number} hour - Current hour
   * @returns {string} - Weather context
   */
  getWeatherContext(hour) {
    if (hour >= 5 && hour < 12) {
      return 'morning';
    } else if (hour >= 12 && hour < 17) {
      return 'afternoon';
    } else if (hour >= 17 && hour < 21) {
      return 'evening';
    } else {
      return 'night';
    }
  }

  /**
   * Get activity suggestions based on time and day
   * @param {number} hour - Current hour
   * @param {boolean} isWeekend - Whether it's weekend
   * @returns {Array} - Activity suggestions
   */
  getActivitySuggestions(hour, isWeekend) {
    if (isWeekend) {
      if (hour >= 8 && hour < 12) {
        return ['Weekend brunch planning', 'Relaxing morning routine', 'Weekend project time'];
      } else if (hour >= 12 && hour < 18) {
        return ['Outdoor activities', 'Social time', 'Hobby projects'];
      } else {
        return ['Evening relaxation', 'Movie night', 'Social gatherings'];
      }
    } else {
      if (hour >= 6 && hour < 9) {
        return ['Morning routine', 'Commute planning', 'Daily goals'];
      } else if (hour >= 9 && hour < 17) {
        return ['Work tasks', 'Meetings', 'Productivity'];
      } else {
        return ['Work wrap-up', 'Evening plans', 'Tomorrow preparation'];
      }
    }
  }

  /**
   * Combine greeting with contextual information
   * @param {Object} greeting - Time-based greeting
   * @param {Object} context - Contextual information
   * @returns {Object} - Complete greeting object
   */
  combineGreetingWithContext(greeting, context) {
    return {
      ...greeting,
      context,
      timestamp: new Date().toISOString(),
      type: 'intelligent_greeting'
    };
  }

  /**
   * Get contextual greeting (when skipping full greeting)
   * @param {number} hour - Current hour
   * @param {boolean} isWeekend - Whether it's weekend
   * @returns {Object} - Simple contextual greeting
   */
  getContextualGreeting(hour, isWeekend) {
    const timeOfDay = this.getTimeOfDay(hour);
    const emoji = this.getTimeEmoji(hour);
    
    return {
      text: `Hello ${this.userName}! What can I help you with?`,
      emoji,
      mood: 'neutral',
      timeOfDay,
      context: {
        suggestions: ['Say "Hey Buddy" to start recording', 'Check your notes', 'Review your tasks'],
        activities: ['Voice recording', 'Note taking', 'Task management']
      },
      timestamp: new Date().toISOString(),
      type: 'contextual_greeting'
    };
  }

  /**
   * Get time of day string
   * @param {number} hour - Current hour
   * @returns {string} - Time of day
   */
  getTimeOfDay(hour) {
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
  }

  /**
   * Get emoji for time of day
   * @param {number} hour - Current hour
   * @returns {string} - Emoji
   */
  getTimeEmoji(hour) {
    if (hour >= 5 && hour < 12) return '🌅';
    if (hour >= 12 && hour < 17) return '☀️';
    if (hour >= 17 && hour < 21) return '🌆';
    return '🌙';
  }

  /**
   * Check if we should skip the full greeting (cooldown)
   * @returns {boolean} - Whether to skip greeting
   */
  shouldSkipGreeting() {
    if (!this.lastGreetingTime) return false;
    
    const now = Date.now();
    const timeSinceLastGreeting = now - this.lastGreetingTime;
    
    return timeSinceLastGreeting < this.greetingCooldown;
  }

  /**
   * Generate follow-up question based on context
   * @param {Object} greeting - Current greeting object
   * @returns {string} - Follow-up question
   */
  generateFollowUpQuestion(greeting) {
    const { timeOfDay, mood, context } = greeting;
    
    const questions = {
      morning: [
        "What's the plan?",
        "Ready to rock?",
        "What's first?",
        "Let's do this!",
        "What's on your mind?"
      ],
      afternoon: [
        "How's it going?",
        "What's up?",
        "Need anything?",
        "How's your day?",
        "What's happening?"
      ],
      evening: [
        "How was your day?",
        "Ready to chill?",
        "What's next?",
        "How are you doing?",
        "Time to relax?"
      ],
      night: [
        "What's going on?",
        "Still at it?",
        "Need help?",
        "What's up?",
        "How can I help?"
      ]
    };

    const timeQuestions = questions[timeOfDay] || questions.night;
    return timeQuestions[Math.floor(Math.random() * timeQuestions.length)];
  }

  /**
   * Update user name
   * @param {string} name - User's name
   */
  updateUserName(name) {
    this.userName = name;
    // Reset session greeting when name changes
    this.sessionGreeting = null;
    // Clear cache since greetings contain the old name
    this.preGeneratedGreetings.clear();
    localStorage.removeItem('hey-buddy-greetings');
  }

  /**
   * Get service status
   * @returns {Object} - Service status
   */
  getServiceStatus() {
    return {
      gemmaReady: this.gemmaReady,
      isPreGenerating: this.isPreGenerating,
      cachedGreetingsCount: this.preGeneratedGreetings.size,
      sessionGreeting: !!this.sessionGreeting,
      userName: this.userName
    };
  }

  /**
   * Force regenerate all greetings (useful for testing)
   */
  async forceRegenerateGreetings() {
    console.log('Force regenerating all greetings...');
    this.preGeneratedGreetings.clear();
    localStorage.removeItem('hey-buddy-greetings');
    this.sessionGreeting = null;
    
    if (this.gemmaReady) {
      await this.preGenerateTimeSlotGreetings();
    }
  }

  /**
   * Get current greeting status
   * @returns {Object} - Greeting status
   */
  getStatus() {
    return {
      userName: this.userName,
      lastGreetingTime: this.lastGreetingTime,
      cooldownActive: this.shouldSkipGreeting(),
      timeUntilNextGreeting: this.lastGreetingTime ? 
        Math.max(0, this.greetingCooldown - (Date.now() - this.lastGreetingTime)) : 0
    };
  }

  /**
   * Reset greeting cooldown (for testing or special cases)
   */
  resetCooldown() {
    this.lastGreetingTime = null;
  }

  /**
   * Reset session greeting (for new session or testing)
   */
  resetSessionGreeting() {
    this.sessionGreeting = null;
  }
}

// Create singleton instance
const greetingService = new GreetingService();

export default greetingService;
