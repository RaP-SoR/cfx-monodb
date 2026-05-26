/**
 * @file Admin/diagnostic exports — health, config, ensureIndexes, getQueryStats, getVersion.
 * Contract: docs/API.md.
 */

import dbConfig from "../../config";
import type { Response, ErrorResponse } from "../../responses";
import type { DbProvider } from "../../types/dbProvider";
import { withDb } from "../withDb";
import { ensureIndexesForCollection } from "../../services/indexService";
import { getLogLevel } from "../../utils";
import {
  getPerfBufferSize,
  getPerfSlowMs,
  getQueryStatsData,
  isPerfEnabled,
  isPerfLogAll,
} from "../../perf";

export function registerAdminHandlers(
  provider: DbProvider,
  register: (name: string, fn: Function) => void
): void {
  register(
    "ensureIndexes",
    async (
      collectionName: string,
      indexes: Array<{
        keys: Record<string, 1 | -1>;
        options?: Record<string, unknown>;
      }>
    ): Promise<Response<number> | ErrorResponse> => {
      const result = await withDb(provider, async (db) =>
        ensureIndexesForCollection(db, collectionName, indexes)
      , { exportName: "ensureIndexes", collection: collectionName });
      return result;
    }
  );

  register("getVersion", async (): Promise<string> => {
    const version = GetResourceMetadata(GetCurrentResourceName(), "version", 0);
    return version || "0.0.0";
  });

  register(
    "health",
    async (): Promise<Response<{ ok: boolean; rttMs: number }>> => {
      const result = await withDb(provider, async (db) => {
        const start = Date.now();
        await db.command({ ping: 1 });
        return { ok: true, rttMs: Date.now() - start };
      }, { exportName: "health" });
      return result;
    }
  );

  register(
    "config",
    (): Response<Record<string, unknown>> => {
      try {
        const cfg = {
          env: GetConvar("mongodb_env", "dev"),
          timeout: dbConfig.options.serverSelectionTimeoutMS,
          maxPoolSize: dbConfig.options.maxPoolSize,
          minPoolSize: dbConfig.options.minPoolSize,
          logLevel: getLogLevel(),
          perfEnabled: isPerfEnabled(),
          perfSlowMs: getPerfSlowMs(),
          perfLogAll: isPerfLogAll(),
          perfBuffer: getPerfBufferSize(),
        };
        return { success: true, data: cfg };
      } catch (error) {
        return {
          success: false,
          error:
            error instanceof Error
              ? error.message
              : "An unknown error occurred",
        };
      }
    }
  );

  register("getQueryStats", (): Response<ReturnType<typeof getQueryStatsData>> => {
    return { success: true, data: getQueryStatsData() };
  });
}
