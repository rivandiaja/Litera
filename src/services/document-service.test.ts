import { clearStoredToken, setStoredToken } from "../lib/auth-storage";
import { documentService, getDocumentFileUrl } from "./document-service";

describe("documentService", () => {
  beforeEach(() => {
    clearStoredToken();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("uploads PDFs as multipart files without forcing Content-Type", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({
        items: [
          { original_filename: "paper-a.pdf", accepted: true, document_id: 10, index_status: "pending", file_size: 12 },
          { original_filename: "paper-b.pdf", accepted: true, document_id: 11, index_status: "pending", file_size: 13 },
        ],
        accepted_count: 2,
        failed_count: 0,
      }), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    const files = [
      new File(["%PDF-1.7"], "paper-a.pdf", { type: "application/pdf" }),
      new File(["%PDF-1.7"], "paper-b.pdf", { type: "application/pdf" }),
    ];

    await documentService.uploadProjectDocuments(7, files);

    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:8000/api/v1/projects/7/documents",
      expect.objectContaining({ method: "POST" })
    );
    const request = fetchMock.mock.calls[0][1] as RequestInit;
    const headers = request.headers as Headers;
    const body = request.body as FormData;
    expect(headers.get("Content-Type")).toBeNull();
    expect(body.getAll("files")).toHaveLength(2);
    expect((body.getAll("files")[0] as File).name).toBe("paper-a.pdf");
  });

  it("opens a PDF through an authorized blob URL instead of putting token in the URL", async () => {
    vi.useFakeTimers();
    setStoredToken("jwt-token");

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(new Blob(["%PDF-1.7"], { type: "application/pdf" }), {
        status: 200,
        headers: { "Content-Type": "application/pdf" },
      })
    );
    vi.stubGlobal("fetch", fetchMock);
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: vi.fn(() => "blob:litera-pdf"),
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: vi.fn(),
    });
    vi.spyOn(window, "open").mockReturnValue({} as Window);

    await documentService.openDocumentFile(42, "paper.pdf");

    expect(getDocumentFileUrl(42)).toBe("http://127.0.0.1:8000/api/v1/documents/42/file");
    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:8000/api/v1/documents/42/file",
      expect.objectContaining({ headers: expect.any(Headers) })
    );
    const headers = fetchMock.mock.calls[0][1].headers as Headers;
    expect(headers.get("Authorization")).toBe("Bearer jwt-token");
    expect(String(fetchMock.mock.calls[0][0])).not.toContain("jwt-token");
    expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
    const objectUrlBlob = (URL.createObjectURL as ReturnType<typeof vi.fn>).mock.calls[0][0] as Blob;
    expect(objectUrlBlob.type).toBe("application/pdf");
    expect(window.open).toHaveBeenCalledWith("blob:litera-pdf", "_blank", "noopener,noreferrer");

    vi.advanceTimersByTime(60_000);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:litera-pdf");
  });
});
