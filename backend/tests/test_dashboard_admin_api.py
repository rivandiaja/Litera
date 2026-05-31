from app.db.models import IndexStatus, ProjectVisibility, UserRole
from tests.helpers import (
    DEFAULT_PASSWORD,
    auth_headers,
    create_document,
    create_field,
    create_indexed_document,
    create_project,
    create_user,
)


def test_my_dashboard_is_scoped_to_current_user(client, db_session):
    field = create_field(db_session)
    arif = create_user(db_session, "arif@example.com", "2021001", name="Arif")
    siti = create_user(db_session, "siti@example.com", "2021002", name="Siti")
    arif_project = create_project(db_session, arif, field, title="Arif Project")
    siti_project = create_project(db_session, siti, field, title="Siti Project")
    create_indexed_document(db_session, arif_project, "Arif Indexed", ["monitoring snmp", "redaman onu"])
    create_indexed_document(db_session, siti_project, "Siti Indexed", ["private other"])

    client.get("/api/v1/search", params={"q": "snmp"}, headers=auth_headers(client, arif.email))

    response = client.get("/api/v1/dashboard/me", headers=auth_headers(client, arif.email))

    assert response.status_code == 200
    payload = response.json()
    assert payload["summary"]["projects_count"] == 1
    assert payload["summary"]["documents_count"] == 1
    assert payload["summary"]["indexed_documents_count"] == 1
    assert payload["summary"]["indexed_pages_count"] == 2
    assert payload["summary"]["search_history_count"] == 1
    assert payload["recent_projects"][0]["title"] == "Arif Project"
    assert payload["recent_documents"][0]["title"] == "Arif Indexed"
    assert payload["recent_searches"][0]["query"] == "snmp"


def test_repository_stats_count_only_public_active_surface(client, db_session):
    active_field = create_field(db_session, name="Jaringan", slug="jaringan")
    inactive_field = create_field(db_session, name="Nonaktif", slug="nonaktif", is_active=False)
    owner = create_user(db_session, "owner@example.com", "2021001")
    private_owner = create_user(db_session, "private@example.com", "2021002")
    public_project = create_project(db_session, owner, active_field, visibility=ProjectVisibility.PUBLIC)
    private_project = create_project(db_session, private_owner, active_field, visibility=ProjectVisibility.PRIVATE)
    inactive_project = create_project(db_session, owner, inactive_field, visibility=ProjectVisibility.PUBLIC)
    create_indexed_document(db_session, public_project, "Public", ["satu", "dua"])
    create_indexed_document(db_session, private_project, "Private", ["rahasia"])
    create_indexed_document(db_session, inactive_project, "Inactive Field Public", ["tetap public"])

    response = client.get("/api/v1/dashboard/repository-stats", headers=auth_headers(client, owner.email))

    assert response.status_code == 200
    payload = response.json()
    assert payload["fields_count"] == 1
    assert payload["public_projects_count"] == 2
    assert payload["public_documents_count"] == 2
    assert payload["contributors_count"] == 1
    assert payload["indexed_pages_count"] == 3


def test_admin_dashboard_and_permissions(client, db_session):
    field = create_field(db_session)
    admin = create_user(db_session, "admin@example.com", "9001", role=UserRole.ADMIN)
    student = create_user(db_session, "student@example.com", "2021001")
    project = create_project(db_session, student, field, visibility=ProjectVisibility.PRIVATE)
    create_indexed_document(db_session, project, "Private Indexed", ["admin can see private"])
    failed = create_document(
        db_session,
        project,
        file_path="uploads/missing.pdf",
        title="Broken PDF",
        index_status=IndexStatus.FAILED,
    )
    failed.index_message = "Traceback (most recent call last): boom"
    db_session.commit()

    assert client.get("/api/v1/admin/dashboard", headers=auth_headers(client, student.email)).status_code == 403

    response = client.get("/api/v1/admin/dashboard", headers=auth_headers(client, admin.email))

    assert response.status_code == 200
    payload = response.json()
    assert payload["summary"]["users_count"] == 2
    assert payload["summary"]["documents_count"] == 2
    assert payload["summary"]["failed_documents_count"] == 1
    assert payload["failed_documents"][0]["index_message"] == "Indexing gagal. Periksa file PDF dan jalankan re-index."


def test_admin_users_filters_and_deactivation_harden_active_access(client, db_session):
    admin = create_user(db_session, "admin@example.com", "9001", role=UserRole.ADMIN)
    student = create_user(db_session, "siti@example.com", "2021002", name="Siti")
    student_headers = auth_headers(client, student.email)
    admin_headers = auth_headers(client, admin.email)

    list_response = client.get(
        "/api/v1/admin/users",
        params={"search": "siti", "role": "student", "is_active": "true"},
        headers=admin_headers,
    )
    assert list_response.status_code == 200
    assert list_response.json()["pagination"]["total"] == 1

    self_deactivate = client.patch(
        f"/api/v1/admin/users/{admin.id}",
        json={"is_active": False},
        headers=admin_headers,
    )
    assert self_deactivate.status_code == 400

    update_response = client.patch(
        f"/api/v1/admin/users/{student.id}",
        json={"is_active": False},
        headers=admin_headers,
    )
    assert update_response.status_code == 200
    assert update_response.json()["is_active"] is False

    login_response = client.post("/api/v1/auth/login", json={"email": student.email, "password": DEFAULT_PASSWORD})
    assert login_response.status_code == 400

    stale_token_response = client.get("/api/v1/auth/me", headers=student_headers)
    assert stale_token_response.status_code == 400


def test_admin_projects_documents_and_indexing_filters(client, db_session):
    field = create_field(db_session)
    admin = create_user(db_session, "admin@example.com", "9001", role=UserRole.ADMIN)
    owner = create_user(db_session, "owner@example.com", "2021001")
    project = create_project(db_session, owner, field, title="Private NMS", visibility=ProjectVisibility.PRIVATE)
    indexed = create_indexed_document(db_session, project, "Indexed SNMP", ["snmp"])
    failed = create_document(
        db_session,
        project,
        file_path="uploads/missing.pdf",
        title="Failed Scan",
        index_status=IndexStatus.FAILED,
    )
    headers = auth_headers(client, admin.email)

    projects = client.get("/api/v1/admin/projects", params={"visibility": "private"}, headers=headers)
    assert projects.status_code == 200
    assert projects.json()["items"][0]["title"] == "Private NMS"

    documents = client.get("/api/v1/admin/documents", params={"index_status": "indexed"}, headers=headers)
    assert documents.status_code == 200
    assert documents.json()["items"][0]["id"] == indexed.id
    assert documents.json()["items"][0]["project"]["id"] == project.id
    assert documents.json()["items"][0]["owner"]["id"] == owner.id

    indexing = client.get("/api/v1/admin/indexing", params={"index_status": "failed"}, headers=headers)
    assert indexing.status_code == 200
    assert indexing.json()["summary"]["failed"] == 1
    assert indexing.json()["items"][0]["id"] == failed.id
