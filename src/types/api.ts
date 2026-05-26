/**
 * Consumer-facing result types for the cfx-mongodb public API.
 * These mirror the response envelope pattern enforced in exports.ts and
 * documented in docs/API.md. Import these types in consuming resources
 * for typed access to cfx-mongodb return values.
 */

/** Generic result — success carries typed data, failure carries an error string. */
export type CfxMongoResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

/** Result of an `insert` call — success carries the inserted document id as a string. */
export type CfxMongoInsertResult =
  | { success: true; insertedId: string }
  | { success: false; error: string };

/**
 * Result of an `update` call.
 * CTFFramework success check: `(modifiedCount ?? 0) > 0`.
 */
export type CfxMongoUpdateResult =
  | { success: true; matchedCount: number; modifiedCount: number }
  | { success: false; error: string };

/**
 * Result of a `delete` call.
 * CTFFramework success check: `deletedCount === 1`.
 */
export type CfxMongoDeleteResult =
  | { success: true; deletedCount: number }
  | { success: false; error: string };

/** Single perf sample from {@link getQueryStats}. */
export type CfxMongoPerfSample = {
  export: string;
  collection: string;
  ms: number;
  ok: boolean;
  at: string;
};

/** Result of {@link getQueryStats} — ring buffer snapshot (perf ConVar-gated recording). */
export type CfxMongoQueryStatsResult = CfxMongoResult<{
  enabled: boolean;
  samples: CfxMongoPerfSample[];
  aggregates: {
    count: number;
    p50Ms: number;
    p95Ms: number;
    slowCount: number;
  };
}>;

/**
 * Canonical list of all public exports registered by cfx-mongodb.
 *
 * Sources: src/exports.ts (registerExports) + fxmanifest.lua server_exports.
 *
 * Advanced/internal exports (connect, disconnect, getDb) are included here
 * for completeness; see docs/API.md for security notes on direct usage.
 */
export const CFX_MONGODB_EXPORTS = [
  "insert",
  "ensureIndexes",
  "findAll",
  "find",
  "findById",
  "update",
  "delete",
  "getVersion",
  "count",
  "health",
  "config",
  "isConnected",
  "getDb",
  "getQueryStats",
  "connect",
  "disconnect",
] as const;

/** Union type of all valid cfx-mongodb export names. */
export type CfxMongoExportName = (typeof CFX_MONGODB_EXPORTS)[number];
