# Litera Demo Dataset

Folder ini disiapkan untuk dataset lokal saat demo dan evaluasi Information Retrieval. PDF literatur aktual tidak boleh di-commit ke Git.

## Struktur

```text
demo-data/
|-- README.md
|-- manifest.example.json
|-- relevance-judgments.example.json
|-- pdfs/
    |-- .gitkeep
```

## Cara Menyiapkan Dataset Lokal

1. Salin `manifest.example.json` menjadi `manifest.json`.
2. Salin `relevance-judgments.example.json` menjadi `relevance-judgments.json`.
3. Letakkan PDF berbasis teks di `demo-data/pdfs/`.
4. Sesuaikan daftar `path`, `title`, `field`, dan `projects` di `manifest.json`.
5. Sesuaikan daftar dokumen relevan manual di `relevance-judgments.json`.

PDF aktual di `demo-data/pdfs/`, `manifest.json`, dan `relevance-judgments.json` sudah diabaikan oleh `.gitignore`.

## Rekomendasi Dataset Demo

- 20 sampai 50 PDF berbasis teks.
- 4 sampai 6 bidang penelitian.
- 5 sampai 10 akun mahasiswa demo.
- Minimal 3 PDF per koleksi.
- Minimal 10 query evaluasi.

Contoh bidang:

- Jaringan Komputer
- Artificial Intelligence
- Internet of Things
- Sistem Informasi
- Data Mining
- Rekayasa Perangkat Lunak

Ground truth relevansi ditentukan manual berdasarkan penilaian isi dokumen. Gunakan `original_filename` PDF sebagai identifier stabil.

## Import Dataset

Dry-run aman, termasuk saat PDF contoh belum tersedia:

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
python -m app.cli.import_demo_dataset --manifest ../demo-data/manifest.example.json --dry-run
```

Import dataset lokal:

```powershell
python -m app.cli.import_demo_dataset --manifest ../demo-data/manifest.json
```

Re-copy dan re-index dokumen yang sudah ada:

```powershell
python -m app.cli.import_demo_dataset --manifest ../demo-data/manifest.json --reindex-existing
```

## Evaluasi IR

```powershell
python -m app.cli.evaluate_ir --judgments ../demo-data/relevance-judgments.json --k 5
```
