from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Any, Optional
from datetime import datetime, date
from app.db.deps import get_db
from app.schemas.schedule import Schedule, ScheduleCreate, ScheduleUpdate
from app.crud import crud_schedule
from app.core.deps import get_current_user
from app.models.user import User

router = APIRouter()

@router.get("/", response_model=List[Schedule])
def get_schedules(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Retrieve schedules for current user with optional date filtering
    """
    schedules = crud_schedule.get_multi_by_owner(
        db=db, owner_id=current_user.id, skip=skip, limit=limit,
        start_date=start_date, end_date=end_date
    )
    return schedules

@router.post("/", response_model=Schedule)
def create_schedule(
    *,
    db: Session = Depends(get_db),
    schedule_in: ScheduleCreate,
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Create new schedule
    """
    # Validate that end_time is after start_time
    if schedule_in.end_time <= schedule_in.start_time:
        raise HTTPException(
            status_code=400, 
            detail="End time must be after start time"
        )
    
    schedule = crud_schedule.create_with_owner(
        db=db, obj_in=schedule_in, owner_id=current_user.id
    )
    return schedule

@router.put("/{schedule_id}", response_model=Schedule)
def update_schedule(
    *,
    db: Session = Depends(get_db),
    schedule_id: int,
    schedule_in: ScheduleUpdate,
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Update a schedule
    """
    schedule = crud_schedule.get(db=db, id=schedule_id)
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    if schedule.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # Validate time if both are being updated
    if (schedule_in.start_time and schedule_in.end_time and 
        schedule_in.end_time <= schedule_in.start_time):
        raise HTTPException(
            status_code=400, 
            detail="End time must be after start time"
        )
    
    schedule = crud_schedule.update(db=db, db_obj=schedule, obj_in=schedule_in)
    return schedule

@router.get("/{schedule_id}", response_model=Schedule)
def get_schedule(
    *,
    db: Session = Depends(get_db),
    schedule_id: int,
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Get schedule by ID
    """
    schedule = crud_schedule.get(db=db, id=schedule_id)
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    if schedule.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return schedule

@router.delete("/{schedule_id}")
def delete_schedule(
    *,
    db: Session = Depends(get_db),
    schedule_id: int,
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Delete a schedule
    """
    schedule = crud_schedule.get(db=db, id=schedule_id)
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    if schedule.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    schedule = crud_schedule.remove(db=db, id=schedule_id)
    return {"message": "Schedule deleted successfully"}

@router.get("/today/", response_model=List[Schedule])
def get_today_schedules(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Get today's schedules for current user
    """
    today = date.today()
    schedules = crud_schedule.get_by_date_range(
        db=db, owner_id=current_user.id, start_date=today, end_date=today
    )
    return schedules

@router.get("/upcoming/", response_model=List[Schedule])
def get_upcoming_schedules(
    db: Session = Depends(get_db),
    days: int = 7,
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Get upcoming schedules for current user (next N days)
    """
    schedules = crud_schedule.get_upcoming(
        db=db, owner_id=current_user.id, days=days
    )
    return schedules
