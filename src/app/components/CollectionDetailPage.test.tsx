import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AppContext, type AppContextType } from "../context";
import { CollectionDetailPage } from "./CollectionDetailPage";
import type { User } from "../../types/auth";

const ownerUser: User = {
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

let mockUser: User | null = ownerUser;

vi.mock("../../contexts/AuthContext", () => ({
  useAuth: () => ({
    user: mockUser,
    logout: vi.fn(),
  }),
}));

const navigate = vi.fn();
const notifyDocumentsChanged = vi.fn();
const appContext: AppContextType = {
  page: { name: "collection", collectionId: "1" },
  navigate,
  showUploadModal: false,
  setShowUploadModal: vi.fn(),
  setUploadTargetCollectionId: vi.fn(),
  documentsRefreshKey: 0,
  notifyDocumentsChanged,
  isAdmin: false,
};

const projectPayload = {
  id: 1,
  title: "Perancangan Network Monitoring System",
  description: "Koleksi literatur jaringan",
  keywords: ["SNMP", "OLT"],
  visibility: "public",
  owner: { id: 1, name: "Arif Budiman", email: "arif@mahasiswa.ac.id", student_number: "2021001234" },
  field: { id: 1, name: "Jaringan Komputer", slug: "jaringan-komputer", icon: "Network", is_active: true },
  document_count: 2,
  created_at: "2026-01-01T00:00:00",
  updated_at: "2026-01-01T00:00:00",
};

const indexedDocument = {
  id: 10,
  research_project_id: 1,
  title: "Monitoring OLT Berbasis SNMP",
  original_filename: "monitoring-olt.pdf",
  stored_filename: "10.pdf",
  file_size: 1_048_576,
  total_pages: 12,
  index_status: "indexed",
  index_message: null,
  indexed_at: "2026-01-01T00:10:00",
  created_at: "2026-01-01T00:00:00",
  updated_at: "2026-01-01T00:10:00",
};

const failedDocument = {
  id: 11,
  research_project_id: 1,
  title: "Scan Redaman FTTH",
  original_filename: "scan-redaman.pdf",
  stored_filename: "11.pdf",
  file_size: 2048,
  total_pages: 0,
  index_status: "failed",
  index_message: "PDF tidak memiliki teks yang dapat diekstrak.",
  indexed_at: null,
  created_at: "2026-01-02T00:00:00",
  updated_at: "2026-01-02T00:00:00",
};

const documentsPayload = {
  items: [indexedDocument, failedDocument],
  pagination: { page: 1, page_size: 100, total: 2, total_pages: 1 },
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

    if (url.pathname.endsWith("/projects/1/documents") && method === "GET") {
      return jsonResponse(documentsPayload);
    }
    if (url.pathname.endsWith("/projects/1") && method === "GET") {
      return jsonResponse(projectPayload);
    }
    if (url.pathname.endsWith("/projects/1") && method === "DELETE") {
      return new Response(null, { status: 204 });
    }
    if (url.pathname.endsWith("/documents/10/reindex") && method === "POST") {
      return jsonResponse({ ...indexedDocument, index_status: "pending", index_message: "Menunggu proses reindex." });
    }
    if (url.pathname.endsWith("/documents/10") && method === "PATCH") {
      return jsonResponse({ ...indexedDocument, title: "Judul Baru" });
    }
    if (url.pathname.endsWith("/documents/10") && method === "DELETE") {
      return new Response(null, { status: 204 });
    }
    if (url.pathname.endsWith("/documents/10/file") && method === "GET") {
      return new Response(new Blob(["%PDF-1.7"], { type: "application/pdf" }), {
        status: 200,
        headers: { "Content-Type": "application/pdf" },
      });
    }

    return jsonResponse({ detail: "Not found" }, 404);
  });
}

function renderPage() {
  return render(
    <AppContext.Provider value={appContext}>
      <CollectionDetailPage collectionId="1" />
    </AppContext.Provider>
  );
}

