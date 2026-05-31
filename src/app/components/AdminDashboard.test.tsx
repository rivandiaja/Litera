import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AppContext, type AppContextType } from "../context";
import { AdminDashboard } from "./AdminDashboard";
import type { User } from "../../types/auth";

const adminUser: User = {
  id: 1,
  name: "Admin Litera",
  student_number: "ADM001",
  email: "admin@litera.ac.id",
  study_program: "Teknik Informatika",
  class_name: "ADMIN",
  role: "admin",
  is_active: true,
  created_at: "2026-01-01T00:00:00",
  updated_at: "2026-01-01T00:00:00",
};

vi.mock("../../contexts/AuthContext", () => ({
  useAuth: () => ({
    user: adminUser,
    logout: vi.fn(),
  }),
}));

const navigate = vi.fn();
const appContext: AppContextType = {
  page: { name: "admin" },
  navigate,
  showUploadModal: false,
  setShowUploadModal: vi.fn(),
  setUploadTargetCollectionId: vi.fn(),
  documentsRefreshKey: 0,
  notifyDocumentsChanged: vi.fn(),
  isAdmin: true,
};

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function dashboardDocument(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 99,
    title: "Paper Gagal",
    original_filename: "paper-gagal.pdf",
    file_size: 4096,
    total_pages: 9,
    index_status: "failed",
    index_message: "Indexing gagal. Periksa file PDF dan jalankan re-index.",
    indexed_at: null,
    project: {
      id: 7,
      title: "Koleksi SNMP",
      description: "Riset monitoring",
      keywords: ["SNMP"],
      visibility: "public",
      field: { id: 1, name: "Jaringan Komputer", slug: "jaringan-komputer", icon: "Network", is_active: true },
      document_count: 1,
      created_at: "2026-01-01T00:00:00",
      updated_at: "2026-01-01T00:00:00",
    },
    field: { id: 1, name: "Jaringan Komputer", slug: "jaringan-komputer", icon: "Network", is_active: true },
    owner: { id: 2, name: "Siti Rahma", email: "siti@mahasiswa.ac.id", student_number: "2021002" },
    created_at: "2026-01-01T00:00:00",
    updated_at: "2026-01-01T00:00:00",
    stats: { total_terms: 120, indexed_page_count: 9, updated_at: "2026-01-01T00:00:00" },
    ...overrides,
  };
}

function createFetchMock({ processing = false } = {}) {
  return vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input));
    const method = init?.method || "GET";

    if (url.pathname.endsWith("/admin/dashboard")) {
      return jsonResponse({
        summary: {
          users_count: 10,
          active_users_count: 9,
          fields_count: 4,
          active_fields_count: 4,
          projects_count: 12,
          documents_count: 25,
          indexed_documents_count: 22,
          pending_documents_count: processing ? 0 : 1,
          processing_documents_count: processing ? 1 : 0,
          failed_documents_count: 2,
          indexed_pages_count: 320,
        },
        indexing_breakdown: {
          pending: processing ? 0 : 1,
          processing: processing ? 1 : 0,
          indexed: 22,
          failed: 2,
        },
        recent_uploads: [dashboardDocument({ title: "Paper Terbaru", index_status: "indexed", index_message: null })],
        failed_documents: [dashboardDocument()],
      });
    }

    if (url.pathname.endsWith("/fields")) {
      return jsonResponse({
        items: [{
          id: 1,
          name: "Jaringan Komputer",
          slug: "jaringan-komputer",
          description: "Monitoring jaringan dan SNMP",
          icon: "Network",
          is_active: true,
          project_count: 2,
          created_at: "2026-01-01T00:00:00",
          updated_at: "2026-01-01T00:00:00",
        }],
        pagination: { page: 1, page_size: 100, total: 1, total_pages: 1 },
      });
    }

    if (url.pathname.endsWith("/admin/users") && method === "GET") {
      return jsonResponse({
        items: [
          {
            id: 1,
            name: "Admin Litera",
            student_number: "ADM001",
            email: "admin@litera.ac.id",
            study_program: "Teknik Informatika",
            class_name: "ADMIN",
            role: "admin",
            is_active: true,
            projects_count: 0,
            documents_count: 0,
            created_at: "2026-01-01T00:00:00",
            updated_at: "2026-01-01T00:00:00",
          },
          {
            id: 2,
            name: "Siti Rahma",
            student_number: "2021002",
            email: "siti@mahasiswa.ac.id",
            study_program: "Teknik Informatika",
            class_name: "TI-4A",
            role: "student",
            is_active: true,
            projects_count: 1,
            documents_count: 2,
            created_at: "2026-01-01T00:00:00",
            updated_at: "2026-01-01T00:00:00",
          },
        ],
        pagination: { page: 1, page_size: 8, total: 2, total_pages: 1 },
      });
    }

    if (url.pathname.endsWith("/admin/users/2") && method === "PATCH") {
      return jsonResponse({
        id: 2,
        name: "Siti Rahma",
        student_number: "2021002",
        email: "siti@mahasiswa.ac.id",
        study_program: "Teknik Informatika",
        class_name: "TI-4A",
        role: "student",
        is_active: false,
        projects_count: 1,
        documents_count: 2,
        created_at: "2026-01-01T00:00:00",
        updated_at: "2026-01-01T00:00:00",
      });
    }

    if (url.pathname.endsWith("/admin/projects")) {
      return jsonResponse({
        items: [{
          id: 7,
          title: "Koleksi SNMP",
          description: "Riset monitoring",
          keywords: ["SNMP"],
          visibility: "public",
          owner: { id: 2, name: "Siti Rahma", email: "siti@mahasiswa.ac.id", student_number: "2021002" },
          field: { id: 1, name: "Jaringan Komputer", slug: "jaringan-komputer", icon: "Network", is_active: true },
          document_count: 2,
          created_at: "2026-01-01T00:00:00",
          updated_at: "2026-01-01T00:00:00",
        }],
        pagination: { page: 1, page_size: 8, total: 1, total_pages: 1 },
      });
    }

    if (url.pathname.endsWith("/admin/documents")) {
      return jsonResponse({
        items: [dashboardDocument()],
        pagination: { page: 1, page_size: 8, total: 1, total_pages: 1 },
      });
    }

    if (url.pathname.endsWith("/admin/indexing")) {
      return jsonResponse({
        summary: {
          pending: processing ? 0 : 1,
          processing: processing ? 1 : 0,
          indexed: 22,
          failed: 2,
        },
        items: [dashboardDocument({ title: processing ? "PDF Processing" : "Paper Gagal", index_status: processing ? "processing" : "failed" })],
        pagination: { page: 1, page_size: 8, total: 1, total_pages: 1 },
      });
    }

    if (url.pathname.endsWith("/documents/99/reindex") && method === "POST") {
      return jsonResponse(dashboardDocument({ index_status: "pending", index_message: null }));
    }

    return jsonResponse({ detail: "Not found" }, 404);
  });
}

