import React, { useState, useEffect } from 'react';
import { Mic, MicOff, AlertCircle, Smartphone, Volume2, VolumeX } from 'lucide-react';

const IOSPWACompatibility = ({ onPermissionGranted, onPermissionDenied }) => {
  const [isIOSPWA, setIsIOSPWA] = useState(false);
  const [audioContextSupported, setAudioContextSupported] = useState(false);
  const [microphoneWorking, setMicrophoneWorking] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResults, setTestResults] = useState({});

  useEffect(() => {
    // Detect iOS PWA
    const detectIOSPWA = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isIOSStandalone = window.navigator.standalone === true;
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
      
      return (isStandalone || isIOSStandalone) && (isIOS || isSafari);
    };

    setIsIOSPWA(detectIOSPWA());
  }, []);

  const testAudioContext = async () => {
    try {
      // Test AudioContext creation
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Test if we can resume (iOS requires user interaction)
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }
      
      setAudioContextSupported(audioContext.state === 'running');
      audioContext.close();
      
      return audioContext.state === 'running';
    } catch (error) {
      console.error('AudioContext test failed:', error);
      setAudioContextSupported(false);
      return false;
    }
  };

  const testMicrophone = async () => {
    try {
      // Test microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000,
          channelCount: 1
        }
      });

      // Test if we can create audio context with the stream
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      
      source.connect(analyser);
      
      // Test audio level detection
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(dataArray);
      
      const hasAudioData = dataArray.some(value => value > 0);
      
      // Clean up
      stream.getTracks().forEach(track => track.stop());
      audioContext.close();
      
      setMicrophoneWorking(!!stream && stream.getAudioTracks().length > 0);
      return !!stream && stream.getAudioTracks().length > 0;
    } catch (error) {
      console.error('Microphone test failed:', error);
      setMicrophoneWorking(false);
      return false;
    }
  };

  const runCompatibilityTest = async () => {
    setIsTesting(true);
    setTestResults({});

    try {
      const audioContextResult = await testAudioContext();
      const microphoneResult = await testMicrophone();

      const results = {
        audioContext: audioContextResult,
        microphone: microphoneResult,
        timestamp: Date.now()
      };

      setTestResults(results);

      // Store results for the app to use
      localStorage.setItem('iosPWACompatibility', JSON.stringify(results));

      if (audioContextResult && microphoneResult) {
        onPermissionGranted();
      } else {
        onPermissionDenied();
      }
    } catch (error) {
      console.error('Compatibility test failed:', error);
      onPermissionDenied();
    } finally {
      setIsTesting(false);
    }
  };

  const openInSafari = () => {
    const currentUrl = window.location.href;
    window.open(currentUrl, '_blank');
  };

  if (!isIOSPWA) {
    return null; // Only show for iOS PWA
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm mx-auto">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Smartphone className="w-8 h-8 text-orange-600" />
        </div>
        
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          iOS PWA Compatibility
        </h2>
        
        <p className="text-gray-600 text-sm">
          Testing voice features compatibility for iOS PWA
        </p>
      </div>

      <div className="space-y-4">
        {/* Test Results */}
        {Object.keys(testResults).length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Volume2 className="w-4 h-4 text-gray-600 mr-2" />
                <span className="text-gray-700">Audio Context</span>
              </div>
              <div className="flex items-center">
                {testResults.audioContext ? (
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                ) : (
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                )}
                <span className={`ml-2 text-sm ${testResults.audioContext ? 'text-green-600' : 'text-red-600'}`}>
                  {testResults.audioContext ? 'Working' : 'Failed'}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Mic className="w-4 h-4 text-gray-600 mr-2" />
                <span className="text-gray-700">Microphone</span>
              </div>
              <div className="flex items-center">
                {testResults.microphone ? (
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                ) : (
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                )}
                <span className={`ml-2 text-sm ${testResults.microphone ? 'text-green-600' : 'text-red-600'}`}>
                  {testResults.microphone ? 'Working' : 'Failed'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* iOS PWA Warning */}
        <div className="p-3 bg-yellow-50 rounded-lg">
          <div className="flex items-start">
            <AlertCircle className="w-4 h-4 text-yellow-600 mr-2 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium mb-1">iOS PWA Limitations</p>
              <p>iOS PWAs have restrictions on audio features. If tests fail, try opening in Safari first.</p>
            </div>
          </div>
        </div>

        {/* Test Button */}
        <button
          onClick={runCompatibilityTest}
          disabled={isTesting}
          className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
        >
          {isTesting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              Testing...
            </>
          ) : (
            <>
              <Mic className="w-4 h-4 mr-2" />
              Test Voice Features
            </>
          )}
        </button>

        {/* Safari Fallback */}
        <button
          onClick={openInSafari}
          className="w-full bg-gray-100 text-gray-700 px-4 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center justify-center"
        >
          <Smartphone className="w-4 h-4 mr-2" />
          Open in Safari Instead
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
          <p className="mb-1">💡 iOS PWA Audio Tips:</p>
          <p>• Grant permissions in Safari first</p>
          <p>• Tap to interact before voice features</p>
          <p>• Use Safari for full functionality</p>
        </div>
      </div>
    </div>
  );
};

export default IOSPWACompatibility;