import { useState } from "react";
import { Search, ArrowLeft, ArrowRight, Network, Brain, Cpu, Database, BarChart2, Code2, BookOpen, FileText, Clock, ChevronRight, Users } from "lucide-react";
import { useApp } from "../context";
import { Navbar } from "./Navbar";
import { Badge, Avatar, Button, cn } from "./ui";
import { FIELDS, COLLECTIONS, PDFS, type Field } from "./data";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Network, Brain, Cpu, Database, BarChart2, Code2,
};

// ── Field grid card ──────────────────────────────────────────────────────────

function FieldCard({ field, index, onClick }: { field: Field; index: number; onClick: () => void }) {
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

      <div className={cn(
        "w-11 h-11 rounded-[14px] flex items-center justify-center mb-5",
        isDark ? "bg-white/10" : field.bgColor
      )}>
        <IconComp className={cn("w-5 h-5", isDark ? "text-white/70" : field.color)} strokeWidth={1.75} />
      </div>

      <h3 className={cn(
        "font-bold text-base mb-2 tracking-tight",
        isDark ? "text-white" : "text-[#0C0D1A] group-hover:text-indigo-700 transition-colors"
      )}>
        {field.name}
      </h3>

      <p className={cn("text-sm leading-relaxed mb-5 line-clamp-2", isDark ? "text-slate-500" : "text-slate-500")}>
        {field.description}
      </p>

      <div className="flex flex-wrap gap-1.5 mb-5">
        {field.keywords.slice(0, 3).map((kw) => (
          <span key={kw} className={cn(
            "text-[10px] font-semibold px-2 py-0.5 rounded-full",
            isDark ? "bg-white/10 text-slate-400" : "bg-slate-100 text-slate-500"
          )}>
            {kw}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <div className={cn("flex items-center gap-3 text-xs font-medium", isDark ? "text-slate-600" : "text-slate-400")}>
          <span>{field.collectionCount} koleksi</span>
          <span className="opacity-40">·</span>
          <span>{field.pdfCount} PDF</span>
        </div>
        <ArrowRight className={cn(
          "w-4 h-4 group-hover:translate-x-1 transition-transform",
          isDark ? "text-slate-700 group-hover:text-indigo-400" : "text-slate-300 group-hover:text-indigo-500"
        )} />
      </div>
    </div>
  );
}

// ── Field detail page ────────────────────────────────────────────────────────

function FieldDetailView({ field }: { field: Field }) {
  const { navigate } = useApp();
  const [searchQuery, setSearchQuery] = useState("");
  const IconComp = ICON_MAP[field.iconName] || BookOpen;
  const collections = COLLECTIONS.filter((c) => c.fieldId === field.id);
  const pdfs = PDFS.filter((p) => collections.some((c) => c.id === p.collectionId));

  return (
    <div className="min-h-screen bg-[#F5F4F1]">
      <Navbar />

      {/* Hero banner — mesh gradient */}
      <div className="relative overflow-hidden" style={{ background: "linear-gradient(145deg, #c7d2fe 0%, #ddd6fe 45%, #a5f3fc 100%)" }}>
        <div className="absolute pointer-events-none" style={{ top: "-30%", left: "-5%", width: "60vw", height: "60vw", maxWidth: 520, maxHeight: 520, borderRadius: "50%", background: "#6366f1", filter: "blur(100px)", opacity: 0.45 }} />
        <div className="absolute pointer-events-none" style={{ bottom: "-20%", right: "-5%", width: "50vw", height: "50vw", maxWidth: 440, maxHeight: 440, borderRadius: "50%", background: "#8b5cf6", filter: "blur(100px)", opacity: 0.4 }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-12">
          {/* Breadcrumb */}
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
              <p className="text-slate-600 text-sm max-w-xl leading-relaxed">{field.description}</p>

              <div className="flex flex-wrap gap-2 mt-5">
                {field.keywords.map((kw) => (
                  <span key={kw} className="text-xs font-semibold text-indigo-700 px-2.5 py-1 rounded-full" style={{ background: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.6)", backdropFilter: "blur(8px)" }}>
                    {kw}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 lg:gap-6">
              {[
                { val: field.collectionCount, lbl: "Koleksi" },
                { val: field.pdfCount, lbl: "Literatur" },
                { val: field.contributors, lbl: "Kontributor" },
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
        {/* Scoped search */}
        <div className="flex gap-3 mb-8">
          <div className="flex-1 flex items-center bg-white border border-[rgba(12,13,26,0.1)] rounded-xl overflow-hidden shadow-sm focus-within:ring-2 focus-within:ring-indigo-200 focus-within:border-indigo-400 transition-all">
            <Search className="w-4 h-4 text-slate-400 ml-4 shrink-0" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && navigate({ name: "search", query: searchQuery || field.name })}
              placeholder={`Cari dalam ${field.name}...`}
              className="flex-1 px-3 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none bg-transparent"
            />
          </div>
          <Button onClick={() => navigate({ name: "search", query: searchQuery || field.name })}>
            <Search className="w-4 h-4" />
            Cari
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-7">
          {/* Collections */}
          <div className="lg:col-span-2">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Koleksi Penelitian ({collections.length})</p>
            <div className="flex flex-col gap-3">
              {collections.length === 0 ? (
                <div className="bg-white rounded-2xl border border-[rgba(12,13,26,0.07)] p-10 text-center text-slate-400 text-sm">
                  Belum ada koleksi
                </div>
              ) : (
                collections.map((col) => (
                  <div
                    key={col.id}
                    onClick={() => navigate({ name: "collection", collectionId: col.id })}
                    className="group bg-white rounded-[1.125rem] border border-[rgba(12,13,26,0.07)] shadow-[0_1px_3px_rgba(12,13,26,0.05)] hover:shadow-[0_4px_14px_rgba(12,13,26,0.08)] hover:border-[rgba(12,13,26,0.12)] p-4 cursor-pointer transition-all duration-200"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                        <BookOpen className="w-4 h-4 text-indigo-600" strokeWidth={1.75} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm text-[#0C0D1A] line-clamp-2 leading-snug group-hover:text-indigo-700 transition-colors">
                          {col.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-2">
                          <Avatar initials={col.owner.initials} color={col.owner.avatarColor} size="xs" />
                          <span className="text-xs font-medium text-slate-500">{col.owner.name}</span>
                          <span className="text-slate-200">·</span>
                          <span className="text-xs text-slate-400">{col.pdfCount} PDF</span>
                          <span className="text-slate-200">·</span>
                          <span className="text-xs text-slate-400">{col.lastUpdated}</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {col.keywords.slice(0, 3).map((kw) => (
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

          {/* Sidebar: latest PDFs */}
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">PDF Terbaru</p>
            <div className="flex flex-col gap-2">
              {pdfs.slice(0, 6).map((pdf) => (
                <div key={pdf.id} className="bg-white rounded-xl border border-[rgba(12,13,26,0.07)] p-3 flex items-start gap-2.5 hover:border-[rgba(12,13,26,0.12)] transition-all">
                  <div className="w-7 h-7 bg-red-50 rounded-lg flex items-center justify-center shrink-0">
                    <FileText className="w-3.5 h-3.5 text-red-500" strokeWidth={1.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-800 line-clamp-2 leading-snug">{pdf.title}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Clock className="w-2.5 h-2.5 text-slate-300" />
                      <span className="text-[10px] text-slate-400">{pdf.uploadedAt}</span>
                      <span className="text-slate-200">·</span>
                      <span className="text-[10px] text-slate-400">{pdf.pages} hal.</span>
                    </div>
                  </div>
                </div>
              ))}
              {pdfs.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-8">Belum ada PDF</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Fields list page ─────────────────────────────────────────────────────────

export function ResearchFieldsPage({ fieldId }: { fieldId?: string }) {
  const { navigate } = useApp();
  const [searchQuery, setSearchQuery] = useState("");

  const selectedField = fieldId ? FIELDS.find((f) => f.id === fieldId) : null;
  if (selectedField) return <FieldDetailView field={selectedField} />;

  const filtered = searchQuery
    ? FIELDS.filter((f) =>
        f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.keywords.some((k) => k.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : FIELDS;

  return (
    <div className="min-h-screen bg-[#F5F4F1]">
      <Navbar />

      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-12 pb-8">
        <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-3">Jelajahi</p>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5">
          <div>
            <h1 className="text-3xl font-bold text-[#0C0D1A] tracking-tight mb-2">Bidang Penelitian</h1>
            <p className="text-slate-500 text-base max-w-lg">
              Temukan koleksi literatur yang dikategorikan berdasarkan bidang keilmuan
            </p>
          </div>
          <div className="flex items-center gap-2 bg-white border border-[rgba(12,13,26,0.1)] rounded-xl px-4 py-2.5 shadow-sm w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari bidang atau topik..."
              className="flex-1 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none bg-transparent"
            />
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
        {/* Overview stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { val: FIELDS.reduce((s, f) => s + f.collectionCount, 0), lbl: "Total Koleksi", color: "text-indigo-600", bg: "bg-indigo-50" },
            { val: FIELDS.reduce((s, f) => s + f.pdfCount, 0), lbl: "Total PDF", color: "text-emerald-600", bg: "bg-emerald-50" },
            { val: FIELDS.reduce((s, f) => s + f.contributors, 0), lbl: "Kontributor", color: "text-violet-600", bg: "bg-violet-50" },
          ].map(({ val, lbl, color, bg }) => (
            <div key={lbl} className={cn("rounded-2xl p-4 sm:p-5 text-center", bg)}>
              <p className={cn("text-xl sm:text-2xl font-bold", color)}>{val}</p>
              <p className="text-xs font-medium text-slate-500 mt-0.5">{lbl}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((field, idx) => (
            <FieldCard
              key={field.id}
              field={field}
              index={idx}
              onClick={() => navigate({ name: "field-detail", fieldId: field.id })}
            />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-20 text-slate-400">
            <p className="font-semibold text-slate-600 mb-1">Tidak ada bidang ditemukan</p>
            <p className="text-sm">Coba kata kunci lain</p>
          </div>
        )}
      </div>
    </div>
  );
}
