PRODUCT REQUIREMENTS DOCUMENT

LITERA

Literature Search Engine untuk Referensi Penelitian Mahasiswa

\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

1\.	Informasi Produk

Bagian	Keterangan

Nama produk	Litera

Tagline	Temukan Referensi, Kembangkan Penelitian

Jenis aplikasi	Responsive web application

Target pengguna awal	Mahasiswa dalam satu kelas atau satu program studi

Fokus utama	Pengelolaan dan pencarian literatur ilmiah berbentuk PDF

Metode information retrieval	Inverted Index dan TF-IDF

Format dokumen MVP	PDF berbasis teks

Bahasa antarmuka	Bahasa Indonesia

\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

2\.	Latar Belakang

&#x09;Mahasiswa yang sedang melakukan penelitian biasanya mengunduh berbagai jurnal, prosiding, artikel ilmiah, dan dokumen PDF sebagai referensi. File tersebut sering tersimpan secara terpisah pada perangkat masing-masing tanpa pengelompokan yang konsisten.

&#x09;Ketika mahasiswa membutuhkan referensi tertentu, pencarian dilakukan secara manual dengan membuka file PDF satu per satu. Selain memerlukan waktu, referensi yang dimiliki oleh mahasiswa lain juga sulit ditemukan dan dimanfaatkan bersama.

Litera dirancang sebagai repositori literatur ilmiah kolaboratif. Setiap mahasiswa dapat membuat koleksi sesuai judul penelitiannya, memilih bidang penelitian, dan mengunggah PDF referensi. Sistem mengekstrak teks setiap dokumen secara otomatis, membentuk inverted index, lalu menyediakan pencarian menyeluruh maupun pencarian terfilter.

\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

3\.	Tujuan Produk

Litera bertujuan untuk:

1\)	Mempermudah mahasiswa menyimpan PDF referensi secara terstruktur.

2\)	Memungkinkan mahasiswa berbagi referensi ilmiah dengan teman satu kelas atau satu program studi.

3\)	Mempercepat pencarian literatur berdasarkan isi dokumen, bukan hanya nama file.

4\)	Mendukung pencarian berdasarkan bidang penelitian, judul penelitian, dan koleksi mahasiswa.

5\)	Menerapkan konsep information retrieval melalui inverted index dan ranking TF-IDF.

6\)	Menampilkan halaman PDF yang relevan agar pengguna tidak harus membaca seluruh dokumen.

\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

4\.	Permasalahan yang Diselesaikan

Permasalahan	Solusi Litera

PDF literatur tersebar di perangkat masing-masing	Repositori literatur terpusat

Nama file PDF sering tidak menggambarkan isi	Pencarian berdasarkan isi dokumen

Sulit mencari kalimat atau istilah tertentu dari banyak PDF	Automatic indexing dan search engine

Referensi teman satu kelas tidak mudah ditemukan	Koleksi literatur dapat dibagikan

Hasil pencarian terlalu umum	Filter bidang dan koleksi penelitian

Pengguna perlu membuka PDF satu per satu	Cuplikan teks dan nomor halaman relevan

\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

5\.	Judul Tugas Mata Kuliah

IMPLEMENTASI LITERATURE SEARCH ENGINE BERBASIS INVERTED INDEX DAN TF-IDF UNTUK PENGELOLAAN REFERENSI PENELITIAN MAHASISWA

\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

6\.	Target Pengguna

6.1.	Mahasiswa

&#x09;Mahasiswa dapat membuat koleksi penelitian, mengunggah PDF literatur, mengelola dokumen miliknya, serta mencari referensi milik sendiri maupun milik mahasiswa lain.

6.2.	Admin

&#x09;Admin dapat mengelola kategori bidang penelitian, pengguna, seluruh koleksi penelitian, PDF yang diunggah, serta status indexing.

\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

7\.	Struktur Informasi Produk

Litera menggunakan struktur tiga tingkat:

Bidang Penelitian

→ Koleksi atau Judul Penelitian Mahasiswa

→ PDF Literatur Ilmiah

Contoh:

Jaringan Komputer

