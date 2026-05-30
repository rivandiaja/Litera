import { useState, useRef, useCallback } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Upload, FileText, CheckCircle2, XCircle, Loader2, AlertTriangle, ChevronDown, CloudUpload, Trash2 } from "lucide-react";
import { useApp } from "../context";
import { Button, StatusDot, cn } from "./ui";
import { COLLECTIONS } from "./data";
import { toast } from "sonner";

type FileStatus = "queued" | "uploading" | "pending" | "processing" | "indexed" | "failed";

interface UploadFile {
  id: string;
  name: string;
  size: string;
  sizeBytes: number;
  progress: number;
  status: FileStatus;
  error?: string;
}

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const STATUS_CONFIG: Record<FileStatus, { icon: React.ComponentType<{ className?: string }>; label: string; color: string; spin?: boolean }> = {
  queued: { icon: FileText, label: "Menunggu", color: "text-slate-400", spin: false },
  uploading: { icon: Loader2, label: "Mengunggah", color: "text-indigo-500", spin: true },
  pending: { icon: Loader2, label: "Menunggu Indexing", color: "text-amber-500", spin: true },
  processing: { icon: Loader2, label: "Memproses Teks", color: "text-violet-500", spin: true },
  indexed: { icon: CheckCircle2, label: "Berhasil Terindeks", color: "text-emerald-500", spin: false },
  failed: { icon: XCircle, label: "Gagal Diproses", color: "text-red-500", spin: false },
};

