import pytest
from sqlalchemy.exc import IntegrityError

from app.core.security import get_password_hash, verify_password
from app.db.models import (
    Document,
    DocumentPage,
    DocumentStats,
    IndexPosting,
    IndexStatus,
    IndexTerm,
    ProjectVisibility,
    ResearchField,
    ResearchProject,
    SearchHistory,
    User,
    UserRole,
)


def make_user(email="model@mahasiswa.ac.id", student_number="2021000001") -> User:
    return User(
        name="Model User",
        student_number=student_number,
        email=email,
        password_hash=get_password_hash("Password123!"),
        study_program="Teknik Informatika",
        class_name="TI-4A",
        role=UserRole.STUDENT,
        is_active=True,
    )


def test_password_hash_uses_argon2():
    hashed = get_password_hash("Password123!")

    assert hashed.startswith("$argon2")
    assert verify_password("Password123!", hashed)
    assert not verify_password("wrong", hashed)


def test_core_relations_can_be_created(db_session):
    user = make_user()
    field = ResearchField(
        name="Jaringan Komputer",
        slug="jaringan-komputer",
        description="Monitoring jaringan",
        icon="Network",
    )
    project = ResearchProject(
        owner=user,
        research_field=field,
        title="Perancangan Network Monitoring System Terintegrasi untuk Monitoring OLT dan PPPoE",
        description="Demo project",
        keywords=["SNMP", "OLT"],
        visibility=ProjectVisibility.PUBLIC,
    )
    document = Document(
        research_project=project,
        title="Monitoring Optical Network Unit Berbasis SNMP",
        original_filename="monitoring.pdf",
        stored_filename="monitoring-safe.pdf",
        file_path="uploads/monitoring-safe.pdf",
        total_pages=2,
        file_size=1024,
        index_status=IndexStatus.PENDING,
    )
    page = DocumentPage(document=document, page_number=1, raw_text="SNMP monitoring", clean_text="snmp monitoring")
    stats = DocumentStats(document=document, total_terms=2, indexed_page_count=1)
    term = IndexTerm(term="snmp", document_frequency=1)
    posting = IndexPosting(term=term, document=document, page_number=1, term_frequency=1)
    history = SearchHistory(user=user, query="snmp", research_field=field, research_project=project, result_count=1)

    db_session.add_all([user, field, project, document, page, stats, term, posting, history])
    db_session.commit()

    assert project.owner.email == "model@mahasiswa.ac.id"
    assert project.research_field.slug == "jaringan-komputer"
    assert document.pages[0].page_number == 1
    assert document.stats.total_terms == 2
    assert term.postings[0].term_frequency == 1
    assert history.research_project.title.startswith("Perancangan")


def test_unique_email_constraint(db_session):
    db_session.add(make_user(email="same@mahasiswa.ac.id", student_number="2021000001"))
    db_session.commit()

    db_session.add(make_user(email="same@mahasiswa.ac.id", student_number="2021000002"))
    with pytest.raises(IntegrityError):
        db_session.commit()


def test_unique_student_number_constraint(db_session):
    db_session.add(make_user(email="a@mahasiswa.ac.id", student_number="2021000001"))
    db_session.commit()

    db_session.add(make_user(email="b@mahasiswa.ac.id", student_number="2021000001"))
    with pytest.raises(IntegrityError):
        db_session.commit()


def test_project_delete_cascades_documents(db_session):
    user = make_user()
    field = ResearchField(name="Data Mining", slug="data-mining", description="Data mining", icon="BarChart2")
    project = ResearchProject(
        owner=user,
        research_field=field,
        title="Analisis Sentimen",
        description="Demo",
        keywords=["sentimen"],
        visibility=ProjectVisibility.PUBLIC,
    )
    document = Document(
        research_project=project,
        title="Sentiment Analysis",
        original_filename="sentiment.pdf",
        stored_filename="sentiment-safe.pdf",
        file_path="uploads/sentiment-safe.pdf",
        total_pages=1,
        file_size=100,
        index_status=IndexStatus.PENDING,
    )
    db_session.add_all([user, field, project, document])
    db_session.commit()
    document_id = document.id

    db_session.delete(project)
    db_session.commit()

    assert db_session.get(Document, document_id) is None
