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
        pagination: { page: 1, page_size: 10, total_items: 1, total_pages: 1 },
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
