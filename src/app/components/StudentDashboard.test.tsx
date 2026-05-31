import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AppContext, type AppContextType } from "../context";
import { StudentDashboard } from "./StudentDashboard";
import type { User } from "../../types/auth";

const user: User = {
  id: 1,
  name: "Arif Budiman",
  student_number: "2021001234",
  email: "arif@mahasiswa.ac.id",
  study_program: "Teknik Informatika",
  class_name: "TI-4A",
  role: "student",
  is_active: true,
  created_at: "2026-01-01T00:00:00",
  updated_at: "2026-01-01T00:00:00",
};

vi.mock("../../contexts/AuthContext", () => ({
  useAuth: () => ({
    user,
    logout: vi.fn(),
  }),
}));

const navigate = vi.fn();
const appContext: AppContextType = {
  page: { name: "dashboard", tab: "history" },
  navigate,
  showUploadModal: false,
  setShowUploadModal: vi.fn(),
  setUploadTargetCollectionId: vi.fn(),
  documentsRefreshKey: 0,
  notifyDocumentsChanged: vi.fn(),
  isAdmin: false,
};

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function createFetchMock() {
  return vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input));
    const method = init?.method || "GET";
    if (url.pathname.endsWith("/dashboard/me")) {
      return jsonResponse({
        summary: {
          projects_count: 2,
          documents_count: 5,
          indexed_documents_count: 4,
          pending_documents_count: 1,
          processing_documents_count: 0,
          failed_documents_count: 0,
          indexed_pages_count: 88,
          search_history_count: 1,
        },
        recent_projects: [{
          id: 7,
          title: "Koleksi SNMP",
          description: "Riset monitoring",
          keywords: ["SNMP"],
          visibility: "public",
          field: { id: 1, name: "Jaringan Komputer", slug: "jaringan-komputer", icon: "Network", is_active: true },
          document_count: 3,
          created_at: "2026-01-01T00:00:00",
          updated_at: "2026-01-01T00:00:00",
        }],
        recent_documents: [{
          id: 12,
          title: "Monitoring OLT Berbasis SNMP",
          original_filename: "monitoring-olt.pdf",
          file_size: 2048,
          total_pages: 12,
          index_status: "indexed",
          index_message: null,
          indexed_at: "2026-01-01T00:00:00",
          project: {
            id: 7,
            title: "Koleksi SNMP",
            description: "Riset monitoring",
            keywords: ["SNMP"],
            visibility: "public",
            field: { id: 1, name: "Jaringan Komputer", slug: "jaringan-komputer", icon: "Network", is_active: true },
            document_count: 3,
            created_at: "2026-01-01T00:00:00",
            updated_at: "2026-01-01T00:00:00",
          },
          field: { id: 1, name: "Jaringan Komputer", slug: "jaringan-komputer", icon: "Network", is_active: true },
          owner: { id: 1, name: "Arif Budiman", email: "arif@mahasiswa.ac.id", student_number: "2021001234" },
          created_at: "2026-01-01T00:00:00",
          updated_at: "2026-01-01T00:00:00",
          stats: { total_terms: 120, indexed_page_count: 12, updated_at: "2026-01-01T00:00:00" },
        }],
        recent_searches: [{
          id: 3,
          query: "monitoring redaman onu",
          research_field_id: 1,
          research_project_id: null,
          result_count: 3,
          created_at: "2026-01-01T00:00:00",
        }],
      });
    }
    if (url.pathname.endsWith("/projects/me")) {
      return jsonResponse({
        items: [],
        pagination: { page: 1, page_size: 100, total: 0, total_pages: 0 },
      });
    }
    if (url.pathname.endsWith("/search/history") && method === "GET") {
      return jsonResponse({
        items: [{
          id: 1,
          query: "monitoring redaman onu",
          filters: { research_field_id: 1, research_project_id: null, owner_id: null },
          result_count: 3,
          created_at: "2026-01-01T00:00:00",
        }],
        pagination: { page: 1, page_size: 10, total: 1, total_pages: 1 },
      });
    }
    if (url.pathname.endsWith("/search/history") && method === "DELETE") {
      return new Response(null, { status: 204 });
    }
    return jsonResponse({ detail: "Not found" }, 404);
  });
}

describe("StudentDashboard search history", () => {
  beforeEach(() => {
    navigate.mockReset();
    vi.restoreAllMocks();
  });

  it("renders dashboard summary and recent documents from API", async () => {
    vi.stubGlobal("fetch", createFetchMock());

    render(
      <AppContext.Provider value={{ ...appContext, page: { name: "dashboard" } }}>
        <StudentDashboard />
      </AppContext.Provider>
    );

    expect(await screen.findByText(/Monitoring OLT Berbasis SNMP/)).toBeInTheDocument();
    expect(screen.getByText("88")).toBeInTheDocument();
    expect(screen.getByText("Hal. Terindeks")).toBeInTheDocument();
    expect(screen.getByText(/berhasil diindeks/i)).toBeInTheDocument();
  });

  it("renders history, reruns query, and clears history after confirmation", async () => {
    const fetchMock = createFetchMock();
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(window, "confirm").mockReturnValue(true);

    render(
      <AppContext.Provider value={appContext}>
        <StudentDashboard />
      </AppContext.Provider>
    );

    expect(await screen.findByText("monitoring redaman onu")).toBeInTheDocument();
    fireEvent.click(screen.getByText("monitoring redaman onu"));
    expect(navigate).toHaveBeenCalledWith({
      name: "search",
      query: "monitoring redaman onu",
      researchFieldId: 1,
      researchProjectId: undefined,
      ownerId: undefined,
      sortBy: "relevance",
      page: 1,
    });

    fireEvent.click(screen.getByRole("button", { name: "Hapus Riwayat" }));
    await waitFor(() => expect(fetchMock.mock.calls.some(([input, init]) => (
      String(input).endsWith("/search/history") && init?.method === "DELETE"
    ))).toBe(true));
  });
});
