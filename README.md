# Litera

Litera adalah prototype frontend untuk literature search engine pengelolaan referensi penelitian mahasiswa. Repository ini berasal dari export ZIP desain Figma Make, sehingga desain visual, layout, typography, warna, dan komponen UI perlu dipertahankan semaksimal mungkin.

Status saat ini: frontend prototype dengan mock data, ditambah backend FastAPI tahap awal untuk auth, database, CRUD bidang penelitian, dan CRUD koleksi penelitian. Frontend belum dihubungkan ke backend, sehingga pengalaman visual di browser masih menggunakan mock data export Figma Make.

## Prerequisite

- Node.js 22 atau versi LTS modern yang kompatibel dengan Vite 6.
- npm 11 atau versi npm modern.

## Instal Dependency

```bash
npm install
```

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

Backend menggunakan FastAPI, SQLAlchemy, SQLite, Alembic, PyJWT, dan `pwdlib[argon2]`. Pada tahap saat ini backend menyediakan health check, register, login, `/auth/me`, migration, model database fondasi, seed data demo, CRUD bidang penelitian, dan CRUD koleksi penelitian dengan authorization owner/admin. Frontend belum dihubungkan ke backend.

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

## Rencana Tahap Berikutnya

Tahap berikutnya adalah upload PDF, penyimpanan lokal, ekstraksi teks per halaman, preprocessing Bahasa Indonesia, inverted index custom, dan TF-IDF. Integrasi frontend dilakukan setelah API backend stabil tanpa mengubah desain visual.
