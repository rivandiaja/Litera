import { useEffect, useState } from "react";
import { ArrowLeft, Plus, X, Globe, Lock, BookOpen, Lightbulb } from "lucide-react";
import { useApp } from "../context";
import { Button, InputField, TextareaField, cn } from "./ui";
import { getSafeErrorMessage } from "../../lib/api-error";
import { adaptField, type FieldDisplay } from "../../lib/domain-display";
import { fieldService } from "../../services/field-service";
import { projectService } from "../../services/project-service";
import { toast } from "sonner";

export function CreateCollectionPage({ projectId }: { projectId?: string }) {
  const { navigate } = useApp();
  const [title, setTitle] = useState("");
  const [fieldId, setFieldId] = useState("");
  const [description, setDescription] = useState("");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [kwInput, setKwInput] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [fields, setFields] = useState<FieldDisplay[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  const isEditing = Boolean(projectId);

  useEffect(() => {
    let active = true;

    async function loadFormData() {
      setInitialLoading(true);
      setLoadError(null);
      try {
        const [fieldResponse, projectResponse] = await Promise.all([
          fieldService.list({ page_size: 100 }),
          projectId ? projectService.get(Number(projectId)) : Promise.resolve(null),
        ]);
        if (!active) return;
        setFields(fieldResponse.items.map(adaptField));
        if (projectResponse) {
          setTitle(projectResponse.title);
          setFieldId(String(projectResponse.field.id));
          setDescription(projectResponse.description);
          setKeywords(projectResponse.keywords);
          setIsPublic(projectResponse.visibility === "public");
        }
      } catch (error) {
        if (active) setLoadError(getSafeErrorMessage(error));
      } finally {
        if (active) setInitialLoading(false);
      }
    }

    loadFormData();
    return () => {
      active = false;
    };
  }, [projectId]);

  function addKeyword() {
    const kw = kwInput.trim();
    if (kw && !keywords.includes(kw) && keywords.length < 10) {
      setKeywords([...keywords, kw]);
      setKwInput("");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { toast.error("Judul penelitian harus diisi"); return; }
    if (!fieldId) { toast.error("Pilih bidang penelitian terlebih dahulu"); return; }
    setLoading(true);
    try {
      const payload = {
        research_field_id: Number(fieldId),
        title: title.trim(),
        description: description.trim(),
        keywords,
        visibility: isPublic ? "public" as const : "private" as const,
      };
      const project = projectId
        ? await projectService.update(Number(projectId), payload)
        : await projectService.create(payload);
      toast.success(projectId ? "Koleksi berhasil diperbarui." : "Koleksi berhasil dibuat.");
      navigate({ name: "collection", collectionId: String(project.id) });
    } catch (error) {
      toast.error(getSafeErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  const selectedField = fields.find((f) => f.id === fieldId);

  return (
    <div className="min-h-screen bg-[#F5F4F1]">
      {/* Topbar */}
      <div className="bg-white border-b border-[rgba(12,13,26,0.07)] sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-[60px] flex items-center gap-3">
          <button onClick={() => navigate({ name: "dashboard" })}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
              <BookOpen className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-bold text-[#0C0D1A]">{isEditing ? "Edit Koleksi" : "Buat Koleksi Baru"}</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate({ name: "dashboard" })}>Batal</Button>
            <div className="hidden sm:block">
              <Button size="sm" onClick={handleSubmit} loading={loading}>
                {!loading && <BookOpen className="w-3.5 h-3.5" />}
                {isEditing ? "Simpan Perubahan" : "Simpan Koleksi"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {initialLoading && (
          <div className="bg-white rounded-[1.25rem] border border-[rgba(12,13,26,0.07)] p-8 text-center text-sm text-slate-400">
            Memuat form koleksi dari API...
          </div>
        )}
        {!initialLoading && loadError && (
          <div className="bg-white rounded-[1.25rem] border border-red-100 p-8 text-center">
            <p className="text-sm font-semibold text-red-600 mb-4">{loadError}</p>
            <Button onClick={() => navigate({ name: "dashboard" })}>Kembali ke Dashboard</Button>
          </div>
        )}
        {!initialLoading && !loadError && (
        <form onSubmit={handleSubmit}>
          <div className="grid lg:grid-cols-3 gap-6">

            {/* Main form */}
            <div className="lg:col-span-2 flex flex-col gap-5">

              {/* Title */}
              <div className="bg-white rounded-[1.25rem] border border-[rgba(12,13,26,0.07)] shadow-[0_1px_3px_rgba(12,13,26,0.05)] p-6">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Detail Koleksi</p>
                <div className="flex flex-col gap-4">
                  <InputField
                    label="Judul Penelitian"
                    placeholder="Contoh: Perancangan Network Monitoring System Terintegrasi..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    hint="Gunakan judul lengkap penelitian atau skripsimu"
                  />
                  <TextareaField
                    label="Deskripsi Koleksi"
                    placeholder="Jelaskan topik, tujuan, dan ruang lingkup koleksi literaturmu secara singkat..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    hint="Opsional — membantu orang lain memahami isi koleksimu"
                  />
                </div>
              </div>

              {/* Bidang Penelitian */}
              <div className="bg-white rounded-[1.25rem] border border-[rgba(12,13,26,0.07)] shadow-[0_1px_3px_rgba(12,13,26,0.05)] p-6">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Bidang Penelitian</p>
                <div className="grid grid-cols-2 gap-2">
                  {fields.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setFieldId(f.id)}
                      className={cn(
                        "flex items-center gap-2.5 px-3.5 py-3 rounded-xl border text-sm font-semibold transition-all text-left",
                        fieldId === f.id
                          ? "bg-indigo-50 border-indigo-300 text-indigo-700"
                          : "bg-slate-50/50 border-[rgba(12,13,26,0.08)] text-slate-600 hover:border-[rgba(12,13,26,0.15)] hover:bg-white"
                      )}
                    >
                      <span className={cn(
                        "w-2.5 h-2.5 rounded-full shrink-0",
                        fieldId === f.id ? "bg-indigo-500" : f.color.replace("text-", "bg-").replace("-700", "-400").replace("-600", "-400")
                      )} />
                      <span className="leading-snug">{f.name}</span>
                    </button>
                  ))}
                </div>
                {fields.length === 0 && (
                  <p className="text-xs text-slate-400 mt-3">Belum ada bidang aktif dari API.</p>
                )}
              </div>

              {/* Keywords */}
              <div className="bg-white rounded-[1.25rem] border border-[rgba(12,13,26,0.07)] shadow-[0_1px_3px_rgba(12,13,26,0.05)] p-6">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Kata Kunci</p>
                <div className="flex gap-2 mb-3">
                  <input
                    value={kwInput}
                    onChange={(e) => setKwInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addKeyword(); } }}
                    placeholder="Ketik kata kunci, lalu tekan Enter..."
                    className="flex-1 px-4 py-2.5 bg-slate-50/80 border border-[rgba(12,13,26,0.1)] rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 focus:bg-white transition-all"
                  />
                  <Button type="button" onClick={addKeyword} variant="secondary" size="md">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                {keywords.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {keywords.map((kw) => (
                      <span key={kw} className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 border border-indigo-100 px-3 py-1.5 rounded-full text-sm font-semibold">
                        {kw}
                        <button type="button" onClick={() => setKeywords(keywords.filter((k) => k !== kw))}
                          className="text-indigo-400 hover:text-indigo-700 transition-colors">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">Belum ada kata kunci. Tambahkan setidaknya 3 kata kunci relevan.</p>
                )}

                {selectedField && keywords.length === 0 && (
                  <div className="mt-3">
                    <p className="text-[10px] font-semibold text-slate-400 mb-2">Saran dari bidang {selectedField.name}:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedField.keywords.slice(0, 5).map((kw) => (
                        <button key={kw} type="button"
                          onClick={() => { if (!keywords.includes(kw)) setKeywords([...keywords, kw]); }}
                          className="text-[11px] font-semibold text-slate-500 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 px-2 py-0.5 rounded-full border border-transparent hover:border-indigo-200 transition-all">
                          + {kw}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar: visibility + tips */}
            <div className="flex flex-col gap-5">
              {/* Visibility */}
              <div className="bg-white rounded-[1.25rem] border border-[rgba(12,13,26,0.07)] shadow-[0_1px_3px_rgba(12,13,26,0.05)] p-5">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Visibilitas</p>
                <div className="flex flex-col gap-2">
                  {([
                    { val: true, label: "Publik", desc: "Dapat ditemukan semua pengguna", icon: Globe, activeClass: "bg-emerald-50 border-emerald-300" },
                    { val: false, label: "Privat", desc: "Hanya kamu yang dapat melihat", icon: Lock, activeClass: "bg-slate-100 border-slate-300" },
                  ] as const).map(({ val, label, desc, icon: Icon, activeClass }) => (
                    <button key={label} type="button" onClick={() => setIsPublic(val)}
                      className={cn(
                        "flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all",
                        isPublic === val ? activeClass : "bg-slate-50/50 border-[rgba(12,13,26,0.08)] hover:bg-white hover:border-[rgba(12,13,26,0.15)]"
                      )}>
                      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
                        isPublic === val ? (val ? "bg-emerald-100" : "bg-slate-200") : "bg-slate-100")}>
                        <Icon className={cn("w-4 h-4", isPublic === val ? (val ? "text-emerald-600" : "text-slate-600") : "text-slate-400")} />
                      </div>
                      <div>
                        <p className={cn("font-semibold text-sm", isPublic === val ? "text-slate-900" : "text-slate-600")}>{label}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tips */}
              <div className="bg-indigo-50 border border-indigo-100 rounded-[1.125rem] p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Lightbulb className="w-4 h-4 text-indigo-500" />
                  <p className="text-xs font-bold text-indigo-700 uppercase tracking-widest">Tips</p>
                </div>
                <ul className="flex flex-col gap-2">
                  {[
                    "Gunakan judul lengkap penelitianmu",
                    "Tambahkan kata kunci spesifik agar mudah ditemukan",
                    "Koleksi publik lebih mudah ditemukan mahasiswa lain",
                    "Unggah PDF setelah koleksi dibuat",
                  ].map((tip, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-indigo-600">
                      <span className="w-4 h-4 bg-indigo-100 rounded-full flex items-center justify-center text-[9px] font-bold text-indigo-600 shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Submit button (mobile visible) */}
              <Button type="submit" size="lg" loading={loading} className="w-full lg:hidden">
                {!loading && <BookOpen className="w-4 h-4" />}
                Simpan Koleksi
              </Button>
            </div>
          </div>
        </form>
        )}
      </div>
    </div>
  );
}
