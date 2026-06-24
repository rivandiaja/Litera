import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Search,
  FileText,
  X,
  ArrowLeft,
  SlidersHorizontal,
  FolderOpen,
  BookOpen,
  Loader2,
  ChevronDown,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { useApp } from "../context";
import { useLiteratureSearch } from "../../hooks/use-literature-search";
import { formatDate, getAvatarColor, getInitials } from "../../lib/domain-display";
import { highlightText } from "../../lib/highlight-text";
import { documentService } from "../../services/document-service";
import { fieldService } from "../../services/field-service";
import { projectService } from "../../services/project-service";
import type { ResearchField } from "../../types/field";
import type { ResearchProject } from "../../types/project";
import type { SearchResultItem, SearchSort } from "../../types/search";
import { Navbar } from "./Navbar";
import { Badge, Avatar, Button, cn, type BadgeVariant } from "./ui";

const SORT_LABELS: Record<SearchSort, string> = {
  relevance: "Relevansi Tertinggi",
  newest: "Terbaru",
  title_asc: "Judul A-Z",
  title_desc: "Judul Z-A",
};

interface SearchResultsPageProps {
  query: string;
  initialResearchFieldId?: number;
  initialResearchProjectId?: number;
  initialOwnerId?: number;
  initialSortBy?: SearchSort;
  initialPage?: number;
}

function fieldBadgeVariant(name: string): BadgeVariant {
  if (name.toLowerCase().includes("jaringan")) return "indigo";
  if (name.toLowerCase().includes("inteli") || name.toLowerCase().includes("artificial")) return "lavender";
  if (name.toLowerCase().includes("iot")) return "mint";
  if (name.toLowerCase().includes("sistem")) return "sky";
  if (name.toLowerCase().includes("data")) return "coral";
  return "rose";
}

function formatScore(result: SearchResultItem) {
  return `${Math.round(result.relevance_percent)}%`;
}

