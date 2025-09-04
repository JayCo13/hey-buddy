# Hey Buddy - AI-Powered Productivity App

A Progressive Web App (PWA) with offline-first functionality using IndexedDB for reliable data management.

## Features

- **Offline-First Design**: Works seamlessly offline with local data storage
- **Real-time Sync**: Automatic synchronization when online
- **Notes Management**: Create, edit, favorite, and archive notes
- **Task Management**: Track tasks with status and priority
- **Schedule Management**: Calendar events with reminders
- **Meeting Transcripts**: AI-powered speech transcription and summaries
- **Face Recognition**: Secure login using facial recognition
- **PWA Features**: Installable, offline-capable, and responsive

## Technology Stack

### Frontend
- **React 18** - UI framework
- **Tailwind CSS** - Styling
- **Dexie.js** - IndexedDB wrapper for simplified database operations
- **Dexie React Hooks** - React hooks for database operations
- **Service Worker** - Offline functionality and caching

### Backend
- **FastAPI** - Python web framework
- **MySQL** - Database
- **SQLAlchemy** - ORM
- **Alembic** - Database migrations
- **Face Recognition** - AI-powered authentication

## Database Schema

### IndexedDB Tables

#### Users
```javascript
{
  id: string,
  email: string,
  username: string,
  first_name: string,
  last_name: string,
  bio: string,
  face_encoding: string,
  face_image_path: string,
  face_enabled: boolean,
  lastSync: string
}
```

#### Notes
```javascript
{
  id: string,
  title: string,
  content: string,
  isFavorite: boolean,
  isArchived: boolean,
  tags: string[],
  color: string,
  ownerId: string,
  createdAt: string,
  updatedAt: string,
  lastSync: string
}
```

#### Tasks
```javascript
{
  id: string,
  title: string,
  description: string,
  status: 'pending' | 'in_progress' | 'completed',
  priority: 'low' | 'medium' | 'high',
  dueDate: string,
  completedAt: string,
  isRecurring: boolean,
  recurrencePattern: string,
  tags: string[],
  ownerId: string,
  createdAt: string,
  updatedAt: string,
  lastSync: string
}
```

#### Schedules
```javascript
{
  id: string,
  title: string,
  description: string,
  startTime: string,
  endTime: string,
  location: string,
  isAllDay: boolean,
  isRecurring: boolean,
  recurrencePattern: string,
  reminderMinutes: number,
  color: string,
  ownerId: string,
  createdAt: string,
  updatedAt: string,
  lastSync: string
}
```

#### Transcripts
```javascript
{
  id: string,
  title: string,
  content: string,
  summary: string,
  meetingDate: string,
  duration: number,
  participants: string[],
  tags: string[],
  ownerId: string,
  createdAt: string,
  updatedAt: string,
  lastSync: string
}
```

## Getting Started

### Prerequisites

- Node.js 16+ and npm
- Python 3.8+ and pip
- MySQL database

### Frontend Setup

1. **Install dependencies**:
   ```bash
   cd frontend
   npm install
   ```

2. **Start development server**:
   ```bash
   npm start
   ```

3. **Build for production**:
   ```bash
   npm run build
   ```

### Backend Setup

1. **Install dependencies**:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

3. **Run database migrations**:
   ```bash
   alembic upgrade head
   ```

4. **Start the server**:
   ```bash
   python main.py
   ```

## Usage Examples

### Database Operations

#### Creating a Note
```javascript
import { useNotes } from './hooks/useDatabase';

const { createNote } = useNotes(userId);

const handleCreateNote = async () => {
  await createNote({
    title: 'My Note',
    content: 'Note content',
    tags: ['work', 'important'],
    color: '#3B82F6'
  });
};
```

#### Reading Notes
```javascript
import { useNotes } from './hooks/useDatabase';

const { notes, isLoading } = useNotes(userId);

if (isLoading) {
  return <div>Loading...</div>;
}

return (
  <div>
    {notes.map(note => (
      <div key={note.id}>{note.title}</div>
    ))}
  </div>
);
```

#### Updating a Note
```javascript
import { useNotes } from './hooks/useDatabase';

const { updateNote } = useNotes(userId);

const handleUpdateNote = async (id, data) => {
  await updateNote(id, {
    title: 'Updated Title',
    content: 'Updated content'
  });
};
```

#### Deleting a Note
```javascript
import { useNotes } from './hooks/useDatabase';

const { deleteNote } = useNotes(userId);

const handleDeleteNote = async (id) => {
  await deleteNote(id);
};
```

### Sync Operations

#### Manual Sync
```javascript
import { useSyncStatus } from './hooks/useDatabase';

const { triggerSync } = useSyncStatus();

const handleSync = async () => {
  await triggerSync(userId);
};
```

#### Check Sync Status
```javascript
import { useSyncStatus } from './hooks/useDatabase';

const { isOnline, pendingOperations, lastSync } = useSyncStatus();

return (
  <div>
    <p>Online: {isOnline ? 'Yes' : 'No'}</p>
    <p>Pending operations: {pendingOperations}</p>
    <p>Last sync: {lastSync}</p>
  </div>
);
```

### Offline Detection

```javascript
import { useOnlineStatus } from './hooks/useDatabase';

const isOnline = useOnlineStatus();

return (
  <div className={`status-indicator ${isOnline ? 'online' : 'offline'}`}>
    {isOnline ? 'Online' : 'Offline'}
  </div>
);
```

## PWA Features

### Installation
The app can be installed on supported devices:
- **Desktop**: Chrome, Edge, Safari
- **Mobile**: Chrome (Android), Safari (iOS)

### Offline Functionality
- Works without internet connection
- Data is stored locally in IndexedDB
- Automatic sync when connection is restored
- Service worker caches static assets

### Background Sync
- Queues operations when offline
- Automatically syncs when online
- Retry mechanism for failed operations

## Database Versioning

The IndexedDB implementation includes versioning support:

```javascript
// Database configuration
const DB_VERSION = 1;

db.version(DB_VERSION).stores({
  // Schema definition
});
```

To add a new version:
1. Increment `DB_VERSION`
2. Add new stores or modify existing ones
3. Handle data migration if needed

## Error Handling

The implementation includes comprehensive error handling:

- Database operation failures
- Network connectivity issues
- Sync conflicts
- Invalid data

## Performance Considerations

- **IndexedDB**: Fast local storage for large datasets
- **Dexie.js**: Optimized queries and transactions
- **Service Worker**: Efficient caching strategies
- **React Hooks**: Minimal re-renders with useLiveQuery

## Security

- **Face Recognition**: Secure biometric authentication
- **Data Encryption**: Sensitive data encryption in transit
- **CORS**: Proper cross-origin resource sharing
- **Input Validation**: Client and server-side validation

## Testing

### Unit Tests
```bash
npm test
```

### Integration Tests
```bash
npm run test:integration
```

### E2E Tests
```bash
npm run test:e2e
```

## Deployment

### Frontend
```bash
npm run build
# Deploy build/ folder to your hosting service
```

### Backend
```bash
# Deploy to your preferred hosting service
# Ensure MySQL database is accessible
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions:
- Create an issue on GitHub
- Check the documentation
- Review the code examples

## Roadmap

- [ ] Advanced search functionality
- [ ] Collaborative features
- [ ] Advanced AI features
- [ ] Mobile app versions
- [ ] API rate limiting
- [ ] Advanced analytics
