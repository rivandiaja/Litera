import { createContext, useContext } from "react";
import type { SearchSort } from "../types/search";

export type Page =
  | { name: "login" }
  | { name: "register" }
  | { name: "home" }
  | { name: "search"; query: string; researchFieldId?: number; researchProjectId?: number; ownerId?: number; sortBy?: SearchSort; page?: number }
  | { name: "fields" }
  | { name: "field-detail"; fieldId: string }
  | { name: "collection"; collectionId: string }
  | { name: "dashboard"; tab?: string }
  | { name: "create-collection"; projectId?: string }
  | { name: "admin"; tab?: string };

export interface NavigateOptions {
  replace?: boolean;
  scroll?: boolean;
}

export interface AppContextType {
  page: Page;
  navigate: (page: Page, options?: NavigateOptions) => void;
  showUploadModal: boolean;
  setShowUploadModal: (v: boolean) => void;
  uploadTargetCollectionId?: string;
  setUploadTargetCollectionId: (id?: string) => void;
  documentsRefreshKey: number;
  notifyDocumentsChanged: () => void;
  isAdmin: boolean;
}

export const AppContext = createContext<AppContextType>({
  page: { name: "login" },
  navigate: () => {},
  showUploadModal: false,
  setShowUploadModal: () => {},
  setUploadTargetCollectionId: () => {},
  documentsRefreshKey: 0,
  notifyDocumentsChanged: () => {},
  isAdmin: false,
});

export const useApp = () => useContext(AppContext);
