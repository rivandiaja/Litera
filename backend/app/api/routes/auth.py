from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps import get_current_active_user, get_db
from app.core.config import get_settings
from app.core.security import create_access_token, get_password_hash, verify_password
from app.db.models import User, UserRole
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse
from app.schemas.user import UserPublic

router = APIRouter(tags=["auth"])


@router.post("/register", response_model=UserPublic, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: Session = Depends(get_db)) -> User:
    email = payload.email.lower()
    existing_email = db.scalar(select(User).where(func.lower(User.email) == email))
    if existing_email is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email is already registered")

    existing_student_number = db.scalar(
        select(User).where(User.student_number == payload.student_number)
    )
    if existing_student_number is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Student number is already registered")

    user = User(
        name=payload.name,
        student_number=payload.student_number,
        email=email,
        password_hash=get_password_hash(payload.password),
        study_program=payload.study_program,
        class_name=payload.class_name,
        role=UserRole.STUDENT,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    user = db.scalar(select(User).where(func.lower(User.email) == payload.email.lower()))
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user")

    settings = get_settings()
    access_token = create_access_token(subject=str(user.id), issuer=settings.app_name)
    return TokenResponse(access_token=access_token, token_type="bearer", user=UserPublic.model_validate(user))


@router.get("/me", response_model=UserPublic)
def read_me(current_user: User = Depends(get_current_active_user)) -> User:
    return current_user