export function SearchResultsPage({
  query,
  initialResearchFieldId,
  initialResearchProjectId,
  initialOwnerId,
  initialSortBy = "relevance",
  initialPage = 1,
}: SearchResultsPageProps) {
  const { navigate } = useApp();
  const [inputValue, setInputValue] = useState(query);
  const [currentQuery, setCurrentQuery] = useState(query.trim());
  const [filterFieldId, setFilterFieldId] = useState<number | null>(initialResearchFieldId ?? null);
  const [filterProjectId, setFilterProjectId] = useState<number | null>(initialResearchProjectId ?? null);
  const [ownerId, setOwnerId] = useState<number | null>(initialOwnerId ?? null);
  const [sortBy, setSortBy] = useState<SearchSort>(initialSortBy);
  const [page, setPage] = useState(initialPage);
  const [showFilters, setShowFilters] = useState(false);
  const [fields, setFields] = useState<ResearchField[]>([]);
  const [projects, setProjects] = useState<ResearchProject[]>([]);
  const [filtersError, setFiltersError] = useState<string | null>(null);
  const [openingDocumentId, setOpeningDocumentId] = useState<number | null>(null);

  const search = useLiteratureSearch({
    q: currentQuery,
    research_field_id: filterFieldId,
    research_project_id: filterProjectId,
    owner_id: ownerId,
    page,
    page_size: 10,
    sort_by: sortBy,
  });

  const selectedField = useMemo(
    () => fields.find((field) => field.id === filterFieldId) ?? null,
    [fields, filterFieldId]
  );
  const selectedProject = useMemo(
    () => projects.find((project) => project.id === filterProjectId) ?? null,
    [projects, filterProjectId]
  );

  const activeFilters = (filterFieldId ? 1 : 0)
    + (filterProjectId ? 1 : 0)
    + (ownerId ? 1 : 0)
    + (sortBy !== "relevance" ? 1 : 0);

  useEffect(() => {
    setInputValue(query);
    setCurrentQuery(query.trim());
    setFilterFieldId(initialResearchFieldId ?? null);
    setFilterProjectId(initialResearchProjectId ?? null);
    setOwnerId(initialOwnerId ?? null);
    setSortBy(initialSortBy);
    setPage(initialPage);
  }, [query, initialResearchFieldId, initialResearchProjectId, initialOwnerId, initialSortBy, initialPage]);

  useEffect(() => {
    let active = true;

    async function loadFilters() {
      setFiltersError(null);
      try {
        const [fieldResponse, projectResponse] = await Promise.all([
          fieldService.list({ page_size: 100 }),
          projectService.list({
            page_size: 100,
            field_id: filterFieldId ?? undefined,
            sort_by: "newest",
          }),
        ]);
        if (!active) return;
        setFields(fieldResponse.items);
        setProjects(projectResponse.items);
      } catch {
        if (active) setFiltersError("Filter gagal dimuat.");
      }
    }

    void loadFilters();
    return () => {
      active = false;
    };
  }, [filterFieldId]);

  function navigateSearchPage(
    nextQuery: string,
    nextFieldId: number | null,
    nextProjectId: number | null,
    nextSortBy: SearchSort,
    nextPage: number
  ) {
    setInputValue(nextQuery);
    setCurrentQuery(nextQuery);
    setFilterFieldId(nextFieldId);
    setFilterProjectId(nextProjectId);
    setSortBy(nextSortBy);
    setPage(nextPage);
    navigate({
      name: "search",
      query: nextQuery,
      researchFieldId: nextFieldId ?? undefined,
      researchProjectId: nextProjectId ?? undefined,
      ownerId: ownerId ?? undefined,
      sortBy: nextSortBy,
      page: nextPage,
    });
  }

  function runSearch(nextQuery: string) {
    const trimmed = nextQuery.trim();
    if (!trimmed) {
      toast.error("Masukkan kata kunci pencarian terlebih dahulu.");
      return;
    }
    navigateSearchPage(trimmed, filterFieldId, filterProjectId, sortBy, 1);
  }

  function handleSearch(event: FormEvent) {
    event.preventDefault();
    runSearch(inputValue);
  }

  function updateFieldFilter(fieldId: number | null) {
    navigateSearchPage(currentQuery, fieldId, null, sortBy, 1);
  }

  function updateProjectFilter(projectId: number | null) {
    navigateSearchPage(currentQuery, filterFieldId, projectId, sortBy, 1);
  }

  function updateSort(nextSort: SearchSort) {
    navigateSearchPage(currentQuery, filterFieldId, filterProjectId, nextSort, 1);
  }

  function clearFilters() {
    navigateSearchPage(currentQuery, null, null, "relevance", 1);
  }

  const openDocument = useCallback(async (result: SearchResultItem, targetPage?: number | null) => {
    setOpeningDocumentId(result.document_id);
    try {
      await documentService.openDocumentFile(result.document_id, result.original_filename, targetPage ?? result.best_page);
    } catch (_err) {
      toast.error("PDF gagal dibuka. Periksa koneksi dan coba lagi.");
    } finally {
      setOpeningDocumentId(null);
    }
  }, []);

  function FilterPanel() {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em] mb-3">Bidang Penelitian</p>
          <div className="flex flex-col gap-0.5">
            {[{ id: null, name: "Semua Bidang", project_count: search.data?.pagination.total_items ?? 0 }, ...fields].map((field) => (
              <button key={String(field.id)} onClick={() => updateFieldFilter(field.id)}
                className={cn(
                  "flex items-center justify-between w-full px-3 py-2.5 rounded-xl text-sm transition-all text-left",
                  filterFieldId === field.id
                    ? "bg-indigo-50 text-indigo-700 font-semibold"
                    : "text-slate-600 hover:bg-slate-50/80 hover:text-slate-900"
                )}>
                <span>{field.name}</span>
                <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full font-bold",
                  filterFieldId === field.id ? "bg-indigo-100 text-indigo-600" : "bg-slate-100 text-slate-400")}>
                  {"project_count" in field ? field.project_count : "—"}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="h-px bg-[rgba(12,13,26,0.06)]" />

        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em] mb-3">Koleksi Penelitian</p>
          <div className="flex flex-col gap-0.5">
            <button onClick={() => updateProjectFilter(null)}
              className={cn(
                "flex items-center justify-between w-full px-3 py-2.5 rounded-xl text-sm transition-all text-left",
                filterProjectId === null ? "bg-indigo-50 text-indigo-700 font-semibold" : "text-slate-600 hover:bg-slate-50/80 hover:text-slate-900"
              )}>
              <span>Semua Koleksi</span>
            </button>
            {projects.map((project) => (
              <button key={project.id} onClick={() => updateProjectFilter(project.id)}
                className={cn(
                  "flex items-center justify-between w-full px-3 py-2.5 rounded-xl text-sm transition-all text-left",
                  filterProjectId === project.id
                    ? "bg-indigo-50 text-indigo-700 font-semibold"
                    : "text-slate-600 hover:bg-slate-50/80 hover:text-slate-900"
                )}>
                <span className="line-clamp-1 break-words">{project.title}</span>
                <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full font-bold",
                  filterProjectId === project.id ? "bg-indigo-100 text-indigo-600" : "bg-slate-100 text-slate-400")}>
                  {project.document_count}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="h-px bg-[rgba(12,13,26,0.06)]" />

        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em] mb-3">Urutkan</p>
          <div className="flex flex-col gap-0.5">
            {(Object.entries(SORT_LABELS) as [SearchSort, string][]).map(([value, label]) => (
              <button key={value} onClick={() => updateSort(value)}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all text-left",
                  sortBy === value ? "bg-indigo-50 text-indigo-700 font-semibold" : "text-slate-600 hover:bg-slate-50/80"
                )}>
                <span className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0",
                  sortBy === value ? "border-indigo-600" : "border-slate-300")}>
                  {sortBy === value && <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />}
                </span>
                {label}
              </button>
            ))}
          </div>
        </div>

        {filtersError && <p className="text-xs text-red-500 font-semibold">{filtersError}</p>}

        {activeFilters > 0 && (
          <button onClick={clearFilters}
            className="flex items-center gap-1.5 text-xs font-semibold text-red-500 hover:text-red-600 transition-colors mt-1">
            <X className="w-3.5 h-3.5" />
            Reset filter ({activeFilters})
          </button>
        )}
      </div>
    );
  }

  const results = search.data?.results ?? [];
  const pagination = search.data?.pagination;

  return (
    <div className="min-h-screen bg-[#F5F4F1]">
      <Navbar />

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
                onChange={(event) => setInputValue(event.target.value)}
                className="flex-1 px-3 py-2.5 text-sm text-slate-900 focus:outline-none bg-transparent placeholder:text-slate-400"
                placeholder="Cari literatur..."
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
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="bg-white rounded-[1.25rem] border border-[rgba(12,13,26,0.07)] shadow-[0_1px_4px_rgba(12,13,26,0.05)] p-5 sticky top-[124px]">
              <p className="text-xs font-bold text-[#0C0D1A] mb-4 flex items-center gap-2">
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
                Filter & Urutan
              </p>
              <FilterPanel />
            </div>
          </aside>

          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
              <div>
                <p className="text-sm text-slate-500">
                  <strong className="text-[#0C0D1A] font-bold">{pagination?.total_items ?? 0} hasil</strong>
                  {" "}untuk{" "}
                  <strong className="text-[#0C0D1A] font-bold">"{currentQuery}"</strong>
                </p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {selectedField && <Badge variant="indigo">Bidang: {selectedField.name}</Badge>}
                  {selectedProject && <Badge variant="mint">Koleksi: {selectedProject.title}</Badge>}
                  {search.data?.processed_terms.map((term) => (
                    <span key={term} className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{term}</span>
                  ))}
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-2">
                <span className="text-xs text-slate-400 font-medium">Urut:</span>
                <div className="relative">
                  <select value={sortBy} onChange={(event) => updateSort(event.target.value as SearchSort)}
                    className="appearance-none text-xs border border-[rgba(12,13,26,0.09)] rounded-lg pl-3 pr-7 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-200 font-semibold cursor-pointer">
                    {(Object.entries(SORT_LABELS) as [SearchSort, string][]).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {showFilters && (
              <div className="mb-5 bg-white rounded-[1.25rem] border border-[rgba(12,13,26,0.07)] shadow-sm p-5 lg:hidden">
                <FilterPanel />
              </div>
            )}

            {search.isLoading ? (
              <div className="flex flex-col items-center justify-center py-28 gap-4 bg-white rounded-[1.25rem] border border-[rgba(12,13,26,0.07)]">
                <Loader2 className="w-7 h-7 text-indigo-400 animate-spin" />
                <p className="text-sm text-slate-400 font-medium">Mencari literatur...</p>
              </div>

            ) : search.error ? (
              <div className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-[1.25rem] border border-red-100">
                <AlertTriangle className="w-8 h-8 text-red-300 mb-4" />
                <h3 className="font-bold text-[#0C0D1A] mb-1.5">Pencarian gagal dimuat.</h3>
                <p className="text-sm text-slate-400 mb-6 max-w-xs">Periksa koneksi dan coba lagi.</p>
                <Button variant="outline" size="sm" onClick={search.retry}>Coba Lagi</Button>
              </div>

            ) : results.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mb-6">
                  <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="16" cy="16" r="11" stroke="#CBD5E1" strokeWidth="2.5" fill="none"/>
                    <path d="M24 24 L30 30" stroke="#CBD5E1" strokeWidth="2.5" strokeLinecap="round"/>
                    <path d="M11 16 h10 M16 11 v10" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" opacity="0.5"/>
                  </svg>
                </div>
                <h3 className="font-bold text-[#0C0D1A] mb-1.5">Tidak ada literatur yang ditemukan.</h3>
                <p className="text-sm text-slate-400 mb-6 max-w-xs">Coba gunakan kata kunci lain atau ubah filter pencarian.</p>
                <div className="flex gap-2">
                  {activeFilters > 0 && (
                    <Button variant="outline" size="sm" onClick={clearFilters}>
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
                  <div key={result.document_id}
                    className="bg-white rounded-[1.25rem] border border-[rgba(12,13,26,0.07)] shadow-[0_1px_4px_rgba(12,13,26,0.05)] hover:shadow-[0_6px_20px_rgba(12,13,26,0.09)] hover:border-[rgba(12,13,26,0.11)] transition-all duration-200 overflow-hidden group">

                    <div className="h-[3px] bg-slate-100">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-violet-400 rounded-full"
                        style={{ width: `${Math.min(100, Math.max(0, result.relevance_percent))}%` }}
                      />
                    </div>

                    <div className="p-5 sm:p-6">
                      <div className="flex gap-4">
                        <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                          <FileText className="w-5 h-5 text-red-400" strokeWidth={1.5} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-3 mb-2.5 flex-wrap sm:flex-nowrap">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-[#0C0D1A] leading-snug text-[0.9375rem] group-hover:text-indigo-700 transition-colors break-words">
                                {result.title}
                              </h3>
                              <p className="text-[11px] text-slate-400 font-medium mt-1 line-clamp-1 break-words">{result.original_filename}</p>
                            </div>
                            <div className="inline-flex items-center gap-1.5 shrink-0 bg-emerald-50 border border-emerald-100 rounded-full px-2.5 py-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                              <span className="text-[11px] font-bold text-emerald-700">{formatScore(result)}</span>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 mb-3">
                            <Badge variant={fieldBadgeVariant(result.field.name)}>{result.field.name}</Badge>
                            <span className="text-[11px] text-slate-400 font-medium">{result.total_pages} halaman</span>
                            <span className="text-slate-200">·</span>
                            <span className="text-[11px] text-slate-400 font-medium">{formatDate(result.created_at)}</span>
                            <span className="text-slate-200">·</span>
                            <span className="text-[11px] text-slate-400 font-medium">Skor {result.score.toFixed(4)}</span>
                          </div>

                          <div className="flex items-center gap-2 text-xs text-slate-400 mb-3.5">
                            <FolderOpen className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                            <span className="line-clamp-1 break-words font-medium text-slate-500">{result.project.title}</span>
                            <span className="text-slate-200 shrink-0">·</span>
                            <Avatar initials={getInitials(result.owner.name)} color={getAvatarColor(result.owner.id)} size="xs" />
                            <span className="font-medium text-slate-500 shrink-0">{result.owner.name}</span>
                          </div>

                          {result.snippet && (
                            <div className="bg-[#FAFAF8] border border-[rgba(12,13,26,0.07)] rounded-xl px-4 py-3 mb-4 text-[0.8125rem] text-slate-600 leading-[1.65] break-words">
                              "{highlightText(result.snippet, result.matched_terms)}"
                            </div>
                          )}

                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Halaman relevan</span>
                              {result.relevant_pages.slice(0, 5).map((matchedPage) => (
                                <button
                                  key={matchedPage}
                                  onClick={() => void openDocument(result, matchedPage)}
                                  className="text-[11px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded-lg transition-all"
                                >
                                  Hal. {matchedPage}
                                </button>
                              ))}
                              {result.relevant_pages.length === 0 && (
                                <span className="text-[11px] text-slate-400 font-medium">Tidak tersedia</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="xs"
                                onClick={() => navigate({ name: "collection", collectionId: String(result.project.id) })}>
                                <FolderOpen className="w-3 h-3" />
                                Lihat Koleksi
                              </Button>
                              <Button size="xs" onClick={() => void openDocument(result, result.best_page)} loading={openingDocumentId === result.document_id}>
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

                {pagination && pagination.total_pages > 1 && (
                  <div className="flex items-center justify-center gap-2 pt-6">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigateSearchPage(currentQuery, filterFieldId, filterProjectId, sortBy, Math.max(1, pagination.page - 1))}
                      disabled={pagination.page <= 1}
                    >
                      Sebelumnya
                    </Button>
                    <span className="text-xs font-semibold text-slate-500 px-3">
                      Halaman {pagination.page} dari {pagination.total_pages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigateSearchPage(currentQuery, filterFieldId, filterProjectId, sortBy, pagination.page + 1)}
                      disabled={pagination.page >= pagination.total_pages}
                    >
                      Berikutnya
                    </Button>
                  </div>
                )}

                <div className="text-center py-8">
                  <p className="text-xs text-slate-400 font-medium">
                    Menampilkan {results.length} dari {pagination?.total_items ?? results.length} hasil
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
