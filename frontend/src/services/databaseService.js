import { db } from '../db/database';

// Base service class with common CRUD operations
class BaseService {
  constructor(tableName) {
    this.table = db.table(tableName);
  }

  // Create
  async create(data) {
    try {
      const id = await this.table.add(data);
      return { ...data, id };
    } catch (error) {
      console.error(`Error creating ${this.table.name}:`, error);
      throw error;
    }
  }

  // Read all
  async getAll(filters = {}) {
    try {
      let query = this.table.toCollection();
      
      // Apply filters
      Object.keys(filters).forEach(key => {
        if (filters[key] !== undefined && filters[key] !== null) {
          query = query.filter(item => item[key] === filters[key]);
        }
      });
      
      return await query.toArray();
    } catch (error) {
      console.error(`Error getting all ${this.table.name}:`, error);
      throw error;
    }
  }

  // Read by ID
  async getById(id) {
    try {
      return await this.table.get(id);
    } catch (error) {
      console.error(`Error getting ${this.table.name} by ID:`, error);
      throw error;
    }
  }

  // Update
  async update(id, data) {
    try {
      await this.table.update(id, data);
      return await this.getById(id);
    } catch (error) {
      console.error(`Error updating ${this.table.name}:`, error);
      throw error;
    }
  }

  // Delete
  async delete(id) {
    try {
      await this.table.delete(id);
      return true;
    } catch (error) {
      console.error(`Error deleting ${this.table.name}:`, error);
      throw error;
    }
  }

  // Count
  async count(filters = {}) {
    try {
      let query = this.table.toCollection();
      
      Object.keys(filters).forEach(key => {
        if (filters[key] !== undefined && filters[key] !== null) {
          query = query.filter(item => item[key] === filters[key]);
        }
      });
      
      return await query.count();
    } catch (error) {
      console.error(`Error counting ${this.table.name}:`, error);
      throw error;
    }
  }
}

// Notes Service
export class NotesService extends BaseService {
  constructor() {
    super('notes');
  }

  // Get notes by owner
  async getByOwner(ownerId, filters = {}) {
    return this.getAll({ ...filters, ownerId });
  }

  // Get favorite notes
  async getFavorites(ownerId) {
    return this.getAll({ ownerId, isFavorite: true });
  }

  // Get archived notes
  async getArchived(ownerId) {
    return this.getAll({ ownerId, isArchived: true });
  }

  // Get notes by tags
  async getByTags(ownerId, tags) {
    const notes = await this.getByOwner(ownerId);
    return notes.filter(note => 
      note.tags && note.tags.some(tag => tags.includes(tag))
    );
  }

  // Search notes
  async search(ownerId, query) {
    const notes = await this.getByOwner(ownerId);
    const searchTerm = query.toLowerCase();
    
    return notes.filter(note => 
      note.title.toLowerCase().includes(searchTerm) ||
      note.content.toLowerCase().includes(searchTerm) ||
      (note.tags && note.tags.some(tag => tag.toLowerCase().includes(searchTerm)))
    );
  }

  // Toggle favorite
  async toggleFavorite(id) {
    const note = await this.getById(id);
    return this.update(id, { isFavorite: !note.isFavorite });
  }

  // Toggle archive
  async toggleArchive(id) {
    const note = await this.getById(id);
    return this.update(id, { isArchived: !note.isArchived });
  }
}

// Tasks Service
export class TasksService extends BaseService {
  constructor() {
    super('tasks');
  }

  // Get tasks by owner
  async getByOwner(ownerId, filters = {}) {
    return this.getAll({ ...filters, ownerId });
  }

  // Get tasks by status
  async getByStatus(ownerId, status) {
    return this.getAll({ ownerId, status });
  }

  // Get tasks by priority
  async getByPriority(ownerId, priority) {
    return this.getAll({ ownerId, priority });
  }

  // Get overdue tasks
  async getOverdue(ownerId) {
    const now = new Date();
    const tasks = await this.getByOwner(ownerId, { status: 'pending' });
    return tasks.filter(task => 
      task.dueDate && new Date(task.dueDate) < now
    );
  }

  // Get today's tasks
  async getToday(ownerId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const tasks = await this.getByOwner(ownerId);
    return tasks.filter(task => {
      if (!task.dueDate) return false;
      const dueDate = new Date(task.dueDate);
      return dueDate >= today && dueDate < tomorrow;
    });
  }

  // Complete task
  async completeTask(id) {
    return this.update(id, { 
      status: 'completed', 
      completedAt: new Date().toISOString() 
    });
  }

  // Mark task as in progress
  async startTask(id) {
    return this.update(id, { status: 'in_progress' });
  }
}

// Schedules Service
export class SchedulesService extends BaseService {
  constructor() {
    super('schedules');
  }

  // Get schedules by owner
  async getByOwner(ownerId, filters = {}) {
    return this.getAll({ ...filters, ownerId });
  }

