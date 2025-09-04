from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Any
from app.db.deps import get_db
from app.schemas.note import Note, NoteCreate, NoteUpdate
from app.crud import crud_note
from app.core.deps import get_current_user
from app.models.user import User

router = APIRouter()

@router.get("/", response_model=List[Note])
def get_notes(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Retrieve notes for current user
    """
    notes = crud_note.get_multi_by_owner(
        db=db, owner_id=current_user.id, skip=skip, limit=limit
    )
    return notes

@router.post("/", response_model=Note)
def create_note(
    *,
    db: Session = Depends(get_db),
    note_in: NoteCreate,
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Create new note
    """
    note = crud_note.create_with_owner(
        db=db, obj_in=note_in, owner_id=current_user.id
    )
    return note

@router.put("/{note_id}", response_model=Note)
def update_note(
    *,
    db: Session = Depends(get_db),
    note_id: int,
    note_in: NoteUpdate,
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Update a note
    """
    note = crud_note.get(db=db, id=note_id)
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    if note.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    note = crud_note.update(db=db, db_obj=note, obj_in=note_in)
    return note

@router.get("/{note_id}", response_model=Note)
def get_note(
    *,
    db: Session = Depends(get_db),
    note_id: int,
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Get note by ID
    """
    note = crud_note.get(db=db, id=note_id)
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    if note.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return note

@router.delete("/{note_id}")
def delete_note(
    *,
    db: Session = Depends(get_db),
    note_id: int,
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Delete a note
    """
    note = crud_note.get(db=db, id=note_id)
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    if note.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    note = crud_note.remove(db=db, id=note_id)
    return {"message": "Note deleted successfully"}

@router.get("/favorites/", response_model=List[Note])
def get_favorite_notes(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Get favorite notes for current user
    """
    notes = crud_note.get_favorites_by_owner(db=db, owner_id=current_user.id)
    return notes

@router.get("/archived/", response_model=List[Note])
def get_archived_notes(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Get archived notes for current user
    """
    notes = crud_note.get_archived_by_owner(db=db, owner_id=current_user.id)
    return notes