describe("CollectionDetailPage", () => {
  beforeEach(() => {
    mockUser = ownerUser;
    navigate.mockReset();
    notifyDocumentsChanged.mockReset();
    vi.restoreAllMocks();
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: vi.fn(() => "blob:litera-pdf"),
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: vi.fn(),
    });
    vi.spyOn(window, "open").mockReturnValue({} as Window);
  });

  it("renders project documents from API and shows owner document actions", async () => {
    vi.stubGlobal("fetch", createFetchMock());

    renderPage();

    expect(await screen.findByRole("heading", { name: "Perancangan Network Monitoring System" })).toBeInTheDocument();
    expect(await screen.findByText("Monitoring OLT Berbasis SNMP")).toBeInTheDocument();
    expect(screen.getByText("PDF tidak memiliki teks yang dapat diekstrak.")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /buka pdf/i })).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: /edit judul/i })).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: /re-index/i })).toHaveLength(2);
  });

  it("hides owner actions for non-owner students but keeps PDF open available", async () => {
    mockUser = { ...ownerUser, id: 2, email: "siti@mahasiswa.ac.id", name: "Siti Rahayu" };
    vi.stubGlobal("fetch", createFetchMock());

    renderPage();

    expect(await screen.findByText("Monitoring OLT Berbasis SNMP")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /buka pdf/i })).toHaveLength(2);
    expect(screen.queryByRole("button", { name: /edit koleksi/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /edit judul/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /re-index/i })).not.toBeInTheDocument();
  });

  it("confirms and sends delete request for collections", async () => {
    const fetchMock = createFetchMock();
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(window, "confirm").mockReturnValue(true);

    renderPage();

    await screen.findByRole("heading", { name: "Perancangan Network Monitoring System" });
    fireEvent.click(screen.getAllByRole("button", { name: /^hapus$/i })[0]);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:8000/api/v1/projects/1",
      expect.objectContaining({ method: "DELETE" })
    ));
    expect(navigate).toHaveBeenCalledWith({ name: "dashboard" });
  });

  it("updates a document title through the document PATCH endpoint", async () => {
    const fetchMock = createFetchMock();
    vi.stubGlobal("fetch", fetchMock);

    renderPage();

    fireEvent.click((await screen.findAllByRole("button", { name: /edit judul/i }))[0]);
    const input = screen.getByDisplayValue("Monitoring OLT Berbasis SNMP");
    fireEvent.change(input, { target: { value: "Judul Baru" } });
    fireEvent.click(screen.getByRole("button", { name: /^simpan$/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:8000/api/v1/documents/10",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ title: "Judul Baru" }),
      })
    ));
    expect(notifyDocumentsChanged).toHaveBeenCalled();
  });

  it("can open and re-index a document through document endpoints", async () => {
    const fetchMock = createFetchMock();
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(window, "confirm").mockReturnValue(true);

    renderPage();

    fireEvent.click((await screen.findAllByRole("button", { name: /buka pdf/i }))[0]);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:8000/api/v1/documents/10/file",
      expect.objectContaining({ headers: expect.any(Headers) })
    ));
    expect(window.open).toHaveBeenCalledWith("blob:litera-pdf", "_blank", "noopener,noreferrer");

    fireEvent.click(screen.getAllByRole("button", { name: /re-index/i })[0]);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:8000/api/v1/documents/10/reindex",
      expect.objectContaining({ method: "POST" })
    ));
    expect(notifyDocumentsChanged).toHaveBeenCalled();
  });

  it("runs scoped search from collection detail with research_project_id", async () => {
    vi.stubGlobal("fetch", createFetchMock());

    renderPage();

    const input = await screen.findByPlaceholderText("Cari dalam koleksi ini...");
    fireEvent.change(input, { target: { value: "mikrotik api" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(navigate).toHaveBeenCalledWith({
      name: "search",
      query: "mikrotik api",
      researchProjectId: 1,
      sortBy: "relevance",
      page: 1,
    });
  });
});
