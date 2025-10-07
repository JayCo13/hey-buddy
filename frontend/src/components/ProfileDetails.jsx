import React, { useState, useEffect } from 'react';
import { Heart, TrendingUp, Sparkles, Calendar, MessageCircle, Clock, Star, Settings } from 'lucide-react';
import profileService from '../services/profileService';

const ProfileDetails = ({ userId = 'default_user' }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    setLoading(true);
    const data = await profileService.getProfile();
    if (data) {
      setProfile(data);
    } else {
      // Create profile if doesn't exist
      const newProfile = await profileService.createProfile();
      setProfile(newProfile);
    }
    setLoading(false);
  };

  const getRelationshipProgress = () => {
    if (!profile) return 0;
    return profile.relationship_score;
  };

  const getRelationshipInfo = () => {
    if (!profile) return { emoji: '👋', color: 'gray', description: 'Loading...' };
    return profileService.getRelationshipInfo(profile.relationship_level);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-red-400">Failed to load profile</p>
      </div>
    );
  }

  const relationshipInfo = getRelationshipInfo();

  return (
    <div className="min-h-screen bg-black text-white pb-20">
      {/* Header */}
      <div className="bg-gradient-to-b from-gray-900 to-black px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Your Profile</h1>
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 bg-gray-800 rounded-lg"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>

        {/* User Info */}
        <div className="text-center mb-8">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center text-4xl">
            {profile.name.charAt(0)}
          </div>
          <h2 className="text-2xl font-bold mb-2">{profile.name}</h2>
          <div className="flex items-center justify-center space-x-2 text-gray-400">
            <Calendar className="w-4 h-4" />
            <span className="text-sm">
              Member since {new Date(profile.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Relationship Status */}
        <div className="bg-gray-800/50 rounded-2xl p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <span className="text-3xl">{relationshipInfo.emoji}</span>
              <div>
                <h3 className="text-xl font-bold capitalize">{profile.relationship_level.replace('_', ' ')}</h3>
                <p className="text-sm text-gray-400">{relationshipInfo.description}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-blue-400">{Math.round(profile.relationship_score)}</div>
              <div className="text-xs text-gray-400">Level Score</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-400 mb-2">
              <span>Progress to next level</span>
              <span>{Math.round(profile.relationship_score)}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${getRelationshipProgress()}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="px-6 py-6">
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-800 rounded-xl p-4">
            <div className="flex items-center space-x-2 mb-2">
              <MessageCircle className="w-5 h-5 text-blue-400" />
              <span className="text-sm text-gray-400">Interactions</span>
            </div>
            <div className="text-2xl font-bold">{profile.total_interactions}</div>
          </div>

          <div className="bg-gray-800 rounded-xl p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Heart className="w-5 h-5 text-pink-400" />
              <span className="text-sm text-gray-400">Attachment</span>
            </div>
            <div className="text-2xl font-bold">{Math.round(profile.attachment_score)}%</div>
          </div>

          <div className="bg-gray-800 rounded-xl p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Sparkles className="w-5 h-5 text-yellow-400" />
              <span className="text-sm text-gray-400">Speaking Style</span>
            </div>
            <div className="text-lg font-semibold capitalize">{profile.speaking_style}</div>
          </div>

          <div className="bg-gray-800 rounded-xl p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Clock className="w-5 h-5 text-green-400" />
              <span className="text-sm text-gray-400">Last Chat</span>
            </div>
            <div className="text-sm">
              {new Date(profile.last_interaction_at).toLocaleDateString()}
            </div>
          </div>
        </div>

        {/* Memorable Moments */}
        {profile.memorable_moments && profile.memorable_moments.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-bold mb-4 flex items-center">
              <Star className="w-5 h-5 text-yellow-400 mr-2" />
              Memorable Moments
            </h3>
            <div className="space-y-3">
              {profile.memorable_moments.slice(0, 5).map((moment, index) => (
                <div key={index} className="bg-gray-800 rounded-xl p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-white mb-2">{moment.moment}</p>
                      <div className="text-xs text-gray-400">
                        {new Date(moment.timestamp).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex items-center space-x-1 ml-4">
                      {[...Array(moment.importance)].map((_, i) => (
                        <Star key={i} className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mood History */}
        {profile.mood_history && profile.mood_history.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-bold mb-4 flex items-center">
              <TrendingUp className="w-5 h-5 text-purple-400 mr-2" />
              Recent Moods
            </h3>
            <div className="flex space-x-2 overflow-x-auto">
              {profile.mood_history.slice(-7).reverse().map((moodEntry, index) => (
                <div key={index} className="bg-gray-800 rounded-xl p-3 min-w-[100px] text-center">
                  <div className="text-2xl mb-2">{getMoodEmoji(moodEntry.mood)}</div>
                  <div className="text-sm capitalize">{moodEntry.mood}</div>
                  <div className="text-xs text-gray-400 mt-1">
                    {new Date(moodEntry.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Current Status */}
        <div className="bg-gray-800 rounded-xl p-4">
          <h3 className="text-lg font-bold mb-3">Current Status</h3>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-400">Status</div>
              <div className="text-lg capitalize">{profile.current_status}</div>
            </div>
            {profile.last_emotion_detected && (
              <div>
                <div className="text-sm text-gray-400">Last Emotion</div>
                <div className="text-lg capitalize flex items-center">
                  <span className="mr-2">{getMoodEmoji(profile.last_emotion_detected)}</span>
                  {profile.last_emotion_detected}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function to get mood emoji
const getMoodEmoji = (mood) => {
  const moodEmojis = {
    happy: '😊',
    sad: '😢',
    excited: '🤩',
    calm: '😌',
    anxious: '😰',
    tired: '😴',
    stressed: '😓',
    neutral: '😐',
    energetic: '⚡',
    loved: '🥰',
    motivated: '💪'
  };
  return moodEmojis[mood.toLowerCase()] || '😊';
};

export default ProfileDetails;

