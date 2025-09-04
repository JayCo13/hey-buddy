from typing import List, Optional
from sqlalchemy.orm import Session
from datetime import datetime, date, timedelta
from app.crud.base import CRUDBase
from app.models.schedule import Schedule
from app.schemas.schedule import ScheduleCreate, ScheduleUpdate


class CRUDSchedule(CRUDBase[Schedule, ScheduleCreate, ScheduleUpdate]):
    def create_with_owner(
        self, db: Session, *, obj_in: ScheduleCreate, owner_id: int
    ) -> Schedule:
        obj_in_data = obj_in.dict()
        db_obj = self.model(**obj_in_data, owner_id=owner_id)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def get_multi_by_owner(
        self, 
        db: Session, 
        *, 
        owner_id: int, 
        skip: int = 0, 
        limit: int = 100,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None
    ) -> List[Schedule]:
        query = db.query(self.model).filter(Schedule.owner_id == owner_id)
        
        if start_date:
            query = query.filter(Schedule.start_time >= start_date)
        if end_date:
            # Add one day to include events on the end_date
            end_datetime = datetime.combine(end_date, datetime.min.time()) + timedelta(days=1)
            query = query.filter(Schedule.start_time < end_datetime)
        
        return query.order_by(Schedule.start_time).offset(skip).limit(limit).all()

    def get_by_date_range(
        self, 
        db: Session, 
        *, 
        owner_id: int, 
        start_date: date, 
        end_date: date
    ) -> List[Schedule]:
        start_datetime = datetime.combine(start_date, datetime.min.time())
        end_datetime = datetime.combine(end_date, datetime.max.time())
        
        return (
            db.query(self.model)
            .filter(Schedule.owner_id == owner_id)
            .filter(Schedule.start_time >= start_datetime)
            .filter(Schedule.start_time <= end_datetime)
            .order_by(Schedule.start_time)
            .all()
        )

    def get_upcoming(
        self, db: Session, *, owner_id: int, days: int = 7
    ) -> List[Schedule]:
        start_datetime = datetime.now()
        end_datetime = start_datetime + timedelta(days=days)
        
        return (
            db.query(self.model)
            .filter(Schedule.owner_id == owner_id)
            .filter(Schedule.start_time >= start_datetime)
            .filter(Schedule.start_time <= end_datetime)
            .order_by(Schedule.start_time)
            .all()
        )


crud_schedule = CRUDSchedule(Schedule)
