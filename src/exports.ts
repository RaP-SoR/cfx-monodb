import { Filter, OptionalUnlessRequiredId, Document, UpdateFilter } from "mongodb";
import dbConfig from "./config";
import { validateFilter, validateUpdate } from "./validateQuery";
import { exportFn, log, redactMongoUri, serializeDocumentId, toObjectIdIfValid } from "./utils";
import type { FindAllOptions } from "./types/options";
import {
  Response,
  ErrorResponse,
  InsertResponse,
  UpdateResponse,
  DeleteResponse,
} from "./responses";
import MongoDBConnector from "./connector";
import { withDb } from "./api/withDb";
import { normalizeIdFilter } from "./api/normalizeIdFilter";
import { ensureIndexesForCollection } from "./services/indexService";

export function registerExports(mongoDBInstance: MongoDBConnector): void {
  exportFn(
    "insert",
    async <T extends Document>(
      collectionName: string,
      document: OptionalUnlessRequiredId<T>
    ): Promise<InsertResponse | ErrorResponse> => {
      const result = await withDb(mongoDBInstance, async (db) => {
        const inserted = await db
          .collection<T>(collectionName)
          .insertOne(document);
        return String(inserted.insertedId);
      });
      if (!result.success) return result;
      return { success: true, insertedId: result.data };
    }
  );

  exportFn(
    "ensureIndexes",
    async (
      collectionName: string,
      indexes: Array<{ keys: Record<string, 1 | -1>; options?: Record<string, unknown> }>
    ): Promise<Response<number> | ErrorResponse> => {
      const result = await withDb(mongoDBInstance, async (db) =>
        ensureIndexesForCollection(db, collectionName, indexes)
      );
      return result;
    }
  );

  exportFn(
    "findAll",
    async <T extends Document>(
      collectionName: string,
      query: Filter<T> = {},
      options: FindAllOptions = {}
    ): Promise<Response<T[]>> => {
      const result = await withDb(mongoDBInstance, async (db) => {
        validateFilter(query);
        const { projection, sort } = options;
        const limit = Math.max(1, Math.min(1000, options.limit ?? 100));
        const skip = Math.max(0, Math.min(1_000_000, options.skip ?? 0));

        const ac = new AbortController();
        const timer = setTimeout(
          () => ac.abort(),
          dbConfig.options.serverSelectionTimeoutMS
        );

        const docs = await db
          .collection<T>(collectionName)
          .find(query, {
            projection,
            sort,
            signal: ac.signal as unknown as AbortSignal,
          })
          .limit(limit)
          .skip(skip)
          .toArray();

        clearTimeout(timer);

        for (const doc of docs as Array<Record<string, unknown>>) {
          serializeDocumentId(doc);
        }

        return docs as unknown as T[];
      });
      return result;
    }
  );

  exportFn(
    "find",
    async <T extends Document>(
      collectionName: string,
      query: Filter<T> = {}
    ): Promise<Response<T | null>> => {
      const result = await withDb(mongoDBInstance, async (db) => {
        validateFilter(query);
        const filter = normalizeIdFilter(query);
        const doc = await db.collection<T>(collectionName).findOne(filter);
        if (!doc) {
          return null;
        }
        serializeDocumentId(doc as Record<string, unknown>);
        return doc as T;
      });
      if (!result.success) return result;
      return { success: true, data: result.data };
    }
  );

  exportFn(
    "findById",
    async <T extends Document>(
      collectionName: string,
      id: string,
      projection?: Document
    ): Promise<Response<T | null>> => {
      if (typeof id !== "string" || id.length === 0) {
        return { success: false, error: "Invalid id" };
      }

      const result = await withDb(mongoDBInstance, async (db) => {
        const filter = { _id: toObjectIdIfValid(id) } as Filter<T>;
        const doc = await db.collection<T>(collectionName).findOne(
          filter,
          projection ? { projection } : undefined
        );
        if (!doc) {
          return null;
        }
        serializeDocumentId(doc as Record<string, unknown>);
        return doc as T;
      });
      if (!result.success) return result;
      return { success: true, data: result.data };
    }
  );

  exportFn(
    "update",
    async <T extends Document>(
      collectionName: string,
      filter: Filter<T>,
      update: UpdateFilter<T> | Partial<T>
    ): Promise<UpdateResponse | ErrorResponse> => {
      const result = await withDb(mongoDBInstance, async (db) => {
        const normalized = normalizeIdFilter(filter);
        validateFilter(normalized);
        validateUpdate(update as Record<string, unknown>);
        log("debug", `Updating with filter: ${JSON.stringify(normalized)}`);

        const updateDoc: UpdateFilter<T> =
          "$set" in update ? update : { $set: update as Partial<T> };

        const updated = await db
          .collection<T>(collectionName)
          .updateOne(normalized, updateDoc);

        log(
          "debug",
          `Update result: matched=${updated.matchedCount}, modified=${updated.modifiedCount}`
        );

        return {
          matchedCount: updated.matchedCount,
          modifiedCount: updated.modifiedCount,
        };
      });
      if (!result.success) return result;
      return {
        success: true,
        matchedCount: result.data.matchedCount,
        modifiedCount: result.data.modifiedCount,
      };
    }
  );

  exportFn(
    "delete",
    async <T extends Document>(
      collectionName: string,
      filter: Filter<T>
    ): Promise<DeleteResponse | ErrorResponse> => {
      const result = await withDb(mongoDBInstance, async (db) => {
        const normalized = normalizeIdFilter(filter);
        validateFilter(normalized);
        const deleted = await db
          .collection<T>(collectionName)
          .deleteOne(normalized);
        return deleted.deletedCount;
      });
      if (!result.success) return result;
      if (result.data === 0) {
        return { success: false, error: "Document not found" };
      }
      if (result.data > 1) {
        log("warn", `More than one document deleted (${result.data})`);
      }
      log(
        "info",
        `Deleted document with filter: ${JSON.stringify(filter as Record<string, unknown>)}`
      );
      return { success: true, deletedCount: result.data };
    }
  );

  exportFn("getVersion", async (): Promise<string> => {
    const version = GetResourceMetadata(GetCurrentResourceName(), "version", 0);
    return version || "0.0.0";
  });

  exportFn(
    "count",
    async <T extends Document>(
      collectionName: string,
      filter: Filter<T> = {}
    ): Promise<Response<number>> => {
      const result = await withDb(mongoDBInstance, async (db) => {
        validateFilter(filter);
        return db.collection<T>(collectionName).countDocuments(filter);
      });
      return result;
    }
  );

  exportFn(
    "health",
    async (): Promise<Response<{ ok: boolean; rttMs: number }>> => {
      const result = await withDb(mongoDBInstance, async (db) => {
        const start = Date.now();
        await db.command({ ping: 1 });
        return { ok: true, rttMs: Date.now() - start };
      });
      return result;
    }
  );

  exportFn(
    "config",
    (): Response<Record<string, unknown>> => {
      try {
        const cfg = {
          env: GetConvar("mongodb_env", "dev"),
          timeout: dbConfig.options.serverSelectionTimeoutMS,
          maxPoolSize: dbConfig.options.maxPoolSize,
          minPoolSize: dbConfig.options.minPoolSize,
          logLevel: GetConvar("mongodb_log_level", "info"),
        };
        return { success: true, data: cfg };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "An unknown error occurred",
        };
      }
    }
  );

  exportFn("isConnected", (): boolean => {
    return mongoDBInstance?.isDbConnected() || false;
  });

  exportFn("getDb", () => {
    return mongoDBInstance.getDb();
  });

  exportFn(
    "connect",
    async (
      connectionURL: string,
      options?: import("./types/options").MongoOptions
    ) => {
      try {
        const mongodb = MongoDBConnector.getInstance();
        await mongodb.connect(connectionURL, options);
        log("info", `Connected with URL: ${redactMongoUri(connectionURL)}`);
        TriggerEvent("cfx-mongodb:connected", true);
      } catch (error) {
        log(
          "error",
          `Connection error: ${error instanceof Error ? error.message : String(error)}`
        );
        TriggerEvent(
          "cfx-mongodb:connected",
          false,
          error instanceof Error ? error.message : String(error)
        );
      }
    }
  );

  exportFn("disconnect", async () => {
    try {
      const mongodb = MongoDBConnector.getInstance();
      await mongodb.disconnect();
      log("info", "Disconnected");
      TriggerEvent("cfx-mongodb:disconnected", true);
    } catch (error) {
      log(
        "error",
        `Disconnection error: ${error instanceof Error ? error.message : String(error)}`
      );
      TriggerEvent(
        "cfx-mongodb:disconnected",
        false,
        error instanceof Error ? error.message : String(error)
      );
    }
  });

  log("info", "Exports registered with TypeScript generics support");
}
