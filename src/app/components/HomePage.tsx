import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Search, ChevronDown, BookOpen, ArrowRight,
  Network, Brain, Cpu, Database, BarChart2, Code2, FileText, Upload,
  type LucideIcon,
} from "lucide-react";
import { useApp } from "../context";
import { useCatalogSearch } from "../../hooks/use-catalog-search";
import { useRepositoryStats } from "../../hooks/use-repository-stats";
import { Navbar } from "./Navbar";
import { Badge, Avatar, cn, type BadgeVariant } from "./ui";
import { fieldService } from "../../services/field-service";
import { projectService } from "../../services/project-service";
import { getSafeErrorMessage } from "../../lib/api-error";
import { adaptField, adaptProject, type FieldDisplay, type ProjectDisplay } from "../../lib/domain-display";
import { toast } from "sonner";

const ICON_MAP: Record<string, LucideIcon> = {
  Network, Brain, Cpu, Database, BarChart2, Code2,
};

const KEYWORDS = ["SNMP", "Machine Learning", "IoT", "UI/UX", "Data Mining", "GPON", "Deep Learning", "Mikrotik"];

const PREVIEW_RESULTS = [
  { title: "Monitoring Optical Network Unit Berbasis SNMP", field: "Jaringan Komputer", rel: 91, pages: 12 },
  { title: "Implementasi Deep Learning untuk Deteksi Objek Real-Time", field: "Artificial Intelligence", rel: 87, pages: 14 },
  { title: "Smart Home Berbasis IoT dengan Kontrol Suara MQTT", field: "Internet of Things", rel: 79, pages: 9 },
];

const FIELD_ACCENT: Record<string, { icon: string; bg: string; badge: string; strip: string }> = {
  "jaringan-komputer": { icon: "text-indigo-400", bg: "bg-indigo-500/15", badge: "bg-indigo-500/20 text-indigo-200", strip: "bg-indigo-500" },
  "artificial-intelligence": { icon: "text-violet-400", bg: "bg-violet-500/15", badge: "bg-violet-500/20 text-violet-200", strip: "bg-violet-500" },
  "iot": { icon: "text-emerald-600", bg: "bg-emerald-100", badge: "bg-emerald-100 text-emerald-700", strip: "bg-emerald-500" },
  "sistem-informasi": { icon: "text-sky-600", bg: "bg-sky-100", badge: "bg-sky-100 text-sky-700", strip: "bg-sky-500" },
  "data-mining": { icon: "text-orange-400", bg: "bg-orange-500/15", badge: "bg-orange-500/20 text-orange-200", strip: "bg-orange-500" },
  "rpl": { icon: "text-rose-600", bg: "bg-rose-100", badge: "bg-rose-100 text-rose-700", strip: "bg-rose-500" },
};

const COLLECTION_STRIP: Record<string, string> = {
  "jaringan-komputer": "bg-indigo-500",
  "artificial-intelligence": "bg-violet-500",
  "iot": "bg-emerald-500",
  "sistem-informasi": "bg-sky-500",
  "data-mining": "bg-orange-500",
  "rpl": "bg-rose-500",
};

