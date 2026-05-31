import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  LayoutDashboard, Network, Users, BookOpen, FileText, Activity, Settings, LogOut,
  Plus, Search, Edit2, Trash2, X, Menu, Brain, Cpu, Database, BarChart2, Code2,
  AlertTriangle, CheckCircle2, Loader2, TrendingUp, Eye, Shield, ChevronRight,
  RefreshCw, ArrowUpRight, type LucideIcon,
} from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { toast } from "sonner";
import { useApp } from "../context";
import { useAuth } from "../../contexts/AuthContext";
import { useAdminDashboard } from "../../hooks/use-admin-dashboard";
import { getSafeErrorMessage } from "../../lib/api-error";
import { adaptField, formatDate, getAvatarColor, getInitials, type FieldDisplay } from "../../lib/domain-display";
import { adminService } from "../../services/admin-service";
import { documentService } from "../../services/document-service";
import { fieldService } from "../../services/field-service";
import type {
  AdminDocumentRead,
  AdminDocumentListResponse,
  AdminIndexingResponse,
  AdminProjectListResponse,
  AdminUserListResponse,
  AdminUserRead,
} from "../../types/admin";
import type { UserRole } from "../../types/auth";
import type { DashboardDocumentSummary } from "../../types/dashboard";
import type { IndexStatus } from "../../types/document";
import type { ProjectVisibility } from "../../types/project";
import { Badge, Button, Avatar, InputField, TextareaField, StatusDot, ProgressBar, cn } from "./ui";

type Tab = "overview" | "fields" | "users" | "collections" | "documents" | "indexing" | "settings";
type StatusFilter = "all" | IndexStatus;
type RoleFilter = "all" | UserRole;
type ActiveFilter = "all" | "active" | "inactive";
type VisibilityFilter = "all" | ProjectVisibility;
type FieldFilter = "all" | number;

const PAGE_SIZE = 8;

const ICON_MAP: Record<string, LucideIcon> = {
  Network, Brain, Cpu, Database, BarChart2, Code2,
};

const NAV_ITEMS: { id: Tab; label: string; icon: LucideIcon }[] = [
  { id: "overview", label: "Ringkasan", icon: LayoutDashboard },
  { id: "fields", label: "Bidang Penelitian", icon: Network },
  { id: "users", label: "Pengguna", icon: Users },
  { id: "collections", label: "Koleksi", icon: BookOpen },
  { id: "documents", label: "Dokumen PDF", icon: FileText },
  { id: "indexing", label: "Monitor Indexing", icon: Activity },
  { id: "settings", label: "Pengaturan", icon: Settings },
];

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Semua" },
  { value: "pending", label: "Pending" },
  { value: "processing", label: "Processing" },
  { value: "indexed", label: "Indexed" },
  { value: "failed", label: "Failed" },
];

const selectClass = "w-full rounded-xl border border-[rgba(12,13,26,0.1)] bg-white px-3 py-2.5 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300";

function formatNumber(value: number | undefined) {
  return new Intl.NumberFormat("id-ID").format(value ?? 0);
}

function formatBytes(value: number) {
  if (value >= 1024 * 1024) return `${(value / (1024 * 1024)).toFixed(1)} MB`;
  if (value >= 1024) return `${Math.max(1, Math.round(value / 1024))} KB`;
  return `${value} B`;
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function activeFilterToBoolean(value: ActiveFilter) {
  if (value === "active") return true;
  if (value === "inactive") return false;
  return undefined;
}

function fieldFilterToParam(value: FieldFilter) {
  return value === "all" ? undefined : value;
}

function statusFilterToParam(value: StatusFilter) {
  return value === "all" ? undefined : value;
}

function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="bg-white rounded-[1.125rem] border border-[rgba(12,13,26,0.07)] p-8 text-center text-sm text-slate-400">
      {children}
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="bg-white rounded-[1.125rem] border border-red-100 p-8 text-center">
      <p className="text-sm font-semibold text-red-600 mb-4">{message}</p>
      <Button variant="outline" onClick={onRetry}>Coba Lagi</Button>
    </div>
  );
}

function PaginationControls({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2 pt-4">
      <Button variant="outline" size="sm" onClick={() => onPageChange(Math.max(1, page - 1))} disabled={page <= 1}>
        Sebelumnya
      </Button>
      <span className="text-xs font-semibold text-slate-500 px-3">
        Halaman {page} dari {totalPages}
      </span>
      <Button variant="outline" size="sm" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages}>
        Berikutnya
      </Button>
    </div>
  );
}

