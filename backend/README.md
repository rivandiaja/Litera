# Litera Backend

Backend Litera adalah REST API FastAPI untuk autentikasi, database, migration, seed data MVP, CRUD bidang penelitian, CRUD koleksi penelitian, CRUD dokumen PDF, multiple upload, ekstraksi teks, preprocessing Bahasa Indonesia, dan custom inverted index. Tahap ini belum mencakup endpoint pencarian TF-IDF atau integrasi frontend.

## Prerequisite

- Python 3.14 atau versi Python modern yang kompatibel.
- Windows PowerShell.

## Setup

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
Copy-Item .env.example .env
```

Ganti `JWT_SECRET_KEY` di `.env` untuk penggunaan lokal yang lebih aman. File `.env` tidak boleh di-commit.

Konfigurasi upload PDF:

```env
UPLOAD_DIR=uploads
MAX_PDF_SIZE_MB=15
```

Folder upload dibuat otomatis. File PDF aktual diabaikan Git, sementara `uploads/.gitkeep` tetap dilacak.

## Migration

Database development dibuat melalui Alembic, bukan `Base.metadata.create_all()`.

```powershell
alembic upgrade head
```

## Seed Data

Seed bersifat idempotent dan dapat dijalankan berulang.

```powershell
python -m app.services.seed
```

## Menjalankan API

```powershell
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Endpoint verifikasi:

- `http://127.0.0.1:8000/api/v1/health`
- `http://127.0.0.1:8000/docs`

## Test

```powershell
pytest
```

Test memakai database SQLite terpisah dan menjalankan migration Alembic secara aman.

## Akun Demo Lokal

Password berikut hanya untuk demo lokal dan dokumentasi tugas.

| Role | Email | Password |
|---|---|---|
| Admin | admin@litera.ac.id | AdminDemo123! |
| Mahasiswa | arif@mahasiswa.ac.id | StudentDemo123! |
| Mahasiswa | siti@mahasiswa.ac.id | StudentDemo123! |

## Endpoint Tersedia

- `GET /api/v1/health`
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`
- `GET /api/v1/fields`
- `GET /api/v1/fields/{field_id}`
- `POST /api/v1/fields` admin
- `PATCH /api/v1/fields/{field_id}` admin
- `DELETE /api/v1/fields/{field_id}` admin, ditolak jika masih dipakai koleksi
- `GET /api/v1/projects`
- `GET /api/v1/projects/me`
- `GET /api/v1/projects/{project_id}`
- `POST /api/v1/projects`
- `PATCH /api/v1/projects/{project_id}` owner/admin
- `DELETE /api/v1/projects/{project_id}` owner/admin
- `POST /api/v1/projects/{project_id}/documents` owner/admin, multipart `files`
- `GET /api/v1/projects/{project_id}/documents`
- `GET /api/v1/documents/{document_id}`
- `GET /api/v1/documents/{document_id}/file`
- `PATCH /api/v1/documents/{document_id}` owner/admin
- `DELETE /api/v1/documents/{document_id}` owner/admin
- `POST /api/v1/documents/{document_id}/reindex` owner/admin

## Multipart Upload PDF

Contoh upload dua PDF:

```powershell
curl.exe -X POST `
  http://127.0.0.1:8000/api/v1/projects/1/documents `
  -H "Authorization: Bearer <token>" `
  -F "files=@monitoring-olt.pdf;type=application/pdf" `
  -F "files=@mikrotik-api.pdf;type=application/pdf"
```

Setiap file divalidasi terpisah. Response batch berisi `accepted`, `document_id`, status awal `pending`, atau pesan validasi bila file ditolak.

Validasi upload:

- Ekstensi harus `.pdf`.
- MIME harus PDF bila dikirim client.
- Magic bytes harus `%PDF-`.
- File tidak boleh kosong.
- Ukuran maksimal mengikuti `MAX_PDF_SIZE_MB`.
- Nama file tersimpan memakai UUID, bukan nama asli.

## Alur Indexing

```text
upload PDF
-> simpan metadata pending
-> BackgroundTasks menjalankan indexing dengan session database baru
-> status processing
-> PyMuPDF ekstrak teks per halaman
-> preprocessing Bahasa Indonesia
-> simpan document_pages
-> simpan document_stats, index_terms, index_postings
-> status indexed atau failed
```

Status dokumen:

- `pending`: metadata dibuat dan menunggu indexing.
- `processing`: PDF sedang diekstrak dan diindeks.
- `indexed`: halaman, stats, terms, dan postings berhasil dibuat.
- `failed`: PDF rusak, tidak punya text layer, file hilang, atau proses indexing gagal.

PDF scan/image-only diberi `failed` dengan pesan bahwa OCR belum didukung pada MVP.

## Preprocessing dan Inverted Index

Pipeline preprocessing:

```text
unicode normalization -> lowercase -> whitespace normalization -> hapus URL/email
-> cleaning karakter -> tokenizing -> stopword removal Indonesia
-> stemming Sastrawi -> technical term whitelist
```

Whitelist istilah teknis minimal:

```text
snmp, olt, onu, pppoe, ftth, mikrotik, routeros, api, qos, nms,
oid, rest, grafana, latency, bandwidth, throughput, packetloss
```

Struktur inverted index:

```json
{
  "snmp": {
    "17": {
      "pages": {
        "1": 2,
        "3": 5
      },
      "frequency": 7
    }
  }
}
```

Representasi SQLite:

- `document_pages`: `raw_text` dan `clean_text` per halaman.
- `document_stats`: total token dan jumlah halaman terindeks.
- `index_terms`: term hasil preprocessing dan `document_frequency`.
- `index_postings`: `term_id`, `document_id`, `page_number`, `term_frequency`.

Reindex membersihkan index lama terlebih dahulu agar tidak ada duplicate postings. Delete dokumen membersihkan file fisik, pages, stats, postings, dan term yatim.

## Aturan Akses

- Semua endpoint `fields` dan `projects` membutuhkan JWT.
- Mahasiswa hanya melihat bidang penelitian aktif.
- Admin dapat memakai `include_inactive=true` pada daftar bidang.
- Bidang nonaktif tidak dapat dipakai untuk membuat atau memindahkan koleksi.
- Koleksi `private` hanya dapat dibaca oleh owner dan admin; untuk mahasiswa lain dikembalikan sebagai `404`.
- Koleksi dapat diubah atau dihapus oleh owner atau admin.
- Upload, patch title, delete, dan reindex dokumen hanya owner project atau admin.
- Metadata/file dokumen private tidak bocor ke mahasiswa lain dan dikembalikan sebagai `404`.

## Belum Dibuat pada Tahap Ini

- Ranking TF-IDF.
- Search endpoint.
- Integrasi frontend ke backend.
