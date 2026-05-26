import { Filter, OptionalUnlessRequiredId, Document, UpdateFilter } from "mongodb";
import type { IndexDescription } from "mongodb";
import dbConfig from "./config";
import { validateFilter, validateUpdate } from "./validateQuery";
import { exportFn, log, toObjectIdIfValid } from "./utils";
import type { FindAllOptions } from "./types/options";
import {
  Response,
  ErrorResponse,
  InsertResponse,
  UpdateResponse,
  DeleteResponse,
} from "./responses";
import MongoDBConnector from "./connector";

export function registerExports(mongoDBInstance: MongoDBConnector): void {
  // FiveM provides global.exports at runtime; cast for TS compatibility
  const fxExports = (globalThis as unknown as { exports: (...args: unknown[]) => void }).exports;
  fxExports(
    "insert",
    async <T extends Document>(
      collectionName: string,
      document: OptionalUnlessRequiredId<T>
    ): Promise<InsertResponse | ErrorResponse> => {
      try {
        const db = mongoDBInstance.getDb();
        if (!db) throw new Error("Database not connected");

        const result = await db
          .collection<T>(collectionName)
          .insertOne(document);
        return { success: true, insertedId: result.insertedId };
      } catch (error) {
        console.error(`[CFX-MongoDB Export] insertOne error:`, error);
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

  // ensureIndexes export: create multiple indexes on a collection
  exportFn(
    "ensureIndexes",
    async (
      collectionName: string,
      indexes: Array<{ keys: Record<string, 1 | -1>; options?: Record<string, unknown> }>
    ): Promise<Response<number> | ErrorResponse> => {
      try {
        const db = mongoDBInstance.getDb();
        if (!db) throw new Error("Database not connected");
        if (!Array.isArray(indexes) || indexes.length === 0)
          throw new Error("No index specs provided");

        const models = indexes.slice(0, 20).map((it) => ({
          key: it.keys,
          ...(it.options ? { ...it.options } : {}),
        }));

        const created = await db
          .collection(collectionName)
          .createIndexes(models as IndexDescription[]);
        log("info", `Indexes ensured for ${collectionName}: ${models.length}`);
        return { success: true, data: models.length };
      } catch (error) {
        log("error", `[ensureIndexes] ${String((error as Error).message)}`);
        return { success: false, error: (error as Error).message };
      }
    }
  );

  exportFn(
    "findAll",
    async <T extends Document>(
      collectionName: string,
      query: Filter<T> = {},
      options: FindAllOptions = {}
    ): Promise<Response<T[]>> => {
      try {
        const db = mongoDBInstance.getDb();
        if (!db) throw new Error("Database not connected");

        validateFilter(query);
        const { projection, sort } = options;
        const limit = Math.max(1, Math.min(1000, options.limit ?? 100));
        const skip = Math.max(0, Math.min(1_000_000, options.skip ?? 0));

        const ac = new AbortController();
        const timer = setTimeout(() => ac.abort(), ((dbConfig as unknown) as { timeout?: number }).timeout ?? 5000);

        const result = await db
          .collection<T>(collectionName)
          .find(query, { projection, sort, signal: ac.signal as unknown as AbortSignal })
          .limit(limit)
          .skip(skip)
          .toArray();

        clearTimeout(timer);

        for (const doc of result as Array<Record<string, unknown>>) {
          const id = doc._id as unknown as { toString?: () => string };
          if (id && typeof id === "object" && typeof id.toString === "function") {
            doc._id = id.toString();
          }
        }

        return { success: true, data: result as unknown as T[] };
      } catch (error) {
        console.error(`[CFX-MongoDB Export] find error:`, error);
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

  exportFn(
    "find",
    async <T extends Document>(
      collectionName: string,
      query: Filter<T> = {}
    ): Promise<Response<T | null>> => {
      try {
        const db = mongoDBInstance.getDb();
        if (!db) throw new Error("Database not connected");

        validateFilter(query);
        const result = await db.collection<T>(collectionName).findOne(query);
        if (!result) {
          return { success: false, error: "Document not found" };
        }

        if (result) {
          const r = result as Record<string, unknown>;
          const id = r._id as unknown as { toString?: () => string };
          if (id && typeof id === "object" && typeof id.toString === "function") {
            r._id = id.toString();
          }
        }

        return { success: true, data: result as T | null };
      } catch (error) {
        console.error(`[CFX-MongoDB Export] findOne error:`, error);
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
  exportFn(
    "update",
    async <T extends Document>(
      collectionName: string,
      filter: Filter<T>,
      update: UpdateFilter<T> | Partial<T>
    ): Promise<UpdateResponse | ErrorResponse> => {
      try {
        const db = mongoDBInstance.getDb();
        if (!db) throw new Error("Database not connected");

        // Konvertiere String-IDs in ObjectIDs
        if (filter && typeof filter === "object") {
          // ID-Konvertierungslogik für _id
          const rec = filter as Record<string, unknown>;
          if (rec._id) rec._id = toObjectIdIfValid(rec._id);
        }

        validateFilter(filter);
        validateUpdate(update as Record<string, unknown>);
        log("debug", `Updating with filter: ${JSON.stringify(filter)}`);

        const updateDoc: UpdateFilter<T> =
          "$set" in update ? update : { $set: update as Partial<T> };

        const result = await db
          .collection<T>(collectionName)
          .updateOne(filter, updateDoc);

        console.log(
          `[CFX-MongoDB] Update result: matched=${result.matchedCount}, modified=${result.modifiedCount}`
        );

        return {
          success: true,
          matchedCount: result.matchedCount,
          modifiedCount: result.modifiedCount,
        };
      } catch (error) {
        console.error(`[CFX-MongoDB Export] updateOne error:`, error);
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
  exportFn(
    "delete",
    async <T extends Document>(
      collectionName: string,
      filter: Filter<T>
    ): Promise<DeleteResponse | ErrorResponse> => {
      try {
        const db = mongoDBInstance.getDb();
        if (!db) throw new Error("Database not connected");

        validateFilter(filter);
        const result = await db
          .collection<T>(collectionName)
          .deleteOne(filter);
        if (result.deletedCount === 0) {
          return { success: false, error: "Document not found" };
        }
        if (result.deletedCount > 1) {
          log("warn", `More than one document deleted (${result.deletedCount})`);
        }
        log("info", `Deleted document with filter: ${JSON.stringify(filter as Record<string, unknown>)}`);
        return { success: true, deletedCount: result.deletedCount };
      } catch (error) {
        console.error(`[CFX-MongoDB Export] deleteOne error:`, error);
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
  exportFn(
    "count",
    async <T extends Document>(
      collectionName: string,
      filter: Filter<T> = {}
    ): Promise<Response<number>> => {
      try {
        const db = mongoDBInstance.getDb();
        if (!db) throw new Error("Database not connected");

        validateFilter(filter);
        const count = await db
          .collection<T>(collectionName)
          .countDocuments(filter);
        return { success: true, data: count };
      } catch (error) {
        console.error(`[CFX-MongoDB Export] countDocuments error:`, error);
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

  // Health check: ping the server and return basic timings
  exportFn(
    "health",
    async (): Promise<Response<{ ok: boolean; rttMs: number }>> => {
      try {
        const db = mongoDBInstance.getDb();
        if (!db) throw new Error("Database not connected");
        const start = Date.now();
        // ping via admin command
        await db.command({ ping: 1 });
        const rttMs = Date.now() - start;
        return { success: true, data: { ok: true, rttMs } };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    }
  );

  // Expose current effective config (safe, no secrets)
  exportFn(
    "config",
    (): Response<Record<string, unknown>> => {
      try {
        const cfgBase = dbConfig as unknown as {
          timeout?: number;
          options?: { serverSelectionTimeoutMS?: number; maxPoolSize?: number; minPoolSize?: number };
        };
        const cfg = {
          env: GetConvar("mongodb_env", "dev"),
          timeout: cfgBase.timeout ?? cfgBase.options?.serverSelectionTimeoutMS,
          maxPoolSize: cfgBase.options?.maxPoolSize,
          minPoolSize: cfgBase.options?.minPoolSize,
          logLevel: GetConvar("mongodb_log_level", "info"),
        };
        return { success: true, data: cfg };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    }
  );
  exports("isConnected", (): boolean => {
    return mongoDBInstance?.isDbConnected() || false;
  });

  exports("connect", async (connectionURL: string, options?: import("./types/options").MongoOptions) => {
    try {
      const mongodb = MongoDBConnector.getInstance();
      await mongodb.connect(connectionURL, options);

      console.log(`CFX-MongoDB verbunden mit URL: ${connectionURL}`);
      emitNet("cfx-mongodb:connected", source, true);
    } catch (error) {
      console.error("CFX-MongoDB Verbindungsfehler:", error);
      emitNet("cfx-mongodb:connected", source, false, (error as Error).message);
    }
  });

  exports("disconnect", async () => {
    try {
      const mongodb = MongoDBConnector.getInstance();
      await mongodb.disconnect();
      console.log(`CFX-MongoDB disconnected`);
      emitNet("cfx-mongodb:disconnected", source, true);
    } catch (error) {
      console.error("CFX-MongoDB Disconnection error:", error);
      emitNet(
        "cfx-mongodb:disconnected",
        source,
        false,
        (error as Error).message
      );
    }
  });
  console.log(
    "[CFX-MongoDB] Exports registered with TypeScript generics support"
  );
}
