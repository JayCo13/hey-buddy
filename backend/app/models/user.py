from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base_class import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(100), unique=True, index=True, nullable=False)
    first_name = Column(String(100), nullable=True)
    last_name = Column(String(100), nullable=True)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    profile_picture = Column(String(500), nullable=True)
    bio = Column(Text, nullable=True)
    # Face recognition fields
    face_encoding = Column(Text, nullable=True)  # Store face encoding as JSON string
    face_image_path = Column(String(500), nullable=True)  # Path to stored face image
    face_enabled = Column(Boolean, default=False)  # Whether face login is enabled
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())

    # Relationships
    notes = relationship("Note", back_populates="owner")
    tasks = relationship("Task", back_populates="owner")
    schedules = relationship("Schedule", back_populates="owner")
