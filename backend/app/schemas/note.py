from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class NoteBase(BaseModel):
    title: str
    content: Optional[str] = None
    is_favorite: bool = False
    is_archived: bool = False
    tags: Optional[List[str]] = None
    color: str = "#ffffff"


class NoteCreate(NoteBase):
    pass


class NoteUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    is_favorite: Optional[bool] = None
    is_archived: Optional[bool] = None
    tags: Optional[List[str]] = None
    color: Optional[str] = None


class NoteInDBBase(NoteBase):
    id: int
    owner_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class Note(NoteInDBBase):
    pass


class NoteInDB(NoteInDBBase):
    pass
