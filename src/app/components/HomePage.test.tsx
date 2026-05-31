import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AppContext, type AppContextType } from "../context";
import { HomePage } from "./HomePage";

const navigate = vi.fn();
const homeMocks = vi.hoisted(() => ({
  logout: vi.fn(),
  toastError: vi.fn(),
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
    logout: homeMocks.logout,
    user: homeMocks.user,
  }),
}));

vi.mock("sonner", async () => {
  const actual = await vi.importActual<typeof import("sonner")>("sonner");
  return {
    ...actual,
    toast: {
      ...actual.toast,
      error: homeMocks.toastError,
    },
  };
});

const appContext: AppContextType = {
  page: { name: "home" },
  navigate,
  showUploadModal: false,
  setShowUploadModal: vi.fn(),
  setUploadTargetCollectionId: vi.fn(),
  documentsRefreshKey: 0,
  notifyDocumentsChanged: vi.fn(),
  isAdmin: false,
};

function jsonResponse(payload: unknown) {
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

function createFetchMock() {
  return vi.fn(async (input: RequestInfo | URL) => {
    const url = new URL(String(input));
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
        pagination: { page: 1, page_size: 6, total: 1, total_pages: 1 },
      });
    }
    if (url.pathname.endsWith("/projects")) {
      return jsonResponse({
        items: [{
          id: 7,
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
        pagination: { page: 1, page_size: 6, total: 1, total_pages: 1 },
      });
    }
    if (url.pathname.endsWith("/search/catalog")) {
      return jsonResponse({
        query: "ja",
        fields: [{
          id: 1,
          name: "Jaringan Komputer",
          slug: "jaringan-komputer",
          description: "Monitoring jaringan",
          is_active: true,
        }],
        projects: [],
      });
    }
    return jsonResponse({});
  });
}

function renderPage() {
  return render(
    <AppContext.Provider value={appContext}>
      <HomePage />
    </AppContext.Provider>
  );
}

describe("HomePage search", () => {
  beforeEach(() => {
    navigate.mockReset();
    homeMocks.toastError.mockReset();
    vi.stubGlobal("fetch", createFetchMock());
  });

  it("runs search with field filter and rejects empty query", async () => {
    renderPage();

    await screen.findByText("Jaringan Komputer");
    const input = screen.getByPlaceholderText("Cari jurnal, topik penelitian, kata kunci...");
    fireEvent.change(input, { target: { value: "   " } });
    fireEvent.click(screen.getAllByRole("button", { name: "Cari" })[0]);
    expect(navigate).not.toHaveBeenCalledWith(expect.objectContaining({ name: "search" }));
    expect(homeMocks.toastError).toHaveBeenCalled();

    fireEvent.change(input, { target: { value: "monitoring snmp" } });
    fireEvent.click(screen.getByRole("button", { name: "Semua Bidang" }));
    fireEvent.click(screen.getAllByRole("button", { name: "Jaringan Komputer" })[0]);
    fireEvent.click(screen.getAllByRole("button", { name: "Cari" })[0]);

    expect(navigate).toHaveBeenCalledWith({
      name: "search",
      query: "monitoring snmp",
      researchFieldId: 1,
      sortBy: "relevance",
      page: 1,
    });
  });

  it("runs keyword chip search and catalog result navigation", async () => {
    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: "SNMP" }));
    expect(navigate).toHaveBeenCalledWith({
      name: "search",
      query: "SNMP",
      researchFieldId: undefined,
      sortBy: "relevance",
      page: 1,
    });

    const input = screen.getByPlaceholderText("Cari jurnal, topik penelitian, kata kunci...");
    fireEvent.change(input, { target: { value: "ja" } });

    await waitFor(() => expect(screen.getByText("Katalog Terkait")).toBeInTheDocument());
    fireEvent.click(screen.getAllByRole("button", { name: /Jaringan Komputer/i })[0]);
    expect(navigate).toHaveBeenCalledWith({ name: "field-detail", fieldId: "1" });
  });
});
