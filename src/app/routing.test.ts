import { describe, expect, it } from "vitest";
import { pageToPath, parsePageFromPath } from "./routing";

describe("app routing", () => {
  it("restores direct collection routes after refresh", () => {
    expect(parsePageFromPath("/collections/42")).toEqual({
      name: "collection",
      collectionId: "42",
    });
  });

  it("keeps search filters in the URL", () => {
    const page = {
      name: "search" as const,
      query: "monitoring snmp",
      researchFieldId: 2,
      researchProjectId: 7,
      ownerId: 4,
      sortBy: "newest" as const,
      page: 3,
    };

    const path = pageToPath(page);

    expect(path).toBe("/search?q=monitoring+snmp&field=2&collection=7&owner=4&sort=newest&page=3");
    expect(parsePageFromPath("/search", "?q=monitoring+snmp&field=2&collection=7&owner=4&sort=newest&page=3")).toEqual(page);
  });

  it("keeps dashboard and admin tab state in query params", () => {
    expect(pageToPath({ name: "dashboard", tab: "history" })).toBe("/dashboard?tab=history");
    expect(parsePageFromPath("/admin", "?tab=indexing")).toEqual({
      name: "admin",
      tab: "indexing",
    });
  });
});