└── Perancangan Network Monitoring System Terintegrasi

&#x20;   untuk Monitoring OLT dan PPPoE

&#x20;   ├── monitoring-olt-snmp.pdf

&#x20;   ├── mikrotik-rest-api.pdf

&#x20;   ├── analisis-redaman-ftth.pdf

&#x20;   └── troubleshooting-jaringan-fiber.pdf

Contoh bidang penelitian:

•	Jaringan Komputer

•	Sistem Informasi

•	Internet of Things

•	Artificial Intelligence

•	Data Mining

•	Rekayasa Perangkat Lunak

•	Keamanan Siber

•	UI/UX Design

\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

8\.	Role dan Hak Akses

8.1.	Mahasiswa

Fitur	Hak akses

Registrasi dan login	Ya

Melihat halaman utama	Ya

Mencari seluruh literatur	Ya

Filter berdasarkan bidang penelitian	Ya

Melihat koleksi mahasiswa lain	Ya

Membuka PDF	Ya

Membuat koleksi penelitian	Ya

Mengubah koleksi milik sendiri	Ya

Menghapus koleksi milik sendiri	Ya

Upload banyak PDF ke koleksi milik sendiri	Ya

Mengubah judul metadata PDF milik sendiri	Ya

Menghapus PDF milik sendiri	Ya

Melakukan indexing ulang PDF milik sendiri	Ya

Mengubah atau menghapus bidang penelitian	Tidak

8.2.	Admin

Fitur	Hak akses

Seluruh fitur mahasiswa	Ya

CRUD bidang penelitian	Ya

Melihat seluruh pengguna	Ya

Melihat seluruh koleksi	Ya

Menghapus PDF tidak sesuai	Ya

Melihat status indexing	Ya

Menjalankan indexing ulang	Ya

Melihat dokumen gagal diindeks	Ya

\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

9\.	Fitur Utama

9.1.	Autentikasi

Fitur:

1\)	Registrasi mahasiswa.

2\)	Login.

3\)	Logout.

4\)	Profil pengguna.

5\)	Informasi nama, NIM, program studi, kelas, dan email.

9.2.	CRUD Bidang Penelitian

Dikelola oleh admin.

Data bidang penelitian:

Field	Keterangan

Nama bidang	Contoh: Jaringan Komputer

Deskripsi	Penjelasan singkat bidang penelitian

Ikon	Ikon visual kategori

Slug	URL yang aman

Status	Aktif atau nonaktif

Fitur:

•	Tambah bidang penelitian.

•	Lihat daftar bidang.

•	Edit bidang.

•	Nonaktifkan atau hapus bidang.

•	Lihat jumlah koleksi dan PDF dalam bidang.

9.3.	CRUD Koleksi Penelitian

Setiap mahasiswa dapat membuat satu atau lebih koleksi penelitian.

Data koleksi:

Field	Keterangan

Pemilik	Mahasiswa pembuat koleksi

Bidang penelitian	Kategori utama

Judul penelitian	Judul penelitian mahasiswa

Deskripsi	Gambaran singkat penelitian

Kata kunci	Contoh: SNMP, OLT, ONU, PPPoE, MikroTik

Status visibilitas	Publik untuk anggota atau privat

Tanggal dibuat	Waktu pembuatan koleksi

Fitur:

1\)	Tambah koleksi penelitian.

2\)	Edit koleksi.

3\)	Hapus koleksi.

4\)	Lihat detail koleksi.

5\)	Cari literatur hanya dalam satu koleksi.

6\)	Lihat jumlah PDF dalam koleksi.

9.4.	CRUD Dokumen PDF

Dokumen diunggah ke dalam koleksi penelitian.

Data dokumen:

Field	Keterangan

Judul dokumen	Diambil otomatis dari PDF jika memungkinkan

Nama file asli	Nama file ketika diunggah

File tersimpan	Nama file aman pada server

Jumlah halaman	Dihitung otomatis

Pemilik	Mahasiswa pengunggah

Koleksi penelitian	Koleksi asal

Status indexing	Pending, processing, indexed, atau failed

