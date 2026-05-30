# Litera

Litera adalah prototype frontend untuk literature search engine pengelolaan referensi penelitian mahasiswa. Repository ini berasal dari export ZIP desain Figma Make, sehingga desain visual, layout, typography, warna, dan komponen UI perlu dipertahankan semaksimal mungkin.

Status saat ini: frontend prototype dengan mock data. Fitur login, dashboard, upload, indexing, admin, dan search masih simulasi di browser dan belum terhubung ke backend.

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

## Rencana Tahap Berikutnya

Tahap berikutnya adalah membuat backend REST API menggunakan FastAPI, SQLite, dan SQLAlchemy, lalu mengimplementasikan upload PDF, ekstraksi teks, preprocessing Bahasa Indonesia, custom inverted index, dan ranking TF-IDF sesuai PRD.
