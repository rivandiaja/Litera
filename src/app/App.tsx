import { useState } from "react";
import { Toaster } from "sonner";
import { AppContext, type Page } from "./context";
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

  const [page, setPage] = useState<Page>({ name: "login" });
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadTargetCollectionId, setUploadTargetCollectionId] = useState<string | undefined>();
  const [isAdmin] = useState(true);

  function navigate(p: Page) {
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function renderPage() {
    switch (page.name) {
      case "login":
      case "register":
        return <LoginPage />;
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
        return <CreateCollectionPage />;
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
        isAdmin,
      }}
    >
      {renderPage()}
      <UploadModal />
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
