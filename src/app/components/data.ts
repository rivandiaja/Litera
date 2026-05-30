export interface Field {
  id: string;
  name: string;
  iconName: string;
  description: string;
  collectionCount: number;
  pdfCount: number;
  contributors: number;
  color: string;
  bgColor: string;
  keywords: string[];
}

export interface Owner {
  id: string;
  name: string;
  nim: string;
  prodi: string;
  kelas: string;
  initials: string;
  avatarColor: string;
}

export interface Collection {
  id: string;
  title: string;
  fieldId: string;
  fieldName: string;
  description: string;
  keywords: string[];
  owner: Owner;
  pdfCount: number;
  isPublic: boolean;
  createdAt: string;
  lastUpdated: string;
}

export interface PDF {
  id: string;
  title: string;
  collectionId: string;
  pages: number;
  uploadedAt: string;
  indexingStatus: "indexed" | "pending" | "processing" | "failed";
  size: string;
  excerpt?: string;
  failReason?: string;
}

export const FIELDS: Field[] = [
  {
    id: "jaringan-komputer",
    name: "Jaringan Komputer",
    iconName: "Network",
    description: "Penelitian tentang infrastruktur jaringan, protokol komunikasi, monitoring, dan keamanan jaringan komputer.",
    collectionCount: 34,
    pdfCount: 218,
    contributors: 18,
    color: "text-indigo-700",
    bgColor: "bg-indigo-50",
    keywords: ["SNMP", "OLT", "PPPoE", "BGP", "MPLS", "VPN", "Firewall", "Bandwidth", "QoS", "Monitoring"],
  },
  {
    id: "artificial-intelligence",
    name: "Artificial Intelligence",
    iconName: "Brain",
    description: "Eksplorasi algoritma machine learning, deep learning, computer vision, dan NLP untuk berbagai aplikasi.",
    collectionCount: 42,
    pdfCount: 291,
    contributors: 23,
    color: "text-violet-700",
    bgColor: "bg-violet-50",
    keywords: ["Deep Learning", "CNN", "LSTM", "Transformer", "NLP", "Computer Vision", "Reinforcement Learning"],
  },
  {
    id: "iot",
    name: "Internet of Things",
    iconName: "Cpu",
    description: "Penelitian perangkat cerdas, sensor, protokol IoT, dan integrasi sistem embedded dengan cloud.",
    collectionCount: 28,
    pdfCount: 174,
    contributors: 15,
    color: "text-emerald-700",
    bgColor: "bg-emerald-50",
    keywords: ["Arduino", "Raspberry Pi", "MQTT", "ESP32", "LoRa", "Zigbee", "Smart Home", "Sensor"],
  },
  {
    id: "sistem-informasi",
    name: "Sistem Informasi",
    iconName: "Database",
    description: "Pengembangan sistem informasi manajemen, ERP, analisis kebutuhan, dan implementasi solusi bisnis.",
    collectionCount: 38,
    pdfCount: 243,
    contributors: 21,
    color: "text-sky-700",
    bgColor: "bg-sky-50",
    keywords: ["ERP", "SDLC", "UML", "ERD", "Business Intelligence", "MIS", "Dashboard", "Reporting"],
  },
  {
    id: "data-mining",
    name: "Data Mining",
    iconName: "BarChart2",
    description: "Teknik penggalian pengetahuan dari data besar, clustering, klasifikasi, dan pattern recognition.",
    collectionCount: 25,
    pdfCount: 158,
    contributors: 14,
    color: "text-orange-700",
    bgColor: "bg-orange-50",
    keywords: ["K-Means", "Decision Tree", "Random Forest", "Apriori", "Naive Bayes", "SVM", "Clustering"],
  },
  {
    id: "rpl",
    name: "Rekayasa Perangkat Lunak",
    iconName: "Code2",
    description: "Metodologi pengembangan software, design pattern, testing, CI/CD, dan arsitektur perangkat lunak modern.",
    collectionCount: 31,
    pdfCount: 196,
    contributors: 17,
    color: "text-rose-700",
    bgColor: "bg-rose-50",
    keywords: ["Agile", "Scrum", "Design Pattern", "Microservices", "REST API", "TDD", "DevOps", "UI/UX"],
  },
];

export const OWNERS: Owner[] = [
  { id: "u1", name: "Arif Budiman", nim: "2021001234", prodi: "Teknik Informatika", kelas: "TI-4A", initials: "AB", avatarColor: "bg-indigo-500" },
  { id: "u2", name: "Siti Rahayu", nim: "2021002345", prodi: "Teknik Informatika", kelas: "TI-4B", initials: "SR", avatarColor: "bg-emerald-500" },
  { id: "u3", name: "Dimas Pratama", nim: "2021003456", prodi: "Sistem Informasi", kelas: "SI-4A", initials: "DP", avatarColor: "bg-violet-500" },
  { id: "u4", name: "Nadia Santoso", nim: "2021004567", prodi: "Teknik Informatika", kelas: "TI-4C", initials: "NS", avatarColor: "bg-orange-500" },
  { id: "u5", name: "Rizky Firmansyah", nim: "2021005678", prodi: "Sistem Informasi", kelas: "SI-4B", initials: "RF", avatarColor: "bg-sky-500" },
];

