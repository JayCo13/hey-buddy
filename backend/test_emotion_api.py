#!/usr/bin/env python3
"""
Test script for emotion recognition API endpoints
Run this script to test the emotion recognition API
"""

import asyncio
import sys
import os
import logging
import requests
import json
from pathlib import Path

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# API base URL
BASE_URL = "http://localhost:8001/api/v1/emotion"

def test_emotion_info():
    """Test the emotion info endpoint"""
    try:
        logger.info("Testing emotion info endpoint...")
        response = requests.get(f"{BASE_URL}/test/emotion-info")
        
        if response.status_code == 200:
            data = response.json()
            logger.info("✅ Emotion info endpoint working!")
            logger.info(f"Found {data['data']['total_emotions']} emotions")
            for emotion in data['data']['emotions'][:3]:  # Show first 3
                logger.info(f"  - {emotion['emotion']}: {emotion['emoji']} ({emotion['color']})")
            return True
        else:
            logger.error(f"❌ Emotion info endpoint failed: {response.status_code}")
            logger.error(f"Response: {response.text}")
            return False
            
    except Exception as e:
        logger.error(f"❌ Error testing emotion info: {e}")
        return False

def test_model_initialization():
    """Test the model initialization endpoint"""
    try:
        logger.info("Testing model initialization endpoint...")
        response = requests.post(f"{BASE_URL}/test/initialize-model")
        
        if response.status_code == 200:
            data = response.json()
            logger.info("✅ Model initialization endpoint working!")
            logger.info(f"Message: {data['message']}")
            return True
        else:
            logger.error(f"❌ Model initialization failed: {response.status_code}")
            logger.error(f"Response: {response.text}")
            return False
            
    except Exception as e:
        logger.error(f"❌ Error testing model initialization: {e}")
        return False

def create_test_audio():
    """Create a simple test audio file"""
    try:
        import numpy as np
        import soundfile as sf
        
        # Create a simple sine wave (440 Hz for 2 seconds)
        sample_rate = 16000
        duration = 2.0
        frequency = 440.0
        
        t = np.linspace(0, duration, int(sample_rate * duration), False)
        audio_data = np.sin(2 * np.pi * frequency * t) * 0.3
        
        # Save as WAV file
        test_audio_path = "test_audio.wav"
        sf.write(test_audio_path, audio_data, sample_rate)
        
        logger.info(f"✅ Created test audio file: {test_audio_path}")
        return test_audio_path
        
    except ImportError:
        logger.warning("⚠️  soundfile not available, skipping audio file creation")
        return None
    except Exception as e:
        logger.error(f"❌ Error creating test audio: {e}")
        return None

def test_audio_analysis(audio_file_path):
    """Test the audio analysis endpoint"""
    try:
        # Use the specific wav file if available
        wav_file = "03-01-01-01-01-01-01.wav"
        if os.path.exists(wav_file):
            audio_file_path = wav_file
            logger.info(f"Using provided audio file: {wav_file}")
        
        if not audio_file_path or not os.path.exists(audio_file_path):
            logger.warning("⚠️  No audio file available for testing")
            return False
            
        logger.info("Testing audio analysis endpoint...")
        
        with open(audio_file_path, 'rb') as f:
            files = {'audio_file': (audio_file_path, f, 'audio/wav')}
            response = requests.post(f"{BASE_URL}/test/analyze-audio", files=files)
        
        if response.status_code == 200:
            data = response.json()
            logger.info("✅ Audio analysis endpoint working!")
            emotion_data = data['data']
            logger.info(f"Detected emotion: {emotion_data['dominant_emotion']} {emotion_data['emotion_emoji']}")
            logger.info(f"Confidence: {emotion_data['confidence']:.2f}")
            logger.info(f"Color: {emotion_data['emotion_color']}")
            return True
        else:
            logger.error(f"❌ Audio analysis failed: {response.status_code}")
            logger.error(f"Response: {response.text}")
            return False
            
    except Exception as e:
        logger.error(f"❌ Error testing audio analysis: {e}")
        return False

def test_server_connection():
    """Test if the server is running"""
    try:
        logger.info("Testing server connection...")
        response = requests.get("http://localhost:8001/health", timeout=5)
        
        if response.status_code == 200:
            logger.info("✅ Server is running!")
            return True
        else:
            logger.error(f"❌ Server health check failed: {response.status_code}")
            return False
            
    except requests.exceptions.ConnectionError:
        logger.error("❌ Cannot connect to server. Make sure the server is running on localhost:8001")
        return False
    except Exception as e:
        logger.error(f"❌ Error testing server connection: {e}")
        return False

def cleanup_test_files():
    """Clean up test files"""
    test_files = ["test_audio.wav"]
    for file in test_files:
        if os.path.exists(file):
            os.remove(file)
            logger.info(f"Cleaned up: {file}")

def main():
    """Main test function"""
    logger.info("🚀 Starting emotion recognition API tests...")
    
    # Test server connection first
    if not test_server_connection():
        logger.error("❌ Server is not running. Please start the server first:")
        logger.error("   cd backend && python main.py")
        sys.exit(1)
    
    # Run tests
    tests_passed = 0
    total_tests = 3
    
    # Test 1: Emotion info
    if test_emotion_info():
        tests_passed += 1
    
    # Test 2: Model initialization
    if test_model_initialization():
        tests_passed += 1
    
    # Test 3: Audio analysis
    test_audio_path = create_test_audio()
    if test_audio_analysis(test_audio_path):
        tests_passed += 1
    
    # Cleanup
    cleanup_test_files()
    
    # Results
    logger.info(f"\n📊 Test Results: {tests_passed}/{total_tests} tests passed")
    
    if tests_passed == total_tests:
        logger.info("🎉 All tests passed! The emotion recognition API is working correctly.")
        sys.exit(0)
    else:
        logger.error("❌ Some tests failed. Please check the logs above for details.")
        sys.exit(1)

if __name__ == "__main__":
    main()