Pesan status	Informasi jika proses gagal

Waktu upload	Tanggal dan waktu upload

Waktu indexing	Tanggal indexing terakhir

Fitur:

1\)	Upload satu atau banyak file PDF sekaligus.

2\)	Melihat progres upload.

3\)	Membuka PDF.

4\)	Mengubah judul dokumen.

5\)	Memindahkan PDF ke koleksi lain milik pengguna.

6\)	Menghapus PDF.

7\)	Menjalankan indexing ulang.

8\)	Menampilkan alasan kegagalan indexing.

9.5.	Automatic PDF Indexing

Setelah dokumen diunggah, sistem otomatis menjalankan proses berikut:

Upload PDF

→ validasi file

→ ekstraksi teks per halaman

→ preprocessing

→ tokenizing

→ stopword removal

→ stemming

→ pembentukan inverted index

→ penyimpanan frekuensi istilah dan nomor halaman

→ status dokumen berubah menjadi indexed

Data inverted index minimal menyimpan:

term

→ document\_id

→ page\_number

→ term\_frequency

Contoh:

{

&#x20; "snmp": {

&#x20;   "documents": {

&#x20;     "17": {

&#x20;       "pages": \[2, 4, 7],

&#x20;       "frequency": 18

&#x20;     }

&#x20;   }

&#x20; }

}

9.6.	Pencarian Literatur Menyeluruh

Pengguna memasukkan kata kunci tanpa memilih filter.

Contoh:

monitoring redaman onu menggunakan snmp

Sistem mencari seluruh PDF yang dapat diakses pengguna.

Hasil minimal menampilkan:

1\)	Judul PDF.

2\)	Nama pemilik koleksi.

3\)	Judul penelitian mahasiswa.

4\)	Bidang penelitian.

5\)	Cuplikan teks relevan.

6\)	Nomor halaman relevan.

7\)	Skor relevansi.

8\)	Tombol buka PDF.

9\)	Tanggal upload.

9.7.	Pencarian Berdasarkan Bidang Penelitian

Pengguna dapat memilih bidang tertentu.

Contoh:

Bidang	: Jaringan Komputer

Query	: monitoring perangkat olt

Sistem hanya mencari isi PDF dari bidang Jaringan Komputer.

9.8.	Pencarian dalam Koleksi Penelitian

Pengguna membuka salah satu koleksi penelitian, lalu mencari istilah tertentu.

Contoh:

Koleksi:

Perancangan Network Monitoring System Terintegrasi

untuk Monitoring OLT dan PPPoE



Query:

mikrotik api

Sistem hanya mencari PDF yang terdapat dalam koleksi tersebut.

9.9.	Pencarian Bidang dan Koleksi

Selain mencari isi PDF, pengguna dapat mencari kategori serta koleksi penelitian.

Contoh query:

network monitoring

Hasil dapat menampilkan:

Bidang terkait:

\- Jaringan Komputer



Koleksi terkait:

\- Perancangan Network Monitoring System Terintegrasi

&#x20; untuk Monitoring OLT dan PPPoE

9.10.	Filter dan Sorting

Filter pencarian:

•	Semua bidang atau bidang tertentu.

•	Semua koleksi atau koleksi tertentu.

•	Nama pemilik koleksi.

•	Rentang tahun upload.

•	Status dokumen.

•	Kata kunci penelitian.

Sorting:

•	Paling relevan.

•	Terbaru diunggah.

•	Judul A–Z.

•	Jumlah halaman.

\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

10\.	Ranking TF-IDF

Hasil pencarian diurutkan menggunakan TF-IDF.

Tujuan ranking:

•	Menaikkan dokumen yang paling relevan ke urutan teratas.

•	Mengurangi dominasi kata yang terlalu sering muncul pada banyak dokumen.

•	Memprioritaskan dokumen yang membahas istilah query secara lebih spesifik.

Contoh hasil:

Peringkat	Dokumen	Skor relevansi

1	Monitoring Optical Network Unit Berbasis SNMP	0.912

2	Analisis Redaman pada Jaringan FTTH	0.744

