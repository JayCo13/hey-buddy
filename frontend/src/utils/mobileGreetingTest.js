/**
 * Mobile Greeting Test Utility
 * Tests Web Speech API integration for mobile greeting functionality
 */

import greetingService from '../services/greetingService';

class MobileGreetingTest {
  constructor() {
    this.testResults = [];
    this.isRunning = false;
  }

  /**
   * Run comprehensive mobile greeting tests
   */
  async runTests() {
    if (this.isRunning) {
      console.warn('Mobile greeting tests already running');
      return this.testResults;
    }

    this.isRunning = true;
    this.testResults = [];

    console.log('🧪 Starting Mobile Greeting Tests...');

    try {
      // Test 1: Web Speech API Availability
      await this.testWebSpeechAvailability();

      // Test 2: Greeting Service Initialization
      await this.testGreetingServiceInit();

      // Test 3: Voice Selection
      await this.testVoiceSelection();

      // Test 4: Greeting Generation
      await this.testGreetingGeneration();

      // Test 5: Mobile TTS
      await this.testMobileTTS();

      console.log('✅ Mobile Greeting Tests Completed');
      this.logResults();

    } catch (error) {
      console.error('❌ Mobile Greeting Tests Failed:', error);
      this.testResults.push({
        test: 'Overall Test Suite',
        status: 'FAILED',
        error: error.message
      });
    } finally {
      this.isRunning = false;
    }

    return this.testResults;
  }

  /**
   * Test Web Speech API availability
   */
  async testWebSpeechAvailability() {
    const test = 'Web Speech API Availability';
    
    try {
      const available = 'speechSynthesis' in window;
      const voices = available ? speechSynthesis.getVoices() : [];
      
      this.testResults.push({
        test,
        status: available ? 'PASS' : 'FAIL',
        details: {
          available,
          voicesCount: voices.length,
          userAgent: navigator.userAgent
        }
      });

      console.log(`🧪 ${test}: ${available ? '✅ PASS' : '❌ FAIL'}`);
    } catch (error) {
      this.testResults.push({
        test,
        status: 'ERROR',
        error: error.message
      });
    }
  }

  /**
   * Test greeting service initialization
   */
  async testGreetingServiceInit() {
    const test = 'Greeting Service Initialization';
    
    try {
      const success = await greetingService.initialize();
      const status = greetingService.getWebSpeechStatus();
      
      this.testResults.push({
        test,
        status: success ? 'PASS' : 'FAIL',
        details: {
          initialized: success,
          webSpeechStatus: status
        }
      });

      console.log(`🧪 ${test}: ${success ? '✅ PASS' : '❌ FAIL'}`);
    } catch (error) {
      this.testResults.push({
        test,
        status: 'ERROR',
        error: error.message
      });
    }
  }

  /**
   * Test voice selection
   */
  async testVoiceSelection() {
    const test = 'Voice Selection';
    
    try {
      const status = greetingService.getWebSpeechStatus();
      const hasVoices = status.voicesCount > 0;
      const hasSelectedVoice = status.selectedVoice !== null;
      
      this.testResults.push({
        test,
        status: hasVoices && hasSelectedVoice ? 'PASS' : 'WARN',
        details: {
          voicesCount: status.voicesCount,
          selectedVoice: status.selectedVoice,
          ready: status.ready
        }
      });

      console.log(`🧪 ${test}: ${hasVoices && hasSelectedVoice ? '✅ PASS' : '⚠️ WARN'}`);
    } catch (error) {
      this.testResults.push({
        test,
        status: 'ERROR',
        error: error.message
      });
    }
  }

  /**
   * Test greeting generation
   */
  async testGreetingGeneration() {
    const test = 'Greeting Generation';
    
    try {
      const greeting = await greetingService.generateGreeting();
      const hasText = greeting && greeting.text && greeting.text.length > 0;
      const hasEmoji = greeting && greeting.emoji;
      
      this.testResults.push({
        test,
        status: hasText ? 'PASS' : 'FAIL',
        details: {
          hasText,
          hasEmoji,
          text: greeting?.text,
          emoji: greeting?.emoji,
          generatedBy: greeting?.generatedBy
        }
      });

      console.log(`🧪 ${test}: ${hasText ? '✅ PASS' : '❌ FAIL'}`);
    } catch (error) {
      this.testResults.push({
        test,
        status: 'ERROR',
        error: error.message
      });
    }
  }

  /**
   * Test mobile TTS functionality
   */
  async testMobileTTS() {
    const test = 'Mobile TTS Functionality';
    
    try {
      const greeting = await greetingService.generateGreeting();
      const canSpeak = greetingService.isWebSpeechReady();
      
      if (canSpeak) {
        // Test speaking (but don't actually speak to avoid interrupting user)
        const success = await greetingService.speakGreeting(greeting);
        
        this.testResults.push({
          test,
          status: success ? 'PASS' : 'FAIL',
          details: {
            canSpeak,
            speechStarted: success,
            greetingText: greeting?.text
          }
        });

        console.log(`🧪 ${test}: ${success ? '✅ PASS' : '❌ FAIL'}`);
      } else {
        this.testResults.push({
          test,
          status: 'SKIP',
          details: {
            canSpeak: false,
            reason: 'Web Speech API not ready'
          }
        });

        console.log(`🧪 ${test}: ⏭️ SKIP (Web Speech API not ready)`);
      }
    } catch (error) {
      this.testResults.push({
        test,
        status: 'ERROR',
        error: error.message
      });
    }
  }

  /**
   * Log test results
   */
  logResults() {
    console.log('\n📊 Mobile Greeting Test Results:');
    console.log('================================');
    
    this.testResults.forEach((result, index) => {
      const status = result.status === 'PASS' ? '✅' : 
                    result.status === 'FAIL' ? '❌' : 
                    result.status === 'WARN' ? '⚠️' : 
                    result.status === 'SKIP' ? '⏭️' : '💥';
      
      console.log(`${index + 1}. ${status} ${result.test}`);
      
      if (result.details) {
        Object.entries(result.details).forEach(([key, value]) => {
          console.log(`   ${key}: ${value}`);
        });
      }
      
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
    });

    const passed = this.testResults.filter(r => r.status === 'PASS').length;
    const total = this.testResults.length;
    
    console.log(`\n📈 Summary: ${passed}/${total} tests passed`);
  }

  /**
   * Get test results summary
   */
  getSummary() {
    const passed = this.testResults.filter(r => r.status === 'PASS').length;
    const failed = this.testResults.filter(r => r.status === 'FAIL').length;
    const warnings = this.testResults.filter(r => r.status === 'WARN').length;
    const errors = this.testResults.filter(r => r.status === 'ERROR').length;
    const skipped = this.testResults.filter(r => r.status === 'SKIP').length;

    return {
      total: this.testResults.length,
      passed,
      failed,
      warnings,
      errors,
      skipped,
      success: failed === 0 && errors === 0
    };
  }
}

// Create singleton instance
const mobileGreetingTest = new MobileGreetingTest();

export default mobileGreetingTest;
