from fastapi.testclient import TestClient
import fitz
from sqlalchemy.orm import Session

from app.core.security import get_password_hash
from app.db.models import Document, IndexStatus, ProjectVisibility, ResearchField, ResearchProject, User, UserRole

DEFAULT_PASSWORD = "Password123!"


def create_user(
    db: Session,
    email: str,
    student_number: str,
    role: UserRole = UserRole.STUDENT,
    name: str = "Test User",
    is_active: bool = True,
) -> User:
    user = User(
        name=name,
        student_number=student_number,
        email=email,
        password_hash=get_password_hash(DEFAULT_PASSWORD),
        study_program="Teknik Informatika",
        class_name="TI-4A",
        role=role,
        is_active=is_active,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def auth_headers(client: TestClient, email: str, password: str = DEFAULT_PASSWORD) -> dict[str, str]:
    response = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert response.status_code == 200
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def create_field(
    db: Session,
    name: str = "Jaringan Komputer",
    slug: str = "jaringan-komputer",
    is_active: bool = True,
) -> ResearchField:
    field = ResearchField(
        name=name,
        slug=slug,
        description=f"Deskripsi {name}",
        icon="BookOpen",
        is_active=is_active,
    )
    db.add(field)
    db.commit()
    db.refresh(field)
    return field


def create_project(
    db: Session,
    owner: User,
    field: ResearchField,
    title: str = "Koleksi Penelitian",
    visibility: ProjectVisibility = ProjectVisibility.PUBLIC,
) -> ResearchProject:
    project = ResearchProject(
        owner=owner,
        research_field=field,
        title=title,
        description="Koleksi literatur uji.",
        keywords=["SNMP", "Monitoring"],
        visibility=visibility,
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


def create_document(
    db: Session,
    project: ResearchProject,
    file_path: str,
    title: str = "Document",
    original_filename: str = "document.pdf",
    stored_filename: str = "document.pdf",
    file_size: int = 100,
    index_status: IndexStatus = IndexStatus.PENDING,
) -> Document:
    document = Document(
        research_project=project,
        title=title,
        original_filename=original_filename,
        stored_filename=stored_filename,
        file_path=file_path,
        total_pages=0,
        file_size=file_size,
        index_status=index_status,
    )
    db.add(document)
    db.commit()
    db.refresh(document)
    return document


def make_pdf_bytes(page_texts: list[str]) -> bytes:
    pdf = fitz.open()
    for text in page_texts:
        page = pdf.new_page()
        if text:
            page.insert_text((72, 72), text)
    data = pdf.tobytes()
    pdf.close()
    return data


def pdf_upload(filename: str, content: bytes, content_type: str = "application/pdf"):
    return ("files", (filename, content, content_type))
