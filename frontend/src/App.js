import React, { useEffect, useState } from 'react';
import './App.css';
import { initializeDatabase } from './db/database';
import { register } from './utils/serviceWorkerRegistration';
import NotesManager from './components/NotesManager';

function App() {
  const [dbReady, setDbReady] = useState(false);
  const [userId] = useState('1'); // Mock user ID for demo

  useEffect(() => {
    // Initialize database
    const initDB = async () => {
      const success = await initializeDatabase();
      setDbReady(success);
    };
    
    initDB();

    // Register service worker
    register({
      onSuccess: (registration) => {
        console.log('Service worker registration successful:', registration);
      },
      onUpdate: (registration) => {
        console.log('Service worker update available:', registration);
      }
    });
  }, []);

  if (!dbReady) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing database...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <header className="bg-blue-600 text-white p-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold">Hey Buddy</h1>
          <p className="text-blue-100">AI-Powered Productivity App</p>
        </div>
      </header>
      
      <main className="min-h-screen bg-gray-50">
        <NotesManager userId={userId} />
      </main>
    </div>
  );
}

export default App;