export const COLLECTIONS: Collection[] = [
  {
    id: "c1",
    title: "Perancangan Network Monitoring System Terintegrasi untuk Monitoring OLT dan PPPoE",
    fieldId: "jaringan-komputer",
    fieldName: "Jaringan Komputer",
    description: "Koleksi literatur untuk penelitian tentang perancangan sistem monitoring jaringan yang mengintegrasikan monitoring OLT GPON dengan manajemen koneksi PPPoE secara real-time.",
    keywords: ["Network Monitoring", "OLT", "PPPoE", "GPON", "SNMP", "NMS"],
    owner: OWNERS[0],
    pdfCount: 8,
    isPublic: true,
    createdAt: "2024-09-12",
    lastUpdated: "2024-11-28",
  },
  {
    id: "c2",
    title: "Implementasi Deep Learning untuk Deteksi Objek Real-Time pada Sistem Keamanan",
    fieldId: "artificial-intelligence",
    fieldName: "Artificial Intelligence",
    description: "Studi literatur mendalam mengenai penggunaan arsitektur YOLO dan arsitektur deep learning modern untuk deteksi objek secara real-time dalam konteks sistem keamanan.",
    keywords: ["YOLO", "Object Detection", "CNN", "Real-time", "CCTV"],
    owner: OWNERS[1],
    pdfCount: 11,
    isPublic: true,
    createdAt: "2024-08-20",
    lastUpdated: "2024-11-15",
  },
  {
    id: "c3",
    title: "Smart Home Berbasis IoT dengan Kontrol Suara dan Automasi Energi",
    fieldId: "iot",
    fieldName: "Internet of Things",
    description: "Koleksi referensi untuk pengembangan sistem smart home menggunakan ESP32, MQTT broker, dan integrasi dengan asisten suara untuk automasi perangkat rumah.",
    keywords: ["ESP32", "MQTT", "Smart Home", "Voice Control", "Energy Management"],
    owner: OWNERS[2],
    pdfCount: 7,
    isPublic: true,
    createdAt: "2024-10-05",
    lastUpdated: "2024-11-20",
  },
  {
    id: "c4",
    title: "Sistem Informasi Manajemen Akademik Berbasis Web dengan Analitik Data",
    fieldId: "sistem-informasi",
    fieldName: "Sistem Informasi",
    description: "Referensi pengembangan SIMA modern dengan fitur analitik dan business intelligence untuk mendukung pengambilan keputusan di perguruan tinggi.",
    keywords: ["SIMA", "Business Intelligence", "Dashboard", "Academic Analytics"],
    owner: OWNERS[3],
    pdfCount: 9,
    isPublic: false,
    createdAt: "2024-07-18",
    lastUpdated: "2024-10-30",
  },
  {
    id: "c5",
    title: "Analisis Sentimen Media Sosial Menggunakan Metode Ensemble Learning",
    fieldId: "data-mining",
    fieldName: "Data Mining",
    description: "Literatur tentang teknik analisis sentimen dari data Twitter dan Instagram menggunakan kombinasi metode machine learning dan lexicon-based approach.",
    keywords: ["Sentiment Analysis", "Twitter", "Ensemble Learning", "NLP", "Social Media"],
    owner: OWNERS[4],
    pdfCount: 10,
    isPublic: true,
    createdAt: "2024-09-01",
    lastUpdated: "2024-11-10",
  },
  {
    id: "c6",
    title: "Pengembangan Aplikasi Mobile E-Commerce dengan Metodologi Agile Scrum",
    fieldId: "rpl",
    fieldName: "Rekayasa Perangkat Lunak",
    description: "Referensi pengembangan aplikasi mobile e-commerce menggunakan Flutter dengan pendekatan Agile Scrum, mencakup sprint planning, testing, dan CI/CD pipeline.",
    keywords: ["Flutter", "Agile", "Scrum", "E-Commerce", "CI/CD", "Mobile"],
    owner: OWNERS[0],
    pdfCount: 6,
    isPublic: true,
    createdAt: "2024-10-15",
    lastUpdated: "2024-11-25",
  },
];

