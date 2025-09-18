import React, { useState, useEffect } from 'react';
import { X, Download, Smartphone, Monitor } from 'lucide-react';
import serviceWorkerManager from '../utils/serviceWorker';

const PWAInstallPrompt = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [platform, setPlatform] = useState('unknown');

  useEffect(() => {
    // Check if app is already installed
    setIsInstalled(serviceWorkerManager.isAppInstalled());

    // Detect platform
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes('android')) {
      setPlatform('android');
    } else if (userAgent.includes('iphone') || userAgent.includes('ipad')) {
      setPlatform('ios');
    } else if (userAgent.includes('windows') || userAgent.includes('mac') || userAgent.includes('linux')) {
      setPlatform('desktop');
    }

    // Show install prompt after a delay if not installed
    if (!serviceWorkerManager.isAppInstalled()) {
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 10000); // Show after 10 seconds

      return () => clearTimeout(timer);
    }
  }, []);

  const handleInstall = async () => {
    try {
      const success = await serviceWorkerManager.showInstallPrompt();
      if (success) {
        setShowPrompt(false);
        setIsInstalled(true);
      }
    } catch (error) {
      console.error('Installation failed:', error);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Don't show again for this session
    sessionStorage.setItem('pwa-install-dismissed', 'true');
  };

  // Don't show if already installed or dismissed
  if (isInstalled || !showPrompt || sessionStorage.getItem('pwa-install-dismissed')) {
    return null;
  }

  const getInstallInstructions = () => {
    switch (platform) {
      case 'android':
        return {
          title: 'Install Hey Buddy',
          description: 'Add Hey Buddy to your home screen for quick access',
          steps: [
            'Tap the menu button (⋮) in your browser',
            'Select "Add to Home screen" or "Install app"',
            'Tap "Add" to confirm'
          ]
        };
      case 'ios':
        return {
          title: 'Install Hey Buddy',
          description: 'Add Hey Buddy to your home screen',
          steps: [
            'Tap the Share button (□↗) at the bottom',
            'Scroll down and tap "Add to Home Screen"',
            'Tap "Add" to confirm'
          ]
        };
      case 'desktop':
        return {
          title: 'Install Hey Buddy',
          description: 'Install Hey Buddy as a desktop app',
          steps: [
            'Click the install button below',
            'Or look for the install icon in your browser\'s address bar',
            'Click "Install" when prompted'
          ]
        };
      default:
        return {
          title: 'Install Hey Buddy',
          description: 'Install Hey Buddy for better experience',
          steps: [
            'Look for the install option in your browser',
            'Follow the browser\'s installation prompts'
          ]
        };
    }
  };

  const instructions = getInstallInstructions();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl p-6 max-w-md w-full mx-4 border border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-white">{instructions.title}</h3>
          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="mb-6">
          <p className="text-gray-300 mb-4">{instructions.description}</p>
          
          <div className="flex items-center justify-center mb-4">
            {platform === 'android' || platform === 'ios' ? (
              <Smartphone className="text-blue-500" size={48} />
            ) : (
              <Monitor className="text-blue-500" size={48} />
            )}
          </div>

          <div className="space-y-2">
            {instructions.steps.map((step, index) => (
              <div key={index} className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                  {index + 1}
                </span>
                <p className="text-gray-300 text-sm">{step}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={handleInstall}
            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center justify-center space-x-2"
          >
            <Download size={20} />
            <span>Install App</span>
          </button>
          
          <button
            onClick={handleDismiss}
            className="px-4 py-3 text-gray-400 hover:text-white transition-colors"
          >
            Maybe Later
          </button>
        </div>

        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            Installing gives you offline access and faster loading
          </p>
        </div>
      </div>
    </div>
  );
};

export default PWAInstallPrompt;
