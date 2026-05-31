import { useCallback, useEffect, useState } from "react";
import {
  Search, ArrowRight, Network, Brain, Cpu, Database, BarChart2, Code2, BookOpen,
  FileText, ChevronRight, Edit2, Trash2, Plus, X, type LucideIcon,
} from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { toast } from "sonner";
import { useApp } from "../context";
import { useAuth } from "../../contexts/AuthContext";
import { getSafeErrorMessage } from "../../lib/api-error";
import { adaptField, adaptProject, type FieldDisplay, type ProjectDisplay } from "../../lib/domain-display";
import { fieldService } from "../../services/field-service";
import { projectService } from "../../services/project-service";
import { Navbar } from "./Navbar";
import { Avatar, Button, InputField, TextareaField, cn } from "./ui";

const ICON_MAP: Record<string, LucideIcon> = {
  Network, Brain, Cpu, Database, BarChart2, Code2, BookOpen,
};

function FieldCard({
  field,
  index,
  isAdmin,
  onClick,
  onEdit,
  onDelete,
  onToggleActive,
}: {
  field: FieldDisplay;
  index: number;
  isAdmin: boolean;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
}) {
  const IconComp = ICON_MAP[field.iconName] || BookOpen;
  const isDark = index === 0 || index === 3;

  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative rounded-[1.25rem] p-6 cursor-pointer overflow-hidden transition-all duration-200",
        isDark
          ? "bg-[#0C0D1A] hover:bg-[#13142A] border border-white/5"
          : "bg-white border border-[rgba(12,13,26,0.07)] shadow-[0_1px_3px_rgba(12,13,26,0.05)] hover:shadow-[0_6px_20px_rgba(12,13,26,0.09)]",
      )}
    >
      {isDark && (
        <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/3 rounded-full pointer-events-none" />
      )}

      <div className={cn("w-11 h-11 rounded-[14px] flex items-center justify-center mb-5", isDark ? "bg-white/10" : field.bgColor)}>
        <IconComp className={cn("w-5 h-5", isDark ? "text-white/70" : field.color)} strokeWidth={1.75} />
      </div>

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className={cn(
            "font-bold text-base mb-2 tracking-tight",
            isDark ? "text-white" : "text-[#0C0D1A] group-hover:text-indigo-700 transition-colors"
          )}>
            {field.name}
          </h3>
          {!field.isActive && (
            <span className="inline-flex mb-2 text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
              Nonaktif
            </span>
          )}
        </div>
        {isAdmin && (
          <div className="flex items-center gap-1 shrink-0" onClick={(event) => event.stopPropagation()}>
            <button onClick={onEdit} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all" title="Edit bidang">
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button onClick={onDelete} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all" title="Hapus bidang">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      <p className={cn("text-sm leading-relaxed mb-5 line-clamp-2", isDark ? "text-slate-500" : "text-slate-500")}>
        {field.description || "Belum ada deskripsi bidang penelitian."}
      </p>

      <div className="flex items-center justify-between">
        <div className={cn("flex items-center gap-3 text-xs font-medium", isDark ? "text-slate-600" : "text-slate-400")}>
          <span>{field.collectionCount} koleksi</span>
          <span className="opacity-40">·</span>
          <span>PDF belum terhubung</span>
        </div>
        <ArrowRight className={cn(
          "w-4 h-4 group-hover:translate-x-1 transition-transform",
          isDark ? "text-slate-700 group-hover:text-indigo-400" : "text-slate-300 group-hover:text-indigo-500"
        )} />
      </div>

      {isAdmin && (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onToggleActive();
          }}
          className={cn(
            "mt-4 text-[11px] font-semibold px-3 py-1 rounded-full transition-all",
            field.isActive ? "bg-slate-100 text-slate-500 hover:bg-amber-50 hover:text-amber-700" : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
          )}
        >
          {field.isActive ? "Nonaktifkan" : "Aktifkan"}
        </button>
      )}
    </div>
  );
}