export function UploadModal() {
  const { showUploadModal, setShowUploadModal, uploadTargetCollectionId } = useApp();
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState(uploadTargetCollectionId ?? COLLECTIONS[0]?.id ?? "");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const myCollections = COLLECTIONS.filter((c) => c.owner.id === "u1");

  function simulateUpload(id: string) {
    let progress = 0;
    // Phase 1: uploading
    const upInterval = setInterval(() => {
      progress += 15 + Math.random() * 20;
      if (progress >= 100) {
        clearInterval(upInterval);
        setFiles((prev) => prev.map((f) => f.id === id ? { ...f, progress: 100, status: "pending" } : f));
        // Phase 2: processing
        setTimeout(() => {
          setFiles((prev) => prev.map((f) => f.id === id ? { ...f, status: "processing" } : f));
          setTimeout(() => {
            const willFail = Math.random() < 0.15;
            setFiles((prev) => prev.map((f) => f.id === id ? {
              ...f,
              status: willFail ? "failed" : "indexed",
              error: willFail ? "PDF tidak memiliki teks yang dapat diekstrak. Dokumen kemungkinan berisi gambar scan." : undefined,
            } : f));
            if (willFail) toast.error("1 PDF gagal diindeks");
          }, 1500 + Math.random() * 1000);
        }, 600 + Math.random() * 400);
      } else {
        setFiles((prev) => prev.map((f) => f.id === id ? { ...f, progress: Math.round(progress), status: "uploading" } : f));
      }
    }, 160);
  }

  function addFiles(fileList: FileList) {
    const pdfs = Array.from(fileList).filter((f) => f.type === "application/pdf" || f.name.endsWith(".pdf"));
    if (pdfs.length === 0) { toast.error("Hanya file PDF yang diterima"); return; }

    const newFiles: UploadFile[] = pdfs.map((f) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name: f.name,
      size: formatSize(f.size || Math.random() * 4 * 1024 * 1024 + 500 * 1024),
      sizeBytes: f.size,
      progress: 0,
      status: "queued",
    }));

    setFiles((prev) => [...prev, ...newFiles]);
    newFiles.forEach((f, i) => setTimeout(() => simulateUpload(f.id), i * 200 + 300));
    toast.success(`${pdfs.length} PDF siap diunggah`);
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    addFiles(e.dataTransfer.files);
  }, []);

  function handleClose() {
    const successCount = files.filter((f) => f.status === "indexed").length;
    if (successCount > 0) toast.success(`${successCount} PDF berhasil terindeks!`);
    setFiles([]);
    setShowUploadModal(false);
  }

  function removeFile(id: string) {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }

  const active = files.filter((f) => ["uploading", "pending", "processing"].includes(f.status)).length;
  const done = files.filter((f) => ["indexed", "failed"].includes(f.status)).length;
  const succeeded = files.filter((f) => f.status === "indexed").length;
  const overallPct = files.length ? Math.round((done / files.length) * 100) : 0;

  return (
    <Dialog.Root open={showUploadModal} onOpenChange={(open) => !open && handleClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-50 animate-in fade-in duration-150" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-xl max-h-[90vh] bg-white rounded-[1.5rem] shadow-2xl shadow-black/20 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 mx-4">

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-[rgba(12,13,26,0.07)]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center">
                <CloudUpload className="w-4.5 h-4.5 text-indigo-600" strokeWidth={1.75} />
              </div>
              <div>
                <Dialog.Title className="font-bold text-[#0C0D1A] text-sm">Unggah Literatur PDF</Dialog.Title>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5">Maks. 10 file · 50 MB per file</p>
              </div>
            </div>
            <Dialog.Close asChild>
              <button className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all">
                <X className="w-4 h-4" />
              </button>
            </Dialog.Close>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">

            {/* Collection selector */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Koleksi Tujuan</label>
              <div className="relative">
                <select
                  value={selectedCollection}
                  onChange={(e) => setSelectedCollection(e.target.value)}
                  className="w-full pl-4 pr-10 py-2.5 bg-slate-50/80 border border-[rgba(12,13,26,0.1)] rounded-xl text-sm text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 appearance-none"
                >
                  {myCollections.map((c) => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Drop zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "border-2 border-dashed rounded-2xl py-12 text-center cursor-pointer transition-all duration-200 select-none relative overflow-hidden",
                isDragging
                  ? "border-indigo-400 bg-indigo-50/80 scale-[1.01]"
                  : "border-[rgba(12,13,26,0.1)] hover:border-indigo-300/70 hover:bg-slate-50/60"
              )}
            >
              <input ref={fileInputRef} type="file" accept=".pdf,application/pdf" multiple className="hidden"
                onChange={(e) => e.target.files && addFiles(e.target.files)} />
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
            {files.length > 0 && active > 0 && (
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 text-indigo-600 animate-spin" />
                    <span className="text-xs font-bold text-indigo-700">{active} file diproses...</span>
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
                    <p className="text-[11px] text-slate-400 font-medium">{succeeded} berhasil · {files.filter((f) => f.status === "failed").length} gagal</p>
                  )}
                </div>

                {files.map((file) => {
                  const cfg = STATUS_CONFIG[file.status];
                  const StatusIcon = cfg.icon;
                  return (
                    <div key={file.id}
                      className={cn(
                        "rounded-xl border p-3.5 transition-all",
                        file.status === "indexed" ? "bg-emerald-50/50 border-emerald-100" :
                        file.status === "failed" ? "bg-red-50/50 border-red-100" :
                        "bg-slate-50 border-[rgba(12,13,26,0.08)]"
                      )}>
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-red-50 rounded-xl flex items-center justify-center shrink-0">
                          <FileText className="w-3.5 h-3.5 text-red-500" strokeWidth={1.5} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-semibold text-slate-900 line-clamp-1">{file.name}</p>
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
                              <p className="text-[11px] text-red-600 font-medium">{file.error}</p>
                            </div>
                          )}
                        </div>
                        {["queued", "failed"].includes(file.status) && (
                          <button onClick={() => removeFile(file.id)}
                            className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all shrink-0">
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
          <div className="px-6 py-4 border-t border-[rgba(12,13,26,0.07)] flex items-center justify-between gap-3 bg-slate-50/50">
            <p className="text-xs text-slate-400 font-medium">
              {files.length === 0 ? "Belum ada file dipilih" : `${succeeded}/${files.length} berhasil diindeks`}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleClose}>
                {active > 0 ? "Tutup & Lanjutkan" : "Tutup"}
              </Button>
              <Button size="sm" onClick={() => fileInputRef.current?.click()} disabled={active > 0}>
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
