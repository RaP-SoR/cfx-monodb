import { beforeEach, describe, expect, it, vi } from "vitest";
import { ObjectId } from "mongodb";
import { getExport } from "../helpers/export-registry";
import { createMockCollection } from "../helpers/mock-db";
import { registerWithDb } from "../helpers/register-exports";

describe("read handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("findAll", () => {
    it("clamps limit to max 1000 and min 1", async () => {
      const cursor = {
        limit: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        toArray: vi.fn().mockResolvedValue([]),
      };
      const collection = createMockCollection({
        find: vi.fn().mockReturnValue(cursor),
      });
      registerWithDb({ collections: { players: collection } });

      const findAll = getExport<
        (
          name: string,
          filter: object,
          options: object
        ) => Promise<{ success: boolean; data?: unknown[] }>
      >("findAll");

      await findAll("players", {}, { limit: 5000 });
      expect(cursor.limit).toHaveBeenCalledWith(1000);

      await findAll("players", {}, { limit: 0 });
      expect(cursor.limit).toHaveBeenCalledWith(1);
    });

    it("clamps skip to non-negative max", async () => {
      const cursor = {
        limit: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        toArray: vi.fn().mockResolvedValue([]),
      };
      const collection = createMockCollection({
        find: vi.fn().mockReturnValue(cursor),
      });
      registerWithDb({ collections: { players: collection } });

      const findAll = getExport<
        (name: string, filter: object, options: object) => Promise<{ success: boolean }>
      >("findAll");

      await findAll("players", {}, { skip: -5 });
      expect(cursor.skip).toHaveBeenCalledWith(0);

      await findAll("players", {}, { skip: 2_000_000 });
      expect(cursor.skip).toHaveBeenCalledWith(1_000_000);
    });

    it("defaults limit to 100 when omitted", async () => {
      const cursor = {
        limit: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        toArray: vi.fn().mockResolvedValue([]),
      };
      const collection = createMockCollection({
        find: vi.fn().mockReturnValue(cursor),
      });
      registerWithDb({ collections: { players: collection } });

      const findAll = getExport<
        (name: string, filter: object, options?: object) => Promise<{ success: boolean }>
      >("findAll");

      await findAll("players", {});
      expect(cursor.limit).toHaveBeenCalledWith(100);
      expect(cursor.skip).toHaveBeenCalledWith(0);
    });

    it("blocks dangerous operators in filter", async () => {
      registerWithDb({ collections: { players: createMockCollection() } });

      const findAll = getExport<
        (name: string, filter: object) => Promise<{ success: boolean; error?: string }>
      >("findAll");

      const result = await findAll("players", { $where: "true" });

      expect(result.success).toBe(false);
      expect(result.error).toContain("$where");
    });
  });

  describe("find", () => {
    it("returns driver error as envelope", async () => {
      const collection = createMockCollection({
        findOne: vi.fn().mockRejectedValue(new Error("find failed")),
      });
      registerWithDb({ collections: { players: collection } });

      const find = getExport<
        (name: string, filter: object) => Promise<{ success: boolean; error?: string }>
      >("find");

      const result = await find("players", { _id: new ObjectId().toString() });

      expect(result).toEqual({ success: false, error: "find failed" });
    });
  });

  describe("count", () => {
    it("blocks dangerous operators in filter", async () => {
      registerWithDb({ collections: { players: createMockCollection() } });

      const count = getExport<
        (name: string, filter: object) => Promise<{ success: boolean; error?: string }>
      >("count");

      const result = await count("players", { $function: { body: "x", args: [], lang: "js" } });

      expect(result.success).toBe(false);
      expect(result.error).toMatch(/\$function/);
    });
  });
});
