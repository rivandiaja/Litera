import asyncio
from io import BytesIO
from pathlib import Path
from types import SimpleNamespace

from botocore.exceptions import ClientError
from fastapi import UploadFile
from starlette.datastructures import Headers

from app.services import file_storage
from tests.helpers import make_pdf_bytes


class FakeS3Client:
    def __init__(self):
        self.objects: dict[tuple[str, str], bytes] = {}

    def upload_file(self, filename, bucket, key, ExtraArgs=None):
        self.objects[(bucket, key)] = Path(filename).read_bytes()

    def head_object(self, Bucket, Key):
        if (Bucket, Key) not in self.objects:
            raise ClientError(
                {"Error": {"Code": "404"}, "ResponseMetadata": {"HTTPStatusCode": 404}},
                "HeadObject",
            )
        return {"ContentLength": len(self.objects[(Bucket, Key)])}

    def get_object(self, Bucket, Key):
        return {"Body": BytesIO(self.objects[(Bucket, Key)])}

    def download_file(self, bucket, key, filename):
        Path(filename).write_bytes(self.objects[(bucket, key)])

    def delete_object(self, Bucket, Key):
        self.objects.pop((Bucket, Key), None)
        return {}


def test_s3_storage_upload_read_materialize_and_delete(monkeypatch):
    fake_client = FakeS3Client()
    settings = SimpleNamespace(
        max_pdf_size_mb=1,
        storage_backend="s3",
        s3_endpoint_url="https://project.storage.supabase.co/storage/v1/s3",
        s3_access_key_id="test-key",
        s3_secret_access_key="test-secret",
        s3_bucket="litera-pdfs",
        s3_region="us-east-1",
        s3_prefix="documents",
    )
    monkeypatch.setattr(file_storage, "get_settings", lambda: settings)
    monkeypatch.setattr(file_storage, "_get_s3_client", lambda: fake_client)

    pdf_bytes = make_pdf_bytes(["Dokumen uji Supabase Storage"])
    upload = UploadFile(
        file=BytesIO(pdf_bytes),
        filename="uji.pdf",
        headers=Headers({"content-type": "application/pdf"}),
    )

    stored = asyncio.run(file_storage.save_pdf_upload(upload))

    assert stored.file_path.startswith("s3://litera-pdfs/documents/")
    assert file_storage.document_file_exists(stored.file_path)
    assert file_storage.read_document_file(stored.file_path) == pdf_bytes
    with file_storage.materialize_document_path(stored.file_path) as local_path:
        assert local_path.read_bytes() == pdf_bytes
    assert file_storage.delete_document_file(stored.file_path)
    assert not file_storage.document_file_exists(stored.file_path)