3	Network Monitoring System untuk Infrastruktur ISP	0.613

\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

11\.	Sitemap Aplikasi

/

├── Login

├── Register

├── Beranda

│   ├── Search bar utama

│   ├── Bidang penelitian populer

│   ├── Koleksi terbaru

│   └── Statistik repositori

│

├── Cari Literatur

│   ├── Hasil pencarian

│   ├── Filter bidang

│   ├── Filter koleksi

│   ├── Filter pemilik

│   └── Sorting

│

├── Bidang Penelitian

│   ├── Daftar bidang

│   └── Detail bidang

│       ├── Daftar koleksi

│       └── PDF terbaru

│

├── Koleksi Penelitian

│   ├── Detail koleksi

│   ├── Cari dalam koleksi

│   └── Daftar PDF

│

├── Dashboard Mahasiswa

│   ├── Ringkasan

│   ├── Koleksi Saya

│   ├── Tambah Koleksi

│   ├── Edit Koleksi

│   ├── Upload PDF

│   └── Status Indexing

│

├── Profil

│

└── Dashboard Admin

&#x20;   ├── Ringkasan

&#x20;   ├── Kelola Bidang Penelitian

&#x20;   ├── Kelola Pengguna

&#x20;   ├── Kelola Koleksi

&#x20;   ├── Kelola PDF

&#x20;   └── Monitoring Indexing

\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

12\.	Halaman Utama dan Isi Antarmuka

12.1.	Login

Komponen:

•	Logo Litera.

•	Tagline.

•	Input email.

•	Input password.

•	Tombol masuk.

•	Link registrasi.

•	Ilustrasi abstrak bertema buku, riset, atau pencarian.

12.2.	Beranda

Komponen:

•	Navbar.

•	Hero headline.

•	Search bar besar.

•	Dropdown bidang penelitian.

•	Tombol cari.

•	Statistik singkat.

•	Bento grid bidang penelitian.

•	Koleksi terbaru.

•	Dokumen populer.

•	Call to action upload literatur.

Contoh headline:

Temukan literatur yang relevan

untuk penelitianmu.

Subheadline:

Cari referensi ilmiah dari koleksi mahasiswa dalam satu tempat.

Lebih cepat, terstruktur, dan mudah ditemukan kembali.

12.3.	Halaman Hasil Pencarian

Komponen:

•	Search bar sticky.

•	Filter sidebar desktop.

•	Bottom-sheet filter pada mobile.

•	Filter chips aktif.

•	Informasi jumlah hasil.

•	Sorting dropdown.

•	Kartu hasil pencarian.

•	Pagination.

Isi kartu hasil:

Monitoring Optical Network Unit Berbasis SNMP



Kategori: Jaringan Komputer

Koleksi: Perancangan NMS Terintegrasi untuk Monitoring OLT dan PPPoE

Pemilik: Muhammad Arif Rivandi



"...parameter redaman optik ONU dapat diperoleh melalui perangkat OLT..."



Halaman relevan: 4, 7, 10

Skor relevansi: 0.912



\[Buka PDF] \[Lihat Koleksi]

12.4.	Dashboard Mahasiswa

Komponen:

•	Sapaan pengguna.

•	Tombol tambah koleksi.

•	Tombol upload PDF.

•	Statistik koleksi.

•	Statistik PDF.

•	Status indexing.

•	Aktivitas terbaru.

•	Daftar koleksi dalam bentuk card.

•	Daftar PDF terbaru.

12.5.	Detail Koleksi Penelitian

Komponen:

•	Judul penelitian.

•	Nama mahasiswa.

•	Bidang penelitian.

•	Deskripsi.

•	Keyword chips.

•	Jumlah PDF.

•	Search bar khusus koleksi.

•	Tombol upload PDF jika pengguna adalah pemilik.

•	Grid atau list PDF.

•	Status indexing setiap PDF.

12.6.	Upload PDF

Gunakan modal atau drawer.

Komponen:

•	Drag and drop zone.

•	Tombol pilih file.

•	Dukungan multiple upload.

•	Daftar file dipilih.

