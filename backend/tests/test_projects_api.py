from app.db.models import ProjectVisibility, UserRole
from tests.helpers import auth_headers, create_field, create_project, create_user


def test_project_creation_requires_active_field(client, db_session):
    student = create_user(db_session, email="student@example.com", student_number="2021000001")
    active_field = create_field(db_session, name="Jaringan", slug="jaringan", is_active=True)
    inactive_field = create_field(db_session, name="Arsip", slug="arsip", is_active=False)
    headers = auth_headers(client, student.email)

    created = client.post(
        "/api/v1/projects",
        headers=headers,
        json={
            "research_field_id": active_field.id,
            "title": "Monitoring OLT",
            "description": "Koleksi monitoring jaringan.",
            "keywords": ["SNMP", "SNMP", "OLT"],
            "visibility": "private",
        },
    )
    rejected = client.post(
        "/api/v1/projects",
        headers=headers,
        json={
            "research_field_id": inactive_field.id,
            "title": "Koleksi Arsip",
            "description": "Tidak boleh memakai field inactive.",
        },
    )

    assert created.status_code == 201
    assert created.json()["owner"]["id"] == student.id
    assert created.json()["keywords"] == ["SNMP", "OLT"]
    assert created.json()["visibility"] == "private"
    assert rejected.status_code == 422


def test_project_visibility_hides_private_projects_from_other_students(client, db_session):
    owner = create_user(db_session, email="owner@example.com", student_number="2021000001")
    other = create_user(db_session, email="other@example.com", student_number="2021000002")
    admin = create_user(
        db_session,
        email="admin@example.com",
        student_number="ADM001",
        role=UserRole.ADMIN,
        name="Admin Litera",
    )
    field = create_field(db_session)
    public_project = create_project(db_session, owner=owner, field=field, title="Public Project")
    private_project = create_project(
        db_session,
        owner=owner,
        field=field,
        title="Private Project",
        visibility=ProjectVisibility.PRIVATE,
    )

    other_list = client.get("/api/v1/projects", headers=auth_headers(client, other.email))
    other_detail = client.get(f"/api/v1/projects/{private_project.id}", headers=auth_headers(client, other.email))
    owner_detail = client.get(f"/api/v1/projects/{private_project.id}", headers=auth_headers(client, owner.email))
    admin_detail = client.get(f"/api/v1/projects/{private_project.id}", headers=auth_headers(client, admin.email))

    assert other_list.status_code == 200
    assert [item["id"] for item in other_list.json()["items"]] == [public_project.id]
    assert other_detail.status_code == 404
    assert owner_detail.status_code == 200
    assert admin_detail.status_code == 200


def test_owner_or_admin_can_update_and_delete_project(client, db_session):
    owner = create_user(db_session, email="owner@example.com", student_number="2021000001")
    other = create_user(db_session, email="other@example.com", student_number="2021000002")
    admin = create_user(
        db_session,
        email="admin@example.com",
        student_number="ADM001",
        role=UserRole.ADMIN,
        name="Admin Litera",
    )
    field = create_field(db_session)
    replacement_field = create_field(db_session, name="Data Mining", slug="data-mining")
    project = create_project(
        db_session,
        owner=owner,
        field=field,
        title="Original Title",
        visibility=ProjectVisibility.PRIVATE,
    )

    forbidden = client.patch(
        f"/api/v1/projects/{project.id}",
        headers=auth_headers(client, other.email),
        json={"title": "Tidak Berhak"},
    )
    updated = client.patch(
        f"/api/v1/projects/{project.id}",
        headers=auth_headers(client, owner.email),
        json={
            "research_field_id": replacement_field.id,
            "title": "Updated Title",
            "keywords": ["TF-IDF", "tf-idf", "Index"],
            "visibility": "public",
        },
    )
    deleted = client.delete(f"/api/v1/projects/{project.id}", headers=auth_headers(client, admin.email))

    assert forbidden.status_code == 403
    assert updated.status_code == 200
    assert updated.json()["title"] == "Updated Title"
    assert updated.json()["field"]["id"] == replacement_field.id
    assert updated.json()["keywords"] == ["TF-IDF", "Index"]
    assert updated.json()["visibility"] == "public"
    assert deleted.status_code == 204


def test_my_projects_returns_only_authenticated_users_projects(client, db_session):
    owner = create_user(db_session, email="owner@example.com", student_number="2021000001")
    other = create_user(db_session, email="other@example.com", student_number="2021000002")
    field = create_field(db_session)
    own_project = create_project(db_session, owner=owner, field=field, title="Own Project")
    create_project(db_session, owner=other, field=field, title="Other Project")

    response = client.get("/api/v1/projects/me", headers=auth_headers(client, owner.email))

    assert response.status_code == 200
    assert response.json()["pagination"]["total"] == 1
    assert response.json()["items"][0]["id"] == own_project.id
