import { beforeEach, describe, expect, it, vi } from "vitest";
import { ObjectId, type Db } from "mongodb";
import { registerExports } from "../src/exports";
import {
  clearExports,
  getExport,
  installExportCapture,
} from "./helpers/export-registry";
import {
  createMockCollection,
  createMockConnector,
  createMockDb,
  type MockDbState,
} from "./helpers/mock-db";

function registerWithDb(state: MockDbState, connected = true) {
  const db = connected ? createMockDb(state) : null;
  const connector = createMockConnector(db, connected);
  clearExports();
  installExportCapture();
  registerExports(connector);
  return { db, state };
}

describe("cfx-mongodb export API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearExports();
  });

  describe("insert", () => {
    it("returns insertedId as string", async () => {
      const objectId = new ObjectId();
      const collection = createMockCollection({
        insertOne: vi.fn().mockResolvedValue({ insertedId: objectId }),
      });
      registerWithDb({ collections: { players: collection } });

      const insert = getExport<
        (name: string, doc: object) => Promise<{ success: boolean; insertedId?: string; error?: string }>
      >("insert");

      const result = await insert("players", { name: "test" });

      expect(result.success).toBe(true);
      expect(result.insertedId).toBe(objectId.toString());
      expect(typeof result.insertedId).toBe("string");
    });

    it("returns error envelope when db is not connected", async () => {
      registerWithDb({ collections: {} }, false);
      const insert = getExport<
        (name: string, doc: object) => Promise<{ success: boolean; error?: string }>
      >("insert");

      const result = await insert("players", { name: "test" });

      expect(result).toEqual({
        success: false,
        error: "Database not connected",
      });
    });
  });

  describe("find", () => {
    it("returns document with string _id", async () => {
      const objectId = new ObjectId();
      const doc = { _id: objectId, name: "alpha" };
      const collection = createMockCollection({
        findOne: vi.fn().mockResolvedValue({ ...doc }),
      });
      registerWithDb({ collections: { players: collection } });

      const find = getExport<
        (name: string, filter: object) => Promise<{ success: boolean; data?: { _id: string; name: string }; error?: string }>
      >("find");

      const result = await find("players", { name: "alpha" });

      expect(result.success).toBe(true);
      expect(result.data?._id).toBe(objectId.toString());
    });

    it("returns success with null data when not found", async () => {
      const collection = createMockCollection({
        findOne: vi.fn().mockResolvedValue(null),
      });
      registerWithDb({ collections: { players: collection } });

      const find = getExport<
        (name: string, filter: object) => Promise<{ success: boolean; data?: null; error?: string }>
      >("find");

      const result = await find("players", { name: "missing" });

      expect(result).toEqual({ success: true, data: null });
    });

    it("converts string _id filter to ObjectId", async () => {
      const objectId = new ObjectId();
      const collection = createMockCollection({
        findOne: vi.fn().mockResolvedValue({ _id: objectId, name: "x" }),
      });
      registerWithDb({ collections: { players: collection } });

      const find = getExport<(name: string, filter: object) => Promise<{ success: boolean }>>("find");
      await find("players", { _id: objectId.toString() });

      expect(collection.findOne).toHaveBeenCalledWith(
        expect.objectContaining({ _id: expect.any(ObjectId) })
      );
    });
  });

  describe("findById", () => {
    it("returns document when found", async () => {
      const objectId = new ObjectId();
      const collection = createMockCollection({
        findOne: vi.fn().mockResolvedValue({ _id: objectId, email: "a@b.c" }),
      });
      registerWithDb({ collections: { users: collection } });

      const findById = getExport<
        (name: string, id: string, projection?: object) => Promise<{ success: boolean; data?: { _id: string; email: string } | null; error?: string }>
      >("findById");

      const result = await findById("users", objectId.toString(), { email: 1 });

      expect(result.success).toBe(true);
      expect(result.data?._id).toBe(objectId.toString());
      expect(result.data?.email).toBe("a@b.c");
      expect(collection.findOne).toHaveBeenCalledWith(
        expect.objectContaining({ _id: expect.any(ObjectId) }),
        { projection: { email: 1 } }
      );
    });

    it("returns success with null data when not found", async () => {
      const collection = createMockCollection({
        findOne: vi.fn().mockResolvedValue(null),
      });
      registerWithDb({ collections: { users: collection } });

      const findById = getExport<
        (name: string, id: string) => Promise<{ success: boolean; data?: null; error?: string }>
      >("findById");

      const result = await findById("users", new ObjectId().toString());

      expect(result).toEqual({ success: true, data: null });
    });

    it("rejects invalid id", async () => {
      registerWithDb({ collections: { users: createMockCollection() } });

      const findById = getExport<
        (name: string, id: string) => Promise<{ success: boolean; error?: string }>
      >("findById");

      const result = await findById("users", "");

      expect(result).toEqual({ success: false, error: "Invalid id" });
    });
  });

  describe("findAll", () => {
    it("applies limit, skip and sort options", async () => {
      const objectId = new ObjectId();
      const docs = [{ _id: objectId, level: 10 }];
      const cursor = {
        limit: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        toArray: vi.fn().mockResolvedValue(docs),
      };
      const collection = createMockCollection({
        find: vi.fn().mockReturnValue(cursor),
      });
      registerWithDb({ collections: { players: collection } });

      const findAll = getExport<
        (name: string, filter: object, options: object) => Promise<{ success: boolean; data?: Array<{ _id: string; level: number }> }>
      >("findAll");

      const result = await findAll(
        "players",
        { active: true },
        { limit: 10, skip: 5, sort: { level: -1 } }
      );

      expect(result.success).toBe(true);
      expect(result.data?.[0]._id).toBe(objectId.toString());
      expect(collection.find).toHaveBeenCalledWith(
        { active: true },
        expect.objectContaining({ sort: { level: -1 } })
      );
      expect(cursor.limit).toHaveBeenCalledWith(10);
      expect(cursor.skip).toHaveBeenCalledWith(5);
    });
  });

  describe("update", () => {
    it("returns modifiedCount", async () => {
      const collection = createMockCollection({
        updateOne: vi.fn().mockResolvedValue({ matchedCount: 1, modifiedCount: 1 }),
      });
      registerWithDb({ collections: { players: collection } });

      const update = getExport<
        (name: string, filter: object, updateDoc: object) => Promise<{ success: boolean; modifiedCount?: number; matchedCount?: number }>
      >("update");

      const result = await update(
        "players",
        { _id: new ObjectId().toString() },
        { $set: { name: "updated" } }
      );

      expect(result.success).toBe(true);
      expect(result.modifiedCount).toBe(1);
    });
  });

  describe("delete", () => {
    it("returns deletedCount", async () => {
      const collection = createMockCollection({
        deleteOne: vi.fn().mockResolvedValue({ deletedCount: 1 }),
      });
      registerWithDb({ collections: { players: collection } });

      const del = getExport<
        (name: string, filter: object) => Promise<{ success: boolean; deletedCount?: number; error?: string }>
      >("delete");

      const result = await del("players", { _id: new ObjectId().toString() });

      expect(result.success).toBe(true);
      expect(result.deletedCount).toBe(1);
    });

    it("returns not-found error when nothing deleted", async () => {
      const collection = createMockCollection({
        deleteOne: vi.fn().mockResolvedValue({ deletedCount: 0 }),
      });
      registerWithDb({ collections: { players: collection } });

      const del = getExport<
        (name: string, filter: object) => Promise<{ success: boolean; error?: string }>
      >("delete");

      const result = await del("players", { name: "missing" });

      expect(result).toEqual({ success: false, error: "Document not found" });
    });
  });

  describe("count", () => {
    it("returns document count", async () => {
      const collection = createMockCollection({
        countDocuments: vi.fn().mockResolvedValue(42),
      });
      registerWithDb({ collections: { players: collection } });

      const count = getExport<
        (name: string, filter: object) => Promise<{ success: boolean; data?: number }>
      >("count");

      const result = await count("players", { active: true });

      expect(result).toEqual({ success: true, data: 42 });
    });
  });

  describe("getVersion", () => {
    it("returns semver string from resource metadata", async () => {
      registerWithDb({ collections: {} });

      const getVersion = getExport<() => Promise<string>>("getVersion");

      await expect(getVersion()).resolves.toBe("1.0.1");
    });
  });

  describe("getDb", () => {
    it("returns db reference when connected", () => {
      const { db } = registerWithDb({ collections: {} });

      const getDb = getExport<() => Db | null>("getDb");

      expect(getDb()).toBe(db);
    });

    it("returns null when not connected", () => {
      registerWithDb({ collections: {} }, false);

      const getDb = getExport<() => Db | null>("getDb");

      expect(getDb()).toBeNull();
    });
  });

  describe("isConnected", () => {
    it("reflects connector state", () => {
      registerWithDb({ collections: {} }, true);

      const isConnected = getExport<() => boolean>("isConnected");

      expect(isConnected()).toBe(true);
    });
  });

  describe("health", () => {
    it("returns ping timing", async () => {
      const command = vi.fn().mockResolvedValue({ ok: 1 });
      registerWithDb({ collections: {}, command });

      const health = getExport<
        () => Promise<{ success: boolean; data?: { ok: boolean; rttMs: number } }>
      >("health");

      const result = await health();

      expect(result.success).toBe(true);
      expect(result.data?.ok).toBe(true);
      expect(typeof result.data?.rttMs).toBe("number");
    });
  });

  describe("query validation", () => {
    it("blocks dangerous operators in find", async () => {
      registerWithDb({ collections: { players: createMockCollection() } });

      const find = getExport<
        (name: string, filter: object) => Promise<{ success: boolean; error?: string }>
      >("find");

      const result = await find("players", { $where: "this.a > 0" });

      expect(result.success).toBe(false);
      expect(result.error).toContain("$where");
    });
  });
});
