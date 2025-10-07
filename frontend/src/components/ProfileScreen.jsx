import React, { useState } from 'react';
import { ArrowLeft, Settings, Bell, Moon, Volume2, Mic, LogOut } from 'lucide-react';
import ProfileDetails from './ProfileDetails';
import proactiveService from '../services/proactiveService';

const ProfileScreen = ({ onBack, onNavigate }) => {
  const [view, setView] = useState('profile'); // 'profile' or 'settings'
  const [settings, setSettings] = useState({
    notifications: true,
    darkMode: true,
    soundEffects: true,
    voiceActivation: true,
    proactiveMessages: true
  });

  const handleSettingToggle = (setting) => {
    const newValue = !settings[setting];
    setSettings(prev => ({
      ...prev,
      [setting]: newValue
    }));

    // Update proactive service if toggling proactive messages
    if (setting === 'proactiveMessages') {
      proactiveService.setEnabled(newValue);
      proactiveService.updateSchedule(newValue);
    }
  };

  if (view === 'profile') {
    return (
      <div className="min-h-screen bg-black text-white">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <button onClick={onBack} className="p-2">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold">Profile</h1>
          <button onClick={() => setView('settings')} className="p-2">
            <Settings className="w-6 h-6" />
          </button>
        </div>

        {/* Profile Details */}
        <ProfileDetails />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
        <button onClick={() => setView('profile')} className="p-2">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold">Settings</h1>
        <div className="w-6" />
      </div>

      {/* Settings */}
      <div className="px-6 py-6 pb-20">
        <h3 className="text-lg font-bold mb-4 flex items-center">
          <Settings className="w-5 h-5 mr-2" />
          App Settings
        </h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-800 rounded-xl">
            <div className="flex items-center space-x-3">
              <Bell className="w-5 h-5 text-blue-400" />
              <div>
                <div className="font-medium">Notifications</div>
                <div className="text-xs text-gray-400">General app notifications</div>
              </div>
            </div>
            <button
              onClick={() => handleSettingToggle('notifications')}
              className={`w-12 h-6 rounded-full transition-colors relative ${
                settings.notifications ? 'bg-blue-600' : 'bg-gray-600'
              }`}
            >
              <div className={`w-5 h-5 bg-white rounded-full transition-transform absolute top-0.5 ${
                settings.notifications ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-800 rounded-xl">
            <div className="flex items-center space-x-3">
              <Bell className="w-5 h-5 text-purple-400" />
              <div>
                <div className="font-medium">Proactive Messages</div>
                <div className="text-xs text-gray-400">AI checks in on you</div>
              </div>
            </div>
            <button
              onClick={() => handleSettingToggle('proactiveMessages')}
              className={`w-12 h-6 rounded-full transition-colors relative ${
                settings.proactiveMessages ? 'bg-blue-600' : 'bg-gray-600'
              }`}
            >
              <div className={`w-5 h-5 bg-white rounded-full transition-transform absolute top-0.5 ${
                settings.proactiveMessages ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-800 rounded-xl">
            <div className="flex items-center space-x-3">
              <Moon className="w-5 h-5 text-purple-400" />
              <div>
                <div className="font-medium">Dark Mode</div>
                <div className="text-xs text-gray-400">Always on</div>
              </div>
            </div>
            <button
              onClick={() => handleSettingToggle('darkMode')}
              className={`w-12 h-6 rounded-full transition-colors relative ${
                settings.darkMode ? 'bg-blue-600' : 'bg-gray-600'
              }`}
            >
              <div className={`w-5 h-5 bg-white rounded-full transition-transform absolute top-0.5 ${
                settings.darkMode ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-800 rounded-xl">
            <div className="flex items-center space-x-3">
              <Volume2 className="w-5 h-5 text-green-400" />
              <div>
                <div className="font-medium">Sound Effects</div>
                <div className="text-xs text-gray-400">UI sounds</div>
              </div>
            </div>
            <button
              onClick={() => handleSettingToggle('soundEffects')}
              className={`w-12 h-6 rounded-full transition-colors relative ${
                settings.soundEffects ? 'bg-blue-600' : 'bg-gray-600'
              }`}
            >
              <div className={`w-5 h-5 bg-white rounded-full transition-transform absolute top-0.5 ${
                settings.soundEffects ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-800 rounded-xl">
            <div className="flex items-center space-x-3">
              <Mic className="w-5 h-5 text-red-400" />
              <div>
                <div className="font-medium">Voice Activation</div>
                <div className="text-xs text-gray-400">Hey Buddy wake word</div>
              </div>
            </div>
            <button
              onClick={() => handleSettingToggle('voiceActivation')}
              className={`w-12 h-6 rounded-full transition-colors relative ${
                settings.voiceActivation ? 'bg-blue-600' : 'bg-gray-600'
              }`}
            >
              <div className={`w-5 h-5 bg-white rounded-full transition-transform absolute top-0.5 ${
                settings.voiceActivation ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>
        </div>

        {/* Logout */}
        <div className="mt-8">
          <button className="w-full py-4 bg-red-600 hover:bg-red-700 rounded-xl font-medium flex items-center justify-center space-x-2 transition-colors">
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileScreen;