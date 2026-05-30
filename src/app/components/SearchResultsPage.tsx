import { useState } from "react";
import { Search, FileText, X, ArrowLeft, SlidersHorizontal, FolderOpen, BookOpen, Loader2, ChevronDown } from "lucide-react";
import { useApp } from "../context";
import { Navbar } from "./Navbar";
import { Badge, Avatar, Button, Chip, cn, type BadgeVariant } from "./ui";
import { SEARCH_RESULTS, FIELDS } from "./data";

export function SearchResultsPage({ query }: { query: string }) {
  const { navigate } = useApp();
  const [inputValue, setInputValue] = useState(query);
  const [currentQuery, setCurrentQuery] = useState(query);
  const [filterField, setFilterField] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"relevance" | "date">("relevance");
  const [showFilters, setShowFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (inputValue.trim() !== currentQuery) {
      setIsLoading(true);
      setTimeout(() => { setCurrentQuery(inputValue); setIsLoading(false); }, 700);
    }
  }

  const results = SEARCH_RESULTS
    .filter((r) => !filterField || r.fieldName === filterField)
    .sort((a, b) => sortBy === "relevance" ? b.relevance - a.relevance : 0);

  const activeFilters = (filterField ? 1 : 0) + (sortBy !== "relevance" ? 1 : 0);

  // Field accent for result cards
  const fieldBadgeVariant = (name: string): BadgeVariant => {
    if (name.toLowerCase().includes("jaringan")) return "indigo";
    if (name.toLowerCase().includes("inteli") || name.toLowerCase().includes("artificial")) return "lavender";
    if (name.toLowerCase().includes("iot")) return "mint";
    if (name.toLowerCase().includes("sistem")) return "sky";
    if (name.toLowerCase().includes("data")) return "coral";
    return "rose";
  };

  function FilterPanel() {
    return (
      <div className="flex flex-col gap-6">
        {/* Field filter */}
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em] mb-3">Bidang Penelitian</p>
          <div className="flex flex-col gap-0.5">
            {[
              { id: null, name: "Semua Bidang", count: SEARCH_RESULTS.length },
              ...FIELDS.map((f) => ({ id: f.name, name: f.name, count: SEARCH_RESULTS.filter((r) => r.fieldName === f.name).length }))
            ].filter((f) => f.count > 0).map((f) => (
              <button key={String(f.id)} onClick={() => setFilterField(f.id)}
                className={cn(
                  "flex items-center justify-between w-full px-3 py-2.5 rounded-xl text-sm transition-all text-left",
                  filterField === f.id
                    ? "bg-indigo-50 text-indigo-700 font-semibold"
                    : "text-slate-600 hover:bg-slate-50/80 hover:text-slate-900"
                )}>
                <span>{f.name}</span>
                <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full font-bold",
                  filterField === f.id ? "bg-indigo-100 text-indigo-600" : "bg-slate-100 text-slate-400")}>
                  {f.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="h-px bg-[rgba(12,13,26,0.06)]" />

        {/* Sort */}
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em] mb-3">Urutkan</p>
          <div className="flex flex-col gap-0.5">
            {([["relevance", "Relevansi Tertinggi"], ["date", "Terbaru"]] as const).map(([v, l]) => (
              <button key={v} onClick={() => setSortBy(v)}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all text-left",
                  sortBy === v ? "bg-indigo-50 text-indigo-700 font-semibold" : "text-slate-600 hover:bg-slate-50/80"
                )}>
                <span className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0",
                  sortBy === v ? "border-indigo-600" : "border-slate-300")}>
                  {sortBy === v && <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />}
                </span>
                {l}
              </button>
            ))}
          </div>
        </div>

        <div className="h-px bg-[rgba(12,13,26,0.06)]" />

        {/* Year chips */}
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em] mb-3">Tahun Upload</p>
          <div className="flex flex-wrap gap-1.5">
            {["2024", "2023", "2022"].map((y) => <Chip key={y}>{y}</Chip>)}
          </div>
        </div>

        {activeFilters > 0 && (
          <button onClick={() => { setFilterField(null); setSortBy("relevance"); }}
            className="flex items-center gap-1.5 text-xs font-semibold text-red-500 hover:text-red-600 transition-colors mt-1">
            <X className="w-3.5 h-3.5" />
            Reset filter ({activeFilters})
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F4F1]">
      <Navbar />

      {/* Sticky search bar */}
      <div className="sticky top-[60px] z-40 bg-white/95 backdrop-blur-xl border-b border-[rgba(12,13,26,0.07)] shadow-[0_2px_12px_rgba(12,13,26,0.04)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
          <form onSubmit={handleSearch} className="flex items-center gap-2.5">
            <button type="button" onClick={() => navigate({ name: "home" })}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1 flex items-center bg-slate-50 border border-[rgba(12,13,26,0.09)] rounded-xl overflow-hidden hover:border-slate-300 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-200 transition-all">
              <Search className="w-4 h-4 text-slate-400 ml-3.5 shrink-0" />
              <input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="flex-1 px-3 py-2.5 text-sm text-slate-900 focus:outline-none bg-transparent placeholder:text-slate-400"
              />
              {inputValue && (
                <button type="button" onClick={() => setInputValue("")}
                  className="p-2 mr-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/50 transition-all">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <button type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 active:scale-[0.97] text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shrink-0">
              Cari
            </button>
            {/* Mobile filter toggle */}
            <button type="button" onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "lg:hidden relative flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-semibold border transition-all",
                showFilters || activeFilters > 0
                  ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                  : "bg-white border-[rgba(12,13,26,0.09)] text-slate-600 hover:border-slate-300"
              )}>
              <SlidersHorizontal className="w-4 h-4" />
              {activeFilters > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {activeFilters}
                </span>
              )}
            </button>
          </form>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-7">
        <div className="flex gap-7">

          {/* Desktop filter sidebar */}
          <aside className="hidden lg:block w-56 shrink-0">
            <div className="bg-white rounded-[1.25rem] border border-[rgba(12,13,26,0.07)] shadow-[0_1px_4px_rgba(12,13,26,0.05)] p-5 sticky top-[124px]">
              <p className="text-xs font-bold text-[#0C0D1A] mb-4 flex items-center gap-2">
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
                Filter & Urutan
              </p>
              <FilterPanel />
            </div>
          </aside>

          {/* Results column */}
          <div className="flex-1 min-w-0">

            {/* Results header */}
            <div className="flex items-center justify-between mb-5">
              <p className="text-sm text-slate-500">
                <strong className="text-[#0C0D1A] font-bold">{results.length} hasil</strong>
                {" "}untuk{" "}
                <strong className="text-[#0C0D1A] font-bold">"{currentQuery}"</strong>
              </p>
              {/* Desktop inline sort */}
              <div className="hidden sm:flex items-center gap-2">
                <span className="text-xs text-slate-400 font-medium">Urut:</span>
                <div className="relative">
                  <select value={sortBy} onChange={(e) => setSortBy(e.target.value as "relevance" | "date")}
                    className="appearance-none text-xs border border-[rgba(12,13,26,0.09)] rounded-lg pl-3 pr-7 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-200 font-semibold cursor-pointer">
                    <option value="relevance">Relevansi Tertinggi</option>
                    <option value="date">Terbaru</option>
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Mobile filter panel */}
            {showFilters && (
              <div className="mb-5 bg-white rounded-[1.25rem] border border-[rgba(12,13,26,0.07)] shadow-sm p-5 lg:hidden">
                <FilterPanel />
              </div>
            )}

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-28 gap-4">
                <Loader2 className="w-7 h-7 text-indigo-400 animate-spin" />
                <p className="text-sm text-slate-400 font-medium">Mencari literatur...</p>
              </div>

            ) : results.length === 0 ? (
              /* Empty state */
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mb-6">
                  <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="16" cy="16" r="11" stroke="#CBD5E1" strokeWidth="2.5" fill="none"/>
                    <path d="M24 24 L30 30" stroke="#CBD5E1" strokeWidth="2.5" strokeLinecap="round"/>
                    <path d="M11 16 h10 M16 11 v10" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" opacity="0.5"/>
                  </svg>
                </div>
                <h3 className="font-bold text-[#0C0D1A] mb-1.5">Tidak ada hasil ditemukan</h3>
                <p className="text-sm text-slate-400 mb-6 max-w-xs">Coba kata kunci yang lebih umum, atau hapus filter aktif untuk melihat lebih banyak hasil.</p>
                <div className="flex gap-2">
                  {activeFilters > 0 && (
                    <Button variant="outline" size="sm" onClick={() => { setFilterField(null); setSortBy("relevance"); }}>
                      Hapus Filter
                    </Button>
                  )}
                  <Button variant="secondary" size="sm" onClick={() => navigate({ name: "fields" })}>
                    <BookOpen className="w-3.5 h-3.5" />
                    Jelajahi Bidang
                  </Button>
                </div>
              </div>

            ) : (
              <div className="flex flex-col gap-3.5">
                {results.map((result) => (
                  <div key={result.pdfId}
                    className="bg-white rounded-[1.25rem] border border-[rgba(12,13,26,0.07)] shadow-[0_1px_4px_rgba(12,13,26,0.05)] hover:shadow-[0_6px_20px_rgba(12,13,26,0.09)] hover:border-[rgba(12,13,26,0.11)] transition-all duration-200 overflow-hidden group">

                    {/* Relevance accent bar */}
                    <div className="h-[3px] bg-slate-100">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-violet-400 rounded-full"
                        style={{ width: `${result.relevance}%` }}
                      />
                    </div>

                    <div className="p-5 sm:p-6">
                      <div className="flex gap-4">
                        {/* PDF icon */}
                        <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                          <FileText className="w-5 h-5 text-red-400" strokeWidth={1.5} />
                        </div>

                        <div className="flex-1 min-w-0">
                          {/* Title row */}
                          <div className="flex items-start gap-3 mb-2.5 flex-wrap sm:flex-nowrap">
                            <h3 className="font-bold text-[#0C0D1A] leading-snug text-[0.9375rem] group-hover:text-indigo-700 cursor-pointer transition-colors flex-1">
                              {result.title}
                            </h3>
                            {/* Relevance pill */}
                            <div className="inline-flex items-center gap-1.5 shrink-0 bg-emerald-50 border border-emerald-100 rounded-full px-2.5 py-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                              <span className="text-[11px] font-bold text-emerald-700">{result.relevance}%</span>
                            </div>
                          </div>

                          {/* Metadata chips */}
                          <div className="flex flex-wrap items-center gap-2 mb-3">
                            <Badge variant={fieldBadgeVariant(result.fieldName)}>{result.fieldName}</Badge>
                            <span className="text-[11px] text-slate-400 font-medium">{result.pages} halaman</span>
                            <span className="text-slate-200">·</span>
                            <span className="text-[11px] text-slate-400 font-medium">{result.uploadedAt}</span>
                          </div>

                          {/* Collection + owner */}
                          <div className="flex items-center gap-2 text-xs text-slate-400 mb-3.5">
                            <FolderOpen className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                            <span className="line-clamp-1 font-medium text-slate-500">{result.collectionTitle}</span>
                            <span className="text-slate-200 shrink-0">·</span>
                            <Avatar initials={result.owner.initials} color={result.owner.avatarColor} size="xs" />
                            <span className="font-medium text-slate-500 shrink-0">{result.owner.name}</span>
                          </div>

                          {/* Excerpt */}
                          {result.excerpt && (
                            <div className="bg-[#FAFAF8] border border-[rgba(12,13,26,0.07)] rounded-xl px-4 py-3 mb-4 text-[0.8125rem] text-slate-600 leading-[1.65]"
                              dangerouslySetInnerHTML={{
                                __html: `"${result.excerpt
                                  .replace(/<mark>/g, '<mark class="bg-amber-200/80 text-amber-900 px-0.5 rounded-[3px] font-semibold not-italic">')
                                  .replace(/<\/mark>/g, '</mark>')}"`
                              }}
                            />
                          )}

                          {/* Match pages + actions */}
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Ditemukan di</span>
                              {result.matchPages.map((p) => (
                                <span key={p} className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg">
                                  Hal. {p}
                                </span>
                              ))}
                            </div>
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="xs"
                                onClick={() => navigate({ name: "collection", collectionId: result.collectionId })}>
                                <FolderOpen className="w-3 h-3" />
                                Koleksi
                              </Button>
                              <Button size="xs">
                                <BookOpen className="w-3 h-3" />
                                Buka PDF
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* End-of-results note */}
                <div className="text-center py-8">
                  <p className="text-xs text-slate-400 font-medium">Menampilkan {results.length} dari {results.length} hasil</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
