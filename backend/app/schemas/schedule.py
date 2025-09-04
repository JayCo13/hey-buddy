from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ScheduleBase(BaseModel):
    title: str
    description: Optional[str] = None
    start_time: datetime
    end_time: datetime
    location: Optional[str] = None
    is_all_day: bool = False
    is_recurring: bool = False
    recurrence_pattern: Optional[str] = None
    reminder_minutes: int = 15
    color: str = "#3498db"


class ScheduleCreate(ScheduleBase):
    pass


class ScheduleUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    location: Optional[str] = None
    is_all_day: Optional[bool] = None
    is_recurring: Optional[bool] = None
    recurrence_pattern: Optional[str] = None
    reminder_minutes: Optional[int] = None
    color: Optional[str] = None


class ScheduleInDBBase(ScheduleBase):
    id: int
    owner_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class Schedule(ScheduleInDBBase):
    pass


class ScheduleInDB(ScheduleInDBBase):
    pass
