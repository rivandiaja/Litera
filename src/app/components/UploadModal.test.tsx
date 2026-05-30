import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AppContext, type AppContextType } from "../context";
import { UploadModal } from "./UploadModal";

const serviceMocks = vi.hoisted(() => ({
  listMine: vi.fn(),
  uploadProjectDocuments: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock("../../services/project-service", () => ({
  projectService: {
    listMine: serviceMocks.listMine,
  },
}));

vi.mock("../../services/document-service", () => ({
  documentService: {
    uploadProjectDocuments: serviceMocks.uploadProjectDocuments,
  },
}));

vi.mock("sonner", () => ({
  toast: {
    success: serviceMocks.toastSuccess,
    error: serviceMocks.toastError,
  },
}));

const notifyDocumentsChanged = vi.fn();
const setShowUploadModal = vi.fn();

const baseContext: AppContextType = {
  page: { name: "collection", collectionId: "1" },
  navigate: vi.fn(),
  showUploadModal: true,
  setShowUploadModal,
  uploadTargetCollectionId: "1",
  setUploadTargetCollectionId: vi.fn(),
  documentsRefreshKey: 0,
  notifyDocumentsChanged,
  isAdmin: false,
};

function renderModal(overrides: Partial<AppContextType> = {}) {
  return render(
    <AppContext.Provider value={{ ...baseContext, ...overrides }}>
      <UploadModal />
    </AppContext.Provider>
  );
}

describe("UploadModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    serviceMocks.listMine.mockResolvedValue({
      items: [
        {
          id: 1,
          title: "Perancangan Network Monitoring System",
          description: "",
          keywords: [],
          visibility: "public",
          owner: { id: 1, name: "Arif", email: "arif@mahasiswa.ac.id", student_number: "2021001" },
          field: { id: 1, name: "Jaringan Komputer", slug: "jaringan-komputer", icon: "Network", is_active: true },
          document_count: 0,
          created_at: "2026-01-01T00:00:00",
          updated_at: "2026-01-01T00:00:00",
        },
      ],
      pagination: { page: 1, page_size: 100, total: 1, total_pages: 1 },
    });
    serviceMocks.uploadProjectDocuments.mockResolvedValue({
      items: [
        {
          original_filename: "monitoring.pdf",
          accepted: true,
          document_id: 10,
          index_status: "pending",
          file_size: 12,
          error: null,
        },
      ],
      accepted_count: 1,
      failed_count: 0,
    });
  });

  it("uploads selected PDF files to the selected collection through the document API", async () => {
    renderModal();

    expect(await screen.findByRole("dialog", { name: /unggah literatur pdf/i })).toBeInTheDocument();
    await waitFor(() => expect(serviceMocks.listMine).toHaveBeenCalled());

    const input = document.body.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["%PDF-1.7"], "monitoring.pdf", { type: "application/pdf" });
    fireEvent.change(input, { target: { files: [file] } });

    expect(await screen.findByText("monitoring.pdf")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /^unggah$/i }));

    await waitFor(() => expect(serviceMocks.uploadProjectDocuments).toHaveBeenCalledWith(1, [file]));
    await waitFor(() => expect(notifyDocumentsChanged).toHaveBeenCalled());
    expect(await screen.findByText("Menunggu Indexing")).toBeInTheDocument();
  });

  it("rejects non-PDF files before calling the upload endpoint", async () => {
    renderModal();

    await screen.findByRole("dialog", { name: /unggah literatur pdf/i });
    const input = document.body.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, {
      target: { files: [new File(["plain"], "notes.txt", { type: "text/plain" })] },
    });

    expect(await screen.findByText("notes.txt")).toBeInTheDocument();
    expect(screen.getByText("Hanya file PDF yang diterima.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^unggah$/i })).toBeDisabled();
    expect(serviceMocks.uploadProjectDocuments).not.toHaveBeenCalled();
  });
});
