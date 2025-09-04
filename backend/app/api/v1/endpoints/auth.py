from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import Any
from app.db.deps import get_db
from app.schemas.user import User, UserCreate, FaceLoginRequest, FaceRegistrationRequest, FaceRegistrationResponse
from app.core.security import create_access_token, get_password_hash, verify_password
from app.crud import crud_user
from app.core.face_recognition import FaceRecognitionService
from app.core.deps import get_current_user

router = APIRouter()

# Pydantic models for request/response
class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: User

class RegisterRequest(BaseModel):
    username: str
    email: EmailStr
    password: str
    first_name: str = None
    last_name: str = None

class Token(BaseModel):
    access_token: str
    token_type: str

@router.post("/login", response_model=LoginResponse)
async def login(
    db: Session = Depends(get_db),
    form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    """
    OAuth2 compatible token login, get an access token for future requests
    """
    user = crud_user.authenticate(
        db, email=form_data.username, password=form_data.password
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    elif not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    
    access_token = create_access_token(subject=user.id)
    return LoginResponse(
        access_token=access_token,
        user=user
    )

@router.post("/register", response_model=User)
async def register(
    user_in: RegisterRequest,
    db: Session = Depends(get_db)
) -> Any:
    """
    Create new user
    """
    user = crud_user.get_by_email(db, email=user_in.email)
    if user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The user with this email already exists in the system"
        )
    
    user = crud_user.get_by_username(db, username=user_in.username)
    if user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The user with this username already exists in the system"
        )
    
    user_create = UserCreate(
        email=user_in.email,
        username=user_in.username,
        password=user_in.password,
        first_name=user_in.first_name,
        last_name=user_in.last_name
    )
    user = crud_user.create(db, obj_in=user_create)
    return user

@router.post("/logout")
async def logout():
    """
    User logout endpoint
    """
    return {"message": "Successfully logged out"}

@router.post("/face-login", response_model=LoginResponse)
async def face_login(
    face_request: FaceLoginRequest,
    db: Session = Depends(get_db)
) -> Any:
    """
    Login using face recognition
    """
    face_service = FaceRecognitionService()
    
    # Find user by face recognition
    user = face_service.authenticate_by_face(db, face_request.face_image)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Face not recognized"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    
    access_token = create_access_token(subject=user.id)
    return LoginResponse(
        access_token=access_token,
        user=user
    )

@router.post("/register-face", response_model=FaceRegistrationResponse)
async def register_face(
    face_request: FaceRegistrationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    Register face for current user
    """
    face_service = FaceRecognitionService()
    
    success = face_service.register_face(
        db, current_user.id, face_request.face_image, face_request.enable_face_login
    )
    
    if success:
        return FaceRegistrationResponse(
            success=True,
            message="Face registered successfully",
            face_enabled=face_request.enable_face_login
        )
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to register face"
        )
