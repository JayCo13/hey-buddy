# Hey Buddy - AI-Powered Productivity App

A full-stack productivity application with AI-powered features, built with React frontend and FastAPI backend.

## Features

- **Notes Management**: Create, edit, and organize notes with AI assistance
- **Task Management**: Track and manage your tasks efficiently
- **Schedule Management**: Plan and organize your schedule
- **Face Recognition**: Secure authentication using facial recognition
- **Offline Support**: Works offline with local database storage

## Tech Stack

### Frontend
- **React**: Modern UI framework
- **Tailwind CSS**: Utility-first CSS framework
- **IndexedDB**: Local database for offline functionality

### Backend
- **FastAPI**: Modern Python web framework
- **SQLAlchemy**: ORM for database operations
- **Alembic**: Database migrations
- **Face Recognition**: AI-powered facial authentication
- **JWT**: Secure authentication

## Project Structure

```
hey-buddy/
├── frontend/          # React frontend application
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── services/      # API services
│   │   ├── hooks/         # Custom React hooks
│   │   ├── db/           # Database utilities
│   │   └── utils/        # Utility functions
│   └── public/          # Static assets
├── backend/           # FastAPI backend application
│   ├── app/
│   │   ├── api/         # API endpoints
│   │   ├── models/       # Database models
│   │   ├── schemas/      # Pydantic schemas
│   │   ├── crud/         # CRUD operations
│   │   └── core/         # Core configurations
│   └── alembic/         # Database migrations
└── README.md
```

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- Python (v3.8 or higher)
- pip (Python package manager)

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

The frontend will be available at `http://localhost:3000`

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Set up the database:
   ```bash
   alembic upgrade head
   ```

5. Start the backend server:
   ```bash
   python main.py
   ```

The backend API will be available at `http://localhost:8000`

## API Documentation

Once the backend is running, you can access the interactive API documentation at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Development

### Database Migrations

To create a new migration:
```bash
cd backend
alembic revision --autogenerate -m "Description of changes"
alembic upgrade head
```

### Adding New Features

1. Create new models in `backend/app/models/`
2. Add CRUD operations in `backend/app/crud/`
3. Create API schemas in `backend/app/schemas/`
4. Add endpoints in `backend/app/api/v1/endpoints/`
5. Update frontend components and services accordingly

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- React team for the amazing frontend framework
- FastAPI team for the modern Python web framework
- Tailwind CSS for the utility-first CSS framework
