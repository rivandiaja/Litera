from __future__ import annotations

from contextlib import contextmanager
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path
from tempfile import TemporaryDirectory
from typing import Iterator
from urllib.parse import urlparse
from uuid import uuid4

import boto3
from botocore.client import Config
from botocore.exceptions import BotoCoreError, ClientError
from fastapi import UploadFile
from starlette.concurrency import run_in_threadpool

from app.core.config import get_settings

ALLOWED_PDF_MIME_TYPES = {"application/pdf", "application/x-pdf"}
CHUNK_SIZE = 1024 * 1024
S3_URI_PREFIX = "s3://"


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
    if is_s3_file_path(file_path):
        raise FileStorageError("Remote object does not have a permanent local path")
    path = Path(file_path)
    if not path.is_absolute():
        path = Path.cwd() / path
    return _ensure_inside_upload_root(path)


def is_s3_file_path(file_path: str) -> bool:
    return file_path.startswith(S3_URI_PREFIX)


def _require_s3_configuration() -> tuple[str, str, str, str, str]:
    settings = get_settings()
    values = {
        "S3_ENDPOINT_URL": settings.s3_endpoint_url,
        "S3_ACCESS_KEY_ID": settings.s3_access_key_id,
        "S3_SECRET_ACCESS_KEY": settings.s3_secret_access_key,
        "S3_BUCKET": settings.s3_bucket,
        "S3_REGION": settings.s3_region,
    }
    missing = [name for name, value in values.items() if not value]
    if missing:
        raise FileStorageError(f"Konfigurasi storage belum lengkap: {', '.join(missing)}.")
    return (
        str(settings.s3_endpoint_url).rstrip("/"),
        str(settings.s3_access_key_id),
        str(settings.s3_secret_access_key),
        settings.s3_bucket,
        settings.s3_region,
    )


@lru_cache(maxsize=1)
def _get_s3_client():
    endpoint_url, access_key, secret_key, _bucket, region = _require_s3_configuration()
    return boto3.client(
        "s3",
        endpoint_url=endpoint_url,
        aws_access_key_id=access_key,
        aws_secret_access_key=secret_key,
        region_name=region,
        config=Config(signature_version="s3v4", s3={"addressing_style": "path"}),
    )


def _s3_object_key(stored_filename: str) -> str:
    prefix = get_settings().s3_prefix.strip().strip("/")
    return f"{prefix}/{stored_filename}" if prefix else stored_filename


def _s3_uri(bucket: str, object_key: str) -> str:
    return f"{S3_URI_PREFIX}{bucket}/{object_key}"


def _parse_s3_uri(file_path: str) -> tuple[str, str]:
    parsed = urlparse(file_path)
    bucket = parsed.netloc.strip()
    object_key = parsed.path.lstrip("/")
    if parsed.scheme != "s3" or not bucket or not object_key:
        raise FileStorageError("Path object storage tidak valid.")
    return bucket, object_key


def _raise_s3_error(exc: Exception, message: str) -> None:
    raise FileStorageError(message) from exc


def _upload_to_s3(source: Path, bucket: str, object_key: str) -> None:
    try:
        _get_s3_client().upload_file(
            str(source),
            bucket,
            object_key,
            ExtraArgs={"ContentType": "application/pdf"},
        )
    except (BotoCoreError, ClientError, OSError) as exc:
        _raise_s3_error(exc, "File PDF gagal disimpan ke object storage.")


def document_file_exists(file_path: str) -> bool:
    if not is_s3_file_path(file_path):
        try:
            return resolve_document_path(file_path).exists()
        except FileStorageError:
            return False

    bucket, object_key = _parse_s3_uri(file_path)
    try:
        _get_s3_client().head_object(Bucket=bucket, Key=object_key)
        return True
    except ClientError as exc:
        status_code = exc.response.get("ResponseMetadata", {}).get("HTTPStatusCode")
        if status_code in {404, 410}:
            return False
        _raise_s3_error(exc, "Object storage tidak dapat diakses.")
    except BotoCoreError as exc:
        _raise_s3_error(exc, "Object storage tidak dapat diakses.")
    return False


def delete_document_file(file_path: str) -> bool:
    if not is_s3_file_path(file_path):
        path = resolve_document_path(file_path)
        if not path.exists():
            return False
        path.unlink()
        return True

    bucket, object_key = _parse_s3_uri(file_path)
    try:
        _get_s3_client().delete_object(Bucket=bucket, Key=object_key)
        return True
    except (BotoCoreError, ClientError) as exc:
        _raise_s3_error(exc, "File PDF gagal dihapus dari object storage.")
    return False


def read_document_file(file_path: str) -> bytes:
    if not is_s3_file_path(file_path):
        path = resolve_document_path(file_path)
        if not path.exists():
            raise FileStorageError("File PDF tidak ditemukan di storage.")
        try:
            return path.read_bytes()
        except OSError as exc:
            raise FileStorageError("File PDF tidak dapat dibaca.") from exc

    bucket, object_key = _parse_s3_uri(file_path)
    try:
        response = _get_s3_client().get_object(Bucket=bucket, Key=object_key)
        body = response["Body"]
        try:
            return body.read()
        finally:
            body.close()
    except (BotoCoreError, ClientError, KeyError, OSError) as exc:
        _raise_s3_error(exc, "File PDF tidak ditemukan di object storage.")
    return b""


@contextmanager
def materialize_document_path(file_path: str) -> Iterator[Path]:
    if not is_s3_file_path(file_path):
        path = resolve_document_path(file_path)
        if not path.exists():
            raise FileStorageError("File PDF tidak ditemukan di storage.")
        yield path
        return

    bucket, object_key = _parse_s3_uri(file_path)
    with TemporaryDirectory(prefix="litera-pdf-") as temporary_directory:
        destination = Path(temporary_directory) / Path(object_key).name
        try:
            _get_s3_client().download_file(bucket, object_key, str(destination))
        except (BotoCoreError, ClientError, OSError) as exc:
            _raise_s3_error(exc, "File PDF tidak ditemukan di object storage.")
        if not destination.exists():
            raise FileStorageError("File PDF tidak ditemukan di object storage.")
        yield destination


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
    temporary_directory: TemporaryDirectory | None = None
    if settings.storage_backend == "s3":
        temporary_directory = TemporaryDirectory(prefix="litera-upload-")
        destination = Path(temporary_directory.name) / stored_filename
    else:
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

        if settings.storage_backend == "s3":
            _endpoint, _access_key, _secret_key, bucket, _region = _require_s3_configuration()
            object_key = _s3_object_key(stored_filename)
            await run_in_threadpool(_upload_to_s3, destination, bucket, object_key)
            file_path = _s3_uri(bucket, object_key)
        else:
            file_path = _stored_file_path_for_response(destination)
    except UploadValidationError:
        destination.unlink(missing_ok=True)
        raise
    except FileStorageError:
        destination.unlink(missing_ok=True)
        raise
    except OSError as exc:
        destination.unlink(missing_ok=True)
        raise FileStorageError("File PDF gagal disimpan.") from exc
    finally:
        if temporary_directory is not None:
            temporary_directory.cleanup()

    if file_size <= 0:
        raise UploadValidationError("File PDF kosong.")

    return StoredUpload(
        original_filename=original_filename,
        stored_filename=stored_filename,
        file_path=file_path,
        file_size=file_size,
    )
