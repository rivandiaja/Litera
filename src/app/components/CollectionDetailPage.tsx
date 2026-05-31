import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Clock,
  Edit2,
  FileText,
  Globe,
  Lock,
  MoreHorizontal,
  RefreshCcw,
  Search,
  Share2,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useApp } from "../context";
import { useAuth } from "../../contexts/AuthContext";
import { useProjectDocuments } from "../../hooks/use-project-documents";
import { getSafeErrorMessage } from "../../lib/api-error";
import { adaptProject, formatDate, type ProjectDisplay } from "../../lib/domain-display";
import { documentService } from "../../services/document-service";
import { projectService } from "../../services/project-service";
import type { DocumentRead, IndexStatus } from "../../types/document";
import { Navbar } from "./Navbar";
import { Avatar, Button, InputField, StatusDot, cn } from "./ui";

type StatusFilter = "all" | IndexStatus;

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getDocumentDate(document: DocumentRead) {
  return formatDate(document.created_at);
}

function getFilteredDocuments(documents: DocumentRead[], query: string, filter: StatusFilter) {
  const normalizedQuery = query.trim().toLowerCase();
  return documents.filter((document) => {
    const matchSearch = !normalizedQuery
      || document.title.toLowerCase().includes(normalizedQuery)
      || document.original_filename.toLowerCase().includes(normalizedQuery);
    const matchStatus = filter === "all" || document.index_status === filter;
    return matchSearch && matchStatus;
  });
}

