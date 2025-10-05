import { syncQueueService, settingsService } from './databaseService';

// Note: Backend API removed - this service now works with local storage only

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

  // Note: API requests removed since backend is no longer available
  // This service now works with local storage only

  // Add operation to sync queue
  async queueOperation(operation, table, data) {
    try {
      await syncQueueService.addSyncOperation(operation, table, data);
      console.log(`Queued ${operation} operation for ${table}`);
    } catch (error) {
      console.error('Failed to queue operation:', error);
    }
  }

  // Process sync queue (local only now)
  async processSyncQueue() {
    if (this.syncInProgress) {
      return;
    }

    this.syncInProgress = true;
    console.log('Processing local sync queue...');

    try {
      const operations = await syncQueueService.getPendingOperations();
      
      for (const operation of operations) {
        try {
          // Since we don't have a backend, we'll just mark operations as processed
          // In a real implementation, you might sync with a different service
          await syncQueueService.markProcessed(operation.id);
          console.log(`Processed local operation ${operation.id}`);
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

  // Process individual operation (local only now)
  async processOperation(operation) {
    const { operation: opType, table, data } = operation;

    // Since we don't have a backend, we'll just log the operation
    // In a real implementation, you might sync with a different service
    console.log(`Local operation: ${opType} on ${table}`, data);
    
    // For now, we'll just return success
    return { success: true };
  }

  // Sync data from server to local (disabled - no backend)
  async syncFromServer(table, endpoint) {
    console.log(`Server sync disabled for ${table} - no backend available`);
    // Since we don't have a backend, this method is now a no-op
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

  // Create with sync (local only now)
  async createWithSync(table, data) {
    try {
      // Create locally only
      const { db } = await import('../db/database');
      const tableRef = db.table(table);
      const result = await tableRef.add(data);

      console.log(`Created ${table} locally (no backend sync)`);
      return result;
    } catch (error) {
      console.error(`Failed to create ${table}:`, error);
      throw error;
    }
  }

  // Update with sync (local only now)
  async updateWithSync(table, id, data) {
    try {
      // Update locally only
      const { db } = await import('../db/database');
      const tableRef = db.table(table);
      await tableRef.update(id, data);

      console.log(`Updated ${table} locally (no backend sync)`);
    } catch (error) {
      console.error(`Failed to update ${table}:`, error);
      throw error;
    }
  }

  // Delete with sync (local only now)
  async deleteWithSync(table, id) {
    try {
      // Delete locally only
      const { db } = await import('../db/database');
      const tableRef = db.table(table);
      await tableRef.delete(id);

      console.log(`Deleted ${table} locally (no backend sync)`);
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
