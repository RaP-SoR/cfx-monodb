/**
 * @file CRUD write exports — insert, update, delete. Contract: docs/API.md.
 */

import {
  Filter,
  OptionalUnlessRequiredId,
  Document,
  UpdateFilter,
} from "mongodb";
import { validateFilter, validateUpdate } from "../../validateQuery";
import { log, extractFilterKeys } from "../../utils";
import type {
  InsertResponse,
  UpdateResponse,
  DeleteResponse,
  ErrorResponse,
} from "../../responses";
import type { DbProvider } from "../../types/dbProvider";
import { withDb } from "../withDb";
import { normalizeIdFilter } from "../normalizeIdFilter";

export function registerWriteHandlers(
  provider: DbProvider,
  register: (name: string, fn: Function) => void
): void {
  register(
    "insert",
    async <T extends Document>(
      collectionName: string,
      document: OptionalUnlessRequiredId<T>
    ): Promise<InsertResponse | ErrorResponse> => {
      const result = await withDb(provider, async (db) => {
        const inserted = await db
          .collection<T>(collectionName)
          .insertOne(document);
        return String(inserted.insertedId);
      }, { exportName: "insert", collection: collectionName });
      if (!result.success) return result;
      return { success: true, insertedId: result.data };
    }
  );

  register(
    "update",
    async <T extends Document>(
      collectionName: string,
      filter: Filter<T>,
      update: UpdateFilter<T> | Partial<T>
    ): Promise<UpdateResponse | ErrorResponse> => {
      const result = await withDb(provider, async (db) => {
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
      }, {
        exportName: "update",
        collection: collectionName,
        filterKeys: extractFilterKeys(filter),
      });
      if (!result.success) return result;
      return {
        success: true,
        matchedCount: result.data.matchedCount,
        modifiedCount: result.data.modifiedCount,
      };
    }
  );

  register(
    "delete",
    async <T extends Document>(
      collectionName: string,
      filter: Filter<T>
    ): Promise<DeleteResponse | ErrorResponse> => {
      const result = await withDb(provider, async (db) => {
        const normalized = normalizeIdFilter(filter);
        validateFilter(normalized);
        const deleted = await db
          .collection<T>(collectionName)
          .deleteOne(normalized);
        return deleted.deletedCount;
      }, {
        exportName: "delete",
        collection: collectionName,
        filterKeys: extractFilterKeys(filter),
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
}
