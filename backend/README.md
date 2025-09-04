# Hey Buddy API - FastAPI Backend

A comprehensive, modern FastAPI backend for productivity management featuring user authentication, notes, tasks, and scheduling capabilities with MySQL database.

## 🚀 Features

- ⚡ **FastAPI**: Modern, fast web framework for building APIs
- 🔒 **JWT Authentication**: Secure user authentication and authorization
- 🗄️ **MySQL**: Robust relational database with SQLAlchemy ORM
- 📝 **Notes Management**: Create, organize, and manage personal notes
- ✅ **Task Management**: Full CRUD operations for tasks with status tracking
- 📅 **Scheduling**: Calendar events and appointments management
- 🔄 **Database Migrations**: Alembic for database schema management
- 📚 **Auto Documentation**: Interactive API docs with Swagger UI
- 🧪 **Testing Ready**: Structured for unit and integration tests
- 📦 **Modular Architecture**: Clean, scalable codebase structure

## 📁 Project Structure

```
backend/
├── app/
│   ├── api/
│   │   └── v1/
│   │       ├── endpoints/
│   │       │   ├── auth.py       # Authentication endpoints
│   │       │   ├── users.py      # User management
│   │       │   ├── notes.py      # Notes management
│   │       │   ├── tasks.py      # Task management
│   │       │   └── schedules.py  # Schedule management
│   │       └── api.py            # API router
│   ├── core/
│   │   ├── config.py             # App configuration
│   │   ├── security.py           # Security utilities
│   │   └── deps.py               # Dependencies
│   ├── crud/                     # Database operations
│   │   ├── base.py               # Base CRUD operations
│   │   ├── crud_user.py          # User CRUD
│   │   ├── crud_note.py          # Note CRUD
│   │   ├── crud_task.py          # Task CRUD
│   │   └── crud_schedule.py      # Schedule CRUD
│   ├── db/                       # Database configuration
│   │   ├── base.py               # Base model imports
│   │   ├── base_class.py         # SQLAlchemy base class
│   │   ├── session.py            # Database session
│   │   └── deps.py               # Database dependencies
│   ├── models/                   # SQLAlchemy models
│   │   ├── user.py               # User model
│   │   ├── note.py               # Note model
│   │   ├── task.py               # Task model
│   │   └── schedule.py           # Schedule model
│   ├── schemas/                  # Pydantic schemas
│   │   ├── user.py               # User schemas
│   │   ├── note.py               # Note schemas
│   │   ├── task.py               # Task schemas
│   │   └── schedule.py           # Schedule schemas
│   └── __init__.py
├── alembic/                      # Database migrations
│   ├── versions/                 # Migration files
│   ├── env.py                    # Alembic environment
│   └── script.py.mako            # Migration template
├── alembic.ini                   # Alembic configuration
├── main.py                       # FastAPI app entry point
├── requirements.txt              # Python dependencies
├── .env.example                  # Environment variables template
├── .gitignore                    # Git ignore rules
└── README.md                     # This file
```

## 🛠️ Quick Start

### 1. Prerequisites

- Python 3.8+
- MySQL database (5.7+ or 8.0+)
- pip or conda for package management

### 2. Database Setup

```bash
# Create MySQL database
mysql -u root -p -e "CREATE DATABASE hey_buddy_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Or using MySQL command line:
mysql -u root -p
CREATE DATABASE hey_buddy_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 3. Install Dependencies

```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 4. Environment Configuration

```bash
# Copy environment template
cp .env.example .env

# Edit .env file with your database configuration
nano .env
```

Update the `.env` file with your database credentials:
```env
DATABASE_URL=mysql+pymysql://username:password@localhost:3306/hey_buddy_db
SECRET_KEY=your-super-secret-key-change-in-production
```

### 5. Database Migration

```bash
# Create initial migration
alembic revision --autogenerate -m "Initial migration"

# Apply migrations
alembic upgrade head
```

### 6. Run the Application

