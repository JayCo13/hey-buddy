import React, { useState, useEffect } from 'react';
import { X, MessageCircle, Heart } from 'lucide-react';

const ProactiveNotification = ({ message, context, onClose, onRespond }) => {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Fade in animation
    setTimeout(() => setVisible(true), 100);

    // Auto-dismiss after 30 seconds if not interacted with
    const autoDismissTimer = setTimeout(() => {
      handleDismiss();
    }, 30000);

    return () => clearTimeout(autoDismissTimer);
  }, []);

  const handleDismiss = () => {
    setVisible(false);
    setTimeout(() => {
      setDismissed(true);
      if (onClose) onClose();
    }, 300);
  };

  const handleRespond = () => {
    if (onRespond) onRespond(message);
    handleDismiss();
  };

  if (dismissed) return null;

  return (
    <div 
      className={`fixed top-4 left-4 right-4 z-50 transition-all duration-300 transform ${
        visible ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'
      }`}
    >
      <div className="bg-gradient-to-r from-blue-900/95 to-purple-900/95 backdrop-blur-lg rounded-2xl shadow-2xl border border-blue-500/30 overflow-hidden">
        {/* Animated gradient border */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-blue-500/20 animate-pulse" />
        
        <div className="relative p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center animate-pulse">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-white font-semibold text-sm">Hey Buddy</div>
                <div className="text-blue-200 text-xs">Checking in on you</div>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-white/70" />
            </button>
          </div>

          {/* Message */}
          <div className="mb-4">
            <p className="text-white text-base leading-relaxed">{message}</p>
          </div>

          {/* Context info */}
          {context && (
            <div className="mb-4 flex items-center space-x-4 text-xs text-blue-200">
              {context.relationship_level && (
                <span className="capitalize">Level: {context.relationship_level.replace('_', ' ')}</span>
              )}
              {context.speaking_style && (
                <span className="capitalize">Style: {context.speaking_style}</span>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-3">
            <button
              onClick={handleRespond}
              className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-medium text-white transition-colors flex items-center justify-center space-x-2"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Respond</span>
            </button>
            <button
              onClick={handleDismiss}
              className="px-4 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-medium text-white transition-colors"
            >
              Later
            </button>
          </div>
        </div>

        {/* Bottom accent line */}
        <div className="h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 animate-pulse" />
      </div>
    </div>
  );
};

export default ProactiveNotification;

