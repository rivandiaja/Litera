import { createContext, useContext } from "react";

export type Page =
  | { name: "login" }
  | { name: "register" }
  | { name: "home" }
  | { name: "search"; query: string }
  | { name: "fields" }
  | { name: "field-detail"; fieldId: string }
  | { name: "collection"; collectionId: string }
  | { name: "dashboard"; tab?: string }
  | { name: "create-collection" }
  | { name: "admin"; tab?: string };

export interface AppContextType {
  page: Page;
  navigate: (page: Page) => void;
  showUploadModal: boolean;
  setShowUploadModal: (v: boolean) => void;
  uploadTargetCollectionId?: string;
  setUploadTargetCollectionId: (id?: string) => void;
  isAdmin: boolean;
}

export const AppContext = createContext<AppContextType>({
  page: { name: "login" },
  navigate: () => {},
  showUploadModal: false,
  setShowUploadModal: () => {},
  setUploadTargetCollectionId: () => {},
  isAdmin: false,
});

export const useApp = () => useContext(AppContext);