export function HomePage() {
  const { navigate } = useApp();
  const [searchQuery, setSearchQuery] = useState("");
  const [fieldOpen, setFieldOpen] = useState(false);
  const [selectedFieldId, setSelectedFieldId] = useState<number | null>(null);
  const [fields, setFields] = useState<FieldDisplay[]>([]);
  const [collections, setCollections] = useState<ProjectDisplay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const catalog = useCatalogSearch(searchQuery, 5, 300);
  const repositoryStats = useRepositoryStats();
  const selectedField = useMemo(
    () => fields.find((field) => field.apiId === selectedFieldId) ?? null,
    [fields, selectedFieldId]
  );
  const showCatalogSuggestions = searchQuery.trim().length >= 2
    && Boolean(catalog.data || catalog.isLoading || catalog.error);

  useEffect(() => {
    let active = true;

    async function loadHomeData() {
      setIsLoading(true);
      setError(null);
      try {
        const [fieldResponse, projectResponse] = await Promise.all([
          fieldService.list({ page_size: 6 }),
          projectService.list({ page_size: 6, visibility: "public", sort_by: "newest" }),
        ]);
        if (!active) return;
        setFields(fieldResponse.items.map(adaptField));
        setCollections(projectResponse.items.map(adaptProject));
      } catch (err) {
        if (active) setError(getSafeErrorMessage(err));
      } finally {
        if (active) setIsLoading(false);
      }
    }

    loadHomeData();
    return () => {
      active = false;
    };
  }, []);

  function runSearch(rawQuery: string, fieldId = selectedFieldId) {
    const query = rawQuery.trim();
    if (!query) {
      toast.error("Masukkan kata kunci pencarian terlebih dahulu.");
      return;
    }
    navigate({
      name: "search",
      query,
      researchFieldId: fieldId ?? undefined,
      sortBy: "relevance",
      page: 1,
    });
  }

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    runSearch(searchQuery);
  }

  return (
    <div className="min-h-screen bg-[#F5F4F1]">
      <Navbar />

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden" style={{ background: "linear-gradient(145deg, #c7d2fe 0%, #ddd6fe 45%, #a5f3fc 100%)" }}>
        {/* Mesh gradient orbs */}
        <div className="absolute pointer-events-none" style={{ top: "-20%", left: "-8%", width: "60vw", height: "60vw", maxWidth: 620, maxHeight: 620, borderRadius: "50%", background: "#3b82f6", filter: "blur(110px)", opacity: 0.55 }} />
        <div className="absolute pointer-events-none" style={{ top: "5%", left: "35%", width: "50vw", height: "50vw", maxWidth: 520, maxHeight: 520, borderRadius: "50%", background: "#8b5cf6", filter: "blur(120px)", opacity: 0.45 }} />
        <div className="absolute pointer-events-none" style={{ bottom: "-15%", right: "-5%", width: "55vw", height: "55vw", maxWidth: 500, maxHeight: 500, borderRadius: "50%", background: "#6366f1", filter: "blur(110px)", opacity: 0.45 }} />
        <div className="absolute pointer-events-none" style={{ bottom: "10%", left: "10%", width: "35vw", height: "35vw", maxWidth: 340, maxHeight: 340, borderRadius: "50%", background: "#22d3ee", filter: "blur(90px)", opacity: 0.3 }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
          <div className="grid lg:grid-cols-[1fr_400px] gap-14 items-center">

            {/* Left: Copy + Search */}
            <div>
              {/* Eyebrow label */}
              <div className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 mb-7" style={{ background: "rgba(255,255,255,0.3)", border: "1px solid rgba(255,255,255,0.5)", backdropFilter: "blur(12px)" }}>
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                <span className="text-[11px] font-bold text-indigo-800 tracking-wide">Platform Literatur Kolaboratif Mahasiswa</span>
              </div>

              {/* Display heading */}
              <h1 className="mb-5" style={{ fontSize: "clamp(2.2rem, 5vw, 3.25rem)", lineHeight: 1.08, letterSpacing: "-0.03em", fontWeight: 700 }}>
                <span className="text-[#0C0D1A]">Temukan literatur yang </span>
                <span className="font-display-italic" style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  relevan
                </span>
                <br />
                <span className="text-[#0C0D1A]">untuk penelitianmu.</span>
              </h1>

              <p className="text-slate-600 text-[1.0625rem] leading-[1.7] mb-9 max-w-[520px]">
                Cari referensi ilmiah dari koleksi mahasiswa — lebih cepat, terstruktur, dan mudah ditemukan kembali.
              </p>

              {/* Search bar */}
              <form onSubmit={handleSearch} className="relative">
                <div className="flex bg-white rounded-2xl overflow-hidden" style={{ boxShadow: "0 8px 40px rgba(79,70,229,0.22), 0 2px 12px rgba(0,0,0,0.07)" }}>
                  <div className="flex-1 flex items-center gap-3 px-4">
                    <Search className="w-4.5 h-4.5 text-slate-400 shrink-0" />
                    <input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          runSearch(searchQuery);
                        }
                      }}
                      placeholder="Cari jurnal, topik penelitian, kata kunci..."
                      className="flex-1 py-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none bg-transparent min-w-0"
                    />
                  </div>

                  {/* Field filter */}
                  <div className="relative hidden sm:flex items-center border-l border-slate-100">
                    <button
                      type="button"
                      onClick={() => setFieldOpen(!fieldOpen)}
                      className="flex items-center gap-1.5 px-4 py-4 text-sm text-slate-500 hover:text-slate-700 transition-colors whitespace-nowrap"
                    >
                      {selectedField?.name || "Semua Bidang"}
                      <ChevronDown className={cn("w-3.5 h-3.5 text-slate-400 transition-transform duration-200", fieldOpen && "rotate-180")} />
                    </button>
                    {fieldOpen && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setFieldOpen(false)} />
                        <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl border border-[rgba(12,13,26,0.08)] shadow-2xl shadow-black/20 z-20 overflow-hidden py-1.5">
                          {[{ apiId: null, name: "Semua Bidang" }, ...fields].map((field) => (
                            <button type="button" key={field.name} onClick={() => { setSelectedFieldId(field.apiId); setFieldOpen(false); }}
                              className={cn("w-full text-left px-4 py-2 text-sm transition-colors",
                                selectedFieldId === field.apiId
                                  ? "text-indigo-600 font-semibold bg-indigo-50/60"
                                  : "text-slate-600 hover:bg-slate-50/80")}>
                              {field.name}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>

                  <button type="submit"
                    className="bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white px-6 py-2.5 m-2 rounded-xl text-sm font-semibold flex items-center gap-2 shrink-0 transition-all shadow-sm">
                    <Search className="w-4 h-4 hidden sm:block" />
                  Cari
                </button>
              </div>
              {showCatalogSuggestions && (
                <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl border border-[rgba(12,13,26,0.08)] shadow-2xl shadow-indigo-950/15 z-30 overflow-hidden">
                  <div className="px-4 py-2.5 border-b border-[rgba(12,13,26,0.06)]">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Katalog Terkait</p>
                  </div>
                  {catalog.isLoading && (
                    <div className="px-4 py-3 text-xs text-slate-400 font-medium">Mencari bidang dan koleksi...</div>
                  )}
                  {!catalog.isLoading && catalog.error && (
                    <div className="px-4 py-3 text-xs text-red-500 font-semibold">{catalog.error}</div>
                  )}
                  {!catalog.isLoading && !catalog.error && catalog.data && catalog.data.fields.length === 0 && catalog.data.projects.length === 0 && (
                    <div className="px-4 py-3 text-xs text-slate-400 font-medium">Tidak ada katalog yang cocok.</div>
                  )}
                  {!catalog.isLoading && !catalog.error && catalog.data && (
                    <div className="py-1.5">
                      {catalog.data.fields.slice(0, 3).map((field) => (
                        <button
                          key={`field-${field.id}`}
                          type="button"
                          onClick={() => navigate({ name: "field-detail", fieldId: String(field.id) })}
                          className="w-full text-left px-4 py-2.5 hover:bg-indigo-50/60 transition-colors"
                        >
                          <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wide">Bidang</span>
                          <p className="text-sm font-semibold text-slate-800 line-clamp-1">{field.name}</p>
                        </button>
                      ))}
                      {catalog.data.projects.slice(0, 3).map((project) => (
                        <button
                          key={`project-${project.id}`}
                          type="button"
                          onClick={() => navigate({ name: "collection", collectionId: String(project.id) })}
                          className="w-full text-left px-4 py-2.5 hover:bg-indigo-50/60 transition-colors"
                        >
                          <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wide">Koleksi · {project.owner.name}</span>
                          <p className="text-sm font-semibold text-slate-800 line-clamp-1">{project.title}</p>
                          <p className="text-[11px] text-slate-400 line-clamp-1">{project.field.name}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </form>

              {/* Keyword pills */}
              <div className="flex flex-wrap gap-2 mt-4 items-center">
                <span className="text-[11px] text-slate-600 font-semibold">Populer:</span>
                {KEYWORDS.map((kw) => (
                  <button key={kw}
                    onClick={() => runSearch(kw, null)}
                    className="text-[11px] font-semibold text-indigo-700 hover:text-white hover:bg-indigo-600 border border-indigo-300/50 hover:border-indigo-600 px-3 py-1 rounded-full transition-all duration-150"
                    style={{ background: "rgba(255,255,255,0.35)" }}
                  >
                    {kw}
                  </button>
                ))}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-4 gap-6 mt-10 pt-8" style={{ borderTop: "1px solid rgba(255,255,255,0.4)" }}>
                {[
                  { val: repositoryStats.isLoading ? "..." : repositoryStats.data ? String(repositoryStats.data.public_documents_count) : "—", lbl: "Literatur PDF" },
                  { val: repositoryStats.isLoading ? "..." : repositoryStats.data ? String(repositoryStats.data.public_projects_count) : "—", lbl: "Koleksi" },
                  { val: repositoryStats.isLoading ? "..." : repositoryStats.data ? String(repositoryStats.data.fields_count) : "—", lbl: "Bidang Ilmu" },
                  { val: repositoryStats.isLoading ? "..." : repositoryStats.data ? String(repositoryStats.data.contributors_count) : "—", lbl: "Kontributor" },
                ].map(({ val, lbl }) => (
                  <div key={lbl}>
                    <p className="text-[1.75rem] font-bold text-[#0C0D1A] tracking-[-0.03em] leading-none">{val}</p>
                    <p className="text-[11px] text-slate-600 font-medium mt-1.5 uppercase tracking-wide">{lbl}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Stacked preview cards */}
            <div className="hidden lg:block relative" style={{ height: "340px" }}>
              {PREVIEW_RESULTS.map((r, i) => (
                <div
                  key={i}
                  className="absolute w-[340px] bg-white/90 backdrop-blur-sm rounded-2xl shadow-[0_20px_48px_rgba(79,70,229,0.18),0_4px_12px_rgba(0,0,0,0.1)] transition-all duration-300"
                  style={{
                    top: `${i * 72}px`,
                    right: `${i * 12}px`,
                    zIndex: 3 - i,
                    opacity: 1 - i * 0.15,
                    transform: `rotate(${[-1.2, 0.4, 2][i]}deg)`,
                  }}
                >
                  {/* Relevance bar */}
                  <div className="h-1 bg-slate-100 rounded-t-2xl overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-indigo-500 to-violet-400 rounded-full" style={{ width: `${r.rel}%` }} />
                  </div>
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 bg-red-50 rounded-xl flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4 text-red-500" strokeWidth={1.5} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-900 line-clamp-2 leading-snug">{r.title}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <Badge variant="indigo">{r.field}</Badge>
                          <span className="text-[10px] text-slate-400">{r.pages} hal.</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100/80">
                      <span className="text-[10px] text-slate-400">TF-IDF · Relevansi</span>
                      <span className="text-xs font-bold text-emerald-600">{r.rel}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── BENTO FIELDS ─────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-[0.12em] mb-2">Bidang Penelitian</p>
            <h2 className="text-[1.625rem] font-bold text-[#0C0D1A] tracking-[-0.02em]">Jelajahi berdasarkan bidang ilmu</h2>
          </div>
          <button onClick={() => navigate({ name: "fields" })}
            className="hidden sm:flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-indigo-600 transition-colors">
            Lihat semua <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3.5">
          {isLoading && (
            <div className="lg:col-span-12 bg-white border border-[rgba(12,13,26,0.07)] rounded-[1.25rem] p-8 text-center text-sm text-slate-400">
              Memuat bidang penelitian dari API...
            </div>
          )}
          {!isLoading && error && (
            <div className="lg:col-span-12 bg-white border border-red-100 rounded-[1.25rem] p-8 text-center">
              <p className="text-sm font-semibold text-red-600">{error}</p>
            </div>
          )}
          {!isLoading && !error && fields.map((field, idx) => {
            const IconComp = ICON_MAP[field.iconName] || BookOpen;
            const ac = FIELD_ACCENT[field.id] || FIELD_ACCENT["rpl"];

            // Bento: idx=0 wide+dark, idx=1 tall+light, idx=2,3 small+light, idx=4 dark, idx=5 light
            const layouts = [
              "lg:col-span-8",
              "lg:col-span-4 lg:row-span-2",
              "lg:col-span-4",
              "lg:col-span-4",
              "lg:col-span-4",
              "lg:col-span-4",
            ];
            const isDark = idx === 0 || idx === 4;

            return (
              <div
                key={field.id}
                onClick={() => navigate({ name: "field-detail", fieldId: field.id })}
                className={cn(
                  "group relative rounded-[1.25rem] cursor-pointer overflow-hidden transition-all duration-200",
                  layouts[idx],
                  isDark
                    ? "bg-[#0C0D1A] hover:bg-[#111226] border border-white/[0.06]"
                    : "bg-white border border-[rgba(12,13,26,0.07)] shadow-[0_1px_4px_rgba(12,13,26,0.06)] hover:shadow-[0_6px_22px_rgba(12,13,26,0.1)] hover:-translate-y-0.5",
                  idx === 0 && "min-h-[200px]",
                  idx === 1 && "min-h-[280px]",
                )}
              >
                {/* Dark card decorations */}
                {isDark && (
                  <>
                    <div className="absolute -top-12 -right-12 w-40 h-40 bg-white/[0.03] rounded-full pointer-events-none" />
                    <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />
                  </>
                )}

                {/* Wide featured card gets a stat strip */}
                {idx === 0 && (
                  <div className="absolute top-5 right-5 text-right">
                    <p className="text-[2.5rem] font-bold text-white/[0.06] leading-none tracking-tight">—</p>
                    <p className="text-[9px] font-semibold text-slate-700 uppercase tracking-widest -mt-1">PDF</p>
                  </div>
                )}

                <div className="p-6 h-full flex flex-col">
                  <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center mb-5", ac.bg)}>
                    <IconComp className={cn("w-5 h-5", ac.icon)} strokeWidth={1.75} />
                  </div>

                  <h3 className={cn(
                    "font-bold mb-2 tracking-tight leading-snug",
                    idx === 0 ? "text-xl" : "text-base",
                    isDark ? "text-white" : "text-[#0C0D1A] group-hover:text-indigo-700 transition-colors"
                  )}>
                    {field.name}
                  </h3>

                  <p className={cn(
                    "text-sm leading-relaxed mb-4",
                    isDark ? "text-slate-500" : "text-slate-500",
                    idx === 0 ? "max-w-sm" : "line-clamp-2"
                  )}>
                    {field.description}
                  </p>

                  {/* Keywords for featured cards */}
                  {(idx === 0 || idx === 1) && (
                    <div className="flex flex-wrap gap-1.5 mb-5">
                      {field.keywords.slice(0, idx === 0 ? 5 : 3).map((kw) => (
                        <span key={kw} className={cn("text-[10px] font-semibold px-2.5 py-0.5 rounded-full", ac.badge || (isDark ? "bg-white/10 text-slate-400" : "bg-slate-100 text-slate-500"))}>
                          {kw}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Footer meta */}
                  <div className={cn("flex items-center justify-between mt-auto", idx === 1 ? "pt-2" : "")}>
                    <div className={cn("flex items-center gap-4 text-[11px] font-medium", isDark ? "text-slate-600" : "text-slate-400")}>
                      <span>{field.collectionCount} koleksi</span>
                      <span className="opacity-40">·</span>
                      <span>{field.isActive ? "Aktif" : "Nonaktif"}</span>
                    </div>
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center transition-all group-hover:scale-110",
                      isDark ? "bg-white/[0.06] group-hover:bg-indigo-500/30" : "bg-slate-100 group-hover:bg-indigo-100"
                    )}>
                      <ArrowRight className={cn("w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform", isDark ? "text-slate-600 group-hover:text-indigo-300" : "text-slate-400 group-hover:text-indigo-600")} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── RECENT COLLECTIONS ───────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-20">
        {/* Section header */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-[0.12em] mb-2">Dikurasi mahasiswa</p>
            <h2 className="text-[1.625rem] font-bold text-[#0C0D1A] tracking-[-0.02em]">Koleksi terbaru</h2>
          </div>
          <button onClick={() => navigate({ name: "fields" })}
            className="hidden sm:flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-indigo-600 transition-colors">
            Jelajahi semua <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {isLoading && (
            <div className="sm:col-span-2 lg:col-span-3 bg-white rounded-[1.25rem] border border-[rgba(12,13,26,0.07)] p-8 text-center text-sm text-slate-400">
              Memuat koleksi terbaru dari API...
            </div>
          )}
          {!isLoading && !error && collections.length === 0 && (
            <div className="sm:col-span-2 lg:col-span-3 bg-white rounded-[1.25rem] border border-[rgba(12,13,26,0.07)] p-8 text-center text-sm text-slate-400">
              Belum ada koleksi publik.
            </div>
          )}
          {!isLoading && !error && collections.map((col) => {
            const stripColor = col.strip || COLLECTION_STRIP[col.fieldSlug] || "bg-slate-400";
            const badgeVariant: BadgeVariant = col.badge;

            return (
              <div
                key={col.id}
                onClick={() => navigate({ name: "collection", collectionId: col.id })}
                className="group bg-white rounded-[1.25rem] border border-[rgba(12,13,26,0.07)] shadow-[0_1px_4px_rgba(12,13,26,0.06)] hover:shadow-[0_8px_28px_rgba(12,13,26,0.1)] hover:-translate-y-0.5 cursor-pointer transition-all duration-200 overflow-hidden"
              >
                {/* Colored top strip */}
                <div className={cn("h-1 w-full", stripColor)} />

                <div className="p-5">
                  {/* Field badge + privacy */}
                  <div className="flex items-center justify-between mb-3.5">
                    <Badge variant={badgeVariant}>{col.fieldName}</Badge>
                    {!col.isPublic && (
                      <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">Privat</span>
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="font-bold text-sm text-[#0C0D1A] leading-snug line-clamp-2 group-hover:text-indigo-700 transition-colors mb-3">
                    {col.title}
                  </h3>

                  {/* Keywords */}
                  <div className="flex flex-wrap gap-1 mb-4">
                    {col.keywords.slice(0, 3).map((kw) => (
                      <span key={kw} className="text-[10px] font-medium bg-slate-100/80 text-slate-500 px-2 py-0.5 rounded-full">{kw}</span>
                    ))}
                    {col.keywords.length > 3 && (
                      <span className="text-[10px] text-slate-400 px-1">+{col.keywords.length - 3}</span>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-[rgba(12,13,26,0.055)]">
                    <div className="flex items-center gap-2">
                      <Avatar initials={col.owner.initials} color={col.owner.avatarColor} size="xs" />
                      <span className="text-xs font-medium text-slate-500">{col.owner.name.split(" ")[0]}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-slate-400">
                      <FileText className="w-3 h-3" />
                      <span>{col.pdfCount} PDF</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── UPLOAD CTA BAND ──────────────────────────────────────────── */}
      <section className="relative overflow-hidden" style={{ background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)" }}>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-11 flex flex-col sm:flex-row items-center justify-between gap-5">
          <div>
            <h3 className="font-bold text-white tracking-tight mb-1">Punya literatur untuk dibagikan?</h3>
            <p className="text-sm text-indigo-200">Unggah PDF dan bantu mahasiswa lain menemukan referensi yang tepat.</p>
          </div>
          <button
            onClick={() => navigate({ name: "create-collection" })}
            className="inline-flex items-center gap-2.5 bg-white text-indigo-600 font-bold px-6 py-3 rounded-xl text-sm transition-all shrink-0 shadow-[0_4px_16px_rgba(0,0,0,0.15)] hover:bg-white/90 active:scale-[0.98]"
          >
            <Upload className="w-4 h-4" />
            Mulai Kontribusi
          </button>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────── */}
      <footer className="bg-[#0C0D1A]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center shadow-sm shadow-indigo-800/40">
              <BookOpen className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-white font-bold tracking-tight">Litera</span>
          </div>
          <p className="text-xs text-slate-600 font-medium">© 2026 Litera · Platform Literatur Akademik Mahasiswa</p>
          <div className="flex items-center gap-5 text-sm text-slate-600">
            {["Tentang", "Panduan", "Kontak"].map((l) => (
              <button key={l} className="hover:text-slate-300 transition-colors text-sm font-medium">{l}</button>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
