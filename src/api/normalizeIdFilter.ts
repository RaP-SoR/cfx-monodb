import type { Document } from "mongodb";
import { toObjectIdIfValid } from "../utils";

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
