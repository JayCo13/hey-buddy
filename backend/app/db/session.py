from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    echo=settings.DEBUG,  # Log SQL queries in debug mode
    pool_recycle=3600,  # Recycle connections after 1 hour
    pool_size=10,  # Number of connections to maintain
    max_overflow=20  # Maximum number of connections that can be created beyond pool_size
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
