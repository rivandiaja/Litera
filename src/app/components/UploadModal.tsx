import { useCallback, useEffect, useRef, useState, type DragEvent } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  CloudUpload,
  FileText,
  Loader2,
  Trash2,
  Upload,
  X,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { useApp } from "../context";
import { getSafeErrorMessage } from "../../lib/api-error";
import { documentService } from "../../services/document-service";
import { projectService } from "../../services/project-service";
import type { IndexStatus } from "../../types/document";
import { Button, cn } from "./ui";

type FileStatus = "queued" | "uploading" | IndexStatus;

interface UploadFile {
  id: string;
  name: string;
  size: string;
  sizeBytes: number;
  progress: number;
  status: FileStatus;
  file?: File;
  documentId?: number;
  error?: string;
}

interface UploadCollection {
  id: string;
  title: string;
}

const MAX_FILES_PER_BATCH = 10;
const MAX_PDF_SIZE_MB = 15;
const MAX_PDF_SIZE_BYTES = MAX_PDF_SIZE_MB * 1024 * 1024;

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isPdfFile(file: File) {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

function createUploadFile(file: File, currentCount: number): UploadFile {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const base = {
    id,
    name: file.name,
    size: formatSize(file.size),
    sizeBytes: file.size,
    progress: 0,
  };

  if (currentCount >= MAX_FILES_PER_BATCH) {
    return {
      ...base,
      status: "failed",
      error: `Maksimal ${MAX_FILES_PER_BATCH} file per batch upload.`,
    };
  }

  if (!isPdfFile(file)) {
    return {
      ...base,
      status: "failed",
      error: "Hanya file PDF yang diterima.",
    };
  }

  if (file.size <= 0) {
    return {
      ...base,
      status: "failed",
      error: "File PDF kosong tidak dapat diunggah.",
    };
  }

  if (file.size > MAX_PDF_SIZE_BYTES) {
    return {
      ...base,
      status: "failed",
      error: `Ukuran PDF melebihi batas ${MAX_PDF_SIZE_MB} MB.`,
    };
  }

  return {
    ...base,
    status: "queued",
    file,
  };
}

const STATUS_CONFIG: Record<FileStatus, { icon: LucideIcon; label: string; color: string; spin?: boolean }> = {
  queued: { icon: FileText, label: "Siap Diunggah", color: "text-slate-400", spin: false },
  uploading: { icon: Loader2, label: "Mengunggah", color: "text-indigo-500", spin: true },
  pending: { icon: Loader2, label: "Menunggu Indexing", color: "text-amber-500", spin: true },
  processing: { icon: Loader2, label: "Memproses Teks", color: "text-violet-500", spin: true },
  indexed: { icon: CheckCircle2, label: "Berhasil Terindeks", color: "text-emerald-500", spin: false },
  failed: { icon: XCircle, label: "Gagal Diproses", color: "text-red-500", spin: false },
};

export function UploadModal() {
  const {
    showUploadModal,
    setShowUploadModal,
    uploadTargetCollectionId,
    setUploadTargetCollectionId,
    notifyDocumentsChanged,
  } = useApp();
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState(uploadTargetCollectionId ?? "");
  const [collections, setCollections] = useState<UploadCollection[]>([]);
  const [isLoadingCollections, setIsLoadingCollections] = useState(false);
  const [collectionsError, setCollectionsError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!showUploadModal) return;

    let active = true;
    setIsLoadingCollections(true);
    setCollectionsError(null);

    projectService.listMine({ page: 1, page_size: 100 })
      .then((response) => {
        if (!active) return;
        const loaded = response.items.map((project) => ({
          id: String(project.id),
          title: project.title,
        }));
        setCollections(loaded);
        setSelectedCollection((current) => uploadTargetCollectionId || current || loaded[0]?.id || "");
      })
      .catch((err) => {
        if (!active) return;
        setCollectionsError(getSafeErrorMessage(err));
        setSelectedCollection((current) => uploadTargetCollectionId || current);
      })
      .finally(() => {
        if (active) setIsLoadingCollections(false);
      });

    return () => {
      active = false;
    };
  }, [showUploadModal, uploadTargetCollectionId]);

  useEffect(() => {
    if (showUploadModal && uploadTargetCollectionId) {
      setSelectedCollection(uploadTargetCollectionId);
    }
  }, [showUploadModal, uploadTargetCollectionId]);

  const addFiles = useCallback((fileList: FileList) => {
    const incoming = Array.from(fileList);
    if (incoming.length === 0) return;

    setFiles((previous) => {
      let currentCount = previous.length;
      const nextFiles = incoming.map((file) => {
        const uploadFile = createUploadFile(file, currentCount);
        currentCount += 1;
        return uploadFile;
      });
      return [...previous, ...nextFiles];
    });

    const validCount = incoming.filter((file) => isPdfFile(file) && file.size > 0 && file.size <= MAX_PDF_SIZE_BYTES).length;
    if (validCount > 0) {
      toast.success(`${validCount} PDF siap diunggah`);
    } else {
      toast.error("Tidak ada PDF valid yang dapat diunggah");
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const handleDrop = useCallback((event: DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
    addFiles(event.dataTransfer.files);
  }, [addFiles]);

  function handleClose() {
    if (isUploading) {
      toast.error("Tunggu proses upload selesai.");
      return;
    }
    setFiles([]);
    setUploadTargetCollectionId(undefined);
    setShowUploadModal(false);
  }

  function removeFile(id: string) {
    setFiles((previous) => previous.filter((file) => file.id !== id));
  }

  async function handleUpload() {
    const queuedFiles = files.filter((file) => file.status === "queued" && file.file);
    if (!selectedCollection) {
      toast.error("Pilih koleksi tujuan terlebih dahulu.");
      return;
    }
    if (queuedFiles.length === 0) {
      toast.error("Pilih minimal satu PDF valid untuk diunggah.");
      return;
    }

    const projectId = Number(selectedCollection);
    if (!Number.isFinite(projectId)) {
      toast.error("Koleksi tujuan tidak valid.");
      return;
    }

    const queuedIds = new Set(queuedFiles.map((file) => file.id));
    setIsUploading(true);
    setFiles((previous) => previous.map((file) => (
      queuedIds.has(file.id)
        ? { ...file, status: "uploading", progress: 35, error: undefined }
        : file
    )));

    try {
      const response = await documentService.uploadProjectDocuments(
        projectId,
        queuedFiles.map((file) => file.file).filter((file): file is File => Boolean(file))
      );
      const remainingItems = [...response.items];

      setFiles((previous) => previous.map((file) => {
        if (!queuedIds.has(file.id)) return file;

        const matchIndex = remainingItems.findIndex((item) => item.original_filename === file.name);
        const result = matchIndex >= 0 ? remainingItems.splice(matchIndex, 1)[0] : undefined;
        if (!result) {
          return {
            ...file,
            status: "failed",
            progress: 100,
            error: "Server tidak mengembalikan status untuk file ini.",
          };
        }

        if (!result.accepted) {
          return {
            ...file,
            status: "failed",
            progress: 100,
            error: result.error || "PDF ditolak oleh server.",
          };
        }

        return {
          ...file,
          status: result.index_status || "pending",
          documentId: result.document_id || undefined,
          size: result.file_size ? formatSize(result.file_size) : file.size,
          progress: 100,
          error: undefined,
        };
      }));

      if (response.accepted_count > 0) {
        toast.success(`${response.accepted_count} PDF diterima dan masuk antrean indexing.`);
        notifyDocumentsChanged();
      }
      if (response.failed_count > 0) {
        toast.error(`${response.failed_count} PDF gagal diterima.`);
      }
    } catch (err) {
      const message = getSafeErrorMessage(err);
      setFiles((previous) => previous.map((file) => (
        queuedIds.has(file.id)
          ? { ...file, status: "failed", progress: 100, error: message }
          : file
      )));
      toast.error(message);
    } finally {
      setIsUploading(false);
    }
  }

  const selectedCollectionIsListed = collections.some((collection) => collection.id === selectedCollection);
  const queuedCount = files.filter((file) => file.status === "queued" && file.file).length;
  const active = files.filter((file) => file.status === "uploading").length;
  const done = files.filter((file) => file.status !== "queued" && file.status !== "uploading").length;
  const accepted = files.filter((file) => ["pending", "processing", "indexed"].includes(file.status)).length;
  const overallPct = files.length ? Math.round(((done + active * 0.35) / files.length) * 100) : 0;

  return (
    <Dialog.Root open={showUploadModal} onOpenChange={(open) => !open && handleClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-50 animate-in fade-in duration-150" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[calc(100vw-2rem)] sm:w-full max-w-xl max-h-[90vh] bg-white rounded-[1.5rem] shadow-2xl shadow-black/20 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">

          {/* Header */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-5 border-b border-[rgba(12,13,26,0.07)]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center">
                <CloudUpload className="w-4.5 h-4.5 text-indigo-600" strokeWidth={1.75} />
              </div>
              <div>
                <Dialog.Title className="font-bold text-[#0C0D1A] text-sm">Unggah Literatur PDF</Dialog.Title>
                <Dialog.Description className="text-[11px] text-slate-400 font-medium mt-0.5">
                  Maks. 10 file · {MAX_PDF_SIZE_MB} MB per file
                </Dialog.Description>
              </div>
            </div>
            <Dialog.Close asChild>
              <button
                disabled={isUploading}
                className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-50 rounded-xl transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </Dialog.Close>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 flex flex-col gap-4">

            {/* Collection selector */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Koleksi Tujuan</label>
              <div className="relative">
                <select
                  value={selectedCollection}
                  onChange={(event) => setSelectedCollection(event.target.value)}
                  disabled={isLoadingCollections || isUploading}
                  className="w-full pl-4 pr-10 py-2.5 bg-slate-50/80 border border-[rgba(12,13,26,0.1)] rounded-xl text-sm text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 appearance-none disabled:opacity-60"
                >
                  {!selectedCollection && <option value="">Pilih koleksi...</option>}
                  {selectedCollection && !selectedCollectionIsListed && (
                    <option value={selectedCollection}>Koleksi saat ini</option>
                  )}
                  {collections.map((collection) => (
                    <option key={collection.id} value={collection.id}>{collection.title}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
              {collectionsError && (
                <p className="text-[11px] text-red-500 font-medium">{collectionsError}</p>
              )}
            </div>

            {/* Drop zone */}
            <div
              onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => !isUploading && fileInputRef.current?.click()}
              className={cn(
                "border-2 border-dashed rounded-2xl py-12 text-center cursor-pointer transition-all duration-200 select-none relative overflow-hidden",
                isDragging
                  ? "border-indigo-400 bg-indigo-50/80 scale-[1.01]"
                  : "border-[rgba(12,13,26,0.1)] hover:border-indigo-300/70 hover:bg-slate-50/60",
                isUploading && "opacity-60 cursor-not-allowed"
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                multiple
                className="hidden"
                disabled={isUploading}
                onChange={(event) => event.target.files && addFiles(event.target.files)}
              />
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-all duration-200",
                isDragging ? "bg-indigo-100 scale-110" : "bg-slate-100"
              )}>
                <Upload className={cn("w-5 h-5 transition-colors", isDragging ? "text-indigo-600" : "text-slate-400")} strokeWidth={1.75} />
              </div>
              <p className="font-bold text-[#0C0D1A] text-sm mb-1">
                {isDragging ? "Lepaskan file di sini" : "Seret & lepas file PDF"}
              </p>
              <p className="text-xs text-slate-400 mt-1">atau <span className="text-indigo-600 font-semibold">klik untuk memilih file</span></p>
            </div>

            {/* Overall progress */}
            {files.length > 0 && (active > 0 || accepted > 0) && (
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {active > 0 ? (
                      <Loader2 className="w-3.5 h-3.5 text-indigo-600 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                    )}
                    <span className="text-xs font-bold text-indigo-700">{active > 0 ? `${active} file diunggah...` : `${accepted} PDF diterima backend`}</span>
                  </div>
                  <span className="text-xs text-indigo-500 font-semibold">{overallPct}%</span>
                </div>
                <div className="w-full bg-indigo-200/50 rounded-full h-1.5 overflow-hidden">
                  <div className="h-full bg-indigo-600 rounded-full transition-all duration-300" style={{ width: `${overallPct}%` }} />
                </div>
              </div>
            )}

            {/* File list */}
            {files.length > 0 && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    {files.length} File
                  </p>
                  {done > 0 && (
                    <p className="text-[11px] text-slate-400 font-medium">{accepted} diterima · {files.filter((file) => file.status === "failed").length} gagal</p>
                  )}
                </div>

                {files.map((file) => {
                  const cfg = STATUS_CONFIG[file.status];
                  const StatusIcon = cfg.icon;
                  return (
                    <div key={file.id}
                      className={cn(
                        "rounded-xl border p-3.5 transition-all",
                        file.status === "indexed" || file.status === "pending" || file.status === "processing" ? "bg-emerald-50/50 border-emerald-100" :
                        file.status === "failed" ? "bg-red-50/50 border-red-100" :
                        "bg-slate-50 border-[rgba(12,13,26,0.08)]"
                      )}>
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-red-50 rounded-xl flex items-center justify-center shrink-0">
                          <FileText className="w-3.5 h-3.5 text-red-500" strokeWidth={1.5} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-semibold text-slate-900 line-clamp-1 break-words">{file.name}</p>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <StatusIcon className={cn("w-3.5 h-3.5", cfg.color, cfg.spin && "animate-spin")} strokeWidth={2} />
                              <span className={cn("text-[10px] font-bold", cfg.color)}>{cfg.label}</span>
                            </div>
                          </div>
                          <p className="text-[11px] text-slate-400 font-medium mt-0.5">{file.size}</p>

                          {file.status === "uploading" && (
                            <div className="mt-2">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] text-slate-400">Mengunggah...</span>
                                <span className="text-[10px] font-bold text-indigo-600">{file.progress}%</span>
                              </div>
                              <div className="w-full bg-slate-200 rounded-full h-1 overflow-hidden">
                                <div className="h-full bg-indigo-500 rounded-full transition-all duration-200" style={{ width: `${file.progress}%` }} />
                              </div>
                            </div>
                          )}

                          {file.status === "failed" && file.error && (
                            <div className="mt-2 flex items-start gap-1.5 bg-red-50 border border-red-100 rounded-lg px-2.5 py-2">
                              <AlertTriangle className="w-3 h-3 text-red-500 shrink-0 mt-0.5" />
                              <p className="text-[11px] text-red-600 font-medium break-words">{file.error}</p>
                            </div>
                          )}
                        </div>
                        {["queued", "failed"].includes(file.status) && (
                          <button
                            onClick={() => removeFile(file.id)}
                            disabled={isUploading}
                            className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 disabled:opacity-50 rounded-lg transition-all shrink-0"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 sm:px-6 py-4 border-t border-[rgba(12,13,26,0.07)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50/50">
            <p className="text-xs text-slate-400 font-medium">
              {files.length === 0 ? "Belum ada file dipilih" : `${accepted}/${files.length} diterima backend`}
            </p>
            <div className="flex w-full flex-wrap justify-end gap-2 sm:w-auto">
              <Button variant="outline" size="sm" onClick={handleClose} disabled={isUploading}>
                Tutup
              </Button>
              <Button size="sm" onClick={handleUpload} disabled={queuedCount === 0 || isUploading || !selectedCollection} loading={isUploading}>
                Unggah
              </Button>
              <Button size="sm" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                <Upload className="w-3.5 h-3.5" />
                Tambah File
              </Button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
