import { beforeEach, describe, expect, it, vi } from "vitest";
import { ObjectId } from "mongodb";
import { getExport } from "../helpers/export-registry";
import { createMockCollection } from "../helpers/mock-db";
import { registerWithDb } from "../helpers/register-exports";

describe("write handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("insert", () => {
    it("inserts a plain document successfully", async () => {
      const collection = createMockCollection({
        insertOne: vi.fn().mockResolvedValue({ insertedId: new ObjectId() }),
      });
      registerWithDb({ collections: { players: collection } });

      const insert = getExport<
        (
          name: string,
          doc: object
        ) => Promise<{ success: boolean; insertedId?: string; error?: string }>
      >("insert");

      const doc = { name: "Alex", level: 5 };
      const result = await insert("players", doc);

      expect(result.success).toBe(true);
      expect(result.insertedId).toMatch(/^[0-9a-f]{24}$/i);
      expect(collection.insertOne).toHaveBeenCalledWith(doc);
    });

    it("returns driver error as envelope", async () => {
      const collection = createMockCollection({
        insertOne: vi.fn().mockRejectedValue(new Error("duplicate key")),
      });
      registerWithDb({ collections: { players: collection } });

      const insert = getExport<
        (name: string, doc: object) => Promise<{ success: boolean; error?: string }>
      >("insert");

      const result = await insert("players", { email: "taken@example.com" });

      expect(result).toEqual({ success: false, error: "duplicate key" });
    });

    it("rejects documents with dangerous operators", async () => {
      const collection = createMockCollection({
        insertOne: vi.fn(),
      });
      registerWithDb({ collections: { players: collection } });

      const insert = getExport<
        (
          name: string,
          doc: object
        ) => Promise<{ success: boolean; error?: string }>
      >("insert");

      const result = await insert("players", {
        profile: {
          $where: "this.level > 0",
        },
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("$where");
      expect(collection.insertOne).not.toHaveBeenCalled();
    });

    it("rejects documents that exceed depth limits", async () => {
      const collection = createMockCollection({
        insertOne: vi.fn(),
      });
      registerWithDb({ collections: { players: collection } });

      const insert = getExport<
        (
          name: string,
          doc: object
        ) => Promise<{ success: boolean; error?: string }>
      >("insert");

      const deepDocument: Record<string, unknown> = {};
      let current: Record<string, unknown> = deepDocument;
      for (let i = 0; i < 8; i += 1) {
        const next: Record<string, unknown> = {};
        current[`level${i}`] = next;
        current = next;
      }

      const result = await insert("players", deepDocument);

      expect(result.success).toBe(false);
      expect(result.error).toContain("depth exceeded");
      expect(collection.insertOne).not.toHaveBeenCalled();
    });
  });

  describe("update", () => {
    it("wraps plain object as $set", async () => {
      const collection = createMockCollection({
        updateOne: vi.fn().mockResolvedValue({ matchedCount: 1, modifiedCount: 1 }),
      });
      registerWithDb({ collections: { players: collection } });

      const update = getExport<
        (
          name: string,
          filter: object,
          updateDoc: object
        ) => Promise<{ success: boolean; modifiedCount?: number }>
      >("update");

      await update("players", { name: "old" }, { level: 5 });

      expect(collection.updateOne).toHaveBeenCalledWith(
        { name: "old" },
        { $set: { level: 5 } }
      );
    });

    it("blocks dangerous operators in update document", async () => {
      registerWithDb({ collections: { players: createMockCollection() } });

      const update = getExport<
        (
          name: string,
          filter: object,
          updateDoc: object
        ) => Promise<{ success: boolean; error?: string }>
      >("update");

      const result = await update(
        "players",
        { _id: new ObjectId().toString() },
        { $where: "this.level > 0" }
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain("$where");
    });

    it("blocks dangerous operators in filter", async () => {
      registerWithDb({ collections: { players: createMockCollection() } });

      const update = getExport<
        (
          name: string,
          filter: object,
          updateDoc: object
        ) => Promise<{ success: boolean; error?: string }>
      >("update");

      const result = await update(
        "players",
        { $where: "true" },
        { $set: { active: true } }
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain("$where");
    });

    it("returns matchedCount zero when nothing updated", async () => {
      const collection = createMockCollection({
        updateOne: vi.fn().mockResolvedValue({ matchedCount: 0, modifiedCount: 0 }),
      });
      registerWithDb({ collections: { players: collection } });

      const update = getExport<
        (
          name: string,
          filter: object,
          updateDoc: object
        ) => Promise<{ success: boolean; matchedCount?: number; modifiedCount?: number }>
      >("update");

      const result = await update(
        "players",
        { name: "missing" },
        { $set: { active: false } }
      );

      expect(result.success).toBe(true);
      expect(result.matchedCount).toBe(0);
      expect(result.modifiedCount).toBe(0);
    });
  });
});
