# Checklist Penyerahan Litera

Gunakan checklist ini sebelum repository dikumpulkan atau dipresentasikan.

## Repository

- [ ] `git status` bersih atau hanya berisi perubahan yang sengaja akan dikumpulkan.
- [ ] `.env` tidak masuk Git.
- [ ] Database lokal tidak masuk Git.
- [ ] PDF aktual tidak masuk Git.
- [ ] `backend/uploads/` aktual tidak masuk Git.
- [ ] `demo-data/pdfs/` aktual tidak masuk Git.
- [ ] Virtualenv tidak masuk Git.
- [ ] `node_modules/` tidak masuk Git.
- [ ] `dist/` tidak perlu dikumpulkan kecuali diminta.

## Build dan Test

- [ ] `pip install -r requirements.txt` berhasil di backend.
- [ ] `python -m alembic upgrade head` berhasil.
- [ ] `python -m app.services.seed` berhasil.
- [ ] `python -m pytest` lulus.
- [ ] `npm install` berhasil.
- [ ] `npm run lint` lulus.
- [ ] `npm run typecheck` lulus.
- [ ] `npm run test` lulus.
- [ ] `npm run build` lulus.
- [ ] `git diff --check` lulus.

## Dataset Demo

- [ ] `demo-data/manifest.example.json` tersedia.
- [ ] `demo-data/relevance-judgments.example.json` tersedia.
- [ ] `demo-data/pdfs/.gitkeep` tersedia.
- [ ] Dataset aktual disiapkan terpisah jika diminta dosen.
- [ ] `manifest.json` lokal sudah sesuai nama PDF.
- [ ] `relevance-judgments.json` lokal sudah berisi ground truth manual.
- [ ] `python -m app.cli.import_demo_dataset --manifest ../demo-data/manifest.json --dry-run` berhasil.
- [ ] Import dataset nyata berhasil.
- [ ] Minimal sebagian besar PDF berstatus `indexed`.

## Demo

- [ ] Backend berjalan di `http://127.0.0.1:8000`.
- [ ] Frontend berjalan di `http://127.0.0.1:5173`.
- [ ] Akun demo terdokumentasi.
- [ ] Login mahasiswa berhasil.
- [ ] Login admin berhasil.
- [ ] Upload PDF teks berhasil.
- [ ] Status indexing dapat ditunjukkan.
- [ ] Search global menghasilkan snippet dan halaman relevan.
- [ ] Search scoped bidang dan koleksi berjalan.
- [ ] PDF dapat dibuka dari hasil search.
- [ ] Admin dapat melihat users, projects, documents, dan indexing.
- [ ] Evaluasi Precision@5 dapat dijalankan.

## Dokumentasi

- [ ] `README.md` menjelaskan setup frontend, backend, dataset, evaluasi, dan status proyek.
- [ ] `backend/README.md` menjelaskan endpoint, indexing, search, CLI import, dan evaluator.
- [ ] `docs/IMPLEMENTATION_PLAN.md` mencatat progress sampai Tahap 8B.
- [ ] `docs/IR_METHOD.md` tersedia untuk penjelasan akademik.
- [ ] `docs/DEMO_GUIDE.md` tersedia untuk alur presentasi.
- [ ] Screenshot aplikasi siap jika diminta.
- [ ] Slide presentasi opsional siap jika diminta.

## Keterbatasan yang Perlu Disampaikan

- [ ] OCR PDF scan belum didukung.
- [ ] Semantic search tidak digunakan karena tugas mewajibkan inverted index dan TF-IDF eksplisit.
- [ ] Corpus MVP masih lokal dan kecil.
- [ ] SQLite cukup untuk demo lokal, belum untuk deployment multi-user besar.
