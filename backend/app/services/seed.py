from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import get_password_hash
from app.db.models import ProjectVisibility, ResearchField, ResearchProject, User, UserRole
from app.db.session import SessionLocal

DEMO_ADMIN_PASSWORD = "AdminDemo123!"
DEMO_STUDENT_PASSWORD = "StudentDemo123!"

FIELDS = [
    ("Jaringan Komputer", "jaringan-komputer", "Infrastruktur jaringan, monitoring, routing, dan keamanan jaringan.", "Network"),
    ("Artificial Intelligence", "artificial-intelligence", "Machine learning, deep learning, computer vision, dan NLP.", "Brain"),
    ("Internet of Things", "iot", "Sensor, perangkat embedded, MQTT, dan integrasi cloud.", "Cpu"),
    ("Sistem Informasi", "sistem-informasi", "Sistem informasi manajemen, analitik, dan solusi bisnis.", "Database"),
    ("Data Mining", "data-mining", "Klasifikasi, clustering, association rule, dan pattern mining.", "BarChart2"),
    ("Rekayasa Perangkat Lunak", "rpl", "Metodologi software, testing, arsitektur, dan DevOps.", "Code2"),
]

USERS = [
    {
        "name": "Administrator Litera",
        "student_number": "ADM001",
        "email": "admin@litera.local",
        "password": DEMO_ADMIN_PASSWORD,
        "study_program": "Administrasi Sistem",
        "class_name": "Admin",
        "role": UserRole.ADMIN,
    },
    {
        "name": "Arif Budiman",
        "student_number": "2021001234",
        "email": "arif@mahasiswa.ac.id",
        "password": DEMO_STUDENT_PASSWORD,
        "study_program": "Teknik Informatika",
        "class_name": "TI-4A",
        "role": UserRole.STUDENT,
    },
    {
        "name": "Siti Rahayu",
        "student_number": "2021002345",
        "email": "siti@mahasiswa.ac.id",
        "password": DEMO_STUDENT_PASSWORD,
        "study_program": "Teknik Informatika",
        "class_name": "TI-4B",
        "role": UserRole.STUDENT,
    },
]


def _get_or_create_user(db: Session, user_data: dict) -> User:
    user = db.scalar(select(User).where(User.email == user_data["email"]))
    if user is not None:
        return user

    user = User(
        name=user_data["name"],
        student_number=user_data["student_number"],
        email=user_data["email"],
        password_hash=get_password_hash(user_data["password"]),
        study_program=user_data["study_program"],
        class_name=user_data["class_name"],
        role=user_data["role"],
        is_active=True,
    )
    db.add(user)
    db.flush()
    return user


def _get_or_create_field(db: Session, name: str, slug: str, description: str, icon: str) -> ResearchField:
    field = db.scalar(select(ResearchField).where(ResearchField.slug == slug))
    if field is not None:
        return field

    field = ResearchField(name=name, slug=slug, description=description, icon=icon, is_active=True)
    db.add(field)
    db.flush()
    return field


def _get_or_create_project(
    db: Session,
    owner: User,
    research_field: ResearchField,
    title: str,
    description: str,
    keywords: list[str],
) -> ResearchProject:
    project = db.scalar(
        select(ResearchProject).where(
            ResearchProject.user_id == owner.id,
            ResearchProject.title == title,
        )
    )
    if project is not None:
        return project

    project = ResearchProject(
        owner=owner,
        research_field=research_field,
        title=title,
        description=description,
        keywords=keywords,
        visibility=ProjectVisibility.PUBLIC,
    )
    db.add(project)
    db.flush()
    return project


def seed_database() -> None:
    with SessionLocal() as db:
        users = {data["email"]: _get_or_create_user(db, data) for data in USERS}
        fields = {
            slug: _get_or_create_field(db, name, slug, description, icon)
            for name, slug, description, icon in FIELDS
        }

        _get_or_create_project(
            db,
            users["arif@mahasiswa.ac.id"],
            fields["jaringan-komputer"],
            "Perancangan Network Monitoring System Terintegrasi untuk Monitoring OLT dan PPPoE",
            "Koleksi literatur untuk penelitian monitoring OLT, PPPoE, SNMP, GPON, dan FTTH.",
            ["SNMP", "OLT", "ONU", "PPPoE", "MikroTik", "FTTH"],
        )
        _get_or_create_project(
            db,
            users["siti@mahasiswa.ac.id"],
            fields["artificial-intelligence"],
            "Implementasi Deep Learning untuk Deteksi Objek Real-Time pada Sistem Keamanan",
            "Koleksi referensi untuk deteksi objek real-time menggunakan model deep learning.",
            ["YOLO", "Object Detection", "CNN", "Real-time"],
        )
        db.commit()


if __name__ == "__main__":
    seed_database()
    print("Seed data completed.")
