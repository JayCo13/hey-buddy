import { useState, useEffect, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { syncService } from '../services/syncService';

// Hook for database initialization
export const useDatabase = () => {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initDB = async () => {
      try {
        await db.open();
        setIsReady(true);
      } catch (err) {
        setError(err);
        console.error('Database initialization failed:', err);
      }
    };

    initDB();
  }, []);

  return { isReady, error };
};

// Hook for notes
export const useNotes = (ownerId, filters = {}) => {
  const notes = useLiveQuery(
    () => db.notes.where('ownerId').equals(ownerId).toArray(),
    [ownerId]
  );

  const createNote = useCallback(async (noteData) => {
    try {
      const data = { ...noteData, ownerId };
      return await syncService.createWithSync('notes', data);
    } catch (error) {
      console.error('Failed to create note:', error);
      throw error;
    }
  }, [ownerId]);

  const updateNote = useCallback(async (id, noteData) => {
    try {
      return await syncService.updateWithSync('notes', id, noteData);
    } catch (error) {
      console.error('Failed to update note:', error);
      throw error;
    }
  }, []);

  const deleteNote = useCallback(async (id) => {
    try {
      return await syncService.deleteWithSync('notes', id);
    } catch (error) {
      console.error('Failed to delete note:', error);
      throw error;
    }
  }, []);

  const toggleFavorite = useCallback(async (id) => {
    try {
      const note = await db.notes.get(id);
      if (note) {
        return await syncService.updateWithSync('notes', id, { isFavorite: !note.isFavorite });
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      throw error;
    }
  }, []);

  const toggleArchive = useCallback(async (id) => {
    try {
      const note = await db.notes.get(id);
      if (note) {
        return await syncService.updateWithSync('notes', id, { isArchived: !note.isArchived });
      }
    } catch (error) {
      console.error('Failed to toggle archive:', error);
      throw error;
    }
  }, []);

  return {
    notes: notes || [],
    createNote,
    updateNote,
    deleteNote,
    toggleFavorite,
    toggleArchive,
    isLoading: notes === undefined
  };
};

// Hook for tasks
export const useTasks = (ownerId, filters = {}) => {
  const tasks = useLiveQuery(
    () => db.tasks.where('ownerId').equals(ownerId).toArray(),
    [ownerId]
  );

  const createTask = useCallback(async (taskData) => {
    try {
      const data = { ...taskData, ownerId };
      return await syncService.createWithSync('tasks', data);
    } catch (error) {
      console.error('Failed to create task:', error);
      throw error;
    }
  }, [ownerId]);

  const updateTask = useCallback(async (id, taskData) => {
    try {
      return await syncService.updateWithSync('tasks', id, taskData);
    } catch (error) {
      console.error('Failed to update task:', error);
      throw error;
    }
  }, []);

  const deleteTask = useCallback(async (id) => {
    try {
      return await syncService.deleteWithSync('tasks', id);
    } catch (error) {
      console.error('Failed to delete task:', error);
      throw error;
    }
  }, []);

  const completeTask = useCallback(async (id) => {
    try {
      return await syncService.updateWithSync('tasks', id, {
        status: 'completed',
        completedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to complete task:', error);
      throw error;
    }
  }, []);

  const startTask = useCallback(async (id) => {
    try {
      return await syncService.updateWithSync('tasks', id, { status: 'in_progress' });
    } catch (error) {
      console.error('Failed to start task:', error);
      throw error;
    }
  }, []);

  return {
    tasks: tasks || [],
    createTask,
    updateTask,
    deleteTask,
    completeTask,
    startTask,
    isLoading: tasks === undefined
  };
};

// Hook for schedules
export const useSchedules = (ownerId, filters = {}) => {
  const schedules = useLiveQuery(
    () => db.schedules.where('ownerId').equals(ownerId).toArray(),
    [ownerId]
  );

  const createSchedule = useCallback(async (scheduleData) => {
    try {
      const data = { ...scheduleData, ownerId };
      return await syncService.createWithSync('schedules', data);
    } catch (error) {
      console.error('Failed to create schedule:', error);
      throw error;
    }
  }, [ownerId]);

  const updateSchedule = useCallback(async (id, scheduleData) => {
    try {
      return await syncService.updateWithSync('schedules', id, scheduleData);
    } catch (error) {
      console.error('Failed to update schedule:', error);
      throw error;
    }
  }, []);

  const deleteSchedule = useCallback(async (id) => {
    try {
      return await syncService.deleteWithSync('schedules', id);
    } catch (error) {
      console.error('Failed to delete schedule:', error);
      throw error;
    }
  }, []);

  return {
    schedules: schedules || [],
    createSchedule,
    updateSchedule,
    deleteSchedule,
    isLoading: schedules === undefined
  };
};

// Hook for transcripts
export const useTranscripts = (ownerId, filters = {}) => {
  const transcripts = useLiveQuery(
    () => db.transcripts.where('ownerId').equals(ownerId).toArray(),
    [ownerId]
  );

  const createTranscript = useCallback(async (transcriptData) => {
    try {
      const data = { ...transcriptData, ownerId };
      return await syncService.createWithSync('transcripts', data);
    } catch (error) {
      console.error('Failed to create transcript:', error);
      throw error;
    }
  }, [ownerId]);

  const updateTranscript = useCallback(async (id, transcriptData) => {
    try {
      return await syncService.updateWithSync('transcripts', id, transcriptData);
    } catch (error) {
      console.error('Failed to update transcript:', error);
      throw error;
    }
  }, []);

  const deleteTranscript = useCallback(async (id) => {
    try {
      return await syncService.deleteWithSync('transcripts', id);
    } catch (error) {
      console.error('Failed to delete transcript:', error);
      throw error;
    }
  }, []);

  return {
    transcripts: transcripts || [],
    createTranscript,
    updateTranscript,
    deleteTranscript,
    isLoading: transcripts === undefined
  };
};

// Hook for sync status
export const useSyncStatus = () => {
  const [syncStatus, setSyncStatus] = useState({
    isOnline: navigator.onLine,
    pendingOperations: 0,
    lastSync: null,
    syncInProgress: false
  });

  useEffect(() => {
    const updateSyncStatus = async () => {
      const status = await syncService.getSyncStatus();
      setSyncStatus(status);
    };

    updateSyncStatus();
    
    // Update status periodically
    const interval = setInterval(updateSyncStatus, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const triggerSync = useCallback(async (userId) => {
    try {
      await syncService.fullSync(userId);
      const status = await syncService.getSyncStatus();
      setSyncStatus(status);
    } catch (error) {
      console.error('Sync failed:', error);
    }
  }, []);

  return {
    ...syncStatus,
    triggerSync
  };
};

// Hook for settings
export const useSettings = () => {
  const [settings, setSettings] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const allSettings = await db.settings.toArray();
        const settingsObj = {};
        allSettings.forEach(setting => {
          settingsObj[setting.key] = setting.value;
        });
        setSettings(settingsObj);
      } catch (error) {
        console.error('Failed to load settings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  const updateSetting = useCallback(async (key, value) => {
    try {
      await db.settings.put({
        key,
        value,
        updatedAt: new Date().toISOString()
      });
      setSettings(prev => ({ ...prev, [key]: value }));
    } catch (error) {
      console.error('Failed to update setting:', error);
      throw error;
    }
  }, []);

  return {
    settings,
    updateSetting,
    isLoading
  };
};

// Hook for offline/online status
export const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
};
