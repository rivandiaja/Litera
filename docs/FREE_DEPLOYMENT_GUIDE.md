# Deployment Gratis Litera

Panduan ini ditujukan untuk deployment pertama kali. Arsitektur yang dipakai:

```text
Browser
  -> Vercel Hobby: React/Vite frontend
  -> Render Free: FastAPI backend
       -> Supabase Free: PostgreSQL
       -> Supabase Free: private PDF bucket melalui S3 API
```

Pilihan ini mempertahankan custom inverted index dan TF-IDF Litera. Supabase hanya menjadi database dan object storage, bukan search engine.

## 1. Yang Perlu Disiapkan

Buat akun gratis berikut:

1. [GitHub](https://github.com/) untuk menyimpan source code.
2. [Supabase](https://supabase.com/) untuk database dan PDF storage.
3. [Render](https://render.com/) untuk FastAPI.
4. [Vercel](https://vercel.com/) untuk frontend.

Gunakan login GitHub pada Render dan Vercel agar proses impor repository lebih sederhana. Jangan pernah memasukkan isi `.env`, database password, JWT secret, atau S3 secret ke GitHub.

## 2. Upload Repository ke GitHub

Dari root proyek, periksa agar secret tidak ikut dilacak:

```powershell
git status
git check-ignore .env backend/.env
```

Buat repository kosong di GitHub, misalnya `litera`, lalu ikuti perintah yang ditampilkan GitHub. Contoh bila repository lokal sudah memiliki commit:

```powershell
git remote add origin https://github.com/USERNAME/litera.git
git branch -M main
git push -u origin main
```

## 3. Buat Project Supabase

1. Masuk ke Supabase Dashboard.
2. Klik **New project**.
3. Pilih organisasi, isi nama `litera`, buat password database yang kuat, dan pilih region terdekat.
4. Pilih **Free plan**, lalu tunggu project siap.
5. Simpan password database di password manager. Password ini tidak dapat dilihat kembali dalam bentuk asli.

### Ambil Database URL

1. Pada project Supabase, klik **Connect**.
2. Pilih **Session pooler** karena Render menjalankan server API yang persisten.
3. Salin connection string URI.
4. Ganti placeholder password dengan password database.

Nilai akhirnya biasanya menyerupai:

```text
postgresql://postgres.PROJECT_REF:PASSWORD@REGION.pooler.supabase.com:5432/postgres
```

Jika password mengandung karakter khusus, encode bagian password saja. Di PowerShell:

```powershell
[uri]::EscapeDataString('PASSWORD_ASLI')
```

Simpan URI itu sebagai nilai `DATABASE_URL` nanti. Backend otomatis memilih driver `psycopg`.

### Buat Bucket PDF

1. Buka **Storage**.
2. Klik **New bucket**.
3. Isi nama persis `litera-pdfs`.
4. Biarkan bucket **private**.
5. Buat bucket.

### Buat S3 Access Key

1. Buka pengaturan S3 pada halaman Storage. Pada versi dashboard tertentu letaknya di **Storage > S3** atau **Project Settings > Storage**.
2. Buat access key baru.
3. Catat empat nilai yang ditampilkan:

```text
S3_ENDPOINT_URL=https://PROJECT_REF.storage.supabase.co/storage/v1/s3
S3_REGION=PROJECT_REGION
S3_ACCESS_KEY_ID=...
S3_SECRET_ACCESS_KEY=...
```

Secret access key biasanya hanya ditampilkan sekali. Bucket tetap private; browser tidak mengakses Supabase Storage secara langsung. FastAPI memeriksa JWT dan hak akses sebelum mengirim PDF.

## 4. Deploy Backend di Render

Repository sudah memiliki `render.yaml`, jadi gunakan Blueprint:

1. Masuk ke Render Dashboard.
2. Klik **New > Blueprint**.
3. Hubungkan GitHub dan pilih repository Litera.
4. Render membaca `render.yaml` dan membuat service `litera-api` dengan paket Free.
5. Isi semua variable yang bertanda manual.

Gunakan nilai berikut:

| Variable | Nilai |
|---|---|
| `DATABASE_URL` | Session pooler URI dari Supabase |
| `FRONTEND_ORIGINS` | Kosong dahulu; diisi setelah Vercel selesai |
| `S3_ENDPOINT_URL` | Endpoint S3 Supabase |
| `S3_REGION` | Region yang ditampilkan Supabase |
| `S3_ACCESS_KEY_ID` | S3 access key Supabase |
| `S3_SECRET_ACCESS_KEY` | S3 secret Supabase |
| `DEMO_ADMIN_PASSWORD` | Password admin unik, minimal 12 karakter |
| `DEMO_STUDENT_PASSWORD` | Password akun mahasiswa demo unik |

Nilai lain sudah disediakan `render.yaml`. Render akan membuat `JWT_SECRET_KEY` secara otomatis.

Klik **Apply** atau **Deploy Blueprint**. Saat startup, Render menjalankan migration Alembic, seed idempotent, lalu FastAPI. Setelah status menjadi Live, buka:

```text
https://NAMA-SERVICE.onrender.com/api/v1/health
```

Response yang benar:

```json
{"status":"ok","service":"Litera API"}
```

Catat base URL API:

```text
https://NAMA-SERVICE.onrender.com/api/v1
```

## 5. Deploy Frontend di Vercel

1. Masuk ke Vercel dengan GitHub.
2. Klik **Add New > Project**.
3. Pilih repository Litera dan klik **Import**.
4. Framework seharusnya terdeteksi sebagai Vite.
5. Biarkan root directory pada root repository.
6. Tambahkan Environment Variable:

```text
VITE_API_BASE_URL=https://NAMA-SERVICE.onrender.com/api/v1
```

7. Terapkan minimal untuk Production. Nilai yang sama boleh dipakai untuk Preview dan Development.
8. Klik **Deploy**.

Setelah selesai, Vercel memberi URL seperti:

```text
https://litera-USERNAME.vercel.app
```

## 6. Hubungkan CORS

Kembali ke Render:

1. Buka service `litera-api`.
2. Buka **Environment**.
3. Isi `FRONTEND_ORIGINS` dengan URL Vercel tanpa slash terakhir:

```text
https://litera-USERNAME.vercel.app
```

Untuk beberapa domain, pisahkan dengan koma:

```text
https://litera.vercel.app,https://www.litera.example
```

Jika menguji sebuah Preview Deployment Vercel, tambahkan URL preview tersebut secara eksplisit ke daftar ini.

4. Simpan. Render akan menjalankan deploy/restart.

Jangan memakai wildcard `*` untuk production karena API menggunakan autentikasi.

## 7. Uji Deployment

1. Buka URL Vercel.
2. Login dengan `admin@litera.ac.id` dan nilai `DEMO_ADMIN_PASSWORD` yang dimasukkan di Render.
3. Login mahasiswa menggunakan `arif@mahasiswa.ac.id` dan nilai `DEMO_STUDENT_PASSWORD`.
4. Buat koleksi dan upload PDF kecil yang memiliki text layer.
5. Tunggu status berubah dari `pending`, `processing`, lalu `indexed`.
6. Cari kata yang memang ada di PDF dan buka halaman relevan.

Render Free dapat tidur saat tidak aktif. Request pertama setelah tidur dapat terasa lambat; tunggu backend aktif lalu refresh. Jika service berhenti saat indexing, gunakan tombol re-index setelah service hidup kembali.

## 8. Update Aplikasi Berikutnya

Setelah perubahan sudah di-commit dan di-push:

```powershell
git add .
git commit -m "deskripsi perubahan"
git push
```

Vercel dan Render akan deploy ulang otomatis dari branch yang terhubung. Migration Alembic dijalankan sebelum API mulai.

## 9. Batas Paket Gratis

- Vercel Hobby ditujukan untuk proyek personal/non-komersial dan memiliki usage limit.
- Render Free akan spin down saat tidak aktif, sehingga ada cold start. Disk lokalnya tidak persisten.
- Supabase Free memiliki kuota database, storage, dan egress; project gratis yang lama tidak aktif dapat dipause.
- Background indexing saat ini berjalan dalam proses FastAPI, bukan worker terpisah. Ini cukup untuk demo/MVP tetapi belum ideal untuk beban paralel besar.
- Maksimum upload Litera tetap 15 MB. Pastikan batas akun Supabase juga tidak disetel lebih rendah.

Periksa batas terbaru pada [Vercel Pricing](https://vercel.com/pricing), [Render Free](https://render.com/docs/free), dan [Supabase Pricing](https://supabase.com/pricing).

## 10. Keamanan dan Troubleshooting

- Jangan commit `.env` atau menempelkan secret di issue/screenshot publik.
- Bila secret pernah bocor, rotate database password, S3 key, dan JWT secret.
- `CORS error`: periksa `FRONTEND_ORIGINS` di Render dan pastikan tidak ada slash terakhir.
- `502` atau request lama: buka health endpoint Render dan tunggu cold start selesai.
- `database connection failed`: periksa Session pooler URI dan encoding password.
- `upload gagal`: periksa nama bucket, endpoint, region, access key, dan secret key.
- `indexing failed`: gunakan PDF yang memiliki text layer; OCR belum tersedia.
- `PDF not found` setelah migrasi dari deployment lama: record lama mungkin masih menunjuk disk lokal dan perlu di-upload ulang.

Untuk kembali ke mode lokal, gunakan `DATABASE_URL=sqlite:///./litera.db` dan `STORAGE_BACKEND=local` pada `backend/.env`.
