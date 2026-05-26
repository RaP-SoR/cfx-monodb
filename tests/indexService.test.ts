import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import type { Db } from "mongodb";
import {
  ensureIndexesForCollection,
  ensureIndexesFromConvar,
} from "../src/services/indexService";
import * as utils from "../src/utils";

describe("indexService", () => {
  beforeEach(() => {
    vi.spyOn(utils, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("ensureIndexesForCollection", () => {
    it("creates indexes and returns count", async () => {
      const createIndexes = vi.fn().mockResolvedValue(["idx_a"]);
      const db = {
        collection: vi.fn().mockReturnValue({ createIndexes }),
      } as unknown as Db;

      const count = await ensureIndexesForCollection(db, "players", [
        { keys: { name: 1 } },
        { keys: { level: -1 }, options: { unique: true } },
      ]);

      expect(count).toBe(2);
      expect(db.collection).toHaveBeenCalledWith("players");
      expect(createIndexes).toHaveBeenCalledWith([
        { key: { name: 1 } },
        { key: { level: -1 }, unique: true },
      ]);
    });

    it("truncates to 20 index specs", async () => {
      const createIndexes = vi.fn().mockResolvedValue([]);
      const db = {
        collection: vi.fn().mockReturnValue({ createIndexes }),
      } as unknown as Db;

      const specs = Array.from({ length: 25 }, (_, i) => ({
        keys: { [`f${i}`]: 1 as const },
      }));

      const count = await ensureIndexesForCollection(db, "big", specs);

      expect(count).toBe(20);
      expect(createIndexes.mock.calls[0][0]).toHaveLength(20);
    });

    it("throws when no specs provided", async () => {
      const db = { collection: vi.fn() } as unknown as Db;

      await expect(
        ensureIndexesForCollection(db, "players", [])
      ).rejects.toThrow("No index specs provided");
    });
  });

  describe("ensureIndexesFromConvar", () => {
    it("applies indexes from parseInitIndexes for each collection", async () => {
      vi.spyOn(utils, "parseInitIndexes").mockReturnValue({
        users: [{ keys: { email: 1 } }],
        items: [{ keys: { sku: 1 } }],
      });

      const createIndexes = vi.fn().mockResolvedValue([]);
      const db = {
        collection: vi.fn().mockReturnValue({ createIndexes }),
      } as unknown as Db;

      await ensureIndexesFromConvar(db);

      expect(db.collection).toHaveBeenCalledWith("users");
      expect(db.collection).toHaveBeenCalledWith("items");
      expect(createIndexes).toHaveBeenCalledTimes(2);
    });

    it("logs warn and continues when one collection fails", async () => {
      vi.spyOn(utils, "parseInitIndexes").mockReturnValue({
        ok: [{ keys: { a: 1 } }],
        bad: [{ keys: { b: 1 } }],
      });

      const createIndexes = vi
        .fn()
        .mockResolvedValueOnce(["idx"])
        .mockRejectedValueOnce(new Error("index conflict"));
      const db = {
        collection: vi.fn().mockReturnValue({ createIndexes }),
      } as unknown as Db;

      await ensureIndexesFromConvar(db);

      expect(utils.log).toHaveBeenCalledWith(
        "warn",
        "Failed to ensure indexes for bad: index conflict"
      );
    });

    it("no-ops when parseInitIndexes returns null", async () => {
      vi.spyOn(utils, "parseInitIndexes").mockReturnValue(null);
      const db = { collection: vi.fn() } as unknown as Db;

      await ensureIndexesFromConvar(db);

      expect(db.collection).not.toHaveBeenCalled();
    });
  });
});