function FieldDetailView({ fieldId }: { fieldId: number }) {
  const { navigate } = useApp();
  const [searchQuery, setSearchQuery] = useState("");
  const [field, setField] = useState<FieldDisplay | null>(null);
  const [collections, setCollections] = useState<ProjectDisplay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDetail = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [fieldResponse, projectResponse] = await Promise.all([
        fieldService.get(fieldId),
        projectService.list({ field_id: fieldId, page_size: 100, sort_by: "newest" }),
      ]);
      setField(adaptField(fieldResponse));
      setCollections(projectResponse.items.map(adaptProject));
    } catch (err) {
      setError(getSafeErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [fieldId]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F5F4F1]">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 text-center text-sm text-slate-400">
          Memuat detail bidang penelitian dari API...
        </div>
      </div>
    );
  }

  if (error || !field) {
    return (
      <div className="min-h-screen bg-[#F5F4F1]">
        <Navbar />
        <div className="max-w-xl mx-auto px-4 sm:px-6 py-16 text-center">
          <div className="bg-white rounded-[1.25rem] border border-red-100 p-8">
            <p className="text-sm font-semibold text-red-600 mb-4">{error || "Bidang tidak ditemukan."}</p>
            <Button onClick={loadDetail}>Coba Lagi</Button>
          </div>
        </div>
      </div>
    );
  }

  const IconComp = ICON_MAP[field.iconName] || BookOpen;
  const runScopedSearch = () => {
    const query = searchQuery.trim() || field.name;
    navigate({ name: "search", query, researchFieldId: field.apiId, sortBy: "relevance", page: 1 });
  };

  return (
    <div className="min-h-screen bg-[#F5F4F1]">
      <Navbar />

      <div className="relative overflow-hidden" style={{ background: "linear-gradient(145deg, #c7d2fe 0%, #ddd6fe 45%, #a5f3fc 100%)" }}>
        <div className="absolute pointer-events-none" style={{ top: "-30%", left: "-5%", width: "60vw", height: "60vw", maxWidth: 520, maxHeight: 520, borderRadius: "50%", background: "#6366f1", filter: "blur(100px)", opacity: 0.45 }} />
        <div className="absolute pointer-events-none" style={{ bottom: "-20%", right: "-5%", width: "50vw", height: "50vw", maxWidth: 440, maxHeight: 440, borderRadius: "50%", background: "#8b5cf6", filter: "blur(100px)", opacity: 0.4 }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-800/60 mb-8">
            <button onClick={() => navigate({ name: "fields" })} className="hover:text-indigo-900 transition-colors">
              Bidang Penelitian
            </button>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-indigo-900">{field.name}</span>
          </div>

          <div className="grid lg:grid-cols-[1fr_auto] gap-8 items-end">
            <div>
              <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-5 shadow-[0_4px_16px_rgba(0,0,0,0.1)]", field.bgColor)}>
                <IconComp className={cn("w-7 h-7", field.color)} strokeWidth={1.75} />
              </div>
              <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-[0.12em] mb-2">Bidang Penelitian</p>
              <h1 className="text-3xl font-bold text-[#0C0D1A] tracking-[-0.025em] mb-3">{field.name}</h1>
              <p className="text-slate-600 text-sm max-w-xl leading-relaxed">{field.description || "Belum ada deskripsi bidang penelitian."}</p>
            </div>

            <div className="grid grid-cols-3 gap-4 lg:gap-6">
              {[
                { val: field.collectionCount, lbl: "Koleksi" },
                { val: "—", lbl: "Literatur" },
                { val: field.isActive ? "Aktif" : "Nonaktif", lbl: "Status" },
              ].map(({ val, lbl }) => (
                <div key={lbl} className="text-center p-4 rounded-2xl" style={{ background: "rgba(255,255,255,0.3)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.5)" }}>
                  <p className="text-2xl font-bold text-[#0C0D1A]">{val}</p>
                  <p className="text-xs font-semibold text-slate-600 mt-0.5">{lbl}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex gap-3 mb-8">
          <div className="flex-1 flex items-center bg-white border border-[rgba(12,13,26,0.1)] rounded-xl overflow-hidden shadow-sm focus-within:ring-2 focus-within:ring-indigo-200 focus-within:border-indigo-400 transition-all">
            <Search className="w-4 h-4 text-slate-400 ml-4 shrink-0" />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  runScopedSearch();
                }
              }}
              placeholder={`Cari dalam ${field.name}...`}
              className="flex-1 px-3 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none bg-transparent"
            />
          </div>
          <Button onClick={runScopedSearch}>
            <Search className="w-4 h-4" />
            Cari
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-7">
          <div className="lg:col-span-2">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Koleksi Penelitian ({collections.length})</p>
            <div className="flex flex-col gap-3">
              {collections.length === 0 ? (
                <div className="bg-white rounded-2xl border border-[rgba(12,13,26,0.07)] p-10 text-center text-slate-400 text-sm">
                  Belum ada koleksi pada bidang ini.
                </div>
              ) : (
                collections.map((collection) => (
                  <div
                    key={collection.id}
                    onClick={() => navigate({ name: "collection", collectionId: collection.id })}
                    className="group bg-white rounded-[1.125rem] border border-[rgba(12,13,26,0.07)] shadow-[0_1px_3px_rgba(12,13,26,0.05)] hover:shadow-[0_4px_14px_rgba(12,13,26,0.08)] hover:border-[rgba(12,13,26,0.12)] p-4 cursor-pointer transition-all duration-200"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                        <BookOpen className="w-4 h-4 text-indigo-600" strokeWidth={1.75} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm text-[#0C0D1A] line-clamp-2 leading-snug group-hover:text-indigo-700 transition-colors">
                          {collection.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-2">
                          <Avatar initials={collection.owner.initials} color={collection.owner.avatarColor} size="xs" />
                          <span className="text-xs font-medium text-slate-500">{collection.owner.name}</span>
                          <span className="text-slate-200">·</span>
                          <span className="text-xs text-slate-400">{collection.pdfCount} PDF</span>
                          <span className="text-slate-200">·</span>
                          <span className="text-xs text-slate-400">{collection.lastUpdated}</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {collection.keywords.slice(0, 3).map((kw) => (
                            <span key={kw} className="text-[10px] font-semibold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{kw}</span>
                          ))}
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all shrink-0" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">PDF Terbaru</p>
            <div className="bg-white rounded-xl border border-[rgba(12,13,26,0.07)] p-6 text-center">
              <FileText className="w-8 h-8 text-slate-200 mx-auto mb-2" strokeWidth={1.5} />
              <p className="text-sm text-slate-400">Daftar PDF belum diintegrasikan pada Tahap 7A.</p>
              <p className="text-[11px] text-slate-400 mt-1">Upload, indexing, dan dokumen tetap masuk Tahap 7B.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FieldFormModal({
  open,
  editingField,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  editingField: FieldDisplay | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
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
              <Dialog.Description className="sr-only">
                Form untuk menambah atau mengubah bidang penelitian Litera.
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all">
                <X className="w-4 h-4" />
              </button>
            </Dialog.Close>
          </div>
          <div className="p-6">
            <form onSubmit={onSubmit} className="flex flex-col gap-4">
              <InputField
                label="Nama Bidang"
                name="name"
                placeholder="Contoh: Jaringan Komputer"
                defaultValue={editingField?.name}
                required
              />
              <TextareaField
                label="Deskripsi"
                name="description"
                placeholder="Deskripsi singkat bidang penelitian ini..."
                defaultValue={editingField?.description}
                rows={3}
              />
              <InputField
                label="Ikon"
                name="icon"
                placeholder="Network, Brain, Cpu, Database..."
                defaultValue={editingField?.iconName || "BookOpen"}
                hint="Gunakan nama ikon Lucide yang sudah dipakai desain."
              />
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <input type="checkbox" name="is_active" defaultChecked={editingField?.isActive ?? true} className="w-4 h-4 rounded accent-indigo-600" />
                Bidang aktif
              </label>
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
  );
}

export function ResearchFieldsPage({ fieldId }: { fieldId?: string }) {
  const { navigate } = useApp();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [searchQuery, setSearchQuery] = useState("");
  const [fields, setFields] = useState<FieldDisplay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fieldModalOpen, setFieldModalOpen] = useState(false);
  const [editingField, setEditingField] = useState<FieldDisplay | null>(null);

  const loadFields = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fieldService.list({
        page_size: 100,
        search: searchQuery || undefined,
        include_inactive: isAdmin,
      });
      setFields(response.items.map(adaptField));
    } catch (err) {
      setError(getSafeErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [isAdmin, searchQuery]);

  useEffect(() => {
    loadFields();
  }, [loadFields]);

  if (fieldId) {
    return <FieldDetailView fieldId={Number(fieldId)} />;
  }

  async function handleFieldSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = {
      name: String(form.get("name") || "").trim(),
      description: String(form.get("description") || "").trim(),
      icon: String(form.get("icon") || "BookOpen").trim(),
      is_active: form.get("is_active") === "on",
    };

    if (!payload.name) {
      toast.error("Nama bidang wajib diisi.");
      return;
    }

    try {
      if (editingField) {
        await fieldService.update(editingField.apiId, payload);
        toast.success("Bidang penelitian berhasil diperbarui.");
      } else {
        await fieldService.create(payload);
        toast.success("Bidang penelitian berhasil ditambahkan.");
      }
      setFieldModalOpen(false);
      setEditingField(null);
      await loadFields();
    } catch (err) {
      toast.error(getSafeErrorMessage(err));
    }
  }

  async function handleDelete(field: FieldDisplay) {
    if (!window.confirm(`Hapus bidang "${field.name}"?`)) return;
    try {
      await fieldService.remove(field.apiId);
      toast.success("Bidang penelitian berhasil dihapus.");
      await loadFields();
    } catch (err) {
      toast.error(getSafeErrorMessage(err));
    }
  }

  async function handleToggleActive(field: FieldDisplay) {
    try {
      await fieldService.update(field.apiId, { is_active: !field.isActive });
      toast.success(field.isActive ? "Bidang dinonaktifkan." : "Bidang diaktifkan.");
      await loadFields();
    } catch (err) {
      toast.error(getSafeErrorMessage(err));
    }
  }

  return (
    <div className="min-h-screen bg-[#F5F4F1]">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-12 pb-8">
        <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-3">Jelajahi</p>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5">
          <div>
            <h1 className="text-3xl font-bold text-[#0C0D1A] tracking-tight mb-2">Bidang Penelitian</h1>
            <p className="text-slate-500 text-base max-w-lg">
              Temukan koleksi literatur yang dikategorikan berdasarkan bidang keilmuan
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <div className="flex items-center gap-2 bg-white border border-[rgba(12,13,26,0.1)] rounded-xl px-4 py-2.5 shadow-sm w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Cari bidang atau topik..."
                className="flex-1 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none bg-transparent"
              />
            </div>
            {isAdmin && (
              <Button onClick={() => { setEditingField(null); setFieldModalOpen(true); }}>
                <Plus className="w-4 h-4" />
                Tambah Bidang
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { val: fields.reduce((sum, field) => sum + field.collectionCount, 0), lbl: "Total Koleksi", color: "text-indigo-600", bg: "bg-indigo-50" },
            { val: "—", lbl: "Total PDF", color: "text-emerald-600", bg: "bg-emerald-50" },
            { val: fields.length, lbl: "Bidang", color: "text-violet-600", bg: "bg-violet-50" },
          ].map(({ val, lbl, color, bg }) => (
            <div key={lbl} className={cn("rounded-2xl p-4 sm:p-5 text-center", bg)}>
              <p className={cn("text-xl sm:text-2xl font-bold", color)}>{val}</p>
              <p className="text-xs font-medium text-slate-500 mt-0.5">{lbl}</p>
            </div>
          ))}
        </div>

        {isLoading && (
          <div className="bg-white rounded-[1.25rem] border border-[rgba(12,13,26,0.07)] p-12 text-center text-sm text-slate-400">
            Memuat bidang penelitian dari API...
          </div>
        )}

        {!isLoading && error && (
          <div className="bg-white rounded-[1.25rem] border border-red-100 p-8 text-center">
            <p className="text-sm font-semibold text-red-600 mb-4">{error}</p>
            <Button onClick={loadFields}>Coba Lagi</Button>
          </div>
        )}

        {!isLoading && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {fields.map((field, index) => (
              <FieldCard
                key={field.id}
                field={field}
                index={index}
                isAdmin={isAdmin}
                onClick={() => navigate({ name: "field-detail", fieldId: field.id })}
                onEdit={() => { setEditingField(field); setFieldModalOpen(true); }}
                onDelete={() => handleDelete(field)}
                onToggleActive={() => handleToggleActive(field)}
              />
            ))}
          </div>
        )}

        {!isLoading && !error && fields.length === 0 && (
          <div className="text-center py-20 text-slate-400">
            <p className="font-semibold text-slate-600 mb-1">Tidak ada bidang ditemukan</p>
            <p className="text-sm">Coba kata kunci lain atau tambahkan bidang baru sebagai admin.</p>
          </div>
        )}
      </div>

      <FieldFormModal
        open={fieldModalOpen}
        editingField={editingField}
        onOpenChange={(open) => {
          setFieldModalOpen(open);
          if (!open) setEditingField(null);
        }}
        onSubmit={handleFieldSubmit}
      />
    </div>
  );
}
