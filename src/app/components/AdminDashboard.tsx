import { useState } from "react";
import {
  LayoutDashboard, Network, Users, BookOpen, FileText, Activity, Settings, LogOut,
  Plus, Search, Edit2, Trash2, X, Menu, Brain, Cpu, Database, BarChart2, Code2,
  AlertTriangle, CheckCircle2, Loader2, TrendingUp, Eye, Shield, ChevronRight,
  RefreshCw, ArrowUpRight, MoreVertical,
} from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { useApp } from "../context";
import { Card, Badge, Button, Avatar, InputField, TextareaField, StatusDot, cn } from "./ui";
import { FIELDS, PDFS, COLLECTIONS, OWNERS } from "./data";
import { toast } from "sonner";

type Tab = "overview" | "fields" | "users" | "collections" | "documents" | "indexing" | "settings";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Network, Brain, Cpu, Database, BarChart2, Code2,
};

const NAV_ITEMS: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }>; badge?: number }[] = [
  { id: "overview", label: "Ringkasan", icon: LayoutDashboard },
  { id: "fields", label: "Bidang Penelitian", icon: Network },
  { id: "users", label: "Pengguna", icon: Users },
  { id: "collections", label: "Koleksi", icon: BookOpen },
  { id: "documents", label: "Dokumen PDF", icon: FileText },
  { id: "indexing", label: "Monitor Indexing", icon: Activity },
  { id: "settings", label: "Pengaturan", icon: Settings },
];

