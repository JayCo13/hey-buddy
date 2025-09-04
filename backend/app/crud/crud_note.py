from typing import List, Optional
from sqlalchemy.orm import Session
from app.crud.base import CRUDBase
from app.models.note import Note
from app.schemas.note import NoteCreate, NoteUpdate
import json


class CRUDNote(CRUDBase[Note, NoteCreate, NoteUpdate]):
    def create_with_owner(
        self, db: Session, *, obj_in: NoteCreate, owner_id: int
    ) -> Note:
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
        self, db: Session, *, owner_id: int, skip: int = 0, limit: int = 100
    ) -> List[Note]:
        return (
            db.query(self.model)
            .filter(Note.owner_id == owner_id)
            .filter(Note.is_archived == False)
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_favorites_by_owner(
        self, db: Session, *, owner_id: int
    ) -> List[Note]:
        return (
            db.query(self.model)
            .filter(Note.owner_id == owner_id)
            .filter(Note.is_favorite == True)
            .filter(Note.is_archived == False)
            .all()
        )

    def get_archived_by_owner(
        self, db: Session, *, owner_id: int
    ) -> List[Note]:
        return (
            db.query(self.model)
            .filter(Note.owner_id == owner_id)
            .filter(Note.is_archived == True)
            .all()
        )

    def update(self, db: Session, *, db_obj: Note, obj_in: NoteUpdate) -> Note:
        obj_data = obj_in.dict(exclude_unset=True)
        # Convert tags list to JSON string
        if "tags" in obj_data and obj_data["tags"] is not None:
            obj_data["tags"] = json.dumps(obj_data["tags"])
        
        return super().update(db, db_obj=db_obj, obj_in=obj_data)


crud_note = CRUDNote(Note)
