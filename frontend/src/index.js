import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// PWA Install Prompt Setup
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  window.deferredPrompt = e;
  console.log('Install prompt available');
});

// Service Worker Registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Try to register the service worker
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('✅ Service Worker registered successfully:', registration);
        
        // Handle updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New content is available, notify user
              if (window.confirm('New version available! Reload to update?')) {
                window.location.reload();
              }
            }
          });
        });
      })
      .catch((registrationError) => {
        console.error('❌ Service Worker registration failed:', registrationError);
        
        // If registration fails, try to create a minimal service worker
        if (registrationError.message.includes('404') || registrationError.message.includes('bad HTTP response')) {
          console.log('🔧 Service worker file not found, creating fallback...');
          createFallbackServiceWorker();
        }
      });
  });
} else {
  console.log('⚠️ Service Worker not supported in this browser');
}

// Fallback service worker creation
function createFallbackServiceWorker() {
  const fallbackSW = `
// Fallback Service Worker
self.addEventListener('install', () => {
  console.log('Fallback SW installed');
  self.skipWaiting();
});

self.addEventListener('activate', () => {
  console.log('Fallback SW activated');
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Simple pass-through for now
  event.respondWith(fetch(event.request));
});
`;

  // Create a blob URL for the service worker
  const blob = new Blob([fallbackSW], { type: 'application/javascript' });
  const swUrl = URL.createObjectURL(blob);
  
  navigator.serviceWorker.register(swUrl)
    .then((registration) => {
      console.log('✅ Fallback Service Worker registered:', registration);
    })
    .catch((error) => {
      console.error('❌ Fallback Service Worker also failed:', error);
    });
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
