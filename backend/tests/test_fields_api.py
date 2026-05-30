from app.db.models import UserRole
from tests.helpers import auth_headers, create_field, create_project, create_user


def test_fields_require_authentication(client):
    response = client.get("/api/v1/fields")

    assert response.status_code == 401


def test_students_see_active_fields_and_admin_can_include_inactive(client, db_session):
    admin = create_user(
        db_session,
        email="admin@example.com",
        student_number="ADM001",
        role=UserRole.ADMIN,
        name="Admin Litera",
    )
    student = create_user(db_session, email="student@example.com", student_number="2021000001")
    create_field(db_session, name="Aktif", slug="aktif", is_active=True)
    create_field(db_session, name="Nonaktif", slug="nonaktif", is_active=False)

    student_response = client.get(
        "/api/v1/fields?include_inactive=true",
        headers=auth_headers(client, student.email),
    )
    admin_response = client.get(
        "/api/v1/fields?include_inactive=true",
        headers=auth_headers(client, admin.email),
    )

    assert student_response.status_code == 200
    assert [item["slug"] for item in student_response.json()["items"]] == ["aktif"]
    assert admin_response.status_code == 200
    assert {item["slug"] for item in admin_response.json()["items"]} == {"aktif", "nonaktif"}


def test_admin_can_create_update_and_delete_empty_field(client, db_session):
    admin = create_user(
        db_session,
        email="admin@example.com",
        student_number="ADM001",
        role=UserRole.ADMIN,
        name="Admin Litera",
    )
    student = create_user(db_session, email="student@example.com", student_number="2021000001")
    admin_headers = auth_headers(client, admin.email)

    forbidden = client.post(
        "/api/v1/fields",
        headers=auth_headers(client, student.email),
        json={"name": "Sistem Cerdas", "description": "AI", "icon": "Brain"},
    )
    created = client.post(
        "/api/v1/fields",
        headers=admin_headers,
        json={"name": "Sistem Cerdas", "description": "AI", "icon": "Brain"},
    )
    duplicate = client.post(
        "/api/v1/fields",
        headers=admin_headers,
        json={"name": "Sistem Cerdas", "description": "Duplikat", "icon": "Brain"},
    )

    assert forbidden.status_code == 403
    assert created.status_code == 201
    assert created.json()["slug"] == "sistem-cerdas"
    assert duplicate.status_code == 409

    field_id = created.json()["id"]
    updated = client.patch(
        f"/api/v1/fields/{field_id}",
        headers=admin_headers,
        json={"name": "Sistem Cerdas Terapan", "is_active": False},
    )
    hidden_from_student = client.get(f"/api/v1/fields/{field_id}", headers=auth_headers(client, student.email))
    deleted = client.delete(f"/api/v1/fields/{field_id}", headers=admin_headers)

    assert updated.status_code == 200
    assert updated.json()["slug"] == "sistem-cerdas-terapan"
    assert updated.json()["is_active"] is False
    assert hidden_from_student.status_code == 404
    assert deleted.status_code == 204


def test_field_with_projects_cannot_be_deleted(client, db_session):
    admin = create_user(
        db_session,
        email="admin@example.com",
        student_number="ADM001",
        role=UserRole.ADMIN,
        name="Admin Litera",
    )
    owner = create_user(db_session, email="owner@example.com", student_number="2021000001")
    field = create_field(db_session)
    create_project(db_session, owner=owner, field=field)

    response = client.delete(f"/api/v1/fields/{field.id}", headers=auth_headers(client, admin.email))

    assert response.status_code == 409
