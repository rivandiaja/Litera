# Panduan Demo Litera

Panduan ini disusun untuk demo 5 sampai 8 menit di kelas. Jalankan backend dan frontend lokal, gunakan akun demo, lalu tunjukkan alur mahasiswa, admin, indexing, search TF-IDF, dan evaluasi IR.

## Prerequisite

- Node.js dan npm sudah tersedia.
- Python virtualenv backend sudah dibuat.
- Dependency frontend dan backend sudah terpasang.
- Database sudah dimigrate dan seed.
- PDF demo berbasis teks sudah diletakkan di `demo-data/pdfs/` jika ingin import dataset lokal.

## Menjalankan Backend

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m alembic upgrade head
python -m app.services.seed
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

API docs:

```text
http://127.0.0.1:8000/docs
```

## Menjalankan Frontend

```powershell
npm install
npm run dev -- --host=127.0.0.1 --port=5173
```

Buka:

```text
http://127.0.0.1:5173
```

## Akun Demo

| Role | Email | Password |
|---|---|---|
| Admin | admin@litera.ac.id | AdminDemo123! |
| Mahasiswa | arif@mahasiswa.ac.id | StudentDemo123! |
| Mahasiswa | siti@mahasiswa.ac.id | StudentDemo123! |

## Import Dataset Demo Lokal

Siapkan file lokal:

```powershell
Copy-Item demo-data/manifest.example.json demo-data/manifest.json
Copy-Item demo-data/relevance-judgments.example.json demo-data/relevance-judgments.json
```

Letakkan PDF berbasis teks di `demo-data/pdfs/`, lalu sesuaikan path pada `manifest.json`.

Dry-run:

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
python -m app.cli.import_demo_dataset --manifest ../demo-data/manifest.json --dry-run
```

Import:

```powershell
python -m app.cli.import_demo_dataset --manifest ../demo-data/manifest.json
```

Reindex existing:

```powershell
python -m app.cli.import_demo_dataset --manifest ../demo-data/manifest.json --reindex-existing
```

## Urutan Demo 5 sampai 8 Menit

1. Login sebagai Arif.
2. Buka dashboard mahasiswa.
3. Buka koleksi NMS.
4. Upload PDF berbasis teks.
5. Tunjukkan status indexing: pending, processing, indexed, atau failed.
6. Cari query `snmp olt onu`.
7. Tunjukkan snippet, matched terms, score relevansi, dan halaman relevan.
8. Buka PDF dari hasil search pada halaman relevan.
9. Tunjukkan filter bidang penelitian.
10. Tunjukkan search history.
11. Login sebagai admin.
12. Tunjukkan dashboard admin, users, projects, documents, dan monitoring indexing.
13. Jalankan evaluasi Precision@5.

## Query Demo

- `mikrotik api pppoe`
- `snmp olt onu`
- `analisis gangguan ftth`
- `quality of service bandwidth`
- `monitoring jaringan`

## Skenario Mahasiswa Arif

- Login.
- Melihat dashboard.
- Membuat koleksi penelitian.
- Upload PDF.
- Menunggu status indexing.
- Edit judul dokumen.
- Re-index dokumen.
- Search global dan scoped collection.
- Melihat search history.
- Membuka PDF.
- Menghapus PDF uji jika diperlukan.

## Skenario Mahasiswa Siti

- Login.
- Memastikan project private Arif tidak terlihat jika Arif membuat project private.
- Tidak dapat mengedit project atau PDF milik Arif.
- Dapat membuka project public dan PDF public.
- Search hanya menampilkan dokumen yang dapat diakses.

## Skenario Admin

- Login sebagai admin.
- Melihat dashboard admin.
- Membuka tab users.
- Nonaktifkan user uji, lalu aktifkan kembali.
- Membuka tab projects.
- Membuka tab documents.
- Filter dokumen failed.
- Re-index dokumen.
- Melihat repository stats dan monitoring indexing.

## Contoh PDF Teks

Gunakan PDF yang memiliki text layer. Cara cepat memeriksa: teks dapat diblok dan disalin di PDF reader. Jika PDF hasil scan gambar, Litera akan memberi status `failed` karena OCR belum didukung.

## Menjelaskan Inverted Index

Gunakan contoh sederhana:

```text
snmp -> document_id=4 page=1 tf=3
olt  -> document_id=4 page=1 tf=2
onu  -> document_id=7 page=2 tf=4
```

Tekankan bahwa search tidak membaca ulang PDF. Search mengambil kandidat dari `index_terms` dan `index_postings`.

## Menjelaskan Ranking TF-IDF

1. Query diproses menjadi token.
2. Kandidat dokumen diambil dari postings.
3. TF-IDF dihitung dalam scope akses user.
4. Cosine similarity menentukan ranking.
5. Halaman relevan dihitung dari postings per halaman.

## Menjalankan Evaluasi

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
python -m app.cli.evaluate_ir --judgments ../demo-data/relevance-judgments.json --k 5
```

Output utama:

- Processed query terms.
- Jumlah hasil ditemukan.
- Posisi dokumen relevan.
- Precision@K.
- Recall@K.
- Mean Precision@K dan Mean Recall@K.

## Troubleshooting Singkat

- Login gagal: jalankan `python -m app.services.seed`.
- Search kosong: pastikan PDF sudah `indexed`.
- PDF failed: pastikan PDF punya text layer dan bukan scan.
- Upload ditolak: cek ekstensi `.pdf`, magic bytes, dan ukuran file.
- Frontend tidak terhubung: cek `VITE_API_BASE_URL` di `.env`.
- CORS error: cek `FRONTEND_ORIGIN` backend.
- Database kacau saat latihan: hapus database lokal, jalankan migration dan seed ulang.

## Catatan QA 8B

- Empty, error, dan loading state sudah tersedia pada homepage, bidang, koleksi, upload modal, search results, dashboard mahasiswa, dan dashboard admin.
- Radix dialog yang digunakan untuk modal utama sudah memiliki title dan description.
- Pesan error dari backend disanitasi melalui helper frontend dan service admin backend.
- Tidak ada fallback mock diam-diam pada area yang sudah terintegrasi API.
- Responsive QA dilakukan pada 1440x900, 1366x768, 768x1024, dan 390x844.
- Overflow horizontal mobile pada tombol upload navbar/dashboard sudah dipoles tanpa mengubah desain visual.
