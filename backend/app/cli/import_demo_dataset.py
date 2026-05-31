from __future__ import annotations

import argparse
import json
import shutil
import sys
from dataclasses import dataclass, field
from json import JSONDecodeError
from pathlib import Path
from typing import Any
from uuid import uuid4

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.security import get_password_hash
from app.db.models import Document, IndexStatus, ProjectVisibility, ResearchField, ResearchProject, User, UserRole
from app.db.session import SessionLocal
from app.services import file_storage, indexer
from app.services.field_service import slugify

DEFAULT_STUDENT_PASSWORD = "StudentDemo123!"
DEFAULT_STUDY_PROGRAM = "Teknik Informatika"
DEFAULT_CLASS_NAME = "Demo"


class DemoImportError(Exception):
    """Raised for manifest-level errors that should be shown safely."""


@dataclass
class ImportSummary:
    manifest_path: Path
    dry_run: bool
    reindex_existing: bool
    users_created: int = 0
    users_existing: int = 0
    users_planned: int = 0
    fields_created: int = 0
    fields_existing: int = 0
    fields_planned: int = 0
    projects_created: int = 0
    projects_existing: int = 0
    projects_planned: int = 0
    documents_created: int = 0
    documents_skipped: int = 0
    documents_reindexed: int = 0
    documents_planned: int = 0
    documents_failed: int = 0
    warnings: list[str] = field(default_factory=list)
    failures: list[str] = field(default_factory=list)

    def warn(self, message: str) -> None:
        self.warnings.append(message)

    def fail(self, message: str) -> None:
        self.failures.append(message)
        self.documents_failed += 1


def _resolve_manifest_path(manifest: str | Path) -> Path:
    path = Path(manifest).expanduser()
    if not path.is_absolute():
        path = Path.cwd() / path
    return path.resolve()


def _load_manifest(manifest_path: Path) -> dict[str, Any]:
    if not manifest_path.exists():
        raise DemoImportError(f"Manifest tidak ditemukan: {manifest_path}")
    try:
        payload = json.loads(manifest_path.read_text(encoding="utf-8"))
    except JSONDecodeError as exc:
        raise DemoImportError(f"Manifest bukan JSON valid: {exc.msg}") from exc
    except OSError as exc:
        raise DemoImportError("Manifest tidak dapat dibaca.") from exc

    if not isinstance(payload, dict):
        raise DemoImportError("Manifest harus berupa object JSON.")
    if not isinstance(payload.get("users"), list):
        raise DemoImportError("Manifest harus memiliki array 'users'.")
    return payload


def _clean_required_text(value: Any, field_name: str) -> str:
    if not isinstance(value, str) or not value.strip():
        raise DemoImportError(f"Field wajib '{field_name}' harus berupa teks.")
    return value.strip()


def _clean_optional_text(value: Any, default: str = "") -> str:
    if value is None:
        return default
    if not isinstance(value, str):
        return default
    return value.strip() or default


def _default_name_from_email(email: str) -> str:
    local_part = email.split("@", 1)[0]
    return " ".join(part.capitalize() for part in local_part.replace(".", " ").replace("_", " ").split()) or "Mahasiswa Demo"


def _default_student_number(email: str) -> str:
    digest = uuid4().hex[:8].upper()
    safe_local = "".join(character for character in email.split("@", 1)[0].upper() if character.isalnum())[:10]
    return f"DEMO-{safe_local or digest}"


def _parse_keywords(value: Any) -> list[str]:
    if isinstance(value, list):
        return [str(item).strip() for item in value if str(item).strip()]
    if isinstance(value, str):
        return [item.strip() for item in value.split(",") if item.strip()]
    return []


def _parse_visibility(value: Any) -> ProjectVisibility:
    raw_value = str(value or ProjectVisibility.PUBLIC.value).strip().lower()
    try:
        return ProjectVisibility(raw_value)
    except ValueError as exc:
        raise DemoImportError("Visibility project harus 'public' atau 'private'.") from exc


