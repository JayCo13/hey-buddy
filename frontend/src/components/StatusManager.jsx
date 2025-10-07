import React, { useState, useEffect } from 'react';
import { X, Moon, Coffee, Zap, DoorClosed, Clock } from 'lucide-react';
import profileService from '../services/profileService';
import proactiveService from '../services/proactiveService';

const StatusManager = ({ onClose, onStatusChange }) => {
  const [selectedStatus, setSelectedStatus] = useState('available');
  const [quietDuration, setQuietDuration] = useState(30);
  const [proactiveEnabled, setProactiveEnabled] = useState(true);
  const [loadingSchedule, setLoadingSchedule] = useState(true);

  const statuses = [
    {
      id: 'available',
      label: 'Available',
      description: 'AI can check in anytime',
      icon: Zap,
      color: 'green'
    },
    {
      id: 'busy',
      label: 'Busy',
      description: 'Only urgent notifications',
      icon: Coffee,
      color: 'yellow'
    },
    {
      id: 'tired',
      label: 'Tired',
      description: 'AI will be gentle',
      icon: Moon,
      color: 'purple'
    },
    {
      id: 'do_not_disturb',
      label: 'Do Not Disturb',
      description: 'No AI messages',
      icon: DoorClosed,
      color: 'red'
    }
  ];

  const quietDurations = [
    { value: 15, label: '15 min' },
    { value: 30, label: '30 min' },
    { value: 60, label: '1 hour' },
    { value: 120, label: '2 hours' },
    { value: 240, label: '4 hours' }
  ];

  useEffect(() => {
    let isMounted = true;
    const loadSchedule = async () => {
      try {
        const data = await proactiveService.getSchedule();
        if (isMounted && data) {
          setProactiveEnabled(!!data.proactive_enabled);
        }
      } finally {
        if (isMounted) setLoadingSchedule(false);
      }
    };
    loadSchedule();
    return () => { isMounted = false; };
  }, []);

  const handleApply = async () => {
    const quietMinutes = selectedStatus === 'do_not_disturb' ? quietDuration : null;
    
    const result = await profileService.updateStatus(selectedStatus, quietMinutes);
    await proactiveService.updateSchedule(proactiveEnabled, null);
    
    if (result) {
      if (onStatusChange) {
        onStatusChange(selectedStatus, quietMinutes);
      }
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 px-4">
      <div className="bg-gray-900 rounded-2xl max-w-md w-full p-6 relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Your Status</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        {/* Status Options */}
        <div className="space-y-3 mb-6">
          {statuses.map((status) => {
            const Icon = status.icon;
            const isSelected = selectedStatus === status.id;
            
            return (
              <button
                key={status.id}
                onClick={() => setSelectedStatus(status.id)}
                className={`w-full p-4 rounded-xl flex items-center space-x-4 transition-all ${
                  isSelected
                    ? `bg-${status.color}-500/20 border-2 border-${status.color}-500`
                    : 'bg-gray-800 border-2 border-transparent hover:border-gray-700'
                }`}
              >
                <div className={`w-12 h-12 rounded-full bg-${status.color}-500/20 flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 text-${status.color}-400`} />
                </div>
                <div className="flex-1 text-left">
                  <div className="text-white font-semibold">{status.label}</div>
                  <div className="text-sm text-gray-400">{status.description}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Proactive toggle */}
        <div className="mb-6 p-4 bg-gray-800 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-white font-medium">Proactive check-ins</div>
              <div className="text-sm text-gray-400">Let AI gently reach out at good times</div>
            </div>
            <button
              disabled={loadingSchedule}
              onClick={() => setProactiveEnabled((v) => !v)}
              aria-label="Toggle proactive check-ins"
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                proactiveEnabled ? 'bg-blue-600' : 'bg-gray-600'
              } ${loadingSchedule ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  proactiveEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Quiet Duration (only for Do Not Disturb) */}
        {selectedStatus === 'do_not_disturb' && (
          <div className="mb-6 p-4 bg-gray-800 rounded-xl">
            <div className="flex items-center space-x-2 mb-3">
              <Clock className="w-5 h-5 text-red-400" />
              <span className="text-white font-medium">Quiet for:</span>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {quietDurations.map((duration) => (
                <button
                  key={duration.value}
                  onClick={() => setQuietDuration(duration.value)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    quietDuration === duration.value
                      ? 'bg-red-500 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {duration.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl font-medium text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-medium text-white transition-colors"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
};

export default StatusManager;

