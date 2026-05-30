from datetime import datetime, timedelta, timezone

from app.db.models import Document, IndexStatus, ProjectVisibility, ResearchField, SearchHistory, UserRole
from tests.helpers import auth_headers, create_field, create_indexed_document, create_project, create_user


def _search_fixture(db_session):
    owner = create_user(db_session, email="owner@example.com", student_number="2021000001", name="Owner User")
    other = create_user(db_session, email="other@example.com", student_number="2021000002", name="Other User")
    admin = create_user(
        db_session,
        email="admin@example.com",
        student_number="ADM001",
        role=UserRole.ADMIN,
        name="Admin Litera",
    )
    network = create_field(db_session, name="Jaringan Komputer", slug="jaringan-komputer")
    ai = create_field(db_session, name="Artificial Intelligence", slug="ai")
    owner_public = create_project(db_session, owner=owner, field=network, title="Public NMS Project")
    owner_private = create_project(
        db_session,
        owner=owner,
        field=network,
        title="Private NMS Project",
        visibility=ProjectVisibility.PRIVATE,
    )
    other_private = create_project(
        db_session,
        owner=other,
        field=network,
        title="Other Secret Project",
        visibility=ProjectVisibility.PRIVATE,
    )
    ai_public = create_project(db_session, owner=other, field=ai, title="AI Project")

    now = datetime.now(timezone.utc)
    relevant = create_indexed_document(
        db_session,
        owner_public,
        "Monitoring Optical Network Unit Berbasis SNMP",
        [
            "SNMP monitoring jaringan umum.",
            "Parameter redaman optik ONU dapat diperoleh melalui perangkat OLT menggunakan protokol SNMP.",
        ],
        "monitoring-onu.pdf",
        created_at=now - timedelta(days=2),
    )
    older = create_indexed_document(
        db_session,
        owner_public,
        "Dashboard NMS",
        ["SNMP dashboard grafana monitoring."],
        "dashboard-nms.pdf",
        created_at=now - timedelta(days=5),
    )
    newer = create_indexed_document(
        db_session,
        owner_public,
        "Bandwidth Monitoring",
        ["SNMP monitoring bandwidth terbaru."],
        "bandwidth.pdf",
        created_at=now,
    )
    owner_secret = create_indexed_document(
        db_session,
        owner_private,
        "Private Redaman ONU",
        ["SNMP redaman ONU private milik owner."],
        "private-owner.pdf",
    )
    other_secret = create_indexed_document(
        db_session,
        other_private,
        "Private Other Secret",
        ["SNMP redaman ONU rahasia milik mahasiswa lain."],
        "private-other.pdf",
    )
    ai_doc = create_indexed_document(
        db_session,
        ai_public,
        "Deep Learning Vision",
        ["CNN deteksi objek real time."],
        "vision.pdf",
    )
    failed = create_indexed_document(
        db_session,
        owner_public,
        "Failed SNMP",
        ["SNMP failed should not appear."],
        "failed.pdf",
    )
    failed.index_status = IndexStatus.FAILED
    pending = create_indexed_document(
        db_session,
        owner_public,
        "Pending SNMP",
        ["SNMP pending should not appear."],
        "pending.pdf",
    )
    pending.index_status = IndexStatus.PENDING
    db_session.commit()
    return {
        "owner": owner,
        "other": other,
        "admin": admin,
        "network": network,
        "ai": ai,
        "owner_public": owner_public,
        "owner_private": owner_private,
        "other_private": other_private,
        "relevant": relevant,
        "older": older,
        "newer": newer,
        "owner_secret": owner_secret,
        "other_secret": other_secret,
        "ai_doc": ai_doc,
    }


def test_search_relevance_snippet_relevant_pages_and_query_preprocessing(client, db_session):
    data = _search_fixture(db_session)

    response = client.get(
        "/api/v1/search",
        headers=auth_headers(client, data["other"].email),
        params={"q": "Monitoring redaman ONU menggunakan SNMP"},
    )
    payload = response.json()
    first = payload["results"][0]

    assert response.status_code == 200
    assert payload["processed_terms"] == ["monitoring", "redam", "onu", "snmp"]
    assert payload["pagination"]["total_items"] == 4
    assert first["document_id"] == data["relevant"].id
    assert first["best_page"] == 2
    assert first["relevant_pages"][0] == 2
    assert len(first["relevant_pages"]) <= 5
    assert "Parameter redaman optik ONU" in first["snippet"]
    assert first["matched_terms"] == ["redam", "onu", "snmp"]
    assert first["score"] > 0


def test_search_validation_and_failed_requests_do_not_create_history(client, db_session):
    data = _search_fixture(db_session)
    headers = auth_headers(client, data["owner"].email)

    empty = client.get("/api/v1/search", headers=headers, params={"q": "   "})
    stopword_only = client.get("/api/v1/search", headers=headers, params={"q": "dan yang di"})

    assert empty.status_code == 422
    assert stopword_only.status_code == 422
    assert db_session.query(SearchHistory).count() == 0


