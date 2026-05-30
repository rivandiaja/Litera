# Litera Backend

Backend Litera adalah REST API FastAPI untuk autentikasi, database, migration, seed data MVP, CRUD bidang penelitian, CRUD koleksi penelitian, CRUD dokumen PDF, multiple upload, ekstraksi teks, preprocessing Bahasa Indonesia, custom inverted index, dan search engine TF-IDF. Frontend Tahap 7A sudah memakai endpoint auth, fields, dan projects. Endpoint dokumen, indexing, search TF-IDF, dan history masih menunggu integrasi UI tahap berikutnya.

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
- `GET /api/v1/search`
- `GET /api/v1/search/catalog`
- `GET /api/v1/search/history`
- `DELETE /api/v1/search/history`

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

## Search TF-IDF

Endpoint utama:

```text
GET /api/v1/search?q=monitoring+redaman+onu+snmp
```

Filter yang tersedia:

- `research_field_id`
- `research_project_id`
- `owner_id`
- `page`
- `page_size`, maksimal 50
- `sort_by`: `relevance`, `newest`, `title_asc`, `title_desc`

Query memakai pipeline preprocessing yang sama dengan dokumen. Candidate retrieval hanya mengambil kandidat dari `index_terms` dan `index_postings`, lalu menerapkan visibility, filter field, filter project, filter owner, dan status `indexed`. Search tidak membaca ulang PDF dan tidak membangun index baru.

Ranking memakai vector space model:

```text
tf_weight(tf) = 0 jika tf = 0, selain itu 1 + ln(tf)
idf(term) = ln((N + 1) / (df(term) + 1)) + 1
weight(term, document) = tf_weight(term_frequency) * idf(term)
cosine_similarity = dot(query_vector, document_vector) / (norm(query) * norm(document))
```

`N` dan `df(term)` dihitung secara scoped sesuai akses user dan filter aktif. Statistik global `index_terms.document_frequency` tetap disimpan untuk presentasi index, tetapi ranking search memakai scoped IDF.

Snippet dibuat dari `document_pages.raw_text` pada halaman terbaik, bukan dari `clean_text`. Backend mengirim plain text yang di-escape, `matched_terms`, maksimal 5 `relevant_pages`, dan `best_page` 1-based.

## Catalog dan History

`GET /api/v1/search/catalog?q=network` mencari katalog bidang dan koleksi dengan pencocokan case-insensitive sederhana. Endpoint ini bukan TF-IDF PDF search.

`GET /api/v1/search/history` menampilkan riwayat pencarian user aktif, terbaru dahulu. `DELETE /api/v1/search/history` hanya menghapus riwayat milik user aktif.

## Aturan Akses

- Semua endpoint `fields` dan `projects` membutuhkan JWT.
- Mahasiswa hanya melihat bidang penelitian aktif.
- Admin dapat memakai `include_inactive=true` pada daftar bidang.
- Bidang nonaktif tidak dapat dipakai untuk membuat atau memindahkan koleksi.
- Koleksi `private` hanya dapat dibaca oleh owner dan admin; untuk mahasiswa lain dikembalikan sebagai `404`.
- Koleksi dapat diubah atau dihapus oleh owner atau admin.
- Upload, patch title, delete, dan reindex dokumen hanya owner project atau admin.
- Metadata/file dokumen private tidak bocor ke mahasiswa lain dan dikembalikan sebagai `404`.
- Dokumen private tidak masuk search user lain, tidak memengaruhi result count, dan tidak bocor lewat snippet.
- Admin dapat mencari seluruh dokumen indexed termasuk private.
- Field nonaktif tetap boleh dipakai sebagai filter search untuk dokumen lama yang masih dapat diakses.

## Belum Dibuat pada Tahap Ini

- Endpoint admin lengkap untuk user/document moderation.
- Integrasi frontend untuk upload PDF, status indexing, search TF-IDF UI, dan search history.
