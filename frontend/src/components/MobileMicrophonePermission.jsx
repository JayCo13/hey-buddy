import React, { useState, useEffect } from 'react';
import { Mic, MicOff, AlertCircle, Smartphone, Globe } from 'lucide-react';

const MobileMicrophonePermission = ({ onPermissionGranted, onPermissionDenied }) => {
  const [isRequesting, setIsRequesting] = useState(false);
  const [error, setError] = useState(null);
  const [isPWA, setIsPWA] = useState(false);

  useEffect(() => {
    // Check if running as PWA
    const checkPWA = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isIOSPWA = window.navigator.standalone === true;
      setIsPWA(isStandalone || isIOSPWA);
    };
    
    checkPWA();
  }, []);

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

  const openInBrowser = () => {
    // Try to open the current URL in the browser
    const currentUrl = window.location.href;
    window.open(currentUrl, '_blank');
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm mx-auto">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          {isPWA ? (
            <Smartphone className="w-8 h-8 text-blue-600" />
          ) : (
            <Mic className="w-8 h-8 text-blue-600" />
          )}
        </div>
        
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          {isPWA ? 'Mobile Microphone Access' : 'Microphone Permission'}
        </h2>
        
        <p className="text-gray-600 text-sm">
          {isPWA 
            ? 'This PWA needs microphone access to work with voice commands'
            : 'Allow microphone access to use voice features'
          }
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
        {isPWA && (
          <div className="p-3 bg-yellow-50 rounded-lg">
            <div className="flex items-start">
              <AlertCircle className="w-4 h-4 text-yellow-600 mr-2 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium mb-1">Running as PWA</p>
                <p>If microphone access fails, try opening the app in Safari first to grant permissions.</p>
              </div>
            </div>
          </div>
        )}

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

        {isPWA && (
          <button
            onClick={openInBrowser}
            className="w-full bg-gray-100 text-gray-700 px-4 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center justify-center"
          >
            <Globe className="w-4 h-4 mr-2" />
            Open in Browser Instead
          </button>
        )}

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
          <p className="mb-1">💡 Tip: Grant microphone permission in Safari first</p>
          <p>Then install the PWA for full functionality</p>
        </div>
      </div>
    </div>
  );
};

export default MobileMicrophonePermission;