```bash
# Development server with auto-reload
python main.py

# Or using uvicorn directly
uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

## 📊 API Endpoints

The API will be available at:
- **API Base URL**: http://localhost:8001
- **Interactive Docs**: http://localhost:8001/docs
- **ReDoc**: http://localhost:8001/redoc

### 🔐 Authentication
- `POST /api/v1/auth/login` - User login (OAuth2 compatible)
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/logout` - User logout

### 👤 Users
- `GET /api/v1/users/me` - Get current user profile
- `PUT /api/v1/users/me` - Update current user profile
- `GET /api/v1/users/` - Get all users (admin only)
- `GET /api/v1/users/{user_id}` - Get user by ID
- `PUT /api/v1/users/{user_id}` - Update user (admin only)

### 📝 Notes
- `GET /api/v1/notes/` - Get user's notes
- `POST /api/v1/notes/` - Create new note
- `GET /api/v1/notes/{note_id}` - Get specific note
- `PUT /api/v1/notes/{note_id}` - Update note
- `DELETE /api/v1/notes/{note_id}` - Delete note
- `GET /api/v1/notes/favorites/` - Get favorite notes
- `GET /api/v1/notes/archived/` - Get archived notes

### ✅ Tasks
- `GET /api/v1/tasks/` - Get user's tasks (with filtering)
- `POST /api/v1/tasks/` - Create new task
- `GET /api/v1/tasks/{task_id}` - Get specific task
- `PUT /api/v1/tasks/{task_id}` - Update task
- `DELETE /api/v1/tasks/{task_id}` - Delete task
- `PATCH /api/v1/tasks/{task_id}/complete` - Mark task as completed
- `GET /api/v1/tasks/status/{status}` - Get tasks by status

### 📅 Schedules
- `GET /api/v1/schedules/` - Get user's schedules (with date filtering)
- `POST /api/v1/schedules/` - Create new schedule
- `GET /api/v1/schedules/{schedule_id}` - Get specific schedule
- `PUT /api/v1/schedules/{schedule_id}` - Update schedule
- `DELETE /api/v1/schedules/{schedule_id}` - Delete schedule
- `GET /api/v1/schedules/today/` - Get today's schedules
- `GET /api/v1/schedules/upcoming/` - Get upcoming schedules

## 🗄️ Database Models

### User Model
- Basic user information (email, username, name)
- Authentication data (hashed password)
- Profile information (bio, profile picture)
- Admin flags and status

### Note Model
- Title and content
- Favorite and archive status
- Tags and color coding
- User ownership

### Task Model
- Title and description
- Status (pending, in_progress, completed, cancelled)
- Priority levels (low, medium, high, urgent)
- Due dates and completion tracking
- Recurring task support

### Schedule Model
- Event details (title, description, location)
- Time management (start/end times, all-day events)
- Recurring events support
- Reminders and color coding

## ⚙️ Configuration

Key configuration options in `.env`:

```env
# App Configuration
PROJECT_NAME=Hey Buddy API
DEBUG=True
HOST=0.0.0.0
PORT=8001

# Database
DATABASE_URL=mysql+pymysql://username:password@localhost:3306/hey_buddy_db

# Security
SECRET_KEY=your-super-secret-key-change-in-production
ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS
BACKEND_CORS_ORIGINS=["http://localhost:3000"]
```

## 🧪 Development

### Database Operations
```bash
# Create new migration
alembic revision --autogenerate -m "Description of changes"

# Apply migrations
alembic upgrade head

# Rollback migration
alembic downgrade -1
```

### Testing
```bash
# Run tests
pytest

# Run tests with coverage
pytest --cov=app tests/

# Run specific test file
pytest tests/test_auth.py
```

## 🚀 Production Deployment

1. **Environment Setup**:
   - Set `DEBUG=False`
   - Use strong `SECRET_KEY`
   - Configure production database

2. **Database**:
   - Use production MySQL instance
   - Run migrations: `alembic upgrade head`

3. **Server**:
   - Use production WSGI server (Gunicorn)
   - Set up reverse proxy (Nginx)
   - Configure SSL/TLS certificates

4. **Monitoring**:
   - Set up logging and monitoring
   - Configure health checks
   - Set up backup strategies

## 📄 License

This project is licensed under the MIT License.
