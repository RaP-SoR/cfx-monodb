import type { Document } from "mongodb";

const DENY_OPERATORS = new Set([
  "$where",
  "$accumulator",
  "$function",
  "$regexFindAll",
  "$regexFind",
  "$out",
  "$merge",
]);

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

export function validateFilter(filter: unknown): asserts filter is Document {
  if (!isPlainObject(filter)) throw new Error("Invalid filter shape");
  for (const key of Object.keys(filter as Record<string, unknown>)) {
    if (DENY_OPERATORS.has(key)) throw new Error(`Operator not allowed: ${key}`);
  }
}

export function validateUpdate(update: unknown): asserts update is Document {
  if (!isPlainObject(update)) throw new Error("Invalid update shape");
  // Basic guard: ensure at least one modifier or set of fields
  if (Object.keys(update as Record<string, unknown>).length === 0) {
    throw new Error("Empty update payload");
  }
  for (const key of Object.keys(update as Record<string, unknown>)) {
    if (DENY_OPERATORS.has(key)) throw new Error(`Operator not allowed: ${key}`);
  }
}

