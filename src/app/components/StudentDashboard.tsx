import { useState } from "react";
import {
  LayoutDashboard, BookOpen, FileText, Activity, History,
  User, LogOut, Plus, Upload, Clock, CheckCircle2,
  AlertCircle, ChevronRight, TrendingUp, Search, Menu, X,
  Loader2, Sparkles
} from "lucide-react";
import { useApp } from "../context";
import { Avatar, Button, Badge, StatusDot, ProgressBar, cn } from "./ui";
import { COLLECTIONS, PDFS } from "./data";
import { toast } from "sonner";

type Tab = "overview" | "collections" | "pdfs" | "indexing" | "history" | "profile";

const ACTIVITY = [
  { icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-50", msg: "'Monitoring Optical Network Unit Berbasis SNMP' berhasil diindeks", time: "2 jam lalu" },
  { icon: Upload, color: "text-indigo-500", bg: "bg-indigo-50", msg: "3 PDF diunggah ke koleksi 'Perancangan Network Monitoring System'", time: "5 jam lalu" },
  { icon: AlertCircle, color: "text-red-500", bg: "bg-red-50", msg: "'Konfigurasi BGP Route Reflector' gagal diindeks", time: "1 hari lalu" },
  { icon: Plus, color: "text-violet-500", bg: "bg-violet-50", msg: "Koleksi baru 'Smart Home Berbasis IoT' berhasil dibuat", time: "3 hari lalu" },
  { icon: Search, color: "text-sky-500", bg: "bg-sky-50", msg: "Pencarian 'monitoring redaman onu' menghasilkan 3 hasil relevan", time: "4 hari lalu" },
];

const SEARCH_HISTORY = [
  "monitoring redaman onu menggunakan snmp",
  "GPON jaringan FTTH urban",
  "deep learning object detection real-time YOLO",
  "smart home ESP32 MQTT automasi",
  "analisis sentimen twitter ensemble learning",
];

const NAV_ITEMS: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "overview", label: "Ringkasan", icon: LayoutDashboard },
  { id: "collections", label: "Koleksi Saya", icon: BookOpen },
  { id: "pdfs", label: "Literatur Saya", icon: FileText },
  { id: "indexing", label: "Status Indexing", icon: Activity },
  { id: "history", label: "Riwayat Pencarian", icon: History },
  { id: "profile", label: "Profil", icon: User },
];

