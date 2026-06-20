# Deployment Backend Litera di Northflank

Panduan ini menggunakan Northflank Sandbox untuk FastAPI. Frontend tetap di Vercel, sedangkan PostgreSQL dan PDF Storage tetap memakai Supabase.

```text
Vercel -> Northflank FastAPI -> Supabase PostgreSQL
                            -> Supabase private S3 Storage
```

## 1. Pastikan Repository Sudah di GitHub

Northflank membangun image dari commit GitHub, bukan dari file yang hanya ada di komputer. Pastikan `backend/Dockerfile` sudah di-commit dan di-push ke branch `master`.

Jangan commit `.env`, database password, JWT secret, atau S3 secret.

## 2. Buat Project Northflank

1. Masuk ke [Northflank](https://app.northflank.com/).
2. Hubungkan akun GitHub.
3. Klik **Create new project**.
4. Nama project: `litera`.
5. Pilih region yang tersedia pada Sandbox dan sedekat mungkin dengan Supabase `ap-northeast-1`.
6. Pastikan tier yang dipilih adalah **Sandbox** atau resource gratis.

## 3. Buat Combined Service

1. Di dalam project, klik **Add service**.
2. Pilih **Combined service** atau opsi yang membangun dan menjalankan source code.
3. Nama service: `litera-api`.
4. Pilih repository `rivandiaja/Litera`.
5. Branch: `master`.
6. Build type: **Dockerfile**.
7. Dockerfile path:

```text
/backend/Dockerfile
```

8. Build context:

```text
/backend
```

9. Gunakan BuildKit default.
10. Jangan isi build arguments dengan secret.

Dockerfile sudah menjalankan migration Alembic, seed idempotent, lalu Uvicorn. Jangan menambahkan command override di Northflank.

## 4. Atur Compute dan Port

1. Pilih compute gratis paling kecil yang tersedia pada Sandbox.
2. Instances atau replicas: `1`.
3. Pastikan port hasil deteksi adalah:

```text
Port: 8000
Protocol: HTTP
Public: enabled
```

Jika port belum terdeteksi, tambahkan port HTTP `8000` secara manual pada **Ports & DNS**.

## 5. Isi Environment Variables

Buka bagian **Environment** atau **Runtime variables**, lalu tambahkan:

```text
APP_ENV=production
DATABASE_URL=<Session pooler URI dari Supabase>
JWT_SECRET_KEY=<nilai acak yang panjang>
FRONTEND_ORIGIN=http://127.0.0.1:5173
FRONTEND_ORIGINS=
STORAGE_BACKEND=s3
S3_ENDPOINT_URL=https://npkmdowuepzdhlxhltrl.storage.supabase.co/storage/v1/s3
S3_REGION=ap-northeast-1
S3_ACCESS_KEY_ID=<Supabase Access Key ID>
S3_SECRET_ACCESS_KEY=<Supabase Secret Access Key>
S3_BUCKET=litera-pdfs
S3_PREFIX=documents
MAX_PDF_SIZE_MB=5
DEMO_ADMIN_PASSWORD=<password admin unik>
DEMO_STUDENT_PASSWORD=<password mahasiswa demo unik>
```

Buat JWT secret di PowerShell:

```powershell
[Convert]::ToBase64String([Security.Cryptography.RandomNumberGenerator]::GetBytes(48))
```

Masukkan hasilnya langsung ke Northflank. Jangan menaruh hasilnya di repository atau chat.

Nilai `MAX_PDF_SIZE_MB=5` direkomendasikan untuk compute Sandbox yang kecil. Setelah deployment terbukti stabil, batas dapat dinaikkan secara bertahap.

## 6. Health Check dan Deploy

Docker image sudah memiliki health check. Bila Northflank meminta konfigurasi tambahan, gunakan:

```text
Protocol: HTTP
Port: 8000
Path: /api/v1/health
Initial delay: 45 seconds
Timeout: 5 seconds
```

Klik **Create service** atau **Deploy**. Build pertama memasang dependency Python dan dapat memerlukan beberapa menit.

Setelah status menjadi running, buka URL publik:

```text
https://URL-NORTHFLANK/api/v1/health
```

Response yang benar:

```json
{"status":"ok","service":"Litera API"}
```

## 7. Hubungkan Vercel

Di Vercel, isi Environment Variable frontend:

```text
VITE_API_BASE_URL=https://URL-NORTHFLANK/api/v1
```

Deploy ulang frontend. Setelah mendapatkan URL Vercel, kembali ke Northflank dan ubah:

```text
FRONTEND_ORIGINS=https://URL-VERCEL
```

Restart atau redeploy service setelah environment berubah.

## 8. Uji Alur Utama

1. Buka frontend Vercel.
2. Login admin dengan `admin@litera.ac.id` dan `DEMO_ADMIN_PASSWORD`.
3. Login mahasiswa dengan `arif@mahasiswa.ac.id` dan `DEMO_STUDENT_PASSWORD`.
4. Buat koleksi dan upload PDF berbasis teks berukuran kecil.
5. Pastikan status berubah menjadi `indexed`.
6. Jalankan pencarian dan buka PDF pada halaman relevan.

## 9. Troubleshooting

- Build gagal menemukan Dockerfile: pastikan path `/backend/Dockerfile` dan context `/backend`.
- Service tidak dapat diakses: pastikan port HTTP `8000` bersifat public.
- Database gagal tersambung: gunakan Session pooler URI dan encode karakter khusus pada password.
- Upload gagal: periksa endpoint, region, access key, secret, dan nama bucket Supabase.
- Container restart saat indexing: gunakan PDF lebih kecil dan pertahankan batas upload 5 MB.
- CORS error: masukkan URL Vercel persis tanpa slash terakhir ke `FRONTEND_ORIGINS`.
- Status tetap pending setelah restart: jalankan re-index dari aplikasi.

Northflank mendokumentasikan Dockerfile path/build context pada [Build with a Dockerfile](https://northflank.com/docs/v1/application/build/build-with-a-dockerfile), port pada [Configure ports](https://northflank.com/docs/v1/application/network/configure-ports), dan health check pada [Configure health checks](https://northflank.com/docs/v1/application/observe/configure-health-checks).