export function AdminDashboard() {
  const { navigate } = useApp();
  const { user, logout } = useAuth();
  const adminDashboard = useAdminDashboard();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [fieldModalOpen, setFieldModalOpen] = useState(false);
  const [editingField, setEditingField] = useState<FieldDisplay | null>(null);
  const [fieldSearch, setFieldSearch] = useState("");
  const [apiFields, setApiFields] = useState<FieldDisplay[]>([]);
  const [fieldsLoading, setFieldsLoading] = useState(true);
  const [fieldsError, setFieldsError] = useState<string | null>(null);

  const [userSearch, setUserSearch] = useState("");
  const [userRole, setUserRole] = useState<RoleFilter>("all");
  const [userStatus, setUserStatus] = useState<ActiveFilter>("all");
  const [usersPage, setUsersPage] = useState(1);
  const [usersData, setUsersData] = useState<AdminUserListResponse | null>(null);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);

  const [projectSearch, setProjectSearch] = useState("");
  const [projectField, setProjectField] = useState<FieldFilter>("all");
  const [projectVisibility, setProjectVisibility] = useState<VisibilityFilter>("all");
  const [projectsPage, setProjectsPage] = useState(1);
  const [projectsData, setProjectsData] = useState<AdminProjectListResponse | null>(null);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [projectsError, setProjectsError] = useState<string | null>(null);

  const [documentSearch, setDocumentSearch] = useState("");
  const [documentStatus, setDocumentStatus] = useState<StatusFilter>("all");
  const [documentField, setDocumentField] = useState<FieldFilter>("all");
  const [documentsPage, setDocumentsPage] = useState(1);
  const [documentsData, setDocumentsData] = useState<AdminDocumentListResponse | null>(null);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [documentsError, setDocumentsError] = useState<string | null>(null);

  const [indexingSearch, setIndexingSearch] = useState("");
  const [indexingStatus, setIndexingStatus] = useState<StatusFilter>("all");
  const [indexingPage, setIndexingPage] = useState(1);
  const [indexingData, setIndexingData] = useState<AdminIndexingResponse | null>(null);
  const [indexingLoading, setIndexingLoading] = useState(false);
  const [indexingError, setIndexingError] = useState<string | null>(null);

  const failedBadgeCount = adminDashboard.data?.summary.failed_documents_count ?? indexingData?.summary.failed ?? 0;
  const processingBadgeCount = adminDashboard.data
    ? adminDashboard.data.summary.pending_documents_count + adminDashboard.data.summary.processing_documents_count
    : (indexingData?.summary.pending ?? 0) + (indexingData?.summary.processing ?? 0);

  const todayLabel = useMemo(() => (
    new Intl.DateTimeFormat("id-ID", { dateStyle: "full" }).format(new Date())
  ), []);

  const loadFields = useCallback(async () => {
    setFieldsLoading(true);
    setFieldsError(null);
    try {
      const response = await fieldService.list({
        page_size: 100,
        include_inactive: true,
        search: fieldSearch || undefined,
      });
      setApiFields(response.items.map(adaptField));
    } catch (error) {
      setFieldsError(getSafeErrorMessage(error));
    } finally {
      setFieldsLoading(false);
    }
  }, [fieldSearch]);

  const loadUsers = useCallback(async () => {
    setUsersLoading(true);
    setUsersError(null);
    try {
      setUsersData(await adminService.listUsers({
        page: usersPage,
        page_size: PAGE_SIZE,
        search: userSearch || undefined,
        role: userRole === "all" ? undefined : userRole,
        is_active: activeFilterToBoolean(userStatus),
      }));
    } catch (error) {
      setUsersError(getSafeErrorMessage(error));
    } finally {
      setUsersLoading(false);
    }
  }, [usersPage, userSearch, userRole, userStatus]);

  const loadProjects = useCallback(async () => {
    setProjectsLoading(true);
    setProjectsError(null);
    try {
      setProjectsData(await adminService.listProjects({
        page: projectsPage,
        page_size: PAGE_SIZE,
        search: projectSearch || undefined,
        research_field_id: fieldFilterToParam(projectField),
        visibility: projectVisibility === "all" ? undefined : projectVisibility,
        sort_by: "newest",
      }));
    } catch (error) {
      setProjectsError(getSafeErrorMessage(error));
    } finally {
      setProjectsLoading(false);
    }
  }, [projectsPage, projectSearch, projectField, projectVisibility]);

  const loadDocuments = useCallback(async () => {
    setDocumentsLoading(true);
    setDocumentsError(null);
    try {
      setDocumentsData(await adminService.listDocuments({
        page: documentsPage,
        page_size: PAGE_SIZE,
        search: documentSearch || undefined,
        index_status: statusFilterToParam(documentStatus),
        research_field_id: fieldFilterToParam(documentField),
        sort_by: "newest",
      }));
    } catch (error) {
      setDocumentsError(getSafeErrorMessage(error));
    } finally {
      setDocumentsLoading(false);
    }
  }, [documentsPage, documentSearch, documentStatus, documentField]);

  const loadIndexing = useCallback(async (quiet = false) => {
    if (!quiet) setIndexingLoading(true);
    setIndexingError(null);
    try {
      setIndexingData(await adminService.listIndexing({
        page: indexingPage,
        page_size: PAGE_SIZE,
        search: indexingSearch || undefined,
        index_status: statusFilterToParam(indexingStatus),
      }));
    } catch (error) {
      setIndexingError(getSafeErrorMessage(error));
    } finally {
      if (!quiet) setIndexingLoading(false);
    }
  }, [indexingPage, indexingSearch, indexingStatus]);

  useEffect(() => {
    loadFields();
  }, [loadFields]);

  useEffect(() => {
    if (activeTab === "users") loadUsers();
  }, [activeTab, loadUsers]);

  useEffect(() => {
    if (activeTab === "collections") loadProjects();
  }, [activeTab, loadProjects]);

  useEffect(() => {
    if (activeTab === "documents") loadDocuments();
  }, [activeTab, loadDocuments]);

  useEffect(() => {
    if (activeTab === "indexing") loadIndexing();
  }, [activeTab, loadIndexing]);

  useEffect(() => {
    if (activeTab !== "indexing") return undefined;
    const summary = indexingData?.summary;
    const activeCount = (summary?.pending ?? 0) + (summary?.processing ?? 0);
    if (activeCount <= 0) return undefined;

    const intervalId = window.setInterval(() => {
      void loadIndexing(true);
      void adminDashboard.retry();
    }, 4000);

    return () => window.clearInterval(intervalId);
  }, [activeTab, indexingData?.summary.pending, indexingData?.summary.processing, loadIndexing, adminDashboard]);

  function handleLogout() {
    logout();
    navigate({ name: "login" });
  }

  async function refreshAdminData() {
    await Promise.all([
      adminDashboard.retry(),
      activeTab === "users" ? loadUsers() : Promise.resolve(),
      activeTab === "documents" ? loadDocuments() : Promise.resolve(),
      activeTab === "indexing" ? loadIndexing(true) : Promise.resolve(),
    ]);
  }

  async function handleToggleUser(targetUser: AdminUserRead) {
    const nextActive = !targetUser.is_active;
    const action = nextActive ? "mengaktifkan" : "menonaktifkan";
    if (!window.confirm(`Yakin ${action} akun ${targetUser.name}?`)) return;

    try {
      await adminService.updateUser(targetUser.id, { is_active: nextActive });
      toast.success(nextActive ? "Akun pengguna diaktifkan." : "Akun pengguna dinonaktifkan.");
      await refreshAdminData();
    } catch (error) {
      toast.error(getSafeErrorMessage(error));
    }
  }

  async function handleOpenDocument(document: AdminDocumentRead | DashboardDocumentSummary) {
    try {
      await documentService.openDocumentFile(document.id, document.original_filename);
    } catch (error) {
      toast.error(getSafeErrorMessage(error));
    }
  }

  async function handleReindexDocument(document: AdminDocumentRead | DashboardDocumentSummary) {
    try {
      await documentService.reindexDocument(document.id);
      toast.success("Re-index dokumen dijadwalkan.");
      await Promise.all([adminDashboard.retry(), loadDocuments(), loadIndexing(true)]);
    } catch (error) {
      toast.error(getSafeErrorMessage(error));
    }
  }

  async function handleDeleteDocument(document: AdminDocumentRead) {
    if (!window.confirm(`Hapus dokumen "${document.title}"?`)) return;
    try {
      await documentService.deleteDocument(document.id);
      toast.success("Dokumen berhasil dihapus.");
      await Promise.all([adminDashboard.retry(), loadDocuments(), loadIndexing(true)]);
    } catch (error) {
      toast.error(getSafeErrorMessage(error));
    }
  }

  function SidebarContent() {
    return (
      <div className="flex flex-col h-full">
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

        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <p className="text-[9px] font-bold text-slate-600 uppercase tracking-[0.1em] px-3 mb-2">Manajemen</p>
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            const badge = item.id === "indexing" ? failedBadgeCount : 0;
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

        <div className="px-3 py-4 border-t border-white/[0.06]">
          <div className="flex items-center gap-3 px-3 py-2.5 mb-1">
            <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center shrink-0">
              <Shield className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white leading-none">{user?.name || "Administrator"}</p>
              <p className="text-[10px] text-slate-500 mt-0.5 truncate">{user?.email || "admin@litera.ac.id"}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:bg-white/[0.06] hover:text-red-400 transition-all"
          >
            <LogOut className="w-4 h-4" />
            Keluar
          </button>
        </div>
      </div>
    );
  }

  function OverviewTab() {
    const summary = adminDashboard.data?.summary;
    const breakdown = adminDashboard.data?.indexing_breakdown;
    const documentCount = summary?.documents_count ?? 0;
    const indexRate = documentCount ? Math.round(((summary?.indexed_documents_count ?? 0) / documentCount) * 100) : 0;

    return (
      <div className="flex flex-col gap-7">
        <div>
          <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-1">Panel Admin</p>
          <h1 className="text-2xl font-bold text-[#0C0D1A] tracking-tight">Ringkasan Platform</h1>
          <p className="text-slate-500 text-sm mt-1">Aktivitas Litera per hari ini, {todayLabel}</p>
        </div>

        {adminDashboard.isLoading && <EmptyState>Memuat ringkasan admin dari API...</EmptyState>}
        {!adminDashboard.isLoading && adminDashboard.error && <ErrorState message={adminDashboard.error} onRetry={adminDashboard.retry} />}
        {!adminDashboard.isLoading && !adminDashboard.error && summary && (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { val: summary.fields_count, lbl: "Bidang Penelitian", icon: Network, color: "text-indigo-600", bg: "bg-indigo-50", delta: `${summary.active_fields_count} aktif` },
                { val: summary.users_count, lbl: "Total Pengguna", icon: Users, color: "text-emerald-600", bg: "bg-emerald-50", delta: `${summary.active_users_count} aktif` },
                { val: summary.projects_count, lbl: "Total Koleksi", icon: BookOpen, color: "text-violet-600", bg: "bg-violet-50", delta: "Semua data" },
                { val: summary.documents_count, lbl: "Dokumen PDF", icon: FileText, color: "text-orange-600", bg: "bg-orange-50", delta: `${summary.indexed_pages_count} hal.` },
              ].map(({ val, lbl, icon: Icon, color, bg, delta }) => (
                <div key={lbl} className="bg-white rounded-[1.125rem] border border-[rgba(12,13,26,0.07)] shadow-[0_1px_3px_rgba(12,13,26,0.05)] p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center", bg)}>
                      <Icon className={cn("w-4.5 h-4.5", color)} strokeWidth={1.75} />
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded-full">{delta}</span>
                  </div>
                  <p className="text-2xl font-bold text-[#0C0D1A]">{formatNumber(val)}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{lbl}</p>
                </div>
              ))}
            </div>

            <div className="grid lg:grid-cols-3 gap-5">
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
                      { val: breakdown?.indexed ?? 0, lbl: "Terindeks", color: "text-emerald-400" },
                      { val: (breakdown?.pending ?? 0) + (breakdown?.processing ?? 0), lbl: "Diproses", color: "text-amber-400" },
                      { val: breakdown?.failed ?? 0, lbl: "Gagal", color: "text-red-400" },
                    ].map(({ val, lbl, color }) => (
                      <div key={lbl} className="text-center">
                        <p className={cn("text-lg font-bold", color)}>{formatNumber(val)}</p>
                        <p className="text-[10px] text-slate-600 mt-0.5">{lbl}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

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
                <DocumentMiniList
                  documents={adminDashboard.data?.recent_uploads ?? []}
                  emptyText="Belum ada upload dokumen."
                />
              </div>
            </div>

            {(adminDashboard.data?.failed_documents.length ?? 0) > 0 && (
              <div className="bg-red-50 border border-red-100 rounded-[1.125rem] p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-red-700 flex items-center gap-2 text-sm">
                    <AlertTriangle className="w-4 h-4" />
                    {formatNumber(adminDashboard.data?.failed_documents.length)} Dokumen Gagal Diindeks
                  </h3>
                  <button onClick={() => setActiveTab("indexing")} className="text-xs font-semibold text-red-600 hover:text-red-700 flex items-center gap-1">
                    Monitor <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  {adminDashboard.data?.failed_documents.map((document) => (
                    <div key={document.id} className="bg-white border border-red-100 rounded-xl p-3.5 flex items-start gap-3">
                      <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900 line-clamp-1">{document.title}</p>
                        <p className="text-[11px] text-red-600 mt-0.5">{document.index_message || "Indexing gagal."}</p>
                      </div>
                      <Button size="xs" variant="secondary" onClick={() => handleReindexDocument(document)}>
                        <RefreshCw className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  function DocumentMiniList({ documents, emptyText }: { documents: DashboardDocumentSummary[]; emptyText: string }) {
    if (documents.length === 0) {
      return <p className="text-sm text-slate-400">{emptyText}</p>;
    }

    return (
      <div className="flex flex-col gap-3">
        {documents.map((document) => (
          <div key={document.id} className="flex items-center gap-3 group">
            <div className="w-8 h-8 bg-red-50 rounded-xl flex items-center justify-center shrink-0">
              <FileText className="w-3.5 h-3.5 text-red-500" strokeWidth={1.5} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 line-clamp-1">{document.title}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {document.owner.name} · {formatBytes(document.file_size)} · {document.total_pages} hal.
              </p>
            </div>
            <StatusDot status={document.index_status} />
          </div>
        ))}
      </div>
    );
  }

  function FieldsTab() {
    return (
      <div>
        <div className="flex items-start justify-between mb-6 gap-4">
          <div>
            <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-1">Manajemen</p>
            <h2 className="text-2xl font-bold text-[#0C0D1A] tracking-tight">Bidang Penelitian</h2>
            <p className="text-sm text-slate-500 mt-1">{apiFields.length} bidang terdaftar di platform</p>
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
            onChange={(event) => setFieldSearch(event.target.value)}
            placeholder="Cari bidang penelitian..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-[rgba(12,13,26,0.1)] rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 shadow-sm transition-all"
          />
        </div>

        {fieldsLoading && <EmptyState>Memuat bidang penelitian dari API...</EmptyState>}
        {!fieldsLoading && fieldsError && <ErrorState message={fieldsError} onRetry={loadFields} />}
        {!fieldsLoading && !fieldsError && apiFields.length === 0 && <EmptyState>Tidak ada bidang penelitian ditemukan.</EmptyState>}
        {!fieldsLoading && !fieldsError && apiFields.length > 0 && (
          <div className="flex flex-col gap-3">
            {apiFields.map((field) => {
              const IconComp = ICON_MAP[field.iconName] || Network;
              return (
                <div key={field.id} className="bg-white rounded-[1.125rem] border border-[rgba(12,13,26,0.07)] shadow-[0_1px_3px_rgba(12,13,26,0.05)] p-4 flex items-center gap-4 hover:shadow-[0_4px_14px_rgba(12,13,26,0.08)] transition-all duration-200">
                  <div className={cn("w-11 h-11 rounded-[14px] flex items-center justify-center shrink-0", field.bgColor)}>
                    <IconComp className={cn("w-5 h-5", field.color)} strokeWidth={1.75} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-[#0C0D1A]">{field.name}</h3>
                      {!field.isActive && <Badge variant="warning">Nonaktif</Badge>}
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{field.description}</p>
                    <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-400">
                      <span className="font-medium">{field.collectionCount} koleksi</span>
                      <span className="opacity-40">.</span>
                      <span>PDF dihitung di tab dokumen</span>
                    </div>
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
                      onClick={async () => {
                        if (!window.confirm(`Hapus bidang "${field.name}"?`)) return;
                        try {
                          await fieldService.remove(field.apiId);
                          toast.success("Bidang penelitian berhasil dihapus.");
                          await loadFields();
                          await adminDashboard.retry();
                        } catch (error) {
                          toast.error(getSafeErrorMessage(error));
                        }
                      }}
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
        )}
      </div>
    );
  }

  function UsersTab() {
    return (
      <div>
        <div className="mb-6">
          <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-1">Manajemen</p>
          <h2 className="text-2xl font-bold text-[#0C0D1A] tracking-tight">Pengguna</h2>
          <p className="text-sm text-slate-500 mt-1">{formatNumber(usersData?.pagination.total)} pengguna terdaftar</p>
        </div>

        <div className="grid md:grid-cols-[1fr_160px_160px] gap-3 mb-5">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={userSearch}
              onChange={(event) => { setUsersPage(1); setUserSearch(event.target.value); }}
              placeholder="Cari nama, email, atau NIM..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-[rgba(12,13,26,0.1)] rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 shadow-sm transition-all"
            />
          </div>
          <select value={userRole} onChange={(event) => { setUsersPage(1); setUserRole(event.target.value as RoleFilter); }} className={selectClass}>
            <option value="all">Semua role</option>
            <option value="student">Mahasiswa</option>
            <option value="admin">Admin</option>
          </select>
          <select value={userStatus} onChange={(event) => { setUsersPage(1); setUserStatus(event.target.value as ActiveFilter); }} className={selectClass}>
            <option value="all">Semua status</option>
            <option value="active">Aktif</option>
            <option value="inactive">Nonaktif</option>
          </select>
        </div>

        {usersLoading && <EmptyState>Memuat pengguna dari API...</EmptyState>}
        {!usersLoading && usersError && <ErrorState message={usersError} onRetry={loadUsers} />}
        {!usersLoading && !usersError && usersData?.items.length === 0 && <EmptyState>Tidak ada pengguna sesuai filter.</EmptyState>}
        {!usersLoading && !usersError && Boolean(usersData?.items.length) && (
          <>
            <div className="flex flex-col gap-3">
              {usersData?.items.map((item) => (
                <div key={item.id} className="bg-white rounded-[1.125rem] border border-[rgba(12,13,26,0.07)] shadow-[0_1px_3px_rgba(12,13,26,0.05)] p-4 flex items-center gap-4">
                  <Avatar initials={getInitials(item.name)} color={getAvatarColor(item.id)} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-sm text-[#0C0D1A]">{item.name}</p>
                      <Badge variant={item.role === "admin" ? "dark" : "indigo"}>{item.role === "admin" ? "Admin" : "Mahasiswa"}</Badge>
                      <Badge variant={item.is_active ? "mint" : "warning"}>{item.is_active ? "Aktif" : "Nonaktif"}</Badge>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{item.email} · {item.study_program} · {item.class_name}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">NIM {item.student_number} · Bergabung {formatDate(item.created_at)}</p>
                  </div>
                  <div className="hidden sm:flex items-center gap-2 shrink-0">
                    <Badge variant="indigo">{item.projects_count} koleksi</Badge>
                    <Badge variant="gray">{item.documents_count} PDF</Badge>
                  </div>
                  <Button
                    size="xs"
                    variant={item.is_active ? "danger" : "secondary"}
                    onClick={() => handleToggleUser(item)}
                    disabled={item.id === user?.id && item.is_active}
                    title={item.id === user?.id ? "Admin tidak dapat menonaktifkan akun sendiri" : undefined}
                  >
                    {item.is_active ? "Nonaktifkan" : "Aktifkan"}
                  </Button>
                </div>
              ))}
            </div>
            <PaginationControls
              page={usersData?.pagination.page ?? 1}
              totalPages={usersData?.pagination.total_pages ?? 1}
              onPageChange={setUsersPage}
            />
          </>
        )}
      </div>
    );
  }

  function CollectionsTab() {
    return (
      <div>
        <div className="mb-6">
          <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-1">Manajemen</p>
          <h2 className="text-2xl font-bold text-[#0C0D1A] tracking-tight">Koleksi Penelitian</h2>
          <p className="text-sm text-slate-500 mt-1">{formatNumber(projectsData?.pagination.total)} koleksi terdaftar</p>
        </div>

        <div className="grid md:grid-cols-[1fr_190px_150px] gap-3 mb-5">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={projectSearch}
              onChange={(event) => { setProjectsPage(1); setProjectSearch(event.target.value); }}
              placeholder="Cari judul koleksi atau pemilik..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-[rgba(12,13,26,0.1)] rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 shadow-sm transition-all"
            />
          </div>
          <select
            value={projectField}
            onChange={(event) => { setProjectsPage(1); setProjectField(event.target.value === "all" ? "all" : Number(event.target.value)); }}
            className={selectClass}
          >
            <option value="all">Semua bidang</option>
            {apiFields.map((field) => <option key={field.apiId} value={field.apiId}>{field.name}</option>)}
          </select>
          <select value={projectVisibility} onChange={(event) => { setProjectsPage(1); setProjectVisibility(event.target.value as VisibilityFilter); }} className={selectClass}>
            <option value="all">Semua</option>
            <option value="public">Publik</option>
            <option value="private">Privat</option>
          </select>
        </div>

        {projectsLoading && <EmptyState>Memuat koleksi dari API...</EmptyState>}
        {!projectsLoading && projectsError && <ErrorState message={projectsError} onRetry={loadProjects} />}
        {!projectsLoading && !projectsError && projectsData?.items.length === 0 && <EmptyState>Tidak ada koleksi sesuai filter.</EmptyState>}
        {!projectsLoading && !projectsError && Boolean(projectsData?.items.length) && (
          <>
            <div className="flex flex-col gap-3">
              {projectsData?.items.map((project) => (
                <div key={project.id} className="bg-white rounded-[1.125rem] border border-[rgba(12,13,26,0.07)] shadow-[0_1px_3px_rgba(12,13,26,0.05)] p-4 flex items-start gap-4">
                  <div className="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                    <BookOpen className="w-4 h-4 text-indigo-600" strokeWidth={1.75} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-[#0C0D1A] line-clamp-2">{project.title}</p>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-1">{project.description}</p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <Badge variant="indigo">{project.field.name}</Badge>
                      <Badge variant={project.visibility === "public" ? "mint" : "gray"}>{project.visibility === "public" ? "Publik" : "Privat"}</Badge>
                      <div className="flex items-center gap-1.5">
                        <Avatar initials={getInitials(project.owner.name)} color={getAvatarColor(project.owner.id)} size="xs" />
                        <span className="text-xs text-slate-500">{project.owner.name}</span>
                      </div>
                      <span className="text-[11px] text-slate-400">{project.document_count} PDF</span>
                      <span className="text-[11px] text-slate-400">· {formatDate(project.updated_at)}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate({ name: "collection", collectionId: String(project.id) })}
                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all shrink-0"
                    title="Lihat koleksi"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <PaginationControls
              page={projectsData?.pagination.page ?? 1}
              totalPages={projectsData?.pagination.total_pages ?? 1}
              onPageChange={setProjectsPage}
            />
          </>
        )}
      </div>
    );
  }

  function DocumentsTab() {
    return (
      <div>
        <div className="mb-6">
          <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-1">Manajemen</p>
          <h2 className="text-2xl font-bold text-[#0C0D1A] tracking-tight">Dokumen PDF</h2>
          <p className="text-sm text-slate-500 mt-1">{formatNumber(documentsData?.pagination.total)} dokumen terdaftar</p>
        </div>

        <div className="grid md:grid-cols-[1fr_160px_190px] gap-3 mb-5">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={documentSearch}
              onChange={(event) => { setDocumentsPage(1); setDocumentSearch(event.target.value); }}
              placeholder="Cari judul PDF, file, koleksi, atau pemilik..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-[rgba(12,13,26,0.1)] rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 shadow-sm transition-all"
            />
          </div>
          <select value={documentStatus} onChange={(event) => { setDocumentsPage(1); setDocumentStatus(event.target.value as StatusFilter); }} className={selectClass}>
            {STATUS_FILTERS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
          <select
            value={documentField}
            onChange={(event) => { setDocumentsPage(1); setDocumentField(event.target.value === "all" ? "all" : Number(event.target.value)); }}
            className={selectClass}
          >
            <option value="all">Semua bidang</option>
            {apiFields.map((field) => <option key={field.apiId} value={field.apiId}>{field.name}</option>)}
          </select>
        </div>

        {documentsLoading && <EmptyState>Memuat dokumen dari API...</EmptyState>}
        {!documentsLoading && documentsError && <ErrorState message={documentsError} onRetry={loadDocuments} />}
        {!documentsLoading && !documentsError && documentsData?.items.length === 0 && <EmptyState>Tidak ada dokumen sesuai filter.</EmptyState>}
        {!documentsLoading && !documentsError && Boolean(documentsData?.items.length) && (
          <>
            <div className="flex flex-col gap-3">
              {documentsData?.items.map((document) => (
                <AdminDocumentCard
                  key={document.id}
                  document={document}
                  onOpen={() => handleOpenDocument(document)}
                  onReindex={() => handleReindexDocument(document)}
                  onDelete={() => handleDeleteDocument(document)}
                />
              ))}
            </div>
            <PaginationControls
              page={documentsData?.pagination.page ?? 1}
              totalPages={documentsData?.pagination.total_pages ?? 1}
              onPageChange={setDocumentsPage}
            />
          </>
        )}
      </div>
    );
  }

  function AdminDocumentCard({
    document,
    onOpen,
    onReindex,
    onDelete,
  }: {
    document: AdminDocumentRead;
    onOpen: () => void;
    onReindex: () => void;
    onDelete: () => void;
  }) {
    return (
      <div className="bg-white rounded-[1.125rem] border border-[rgba(12,13,26,0.07)] shadow-[0_1px_3px_rgba(12,13,26,0.05)] p-4 flex items-start gap-4">
        <div className="w-9 h-9 bg-red-50 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
          <FileText className="w-4 h-4 text-red-500" strokeWidth={1.5} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-sm text-slate-900 line-clamp-2">{document.title}</p>
            <StatusDot status={document.index_status} />
          </div>
          <p className="text-[11px] text-slate-400 mt-1.5 line-clamp-1">
            {document.original_filename} · {document.owner.name} · {document.project.title}
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <Badge variant="indigo">{document.field.name}</Badge>
            <span className="text-[11px] text-slate-400">{document.total_pages} hal.</span>
            <span className="text-[11px] text-slate-400">{formatBytes(document.file_size)}</span>
            <span className="text-[11px] text-slate-400">Upload {formatDate(document.created_at)}</span>
            {document.stats && <span className="text-[11px] text-slate-400">{document.stats.indexed_page_count} hal. terindeks</span>}
          </div>
          {document.index_message && document.index_status === "failed" && (
            <div className="mt-2 flex items-start gap-1.5 bg-red-50 border border-red-100 rounded-lg px-2.5 py-2">
              <AlertTriangle className="w-3 h-3 text-red-500 shrink-0 mt-0.5" />
              <p className="text-[11px] text-red-600 font-medium">{document.index_message}</p>
            </div>
          )}
        </div>
        <div className="flex flex-col sm:flex-row gap-1.5 shrink-0">
          <Button size="xs" variant="outline" onClick={onOpen}><Eye className="w-3 h-3" />Buka</Button>
          <Button size="xs" variant="secondary" onClick={onReindex}><RefreshCw className="w-3 h-3" />Re-index</Button>
          <Button size="xs" variant="danger" onClick={onDelete}><Trash2 className="w-3 h-3" /></Button>
        </div>
      </div>
    );
  }

  function IndexingTab() {
    const summary = indexingData?.summary;
    const total = (summary?.pending ?? 0) + (summary?.processing ?? 0) + (summary?.indexed ?? 0) + (summary?.failed ?? 0);
    const indexed = summary?.indexed ?? 0;
    const indexRate = total ? Math.round((indexed / total) * 100) : 0;

    return (
      <div>
        <div className="mb-6">
          <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-1">Monitoring</p>
          <h2 className="text-2xl font-bold text-[#0C0D1A] tracking-tight">Monitor Indexing</h2>
          <p className="text-sm text-slate-500 mt-1">Status pipeline indexing dokumen dari API dengan polling ringan saat ada antrean.</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { val: summary?.pending ?? 0, lbl: "Pending", color: "text-amber-600", bg: "bg-amber-50" },
            { val: summary?.processing ?? 0, lbl: "Processing", color: "text-indigo-600", bg: "bg-indigo-50" },
            { val: summary?.indexed ?? 0, lbl: "Terindeks", color: "text-emerald-600", bg: "bg-emerald-50" },
            { val: summary?.failed ?? 0, lbl: "Gagal", color: "text-red-600", bg: "bg-red-50" },
          ].map(({ val, lbl, color, bg }) => (
            <div key={lbl} className={cn("rounded-[1.125rem] p-4 text-center", bg)}>
              <p className={cn("text-3xl font-bold", color)}>{formatNumber(val)}</p>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">{lbl}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-[1.125rem] border border-[rgba(12,13,26,0.07)] shadow-[0_1px_3px_rgba(12,13,26,0.05)] p-5 mb-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-bold text-[#0C0D1A]">Tingkat Keberhasilan Indexing</p>
            <p className="text-sm font-bold text-indigo-600">{indexRate}%</p>
          </div>
          <ProgressBar value={indexRate} color="bg-gradient-to-r from-indigo-500 to-emerald-400" className="h-3 mb-3" />
          <div className="flex flex-wrap items-center gap-4 text-[11px] font-medium">
            <span className="flex items-center gap-1.5 text-emerald-600"><span className="w-2 h-2 bg-emerald-400 rounded-full" />Terindeks</span>
            <span className="flex items-center gap-1.5 text-indigo-600"><span className="w-2 h-2 bg-indigo-400 rounded-full" />Processing</span>
            <span className="flex items-center gap-1.5 text-amber-600"><span className="w-2 h-2 bg-amber-400 rounded-full" />Pending</span>
            <span className="flex items-center gap-1.5 text-red-600"><span className="w-2 h-2 bg-red-400 rounded-full" />Gagal</span>
          </div>
        </div>

        <div className="grid md:grid-cols-[1fr_180px] gap-3 mb-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={indexingSearch}
              onChange={(event) => { setIndexingPage(1); setIndexingSearch(event.target.value); }}
              placeholder="Cari dokumen indexing..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-[rgba(12,13,26,0.1)] rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 shadow-sm transition-all"
            />
          </div>
          <Button variant="outline" onClick={() => loadIndexing()}>
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-3 mb-3">
          {STATUS_FILTERS.map((item) => (
            <button
              key={item.value}
              onClick={() => { setIndexingPage(1); setIndexingStatus(item.value); }}
              className={cn(
                "px-3.5 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all",
                indexingStatus === item.value
                  ? "bg-[#0C0D1A] text-white shadow-sm"
                  : "bg-white text-slate-500 border border-[rgba(12,13,26,0.08)] hover:text-indigo-600"
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        {indexingLoading && <EmptyState>Memuat status indexing dari API...</EmptyState>}
        {!indexingLoading && indexingError && <ErrorState message={indexingError} onRetry={() => loadIndexing()} />}
        {!indexingLoading && !indexingError && indexingData?.items.length === 0 && <EmptyState>Tidak ada dokumen indexing sesuai filter.</EmptyState>}
        {!indexingLoading && !indexingError && Boolean(indexingData?.items.length) && (
          <>
            <div className="flex flex-col gap-3">
              {indexingData?.items.map((document) => (
                <div key={document.id} className={cn(
                  "rounded-[1.125rem] border p-4 flex items-start gap-4 transition-all",
                  document.index_status === "indexed" ? "bg-emerald-50/40 border-emerald-100" :
                  document.index_status === "failed" ? "bg-red-50/40 border-red-100" :
                  "bg-white border-[rgba(12,13,26,0.07)] shadow-[0_1px_3px_rgba(12,13,26,0.05)]"
                )}>
                  <div className="w-9 h-9 bg-red-50 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                    <FileText className="w-4 h-4 text-red-500" strokeWidth={1.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-slate-900">{document.title}</p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <StatusDot status={document.index_status} />
                      <span className="text-[11px] text-slate-400">{document.owner.name} · {formatDateTime(document.indexed_at || document.created_at)}</span>
                      <span className="text-[11px] text-slate-400">{document.total_pages} hal.</span>
                    </div>
                    {document.index_message && (
                      <div className="mt-2 flex items-start gap-1.5 bg-red-50 border border-red-100 rounded-lg px-2.5 py-2">
                        <AlertTriangle className="w-3 h-3 text-red-500 shrink-0 mt-0.5" />
                        <p className="text-[11px] text-red-600 font-medium">{document.index_message}</p>
                      </div>
                    )}
                  </div>
                  {document.index_status === "failed" && (
                    <Button size="xs" variant="secondary" onClick={() => handleReindexDocument(document)}>
                      <RefreshCw className="w-3 h-3" />
                      Retry
                    </Button>
                  )}
                  {document.index_status === "processing" && (
                    <div className="flex items-center gap-1.5 text-amber-600">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span className="text-[11px] font-semibold">Memproses...</span>
                    </div>
                  )}
                  {document.index_status === "indexed" && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  )}
                </div>
              ))}
            </div>
            <PaginationControls
              page={indexingData?.pagination.page ?? 1}
              totalPages={indexingData?.pagination.total_pages ?? 1}
              onPageChange={setIndexingPage}
            />
          </>
        )}
      </div>
    );
  }

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
          <Button size="lg" onClick={() => toast.info("Pengaturan platform belum terhubung ke endpoint pada MVP ini.")}>
            Simpan Pengaturan
          </Button>
        </div>
      </div>
    );
  }

  const TAB_CONTENT: Record<Tab, ReactNode> = {
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
      <aside className="hidden lg:flex flex-col w-[220px] shrink-0 bg-[#0C0D1A] sticky top-0 h-screen overflow-hidden">
        <SidebarContent />
      </aside>

      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="relative z-50 w-[220px] bg-[#0C0D1A] h-full shadow-2xl">
            <SidebarContent />
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
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
            {processingBadgeCount > 0 && (
              <button
                onClick={() => setActiveTab("indexing")}
                className="flex items-center gap-1.5 bg-amber-50 border border-amber-100 text-amber-600 text-xs font-bold px-2.5 py-1.5 rounded-full"
              >
                <Loader2 className="w-3 h-3" />
                {processingBadgeCount} proses
              </button>
            )}
            {failedBadgeCount > 0 && (
              <button
                onClick={() => setActiveTab("indexing")}
                className="flex items-center gap-1.5 bg-red-50 border border-red-100 text-red-600 text-xs font-bold px-2.5 py-1.5 rounded-full"
              >
                <AlertTriangle className="w-3 h-3" />
                {failedBadgeCount} gagal
              </button>
            )}
          </div>
        </div>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full">
          {TAB_CONTENT[activeTab]}
        </main>
      </div>

      <Dialog.Root open={fieldModalOpen} onOpenChange={setFieldModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-50 animate-in fade-in duration-150" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md bg-white rounded-[1.5rem] shadow-2xl shadow-black/20 overflow-hidden animate-in fade-in zoom-in-95 duration-200 mx-4">
            <div className="flex items-center justify-between px-6 py-5 border-b border-[rgba(12,13,26,0.07)]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-indigo-50 rounded-xl flex items-center justify-center">
                  <Network className="w-4 h-4 text-indigo-600" strokeWidth={1.75} />
                </div>
                <div>
                  <Dialog.Title className="font-bold text-[#0C0D1A] text-sm">
                    {editingField ? "Edit Bidang Penelitian" : "Tambah Bidang Penelitian"}
                  </Dialog.Title>
                  <Dialog.Description className="sr-only">
                    Form untuk menambah atau mengubah bidang penelitian Litera.
                  </Dialog.Description>
                </div>
              </div>
              <Dialog.Close asChild>
                <button className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all">
                  <X className="w-4 h-4" />
                </button>
              </Dialog.Close>
            </div>
            <div className="p-6">
              <form
                onSubmit={async (event) => {
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
                    await adminDashboard.retry();
                  } catch (error) {
                    toast.error(getSafeErrorMessage(error));
                  }
                }}
                className="flex flex-col gap-4"
              >
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
    </div>
  );
}
