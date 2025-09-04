from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Any
from app.db.deps import get_db
from app.schemas.user import User, UserUpdate
from app.crud import crud_user
from app.core.deps import get_current_user, get_current_active_superuser
from app.models.user import User as UserModel

router = APIRouter()

@router.get("/me", response_model=User)
def get_user_me(
    current_user: UserModel = Depends(get_current_user)
) -> Any:
    """
    Get current user
    """
    return current_user

@router.put("/me", response_model=User)
def update_user_me(
    *,
    db: Session = Depends(get_db),
    user_in: UserUpdate,
    current_user: UserModel = Depends(get_current_user)
) -> Any:
    """
    Update current user
    """
    user = crud_user.update(db=db, db_obj=current_user, obj_in=user_in)
    return user

@router.get("/", response_model=List[User])
def get_users(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: UserModel = Depends(get_current_active_superuser)
) -> Any:
    """
    Retrieve all users (admin only)
    """
    users = crud_user.get_multi(db, skip=skip, limit=limit)
    return users

@router.get("/{user_id}", response_model=User)
def get_user_by_id(
    user_id: int,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    Get a specific user by ID
    """
    user = crud_user.get(db, id=user_id)
    if not user:
        raise HTTPException(
            status_code=404,
            detail="The user with this ID does not exist in the system"
        )
    
    # Users can only see their own profile or admin can see all
    if user == current_user or current_user.is_superuser:
        return user
    
    raise HTTPException(
        status_code=403,
        detail="Not enough permissions"
    )

@router.put("/{user_id}", response_model=User)
def update_user(
    *,
    db: Session = Depends(get_db),
    user_id: int,
    user_in: UserUpdate,
    current_user: UserModel = Depends(get_current_active_superuser)
) -> Any:
    """
    Update a user (admin only)
    """
    user = crud_user.get(db, id=user_id)
    if not user:
        raise HTTPException(
            status_code=404,
            detail="The user with this ID does not exist in the system"
        )
    
    user = crud_user.update(db, db_obj=user, obj_in=user_in)
    return user
