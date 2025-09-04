from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Any, Optional
from app.db.deps import get_db
from app.schemas.task import Task, TaskCreate, TaskUpdate
from app.models.task import TaskStatus, TaskPriority
from app.crud import crud_task
from app.core.deps import get_current_user
from app.models.user import User

router = APIRouter()

@router.get("/", response_model=List[Task])
def get_tasks(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    status: Optional[TaskStatus] = None,
    priority: Optional[TaskPriority] = None,
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Retrieve tasks for current user with optional filtering
    """
    tasks = crud_task.get_multi_by_owner(
        db=db, owner_id=current_user.id, skip=skip, limit=limit,
        status=status, priority=priority
    )
    return tasks

@router.post("/", response_model=Task)
def create_task(
    *,
    db: Session = Depends(get_db),
    task_in: TaskCreate,
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Create new task
    """
    task = crud_task.create_with_owner(
        db=db, obj_in=task_in, owner_id=current_user.id
    )
    return task

@router.put("/{task_id}", response_model=Task)
def update_task(
    *,
    db: Session = Depends(get_db),
    task_id: int,
    task_in: TaskUpdate,
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Update a task
    """
    task = crud_task.get(db=db, id=task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    if task.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    task = crud_task.update(db=db, db_obj=task, obj_in=task_in)
    return task

@router.get("/{task_id}", response_model=Task)
def get_task(
    *,
    db: Session = Depends(get_db),
    task_id: int,
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Get task by ID
    """
    task = crud_task.get(db=db, id=task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    if task.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return task

@router.delete("/{task_id}")
def delete_task(
    *,
    db: Session = Depends(get_db),
    task_id: int,
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Delete a task
    """
    task = crud_task.get(db=db, id=task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    if task.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    task = crud_task.remove(db=db, id=task_id)
    return {"message": "Task deleted successfully"}

@router.patch("/{task_id}/complete", response_model=Task)
def complete_task(
    *,
    db: Session = Depends(get_db),
    task_id: int,
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Mark task as completed
    """
    task = crud_task.get(db=db, id=task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    if task.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    task = crud_task.mark_completed(db=db, task=task)
    return task

@router.get("/status/{status}", response_model=List[Task])
def get_tasks_by_status(
    *,
    db: Session = Depends(get_db),
    status: TaskStatus,
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Get tasks by status for current user
    """
    tasks = crud_task.get_by_status(db=db, owner_id=current_user.id, status=status)
    return tasks
