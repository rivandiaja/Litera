import { useCallback, useEffect, useState } from "react";
import { Toaster } from "sonner";
import { AppContext, type NavigateOptions, type Page } from "./context";
import { getPageFromCurrentLocation, syncBrowserPage } from "./routing";
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
  const [page, setPage] = useState<Page>(() => getPageFromCurrentLocation());
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadTargetCollectionId, setUploadTargetCollectionId] = useState<string | undefined>();
  const [documentsRefreshKey, setDocumentsRefreshKey] = useState(0);
  const { user, isAuthenticated, isLoading } = useAuth();
  const isAdmin = user?.role === "admin";

  const navigate = useCallback((p: Page, options: NavigateOptions = {}) => {
    setPage(p);
    syncBrowserPage(p, options.replace);

    if (options.scroll === false) return;
    try {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      // jsdom does not implement smooth scrolling during tests.
    }
  }, []);

  useEffect(() => {
    function handlePopState() {
      setPage(getPageFromCurrentLocation());
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated && page.name !== "login" && page.name !== "register") {
      navigate({ name: "login" }, { replace: true, scroll: false });
    }
    if (isAuthenticated && (page.name === "login" || page.name === "register")) {
      navigate({ name: "home" }, { replace: true, scroll: false });
    }
    if (isAuthenticated && page.name === "admin" && !isAdmin) {
      navigate({ name: "home" }, { replace: true, scroll: false });
    }
  }, [isAdmin, isAuthenticated, isLoading, navigate, page.name]);

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
        return (
          <SearchResultsPage
            query={page.query}
            initialResearchFieldId={page.researchFieldId}
            initialResearchProjectId={page.researchProjectId}
            initialOwnerId={page.ownerId}
            initialSortBy={page.sortBy}
            initialPage={page.page}
          />
        );
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
        return isAdmin ? <AdminDashboard /> : <HomePage />;
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