export const PDFS: PDF[] = [
  {
    id: "p1",
    title: "Monitoring Optical Network Unit Berbasis SNMP",
    collectionId: "c1",
    pages: 12,
    uploadedAt: "2024-11-10",
    indexingStatus: "indexed",
    size: "1.4 MB",
    excerpt: "...sistem monitoring ONU berbasis SNMP yang memungkinkan pemantauan <mark>redaman sinyal optik</mark> secara real-time. Implementasi menggunakan protokol SNMPv2c dengan OID khusus untuk parameter <mark>ONU</mark>...",
  },
  {
    id: "p2",
    title: "Analisis Performa GPON pada Jaringan FTTH di Lingkungan Urban",
    collectionId: "c1",
    pages: 18,
    uploadedAt: "2024-11-12",
    indexingStatus: "indexed",
    size: "2.1 MB",
    excerpt: "...pengukuran redaman optik pada jaringan GPON menunjukkan nilai rata-rata 18.4 dB dengan penyebab utama sambungan konektor dan splitter...",
  },
  {
    id: "p3",
    title: "Perancangan Sistem Manajemen Bandwidth PPPoE dengan Mikrotik",
    collectionId: "c1",
    pages: 15,
    uploadedAt: "2024-11-15",
    indexingStatus: "indexed",
    size: "1.8 MB",
    excerpt: "...implementasi queue tree pada RouterOS Mikrotik untuk manajemen bandwidth PPPoE, menggunakan PCQ (Per Connection Queue) untuk distribusi adil...",
  },
  {
    id: "p4",
    title: "Network Topology Discovery Otomatis Menggunakan CDP dan LLDP",
    collectionId: "c1",
    pages: 10,
    uploadedAt: "2024-11-18",
    indexingStatus: "processing",
    size: "0.9 MB",
  },
  {
    id: "p5",
    title: "Implementasi Network Function Virtualization pada Data Center",
    collectionId: "c1",
    pages: 22,
    uploadedAt: "2024-11-20",
    indexingStatus: "pending",
    size: "3.2 MB",
  },
  {
    id: "p6",
    title: "Konfigurasi dan Optimasi BGP Route Reflector untuk Skalabilitas ISP",
    collectionId: "c1",
    pages: 8,
    uploadedAt: "2024-11-22",
    indexingStatus: "failed",
    size: "0.7 MB",
    failReason: "PDF tidak memiliki teks yang dapat diekstrak. Dokumen kemungkinan berisi gambar scan.",
  },
  {
    id: "p7",
    title: "YOLOv8 Real-Time Object Detection: Architecture and Performance Benchmarks",
    collectionId: "c2",
    pages: 14,
    uploadedAt: "2024-10-28",
    indexingStatus: "indexed",
    size: "2.3 MB",
    excerpt: "...YOLOv8 architecture introduces significant improvements over previous versions, achieving 53.9% mAP on COCO dataset with inference speed of 0.46ms...",
  },
  {
    id: "p8",
    title: "Transfer Learning dengan ResNet untuk Klasifikasi Gambar Keamanan",
    collectionId: "c2",
    pages: 16,
    uploadedAt: "2024-11-01",
    indexingStatus: "indexed",
    size: "1.9 MB",
  },
  {
    id: "p9",
    title: "Implementasi MQTT Broker Mosquitto untuk Komunikasi IoT",
    collectionId: "c3",
    pages: 11,
    uploadedAt: "2024-10-15",
    indexingStatus: "indexed",
    size: "1.1 MB",
  },
  {
    id: "p10",
    title: "ESP32 Power Management untuk Perangkat IoT Bertenaga Baterai",
    collectionId: "c3",
    pages: 9,
    uploadedAt: "2024-10-20",
    indexingStatus: "indexed",
    size: "0.8 MB",
  },
];

export const SEARCH_RESULTS = [
  {
    pdfId: "p1",
    title: "Monitoring Optical Network Unit Berbasis SNMP",
    collectionId: "c1",
    collectionTitle: "Perancangan Network Monitoring System Terintegrasi",
    fieldName: "Jaringan Komputer",
    owner: OWNERS[0],
    pages: 12,
    uploadedAt: "2024-11-10",
    relevance: 91,
    matchPages: [4, 7, 10],
    excerpt: "...sistem monitoring <mark>ONU</mark> berbasis <mark>SNMP</mark> yang memungkinkan pemantauan <mark>redaman sinyal optik</mark> secara real-time menggunakan OID khusus untuk parameter jaringan optik...",
  },
  {
    pdfId: "p2",
    title: "Analisis Performa GPON pada Jaringan FTTH di Lingkungan Urban",
    collectionId: "c1",
    collectionTitle: "Perancangan Network Monitoring System Terintegrasi",
    fieldName: "Jaringan Komputer",
    owner: OWNERS[0],
    pages: 18,
    uploadedAt: "2024-11-12",
    relevance: 84,
    matchPages: [3, 8, 14],
    excerpt: "...pengukuran <mark>redaman</mark> optik pada jaringan GPON menunjukkan nilai rata-rata 18.4 dB. Monitoring dilakukan menggunakan agen <mark>SNMP</mark> pada setiap <mark>ONU</mark> yang terhubung...",
  },
  {
    pdfId: "p3",
    title: "Perancangan Sistem Manajemen Bandwidth PPPoE dengan Mikrotik",
    collectionId: "c1",
    collectionTitle: "Perancangan Network Monitoring System Terintegrasi",
    fieldName: "Jaringan Komputer",
    owner: OWNERS[0],
    pages: 15,
    uploadedAt: "2024-11-15",
    relevance: 76,
    matchPages: [2, 9],
    excerpt: "...konfigurasi <mark>SNMP</mark> trap untuk monitoring status koneksi PPPoE pada OLT ZTE C320. Threshold <mark>redaman</mark> ditetapkan sebagai trigger alarm otomatis...",
  },
];

export const STATS = {
  totalLiteratur: 1248,
  totalKoleksi: 186,
  totalBidang: 8,
  totalMahasiswa: 74,
};