export function AdminDashboard() {
  const { navigate } = useApp();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [fieldModalOpen, setFieldModalOpen] = useState(false);
  const [editingField, setEditingField] = useState<typeof FIELDS[0] | null>(null);
  const [fieldSearch, setFieldSearch] = useState("");

  const failedPdfs = PDFS.filter((p) => p.indexingStatus === "failed");
  const processingPdfs = PDFS.filter((p) => p.indexingStatus === "processing");
  const indexedPdfs = PDFS.filter((p) => p.indexingStatus === "indexed");

  function SidebarContent() {
    return (
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-white/[0.06]">
          <button onClick={() => navigate({ name: "home" })} className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 bg-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <BookOpen className="w-4 h-4 text-white" strokeWidth={2} />
            </div>
            <div>
              <p className="font-bold text-white text-sm leading-none">Litera</p>
              <p className="text-[10px] font-semibold text-indigo-400 mt-0.5">Panel Admin</p>
            </div>
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <p className="text-[9px] font-bold text-slate-600 uppercase tracking-[0.1em] px-3 mb-2">Manajemen</p>
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            const badge = item.id === "indexing" ? failedPdfs.length : 0;
            return (
              <button
                key={item.id}
                onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 mb-0.5 text-left",
                  isActive
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-900/40"
                    : "text-slate-400 hover:bg-white/[0.06] hover:text-slate-200"
                )}
              >
                <item.icon className={cn("w-4 h-4 shrink-0", isActive ? "text-white" : "text-slate-500")} strokeWidth={isActive ? 2 : 1.75} />
                <span className="flex-1">{item.label}</span>
                {badge > 0 && (
                  <span className="w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shrink-0">
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User + logout */}
        <div className="px-3 py-4 border-t border-white/[0.06]">
          <div className="flex items-center gap-3 px-3 py-2.5 mb-1">
            <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center shrink-0">
              <Shield className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white leading-none">Administrator</p>
              <p className="text-[10px] text-slate-500 mt-0.5 truncate">admin@litera.ac.id</p>
            </div>
          </div>
          <button
            onClick={() => navigate({ name: "login" })}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:bg-white/[0.06] hover:text-red-400 transition-all"
          >
            <LogOut className="w-4 h-4" />
            Keluar
          </button>
        </div>
      </div>
    );
  }

  // ── Overview ────────────────────────────────────────────────────────────────

  function OverviewTab() {
    const totalIndexed = indexedPdfs.length;
    const indexRate = PDFS.length ? Math.round((totalIndexed / PDFS.length) * 100) : 0;

    return (
      <div className="flex flex-col gap-7">
        {/* Page title */}
        <div>
          <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-1">Panel Admin</p>
          <h1 className="text-2xl font-bold text-[#0C0D1A] tracking-tight">Ringkasan Platform</h1>
          <p className="text-slate-500 text-sm mt-1">Aktivitas Litera per hari ini, Sabtu 30 Mei 2026</p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { val: FIELDS.length, lbl: "Bidang Penelitian", icon: Network, color: "text-indigo-600", bg: "bg-indigo-50", delta: "+0" },
            { val: OWNERS.length, lbl: "Pengguna Aktif", icon: Users, color: "text-emerald-600", bg: "bg-emerald-50", delta: "+2" },
            { val: COLLECTIONS.length, lbl: "Total Koleksi", icon: BookOpen, color: "text-violet-600", bg: "bg-violet-50", delta: "+1" },
            { val: PDFS.length, lbl: "Dokumen PDF", icon: FileText, color: "text-orange-600", bg: "bg-orange-50", delta: "+3" },
          ].map(({ val, lbl, icon: Icon, color, bg, delta }) => (
            <div key={lbl} className="bg-white rounded-[1.125rem] border border-[rgba(12,13,26,0.07)] shadow-[0_1px_3px_rgba(12,13,26,0.05)] p-5">
              <div className="flex items-start justify-between mb-3">
                <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center", bg)}>
                  <Icon className={cn("w-4.5 h-4.5", color)} strokeWidth={1.75} />
                </div>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">{delta}</span>
              </div>
              <p className="text-2xl font-bold text-[#0C0D1A]">{val}</p>
              <p className="text-xs text-slate-500 mt-0.5">{lbl}</p>
            </div>
          ))}
        </div>

        {/* Indexing health + recent uploads */}
        <div className="grid lg:grid-cols-3 gap-5">
          {/* Indexing health */}
          <div className="bg-[#0C0D1A] rounded-[1.25rem] p-6 relative overflow-hidden">
            <div className="absolute -top-6 -right-6 w-28 h-28 bg-indigo-500/10 rounded-full" />
            <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-4">Kesehatan Indexing</p>
            <div className="relative z-10">
              <p className="text-5xl font-bold text-white mb-1">{indexRate}<span className="text-2xl text-slate-500">%</span></p>
              <p className="text-sm text-slate-400 mb-5">Tingkat keberhasilan indexing</p>
              <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden mb-4">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full transition-all"
                  style={{ width: `${indexRate}%` }}
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { val: totalIndexed, lbl: "Terindeks", color: "text-emerald-400" },
                  { val: processingPdfs.length, lbl: "Diproses", color: "text-amber-400" },
                  { val: failedPdfs.length, lbl: "Gagal", color: "text-red-400" },
                ].map(({ val, lbl, color }) => (
                  <div key={lbl} className="text-center">
                    <p className={cn("text-lg font-bold", color)}>{val}</p>
                    <p className="text-[10px] text-slate-600 mt-0.5">{lbl}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent uploads */}
          <div className="lg:col-span-2 bg-white rounded-[1.25rem] border border-[rgba(12,13,26,0.07)] shadow-[0_1px_3px_rgba(12,13,26,0.05)] p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-[#0C0D1A] flex items-center gap-2 text-sm">
                <TrendingUp className="w-4 h-4 text-indigo-600" />
                Upload Terbaru
              </h3>
              <button onClick={() => setActiveTab("documents")} className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                Lihat semua <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
            <div className="flex flex-col gap-3">
              {PDFS.slice(0, 5).map((pdf) => (
                <div key={pdf.id} className="flex items-center gap-3 group">
                  <div className="w-8 h-8 bg-red-50 rounded-xl flex items-center justify-center shrink-0">
                    <FileText className="w-3.5 h-3.5 text-red-500" strokeWidth={1.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 line-clamp-1">{pdf.title}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{pdf.uploadedAt} · {pdf.size} · {pdf.pages} hal.</p>
                  </div>
                  <StatusDot status={pdf.indexingStatus} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Failed indexing alerts */}
        {failedPdfs.length > 0 && (
          <div className="bg-red-50 border border-red-100 rounded-[1.125rem] p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-red-700 flex items-center gap-2 text-sm">
                <AlertTriangle className="w-4 h-4" />
                {failedPdfs.length} Dokumen Gagal Diindeks
              </h3>
              <button onClick={() => setActiveTab("indexing")} className="text-xs font-semibold text-red-600 hover:text-red-700 flex items-center gap-1">
                Monitor <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {failedPdfs.map((pdf) => (
                <div key={pdf.id} className="bg-white border border-red-100 rounded-xl p-3.5 flex items-start gap-3">
                  <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 line-clamp-1">{pdf.title}</p>
                    <p className="text-[11px] text-red-600 mt-0.5">{pdf.failReason}</p>
                  </div>
                  <Button size="xs" variant="secondary" onClick={() => toast.success("Retry dijadwalkan")}>
                    <RefreshCw className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Fields ──────────────────────────────────────────────────────────────────

  function FieldsTab() {
    const filtered = fieldSearch
      ? FIELDS.filter((f) => f.name.toLowerCase().includes(fieldSearch.toLowerCase()))
      : FIELDS;

    return (
      <div>
        <div className="flex items-start justify-between mb-6 gap-4">
          <div>
            <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-1">Manajemen</p>
            <h2 className="text-2xl font-bold text-[#0C0D1A] tracking-tight">Bidang Penelitian</h2>
            <p className="text-sm text-slate-500 mt-1">{FIELDS.length} bidang terdaftar di platform</p>
          </div>
          <Button onClick={() => { setEditingField(null); setFieldModalOpen(true); }}>
            <Plus className="w-4 h-4" />
            Tambah Bidang
          </Button>
        </div>

        <div className="relative mb-5">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={fieldSearch}
            onChange={(e) => setFieldSearch(e.target.value)}
            placeholder="Cari bidang penelitian..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-[rgba(12,13,26,0.1)] rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 shadow-sm transition-all"
          />
        </div>

        <div className="flex flex-col gap-3">
          {filtered.map((field) => {
            const IconComp = ICON_MAP[field.iconName] || Network;
            return (
              <div key={field.id} className="bg-white rounded-[1.125rem] border border-[rgba(12,13,26,0.07)] shadow-[0_1px_3px_rgba(12,13,26,0.05)] p-4 flex items-center gap-4 hover:shadow-[0_4px_14px_rgba(12,13,26,0.08)] transition-all duration-200">
                <div className={cn("w-11 h-11 rounded-[14px] flex items-center justify-center shrink-0", field.bgColor)}>
                  <IconComp className={cn("w-5 h-5", field.color)} strokeWidth={1.75} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-[#0C0D1A]">{field.name}</h3>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{field.description}</p>
                  <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-400">
                    <span className="font-medium">{field.collectionCount} koleksi</span>
                    <span className="opacity-40">·</span>
                    <span>{field.pdfCount} PDF</span>
                    <span className="opacity-40">·</span>
                    <span>{field.contributors} kontributor</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 max-w-[180px] hidden sm:flex">
                  {field.keywords.slice(0, 2).map((kw) => (
                    <span key={kw} className="text-[10px] font-semibold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{kw}</span>
                  ))}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => { setEditingField(field); setFieldModalOpen(true); }}
                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                    title="Edit"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => toast.success(`Bidang "${field.name}" dihapus (simulasi)`)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                    title="Hapus"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Users ───────────────────────────────────────────────────────────────────

  function UsersTab() {
    return (
      <div>
        <div className="mb-6">
          <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-1">Manajemen</p>
          <h2 className="text-2xl font-bold text-[#0C0D1A] tracking-tight">Pengguna</h2>
          <p className="text-sm text-slate-500 mt-1">{OWNERS.length} pengguna terdaftar</p>
        </div>
        <div className="flex flex-col gap-3">
          {OWNERS.map((owner) => {
            const ownerCollections = COLLECTIONS.filter((c) => c.owner.id === owner.id);
            const ownerPdfs = PDFS.filter((p) => ownerCollections.some((c) => c.id === p.collectionId));
            return (
              <div key={owner.id} className="bg-white rounded-[1.125rem] border border-[rgba(12,13,26,0.07)] shadow-[0_1px_3px_rgba(12,13,26,0.05)] p-4 flex items-center gap-4">
                <Avatar initials={owner.initials} color={owner.avatarColor} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-[#0C0D1A]">{owner.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{owner.prodi} · {owner.kelas}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{owner.nim}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="indigo">{ownerCollections.length} koleksi</Badge>
                  <Badge variant="gray">{ownerPdfs.length} PDF</Badge>
                </div>
                <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Collections ─────────────────────────────────────────────────────────────

  function CollectionsTab() {
    return (
      <div>
        <div className="mb-6">
          <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-1">Manajemen</p>
          <h2 className="text-2xl font-bold text-[#0C0D1A] tracking-tight">Koleksi Penelitian</h2>
          <p className="text-sm text-slate-500 mt-1">{COLLECTIONS.length} koleksi terdaftar</p>
        </div>
        <div className="flex flex-col gap-3">
          {COLLECTIONS.map((col) => (
            <div key={col.id} className="bg-white rounded-[1.125rem] border border-[rgba(12,13,26,0.07)] shadow-[0_1px_3px_rgba(12,13,26,0.05)] p-4 flex items-start gap-4">
              <div className="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                <BookOpen className="w-4 h-4 text-indigo-600" strokeWidth={1.75} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-[#0C0D1A] line-clamp-2">{col.title}</p>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <Badge variant="indigo">{col.fieldName}</Badge>
                  <div className="flex items-center gap-1.5">
                    <Avatar initials={col.owner.initials} color={col.owner.avatarColor} size="xs" />
                    <span className="text-xs text-slate-500">{col.owner.name}</span>
                  </div>
                  <span className="text-[11px] text-slate-400">{col.pdfCount} PDF</span>
                  <span className="text-[11px] text-slate-400">· {col.lastUpdated}</span>
                </div>
              </div>
              <button
                onClick={() => navigate({ name: "collection", collectionId: col.id })}
                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all shrink-0"
              >
                <Eye className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Documents ───────────────────────────────────────────────────────────────

  function DocumentsTab() {
    return (
      <div>
        <div className="mb-6">
          <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-1">Manajemen</p>
          <h2 className="text-2xl font-bold text-[#0C0D1A] tracking-tight">Dokumen PDF</h2>
          <p className="text-sm text-slate-500 mt-1">{PDFS.length} dokumen terdaftar</p>
        </div>
        <div className="flex flex-col gap-3">
          {PDFS.map((pdf) => (
            <div key={pdf.id} className="bg-white rounded-[1.125rem] border border-[rgba(12,13,26,0.07)] shadow-[0_1px_3px_rgba(12,13,26,0.05)] p-4 flex items-start gap-4">
              <div className="w-9 h-9 bg-red-50 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                <FileText className="w-4 h-4 text-red-500" strokeWidth={1.5} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-slate-900 line-clamp-2">{pdf.title}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <StatusDot status={pdf.indexingStatus} />
                  <span className="text-[11px] text-slate-400">{pdf.uploadedAt} · {pdf.pages} hal. · {pdf.size}</span>
                </div>
                {pdf.failReason && (
                  <div className="mt-2 flex items-start gap-1.5 bg-red-50 border border-red-100 rounded-lg px-2.5 py-2">
                    <AlertTriangle className="w-3 h-3 text-red-500 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-red-600 font-medium">{pdf.failReason}</p>
                  </div>
                )}
              </div>
              {pdf.indexingStatus === "failed" && (
                <Button size="xs" variant="secondary" onClick={() => toast.success("Retry dijadwalkan")}>
                  <RefreshCw className="w-3 h-3" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Indexing Monitor ────────────────────────────────────────────────────────

  function IndexingTab() {
    const total = PDFS.length;
    const indexed = indexedPdfs.length;
    return (
      <div>
        <div className="mb-6">
          <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-1">Monitoring</p>
          <h2 className="text-2xl font-bold text-[#0C0D1A] tracking-tight">Monitor Indexing</h2>
          <p className="text-sm text-slate-500 mt-1">Status real-time pipeline indexing dokumen</p>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { val: total, lbl: "Total Dokumen", color: "text-slate-700", bg: "bg-slate-100" },
            { val: indexed, lbl: "Terindeks", color: "text-emerald-600", bg: "bg-emerald-50" },
            { val: processingPdfs.length, lbl: "Sedang Diproses", color: "text-amber-600", bg: "bg-amber-50" },
            { val: failedPdfs.length, lbl: "Gagal", color: "text-red-600", bg: "bg-red-50" },
          ].map(({ val, lbl, color, bg }) => (
            <div key={lbl} className={cn("rounded-[1.125rem] p-4 text-center", bg)}>
              <p className={cn("text-3xl font-bold", color)}>{val}</p>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">{lbl}</p>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div className="bg-white rounded-[1.125rem] border border-[rgba(12,13,26,0.07)] shadow-[0_1px_3px_rgba(12,13,26,0.05)] p-5 mb-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-bold text-[#0C0D1A]">Tingkat Keberhasilan Indexing</p>
            <p className="text-sm font-bold text-indigo-600">{total ? Math.round((indexed / total) * 100) : 0}%</p>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full transition-all duration-500"
              style={{ width: `${total ? Math.round((indexed / total) * 100) : 0}%` }}
            />
          </div>
          <div className="flex items-center gap-4 mt-3 text-[11px] font-medium">
            <span className="flex items-center gap-1.5 text-emerald-600"><span className="w-2 h-2 bg-emerald-400 rounded-full" />Terindeks</span>
            <span className="flex items-center gap-1.5 text-amber-600"><span className="w-2 h-2 bg-amber-400 rounded-full" />Diproses</span>
            <span className="flex items-center gap-1.5 text-red-600"><span className="w-2 h-2 bg-red-400 rounded-full" />Gagal</span>
          </div>
        </div>

        {/* Full list */}
        <div className="flex flex-col gap-3">
          {PDFS.map((pdf) => (
            <div key={pdf.id} className={cn(
              "rounded-[1.125rem] border p-4 flex items-start gap-4 transition-all",
              pdf.indexingStatus === "indexed" ? "bg-emerald-50/40 border-emerald-100" :
              pdf.indexingStatus === "failed" ? "bg-red-50/40 border-red-100" :
              "bg-white border-[rgba(12,13,26,0.07)] shadow-[0_1px_3px_rgba(12,13,26,0.05)]"
            )}>
              <div className="w-9 h-9 bg-red-50 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                <FileText className="w-4 h-4 text-red-500" strokeWidth={1.5} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-slate-900">{pdf.title}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <StatusDot status={pdf.indexingStatus} />
                  <span className="text-[11px] text-slate-400">{pdf.uploadedAt} · {pdf.pages} hal.</span>
                </div>
                {pdf.failReason && (
                  <div className="mt-2 flex items-start gap-1.5 bg-red-50 border border-red-100 rounded-lg px-2.5 py-2">
                    <AlertTriangle className="w-3 h-3 text-red-500 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-red-600 font-medium">{pdf.failReason}</p>
                  </div>
                )}
              </div>
              {pdf.indexingStatus === "failed" && (
                <Button size="xs" variant="secondary" onClick={() => toast.success(`Retry untuk "${pdf.title.slice(0, 20)}..." dijadwalkan`)}>
                  <RefreshCw className="w-3 h-3" />
                  Retry
                </Button>
              )}
              {pdf.indexingStatus === "processing" && (
                <div className="flex items-center gap-1.5 text-amber-600">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span className="text-[11px] font-semibold">Memproses...</span>
                </div>
              )}
              {pdf.indexingStatus === "indexed" && (
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Settings ────────────────────────────────────────────────────────────────

  function SettingsTab() {
    return (
      <div className="max-w-xl">
        <div className="mb-6">
          <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-1">Sistem</p>
          <h2 className="text-2xl font-bold text-[#0C0D1A] tracking-tight">Pengaturan Platform</h2>
          <p className="text-sm text-slate-500 mt-1">Konfigurasi umum Litera</p>
        </div>
        <div className="flex flex-col gap-5">
          <div className="bg-white rounded-[1.125rem] border border-[rgba(12,13,26,0.07)] shadow-[0_1px_3px_rgba(12,13,26,0.05)] p-6">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Informasi Platform</p>
            <div className="flex flex-col gap-4">
              <InputField label="Nama Platform" defaultValue="Litera" />
              <InputField label="Institusi" defaultValue="Universitas Teknologi Nusantara" />
              <TextareaField label="Deskripsi Singkat" defaultValue="Platform literatur akademik kolaboratif untuk mahasiswa dan peneliti." rows={3} />
            </div>
          </div>
          <div className="bg-white rounded-[1.125rem] border border-[rgba(12,13,26,0.07)] shadow-[0_1px_3px_rgba(12,13,26,0.05)] p-6">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Batas Upload</p>
            <div className="flex flex-col gap-4">
              <InputField label="Maks. Ukuran File (MB)" defaultValue="50" />
              <InputField label="Maks. File per Upload" defaultValue="10" />
            </div>
          </div>
          <Button size="lg" onClick={() => toast.success("Pengaturan berhasil disimpan!")}>
            Simpan Pengaturan
          </Button>
        </div>
      </div>
    );
  }

  const TAB_CONTENT: Record<Tab, React.ReactNode> = {
    overview: <OverviewTab />,
    fields: <FieldsTab />,
    users: <UsersTab />,
    collections: <CollectionsTab />,
    documents: <DocumentsTab />,
    indexing: <IndexingTab />,
    settings: <SettingsTab />,
  };

  return (
    <div className="min-h-screen bg-[#F5F4F1] flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-[220px] shrink-0 bg-[#0C0D1A] sticky top-0 h-screen overflow-hidden">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="relative z-50 w-[220px] bg-[#0C0D1A] h-full shadow-2xl">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile topbar */}
        <div className="lg:hidden bg-white border-b border-[rgba(12,13,26,0.07)] px-4 h-[60px] flex items-center gap-3 sticky top-0 z-40">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition-all"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-indigo-600 rounded-lg flex items-center justify-center">
              <BookOpen className="w-3 h-3 text-white" />
            </div>
            <span className="font-bold text-[#0C0D1A] text-sm">Admin Panel</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {failedPdfs.length > 0 && (
              <button
                onClick={() => setActiveTab("indexing")}
                className="flex items-center gap-1.5 bg-red-50 border border-red-100 text-red-600 text-xs font-bold px-2.5 py-1.5 rounded-full"
              >
                <AlertTriangle className="w-3 h-3" />
                {failedPdfs.length} gagal
              </button>
            )}
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full">
          {TAB_CONTENT[activeTab]}
        </main>
      </div>

      {/* Field Add/Edit Modal */}
      <Dialog.Root open={fieldModalOpen} onOpenChange={setFieldModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-50 animate-in fade-in duration-150" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md bg-white rounded-[1.5rem] shadow-2xl shadow-black/20 overflow-hidden animate-in fade-in zoom-in-95 duration-200 mx-4">
            <div className="flex items-center justify-between px-6 py-5 border-b border-[rgba(12,13,26,0.07)]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-indigo-50 rounded-xl flex items-center justify-center">
                  <Network className="w-4 h-4 text-indigo-600" strokeWidth={1.75} />
                </div>
                <Dialog.Title className="font-bold text-[#0C0D1A] text-sm">
                  {editingField ? "Edit Bidang Penelitian" : "Tambah Bidang Penelitian"}
                </Dialog.Title>
              </div>
              <Dialog.Close asChild>
                <button className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all">
                  <X className="w-4 h-4" />
                </button>
              </Dialog.Close>
            </div>
            <div className="p-6">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  toast.success(editingField ? `Bidang "${editingField.name}" berhasil diperbarui!` : "Bidang baru berhasil ditambahkan!");
                  setFieldModalOpen(false);
                }}
                className="flex flex-col gap-4"
              >
                <InputField
                  label="Nama Bidang"
                  placeholder="Contoh: Jaringan Komputer"
                  defaultValue={editingField?.name}
                  required
                />
                <TextareaField
                  label="Deskripsi"
                  placeholder="Deskripsi singkat bidang penelitian ini..."
                  defaultValue={editingField?.description}
                  rows={3}
                />
                <InputField
                  label="Kata Kunci"
                  placeholder="SNMP, OLT, Bandwidth, Monitoring..."
                  defaultValue={editingField?.keywords.join(", ")}
                  hint="Pisahkan dengan koma"
                />
                <div className="flex gap-3 pt-2">
                  <Dialog.Close asChild>
                    <Button type="button" variant="outline" className="flex-1">Batal</Button>
                  </Dialog.Close>
                  <Button type="submit" className="flex-1">
                    {editingField ? "Simpan Perubahan" : "Tambah Bidang"}
                  </Button>
                </div>
              </form>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