export function StudentDashboard() {
  const { navigate, setShowUploadModal } = useApp();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const myCollections = COLLECTIONS.filter((c) => c.owner.id === "u1");
  const myPdfs = PDFS.filter((p) => myCollections.some((c) => c.id === p.collectionId));
  const indexed = myPdfs.filter((p) => p.indexingStatus === "indexed");
  const processing = myPdfs.filter((p) => ["pending", "processing"].includes(p.indexingStatus));
  const failed = myPdfs.filter((p) => p.indexingStatus === "failed");
  const totalPages = indexed.reduce((s, p) => s + p.pages, 0);
  const indexPct = myPdfs.length ? Math.round((indexed.length / myPdfs.length) * 100) : 0;

  // ── Sidebar ──────────────────────────────────────────────────────────────

  function Sidebar() {
    return (
      <aside className="w-[220px] h-full bg-white border-r border-[rgba(12,13,26,0.06)] flex flex-col">
        {/* Logo */}
        <div className="px-5 h-[60px] flex items-center border-b border-[rgba(12,13,26,0.06)]">
          <button onClick={() => navigate({ name: "home" })} className="flex items-center gap-2.5 group">
            <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center shadow-sm shadow-indigo-300/40">
              <BookOpen className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-[#0C0D1A] font-bold tracking-tight">Litera</span>
          </button>
          <button onClick={() => setSidebarOpen(false)} className="ml-auto lg:hidden p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav */}
        <div className="flex-1 px-3 py-4 overflow-y-auto">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.12em] px-3 mb-2.5">Menu</p>
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[0.8125rem] font-semibold transition-all duration-150 mb-0.5 text-left",
                  isActive
                    ? "bg-indigo-600 text-white shadow-[0_2px_8px_rgba(79,70,229,0.25)]"
                    : "text-slate-500 hover:text-[#0C0D1A] hover:bg-slate-50"
                )}
              >
                <item.icon className={cn("w-4 h-4 shrink-0", isActive ? "text-white" : "text-slate-400")} strokeWidth={isActive ? 2 : 1.75} />
                <span className="flex-1">{item.label}</span>
                {item.id === "indexing" && processing.length > 0 && (
                  <span className={cn(
                    "min-w-[18px] h-[18px] text-[10px] font-bold rounded-full flex items-center justify-center px-1",
                    isActive ? "bg-white/20 text-white" : "bg-amber-500 text-white"
                  )}>
                    {processing.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* User */}
        <div className="px-3 pb-4 border-t border-[rgba(12,13,26,0.06)] pt-3">
          <div className="flex items-center gap-2.5 px-3 py-2.5 mb-1 rounded-xl bg-slate-50/80">
            <Avatar initials="AB" color="bg-indigo-500" size="sm" />
            <div className="min-w-0">
              <p className="text-xs font-bold text-[#0C0D1A] truncate">Arif Budiman</p>
              <p className="text-[10px] text-slate-400 truncate">TI-4A · NIM 19416255201</p>
            </div>
          </div>
          <button
            onClick={() => { toast.info("Sampai jumpa!"); navigate({ name: "login" }); }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[0.8125rem] font-semibold text-red-500 hover:bg-red-50 hover:text-red-600 transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            Keluar
          </button>
        </div>
      </aside>
    );
  }

  // ── Overview ─────────────────────────────────────────────────────────────

  function Overview() {
    return (
      <div className="flex flex-col gap-6">
        {/* Welcome banner */}
        <div className="bg-[#0C0D1A] rounded-[1.25rem] p-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_70%_at_100%_0%,rgba(99,102,241,0.2),transparent)]" />
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/[0.02] rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold text-indigo-400 uppercase tracking-[0.12em] mb-2">Dasbor Mahasiswa</p>
              <h1 className="text-xl font-bold text-white tracking-tight mb-1">Selamat datang, Arif 👋</h1>
              <p className="text-slate-500 text-sm">Berikut ringkasan aktivitas penelitianmu hari ini.</p>
            </div>
            <Button size="sm" variant="white" onClick={() => setShowUploadModal(true)} className="hidden sm:flex shrink-0">
              <Upload className="w-3.5 h-3.5" strokeWidth={2} />
              Unggah PDF
            </Button>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { val: myCollections.length, lbl: "Koleksi", icon: BookOpen, iconBg: "bg-indigo-50", iconColor: "text-indigo-500", action: () => setActiveTab("collections") },
            { val: myPdfs.length, lbl: "PDF Diunggah", icon: FileText, iconBg: "bg-violet-50", iconColor: "text-violet-500", action: () => setActiveTab("pdfs") },
            { val: totalPages, lbl: "Hal. Terindeks", icon: TrendingUp, iconBg: "bg-emerald-50", iconColor: "text-emerald-500", action: () => setActiveTab("indexing") },
            { val: processing.length, lbl: "Proses Indexing", icon: Loader2, iconBg: "bg-amber-50", iconColor: "text-amber-500", action: () => setActiveTab("indexing") },
          ].map(({ val, lbl, icon: Icon, iconBg, iconColor, action }) => (
            <button key={lbl} onClick={action}
              className="group bg-white rounded-[1.125rem] border border-[rgba(12,13,26,0.07)] p-5 text-left hover:shadow-[0_4px_14px_rgba(12,13,26,0.09)] hover:-translate-y-0.5 transition-all duration-200">
              <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center mb-3.5", iconBg)}>
                <Icon className={cn("w-4 h-4", iconColor)} strokeWidth={1.75} />
              </div>
              <p className="text-[1.625rem] font-bold text-[#0C0D1A] leading-none mb-1">{val}</p>
              <p className="text-[11px] text-slate-500 font-medium">{lbl}</p>
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-5 gap-5">
          {/* Activity feed */}
          <div className="lg:col-span-3 bg-white rounded-[1.125rem] border border-[rgba(12,13,26,0.07)] shadow-[0_1px_3px_rgba(12,13,26,0.05)] p-5">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Aktivitas Terbaru</p>
            <div className="flex flex-col gap-3">
              {ACTIVITY.map((a, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5", a.bg)}>
                    <a.icon className={cn("w-3.5 h-3.5", a.color)} strokeWidth={2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700 leading-snug">{a.msg}</p>
                    <p className="text-xs text-slate-400 font-medium mt-0.5">{a.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Indexing widget */}
          <div className="lg:col-span-2 bg-white rounded-[1.125rem] border border-[rgba(12,13,26,0.07)] shadow-[0_1px_3px_rgba(12,13,26,0.05)] p-5">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Indexing</p>

            <div className="flex items-end gap-2 mb-2">
              <span className="text-3xl font-bold text-[#0C0D1A]">{indexPct}%</span>
              <span className="text-xs text-slate-400 font-medium mb-1">terindeks</span>
            </div>

            <ProgressBar
              value={indexPct}
              color="bg-gradient-to-r from-indigo-500 to-emerald-500"
              className="mb-5"
            />

            <div className="flex flex-col gap-2.5">
              {[
                { label: "Berhasil", count: indexed.length, color: "bg-emerald-500" },
                { label: "Diproses", count: processing.length, color: "bg-indigo-500 animate-pulse" },
                { label: "Gagal", count: failed.length, color: "bg-red-500" },
              ].map(({ label, count, color }) => (
                <div key={label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={cn("w-2 h-2 rounded-full", color)} />
                    <span className="text-sm text-slate-600 font-medium">{label}</span>
                  </div>
                  <span className="text-sm font-bold text-slate-900">{count} PDF</span>
                </div>
              ))}
            </div>

            {failed.length > 0 && (
              <div className="mt-4 bg-red-50 border border-red-100 rounded-xl p-3">
                <p className="text-xs font-semibold text-red-700 mb-1">{failed.length} PDF gagal diproses</p>
                <p className="text-[10px] text-red-500">Kemungkinan PDF berisi gambar scan tanpa teks.</p>
              </div>
            )}
          </div>
        </div>

        {/* Collections grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Koleksi Saya</p>
            <Button size="xs" variant="secondary" onClick={() => navigate({ name: "create-collection" })}>
              <Plus className="w-3 h-3" />
              Buat Koleksi
            </Button>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {myCollections.map((col) => (
              <div key={col.id} onClick={() => navigate({ name: "collection", collectionId: col.id })}
                className="group bg-white rounded-[1.125rem] border border-[rgba(12,13,26,0.07)] p-4 cursor-pointer hover:shadow-[0_4px_12px_rgba(12,13,26,0.08)] hover:border-[rgba(12,13,26,0.12)] transition-all">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <Badge variant="indigo">{col.fieldName}</Badge>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all" />
                </div>
                <h4 className="font-semibold text-sm text-[#0C0D1A] line-clamp-2 mb-3 group-hover:text-indigo-700 transition-colors">{col.title}</h4>
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
                  <span>{col.pdfCount} PDF</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{col.lastUpdated}</span>
                </div>
              </div>
            ))}
            <button onClick={() => navigate({ name: "create-collection" })}
              className="group border-2 border-dashed border-[rgba(12,13,26,0.1)] rounded-[1.125rem] p-4 min-h-[120px] flex flex-col items-center justify-center gap-2 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all">
              <div className="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                <Plus className="w-4 h-4 text-indigo-600" />
              </div>
              <span className="text-sm font-semibold text-slate-500 group-hover:text-indigo-600 transition-colors">Buat Koleksi Baru</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Content by tab ────────────────────────────────────────────────────────

  const content: Record<Tab, React.ReactNode> = {
    overview: <Overview />,

    collections: (
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-[#0C0D1A] tracking-tight">Koleksi Saya</h2>
            <p className="text-sm text-slate-500 mt-0.5">{myCollections.length} koleksi penelitian</p>
          </div>
          <Button size="sm" onClick={() => navigate({ name: "create-collection" })}>
            <Plus className="w-3.5 h-3.5" />
            Buat Koleksi
          </Button>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {myCollections.map((col) => (
            <div key={col.id} onClick={() => navigate({ name: "collection", collectionId: col.id })}
              className="group bg-white rounded-[1.125rem] border border-[rgba(12,13,26,0.07)] p-5 cursor-pointer hover:shadow-[0_4px_14px_rgba(12,13,26,0.09)] hover:border-[rgba(12,13,26,0.12)] transition-all overflow-hidden">
              <div className="flex items-start justify-between gap-2 mb-3">
                <Badge variant="indigo">{col.fieldName}</Badge>
                {!col.isPublic && <Badge variant="gray">Privat</Badge>}
              </div>
              <h3 className="font-bold text-sm text-[#0C0D1A] line-clamp-2 mb-2 group-hover:text-indigo-700 transition-colors">{col.title}</h3>
              <p className="text-xs text-slate-400 line-clamp-2 mb-4">{col.description}</p>
              <div className="flex items-center justify-between text-[11px] font-medium text-slate-400 pt-3 border-t border-[rgba(12,13,26,0.06)]">
                <span>{col.pdfCount} PDF</span>
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{col.lastUpdated}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    ),

    pdfs: (
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-[#0C0D1A] tracking-tight">Literatur Saya</h2>
            <p className="text-sm text-slate-500 mt-0.5">{myPdfs.length} dokumen PDF</p>
          </div>
          <Button size="sm" onClick={() => setShowUploadModal(true)}>
            <Upload className="w-3.5 h-3.5" />
            Unggah PDF
          </Button>
        </div>
        <div className="flex flex-col gap-2.5">
          {myPdfs.map((pdf) => (
            <div key={pdf.id} className="bg-white rounded-xl border border-[rgba(12,13,26,0.07)] p-4 flex items-center gap-3 hover:border-[rgba(12,13,26,0.12)] transition-all">
              <div className="w-9 h-9 bg-red-50 rounded-xl flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4 text-red-500" strokeWidth={1.5} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 line-clamp-1">{pdf.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  <StatusDot status={pdf.indexingStatus} />
                  <span className="text-[11px] text-slate-400 font-medium">{pdf.pages} hal. · {pdf.size}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    ),

    indexing: (
      <div>
        <h2 className="text-xl font-bold text-[#0C0D1A] tracking-tight mb-2">Status Indexing</h2>
        <p className="text-sm text-slate-500 mb-6">{indexPct}% PDF berhasil diindeks</p>
        <ProgressBar value={indexPct} color="bg-gradient-to-r from-indigo-500 to-emerald-500" className="mb-6" />
        <div className="flex flex-col gap-2.5">
          {myPdfs.map((pdf) => (
            <div key={pdf.id} className="bg-white rounded-xl border border-[rgba(12,13,26,0.07)] p-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 bg-red-50 rounded-xl flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4 text-red-500" strokeWidth={1.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 line-clamp-1">{pdf.title}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <StatusDot status={pdf.indexingStatus} />
                    <span className="text-[11px] text-slate-400 font-medium">{pdf.uploadedAt}</span>
                  </div>
                  {pdf.failReason && (
                    <div className="mt-2 flex items-start gap-1.5 bg-red-50 border border-red-100 rounded-lg px-2.5 py-2">
                      <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                      <p className="text-xs text-red-600 font-medium">{pdf.failReason}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    ),

    history: (
      <div>
        <h2 className="text-xl font-bold text-[#0C0D1A] tracking-tight mb-6">Riwayat Pencarian</h2>
        <div className="flex flex-col gap-2">
          {SEARCH_HISTORY.map((q, i) => (
            <button key={i} onClick={() => navigate({ name: "search", query: q })}
              className="group flex items-center gap-3 p-4 bg-white rounded-xl border border-[rgba(12,13,26,0.07)] hover:border-indigo-200 hover:bg-indigo-50/30 transition-all text-left">
              <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
                <Clock className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-500 transition-colors" />
              </div>
              <span className="flex-1 text-sm text-slate-700 font-medium group-hover:text-indigo-700 transition-colors">{q}</span>
              <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
            </button>
          ))}
        </div>
      </div>
    ),

    profile: (
      <div className="max-w-lg">
        <h2 className="text-xl font-bold text-[#0C0D1A] tracking-tight mb-6">Profil Saya</h2>
        <div className="bg-white rounded-[1.25rem] border border-[rgba(12,13,26,0.07)] shadow-[0_1px_3px_rgba(12,13,26,0.05)] overflow-hidden">
          <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-7 pb-12 relative">
            <Sparkles className="w-4 h-4 text-white/20 absolute top-4 right-4" />
          </div>
          <div className="px-7 pb-7">
            <div className="flex items-end gap-4 -mt-8 mb-5">
              <Avatar initials="AB" color="bg-indigo-500" size="xl" />
              <div className="pb-1">
                <h3 className="text-lg font-bold text-[#0C0D1A]">Arif Budiman</h3>
                <p className="text-sm text-slate-500">arif@mahasiswa.ac.id</p>
              </div>
            </div>
            <div className="flex gap-2 mb-6">
              <Badge variant="indigo">Mahasiswa</Badge>
              <Badge variant="gray">Teknik Informatika</Badge>
            </div>
            <div className="flex flex-col gap-0">
              {[
                ["NIM", "2021001234"],
                ["Program Studi", "Teknik Informatika"],
                ["Kelas", "TI-4A"],
                ["Bergabung", "September 2024"],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between py-3 border-b border-[rgba(12,13,26,0.06)] last:border-0">
                  <span className="text-sm text-slate-400 font-medium">{k}</span>
                  <span className="text-sm font-semibold text-slate-800">{v}</span>
                </div>
              ))}
            </div>
            <Button variant="outline" className="mt-5 w-full">Edit Profil</Button>
          </div>
        </div>
      </div>
    ),
  };

  return (
    <div className="h-screen flex overflow-hidden bg-[#F5F4F1]">
      {/* Desktop sidebar */}
      <div className="hidden lg:block shrink-0">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <div className="relative z-50">
            <Sidebar />
          </div>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile topbar */}
        <div className="lg:hidden bg-white border-b border-[rgba(12,13,26,0.07)] px-4 h-[60px] flex items-center gap-3 shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition-all">
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-bold text-slate-900 tracking-tight">Dashboard</span>
          <div className="ml-auto">
            <Avatar initials="AB" color="bg-indigo-500" size="sm" />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 pb-24 lg:pb-8">
          <div className="max-w-4xl mx-auto">
            {content[activeTab]}
          </div>
        </div>

        {/* Mobile bottom nav */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-[rgba(12,13,26,0.07)] px-2 py-2 z-40 shadow-[0_-4px_20px_rgba(12,13,26,0.08)]">
          <div className="flex items-center justify-around">
            {NAV_ITEMS.slice(0, 5).map((item) => (
              <button key={item.id} onClick={() => setActiveTab(item.id)}
                className={cn(
                  "flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all",
                  activeTab === item.id ? "text-indigo-600" : "text-slate-400"
                )}>
                <item.icon className="w-5 h-5" />
                <span className="text-[10px] font-semibold">{item.label.split(" ")[0]}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