export function CollectionDetailPage({ collectionId }: { collectionId: string }) {
  const {
    navigate,
    setShowUploadModal,
    setUploadTargetCollectionId,
    documentsRefreshKey,
    notifyDocumentsChanged,
  } = useApp();
  const { user } = useAuth();
  const projectApiId = Number(collectionId);
  const validProjectId = Number.isFinite(projectApiId) ? projectApiId : null;
  const documentsState = useProjectDocuments(validProjectId, documentsRefreshKey);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<StatusFilter>("all");
  const [copied, setCopied] = useState(false);
  const [collection, setCollection] = useState<ProjectDisplay | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openingDocumentId, setOpeningDocumentId] = useState<number | null>(null);
  const [mutationDocumentId, setMutationDocumentId] = useState<number | null>(null);
  const [editingDocument, setEditingDocument] = useState<DocumentRead | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const loadCollection = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await projectService.get(Number(collectionId));
      setCollection(adaptProject(response));
    } catch (err) {
      setError(getSafeErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [collectionId]);

  useEffect(() => {
    void loadCollection();
  }, [loadCollection]);

  const allPdfs = documentsState.documents;
  const filteredPdfs = useMemo(
    () => getFilteredDocuments(allPdfs, searchQuery, activeFilter),
    [allPdfs, searchQuery, activeFilter]
  );

  const counts = useMemo(() => ({
    all: allPdfs.length,
    indexed: allPdfs.filter((pdf) => pdf.index_status === "indexed").length,
    pending: allPdfs.filter((pdf) => pdf.index_status === "pending").length,
    processing: allPdfs.filter((pdf) => pdf.index_status === "processing").length,
    failed: allPdfs.filter((pdf) => pdf.index_status === "failed").length,
  }), [allPdfs]);

  const isOwner = Boolean(collection && user && (user.role === "admin" || collection.owner.id === user.id));
  const indexProgress = allPdfs.length ? Math.round((counts.indexed / allPdfs.length) * 100) : 0;

  function openUploadModal() {
    if (!collection) return;
    setUploadTargetCollectionId(collection.id);
    setShowUploadModal(true);
  }

  function runCollectionSearch(rawQuery?: string) {
    if (!collection) return;
    const query = (rawQuery ?? searchQuery).trim() || collection.keywords[0] || collection.fieldName;
    navigate({
      name: "search",
      query,
      researchProjectId: collection.apiId,
      sortBy: "relevance",
      page: 1,
    });
  }

  function handleShare() {
    setCopied(true);
    toast.success("Tautan koleksi disalin!");
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleDeleteCollection() {
    if (!collection || !window.confirm(`Hapus koleksi "${collection.title}"?`)) return;
    try {
      await projectService.remove(collection.apiId);
      toast.success("Koleksi berhasil dihapus.");
      navigate({ name: "dashboard" });
    } catch (err) {
      toast.error(getSafeErrorMessage(err));
    }
  }

  async function handleOpenDocument(document: DocumentRead) {
    setOpeningDocumentId(document.id);
    try {
      await documentService.openDocumentFile(document.id, document.original_filename);
    } catch (err) {
      toast.error(getSafeErrorMessage(err));
    } finally {
      setOpeningDocumentId(null);
    }
  }

  function beginEditDocument(document: DocumentRead) {
    setEditingDocument(document);
    setEditTitle(document.title);
  }

  async function handleSaveDocumentTitle(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingDocument) return;

    const title = editTitle.trim();
    if (!title) {
      toast.error("Judul dokumen tidak boleh kosong.");
      return;
    }

    setMutationDocumentId(editingDocument.id);
    try {
      await documentService.updateDocumentTitle(editingDocument.id, { title });
      toast.success("Judul dokumen diperbarui.");
      setEditingDocument(null);
      await documentsState.refresh();
      notifyDocumentsChanged();
    } catch (err) {
      toast.error(getSafeErrorMessage(err));
    } finally {
      setMutationDocumentId(null);
    }
  }

  async function handleReindexDocument(document: DocumentRead) {
    if (!window.confirm(`Jalankan indexing ulang untuk "${document.title}"?`)) return;

    setMutationDocumentId(document.id);
    try {
      await documentService.reindexDocument(document.id);
      toast.success("Dokumen masuk antrean re-index.");
      await documentsState.refresh();
      notifyDocumentsChanged();
    } catch (err) {
      toast.error(getSafeErrorMessage(err));
    } finally {
      setMutationDocumentId(null);
    }
  }

  async function handleDeleteDocument(document: DocumentRead) {
    if (!window.confirm(`Hapus PDF "${document.title}"?`)) return;

    setMutationDocumentId(document.id);
    try {
      await documentService.deleteDocument(document.id);
      toast.success("PDF berhasil dihapus.");
      await documentsState.refresh();
      notifyDocumentsChanged();
    } catch (err) {
      toast.error(getSafeErrorMessage(err));
    } finally {
      setMutationDocumentId(null);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F5F4F1]">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 text-center text-sm text-slate-400">
          Memuat detail koleksi dari API...
        </div>
      </div>
    );
  }

  if (error || !collection) {
    return (
      <div className="min-h-screen bg-[#F5F4F1]">
        <Navbar />
        <div className="max-w-xl mx-auto px-4 sm:px-6 py-16 text-center">
          <div className="bg-white rounded-[1.25rem] border border-red-100 p-8">
            <p className="text-sm font-semibold text-red-600 mb-4">{error || "Koleksi tidak ditemukan."}</p>
            <Button onClick={loadCollection}>Coba Lagi</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F4F1]">
      <Navbar />

      {/* Mesh gradient hero */}
      <div className="relative overflow-hidden" style={{ background: "linear-gradient(145deg, #c7d2fe 0%, #ddd6fe 45%, #a5f3fc 100%)", minHeight: 180 }}>
        {/* Orbs */}
        <div className="absolute pointer-events-none" style={{ top: "-40%", left: "-8%", width: "55vw", aspectRatio: "1", borderRadius: "50%", background: "#6366f1", filter: "blur(90px)", opacity: 0.4 }} />
        <div className="absolute pointer-events-none" style={{ bottom: "-30%", right: "-5%", width: "40vw", aspectRatio: "1", borderRadius: "50%", background: "#8b5cf6", filter: "blur(80px)", opacity: 0.35 }} />
        <div className="absolute pointer-events-none" style={{ top: "20%", right: "20%", width: "22vw", aspectRatio: "1", borderRadius: "50%", background: "#22d3ee", filter: "blur(70px)", opacity: 0.2 }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-7 pb-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs font-medium text-indigo-900/50 mb-5">
            <button onClick={() => navigate({ name: "home" })} className="hover:text-indigo-900/80 transition-colors">Beranda</button>
            <ChevronRight className="w-3.5 h-3.5" />
            <button onClick={() => navigate({ name: "field-detail", fieldId: collection.fieldId })} className="hover:text-indigo-900/80 transition-colors">{collection.fieldName}</button>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-indigo-900/75 font-semibold line-clamp-1 max-w-xs">{collection.title}</span>
          </div>

          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              {/* Chips */}
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold" style={{ background: "rgba(255,255,255,0.35)", backdropFilter: "blur(8px)", color: "#3730a3" }}>
                  {collection.fieldName}
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold" style={{ background: "rgba(255,255,255,0.3)", backdropFilter: "blur(8px)", color: collection.isPublic ? "#065f46" : "#475569" }}>
                  {collection.isPublic ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                  {collection.isPublic ? "Publik" : "Privat"}
                </span>
              </div>
              <h1 className="text-2xl font-bold text-[#0C0D1A] tracking-tight leading-snug max-w-xl">{collection.title}</h1>
              <p className="text-sm text-indigo-900/60 mt-1.5 font-medium">{collection.owner.name} · {collection.owner.email}</p>
            </div>

            {/* Stats pills */}
            <div className="flex gap-3 flex-wrap">
              {[
                { label: "PDF", value: allPdfs.length },
                { label: "Terindeks", value: counts.indexed },
                { label: "Progress", value: `${indexProgress}%` },
              ].map(({ label, value }) => (
                <div key={label} className="text-center px-4 py-2.5 rounded-xl" style={{ background: "rgba(255,255,255,0.3)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.45)" }}>
                  <p className="text-lg font-bold text-[#0C0D1A]">{value}</p>
                  <p className="text-[11px] font-semibold text-indigo-900/60">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

        <div className="grid lg:grid-cols-3 gap-7">

          {/* LEFT COLUMN */}
          <div className="lg:col-span-2">

            {/* Collection card */}
            <div className="bg-white rounded-[1.25rem] border border-[rgba(12,13,26,0.07)] shadow-[0_1px_3px_rgba(12,13,26,0.05)] p-7 mb-6">
              {/* Owner */}
              <div className="flex items-center gap-3 mb-5 pb-5 border-b border-[rgba(12,13,26,0.07)]">
                <Avatar initials={collection.owner.initials} color={collection.owner.avatarColor} size="md" />
                <div>
                  <p className="font-semibold text-slate-900 text-sm">{collection.owner.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{collection.owner.email} · NIM {collection.owner.nim}</p>
                </div>
              </div>

              <p className="text-sm text-slate-600 leading-relaxed mb-5">{collection.description}</p>

              {/* Keywords */}
              <div className="flex flex-wrap gap-2 mb-6">
                {collection.keywords.map((kw) => (
                  <span key={kw} className="text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full">
                    {kw}
                  </span>
                ))}
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => runCollectionSearch(collection.keywords[0] || collection.fieldName)}>
                  <Search className="w-4 h-4" />
                  Cari dalam Koleksi
                </Button>
                <Button variant="outline" onClick={handleShare}>
                  {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Share2 className="w-4 h-4" />}
                  {copied ? "Disalin!" : "Bagikan Koleksi"}
                </Button>
                {isOwner && (
                  <Button variant="secondary" onClick={openUploadModal}>
                    <Upload className="w-4 h-4" />
                    Unggah PDF
                  </Button>
                )}
                {isOwner && (
                  <Button variant="outline" onClick={() => navigate({ name: "create-collection", projectId: collection.id })}>
                    <Edit2 className="w-4 h-4" />
                    Edit Koleksi
                  </Button>
                )}
                {isOwner && (
                  <Button variant="danger" onClick={handleDeleteCollection}>
                    <Trash2 className="w-4 h-4" />
                    Hapus
                  </Button>
                )}
              </div>
            </div>

            {/* PDF list */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  Literatur PDF ({allPdfs.length})
                </p>
                {isOwner && (
                  <Button size="xs" variant="secondary" onClick={openUploadModal}>
                    <Upload className="w-3 h-3" />
                    Tambah PDF
                  </Button>
                )}
              </div>

              {/* Search + filter */}
              <div className="flex gap-2 mb-4">
                <div className="flex-1 flex items-center bg-white border border-[rgba(12,13,26,0.1)] rounded-xl focus-within:ring-2 focus-within:ring-indigo-200 focus-within:border-indigo-400 transition-all">
                  <Search className="w-3.5 h-3.5 text-slate-400 ml-3.5 shrink-0" />
                  <input
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && searchQuery.trim()) {
                        event.preventDefault();
                        runCollectionSearch(searchQuery);
                      }
                    }}
                    placeholder="Cari dalam koleksi ini..."
                    className="flex-1 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none bg-transparent"
                  />
                </div>
              </div>

              {/* Status chips */}
              <div className="flex flex-wrap gap-2 mb-4">
                {([
                  ["all", "Semua"],
                  ["indexed", "Terindeks"],
                  ["pending", "Menunggu"],
                  ["processing", "Memproses"],
                  ["failed", "Gagal"],
                ] as const).map(([value, label]) => (
                  <button
                    key={value}
                    onClick={() => setActiveFilter(value)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-semibold border transition-all",
                      activeFilter === value
                        ? "bg-[#0C0D1A] text-white border-transparent"
                        : "bg-white text-slate-600 border-[rgba(12,13,26,0.1)] hover:border-indigo-300 hover:text-indigo-600"
                    )}
                  >
                    {label}
                    <span className={cn("ml-1.5 text-[10px]", activeFilter === value ? "text-white/60" : "text-slate-400")}>
                      {counts[value]}
                    </span>
                  </button>
                ))}
              </div>

              <div className="flex flex-col gap-2.5">
                {documentsState.isLoading && (
                  <div className="text-center py-12 text-slate-400 text-sm bg-white rounded-2xl border border-[rgba(12,13,26,0.07)]">
                    <FileText className="w-8 h-8 text-slate-200 mx-auto mb-2" strokeWidth={1.5} />
                    Memuat literatur PDF dari API...
                  </div>
                )}

                {!documentsState.isLoading && documentsState.error && (
                  <div className="text-center py-10 text-sm bg-white rounded-2xl border border-red-100">
                    <AlertTriangle className="w-8 h-8 text-red-300 mx-auto mb-2" strokeWidth={1.5} />
                    <p className="text-red-600 font-semibold mb-3">{documentsState.error}</p>
                    <Button size="sm" variant="outline" onClick={() => void documentsState.refresh()}>
                      Coba Lagi
                    </Button>
                  </div>
                )}

                {!documentsState.isLoading && !documentsState.error && filteredPdfs.map((pdf) => (
                  <div
                    key={pdf.id}
                    className="bg-white rounded-xl border border-[rgba(12,13,26,0.07)] shadow-[0_1px_2px_rgba(12,13,26,0.04)] p-4 hover:border-[rgba(12,13,26,0.12)] transition-all"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center shrink-0">
                        <FileText className="w-4.5 h-4.5 text-red-500" strokeWidth={1.5} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h3 className="font-semibold text-sm text-[#0C0D1A] leading-snug line-clamp-2">{pdf.title}</h3>
                            <p className="text-[11px] text-slate-400 font-medium mt-1 line-clamp-1">{pdf.original_filename}</p>
                          </div>
                          <button className="p-1.5 text-slate-300 hover:text-slate-600 rounded-lg hover:bg-slate-100 shrink-0 transition-all" title="Aksi dokumen">
                            <MoreHorizontal className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <StatusDot status={pdf.index_status} />
                          <span className="text-[11px] text-slate-400 font-medium">{pdf.total_pages} hal.</span>
                          <span className="text-slate-200">·</span>
                          <span className="text-[11px] text-slate-400 font-medium">{formatFileSize(pdf.file_size)}</span>
                          <span className="text-slate-200">·</span>
                          <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                            <Clock className="w-3 h-3" />{getDocumentDate(pdf)}
                          </span>
                        </div>
                        {pdf.index_message && (pdf.index_status === "failed" || pdf.index_status === "pending" || pdf.index_status === "processing") && (
                          <div className={cn(
                            "mt-2 flex items-start gap-1.5 border rounded-lg px-3 py-2",
                            pdf.index_status === "failed" ? "bg-red-50 border-red-100" : "bg-amber-50 border-amber-100"
                          )}>
                            <AlertTriangle className={cn(
                              "w-3.5 h-3.5 shrink-0 mt-0.5",
                              pdf.index_status === "failed" ? "text-red-500" : "text-amber-500"
                            )} />
                            <p className={cn(
                              "text-xs font-medium",
                              pdf.index_status === "failed" ? "text-red-600" : "text-amber-700"
                            )}>
                              {pdf.index_message}
                            </p>
                          </div>
                        )}
                        <div className="flex flex-wrap items-center gap-1.5 mt-2">
                          <button
                            onClick={() => void handleOpenDocument(pdf)}
                            disabled={openingDocumentId === pdf.id}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 disabled:opacity-50 px-2.5 py-1 rounded-lg transition-all"
                          >
                            <BookOpen className="w-3 h-3" />
                            {openingDocumentId === pdf.id ? "Membuka..." : "Buka PDF"}
                          </button>
                          {isOwner && (
                            <button
                              onClick={() => beginEditDocument(pdf)}
                              disabled={mutationDocumentId === pdf.id}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 px-2.5 py-1 rounded-lg transition-all"
                            >
                              <Edit2 className="w-3 h-3" />
                              Edit Judul
                            </button>
                          )}
                          {isOwner && (
                            <button
                              onClick={() => void handleReindexDocument(pdf)}
                              disabled={mutationDocumentId === pdf.id}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-violet-600 hover:text-violet-700 bg-violet-50 hover:bg-violet-100 disabled:opacity-50 px-2.5 py-1 rounded-lg transition-all"
                            >
                              <RefreshCcw className="w-3 h-3" />
                              Re-index
                            </button>
                          )}
                          {isOwner && (
                            <button
                              onClick={() => void handleDeleteDocument(pdf)}
                              disabled={mutationDocumentId === pdf.id}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 disabled:opacity-50 px-2.5 py-1 rounded-lg transition-all"
                            >
                              <Trash2 className="w-3 h-3" />
                              Hapus
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {!documentsState.isLoading && !documentsState.error && filteredPdfs.length === 0 && (
                  <div className="text-center py-12 text-slate-400 text-sm bg-white rounded-2xl border border-[rgba(12,13,26,0.07)]">
                    <FileText className="w-8 h-8 text-slate-200 mx-auto mb-2" strokeWidth={1.5} />
                    {allPdfs.length === 0 ? "Belum ada literatur PDF pada koleksi ini." : "Tidak ada PDF yang cocok dengan filter saat ini."}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT SIDEBAR */}
          <div className="flex flex-col gap-5">

            {/* Indexing progress card */}
            <div className="bg-white rounded-[1.125rem] border border-[rgba(12,13,26,0.07)] shadow-[0_1px_3px_rgba(12,13,26,0.05)] p-5">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Progres Indexing</p>

              <div className="flex items-end justify-between mb-3">
                <span className="text-3xl font-bold text-[#0C0D1A]">{indexProgress}%</span>
                <span className="text-xs font-medium text-slate-400">{counts.indexed}/{allPdfs.length} PDF</span>
              </div>

              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden mb-4">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${indexProgress}%` }}
                />
              </div>

              <div className="flex flex-col gap-2.5">
                {([
                  { k: "indexed" as const, label: "Berhasil Terindeks", count: counts.indexed, color: "bg-emerald-500" },
                  { k: "processing" as const, label: "Memproses", count: counts.processing, color: "bg-indigo-500" },
                  { k: "pending" as const, label: "Menunggu", count: counts.pending, color: "bg-amber-400" },
                  { k: "failed" as const, label: "Gagal", count: counts.failed, color: "bg-red-500" },
                ]).map(({ k, label, count, color }) => (
                  <div key={k} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className={cn("w-2 h-2 rounded-full", color, k === "processing" && "animate-pulse")} />
                      <span className="text-slate-600 font-medium">{label}</span>
                    </div>
                    <span className="font-bold text-slate-900">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Info card */}
            <div className="bg-white rounded-[1.125rem] border border-[rgba(12,13,26,0.07)] shadow-[0_1px_3px_rgba(12,13,26,0.05)] p-5">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Informasi</p>
              <div className="flex flex-col gap-3">
                {[
                  ["Dibuat", collection.createdAt],
                  ["Diperbarui", collection.lastUpdated],
                  ["Email", collection.owner.email],
                  ["NIM", collection.owner.nim],
                ].map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between gap-2">
                    <span className="text-xs text-slate-400 font-medium">{key}</span>
                    <span className="text-xs font-semibold text-slate-700 text-right">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick search CTA */}
            <button
              onClick={() => runCollectionSearch(collection.keywords[0] || collection.fieldName)}
              className="group bg-[#0C0D1A] hover:bg-[#13142A] rounded-[1.125rem] p-5 text-left transition-all"
            >
              <Search className="w-5 h-5 text-indigo-400 mb-3" strokeWidth={1.75} />
              <p className="font-bold text-white text-sm mb-1">Cari dalam koleksi ini</p>
              <p className="text-slate-500 text-xs leading-relaxed">Gunakan TF-IDF untuk menemukan halaman relevan</p>
              <div className="flex items-center gap-1 mt-3 text-xs font-semibold text-indigo-400 group-hover:text-indigo-300">
                Mulai mencari <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>
          </div>
        </div>
      </div>

      <Dialog.Root open={Boolean(editingDocument)} onOpenChange={(open) => !open && setEditingDocument(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-50 animate-in fade-in duration-150" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md bg-white rounded-[1.5rem] shadow-2xl shadow-black/20 overflow-hidden animate-in fade-in zoom-in-95 duration-200 mx-4">
            <div className="flex items-center justify-between px-6 py-5 border-b border-[rgba(12,13,26,0.07)]">
              <div>
                <Dialog.Title className="font-bold text-[#0C0D1A] text-sm">Edit Judul Dokumen</Dialog.Title>
                <Dialog.Description className="text-[11px] text-slate-400 font-medium mt-0.5">
                  Metadata PDF diperbarui tanpa mengubah file asli.
                </Dialog.Description>
              </div>
              <Dialog.Close asChild>
                <button className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all">
                  <X className="w-4 h-4" />
                </button>
              </Dialog.Close>
            </div>
            <form onSubmit={(event) => void handleSaveDocumentTitle(event)} className="px-6 py-5">
              <InputField
                label="Judul PDF"
                value={editTitle}
                onChange={(event) => setEditTitle(event.target.value)}
                autoFocus
              />
              <div className="flex items-center justify-end gap-2 mt-5">
                <Button type="button" variant="outline" size="sm" onClick={() => setEditingDocument(null)}>
                  Batal
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  loading={mutationDocumentId === editingDocument?.id}
                  disabled={mutationDocumentId === editingDocument?.id}
                >
                  Simpan
                </Button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}

function ArrowRight({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 8h10M9 4l4 4-4 4" />
    </svg>
  );
}
