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

## Stack Teknologi

Frontend:

- Vite 6, React 18, TypeScript.
- Tailwind CSS 4 dan CSS variables hasil export Figma Make.
- Radix UI, shadcn-style components, lucide-react, sonner.
- Vitest, Testing Library, ESLint, npm lockfile.

Backend:

- FastAPI, SQLAlchemy 2, Alembic, SQLite.
- PyJWT, Argon2 password hashing via `pwdlib[argon2]`.
- PyMuPDF untuk ekstraksi teks PDF.
- Sastrawi untuk stemming Bahasa Indonesia.
- Custom inverted index dan TF-IDF, tanpa Elasticsearch/vector database/embedding.

## Struktur Folder Ringkas

```text
.
|-- src/                    # Frontend React hasil export Figma Make
|-- backend/                # FastAPI, SQLAlchemy, indexing, search, tests
|-- docs/                   # Rencana implementasi, metode IR, panduan demo
|-- demo-data/              # Manifest contoh dan ground truth contoh
|-- README.md
|-- PRD.md
|-- AGENTS.md
```

## Metode Information Retrieval

Pipeline IR Litera:

```text
PDF -> ekstraksi teks per halaman -> preprocessing Bahasa Indonesia
-> inverted index custom -> query processing -> candidate retrieval
-> TF-IDF -> cosine similarity -> ranking -> snippet dan halaman relevan
```

Rumus ranking:

```text
tf_weight(tf) = 0 jika tf = 0, selain itu 1 + ln(tf)
idf(term) = ln((N + 1) / (df(term) + 1)) + 1
cosine_similarity = dot(query_vector, document_vector) / (norm(query) * norm(document))
```

Dokumentasi akademik lengkap ada di `docs/IR_METHOD.md`.

## Dataset Demo Lokal

PDF aktual tidak boleh di-commit. Struktur dataset:

```text
demo-data/
|-- README.md
|-- manifest.example.json
|-- relevance-judgments.example.json
|-- pdfs/
    |-- .gitkeep
```

Salin file contoh untuk dataset lokal:

```powershell
Copy-Item demo-data/manifest.example.json demo-data/manifest.json
Copy-Item demo-data/relevance-judgments.example.json demo-data/relevance-judgments.json
```

Letakkan PDF di `demo-data/pdfs/`, lalu sesuaikan path pada `manifest.json`.

Dry-run import:

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
python -m app.cli.import_demo_dataset --manifest ../demo-data/manifest.json --dry-run
```

Import dan indexing sinkron:

```powershell
python -m app.cli.import_demo_dataset --manifest ../demo-data/manifest.json
```

Re-copy dan re-index dokumen existing:

```powershell
python -m app.cli.import_demo_dataset --manifest ../demo-data/manifest.json --reindex-existing
```

## Evaluasi IR

Evaluator memakai search service backend langsung, bukan HTTP request, dan tidak mencatat search history.

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
python -m app.cli.evaluate_ir --judgments ../demo-data/relevance-judgments.json --k 5
```

Output mencakup processed terms, jumlah hasil, posisi dokumen relevan, Precision@K, Recall@K, mean metrics, dan elapsed time.

## Endpoint Ringkas

Endpoint utama tersedia di bawah `/api/v1`:

- Auth: `/auth/register`, `/auth/login`, `/auth/me`.
- Fields: `/fields`, `/fields/{id}`.
- Projects: `/projects`, `/projects/me`, `/projects/{id}`.
- Documents: `/projects/{id}/documents`, `/documents/{id}`, `/documents/{id}/file`, `/documents/{id}/reindex`.
- Search: `/search`, `/search/catalog`, `/search/history`.
- Dashboard: `/dashboard/me`, `/dashboard/repository-stats`.
- Admin: `/admin/dashboard`, `/admin/users`, `/admin/projects`, `/admin/documents`, `/admin/indexing`.

## Panduan Demo dan Checklist

- Panduan demo presentasi: `docs/DEMO_GUIDE.md`.
- Checklist penyerahan: `docs/SUBMISSION_CHECKLIST.md`.
- Rencana implementasi lengkap: `docs/IMPLEMENTATION_PLAN.md`.

## Keterbatasan MVP

- OCR untuk PDF scan belum didukung.
- Search semantic, embedding, vector database, dan Elasticsearch sengaja tidak digunakan.
- Dataset dan storage masih lokal.
- SQLite cocok untuk MVP dan demo kelas, belum untuk deployment multi-user besar.
- Tab pengaturan platform admin masih statis.

## Troubleshooting

- Login gagal: jalankan `python -m app.services.seed`.
- Search kosong: pastikan dokumen berstatus `indexed`.
- PDF gagal indexing: pastikan PDF memiliki text layer, bukan scan.
- Upload ditolak: cek ekstensi `.pdf`, magic bytes, dan ukuran file.
- Frontend gagal call API: cek `VITE_API_BASE_URL`.
- CORS error: cek `FRONTEND_ORIGIN` di backend `.env`.

## Status Proyek

Tahap 8B selesai secara kode dan dokumentasi: dataset demo lokal, import helper, evaluator Precision@K/Recall@K, dokumentasi IR, panduan demo, checklist penyerahan, dan hardening akhir tersedia. Frontend tetap mempertahankan desain Figma Make dan backend tetap memakai custom inverted index serta TF-IDF eksplisit.
