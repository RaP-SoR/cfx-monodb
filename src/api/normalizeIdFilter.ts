/**
 * @file Converts string `_id` in filters to ObjectId when valid.
 * Used by find, update, and delete handlers.
 */

import type { Document } from "mongodb";
import { toObjectIdIfValid } from "../utils";

/**
 * Normalize `_id` in a filter document for MongoDB queries.
 *
 * @param filter - MongoDB filter (mutates `_id` in place when string ObjectId)
 * @returns Same filter reference with normalized `_id`
 */
export function normalizeIdFilter<T extends Document>(filter: T): T {
  if (!filter || typeof filter !== "object") {
    return filter;
  }

  const rec = filter as Record<string, unknown>;
  if (rec._id !== undefined) {
    rec._id = toObjectIdIfValid(rec._id);
  }

  return filter;
}
