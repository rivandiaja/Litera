from pathlib import Path

from app.db.models import (
    Document,
    DocumentPage,
    DocumentStats,
    IndexPosting,
    IndexStatus,
    IndexTerm,
    ProjectVisibility,
    UserRole,
)
from app.services.file_storage import get_upload_root
from tests.helpers import auth_headers, create_field, create_project, create_user, make_pdf_bytes, pdf_upload


def _project_with_users(db_session, visibility=ProjectVisibility.PUBLIC):
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
    project = create_project(db_session, owner=owner, field=field, title="NMS Project", visibility=visibility)
    return owner, other, admin, project


def _upload_valid_pdf(client, db_session, project, user, filename="monitoring.pdf", text="SNMP SNMP OLT"):
    response = client.post(
        f"/api/v1/projects/{project.id}/documents",
        headers=auth_headers(client, user.email),
        files=[pdf_upload(filename, make_pdf_bytes([text]))],
    )
    assert response.status_code == 201
    assert response.json()["accepted_count"] == 1
    document_id = response.json()["items"][0]["document_id"]
    db_session.expire_all()
    document = db_session.get(Document, document_id)
    assert document is not None
    return document


def test_upload_valid_and_invalid_files_in_one_batch(client, db_session):
    owner, _, _, project = _project_with_users(db_session)
    response = client.post(
        f"/api/v1/projects/{project.id}/documents",
        headers=auth_headers(client, owner.email),
        files=[
            pdf_upload("monitoring.pdf", make_pdf_bytes(["SNMP monitoring OLT"])),
            pdf_upload("mikrotik.pdf", make_pdf_bytes(["MikroTik REST API"])),
            pdf_upload("notes.txt", b"not a pdf", "text/plain"),
            pdf_upload("empty.pdf", b"", "application/pdf"),
            pdf_upload("fake.pdf", b"not-pdf", "application/pdf"),
        ],
    )

    data = response.json()

    assert response.status_code == 201
    assert data["accepted_count"] == 2
    assert data["failed_count"] == 3
    assert [item["index_status"] for item in data["items"] if item["accepted"]] == ["pending", "pending"]
    assert db_session.query(Document).count() == 2
    assert len(list(get_upload_root().glob("*.pdf"))) == 2

    filtered = client.get(
        f"/api/v1/projects/{project.id}/documents?status=indexed&search=mikrotik",
        headers=auth_headers(client, owner.email),
    )

    assert filtered.status_code == 200
    assert filtered.json()["pagination"]["total"] == 1
    assert filtered.json()["items"][0]["original_filename"] == "mikrotik.pdf"


def test_upload_rejects_wrong_mime_and_oversized_file(client, db_session):
    owner, _, _, project = _project_with_users(db_session)
    oversized = b"%PDF-" + (b"a" * (1024 * 1024 + 1))

    response = client.post(
        f"/api/v1/projects/{project.id}/documents",
        headers=auth_headers(client, owner.email),
        files=[
            pdf_upload("mime.pdf", make_pdf_bytes(["Valid text"]), "text/plain"),
            pdf_upload("large.pdf", oversized, "application/pdf"),
        ],
    )

    data = response.json()

    assert response.status_code == 201
    assert data["accepted_count"] == 0
    assert data["failed_count"] == 2
    assert db_session.query(Document).count() == 0
    assert list(get_upload_root().glob("*.pdf")) == []


def test_document_upload_permissions_owner_admin_and_other_user(client, db_session):
    owner, other, admin, project = _project_with_users(db_session, visibility=ProjectVisibility.PRIVATE)

    no_token = client.post(
        f"/api/v1/projects/{project.id}/documents",
        files=[pdf_upload("no-token.pdf", make_pdf_bytes(["SNMP"]))],
    )
    other_upload = client.post(
        f"/api/v1/projects/{project.id}/documents",
        headers=auth_headers(client, other.email),
        files=[pdf_upload("other.pdf", make_pdf_bytes(["SNMP"]))],
    )
    admin_upload = client.post(
        f"/api/v1/projects/{project.id}/documents",
        headers=auth_headers(client, admin.email),
        files=[pdf_upload("admin.pdf", make_pdf_bytes(["SNMP"]))],
    )
    owner_upload = client.post(
        f"/api/v1/projects/{project.id}/documents",
        headers=auth_headers(client, owner.email),
        files=[pdf_upload("owner.pdf", make_pdf_bytes(["SNMP"]))],
    )

    assert no_token.status_code == 401
    assert other_upload.status_code == 403
    assert admin_upload.status_code == 201
    assert owner_upload.status_code == 201
    assert db_session.query(Document).count() == 2


