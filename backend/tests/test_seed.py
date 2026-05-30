from sqlalchemy import func, select

from app.db.models import ProjectVisibility, ResearchField, ResearchProject, User
from app.services.seed import seed_database


def test_seed_database_is_idempotent_and_creates_expected_demo_data(client, db_session):
    seed_database()
    seed_database()

    user_count = db_session.scalar(select(func.count(User.id)))
    field_count = db_session.scalar(select(func.count(ResearchField.id)))
    project_count = db_session.scalar(select(func.count(ResearchProject.id)))
    private_project_count = db_session.scalar(
        select(func.count(ResearchProject.id)).where(ResearchProject.visibility == ProjectVisibility.PRIVATE)
    )

    assert user_count == 3
    assert field_count == 6
    assert project_count == 2
    assert private_project_count == 1

    admin_login = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@litera.ac.id", "password": "AdminDemo123!"},
    )
    student_login = client.post(
        "/api/v1/auth/login",
        json={"email": "arif@mahasiswa.ac.id", "password": "StudentDemo123!"},
    )

    assert admin_login.status_code == 200
    assert admin_login.json()["user"]["role"] == "admin"
    assert student_login.status_code == 200
    assert student_login.json()["user"]["role"] == "student"
