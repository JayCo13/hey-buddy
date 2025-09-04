from fastapi import APIRouter
from app.api.v1.endpoints import users, auth, notes, tasks, schedules

api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(notes.router, prefix="/notes", tags=["notes"])
api_router.include_router(tasks.router, prefix="/tasks", tags=["tasks"])
api_router.include_router(schedules.router, prefix="/schedules", tags=["schedules"])
