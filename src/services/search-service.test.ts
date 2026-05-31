import { clearStoredToken, setStoredToken } from "../lib/auth-storage";
import { searchService } from "./search-service";

describe("searchService", () => {
  beforeEach(() => {
    clearStoredToken();
    vi.restoreAllMocks();
  });

  it("builds literature search query params without empty values and sends auth token", async () => {
    setStoredToken("token-123");
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({
        query: "snmp",
        processed_terms: ["snmp"],
        filters: { research_field_id: 1, research_project_id: 2, owner_id: null },
        pagination: { page: 2, page_size: 10, total_items: 0, total_pages: 0 },
        results: [],
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    await searchService.searchLiterature({
      q: "  snmp  ",
      research_field_id: 1,
      research_project_id: 2,
      owner_id: null,
      page: 2,
      page_size: 10,
      sort_by: "newest",
    });

    const url = new URL(String(fetchMock.mock.calls[0][0]));
    expect(url.pathname).toBe("/api/v1/search");
    expect(url.searchParams.get("q")).toBe("snmp");
    expect(url.searchParams.get("research_field_id")).toBe("1");
    expect(url.searchParams.get("research_project_id")).toBe("2");
    expect(url.searchParams.get("owner_id")).toBeNull();
    expect(url.searchParams.get("page")).toBe("2");
    expect(url.searchParams.get("sort_by")).toBe("newest");
    const headers = fetchMock.mock.calls[0][1].headers as Headers;
    expect(headers.get("Authorization")).toBe("Bearer token-123");
  });

  it("calls catalog and history endpoints", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ query: "ja", fields: [], projects: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        items: [],
        pagination: { page: 1, page_size: 5, total_items: 0, total_pages: 0 },
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    await searchService.searchCatalog(" jaringan ", 4);
    await searchService.getSearchHistory({ page: 1, page_size: 5 });
    await searchService.clearSearchHistory();

    expect(String(fetchMock.mock.calls[0][0])).toBe("http://127.0.0.1:8000/api/v1/search/catalog?q=jaringan&limit=4");
    expect(String(fetchMock.mock.calls[1][0])).toBe("http://127.0.0.1:8000/api/v1/search/history?page=1&page_size=5");
    expect(fetchMock.mock.calls[2][0]).toBe("http://127.0.0.1:8000/api/v1/search/history");
    expect(fetchMock.mock.calls[2][1]).toEqual(expect.objectContaining({ method: "DELETE" }));
  });
});
