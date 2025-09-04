import Dexie from 'dexie';

// Database configuration
const DB_NAME = 'HeyBuddyDB';
const DB_VERSION = 1;

// Create database instance
export const db = new Dexie(DB_NAME);

// Database schema definition
db.version(DB_VERSION).stores({
  // User authentication and profile data
  users: 'id, email, username, lastSync',
  
  // Notes storage
  notes: 'id, title, content, isFavorite, isArchived, tags, color, ownerId, createdAt, updatedAt, lastSync',
  
  // Tasks storage
  tasks: 'id, title, description, status, priority, dueDate, completedAt, isRecurring, recurrencePattern, tags, ownerId, createdAt, updatedAt, lastSync',
  
  // Calendar events/schedules
  schedules: 'id, title, description, startTime, endTime, location, isAllDay, isRecurring, recurrencePattern, reminderMinutes, color, ownerId, createdAt, updatedAt, lastSync',
  
  // Meeting transcripts and summaries
  transcripts: 'id, title, content, summary, meetingDate, duration, participants, tags, ownerId, createdAt, updatedAt, lastSync',
  
  // Offline sync queue
  syncQueue: 'id, operation, table, data, timestamp, retryCount',
  
  // App settings and preferences
  settings: 'key, value, updatedAt'
});

// Database indexes for efficient queries
db.notes.hook('creating', function (primKey, obj, transaction) {
  // Auto-generate ID if not provided
  if (!obj.id) {
    obj.id = Date.now().toString();
  }
  
  // Set timestamps
  const now = new Date().toISOString();
  obj.createdAt = obj.createdAt || now;
  obj.updatedAt = now;
  obj.lastSync = null;
});

db.tasks.hook('creating', function (primKey, obj, transaction) {
  if (!obj.id) {
    obj.id = Date.now().toString();
  }
  
  const now = new Date().toISOString();
  obj.createdAt = obj.createdAt || now;
  obj.updatedAt = now;
  obj.lastSync = null;
});

db.schedules.hook('creating', function (primKey, obj, transaction) {
  if (!obj.id) {
    obj.id = Date.now().toString();
  }
  
  const now = new Date().toISOString();
  obj.createdAt = obj.createdAt || now;
  obj.updatedAt = now;
  obj.lastSync = null;
});

db.transcripts.hook('creating', function (primKey, obj, transaction) {
  if (!obj.id) {
    obj.id = Date.now().toString();
  }
  
  const now = new Date().toISOString();
  obj.createdAt = obj.createdAt || now;
  obj.updatedAt = now;
  obj.lastSync = null;
});

// Update hooks for timestamps
db.notes.hook('updating', function (modifications, primKey, obj, transaction) {
  modifications.updatedAt = new Date().toISOString();
});

db.tasks.hook('updating', function (modifications, primKey, obj, transaction) {
  modifications.updatedAt = new Date().toISOString();
});

db.schedules.hook('updating', function (modifications, primKey, obj, transaction) {
  modifications.updatedAt = new Date().toISOString();
});

db.transcripts.hook('updating', function (modifications, primKey, obj, transaction) {
  modifications.updatedAt = new Date().toISOString();
});

// Database utility functions
export const dbUtils = {
  // Check if database is ready
  async isReady() {
    try {
      await db.open();
      return true;
    } catch (error) {
      console.error('Database not ready:', error);
      return false;
    }
  },

  // Clear all data (useful for testing or reset)
  async clearAll() {
    await db.transaction('rw', db.tables, async () => {
      await Promise.all(db.tables.map(table => table.clear()));
    });
  },

  // Get database size
  async getSize() {
    const tables = db.tables;
    const sizes = {};
    
    for (const table of tables) {
      sizes[table.name] = await table.count();
    }
    
    return sizes;
  },

  // Export database for backup
  async exportData() {
    const data = {};
    
    for (const table of db.tables) {
      data[table.name] = await table.toArray();
    }
    
    return data;
  },

  // Import data from backup
  async importData(data) {
    await db.transaction('rw', db.tables, async () => {
      for (const [tableName, records] of Object.entries(data)) {
        if (db.table(tableName)) {
          await db.table(tableName).bulkPut(records);
        }
      }
    });
  }
};

// Database initialization
export const initializeDatabase = async () => {
  try {
    await db.open();
    console.log('Database initialized successfully');
    
    // Set default settings
    await db.settings.put({
      key: 'theme',
      value: 'light',
      updatedAt: new Date().toISOString()
    });
    
    await db.settings.put({
      key: 'offlineMode',
      value: false,
      updatedAt: new Date().toISOString()
    });
    
    await db.settings.put({
      key: 'autoSync',
      value: true,
      updatedAt: new Date().toISOString()
    });
    
    return true;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    return false;
  }
};

export default db;
