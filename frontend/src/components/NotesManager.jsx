import React, { useState } from 'react';
import { useNotes, useSyncStatus, useOnlineStatus } from '../hooks/useDatabase';

const NotesManager = ({ userId }) => {
  const [newNote, setNewNote] = useState({ title: '', content: '', tags: [] });
  const [editingNote, setEditingNote] = useState(null);
  const [tagInput, setTagInput] = useState('');
  
  const { notes, createNote, updateNote, deleteNote, toggleFavorite, toggleArchive, isLoading } = useNotes(userId);
  const { isOnline, pendingOperations, triggerSync } = useSyncStatus();
  const onlineStatus = useOnlineStatus();

  const handleCreateNote = async (e) => {
    e.preventDefault();
    if (!newNote.title.trim()) return;

    try {
      await createNote({
        title: newNote.title,
        content: newNote.content,
        tags: newNote.tags,
        color: '#3B82F6',
        isFavorite: false,
        isArchived: false
      });
      
      setNewNote({ title: '', content: '', tags: [] });
    } catch (error) {
      console.error('Failed to create note:', error);
    }
  };

  const handleUpdateNote = async (id, data) => {
    try {
      await updateNote(id, data);
      setEditingNote(null);
    } catch (error) {
      console.error('Failed to update note:', error);
    }
  };

  const handleDeleteNote = async (id) => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      try {
        await deleteNote(id);
      } catch (error) {
        console.error('Failed to delete note:', error);
      }
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !newNote.tags.includes(tagInput.trim())) {
      setNewNote(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove) => {
    setNewNote(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Status Bar */}
      <div className="mb-6 p-4 bg-gray-100 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className={`w-3 h-3 rounded-full ${onlineStatus ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm">
              {onlineStatus ? 'Online' : 'Offline'}
            </span>
            {pendingOperations > 0 && (
              <span className="text-sm text-orange-600">
                {pendingOperations} pending sync operations
              </span>
            )}
          </div>
          <button
            onClick={() => triggerSync(userId)}
            disabled={!onlineStatus}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            Sync Now
          </button>
        </div>
      </div>

      {/* Create Note Form */}
      <div className="mb-8 p-6 bg-white rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Create New Note</h2>
        <form onSubmit={handleCreateNote} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title
            </label>
            <input
              type="text"
              value={newNote.title}
              onChange={(e) => setNewNote(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter note title"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Content
            </label>
            <textarea
              value={newNote.content}
              onChange={(e) => setNewNote(prev => ({ ...prev, content: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="4"
              placeholder="Enter note content"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Add tag and press Enter"
              />
              <button
                type="button"
                onClick={addTag}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Add
              </button>
            </div>
            {newNote.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {newNote.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-1 text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <button
            type="submit"
            className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Create Note
          </button>
        </form>
      </div>

      {/* Notes List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Your Notes ({notes.length})</h2>
        
        {notes.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No notes yet. Create your first note above!
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {notes.map((note) => (
              <div
                key={note.id}
                className="p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
                style={{ borderLeft: `4px solid ${note.color}` }}
              >
                {editingNote?.id === note.id ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={editingNote.title}
                      onChange={(e) => setEditingNote(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-2 py-1 border border-gray-300 rounded"
                    />
                    <textarea
                      value={editingNote.content}
                      onChange={(e) => setEditingNote(prev => ({ ...prev, content: e.target.value }))}
                      className="w-full px-2 py-1 border border-gray-300 rounded"
                      rows="3"
                    />
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleUpdateNote(note.id, editingNote)}
                        className="px-3 py-1 bg-green-600 text-white rounded text-sm"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingNote(null)}
                        className="px-3 py-1 bg-gray-600 text-white rounded text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-lg">{note.title}</h3>
                      <div className="flex space-x-1">
                        <button
                          onClick={() => toggleFavorite(note.id)}
                          className={`p-1 rounded ${note.isFavorite ? 'text-yellow-500' : 'text-gray-400'}`}
                        >
                          ★
                        </button>
                        <button
                          onClick={() => toggleArchive(note.id)}
                          className={`p-1 rounded ${note.isArchived ? 'text-blue-500' : 'text-gray-400'}`}
                        >
                          📁
                        </button>
                      </div>
                    </div>
                    
                    <p className="text-gray-600 mb-3 line-clamp-3">{note.content}</p>
                    
                    {note.tags && note.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {note.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="inline-block px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center text-xs text-gray-500">
                      <span>
                        {new Date(note.createdAt).toLocaleDateString()}
                      </span>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setEditingNote(note)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteNote(note.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotesManager;
