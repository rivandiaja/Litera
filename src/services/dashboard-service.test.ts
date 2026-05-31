import { clearStoredToken, setStoredToken } from "../lib/auth-storage";
import { dashboardService } from "./dashboard-service";

describe("dashboardService", () => {
  beforeEach(() => {
    clearStoredToken();
    vi.restoreAllMocks();
  });

  it("fetches repository stats with the stored token", async () => {
    setStoredToken("jwt-token");
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({
        fields_count: 4,
        public_projects_count: 12,
        public_documents_count: 42,
        contributors_count: 7,
        indexed_pages_count: 512,
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await dashboardService.getRepositoryStats();

    expect(result.public_documents_count).toBe(42);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:8000/api/v1/dashboard/repository-stats",
      expect.objectContaining({ headers: expect.any(Headers) })
    );
    const headers = fetchMock.mock.calls[0][1].headers as Headers;
    expect(headers.get("Authorization")).toBe("Bearer jwt-token");
  });

  it("fetches the current user's dashboard summary", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({
        summary: {
          projects_count: 1,
          documents_count: 2,
          indexed_documents_count: 2,
          pending_documents_count: 0,
          processing_documents_count: 0,
          failed_documents_count: 0,
          indexed_pages_count: 18,
          search_history_count: 3,
        },
        recent_projects: [],
        recent_documents: [],
        recent_searches: [],
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await dashboardService.getMyDashboard();

    expect(result.summary.indexed_pages_count).toBe(18);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:8000/api/v1/dashboard/me",
      expect.objectContaining({ headers: expect.any(Headers) })
    );
  });
});
