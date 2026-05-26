/**
 * @file Query/update shape validation — operator denylist and size limits.
 * Not a full sandbox; consumers must still whitelist user input. See docs/API.md.
 */

import type { Document } from "mongodb";

const DENY_OPERATORS = new Set([
  "$where",
  "$accumulator",
  "$function",
  "$regexFindAll",
  "$regexFind",
  "$out",
  "$merge",
  "$expr",
  "$jsonSchema",
]);

export const MAX_DEPTH = 8;
export const MAX_KEYS = 100;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  const proto = Object.getPrototypeOf(value as object);
  return proto === null || proto === Object.prototype;
}

interface WalkState {
  visited: number;
}

function walk(node: unknown, depth: number, state: WalkState, label: string): void {
  if (depth > MAX_DEPTH) {
    throw new Error(
      `${label} depth exceeded: ${MAX_DEPTH}`,
    );
  }

  if (Array.isArray(node)) {
    for (const item of node) {
      state.visited += 1;
      if (state.visited > MAX_KEYS) {
        throw new Error(`${label} too large: max ${MAX_KEYS} nodes`);
      }
      if (item !== null && typeof item === "object") {
        walk(item, depth + 1, state, label);
      }
    }
    return;
  }

  if (!isPlainObject(node)) return;

  for (const key of Object.keys(node)) {
    state.visited += 1;
    if (state.visited > MAX_KEYS) {
      throw new Error(`${label} too large: max ${MAX_KEYS} nodes`);
    }
    if (DENY_OPERATORS.has(key)) {
      throw new Error(`Operator not allowed: ${key}`);
    }
    const value = node[key];
    if (value !== null && typeof value === "object") {
      walk(value, depth + 1, state, label);
    }
  }
}

function validateShape(
  value: unknown,
  label: string,
): asserts value is Document {
  if (!isPlainObject(value)) throw new Error(`Invalid ${label} shape`);
  walk(value, 1, { visited: 0 }, label);
}

/** Validate filter document shape and reject denied operators. */
export function validateFilter(filter: unknown): asserts filter is Document {
  validateShape(filter, "filter");
}

/** Validate update document shape and deny dangerous operators. */
export function validateUpdate(update: unknown): asserts update is Document {
  if (!isPlainObject(update)) throw new Error("Invalid update shape");
  if (Object.keys(update as Record<string, unknown>).length === 0) {
    throw new Error("Empty update payload");
  }
  walk(update, 1, { visited: 0 }, "update");
}

export function validateDocument(doc: unknown): asserts doc is Document {
  validateShape(doc, "document");
}
