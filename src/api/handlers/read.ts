/**
 * @file CRUD read exports — find, findAll, findById, count. Contract: docs/API.md.
 */

import { Filter, Document } from "mongodb";
import dbConfig from "../../config";
import { validateFilter } from "../../validateQuery";
import {
  serializeDocumentId,
  toObjectIdIfValid,
  extractFilterKeys,
} from "../../utils";
import type { FindAllOptions } from "../../types/options";
import type { Response } from "../../responses";
import type { DbProvider } from "../../types/dbProvider";
import { withDb } from "../withDb";
import { normalizeIdFilter } from "../normalizeIdFilter";

export function registerReadHandlers(
  provider: DbProvider,
  register: (name: string, fn: Function) => void
): void {
  register(
    "findAll",
    async <T extends Document>(
      collectionName: string,
      query: Filter<T> = {},
      options: FindAllOptions = {}
    ): Promise<Response<T[]>> => {
      const result = await withDb(
        provider,
        async (db) => {
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
        },
        {
          exportName: "findAll",
          collection: collectionName,
          filterKeys: extractFilterKeys(query),
        }
      );
      return result;
    }
  );

  register(
    "find",
    async <T extends Document>(
      collectionName: string,
      query: Filter<T> = {}
    ): Promise<Response<T | null>> => {
      const result = await withDb(
        provider,
        async (db) => {
          validateFilter(query);
          const filter = normalizeIdFilter(query);
          const doc = await db.collection<T>(collectionName).findOne(filter);
          if (!doc) {
            return null;
          }
          serializeDocumentId(doc as Record<string, unknown>);
          return doc as T;
        },
        {
          exportName: "find",
          collection: collectionName,
          filterKeys: extractFilterKeys(query),
        }
      );
      if (!result.success) return result;
      return { success: true, data: result.data };
    }
  );

  register(
    "findById",
    async <T extends Document>(
      collectionName: string,
      id: string,
      projection?: Document
    ): Promise<Response<T | null>> => {
      if (typeof id !== "string" || id.length === 0) {
        return { success: false, error: "Invalid id" };
      }

      const result = await withDb(
        provider,
        async (db) => {
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
        },
        { exportName: "findById", collection: collectionName }
      );
      if (!result.success) return result;
      return { success: true, data: result.data };
    }
  );

  register(
    "count",
    async <T extends Document>(
      collectionName: string,
      filter: Filter<T> = {}
    ): Promise<Response<number>> => {
      const result = await withDb(
        provider,
        async (db) => {
          validateFilter(filter);
          return db.collection<T>(collectionName).countDocuments(filter);
        },
        {
          exportName: "count",
          collection: collectionName,
          filterKeys: extractFilterKeys(filter),
        }
      );
      return result;
    }
  );
}
