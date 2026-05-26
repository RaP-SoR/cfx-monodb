import { beforeEach, describe, expect, it, vi } from "vitest";
import { getExport } from "../helpers/export-registry";
import {
  createMockCollection,
  createMockDb,
} from "../helpers/mock-db";
import { registerWithDb } from "../helpers/register-exports";

describe("admin handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("config", () => {
    it("returns safe runtime config without connection strings", () => {
      registerWithDb({ collections: {} });

      const config = getExport<
        () => { success: boolean; data?: Record<string, unknown> }
      >("config");

      const result = config();

      expect(result.success).toBe(true);
      expect(result.data).toMatchObject({
        env: "dev",
        logLevel: "info",
        perfEnabled: false,
      });
      expect(result.data).not.toHaveProperty("mongoUrl");
      expect(result.data).not.toHaveProperty("password");
      expect(typeof result.data?.timeout).toBe("number");
      expect(typeof result.data?.maxPoolSize).toBe("number");
      expect(typeof result.data?.perfBuffer).toBe("number");
    });

    it("falls back to info for invalid log level", () => {
      vi.stubGlobal("GetConvar", (name: string, defaultValue: string) => {
        if (name === "mongodb_log_level") return "verbose";
        return defaultValue;
      });

      registerWithDb({ collections: {} });

      const config = getExport<
        () => { success: boolean; data?: Record<string, unknown> }
      >("config");

      const result = config();

      expect(result.success).toBe(true);
      expect(result.data?.logLevel).toBe("info");

      vi.stubGlobal("GetConvar", (name: string, defaultValue: string) => defaultValue);
    });

    it("reflects perf ConVars when enabled", () => {
      vi.stubGlobal(
        "GetConvar",
        (name: string, defaultValue: string) => {
          if (name === "mongodb_perf_enabled") return "1";
          if (name === "mongodb_perf_slow_ms") return "250";
          if (name === "mongodb_perf_log_all") return "1";
          if (name === "mongodb_perf_buffer") return "200";
          return defaultValue;
        }
      );

      registerWithDb({ collections: {} });

      const config = getExport<
        () => { success: boolean; data?: Record<string, unknown> }
      >("config");

      const result = config();

      expect(result.success).toBe(true);
      expect(result.data).toMatchObject({
        perfEnabled: true,
        perfSlowMs: 250,
        perfLogAll: true,
        perfBuffer: 200,
      });

      vi.stubGlobal("GetConvar", (name: string, defaultValue: string) => defaultValue);
    });
  });

  describe("ensureIndexes", () => {
    it("creates indexes and returns count", async () => {
      const collection = createMockCollection({
        createIndexes: vi.fn().mockResolvedValue(["idx_a"]),
      });
      registerWithDb({ collections: { players: collection } });

      const ensureIndexes = getExport<
        (
          name: string,
          specs: Array<{ keys: Record<string, 1 | -1> }>
        ) => Promise<{ success: boolean; data?: number; error?: string }>
      >("ensureIndexes");

      const result = await ensureIndexes("players", [
        { keys: { email: 1 } },
        { keys: { name: 1, level: -1 } },
      ]);

      expect(result).toEqual({ success: true, data: 2 });
      expect(collection.createIndexes).toHaveBeenCalledWith([
        { key: { email: 1 } },
        { key: { name: 1, level: -1 } },
      ]);
    });

    it("returns error when db is not connected", async () => {
      registerWithDb({ collections: {} }, false);

      const ensureIndexes = getExport<
        (
          name: string,
          specs: Array<{ keys: Record<string, 1 | -1> }>
        ) => Promise<{ success: boolean; error?: string }>
      >("ensureIndexes");

      const result = await ensureIndexes("players", [{ keys: { email: 1 } }]);

      expect(result).toEqual({
        success: false,
        error: "Database not connected",
      });
    });

    it("rejects empty index list", async () => {
      const collection = createMockCollection();
      registerWithDb({ collections: { players: collection } });

      const ensureIndexes = getExport<
        (
          name: string,
          specs: Array<{ keys: Record<string, 1 | -1> }>
        ) => Promise<{ success: boolean; error?: string }>
      >("ensureIndexes");

      const result = await ensureIndexes("players", []);

      expect(result.success).toBe(false);
      expect(result.error).toMatch(/index/i);
      expect(collection.createIndexes).not.toHaveBeenCalled();
    });
  });

  describe("getQueryStats", () => {
    it("returns envelope with aggregates shape", () => {
      registerWithDb({ collections: {} });

      const getQueryStats = getExport<
        () => {
          success: boolean;
          data?: {
            enabled: boolean;
            samples: unknown[];
            aggregates: Record<string, unknown>;
          };
        }
      >("getQueryStats");

      const result = getQueryStats();

      expect(result.success).toBe(true);
      expect(result.data?.enabled).toBe(false);
      expect(Array.isArray(result.data?.samples)).toBe(true);
      expect(result.data?.aggregates).toMatchObject({
        count: 0,
        slowCount: 0,
      });
    });
  });

  describe("health", () => {
    it("returns error when db is not connected", async () => {
      registerWithDb({ collections: {} }, false);

      const health = getExport<
        () => Promise<{ success: boolean; error?: string }>
      >("health");

      const result = await health();

      expect(result).toEqual({
        success: false,
        error: "Database not connected",
      });
    });

    it("returns error when ping fails", async () => {
      const command = vi.fn().mockRejectedValue(new Error("ping failed"));
      registerWithDb({ collections: {}, command });

      const health = getExport<
        () => Promise<{ success: boolean; error?: string }>
      >("health");

      const result = await health();

      expect(result.success).toBe(false);
      expect(result.error).toBe("ping failed");
    });
  });
});
