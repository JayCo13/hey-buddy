import React, { useState } from 'react';
import { Mic, AlertCircle } from 'lucide-react';

const MobileMicrophonePermission = ({ onPermissionGranted, onPermissionDenied }) => {
  const [isRequesting, setIsRequesting] = useState(false);
  const [error, setError] = useState(null);

  const requestMicrophonePermission = async () => {
    setIsRequesting(true);
    setError(null);

    try {
      // Check if mediaDevices is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Microphone API not available in this context');
      }

      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000
        }
      });

      // Test the stream
      if (stream && stream.getAudioTracks().length > 0) {
        // Stop the test stream
        stream.getTracks().forEach(track => track.stop());
        
        // Store permission status
        localStorage.setItem('microphonePermissionGranted', 'true');
        localStorage.setItem('microphonePermissionTime', Date.now().toString());
        
        onPermissionGranted();
      } else {
        throw new Error('No audio tracks available');
      }
    } catch (error) {
      console.error('Microphone permission error:', error);
      setError(error.message);
      onPermissionDenied();
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm mx-auto">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Mic className="w-8 h-8 text-blue-600" />
        </div>
        
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Microphone Permission
        </h2>
        
        <p className="text-gray-600 text-sm">
          Allow microphone access to use voice features
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="w-4 h-4 text-red-500 mr-2" />
            <span className="text-sm text-red-700">{error}</span>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <button
          onClick={requestMicrophonePermission}
          disabled={isRequesting}
          className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
        >
          {isRequesting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              Requesting Permission...
            </>
          ) : (
            <>
              <Mic className="w-4 h-4 mr-2" />
              Allow Microphone Access
            </>
          )}
        </button>

        <div className="text-center">
          <button
            onClick={onPermissionDenied}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Skip for now
          </button>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="text-xs text-gray-500 text-center">
          <p className="mb-1">💡 Tip: Grant microphone permission to use voice features</p>
        </div>
      </div>
    </div>
  );
};

export default MobileMicrophonePermission;
