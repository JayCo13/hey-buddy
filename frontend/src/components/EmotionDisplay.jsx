import React from 'react';
import { TrendingUp, Clock, BarChart3 } from 'lucide-react';

const EmotionDisplay = ({ 
  currentEmotion, 
  emotionHistory = [], 
  isAnalyzing = false,
  showHistory = true,
  showStats = true 
}) => {
  if (!currentEmotion && emotionHistory.length === 0) {
    return null;
  }

  const getEmotionIntensity = (confidence) => {
    if (confidence >= 0.8) return 'Very High';
    if (confidence >= 0.6) return 'High';
    if (confidence >= 0.4) return 'Medium';
    if (confidence >= 0.2) return 'Low';
    return 'Very Low';
  };

  const getEmotionStats = () => {
    if (emotionHistory.length === 0) return null;

    const emotionCounts = {};
    let totalConfidence = 0;

    emotionHistory.forEach(emotion => {
      emotionCounts[emotion.dominantEmotion] = (emotionCounts[emotion.dominantEmotion] || 0) + 1;
      totalConfidence += emotion.confidence;
    });

    const dominantEmotion = Object.keys(emotionCounts).reduce((a, b) => 
      emotionCounts[a] > emotionCounts[b] ? a : b
    );

    return {
      dominantEmotion,
      emotionCounts,
      averageConfidence: totalConfidence / emotionHistory.length,
      totalAnalyses: emotionHistory.length
    };
  };

  const stats = getEmotionStats();

  return (
    <div className="space-y-4">
      {/* Current Emotion Display */}
      {currentEmotion && (
        <div className="bg-black/30 backdrop-blur-sm rounded-xl p-4 border border-white/10">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-300">Current Emotion</h4>
            {isAnalyzing && (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-400"></div>
                <span className="text-xs text-blue-300">Analyzing...</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-3">
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
              style={{ backgroundColor: `${currentEmotion.emotionColor}20` }}
            >
              {currentEmotion.emotionEmoji}
            </div>
            
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <span 
                  className="text-lg font-semibold capitalize"
                  style={{ color: currentEmotion.emotionColor }}
                >
                  {currentEmotion.dominantEmotion}
                </span>
                <span className="text-xs text-gray-400">
                  {Math.round(currentEmotion.confidence * 100)}%
                </span>
              </div>
              
              <div className="text-xs text-gray-400">
                {getEmotionIntensity(currentEmotion.confidence)} confidence
              </div>
              
              {/* Confidence Bar */}
              <div className="mt-2 w-full bg-gray-700 rounded-full h-1.5">
                <div 
                  className="h-1.5 rounded-full transition-all duration-500"
                  style={{ 
                    width: `${currentEmotion.confidence * 100}%`,
                    backgroundColor: currentEmotion.emotionColor 
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Emotion Statistics */}
      {showStats && stats && (
        <div className="bg-black/30 backdrop-blur-sm rounded-xl p-4 border border-white/10">
          <div className="flex items-center space-x-2 mb-3">
            <BarChart3 className="w-4 h-4 text-gray-300" />
            <h4 className="text-sm font-medium text-gray-300">Session Statistics</h4>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <div className="text-gray-400">Total Analyses</div>
              <div className="text-white font-semibold">{stats.totalAnalyses}</div>
            </div>
            <div>
              <div className="text-gray-400">Avg Confidence</div>
              <div className="text-white font-semibold">
                {Math.round(stats.averageConfidence * 100)}%
              </div>
            </div>
            <div className="col-span-2">
              <div className="text-gray-400 mb-2">Most Common</div>
              <div className="flex items-center space-x-2">
                <span 
                  className="text-sm font-semibold capitalize"
                  style={{ color: currentEmotion?.emotionColor || '#6b7280' }}
                >
                  {stats.dominantEmotion}
                </span>
                <span className="text-xs text-gray-400">
                  ({stats.emotionCounts[stats.dominantEmotion]} times)
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Emotion History */}
      {showHistory && emotionHistory.length > 0 && (
        <div className="bg-black/30 backdrop-blur-sm rounded-xl p-4 border border-white/10">
          <div className="flex items-center space-x-2 mb-3">
            <Clock className="w-4 h-4 text-gray-300" />
            <h4 className="text-sm font-medium text-gray-300">Recent Emotions</h4>
          </div>
          
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {emotionHistory.slice(-5).reverse().map((emotion, index) => (
              <div key={emotion.id || index} className="flex items-center justify-between py-1">
                <div className="flex items-center space-x-2">
                  <span className="text-sm">{emotion.emotionEmoji}</span>
                  <span 
                    className="text-xs font-medium capitalize"
                    style={{ color: emotion.emotionColor }}
                  >
                    {emotion.dominantEmotion}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-400">
                    {Math.round(emotion.confidence * 100)}%
                  </span>
                  <span className="text-xs text-gray-500">
                    {emotion.timestamp.toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Emotions Legend */}
      <div className="bg-black/30 backdrop-blur-sm rounded-xl p-4 border border-white/10">
        <h4 className="text-sm font-medium text-gray-300 mb-3">Emotion Types</h4>
        <div className="grid grid-cols-4 gap-2 text-xs">
          {[
            { emotion: 'happy', emoji: '😊', color: '#f59e0b' },
            { emotion: 'sad', emoji: '😢', color: '#3b82f6' },
            { emotion: 'angry', emoji: '😠', color: '#ef4444' },
            { emotion: 'fearful', emoji: '😨', color: '#f59e0b' },
            { emotion: 'surprised', emoji: '😲', color: '#ec4899' },
            { emotion: 'disgust', emoji: '🤢', color: '#8b5cf6' },
            { emotion: 'calm', emoji: '😌', color: '#10b981' },
            { emotion: 'neutral', emoji: '😐', color: '#6b7280' }
          ].map(({ emotion, emoji, color }) => (
            <div key={emotion} className="flex flex-col items-center space-y-1">
              <div 
                className="w-6 h-6 rounded-full flex items-center justify-center"
                style={{ backgroundColor: `${color}20` }}
              >
                <span className="text-xs">{emoji}</span>
              </div>
              <span className="text-xs text-gray-400 capitalize">{emotion}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EmotionDisplay;

