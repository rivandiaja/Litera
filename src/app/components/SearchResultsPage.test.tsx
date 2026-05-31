import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ComponentProps } from "react";
import { AppContext, type AppContextType } from "../context";
import { SearchResultsPage } from "./SearchResultsPage";

const navigate = vi.fn();
const authMocks = vi.hoisted(() => ({
  logout: vi.fn(),
  user: {
    id: 1,
    name: "Arif Budiman",
    email: "arif@mahasiswa.ac.id",
    role: "student",
    student_number: "2021001",
  },
}));

vi.mock("../../contexts/AuthContext", () => ({
  useAuth: () => ({
    logout: authMocks.logout,
    user: authMocks.user,
  }),
}));

const appContext: AppContextType = {
  page: { name: "search", query: "monitoring snmp" },
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

const searchPayload = {
  query: "monitoring snmp",
  processed_terms: ["monitoring", "snmp"],
  filters: { research_field_id: null, research_project_id: null, owner_id: null },
  pagination: { page: 1, page_size: 10, total_items: 11, total_pages: 2 },
  results: [{
    document_id: 10,
    title: "Monitoring OLT Berbasis SNMP",
    original_filename: "monitoring-olt.pdf",
    score: 0.912345,
    relevance_percent: 91.23,
    total_pages: 12,
    relevant_pages: [4, 7, 10],
    best_page: 4,
    snippet: "Parameter redaman ONU dipantau menggunakan protokol SNMP.",
    matched_terms: ["SNMP"],
    project: { id: 3, title: "Perancangan Network Monitoring System" },
    field: { id: 1, name: "Jaringan Komputer" },
    owner: { id: 1, name: "Arif Budiman" },
    created_at: "2026-01-01T00:00:00",
  }],
};

function createFetchMock({ searchStatus = 200, empty = false } = {}) {
  return vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input));
    const method = init?.method || "GET";
    if (url.pathname.endsWith("/search") && method === "GET") {
      if (searchStatus !== 200) return jsonResponse({ detail: "Search failed" }, searchStatus);
      return jsonResponse(empty ? { ...searchPayload, pagination: { page: 1, page_size: 10, total_items: 0, total_pages: 0 }, results: [] } : searchPayload);
    }
    if (url.pathname.endsWith("/fields")) {
      return jsonResponse({
        items: [{
          id: 1,
          name: "Jaringan Komputer",
          slug: "jaringan-komputer",
          description: "Monitoring jaringan",
          icon: "Network",
          is_active: true,
          project_count: 1,
          created_at: "2026-01-01T00:00:00",
          updated_at: "2026-01-01T00:00:00",
        }],
        pagination: { page: 1, page_size: 100, total: 1, total_pages: 1 },
      });
    }
    if (url.pathname.endsWith("/projects")) {
      return jsonResponse({
        items: [{
          id: 3,
          title: "Perancangan Network Monitoring System",
          description: "Koleksi jaringan",
          keywords: ["SNMP"],
          visibility: "public",
          owner: { id: 1, name: "Arif Budiman", email: "arif@mahasiswa.ac.id", student_number: "2021001" },
          field: { id: 1, name: "Jaringan Komputer", slug: "jaringan-komputer", icon: "Network", is_active: true },
          document_count: 1,
          created_at: "2026-01-01T00:00:00",
          updated_at: "2026-01-01T00:00:00",
        }],
        pagination: { page: 1, page_size: 100, total: 1, total_pages: 1 },
      });
    }
    if (url.pathname.endsWith("/documents/10/file")) {
      return new Response(new Blob(["%PDF-1.7"], { type: "application/pdf" }), {
        status: 200,
        headers: { "Content-Type": "application/pdf" },
      });
    }
    return jsonResponse({ detail: "Not found" }, 404);
  });
}

function renderPage(props: Partial<ComponentProps<typeof SearchResultsPage>> = {}) {
  return render(
    <AppContext.Provider value={appContext}>
      <SearchResultsPage query="monitoring snmp" {...props} />
    </AppContext.Provider>
  );
}

describe("SearchResultsPage", () => {
  beforeEach(() => {
    navigate.mockReset();
    vi.restoreAllMocks();
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: vi.fn(() => "blob:search-pdf"),
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: vi.fn(),
    });
    vi.spyOn(window, "open").mockReturnValue({} as Window);
  });

  it("renders TF-IDF API results, snippet, relevance, and relevant pages", async () => {
    vi.stubGlobal("fetch", createFetchMock());

    renderPage();

    expect(screen.getByText("Mencari literatur...")).toBeInTheDocument();
    expect(await screen.findByText("Monitoring OLT Berbasis SNMP")).toBeInTheDocument();
    expect(screen.getByText("monitoring-olt.pdf")).toBeInTheDocument();
    expect(screen.getAllByText("Jaringan Komputer").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Perancangan Network Monitoring System").length).toBeGreaterThan(0);
    expect(screen.getByText("Arif Budiman")).toBeInTheDocument();
    expect(screen.getByText("91%")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Hal. 4" })).toBeInTheDocument();
    expect(screen.getByText("SNMP").tagName.toLowerCase()).toBe("mark");
  });

  it("updates requests for sorting, pagination, filters, and opens relevant PDF page", async () => {
    const fetchMock = createFetchMock();
    vi.stubGlobal("fetch", fetchMock);

    renderPage();
    await screen.findByText("Monitoring OLT Berbasis SNMP");

    fireEvent.change(screen.getByDisplayValue("Relevansi Tertinggi"), { target: { value: "newest" } });
    await waitFor(() => expect(fetchMock.mock.calls.some(([input]) => String(input).includes("sort_by=newest"))).toBe(true));

    fireEvent.click(screen.getByRole("button", { name: "Berikutnya" }));
    await waitFor(() => expect(fetchMock.mock.calls.some(([input]) => String(input).includes("page=2"))).toBe(true));

    fireEvent.click(screen.getByRole("button", { name: "Hal. 4" }));
    await waitFor(() => expect(window.open).toHaveBeenCalledWith("blob:search-pdf#page=4", "_blank", "noopener,noreferrer"));

    fireEvent.click(screen.getByRole("button", { name: "Lihat Koleksi" }));
    expect(navigate).toHaveBeenCalledWith({ name: "collection", collectionId: "3" });
  });

  it("shows empty and error states without mock fallback", async () => {
    vi.stubGlobal("fetch", createFetchMock({ empty: true }));
    const { unmount } = renderPage();
    expect(await screen.findByText("Tidak ada literatur yang ditemukan.")).toBeInTheDocument();
    unmount();

    vi.stubGlobal("fetch", createFetchMock({ searchStatus: 500 }));
    renderPage();
    expect(await screen.findByText("Pencarian gagal dimuat.")).toBeInTheDocument();
    expect(screen.queryByText("Monitoring OLT Berbasis SNMP")).not.toBeInTheDocument();
  });
});