def test_private_document_read_file_and_mutations_are_protected(client, db_session):
    owner, other, admin, project = _project_with_users(db_session, visibility=ProjectVisibility.PRIVATE)
    document = _upload_valid_pdf(client, db_session, project, owner)

    other_headers = auth_headers(client, other.email)
    owner_headers = auth_headers(client, owner.email)
    admin_headers = auth_headers(client, admin.email)

    private_list = client.get(f"/api/v1/projects/{project.id}/documents", headers=other_headers)
    private_detail = client.get(f"/api/v1/documents/{document.id}", headers=other_headers)
    private_file = client.get(f"/api/v1/documents/{document.id}/file", headers=other_headers)
    forbidden_patch = client.patch(
        f"/api/v1/documents/{document.id}",
        headers=other_headers,
        json={"title": "Tidak boleh"},
    )
    forbidden_reindex = client.post(f"/api/v1/documents/{document.id}/reindex", headers=other_headers)
    forbidden_delete = client.delete(f"/api/v1/documents/{document.id}", headers=other_headers)

    owner_file = client.get(f"/api/v1/documents/{document.id}/file", headers=owner_headers)
    owner_detail = client.get(f"/api/v1/documents/{document.id}", headers=owner_headers)
    admin_patch = client.patch(
        f"/api/v1/documents/{document.id}",
        headers=admin_headers,
        json={"title": "Judul Baru"},
    )

    assert private_list.status_code == 404
    assert private_detail.status_code == 404
    assert private_file.status_code == 404
    assert forbidden_patch.status_code == 403
    assert forbidden_reindex.status_code == 403
    assert forbidden_delete.status_code == 403
    assert owner_file.status_code == 200
    assert owner_file.content.startswith(b"%PDF-")
    assert owner_detail.status_code == 200
    assert owner_detail.json()["owner"]["id"] == owner.id
    assert owner_detail.json()["stats"]["indexed_page_count"] == 1
    assert admin_patch.status_code == 200
    assert admin_patch.json()["title"] == "Judul Baru"


def test_blank_and_corrupt_pdf_are_saved_then_marked_failed(client, db_session):
    owner, _, _, project = _project_with_users(db_session)

    response = client.post(
        f"/api/v1/projects/{project.id}/documents",
        headers=auth_headers(client, owner.email),
        files=[
            pdf_upload("blank.pdf", make_pdf_bytes([""])),
            pdf_upload("broken.pdf", b"%PDF-this-is-not-real"),
        ],
    )
    db_session.expire_all()
    documents = db_session.query(Document).order_by(Document.original_filename).all()

    assert response.status_code == 201
    assert response.json()["accepted_count"] == 2
    assert [document.index_status for document in documents] == [IndexStatus.FAILED, IndexStatus.FAILED]
    assert "OCR belum didukung" in documents[0].index_message
    assert "tidak dapat dibuka" in documents[1].index_message


def test_indexing_creates_pages_stats_terms_postings_and_delete_cleans_them(client, db_session):
    owner, _, _, project = _project_with_users(db_session)
    headers = auth_headers(client, owner.email)
    doc_one = _upload_valid_pdf(
        client,
        db_session,
        project,
        owner,
        filename="doc-one.pdf",
        text="SNMP SNMP OLT monitoring jaringan",
    )
    doc_two = _upload_valid_pdf(
        client,
        db_session,
        project,
        owner,
        filename="doc-two.pdf",
        text="SNMP API REST dashboard",
    )
    doc_one_id = doc_one.id
    doc_two_id = doc_two.id
    db_session.expire_all()

    snmp = db_session.query(IndexTerm).filter(IndexTerm.term == "snmp").one()
    doc_one_posting = (
        db_session.query(IndexPosting)
        .filter(IndexPosting.term_id == snmp.id, IndexPosting.document_id == doc_one_id, IndexPosting.page_number == 1)
        .one()
    )

    assert db_session.get(Document, doc_one_id).index_status == IndexStatus.INDEXED
    assert db_session.query(DocumentPage).filter(DocumentPage.document_id == doc_one_id).count() == 1
    assert db_session.query(DocumentStats).filter(DocumentStats.document_id == doc_one_id).one().total_terms > 0
    assert snmp.document_frequency == 2
    assert doc_one_posting.term_frequency == 2

    first_delete = client.delete(f"/api/v1/documents/{doc_one_id}", headers=headers)
    db_session.expire_all()
    snmp_after_first_delete = db_session.query(IndexTerm).filter(IndexTerm.term == "snmp").one()

    assert first_delete.status_code == 204
    assert db_session.get(Document, doc_one_id) is None
    assert db_session.query(IndexPosting).filter(IndexPosting.document_id == doc_one_id).count() == 0
    assert db_session.query(DocumentPage).filter(DocumentPage.document_id == doc_one_id).count() == 0
    assert snmp_after_first_delete.document_frequency == 1

    second_path = Path(db_session.get(Document, doc_two_id).file_path)
    second_delete = client.delete(f"/api/v1/documents/{doc_two_id}", headers=headers)
    db_session.expire_all()

    assert second_delete.status_code == 204
    assert db_session.query(IndexTerm).filter(IndexTerm.term == "snmp").one_or_none() is None
    assert not (Path.cwd() / second_path).exists()


def test_reindex_does_not_create_duplicate_postings(client, db_session):
    owner, _, _, project = _project_with_users(db_session)
    document = _upload_valid_pdf(client, db_session, project, owner, text="SNMP SNMP OLT")
    headers = auth_headers(client, owner.email)
    db_session.expire_all()
    initial_postings = db_session.query(IndexPosting).filter(IndexPosting.document_id == document.id).count()
    initial_pages = db_session.query(DocumentPage).filter(DocumentPage.document_id == document.id).count()

    response = client.post(f"/api/v1/documents/{document.id}/reindex", headers=headers)
    db_session.expire_all()

    assert response.status_code == 200
    assert response.json()["index_status"] == "pending"
    assert db_session.get(Document, document.id).index_status == IndexStatus.INDEXED
    assert db_session.query(IndexPosting).filter(IndexPosting.document_id == document.id).count() == initial_postings
    assert db_session.query(DocumentPage).filter(DocumentPage.document_id == document.id).count() == initial_pages
