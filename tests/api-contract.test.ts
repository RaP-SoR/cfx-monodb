import { beforeEach, describe, expect, it, vi } from "vitest";
import { ObjectId } from "mongodb";
import { CFX_MONGODB_EXPORTS } from "../src/types/api";
import { registerExports } from "../src/exports";
import {
  clearExports,
  getExport,
  installExportCapture,
  listExports,
} from "./helpers/export-registry";
import { createMockCollection, createMockConnector, createMockDb } from "./helpers/mock-db";

function setupRegisteredExports(): string[] {
  clearExports();
  installExportCapture();
  const db = createMockDb({ collections: {} });
  const connector = createMockConnector(db, true);
  registerExports(connector);
  return listExports();
}

describe("cfx-mongodb API contract", () => {
  beforeEach(() => {
    clearExports();
  });

  describe("export registry vs CFX_MONGODB_EXPORTS", () => {
    it("all CFX_MONGODB_EXPORTS names are registered at runtime", () => {
      const registered = setupRegisteredExports();
      const missing = CFX_MONGODB_EXPORTS.filter(
        (name) => !registered.includes(name)
      );
      expect(
        missing,
        `Exports declared in CFX_MONGODB_EXPORTS but not registered: [${missing.join(", ")}]`
      ).toEqual([]);
    });

    it("documents any extra registered exports not yet in CFX_MONGODB_EXPORTS", () => {
      const registered = setupRegisteredExports();
      const extra = registered.filter(
        (name) => !(CFX_MONGODB_EXPORTS as readonly string[]).includes(name)
      );
      if (extra.length > 0) {
        console.warn(
          `[api-contract] Extra registered exports not in CFX_MONGODB_EXPORTS: ${extra.join(", ")}`
        );
      }
      expect(extra).toEqual([]);
    });
  });

  describe("find and findById not-found semantics", () => {
    it("both return success true with data null when document is missing", async () => {
      clearExports();
      installExportCapture();
      const collection = createMockCollection({
        findOne: vi.fn().mockResolvedValue(null),
      });
      const connector = createMockConnector(
        createMockDb({ collections: { players: collection } }),
        true
      );
      registerExports(connector);

      const find = getExport<
        (name: string, filter: object) => Promise<{ success: boolean; data?: null }>
      >("find");
      const findById = getExport<
        (name: string, id: string) => Promise<{ success: boolean; data?: null }>
      >("findById");

      const byFilter = await find("players", { name: "missing" });
      const byId = await findById("players", new ObjectId().toString());

      expect(byFilter).toEqual({ success: true, data: null });
      expect(byId).toEqual({ success: true, data: null });
    });
  });
});