  // Get today's schedules
  async getToday(ownerId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const schedules = await this.getByOwner(ownerId);
    return schedules.filter(schedule => {
      const startTime = new Date(schedule.startTime);
      return startTime >= today && startTime < tomorrow;
    });
  }

  // Get upcoming schedules
  async getUpcoming(ownerId, days = 7) {
    const now = new Date();
    const future = new Date(now);
    future.setDate(future.getDate() + days);
    
    const schedules = await this.getByOwner(ownerId);
    return schedules.filter(schedule => {
      const startTime = new Date(schedule.startTime);
      return startTime >= now && startTime <= future;
    }).sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
  }

  // Get schedules by date range
  async getByDateRange(ownerId, startDate, endDate) {
    const schedules = await this.getByOwner(ownerId);
    return schedules.filter(schedule => {
      const scheduleDate = new Date(schedule.startTime);
      return scheduleDate >= startDate && scheduleDate <= endDate;
    });
  }
}

// Transcripts Service
export class TranscriptsService extends BaseService {
  constructor() {
    super('transcripts');
  }

  // Get transcripts by owner
  async getByOwner(ownerId, filters = {}) {
    return this.getAll({ ...filters, ownerId });
  }

  // Get transcripts by date
  async getByDate(ownerId, date) {
    const transcripts = await this.getByOwner(ownerId);
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    const nextDate = new Date(targetDate);
    nextDate.setDate(nextDate.getDate() + 1);
    
    return transcripts.filter(transcript => {
      const transcriptDate = new Date(transcript.meetingDate);
      return transcriptDate >= targetDate && transcriptDate < nextDate;
    });
  }

  // Search transcripts
  async search(ownerId, query) {
    const transcripts = await this.getByOwner(ownerId);
    const searchTerm = query.toLowerCase();
    
    return transcripts.filter(transcript => 
      transcript.title.toLowerCase().includes(searchTerm) ||
      transcript.content.toLowerCase().includes(searchTerm) ||
      transcript.summary.toLowerCase().includes(searchTerm) ||
      (transcript.participants && transcript.participants.some(participant => 
        participant.toLowerCase().includes(searchTerm)
      ))
    );
  }
}

// Users Service
export class UsersService extends BaseService {
  constructor() {
    super('users');
  }

  // Get current user
  async getCurrentUser() {
    const users = await this.getAll();
    return users[0]; // Assuming single user for now
  }

  // Update user profile
  async updateProfile(data) {
    const user = await this.getCurrentUser();
    if (user) {
      return this.update(user.id, data);
    }
    throw new Error('No user found');
  }

  // Update last sync time
  async updateLastSync(userId) {
    return this.update(userId, { lastSync: new Date().toISOString() });
  }
}

// Settings Service
export class SettingsService extends BaseService {
  constructor() {
    super('settings');
  }

  // Get setting by key
  async getSetting(key) {
    const setting = await this.table.get(key);
    return setting ? setting.value : null;
  }

  // Set setting
  async setSetting(key, value) {
    return this.table.put({
      key,
      value,
      updatedAt: new Date().toISOString()
    });
  }

  // Get all settings
  async getAllSettings() {
    const settings = await this.table.toArray();
    const result = {};
    settings.forEach(setting => {
      result[setting.key] = setting.value;
    });
    return result;
  }
}

// Sync Queue Service
export class SyncQueueService extends BaseService {
  constructor() {
    super('syncQueue');
  }

  // Add sync operation
  async addSyncOperation(operation, table, data) {
    return this.create({
      id: Date.now().toString(),
      operation,
      table,
      data,
      timestamp: new Date().toISOString(),
      retryCount: 0
    });
  }

  // Get pending sync operations
  async getPendingOperations() {
    return this.table.toArray();
  }

  // Mark operation as processed
  async markProcessed(id) {
    await this.delete(id);
  }

  // Increment retry count
  async incrementRetryCount(id) {
    const operation = await this.getById(id);
    if (operation) {
      return this.update(id, { retryCount: operation.retryCount + 1 });
    }
  }

  // Clear old operations
  async clearOldOperations(days = 7) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    
    const operations = await this.table.toArray();
    const oldOperations = operations.filter(op => 
      new Date(op.timestamp) < cutoff
    );
    
    for (const op of oldOperations) {
      await this.delete(op.id);
    }
  }
}

// Export service instances
export const notesService = new NotesService();
export const tasksService = new TasksService();
export const schedulesService = new SchedulesService();
export const transcriptsService = new TranscriptsService();
export const usersService = new UsersService();
export const settingsService = new SettingsService();
export const syncQueueService = new SyncQueueService();

// Export all services
export default {
  notes: notesService,
  tasks: tasksService,
  schedules: schedulesService,
  transcripts: transcriptsService,
  users: usersService,
  settings: settingsService,
  sync: syncQueueService
};
