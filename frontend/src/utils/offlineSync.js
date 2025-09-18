// Offline Data Sync Utility
class OfflineSyncManager {
  constructor() {
    this.isOnline = navigator.onLine;
    this.syncQueue = [];
    this.syncInProgress = false;
    this.setupEventListeners();
  }

  setupEventListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.handleOnline();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.handleOffline();
    });
  }

  // Add action to sync queue when offline
  queueAction(action) {
    const actionWithId = {
      id: Date.now() + Math.random(),
      timestamp: new Date().toISOString(),
      ...action
    };

    this.syncQueue.push(actionWithId);
    this.saveSyncQueue();
    
    console.log('Action queued for sync:', actionWithId);
    return actionWithId.id;
  }

  // Save sync queue to localStorage
  saveSyncQueue() {
    try {
      localStorage.setItem('hey-buddy-sync-queue', JSON.stringify(this.syncQueue));
    } catch (error) {
      console.error('Failed to save sync queue:', error);
    }
  }

  // Load sync queue from localStorage
  loadSyncQueue() {
    try {
      const saved = localStorage.getItem('hey-buddy-sync-queue');
      if (saved) {
        this.syncQueue = JSON.parse(saved);
      }
    } catch (error) {
      console.error('Failed to load sync queue:', error);
      this.syncQueue = [];
    }
  }

  // Handle coming back online
  async handleOnline() {
    console.log('Connection restored, starting sync...');
    
    if (this.syncQueue.length > 0) {
      await this.syncQueuedActions();
    }
  }

  // Handle going offline
  handleOffline() {
    console.log('Connection lost, switching to offline mode');
    this.showOfflineNotification();
  }

  // Sync all queued actions
  async syncQueuedActions() {
    if (this.syncInProgress || this.syncQueue.length === 0) {
      return;
    }

    this.syncInProgress = true;
    console.log(`Syncing ${this.syncQueue.length} queued actions...`);

    const actionsToSync = [...this.syncQueue];
    const successfulActions = [];
    const failedActions = [];

    for (const action of actionsToSync) {
      try {
        await this.syncAction(action);
        successfulActions.push(action);
      } catch (error) {
        console.error('Failed to sync action:', action, error);
        failedActions.push(action);
      }
    }

    // Remove successful actions from queue
    this.syncQueue = failedActions;
    this.saveSyncQueue();

    this.syncInProgress = false;

    if (successfulActions.length > 0) {
      this.showSyncSuccessNotification(successfulActions.length);
    }

    if (failedActions.length > 0) {
      this.showSyncFailureNotification(failedActions.length);
    }
  }

  // Sync individual action
  async syncAction(action) {
    const { type, data, endpoint } = action;

    const requestOptions = {
      method: type === 'create' ? 'POST' : type === 'update' ? 'PUT' : 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    };

    const response = await fetch(endpoint, requestOptions);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  // Show offline notification
  showOfflineNotification() {
    if ('serviceWorker' in navigator && 'Notification' in window) {
      navigator.serviceWorker.ready.then(registration => {
        registration.showNotification('Hey Buddy - Offline Mode', {
          body: 'You\'re now offline. Your actions will be synced when connection is restored.',
          icon: '/logo192.png',
          badge: '/logo192.png',
          tag: 'offline-notification'
        });
      });
    }
  }

  // Show sync success notification
  showSyncSuccessNotification(count) {
    if ('serviceWorker' in navigator && 'Notification' in window) {
      navigator.serviceWorker.ready.then(registration => {
        registration.showNotification('Hey Buddy - Sync Complete', {
          body: `Successfully synced ${count} action${count > 1 ? 's' : ''} to the server.`,
          icon: '/logo192.png',
          badge: '/logo192.png',
          tag: 'sync-success'
        });
      });
    }
  }

  // Show sync failure notification
  showSyncFailureNotification(count) {
    if ('serviceWorker' in navigator && 'Notification' in window) {
      navigator.serviceWorker.ready.then(registration => {
        registration.showNotification('Hey Buddy - Sync Issues', {
          body: `Failed to sync ${count} action${count > 1 ? 's' : ''}. Will retry when connection improves.`,
          icon: '/logo192.png',
          badge: '/logo192.png',
          tag: 'sync-failure'
        });
      });
    }
  }

  // Get sync status
  getSyncStatus() {
    return {
      isOnline: this.isOnline,
      queueLength: this.syncQueue.length,
      syncInProgress: this.syncInProgress
    };
  }

  // Clear sync queue (use with caution)
  clearSyncQueue() {
    this.syncQueue = [];
    this.saveSyncQueue();
    console.log('Sync queue cleared');
  }

  // Initialize offline sync
  init() {
    this.loadSyncQueue();
    console.log('Offline sync manager initialized');
  }
}

// Create singleton instance
const offlineSyncManager = new OfflineSyncManager();

export default offlineSyncManager;
