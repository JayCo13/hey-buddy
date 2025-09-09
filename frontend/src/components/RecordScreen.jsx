import React, { useState } from 'react';
import { Signal, Wifi, Battery, Mic, Play, Pause, Home, User } from 'lucide-react';

const RecordScreen = ({ onNavigate }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [activeTab, setActiveTab] = useState('record');

  const handleStartRecording = () => {
    setIsRecording(!isRecording);
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    onNavigate(tabId);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Status Bar */}
      <div className="flex justify-between items-center px-6 py-2 text-sm">
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
      <div className="px-6 py-4">
        <h1 className="text-2xl font-bold">Record Audio</h1>
        <p className="text-gray-300 mt-2">Capture your voice and convert it to text</p>
      </div>

      {/* Main Recording Area */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        {/* Recording Visualizer */}
        <div className="mb-8">
          <div className="w-32 h-32 bg-gray-800 rounded-full flex items-center justify-center mb-6">
            <Mic className="w-16 h-16 text-gray-300" />
          </div>
          
          {/* Audio Waveform */}
          <div className="flex justify-center space-x-1">
            {[...Array(12)].map((_, i) => (
              <div 
                key={i} 
                className={`rounded-sm ${
                  isRecording ? 'bg-blue-500 animate-pulse' : 'bg-gray-600'
                }`}
                style={{ 
                  width: '4px', 
                  height: `${Math.random() * 30 + 15}px`,
                  animationDelay: `${i * 0.1}s`
                }}
              ></div>
            ))}
          </div>
        </div>

        {/* Recording Controls */}
        <div className="text-center">
          <button
            onClick={handleStartRecording}
            className={`w-20 h-20 rounded-full flex items-center justify-center transition-colors ${
              isRecording 
                ? 'bg-red-600 hover:bg-red-700' 
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isRecording ? (
              <Pause className="w-8 h-8 text-white" />
            ) : (
              <Play className="w-8 h-8 text-white" />
            )}
          </button>
          
          <p className="text-gray-300 mt-4 text-lg">
            {isRecording ? 'Recording...' : 'Tap to start recording'}
          </p>
          
          {isRecording && (
            <p className="text-blue-400 mt-2 font-mono text-xl">
              {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
            </p>
          )}
        </div>

        {/* Recent Recordings */}
        <div className="mt-12 w-full">
          <h3 className="text-lg font-semibold mb-4">Recent Recordings</h3>
          <div className="space-y-3">
            {[
              { id: 1, title: 'Meeting Notes', duration: '2:34', date: 'Today' },
              { id: 2, title: 'Voice Memo', duration: '0:45', date: 'Yesterday' },
              { id: 3, title: 'Interview Prep', duration: '5:12', date: '2 days ago' }
            ].map((recording) => (
              <div key={recording.id} className="bg-gray-800 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <h4 className="font-medium">{recording.title}</h4>
                  <p className="text-sm text-gray-400">{recording.duration} • {recording.date}</p>
                </div>
                <button className="w-8 h-8 bg-gray-700 hover:bg-gray-600 rounded-full flex items-center justify-center transition-colors">
                  <Play className="w-4 h-4 text-gray-300" />
                </button>
              </div>
            ))}
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
    </div>
  );
};

export default RecordScreen;
