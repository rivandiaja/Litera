from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from uuid import uuid4

from fastapi import UploadFile

from app.core.config import get_settings

ALLOWED_PDF_MIME_TYPES = {"application/pdf", "application/x-pdf"}
CHUNK_SIZE = 1024 * 1024


class UploadValidationError(Exception):
    pass


class FileStorageError(Exception):
    pass


@dataclass(frozen=True)
class StoredUpload:
    original_filename: str
    stored_filename: str
    file_path: str
    file_size: int


def _clean_original_filename(filename: str | None) -> str:
    cleaned = (filename or "").replace("\\", "/").split("/")[-1].strip()
    return cleaned or "document.pdf"


def get_upload_root() -> Path:
    settings = get_settings()
    root = Path(settings.upload_dir)
    if not root.is_absolute():
        root = Path.cwd() / root
    return root.resolve()


def ensure_upload_dir() -> Path:
    root = get_upload_root()
    root.mkdir(parents=True, exist_ok=True)
    return root


def _ensure_inside_upload_root(path: Path) -> Path:
    root = ensure_upload_dir()
    resolved = path.resolve()
    if not resolved.is_relative_to(root):
        raise FileStorageError("Resolved file path is outside upload directory")
    return resolved


def resolve_stored_path(stored_filename: str) -> Path:
    return _ensure_inside_upload_root(ensure_upload_dir() / stored_filename)


def resolve_document_path(file_path: str) -> Path:
    path = Path(file_path)
    if not path.is_absolute():
        path = Path.cwd() / path
    return _ensure_inside_upload_root(path)


def delete_document_file(file_path: str) -> bool:
    path = resolve_document_path(file_path)
    if not path.exists():
        return False
    path.unlink()
    return True


def _stored_file_path_for_response(path: Path) -> str:
    try:
        return str(path.relative_to(Path.cwd()))
    except ValueError:
        return str(path)


async def save_pdf_upload(upload: UploadFile) -> StoredUpload:
    settings = get_settings()
    max_bytes = settings.max_pdf_size_mb * 1024 * 1024
    original_filename = _clean_original_filename(upload.filename)

    if not original_filename.lower().endswith(".pdf"):
        raise UploadValidationError("Hanya file dengan ekstensi .pdf yang diterima.")

    content_type = (upload.content_type or "").lower().strip()
    if content_type and content_type not in ALLOWED_PDF_MIME_TYPES:
        raise UploadValidationError("MIME type file bukan PDF.")

    first_bytes = await upload.read(5)
    if not first_bytes:
        raise UploadValidationError("File PDF kosong.")
    if first_bytes != b"%PDF-":
        raise UploadValidationError("File tidak memiliki magic bytes PDF yang valid.")

    stored_filename = f"{uuid4().hex}.pdf"
    destination = resolve_stored_path(stored_filename)
    file_size = len(first_bytes)

    try:
        with destination.open("xb") as output:
            output.write(first_bytes)
            while True:
                chunk = await upload.read(CHUNK_SIZE)
                if not chunk:
                    break
                file_size += len(chunk)
                if file_size > max_bytes:
                    raise UploadValidationError(f"Ukuran PDF melebihi batas {settings.max_pdf_size_mb} MB.")
                output.write(chunk)
    except UploadValidationError:
        destination.unlink(missing_ok=True)
        raise
    except OSError as exc:
        destination.unlink(missing_ok=True)
        raise FileStorageError("File PDF gagal disimpan.") from exc

    if file_size <= 0:
        destination.unlink(missing_ok=True)
        raise UploadValidationError("File PDF kosong.")

    return StoredUpload(
        original_filename=original_filename,
        stored_filename=stored_filename,
        file_path=_stored_file_path_for_response(destination),
        file_size=file_size,
    )
