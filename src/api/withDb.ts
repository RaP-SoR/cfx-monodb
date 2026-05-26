/**
 * @file Export response envelope pipeline. Resolves Db, runs op, catches errors.
 * Never throws to callers — see docs/API.md for consumer contract.
 */

import type { Db } from "mongodb";
import type { DbProvider } from "../types/dbProvider";
import type { Response } from "../responses";
import { formatError, log } from "../utils";
import { isPerfEnabled, recordPerf, type PerfContext } from "../perf";

export type WithDbContext = PerfContext;

/**
 * Run a MongoDB operation with standard success/error envelopes.
 *
 * @param provider - DbProvider (typically MongoDBConnector singleton)
 * @param op - Callback receiving connected Db
 * @param ctx - Optional perf context (export name, collection, filter keys)
 * @returns `{ success: true, data }` or `{ success: false, error }` — never throws
 */
export async function withDb<T>(
  provider: DbProvider,
  op: (db: Db) => Promise<T>,
  ctx?: WithDbContext
): Promise<Response<T>> {
  const db = provider.getDb();
  if (!db) {
    return { success: false, error: "Database not connected" };
  }

  const perf = isPerfEnabled();
  const t0 = perf ? Date.now() : 0;

  try {
    const data = await op(db);
    if (perf && ctx) {
      recordPerf(ctx, Date.now() - t0, true);
    }
    return { success: true, data };
  } catch (err) {
    if (perf && ctx) {
      recordPerf(ctx, Date.now() - t0, false);
    }
    log("error", `withDb error: ${formatError(err)}`);
    return { success: false, error: formatError(err) };
  }
}