def _find_user(db: Session, email: str, student_number: str | None = None) -> User | None:
    user = db.scalar(select(User).where(func.lower(User.email) == email.lower()))
    if user is not None:
        return user
    if student_number:
        return db.scalar(select(User).where(User.student_number == student_number))
    return None


def _ensure_user(db: Session, user_data: dict[str, Any], summary: ImportSummary) -> User | None:
    email = _clean_required_text(user_data.get("email"), "users[].email").lower()
    student_number = _clean_optional_text(user_data.get("student_number")) or _default_student_number(email)
    user = _find_user(db, email=email, student_number=student_number)
    if user is not None:
        summary.users_existing += 1
        return user

    if summary.dry_run:
        summary.users_planned += 1
        return None

    user = User(
        name=_clean_optional_text(user_data.get("name"), _default_name_from_email(email)),
        student_number=student_number,
        email=email,
        password_hash=get_password_hash(_clean_optional_text(user_data.get("password"), DEFAULT_STUDENT_PASSWORD)),
        study_program=_clean_optional_text(user_data.get("study_program"), DEFAULT_STUDY_PROGRAM),
        class_name=_clean_optional_text(user_data.get("class_name"), DEFAULT_CLASS_NAME),
        role=UserRole.STUDENT,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    summary.users_created += 1
    return user


def _find_field(db: Session, name: str) -> ResearchField | None:
    slug = slugify(name)
    return db.scalar(
        select(ResearchField).where(
            or_(
                ResearchField.slug == slug,
                func.lower(ResearchField.name) == name.lower(),
            )
        )
    )


def _ensure_field(db: Session, name: str, summary: ImportSummary) -> ResearchField | None:
    field_obj = _find_field(db, name)
    if field_obj is not None:
        summary.fields_existing += 1
        return field_obj

    if summary.dry_run:
        summary.fields_planned += 1
        return None

    field_obj = ResearchField(
        name=name,
        slug=slugify(name),
        description=f"Bidang penelitian demo: {name}.",
        icon="BookOpen",
        is_active=True,
    )
    db.add(field_obj)
    db.commit()
    db.refresh(field_obj)
    summary.fields_created += 1
    return field_obj


def _find_project(db: Session, owner: User, title: str) -> ResearchProject | None:
    return db.scalar(
        select(ResearchProject).where(
            ResearchProject.user_id == owner.id,
            func.lower(ResearchProject.title) == title.lower(),
        )
    )


def _ensure_project(
    db: Session,
    owner: User | None,
    research_field: ResearchField | None,
    project_data: dict[str, Any],
    summary: ImportSummary,
) -> ResearchProject | None:
    title = _clean_required_text(project_data.get("title"), "projects[].title")
    visibility = _parse_visibility(project_data.get("visibility"))
    keywords = _parse_keywords(project_data.get("keywords"))
    description = _clean_optional_text(project_data.get("description"))

    if owner is None or research_field is None:
        summary.projects_planned += 1
        return None

    project = _find_project(db, owner=owner, title=title)
    if project is not None:
        project.research_field = research_field
        project.description = description
        project.keywords = keywords
        project.visibility = visibility
        db.commit()
        db.refresh(project)
        summary.projects_existing += 1
        return project

    project = ResearchProject(
        owner=owner,
        research_field=research_field,
        title=title,
        description=description,
        keywords=keywords,
        visibility=visibility,
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    summary.projects_created += 1
    return project


def _source_pdf_path(manifest_dir: Path, document_data: dict[str, Any]) -> Path:
    relative_path = Path(_clean_required_text(document_data.get("path"), "documents[].path"))
    if relative_path.is_absolute():
        raise DemoImportError("Path PDF di manifest harus relatif terhadap folder manifest.")
    source_path = (manifest_dir / relative_path).resolve()
    if not source_path.is_relative_to(manifest_dir):
        raise DemoImportError("Path PDF tidak boleh keluar dari folder dataset demo.")
    return source_path


def _stored_file_path_for_response(path: Path) -> str:
    try:
        return str(path.relative_to(Path.cwd()))
    except ValueError:
        return str(path)


def _validate_source_pdf(source_path: Path) -> int:
    if not source_path.exists():
        raise DemoImportError(f"File PDF tidak ditemukan: {source_path}")
    if not source_path.is_file():
        raise DemoImportError(f"Path PDF bukan file: {source_path}")
    if source_path.suffix.lower() != ".pdf":
        raise DemoImportError(f"File bukan .pdf: {source_path.name}")

    file_size = source_path.stat().st_size
    max_bytes = get_settings().max_pdf_size_mb * 1024 * 1024
    if file_size <= 0:
        raise DemoImportError(f"File PDF kosong: {source_path.name}")
    if file_size > max_bytes:
        raise DemoImportError(f"Ukuran PDF melebihi batas {get_settings().max_pdf_size_mb} MB: {source_path.name}")

    with source_path.open("rb") as pdf_file:
        if pdf_file.read(5) != b"%PDF-":
            raise DemoImportError(f"Magic bytes PDF tidak valid: {source_path.name}")
    return file_size


def _find_existing_document(db: Session, project: ResearchProject, original_filename: str) -> Document | None:
    return db.scalar(
        select(Document).where(
            Document.research_project_id == project.id,
            func.lower(Document.original_filename) == original_filename.lower(),
        )
    )


def _copy_pdf_to_uploads(source_path: Path) -> tuple[str, str, int]:
    file_size = _validate_source_pdf(source_path)
    stored_filename = f"{uuid4().hex}.pdf"
    destination = file_storage.resolve_stored_path(stored_filename)
    shutil.copyfile(source_path, destination)
    return stored_filename, _stored_file_path_for_response(destination), file_size


def _index_and_count_result(db: Session, document: Document, summary: ImportSummary) -> None:
    indexer.index_document(db, document.id)
    db.refresh(document)
    if document.index_status == IndexStatus.FAILED:
        summary.documents_failed += 1
        summary.failures.append(f"{document.original_filename}: {document.index_message or 'Indexing gagal.'}")


def _import_document(
    db: Session,
    manifest_dir: Path,
    project: ResearchProject | None,
    document_data: dict[str, Any],
    summary: ImportSummary,
) -> None:
    try:
        source_path = _source_pdf_path(manifest_dir, document_data)
        title = _clean_optional_text(document_data.get("title"), source_path.stem)[:255]
        original_filename = source_path.name

        if summary.dry_run:
            if not source_path.exists():
                summary.warn(f"Dry-run: file belum tersedia dan akan dilewati saat import nyata: {source_path}")
            summary.documents_planned += 1
            return

        if project is None:
            summary.fail(f"{original_filename}: user, bidang, atau project belum tersedia.")
            return

        existing_document = _find_existing_document(db, project, original_filename)
        if existing_document is not None and not summary.reindex_existing:
            if existing_document.title != title:
                existing_document.title = title
                db.commit()
            summary.documents_skipped += 1
            return

        if existing_document is not None and summary.reindex_existing:
            file_size = _validate_source_pdf(source_path)
            destination = file_storage.resolve_document_path(existing_document.file_path)
            shutil.copyfile(source_path, destination)
            existing_document.title = title
            existing_document.file_size = file_size
            existing_document.index_status = IndexStatus.PENDING
            existing_document.index_message = "Menunggu proses reindex dari import dataset demo."
            existing_document.indexed_at = None
            existing_document.total_pages = 0
            indexer.clear_document_index(db, existing_document.id)
            db.commit()
            db.refresh(existing_document)
            summary.documents_reindexed += 1
            _index_and_count_result(db, existing_document, summary)
            return

        stored_filename, file_path, file_size = _copy_pdf_to_uploads(source_path)
        document = Document(
            research_project=project,
            title=title,
            original_filename=original_filename,
            stored_filename=stored_filename,
            file_path=file_path,
            total_pages=0,
            file_size=file_size,
            index_status=IndexStatus.PENDING,
            index_message="Menunggu proses indexing dari import dataset demo.",
        )
        db.add(document)
        db.commit()
        db.refresh(document)
        summary.documents_created += 1
        _index_and_count_result(db, document, summary)
    except DemoImportError as exc:
        db.rollback()
        summary.fail(str(exc))
    except Exception:
        db.rollback()
        summary.fail("Dokumen gagal diimport karena kesalahan tak terduga.")


def import_manifest(
    manifest: str | Path,
    db: Session | None = None,
    dry_run: bool = False,
    reindex_existing: bool = False,
) -> ImportSummary:
    manifest_path = _resolve_manifest_path(manifest)
    payload = _load_manifest(manifest_path)
    summary = ImportSummary(
        manifest_path=manifest_path,
        dry_run=dry_run,
        reindex_existing=reindex_existing,
    )
    manifest_dir = manifest_path.parent

    owns_session = db is None
    session = db or SessionLocal()
    try:
        for raw_user in payload["users"]:
            if not isinstance(raw_user, dict):
                raise DemoImportError("Setiap item users harus berupa object.")
            user = _ensure_user(session, raw_user, summary)
            projects = raw_user.get("projects", [])
            if not isinstance(projects, list):
                raise DemoImportError("Field users[].projects harus berupa array.")

            for raw_project in projects:
                if not isinstance(raw_project, dict):
                    raise DemoImportError("Setiap item projects harus berupa object.")
                field_name = _clean_required_text(raw_project.get("field"), "projects[].field")
                research_field = _ensure_field(session, field_name, summary)
                project = _ensure_project(session, user, research_field, raw_project, summary)

                documents = raw_project.get("documents", [])
                if not isinstance(documents, list):
                    raise DemoImportError("Field projects[].documents harus berupa array.")
                for raw_document in documents:
                    if not isinstance(raw_document, dict):
                        raise DemoImportError("Setiap item documents harus berupa object.")
                    _import_document(session, manifest_dir, project, raw_document, summary)

        return summary
    finally:
        if owns_session:
            session.close()


def format_summary(summary: ImportSummary) -> str:
    mode = "DRY-RUN" if summary.dry_run else "IMPORT"
    lines = [
        f"Litera demo dataset {mode}",
        f"Manifest: {summary.manifest_path}",
        f"Reindex existing: {'yes' if summary.reindex_existing else 'no'}",
        "",
        "Ringkasan:",
        f"- Users: created={summary.users_created}, existing={summary.users_existing}, planned={summary.users_planned}",
        f"- Fields: created={summary.fields_created}, existing={summary.fields_existing}, planned={summary.fields_planned}",
        f"- Projects: created={summary.projects_created}, existing={summary.projects_existing}, planned={summary.projects_planned}",
        (
            "- Documents: "
            f"created={summary.documents_created}, skipped={summary.documents_skipped}, "
            f"reindexed={summary.documents_reindexed}, planned={summary.documents_planned}, failed={summary.documents_failed}"
        ),
    ]
    if summary.warnings:
        lines.extend(["", "Warnings:"])
        lines.extend(f"- {warning}" for warning in summary.warnings)
    if summary.failures:
        lines.extend(["", "Failures:"])
        lines.extend(f"- {failure}" for failure in summary.failures)
    return "\n".join(lines)


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Import dataset demo Litera dari manifest JSON lokal.")
    parser.add_argument("--manifest", required=True, help="Path manifest JSON, misalnya ../demo-data/manifest.json")
    parser.add_argument("--dry-run", action="store_true", help="Validasi manifest dan tampilkan rencana tanpa menulis data.")
    parser.add_argument(
        "--reindex-existing",
        action="store_true",
        help="Re-copy dan re-index dokumen yang sudah ada berdasarkan original filename.",
    )
    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    try:
        with SessionLocal() as db:
            summary = import_manifest(
                manifest=args.manifest,
                db=db,
                dry_run=args.dry_run,
                reindex_existing=args.reindex_existing,
            )
        print(format_summary(summary))
        if summary.failures and not summary.dry_run:
            return 1
        return 0
    except DemoImportError as exc:
        print(f"Import dataset gagal: {exc}")
        return 1
    except Exception:
        print("Import dataset gagal karena kesalahan tak terduga. Periksa konfigurasi database dan file dataset.")
        return 1


if __name__ == "__main__":
    sys.exit(main())
