from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr

from app.db.models import UserRole


class UserPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    student_number: str
    email: EmailStr
    study_program: str
    class_name: str
    role: UserRole
    is_active: bool
    created_at: datetime
    updated_at: datetime