function renderDashboard() {
  return render(
    <AppContext.Provider value={appContext}>
      <AdminDashboard />
    </AppContext.Provider>
  );
}

describe("AdminDashboard", () => {
  beforeEach(() => {
    navigate.mockReset();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("renders API-backed overview, users, projects, documents, and indexing tabs", async () => {
    const fetchMock = createFetchMock();
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(window, "confirm").mockReturnValue(true);

    renderDashboard();

    expect(await screen.findByText("Paper Terbaru")).toBeInTheDocument();
    expect(screen.getByText("Total Pengguna")).toBeInTheDocument();
    expect(screen.getByText("Paper Gagal")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Pengguna" }));
    expect(await screen.findByText("Siti Rahma")).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole("button", { name: "Nonaktifkan" })[1]);
    await waitFor(() => expect(fetchMock.mock.calls.some(([input, init]) => (
      String(input).endsWith("/admin/users/2") && init?.method === "PATCH"
    ))).toBe(true));

    fireEvent.click(screen.getByRole("button", { name: "Koleksi" }));
    expect(await screen.findByText("Koleksi SNMP")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Dokumen PDF" }));
    expect(await screen.findByText("paper-gagal.pdf · Siti Rahma · Koleksi SNMP")).toBeInTheDocument();

    expect(fetchMock.mock.calls.some(([input]) => String(input).includes("/admin/documents"))).toBe(true);
  });

  it("polls indexing while there are processing documents and clears the interval on unmount", async () => {
    vi.useFakeTimers();
    const fetchMock = createFetchMock({ processing: true });
    vi.stubGlobal("fetch", fetchMock);

    const { unmount } = renderDashboard();
    fireEvent.click(screen.getByText("Monitor Indexing"));
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(screen.getByText("PDF Processing")).toBeInTheDocument();
    const initialIndexingCalls = fetchMock.mock.calls.filter(([input]) => String(input).includes("/admin/indexing")).length;

    await act(async () => {
      vi.advanceTimersByTime(4000);
      await Promise.resolve();
      await Promise.resolve();
    });

    const nextIndexingCalls = fetchMock.mock.calls.filter(([input]) => String(input).includes("/admin/indexing")).length;
    expect(nextIndexingCalls).toBeGreaterThan(initialIndexingCalls);

    unmount();
    const callsAfterUnmount = fetchMock.mock.calls.length;
    await act(async () => {
      vi.advanceTimersByTime(4000);
      await Promise.resolve();
    });
    expect(fetchMock.mock.calls.length).toBe(callsAfterUnmount);
  });
});
