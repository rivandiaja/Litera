# Litera

Litera adalah prototype frontend untuk literature search engine pengelolaan referensi penelitian mahasiswa. Repository ini berasal dari export ZIP desain Figma Make, sehingga desain visual, layout, typography, warna, dan komponen UI perlu dipertahankan semaksimal mungkin.

Status saat ini: frontend prototype Figma Make sudah terhubung ke backend untuk autentikasi, profil user aktif, bidang penelitian, koleksi penelitian, dokumen PDF, pencarian TF-IDF, catalog search, scoped search, relevant pages, search history, statistik repository, dashboard mahasiswa, dashboard admin, manajemen pengguna admin, daftar koleksi/dokumen admin, dan monitoring indexing. Backend FastAPI sudah menyediakan auth, database, CRUD bidang/koleksi/dokumen, upload PDF, ekstraksi teks, preprocessing Bahasa Indonesia, custom inverted index, search engine TF-IDF, endpoint agregat dashboard, dan endpoint admin.

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

Backend menggunakan FastAPI, SQLAlchemy, SQLite, Alembic, PyJWT, `pwdlib[argon2]`, PyMuPDF, Sastrawi, dan `python-multipart`. Pada tahap saat ini backend menyediakan health check, register, login, `/auth/me`, migration, seed data demo, CRUD bidang/koleksi, CRUD dokumen PDF, multiple upload, BackgroundTasks indexing, inverted index eksplisit, global search TF-IDF, catalog search, search history, statistik repository, dashboard mahasiswa, dashboard admin, admin users, admin projects, admin documents, dan admin indexing. Frontend memakai endpoint tersebut tanpa fallback mock pada area yang sudah terintegrasi.

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
- Daftar dokumen PDF pada detail koleksi melalui `/projects/{project_id}/documents`.
- Multiple upload PDF melalui multipart field `files`.
- Status indexing dokumen nyata dan polling ringan saat status `pending` atau `processing`.
- Buka PDF melalui fetch blob ber-Authorization tanpa token di URL.
- Edit judul PDF, hapus PDF, dan re-index untuk owner/admin.
- Pencarian global TF-IDF melalui `/search`.
- Filter hasil berdasarkan bidang penelitian dan koleksi.
- Pencarian scoped dari detail bidang dan detail koleksi.
- Catalog search dari search bar beranda untuk bidang/koleksi.
- Snippet plain text dengan highlight aman tanpa `dangerouslySetInnerHTML`.
- Relevant pages dan buka PDF langsung ke `#page=...` tanpa token di URL.
- Search history dashboard mahasiswa melalui endpoint history.
- Statistik repository beranda melalui `/dashboard/repository-stats`.
- Ringkasan dashboard mahasiswa melalui `/dashboard/me`.
- Ringkasan dashboard admin melalui `/admin/dashboard`.
- Tab admin pengguna melalui `/admin/users` dan `PATCH /admin/users/{id}`.
- Tab admin koleksi melalui `/admin/projects`.
- Tab admin dokumen melalui `/admin/documents`.
- Monitoring indexing admin melalui `/admin/indexing` dengan polling saat ada status `pending` atau `processing`.

Area statis yang masih tersisa:

- Pengaturan platform di dashboard admin belum memiliki endpoint persistence pada MVP ini.
- Beberapa preview visual Figma, seperti kartu contoh di hero/login, tetap statis sebagai elemen presentasi desain.
- Tidak ada fallback diam-diam ke mock data untuk statistik homepage, dashboard mahasiswa, dashboard admin, users, collections, documents, atau monitoring indexing.

## Rencana Tahap Berikutnya

Tahap berikutnya adalah Tahap 8B: validasi dataset demo kecil, hardening edge case UI/API, pengujian manual lebih luas, dan polishing responsif tanpa mengubah desain visual hasil export Figma Make.
