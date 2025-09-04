from typing import List, Optional
from sqlalchemy.orm import Session
from datetime import datetime
from app.crud.base import CRUDBase
from app.models.task import Task, TaskStatus, TaskPriority
from app.schemas.task import TaskCreate, TaskUpdate
import json


class CRUDTask(CRUDBase[Task, TaskCreate, TaskUpdate]):
    def create_with_owner(
        self, db: Session, *, obj_in: TaskCreate, owner_id: int
    ) -> Task:
        obj_in_data = obj_in.dict()
        # Convert tags list to JSON string
        if obj_in_data.get("tags"):
            obj_in_data["tags"] = json.dumps(obj_in_data["tags"])
        
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
        status: Optional[TaskStatus] = None,
        priority: Optional[TaskPriority] = None
    ) -> List[Task]:
        query = db.query(self.model).filter(Task.owner_id == owner_id)
        
        if status:
            query = query.filter(Task.status == status)
        if priority:
            query = query.filter(Task.priority == priority)
        
        return query.offset(skip).limit(limit).all()

    def get_by_status(
        self, db: Session, *, owner_id: int, status: TaskStatus
    ) -> List[Task]:
        return (
            db.query(self.model)
            .filter(Task.owner_id == owner_id)
            .filter(Task.status == status)
            .all()
        )

    def mark_completed(self, db: Session, *, task: Task) -> Task:
        task.status = TaskStatus.COMPLETED
        task.completed_at = datetime.utcnow()
        db.add(task)
        db.commit()
        db.refresh(task)
        return task

    def update(self, db: Session, *, db_obj: Task, obj_in: TaskUpdate) -> Task:
        obj_data = obj_in.dict(exclude_unset=True)
        # Convert tags list to JSON string
        if "tags" in obj_data and obj_data["tags"] is not None:
            obj_data["tags"] = json.dumps(obj_data["tags"])
        
        # Set completed_at if status is being changed to completed
        if obj_data.get("status") == TaskStatus.COMPLETED and db_obj.status != TaskStatus.COMPLETED:
            obj_data["completed_at"] = datetime.utcnow()
        
        return super().update(db, db_obj=db_obj, obj_in=obj_data)


crud_task = CRUDTask(Task)
