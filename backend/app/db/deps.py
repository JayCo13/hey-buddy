from typing import Generator
from sqlalchemy.orm import Session
from app.db.session import SessionLocal


def get_db() -> Generator:
    """
    Database dependency for FastAPI endpoints
    """
    try:
        db = SessionLocal()
        yield db
    finally:
        db.close()
