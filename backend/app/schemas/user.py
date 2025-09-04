from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class UserBase(BaseModel):
    email: EmailStr
    username: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    bio: Optional[str] = None
    face_enabled: Optional[bool] = False


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    username: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    bio: Optional[str] = None
    is_active: Optional[bool] = None
    face_enabled: Optional[bool] = None


class UserInDBBase(UserBase):
    id: int
    is_active: bool
    is_superuser: bool
    profile_picture: Optional[str] = None
    face_image_path: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class User(UserInDBBase):
    pass


class UserInDB(UserInDBBase):
    hashed_password: str
    face_encoding: Optional[str] = None

# Face recognition schemas
class FaceLoginRequest(BaseModel):
    face_image: str  # Base64 encoded image

class FaceRegistrationRequest(BaseModel):
    face_image: str  # Base64 encoded image
    enable_face_login: bool = True

class FaceRegistrationResponse(BaseModel):
    success: bool
    message: str
    face_enabled: bool
