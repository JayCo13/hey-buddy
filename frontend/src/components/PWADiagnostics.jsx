import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Mic, Volume2 } from 'lucide-react';

const PWADiagnostics = () => {
  const [diagnostics, setDiagnostics] = useState({
    serviceWorker: false,
    microphone: false,
    audio: false,
    webAssembly: false,
    localStorage: false,
    manifest: false
  });

  const [errors, setErrors] = useState([]);

  useEffect(() => {
    runDiagnostics();
  }, []);

  const runDiagnostics = async () => {
    const results = { ...diagnostics };
    const errorList = [];

    // Check Service Worker
    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        results.serviceWorker = !!registration;
        if (!registration) {
          errorList.push('Service Worker not registered');
        }
      } else {
        errorList.push('Service Worker not supported');
      }
    } catch (error) {
      errorList.push(`Service Worker error: ${error.message}`);
    }

    // Check Microphone
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        results.microphone = !!stream;
        stream.getTracks().forEach(track => track.stop());
      } else {
        errorList.push('Microphone API not available - may need to run in browser first');
        results.microphone = false;
      }
    } catch (error) {
      errorList.push(`Microphone error: ${error.message}`);
      results.microphone = false;
    }

    // Check Audio Context
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      results.audio = !!audioContext;
      audioContext.close();
    } catch (error) {
      errorList.push(`Audio Context error: ${error.message}`);
    }

    // Check WebAssembly
    try {
      results.webAssembly = typeof WebAssembly === 'object';
      if (!results.webAssembly) {
        errorList.push('WebAssembly not supported');
      }
    } catch (error) {
      errorList.push(`WebAssembly error: ${error.message}`);
    }

    // Check Local Storage
    try {
      localStorage.setItem('test', 'test');
      localStorage.removeItem('test');
      results.localStorage = true;
    } catch (error) {
      errorList.push(`Local Storage error: ${error.message}`);
    }

    // Check Manifest
    try {
      const manifestLink = document.querySelector('link[rel="manifest"]');
      results.manifest = !!manifestLink;
      if (!manifestLink) {
        errorList.push('Manifest not found');
      }
    } catch (error) {
      errorList.push(`Manifest error: ${error.message}`);
    }

    setDiagnostics(results);
    setErrors(errorList);
  };

  const getStatusIcon = (status) => {
    if (status) return <CheckCircle className="w-5 h-5 text-green-500" />;
    return <XCircle className="w-5 h-5 text-red-500" />;
  };

  const getStatusText = (status) => {
    return status ? 'Working' : 'Failed';
  };

  const getStatusColor = (status) => {
    return status ? 'text-green-600' : 'text-red-600';
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
      <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
        <AlertCircle className="w-6 h-6 text-blue-500 mr-2" />
        PWA Diagnostics
      </h2>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Mic className="w-4 h-4 text-gray-600 mr-2" />
            <span className="text-gray-700">Service Worker</span>
          </div>
          <div className="flex items-center">
            {getStatusIcon(diagnostics.serviceWorker)}
            <span className={`ml-2 text-sm ${getStatusColor(diagnostics.serviceWorker)}`}>
              {getStatusText(diagnostics.serviceWorker)}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Mic className="w-4 h-4 text-gray-600 mr-2" />
            <span className="text-gray-700">Microphone</span>
          </div>
          <div className="flex items-center">
            {getStatusIcon(diagnostics.microphone)}
            <span className={`ml-2 text-sm ${getStatusColor(diagnostics.microphone)}`}>
              {getStatusText(diagnostics.microphone)}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Volume2 className="w-4 h-4 text-gray-600 mr-2" />
            <span className="text-gray-700">Audio Context</span>
          </div>
          <div className="flex items-center">
            {getStatusIcon(diagnostics.audio)}
            <span className={`ml-2 text-sm ${getStatusColor(diagnostics.audio)}`}>
              {getStatusText(diagnostics.audio)}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <AlertCircle className="w-4 h-4 text-gray-600 mr-2" />
            <span className="text-gray-700">WebAssembly</span>
          </div>
          <div className="flex items-center">
            {getStatusIcon(diagnostics.webAssembly)}
            <span className={`ml-2 text-sm ${getStatusColor(diagnostics.webAssembly)}`}>
              {getStatusText(diagnostics.webAssembly)}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <AlertCircle className="w-4 h-4 text-gray-600 mr-2" />
            <span className="text-gray-700">Local Storage</span>
          </div>
          <div className="flex items-center">
            {getStatusIcon(diagnostics.localStorage)}
            <span className={`ml-2 text-sm ${getStatusColor(diagnostics.localStorage)}`}>
              {getStatusText(diagnostics.localStorage)}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <AlertCircle className="w-4 h-4 text-gray-600 mr-2" />
            <span className="text-gray-700">Manifest</span>
          </div>
          <div className="flex items-center">
            {getStatusIcon(diagnostics.manifest)}
            <span className={`ml-2 text-sm ${getStatusColor(diagnostics.manifest)}`}>
              {getStatusText(diagnostics.manifest)}
            </span>
          </div>
        </div>
      </div>

      {errors.length > 0 && (
        <div className="mt-4 p-3 bg-red-50 rounded-lg">
          <h3 className="text-sm font-medium text-red-800 mb-2">Issues Found:</h3>
          <ul className="text-sm text-red-700 space-y-1">
            {errors.map((error, index) => (
              <li key={index}>• {error}</li>
            ))}
          </ul>
        </div>
      )}

      <button
        onClick={runDiagnostics}
        className="w-full mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
      >
        Run Diagnostics Again
      </button>
    </div>
  );
};

export default PWADiagnostics;
