import React, { useState } from 'react';
import { useVoiceActivation } from '../contexts/VoiceActivationContext';
import { Signal, Wifi, Battery, ArrowLeft, Edit3, Mail, Phone, Calendar, Home, Mic, User } from 'lucide-react';

const ProfileScreen = ({ onBack, onNavigate }) => {
  const [profileData, setProfileData] = useState({
    username: 'JaydenCo111',
    email: 'designer.gabut@gmail.com',
    phone: '+62812 2202 1122',
    dateOfBirth: '12/10/00'
  });

  const [activeTab, setActiveTab] = useState('profile');
  
  // Voice activation context
  const { showLoading } = useVoiceActivation();

  const handleInputChange = (field, value) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    // Save profile data logic here
    console.log('Profile saved:', profileData);
    onBack();
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    if (tabId === 'home') {
      onNavigate('home');
    } else if (tabId === 'record') {
      onNavigate('record');
    }
  };

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">

      {/* Galaxy Animation Background */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900/20 via-transparent to-blue-900/10"></div>
        
        {/* Animated stars */}
        <div className="absolute inset-0">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute w-0.5 h-0.5 bg-white rounded-full opacity-60 animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }}
            />
          ))}
        </div>
        
        {/* Larger twinkling stars */}
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <div
              key={`large-${i}`}
              className="absolute w-1 h-1 bg-blue-100 rounded-full opacity-40 animate-ping"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 4}s`,
                animationDuration: `${3 + Math.random() * 2}s`
              }}
            />
          ))}
        </div>
        
        {/* Subtle nebula effects */}
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s' }}></div>
        <div className="absolute bottom-1/3 right-1/4 w-24 h-24 bg-purple-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 right-1/3 w-20 h-20 bg-cyan-500/5 rounded-full blur-2xl animate-pulse" style={{ animationDuration: '10s', animationDelay: '4s' }}></div>
      </div>
      {/* Status Bar */}
      <div className="flex justify-between items-center px-6 py-2 text-sm relative z-10">
        <span className="font-medium">9:41</span>
        <div className="flex items-center space-x-1">
          <div className="flex space-x-1">
            <Signal className="w-3 h-3 text-gray-300" />
          </div>
          <Wifi className="w-4 h-4 text-gray-300" />
          <div className="w-6 h-3 border border-gray-300 rounded-sm">
            <div className="w-4 h-2 bg-gray-300 rounded-sm m-0.5"></div>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 relative z-10">
        <button
          onClick={onBack}
          className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-700 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-300" />
        </button>
        
        <h1 className="text-xl font-bold">Edit Profile</h1>
        
        <button
          onClick={handleSave}
          className="text-blue-400 font-semibold hover:text-blue-300 transition-colors"
        >
          Save
        </button>
      </div>

      {/* Profile Section */}
      <div className="px-6 mb-8">
        {/* Profile Picture */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="w-32 h-32 bg-gray-800 rounded-full flex items-center justify-center text-6xl relative overflow-hidden">
              <span>🧑‍💻</span>
              {/* Animated fish */}
              <div className="absolute inset-0">
                <div className="absolute top-2 left-4 text-yellow-400 text-lg animate-bounce" style={{ animationDelay: '0s' }}>🐠</div>
                <div className="absolute top-6 right-6 text-yellow-400 text-lg animate-bounce" style={{ animationDelay: '0.5s' }}>🐠</div>
                <div className="absolute bottom-4 left-6 text-yellow-400 text-lg animate-bounce" style={{ animationDelay: '1s' }}>🐠</div>
                <div className="absolute bottom-6 right-4 text-yellow-400 text-lg animate-bounce" style={{ animationDelay: '1.5s' }}>🐠</div>
              </div>
            </div>
          </div>
        </div>

        {/* Username */}
        <div className="flex items-center justify-center mb-8">
          <h2 className="text-2xl font-bold mr-2">{profileData.username}</h2>
          <button className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors">
            <Edit3 className="w-3 h-3 text-white" />
          </button>
        </div>

        {/* Input Fields */}
        <div className="space-y-4">
          {/* Email Field */}
          <div className="bg-gray-800 rounded-2xl p-4 flex items-center">
            <div className="w-10 h-10 bg-gray-700 rounded-xl flex items-center justify-center mr-4">
              <Mail className="w-5 h-5 text-gray-300" />
            </div>
            <input
              type="email"
              value={profileData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className="flex-1 bg-transparent text-white placeholder-gray-400 focus:outline-none"
              placeholder="Enter your email"
            />
          </div>

          {/* Phone Field */}
          <div className="bg-gray-800 rounded-2xl p-4 flex items-center">
            <div className="w-10 h-10 bg-gray-700 rounded-xl flex items-center justify-center mr-4">
              <Phone className="w-5 h-5 text-gray-300" />
            </div>
            <input
              type="tel"
              value={profileData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              className="flex-1 bg-transparent text-white placeholder-gray-400 focus:outline-none"
              placeholder="Enter your phone number"
            />
          </div>

          {/* Date of Birth Field */}
          <div className="bg-gray-800 rounded-2xl p-4 flex items-center">
            <div className="w-10 h-10 bg-gray-700 rounded-xl flex items-center justify-center mr-4">
              <Calendar className="w-5 h-5 text-gray-300" />
            </div>
            <input
              type="text"
              value={profileData.dateOfBirth}
              onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
              className="flex-1 bg-transparent text-white placeholder-gray-400 focus:outline-none"
              placeholder="MM/DD/YY"
            />
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-gray-900/95 via-gray-800/90 to-gray-800/80 backdrop-blur-xl border-t border-gray-600/30 shadow-2xl">
        <div className="flex items-center justify-around py-3">
          {[
            { id: 'home', label: 'Home', icon: Home },
            { id: 'record', label: 'Record', icon: Mic },
            { id: 'profile', label: 'Profile', icon: User }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex flex-col items-center py-2 px-4 rounded-xl transition-all duration-300 transform hover:scale-105 ${
                activeTab === tab.id 
                  ? 'text-blue-400 bg-blue-500/10 shadow-lg shadow-blue-500/20 border border-blue-500/20' 
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/30'
              }`}
            >
              <tab.icon className="w-5 h-5 mb-1" />
              <span className="text-xs font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
      
      {/* Voice Activation Loading Overlay */}
      {showLoading && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white text-lg font-medium">Listening...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileScreen;
