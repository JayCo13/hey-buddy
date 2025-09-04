import { syncQueueService, settingsService } from './databaseService';

// Backend API configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8001/api/v1';

class SyncService {
  constructor() {
    this.isOnline = navigator.onLine;
    this.syncInProgress = false;
    this.setupNetworkListeners();
  }

  // Setup network status listeners
  setupNetworkListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.handleOnline();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.handleOffline();
    });
  }

  // Handle coming back online
  async handleOnline() {
    console.log('Back online, starting sync...');
    await this.processSyncQueue();
  }

  // Handle going offline
  handleOffline() {
    console.log('Gone offline, queuing operations...');
  }

  // Check if online
  isOnlineStatus() {
    return this.isOnline;
  }

  // Generic API request with error handling
  async apiRequest(endpoint, options = {}) {
    try {
      const token = localStorage.getItem('access_token');
      const headers = {
        'Content-Type': 'application/json',
        ...options.headers
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Add operation to sync queue
  async queueOperation(operation, table, data) {
    try {
      await syncQueueService.addSyncOperation(operation, table, data);
      console.log(`Queued ${operation} operation for ${table}`);
    } catch (error) {
      console.error('Failed to queue operation:', error);
    }
  }

  // Process sync queue
  async processSyncQueue() {
    if (this.syncInProgress || !this.isOnline) {
      return;
    }

    this.syncInProgress = true;
    console.log('Processing sync queue...');

    try {
      const operations = await syncQueueService.getPendingOperations();
      
      for (const operation of operations) {
        try {
          await this.processOperation(operation);
          await syncQueueService.markProcessed(operation.id);
          console.log(`Processed operation ${operation.id}`);
        } catch (error) {
          console.error(`Failed to process operation ${operation.id}:`, error);
          
          // Increment retry count
          await syncQueueService.incrementRetryCount(operation.id);
          
          // Remove operations that have been retried too many times
          if (operation.retryCount >= 3) {
            await syncQueueService.markProcessed(operation.id);
            console.log(`Removed operation ${operation.id} after max retries`);
          }
        }
      }
    } catch (error) {
      console.error('Error processing sync queue:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  // Process individual operation
  async processOperation(operation) {
    const { operation: opType, table, data } = operation;

    switch (opType) {
      case 'CREATE':
        await this.apiRequest(`/${table}`, {
          method: 'POST',
          body: JSON.stringify(data)
        });
        break;

      case 'UPDATE':
        await this.apiRequest(`/${table}/${data.id}`, {
          method: 'PUT',
          body: JSON.stringify(data)
        });
        break;

      case 'DELETE':
        await this.apiRequest(`/${table}/${data.id}`, {
          method: 'DELETE'
        });
        break;

      default:
        throw new Error(`Unknown operation type: ${opType}`);
    }
  }

  // Sync data from server to local
  async syncFromServer(table, endpoint) {
    if (!this.isOnline) {
      console.log('Offline, skipping server sync');
      return;
    }

    try {
      const data = await this.apiRequest(endpoint);
      await this.updateLocalData(table, data);
      console.log(`Synced ${table} from server`);
    } catch (error) {
      console.error(`Failed to sync ${table} from server:`, error);
    }
  }

  // Update local data
  async updateLocalData(table, data) {
    const { db } = await import('../db/database');
    const tableRef = db.table(table);

    // Clear existing data
    await tableRef.clear();

    // Add new data
    if (Array.isArray(data)) {
      await tableRef.bulkAdd(data);
    } else {
      await tableRef.add(data);
    }
  }

  // Sync specific data types
  async syncNotes(userId) {
    await this.syncFromServer('notes', `/notes?owner_id=${userId}`);
  }

  async syncTasks(userId) {
    await this.syncFromServer('tasks', `/tasks?owner_id=${userId}`);
  }

  async syncSchedules(userId) {
    await this.syncFromServer('schedules', `/schedules?owner_id=${userId}`);
  }

  async syncTranscripts(userId) {
    await this.syncFromServer('transcripts', `/transcripts?owner_id=${userId}`);
  }

  // Full sync for all data
  async fullSync(userId) {
    if (!this.isOnline) {
      console.log('Offline, cannot perform full sync');
      return;
    }

    console.log('Starting full sync...');

    try {
      // Sync all data types
      await Promise.all([
        this.syncNotes(userId),
        this.syncTasks(userId),
        this.syncSchedules(userId),
        this.syncTranscripts(userId)
      ]);

      // Process any pending operations
      await this.processSyncQueue();

      // Update last sync time
      await settingsService.setSetting('lastSync', new Date().toISOString());

      console.log('Full sync completed');
    } catch (error) {
      console.error('Full sync failed:', error);
    }
  }

  // Create with sync
  async createWithSync(table, data) {
    try {
      // Create locally first
      const { db } = await import('../db/database');
      const tableRef = db.table(table);
      const result = await tableRef.add(data);

      // Try to sync immediately if online
      if (this.isOnline) {
        try {
          await this.apiRequest(`/${table}`, {
            method: 'POST',
            body: JSON.stringify(data)
          });
          console.log(`Immediate sync successful for ${table}`);
        } catch (error) {
          // If immediate sync fails, queue it
          await this.queueOperation('CREATE', table, data);
        }
      } else {
        // Queue for later sync
        await this.queueOperation('CREATE', table, data);
      }

      return result;
    } catch (error) {
      console.error(`Failed to create ${table}:`, error);
      throw error;
    }
  }

  // Update with sync
  async updateWithSync(table, id, data) {
    try {
      // Update locally first
      const { db } = await import('../db/database');
      const tableRef = db.table(table);
      await tableRef.update(id, data);

      // Try to sync immediately if online
      if (this.isOnline) {
        try {
          await this.apiRequest(`/${table}/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
          });
          console.log(`Immediate sync successful for ${table}`);
        } catch (error) {
          // If immediate sync fails, queue it
          await this.queueOperation('UPDATE', table, { id, ...data });
        }
      } else {
        // Queue for later sync
        await this.queueOperation('UPDATE', table, { id, ...data });
      }
    } catch (error) {
      console.error(`Failed to update ${table}:`, error);
      throw error;
    }
  }

  // Delete with sync
  async deleteWithSync(table, id) {
    try {
      // Delete locally first
      const { db } = await import('../db/database');
      const tableRef = db.table(table);
      await tableRef.delete(id);

      // Try to sync immediately if online
      if (this.isOnline) {
        try {
          await this.apiRequest(`/${table}/${id}`, {
            method: 'DELETE'
          });
          console.log(`Immediate sync successful for ${table}`);
        } catch (error) {
          // If immediate sync fails, queue it
          await this.queueOperation('DELETE', table, { id });
        }
      } else {
        // Queue for later sync
        await this.queueOperation('DELETE', table, { id });
      }
    } catch (error) {
      console.error(`Failed to delete ${table}:`, error);
      throw error;
    }
  }

  // Get sync status
  async getSyncStatus() {
    const pendingOperations = await syncQueueService.getPendingOperations();
    const lastSync = await settingsService.getSetting('lastSync');
    
    return {
      isOnline: this.isOnline,
      pendingOperations: pendingOperations.length,
      lastSync,
      syncInProgress: this.syncInProgress
    };
  }

  // Clear sync queue
  async clearSyncQueue() {
    await syncQueueService.clearOldOperations(0); // Clear all
    console.log('Sync queue cleared');
  }
}

// Create and export singleton instance
export const syncService = new SyncService();

// Export the class for testing
export default SyncService;
