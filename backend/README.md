# Litera Backend

Backend Litera adalah REST API FastAPI untuk fondasi autentikasi, database, migration, seed data MVP, CRUD bidang penelitian, dan CRUD koleksi penelitian. Tahap ini belum mencakup upload PDF, indexing, inverted index runtime, TF-IDF, search endpoint, atau integrasi frontend.

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

## Aturan Akses Tahap 4

- Semua endpoint `fields` dan `projects` membutuhkan JWT.
- Mahasiswa hanya melihat bidang penelitian aktif.
- Admin dapat memakai `include_inactive=true` pada daftar bidang.
- Bidang nonaktif tidak dapat dipakai untuk membuat atau memindahkan koleksi.
- Koleksi `private` hanya dapat dibaca oleh owner dan admin; untuk mahasiswa lain dikembalikan sebagai `404`.
- Koleksi dapat diubah atau dihapus oleh owner atau admin.

## Belum Dibuat pada Tahap Ini

- Upload PDF.
- Ekstraksi teks PDF.
- Preprocessing Bahasa Indonesia.
- Inverted index runtime.
- Ranking TF-IDF.
- Search endpoint.
- Integrasi frontend ke backend.