•	Ukuran file.

•	Progress bar.

•	Status upload.

•	Status indexing setelah upload.

•	Pesan error jika PDF tidak memiliki teks.

12.7.	Dashboard Admin

Komponen:

•	Statistik total pengguna.

•	Statistik bidang penelitian.

•	Statistik koleksi.

•	Statistik PDF.

•	Grafik status indexing.

•	CRUD bidang penelitian.

•	Tabel PDF gagal diproses.

•	Tombol re-index.

•	Moderasi dokumen.

\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

13\.	User Flow Utama

Flow mahasiswa mengunggah literatur

Login

→ buka Dashboard

→ tambah koleksi penelitian

→ pilih bidang penelitian

→ isi judul dan keyword

→ simpan koleksi

→ upload beberapa PDF

→ sistem mengekstrak teks

→ sistem melakukan indexing

→ dokumen siap dicari

Flow pencarian menyeluruh

Buka Beranda

→ tulis query

→ pilih Semua Bidang

→ klik Cari

→ sistem menampilkan hasil terurut berdasarkan TF-IDF

→ pengguna melihat cuplikan dan halaman relevan

→ pengguna membuka PDF

Flow pencarian terfilter

Buka Beranda

→ pilih bidang penelitian

→ tulis query

→ klik Cari

→ sistem membatasi pencarian pada bidang terpilih

→ tampilkan hasil relevan

Flow pencarian dalam koleksi

Buka detail koleksi mahasiswa

→ tulis query pada search bar koleksi

→ sistem mencari hanya dari PDF dalam koleksi tersebut

→ tampilkan PDF dan halaman relevan

\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

14\.	Entitas Database Utama

users

•	id

•	name

•	student\_number

•	email

•	password\_hash

•	study\_program

•	class\_name

•	role

•	created\_at

•	updated\_at

research\_fields

•	id

•	name

•	slug

•	description

•	icon

•	is\_active

•	created\_at

•	updated\_at

research\_projects

•	id

•	user\_id

•	research\_field\_id

•	title

•	description

•	keywords

•	visibility

•	created\_at

•	updated\_at

documents

•	id

•	research\_project\_id

•	title

•	original\_filename

•	stored\_filename

•	file\_path

•	total\_pages

•	file\_size

•	index\_status

•	index\_message

•	indexed\_at

•	created\_at

•	updated\_at

document\_pages

•	id

•	document\_id

•	page\_number

•	raw\_text

•	clean\_text

•	created\_at

search\_histories

•	id

•	user\_id

•	query

•	selected\_research\_field\_id

•	selected\_research\_project\_id

•	result\_count

•	created\_at

\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

15\.	Business Rules

1\.	Setiap PDF wajib terhubung ke satu koleksi penelitian.

2\.	Setiap koleksi penelitian wajib memiliki satu bidang penelitian.

3\.	Mahasiswa hanya dapat mengubah dan menghapus koleksi miliknya.

4\.	Mahasiswa hanya dapat mengubah dan menghapus PDF miliknya.

5\.	Admin dapat melihat dan memoderasi seluruh data.

6\.	PDF harus memiliki format .pdf.

7\.	Sistem MVP hanya memproses PDF berbasis teks.

8\.	PDF hasil scan tanpa lapisan teks diberi status failed.

9\.	Setelah upload berhasil, indexing berjalan secara otomatis.

10\.	Penghapusan PDF harus ikut menghapus teks halaman dan index terkait.

11\.	Pemindahan PDF ke koleksi lain harus memperbarui metadata filter pencarian.

12\.	Penghapusan bidang penelitian ditolak jika masih digunakan oleh koleksi aktif.

13\.	Nama file asli tetap disimpan sebagai metadata.

14\.	Judul dokumen dapat diambil otomatis dari PDF dan dapat dikoreksi manual.

15\.	Pencarian menyeluruh menggunakan seluruh dokumen yang berhasil diindeks.

\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

16\.	Scope MVP

Fitur wajib untuk tugas mata kuliah:

Fitur	MVP

Registrasi dan login mahasiswa	Ya

