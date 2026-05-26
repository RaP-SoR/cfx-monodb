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
import { parseServerExportsFromManifest } from "./helpers/manifest-exports";
import {
  createMockCollection,
  createMockConnector,
  createMockDb,
} from "./helpers/mock-db";

function setupRegisteredExports(): string[] {
  clearExports();
  installExportCapture();
  const db = createMockDb({ collections: {} });
  const connector = createMockConnector(db, true);
  registerExports(connector);
  return listExports();
}

function registerWithConnector(
  collections: Record<string, ReturnType<typeof createMockCollection>>,
  connected = true
) {
  clearExports();
  installExportCapture();
  const db = connected ? createMockDb({ collections }) : null;
  const connector = createMockConnector(db, connected);
  registerExports(connector);
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

    it("fxmanifest server_exports matches CFX_MONGODB_EXPORTS", () => {
      const manifestExports = parseServerExportsFromManifest();
      const manifestSorted = [...manifestExports].sort();
      const typesSorted = [...CFX_MONGODB_EXPORTS].sort();

      expect(manifestSorted).toEqual(typesSorted);
    });
  });

  describe("response envelope invariants", () => {
    it("insert success returns insertedId as string", async () => {
      const objectId = new ObjectId();
      const collection = createMockCollection({
        insertOne: vi.fn().mockResolvedValue({ insertedId: objectId }),
      });
      registerWithConnector({ players: collection });

      const insert = getExport<
        (
          name: string,
          doc: object
        ) => Promise<{ success: true; insertedId: string } | { success: false; error: string }>
      >("insert");

      const result = await insert("players", { name: "test" });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(typeof result.insertedId).toBe("string");
        expect(result.insertedId).toBe(objectId.toString());
      }
    });

    it("insert returns error envelope when db is not connected", async () => {
      registerWithConnector({}, false);

      const insert = getExport<
        (name: string, doc: object) => Promise<{ success: boolean; error?: string }>
      >("insert");

      const result = await insert("players", { name: "test" });

      expect(result).toEqual({
        success: false,
        error: "Database not connected",
      });
    });

    it("update success returns matchedCount and modifiedCount", async () => {
      const collection = createMockCollection({
        updateOne: vi.fn().mockResolvedValue({ matchedCount: 1, modifiedCount: 1 }),
      });
      registerWithConnector({ players: collection });

      const update = getExport<
        (
          name: string,
          filter: object,
          update: object
        ) => Promise<
          | { success: true; matchedCount: number; modifiedCount: number }
          | { success: false; error: string }
        >
      >("update");

      const result = await update("players", { name: "old" }, { name: "new" });

      expect(result).toEqual({
        success: true,
        matchedCount: 1,
        modifiedCount: 1,
      });
    });

    it("delete returns not-found error when nothing deleted", async () => {
      const collection = createMockCollection({
        deleteOne: vi.fn().mockResolvedValue({ deletedCount: 0 }),
      });
      registerWithConnector({ players: collection });

      const del = getExport<
        (
          name: string,
          filter: object
        ) => Promise<{ success: boolean; error?: string; deletedCount?: number }>
      >("delete");

      const result = await del("players", { _id: new ObjectId().toString() });

      expect(result).toEqual({
        success: false,
        error: "Document not found",
      });
    });

    it("health success returns ok and rttMs", async () => {
      registerWithConnector({});

      const health = getExport<
        () => Promise<
          | { success: true; data: { ok: boolean; rttMs: number } }
          | { success: false; error: string }
        >
      >("health");

      const result = await health();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.ok).toBe(true);
        expect(typeof result.data.rttMs).toBe("number");
      }
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
