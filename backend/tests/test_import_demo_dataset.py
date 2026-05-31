import json
from pathlib import Path

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.cli.import_demo_dataset import import_manifest
from app.db.models import Document, DocumentPage, IndexStatus, IndexTerm, ResearchProject, User
from tests.helpers import make_pdf_bytes


def _write_manifest(tmp_path: Path, documents: list[dict]) -> Path:
    payload = {
        "users": [
            {
                "email": "demo@mahasiswa.ac.id",
                "student_number": "DEMO001",
                "name": "Demo Mahasiswa",
                "projects": [
                    {
                        "field": "Jaringan Komputer",
                        "title": "Koleksi Demo NMS",
                        "description": "Dataset demo untuk import helper.",
                        "keywords": "NMS, SNMP, OLT",
                        "visibility": "public",
                        "documents": documents,
                    }
                ],
            }
        ]
    }
    manifest_path = tmp_path / "manifest.json"
    manifest_path.write_text(json.dumps(payload), encoding="utf-8")
    return manifest_path


def _pdf_dir(tmp_path: Path) -> Path:
    path = tmp_path / "pdfs"
    path.mkdir()
    return path


def test_import_manifest_valid_indexes_pdf(tmp_path: Path, db_session: Session):
    pdfs = _pdf_dir(tmp_path)
    (pdfs / "monitoring-olt.pdf").write_bytes(make_pdf_bytes(["SNMP OLT ONU monitoring jaringan FTTH"]))
    manifest_path = _write_manifest(
        tmp_path,
        [{"path": "pdfs/monitoring-olt.pdf", "title": "Monitoring OLT Menggunakan SNMP"}],
    )

    summary = import_manifest(manifest_path, db=db_session)

    assert summary.users_created == 1
    assert summary.fields_created == 1
    assert summary.projects_created == 1
    assert summary.documents_created == 1
    assert summary.documents_failed == 0
    document = db_session.scalar(select(Document).where(Document.original_filename == "monitoring-olt.pdf"))
    assert document is not None
    assert document.index_status == IndexStatus.INDEXED
    assert document.total_pages == 1
    assert db_session.scalar(select(func.count(DocumentPage.id))) == 1


def test_import_manifest_dry_run_does_not_write_data(tmp_path: Path, db_session: Session):
    pdfs = _pdf_dir(tmp_path)
    (pdfs / "monitoring-olt.pdf").write_bytes(make_pdf_bytes(["SNMP OLT"]))
    manifest_path = _write_manifest(
        tmp_path,
        [{"path": "pdfs/monitoring-olt.pdf", "title": "Monitoring OLT"}],
    )

    summary = import_manifest(manifest_path, db=db_session, dry_run=True)

    assert summary.users_planned == 1
    assert summary.fields_planned == 1
    assert summary.projects_planned == 1
    assert summary.documents_planned == 1
    assert db_session.scalar(select(func.count(User.id))) == 0
    assert db_session.scalar(select(func.count(Document.id))) == 0


def test_import_manifest_file_missing_records_safe_failure(tmp_path: Path, db_session: Session):
    _pdf_dir(tmp_path)
    manifest_path = _write_manifest(
        tmp_path,
        [{"path": "pdfs/missing.pdf", "title": "Missing PDF"}],
    )

    summary = import_manifest(manifest_path, db=db_session)

    assert summary.documents_failed == 1
    assert "File PDF tidak ditemukan" in summary.failures[0]
    assert db_session.scalar(select(func.count(Document.id))) == 0
    assert db_session.scalar(select(func.count(ResearchProject.id))) == 1


def test_import_manifest_is_idempotent_for_existing_documents(tmp_path: Path, db_session: Session):
    pdfs = _pdf_dir(tmp_path)
    (pdfs / "monitoring-olt.pdf").write_bytes(make_pdf_bytes(["SNMP OLT monitoring"]))
    manifest_path = _write_manifest(
        tmp_path,
        [{"path": "pdfs/monitoring-olt.pdf", "title": "Monitoring OLT"}],
    )

    first_summary = import_manifest(manifest_path, db=db_session)
    second_summary = import_manifest(manifest_path, db=db_session)

    assert first_summary.documents_created == 1
    assert second_summary.documents_skipped == 1
    assert db_session.scalar(select(func.count(Document.id))) == 1


def test_import_manifest_reindexes_existing_document(tmp_path: Path, db_session: Session):
    pdfs = _pdf_dir(tmp_path)
    pdf_path = pdfs / "monitoring-olt.pdf"
    pdf_path.write_bytes(make_pdf_bytes(["SNMP OLT monitoring"]))
    manifest_path = _write_manifest(
        tmp_path,
        [{"path": "pdfs/monitoring-olt.pdf", "title": "Monitoring OLT"}],
    )
    import_manifest(manifest_path, db=db_session)

    pdf_path.write_bytes(make_pdf_bytes(["QoS bandwidth throughput jaringan"]))
    summary = import_manifest(manifest_path, db=db_session, reindex_existing=True)

    assert summary.documents_reindexed == 1
    assert summary.documents_failed == 0
    assert db_session.scalar(select(IndexTerm).where(IndexTerm.term == "bandwidth")) is not None
    assert db_session.scalar(select(func.count(Document.id))) == 1


def test_import_manifest_failed_pdf_is_recorded_as_failed_document(tmp_path: Path, db_session: Session):
    pdfs = _pdf_dir(tmp_path)
    (pdfs / "blank.pdf").write_bytes(make_pdf_bytes([""]))
    manifest_path = _write_manifest(
        tmp_path,
        [{"path": "pdfs/blank.pdf", "title": "PDF Tanpa Teks"}],
    )

    summary = import_manifest(manifest_path, db=db_session)

    assert summary.documents_created == 1
    assert summary.documents_failed == 1
    document = db_session.scalar(select(Document).where(Document.original_filename == "blank.pdf"))
    assert document is not None
    assert document.index_status == IndexStatus.FAILED
    assert "teks" in (document.index_message or "").lower()
