# Emotion Recognition Feature Guide

## Overview

This guide explains the emotion recognition feature that has been integrated into the Hey Buddy voice assistant. The feature uses the Hugging Face `ehcalabres/wav2vec2-lg-xlsr-en-speech-emotion-recognition` model to detect emotions from voice audio in real-time.

## Features

### 1. Real-time Emotion Detection
- Analyzes voice audio during recording sessions
- Detects 8 different emotions: angry, calm, disgust, fearful, happy, neutral, sad, surprised
- Provides confidence scores for each emotion prediction
- Updates in real-time as you speak

### 2. Emotion Display Components
- **Current Emotion**: Shows the most recent detected emotion with emoji and color coding
- **Emotion History**: Displays recent emotion detections with timestamps
- **Session Statistics**: Shows total analyses, average confidence, and most common emotion
- **Emotion Legend**: Visual guide showing all available emotions

### 3. Visual Indicators
- Emotion indicator next to the recording button during active recording
- Color-coded emotions for easy identification
- Confidence bars showing prediction strength
- Emoji representations for quick visual recognition

## How to Use

### 1. Enable Emotion Recognition
1. Open the Record Screen
2. Click the heart icon (❤️) in the top-right corner to toggle the emotion panel
3. The emotion panel will appear below the timer

### 2. Start Recording with Emotion Detection
1. Click the play/pause button to start recording
2. Speak normally - the system will automatically analyze your voice
3. Watch the emotion indicator next to the recording button
4. View detailed emotion analysis in the emotion panel

### 3. View Emotion Data
- **Current Emotion**: Shows your current emotional state
- **Recent Emotions**: Scroll through your recent emotional states
- **Statistics**: See patterns in your emotional responses
- **Clear Data**: Use the "Clear Emotions" button to reset emotion history

## Technical Implementation

### Backend Components
- **Emotion Recognition Service** (`backend/app/services/emotion_recognition_service.py`)
  - Loads the Hugging Face wav2vec2 model
  - Processes audio data for emotion analysis
  - Provides confidence scores and emotion classifications

- **API Endpoints** (`backend/app/api/v1/endpoints/emotion.py`)
  - `/emotion/analyze-audio` - Analyze uploaded audio files
  - `/emotion/analyze-stream` - Analyze streaming audio chunks
  - `/emotion/emotion-info` - Get emotion metadata
  - `/emotion/initialize-model` - Initialize the model

### Frontend Components
- **Emotion Service** (`frontend/src/services/emotionService.js`)
  - Client-side emotion analysis using Transformers.js
  - Handles audio processing and model inference
  - Provides emotion utilities and color coding

- **Emotion Recognition Hook** (`frontend/src/hooks/useEmotionRecognition.js`)
  - Manages emotion recognition state
  - Handles real-time audio monitoring
  - Provides emotion history and statistics

- **Emotion Display Component** (`frontend/src/components/EmotionDisplay.jsx`)
  - Renders emotion data in a user-friendly interface
  - Shows current emotion, history, and statistics
  - Provides visual indicators and color coding

## Emotion Types

| Emotion | Emoji | Color | Description |
|---------|-------|-------|-------------|
| Happy | 😊 | Yellow | Joyful and positive |
| Sad | 😢 | Blue | Down or melancholic |
| Angry | 😠 | Red | Frustrated or irritated |
| Fearful | 😨 | Amber | Scared or anxious |
| Surprised | 😲 | Pink | Astonished or amazed |
| Disgust | 🤢 | Violet | Repulsed or revolted |
| Calm | 😌 | Emerald | Peaceful and relaxed |
| Neutral | 😐 | Gray | Balanced and composed |

## Dependencies

### Backend Dependencies
```
torch>=2.0.0
torchaudio>=2.0.0
transformers>=4.30.0
librosa>=0.10.0
soundfile>=0.12.0
scipy>=1.10.0
```

### Frontend Dependencies
```
@xenova/transformers>=2.17.2
```

## Performance Considerations

1. **Model Loading**: The emotion recognition model is loaded on-demand to reduce initial load time
2. **Real-time Processing**: Audio is analyzed in 2-second intervals to balance accuracy and performance
3. **Memory Management**: Emotion history is limited to the last 10 detections to prevent memory issues
4. **Error Handling**: Graceful fallbacks ensure the app continues working even if emotion recognition fails

## Troubleshooting

### Common Issues

1. **Model Not Loading**
   - Check internet connection (model downloads from Hugging Face)
   - Ensure sufficient browser memory
   - Try refreshing the page

2. **No Emotion Detection**
   - Ensure microphone permissions are granted
   - Check that audio is being recorded (look for the recording indicator)
   - Verify the emotion panel is enabled (heart icon)

3. **Low Confidence Scores**
   - Speak clearly and at normal volume
   - Ensure minimal background noise
   - Try speaking for longer periods (2+ seconds)

### Browser Compatibility
- Chrome/Chromium: Full support
- Firefox: Full support
- Safari: Full support
- Edge: Full support

## Future Enhancements

1. **Emotion-based Responses**: AI responses could be tailored based on detected emotions
2. **Emotion Trends**: Long-term emotion tracking and analysis
3. **Multi-language Support**: Support for emotion recognition in other languages
4. **Custom Models**: Ability to fine-tune models for specific use cases
5. **Emotion-based Commands**: Voice commands that trigger based on emotional state

## Privacy and Security

- All audio processing happens locally in the browser
- No audio data is sent to external servers (except for the initial model download)
- Emotion data is stored locally and can be cleared at any time
- No personal audio data is permanently stored

## Support

For issues or questions about the emotion recognition feature:
1. Check the browser console for error messages
2. Verify all dependencies are properly installed
3. Ensure microphone permissions are granted
4. Try clearing browser cache and reloading the page