Role admin dan mahasiswa	Ya

CRUD bidang penelitian	Ya

CRUD koleksi penelitian	Ya

Multiple upload PDF	Ya

Ekstraksi teks PDF	Ya

Preprocessing Bahasa Indonesia	Ya

Automatic indexing	Ya

Inverted index	Ya

Ranking TF-IDF	Ya

Pencarian menyeluruh	Ya

Filter berdasarkan bidang	Ya

Pencarian dalam koleksi	Ya

Cuplikan teks hasil	Ya

Nomor halaman relevan	Ya

Status indexing	Ya

Responsive desktop dan mobile	Ya

\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

17\.	Fitur Pengembangan Lanjutan

Fitur yang tidak wajib untuk MVP:

•	OCR untuk PDF hasil scan.

•	Rekomendasi jurnal serupa.

•	Bookmark atau simpan literatur favorit.

•	Ekspor sitasi.

•	Format sitasi IEEE, APA, dan Harvard.

•	DOI metadata lookup.

•	Tag many-to-many.

•	Komentar pada dokumen.

•	Kolaborasi antarprogram studi.

•	Preview PDF di dalam aplikasi.

•	Semantic search berbasis embedding.

•	Notifikasi jika ada referensi baru pada bidang tertentu.

•	Analitik kata kunci penelitian populer.

\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

18\.	Non-Functional Requirements

Aspek	Ketentuan

Responsivitas	Nyaman digunakan pada desktop, tablet, dan mobile

Keamanan	Password disimpan dalam bentuk hash

Validasi	Hanya menerima file PDF

Performa	Hasil pencarian ditampilkan tanpa membaca ulang seluruh PDF

Usability	Proses upload dan indexing memiliki status yang mudah dipahami

Maintainability	Modul indexing dipisahkan dari antarmuka

Accessibility	Kontras teks baik, ukuran tombol cukup besar, dan form memiliki label

Error handling	Pesan kesalahan harus jelas dan memberikan solusi

\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

19\.	Acceptance Criteria

Aplikasi dianggap berhasil jika:

1\.	Admin dapat menambah, mengubah, dan menghapus bidang penelitian.

2\.	Mahasiswa dapat registrasi dan login.

3\.	Mahasiswa dapat membuat koleksi berdasarkan judul penelitian.

4\.	Mahasiswa dapat mengunggah beberapa PDF ke koleksi.

5\.	Sistem dapat mengekstrak teks PDF secara otomatis.

6\.	Sistem membentuk inverted index berdasarkan isi PDF.

7\.	Sistem dapat mencari isi dokumen dari seluruh kategori.

8\.	Sistem dapat membatasi hasil pencarian berdasarkan bidang.

9\.	Sistem dapat mencari dokumen dalam satu koleksi penelitian.

10\.	Hasil pencarian diurutkan berdasarkan TF-IDF.

11\.	Hasil pencarian menampilkan cuplikan isi dan halaman relevan.

12\.	Sistem menampilkan status jika PDF gagal diproses.

13\.	Pengguna dapat membuka file PDF dari hasil pencarian.

14\.	Tampilan dapat digunakan dengan nyaman pada desktop dan mobile.

\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

20\.	Dataset Demo

Target awal pengujian:

Bagian	Target

Jumlah akun mahasiswa	5–10 akun

Bidang penelitian	4–6 bidang

Koleksi penelitian	Minimal 1 per mahasiswa

PDF per koleksi	Minimal 3–5 PDF

Total PDF	20–50 PDF

Query uji	Minimal 10 query

Contoh dataset milik satu mahasiswa:

Bidang:

Jaringan Komputer



Judul penelitian:

Perancangan Network Monitoring System Terintegrasi

untuk Monitoring OLT dan PPPoE



Keyword:

SNMP, OLT, ONU, MikroTik, PPPoE, FTTH, redaman optik



PDF:

\- jurnal monitoring OLT

\- jurnal MikroTik API

\- jurnal analisis redaman FTTH

\- jurnal dashboard NMS

\- jurnal troubleshooting jaringan fiber





