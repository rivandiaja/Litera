# Litera

Litera adalah prototype frontend untuk literature search engine pengelolaan referensi penelitian mahasiswa. Repository ini berasal dari export ZIP desain Figma Make, sehingga desain visual, layout, typography, warna, dan komponen UI perlu dipertahankan semaksimal mungkin.

Status saat ini: frontend prototype Figma Make sudah mulai terhubung ke backend untuk autentikasi, profil user aktif, bidang penelitian, dan koleksi penelitian. Backend FastAPI sudah menyediakan auth, database, CRUD bidang/koleksi, upload PDF, ekstraksi teks, preprocessing Bahasa Indonesia, custom inverted index, dan search engine TF-IDF. Upload PDF, status indexing, TF-IDF search UI, search history UI, dan dashboard admin penuh belum diintegrasikan ke frontend.

## Prerequisite

- Node.js 22 atau versi LTS modern yang kompatibel dengan Vite 6.
- npm 11 atau versi npm modern.

## Instal Dependency

```bash
npm install
```

## Environment Frontend

Buat `.env` dari contoh:

```powershell
Copy-Item .env.example .env
```

Isi default development:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000/api/v1
```

Token JWT frontend MVP disimpan melalui helper terpusat di `localStorage`. Untuk production deployment, evaluasi cookie HttpOnly.

## Menjalankan Frontend

```bash
npm run dev -- --host=127.0.0.1 --port=5173
```

Lalu buka:

```text
http://127.0.0.1:5173
```

## Pemeriksaan Frontend

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

## Dokumentasi Rencana

Rencana audit dan implementasi lengkap ada di:

```text
docs/IMPLEMENTATION_PLAN.md
```

## Backend API

Backend tahap awal berada di folder:

```text
backend/
```

Backend menggunakan FastAPI, SQLAlchemy, SQLite, Alembic, PyJWT, `pwdlib[argon2]`, PyMuPDF, Sastrawi, dan `python-multipart`. Pada tahap saat ini backend menyediakan health check, register, login, `/auth/me`, migration, seed data demo, CRUD bidang/koleksi, CRUD dokumen PDF, multiple upload, BackgroundTasks indexing, inverted index eksplisit, global search TF-IDF, catalog search, dan search history. Frontend Tahap 7A memakai endpoint auth, fields, dan projects.

Setup singkat:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
Copy-Item .env.example .env
alembic upgrade head
python -m app.services.seed
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Dokumentasi backend lengkap ada di:

```text
backend/README.md
```

## Akun Demo Lokal

| Role | Email | Password |
|---|---|---|
| Admin | admin@litera.ac.id | AdminDemo123! |
| Mahasiswa | arif@mahasiswa.ac.id | StudentDemo123! |
| Mahasiswa | siti@mahasiswa.ac.id | StudentDemo123! |

## Integrasi Frontend Saat Ini

Terintegrasi dengan API:

- Login, register, `/auth/me`, logout, dan role-aware navbar.
- Daftar/detail bidang penelitian.
- CRUD bidang penelitian untuk admin.
- Daftar koleksi publik di beranda.
- Dashboard bagian “Koleksi Saya” melalui `/projects/me`.
- Detail koleksi, tambah koleksi, edit koleksi, dan hapus koleksi.

Masih mock atau placeholder:

- Upload PDF dan progress upload.
- Daftar dokumen PDF pada detail koleksi.
- Status indexing dan re-index dari UI.
- UI pencarian TF-IDF, search history, dan search suggestions.
- Dashboard admin selain CRUD bidang penelitian.
- Statistik repository yang belum tersedia dari endpoint agregasi.

## Rencana Tahap Berikutnya

Tahap berikutnya adalah Tahap 7B: integrasi upload PDF, daftar dokumen, status indexing, re-index, dan search TF-IDF UI tanpa mengubah desain visual hasil export Figma Make.
