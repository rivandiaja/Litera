# Litera Backend

Backend Litera adalah REST API FastAPI untuk fondasi autentikasi, database, migration, dan seed data MVP. Tahap ini belum mencakup upload PDF, indexing, inverted index runtime, TF-IDF, atau search endpoint.

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
| Admin | admin@litera.local | AdminDemo123! |
| Mahasiswa | arif@mahasiswa.ac.id | StudentDemo123! |
| Mahasiswa | siti@mahasiswa.ac.id | StudentDemo123! |

## Endpoint Tersedia

- `GET /api/v1/health`
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`

## Belum Dibuat pada Tahap Ini

- CRUD bidang penelitian dan koleksi melalui API publik.
- Upload PDF.
- Ekstraksi teks PDF.
- Preprocessing Bahasa Indonesia.
- Inverted index runtime.
- Ranking TF-IDF.
- Search endpoint.
- Integrasi frontend ke backend.