def test_search_filters_sorting_and_pagination(client, db_session):
    data = _search_fixture(db_session)
    headers = auth_headers(client, data["owner"].email)

    field_response = client.get(
        "/api/v1/search",
        headers=headers,
        params={"q": "snmp", "research_field_id": data["network"].id},
    )
    project_response = client.get(
        "/api/v1/search",
        headers=headers,
        params={"q": "snmp", "research_project_id": data["owner_private"].id},
    )
    owner_response = client.get(
        "/api/v1/search",
        headers=headers,
        params={"q": "snmp", "owner_id": data["owner"].id},
    )
    page_one = client.get(
        "/api/v1/search",
        headers=headers,
        params={"q": "snmp", "page_size": 1, "page": 1},
    )
    page_two = client.get(
        "/api/v1/search",
        headers=headers,
        params={"q": "snmp", "page_size": 1, "page": 2},
    )
    newest = client.get(
        "/api/v1/search",
        headers=headers,
        params={"q": "snmp", "sort_by": "newest"},
    )
    title_asc = client.get(
        "/api/v1/search",
        headers=headers,
        params={"q": "snmp", "sort_by": "title_asc"},
    )

    assert field_response.status_code == 200
    assert {item["field"]["id"] for item in field_response.json()["results"]} == {data["network"].id}
    assert project_response.json()["pagination"]["total_items"] == 1
    assert project_response.json()["results"][0]["document_id"] == data["owner_secret"].id
    assert {item["owner"]["id"] for item in owner_response.json()["results"]} == {data["owner"].id}
    assert page_one.json()["pagination"]["total_items"] >= 3
    assert page_one.json()["results"][0]["document_id"] != page_two.json()["results"][0]["document_id"]
    assert newest.json()["results"][0]["document_id"] == data["owner_secret"].id
    assert title_asc.json()["results"][0]["title"] == "Bandwidth Monitoring"


def test_search_privacy_rules_for_private_projects(client, db_session):
    data = _search_fixture(db_session)

    other_response = client.get(
        "/api/v1/search",
        headers=auth_headers(client, data["other"].email),
        params={"q": "rahasia snmp"},
    )
    owner_response = client.get(
        "/api/v1/search",
        headers=auth_headers(client, data["owner"].email),
        params={"q": "private snmp"},
    )
    admin_response = client.get(
        "/api/v1/search",
        headers=auth_headers(client, data["admin"].email),
        params={"q": "rahasia snmp"},
    )
    forbidden_filter = client.get(
        "/api/v1/search",
        headers=auth_headers(client, data["other"].email),
        params={"q": "private snmp", "research_project_id": data["owner_private"].id},
    )

    other_ids = {item["document_id"] for item in other_response.json()["results"]}
    owner_ids = {item["document_id"] for item in owner_response.json()["results"]}
    admin_ids = {item["document_id"] for item in admin_response.json()["results"]}

    assert other_response.status_code == 200
    assert data["owner_secret"].id not in other_ids
    assert data["owner_secret"].id in owner_ids
    assert data["other_secret"].id in admin_ids
    assert forbidden_filter.status_code == 404


def test_search_excludes_failed_and_pending_documents(client, db_session):
    data = _search_fixture(db_session)

    response = client.get(
        "/api/v1/search",
        headers=auth_headers(client, data["owner"].email),
        params={"q": "failed pending snmp"},
    )

    titles = {item["title"] for item in response.json()["results"]}
    assert "Failed SNMP" not in titles
    assert "Pending SNMP" not in titles


def test_catalog_search_respects_visibility_and_limit(client, db_session):
    data = _search_fixture(db_session)
    inactive = ResearchField(
        name="Network Archive",
        slug="network-archive",
        description="Network monitoring lama",
        icon="BookOpen",
        is_active=False,
    )
    db_session.add(inactive)
    db_session.commit()

    other_response = client.get(
        "/api/v1/search/catalog",
        headers=auth_headers(client, data["other"].email),
        params={"q": "network", "limit": 2},
    )
    admin_response = client.get(
        "/api/v1/search/catalog",
        headers=auth_headers(client, data["admin"].email),
        params={"q": "network", "limit": 20},
    )
    keyword_response = client.get(
        "/api/v1/search/catalog",
        headers=auth_headers(client, data["other"].email),
        params={"q": "SNMP"},
    )

    assert other_response.status_code == 200
    assert len(other_response.json()["fields"]) <= 2
    assert "Network Archive" not in {field["name"] for field in other_response.json()["fields"]}
    assert "Network Archive" in {field["name"] for field in admin_response.json()["fields"]}
    project_titles = {project["title"] for project in keyword_response.json()["projects"]}
    assert "Public NMS Project" in project_titles
    assert "Private NMS Project" not in project_titles


def test_search_history_is_private_paginated_and_clearable(client, db_session):
    data = _search_fixture(db_session)
    owner_headers = auth_headers(client, data["owner"].email)
    other_headers = auth_headers(client, data["other"].email)

    first = client.get("/api/v1/search", headers=owner_headers, params={"q": "snmp"})
    second = client.get("/api/v1/search", headers=owner_headers, params={"q": "onu"})
    client.get("/api/v1/search", headers=other_headers, params={"q": "snmp"})
    history = client.get("/api/v1/search/history", headers=owner_headers, params={"page_size": 1})
    other_history = client.get("/api/v1/search/history", headers=other_headers)
    cleared = client.delete("/api/v1/search/history", headers=owner_headers)
    owner_after_clear = client.get("/api/v1/search/history", headers=owner_headers)
    other_after_clear = client.get("/api/v1/search/history", headers=other_headers)

    assert first.status_code == 200
    assert second.status_code == 200
    assert history.status_code == 200
    assert history.json()["pagination"]["total_items"] == 2
    assert history.json()["items"][0]["query"] == "onu"
    assert other_history.json()["pagination"]["total_items"] == 1
    assert cleared.status_code == 204
    assert owner_after_clear.json()["pagination"]["total_items"] == 0
    assert other_after_clear.json()["pagination"]["total_items"] == 1
