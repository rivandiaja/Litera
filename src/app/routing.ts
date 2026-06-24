import type { Page } from "./context";
import type { SearchSort } from "../types/search";

const SEARCH_SORTS: SearchSort[] = ["relevance", "newest", "title_asc", "title_desc"];

function encodeSegment(value: string) {
  return encodeURIComponent(value);
}

function decodeSegment(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function parsePositiveNumber(value: string | null) {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

function parseSearchSort(value: string | null) {
  return SEARCH_SORTS.includes(value as SearchSort) ? value as SearchSort : undefined;
}

function appendOptionalNumber(params: URLSearchParams, key: string, value?: number) {
  if (typeof value === "number" && Number.isFinite(value)) {
    params.set(key, String(value));
  }
}

export function pageToPath(page: Page) {
  switch (page.name) {
    case "login":
      return "/login";
    case "register":
      return "/register";
    case "home":
      return "/home";
    case "fields":
      return "/fields";
    case "field-detail":
      return `/fields/${encodeSegment(page.fieldId)}`;
    case "collection":
      return `/collections/${encodeSegment(page.collectionId)}`;
    case "create-collection":
      return page.projectId
        ? `/collections/${encodeSegment(page.projectId)}/edit`
        : "/collections/new";
    case "dashboard": {
      const params = new URLSearchParams();
      if (page.tab) params.set("tab", page.tab);
      const query = params.toString();
      return query ? `/dashboard?${query}` : "/dashboard";
    }
    case "admin": {
      const params = new URLSearchParams();
      if (page.tab) params.set("tab", page.tab);
      const query = params.toString();
      return query ? `/admin?${query}` : "/admin";
    }
    case "search": {
      const params = new URLSearchParams();
      params.set("q", page.query);
      appendOptionalNumber(params, "field", page.researchFieldId);
      appendOptionalNumber(params, "collection", page.researchProjectId);
      appendOptionalNumber(params, "owner", page.ownerId);
      if (page.sortBy && page.sortBy !== "relevance") params.set("sort", page.sortBy);
      if (page.page && page.page > 1) params.set("page", String(page.page));
      return `/search?${params.toString()}`;
    }
    default:
      return "/home";
  }
}

export function parsePageFromPath(pathname: string, search = ""): Page {
  const params = new URLSearchParams(search);
  const segments = pathname
    .replace(/\/+$/, "")
    .split("/")
    .filter(Boolean)
    .map(decodeSegment);

  if (segments.length === 0) return { name: "login" };

  const [section, id, action] = segments;

  if (section === "login") return { name: "login" };
  if (section === "register") return { name: "register" };
  if (section === "home") return { name: "home" };
  if (section === "fields") {
    return id ? { name: "field-detail", fieldId: id } : { name: "fields" };
  }
  if (section === "collections") {
    if (id === "new") return { name: "create-collection" };
    if (id && action === "edit") return { name: "create-collection", projectId: id };
    if (id) return { name: "collection", collectionId: id };
  }
  if (section === "dashboard") {
    return { name: "dashboard", tab: params.get("tab") ?? undefined };
  }
  if (section === "admin") {
    return { name: "admin", tab: params.get("tab") ?? undefined };
  }
  if (section === "search") {
    const query = params.get("q")?.trim();
    if (!query) return { name: "home" };
    return {
      name: "search",
      query,
      researchFieldId: parsePositiveNumber(params.get("field")),
      researchProjectId: parsePositiveNumber(params.get("collection")),
      ownerId: parsePositiveNumber(params.get("owner")),
      sortBy: parseSearchSort(params.get("sort")),
      page: parsePositiveNumber(params.get("page")),
    };
  }

  return { name: "home" };
}

export function getPageFromCurrentLocation() {
  return parsePageFromPath(window.location.pathname, window.location.search);
}

export function syncBrowserPage(page: Page, replace = false) {
  const nextPath = pageToPath(page);
  const currentPath = `${window.location.pathname}${window.location.search}`;
  if (nextPath === currentPath) return;
  const method = replace ? "replaceState" : "pushState";
  window.history[method]({ page }, "", nextPath);
}
