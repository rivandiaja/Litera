import { useEffect, useState } from "react";
import { Toaster } from "sonner";
import { AppContext, type Page } from "./context";
import { AuthProvider, useAuth } from "../contexts/AuthContext";
import { LoginPage } from "./components/LoginPage";
import { HomePage } from "./components/HomePage";
import { SearchResultsPage } from "./components/SearchResultsPage";
import { ResearchFieldsPage } from "./components/ResearchFieldsPage";
import { CollectionDetailPage } from "./components/CollectionDetailPage";
import { StudentDashboard } from "./components/StudentDashboard";
import { CreateCollectionPage } from "./components/CreateCollectionPage";
import { AdminDashboard } from "./components/AdminDashboard";
import { UploadModal } from "./components/UploadModal";

export default function App() {
  /* MARKER-MAKE-KIT-INVOKED */
  /* MARKER-MAKE-KIT-DISCOVERY-READ */

  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}

function AppShell() {
  const [page, setPage] = useState<Page>({ name: "login" });
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadTargetCollectionId, setUploadTargetCollectionId] = useState<string | undefined>();
  const [documentsRefreshKey, setDocumentsRefreshKey] = useState(0);
  const { user, isAuthenticated, isLoading } = useAuth();
  const isAdmin = user?.role === "admin";

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated && page.name !== "login" && page.name !== "register") {
      setPage({ name: "login" });
    }
    if (isAuthenticated && (page.name === "login" || page.name === "register")) {
      setPage({ name: "home" });
    }
  }, [isAuthenticated, isLoading, page.name]);

  function navigate(p: Page) {
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function notifyDocumentsChanged() {
    setDocumentsRefreshKey((value) => value + 1);
  }

  function renderPage() {
    switch (page.name) {
      case "login":
      case "register":
        return <LoginPage initialMode={page.name} />;
      case "home":
        return <HomePage />;
      case "search":
        return <SearchResultsPage query={page.query} />;
      case "fields":
        return <ResearchFieldsPage />;
      case "field-detail":
        return <ResearchFieldsPage fieldId={page.fieldId} />;
      case "collection":
        return <CollectionDetailPage collectionId={page.collectionId} />;
      case "dashboard":
        return <StudentDashboard />;
      case "create-collection":
        return <CreateCollectionPage projectId={page.projectId} />;
      case "admin":
        return <AdminDashboard />;
      default:
        return <HomePage />;
    }
  }

  return (
    <AppContext.Provider
      value={{
        page,
        navigate,
        showUploadModal,
        setShowUploadModal,
        uploadTargetCollectionId,
        setUploadTargetCollectionId,
        documentsRefreshKey,
        notifyDocumentsChanged,
        isAdmin,
      }}
    >
      {isLoading ? (
        <div className="min-h-screen bg-[#F5F4F1] flex items-center justify-center">
          <div className="bg-white rounded-[1.25rem] border border-[rgba(12,13,26,0.07)] px-6 py-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-700">Memuat sesi Litera...</p>
          </div>
        </div>
      ) : renderPage()}
      {isAuthenticated && <UploadModal />}
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: "#fff",
            border: "1px solid #E8E7E4",
            borderRadius: "16px",
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: "14px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
          },
        }}
      />
    </AppContext.Provider>
  );
}
