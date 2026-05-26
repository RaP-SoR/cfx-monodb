import { ObjectId } from "mongodb";

export type LogLevel = "error" | "warn" | "info" | "debug";

export function getLogLevel(): LogLevel {
  const lvl = (GetConvar("mongodb_log_level", "info") || "info").toLowerCase();
  if (lvl === "error" || lvl === "warn" || lvl === "info" || lvl === "debug") return lvl;
  return "info";
}

export function log(level: LogLevel, msg: string, ...args: unknown[]): void {
  const current = getLogLevel();
  const order: Record<LogLevel, number> = { error: 0, warn: 1, info: 2, debug: 3 };
  if (order[level] <= order[current]) {
    const line = `[CFX-MongoDB] ${msg}`;
    // Cast to readonly to avoid any spread warnings while keeping runtime behavior
    const out = args as ReadonlyArray<unknown>;
    if (level === "error") console.error(line, ...out);
    else if (level === "warn") console.warn(line, ...out);
    else console.log(line, ...out);
  }
}

export function toObjectIdIfValid(value: unknown): ObjectId | string | unknown {
  if (typeof value === "string" && ObjectId.isValid(value)) {
    return new ObjectId(value);
  }
  return value;
}

export function serializeDocumentId(doc: Record<string, unknown>): void {
  const id = doc._id as unknown as { toString?: () => string };
  if (id && typeof id === "object" && typeof id.toString === "function") {
    doc._id = id.toString();
  }
}

export function exportFn(name: string, fn: Function): void {
  const fx = (globalThis as unknown as { exports: (...args: unknown[]) => void }).exports;
  fx(name, fn);
}

export function parseInitIndexes(): Record<string, Array<{ keys: Record<string, 1 | -1>; options?: Record<string, unknown> }>> | null {
  const raw = GetConvar("mongodb_init_indexes", "");
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return null;
    const result: Record<string, Array<{ keys: Record<string, 1 | -1>; options?: Record<string, unknown> }>> = {};
    const collections = Object.keys(parsed);
    if (collections.length > 50) {
      log("warn", `Too many collections in mongodb_init_indexes (${collections.length}), truncating to 50`);
    }
    for (const name of collections.slice(0, 50)) {
      const rec = parsed as Record<string, unknown>;
      const arr = rec[name] as unknown;
      if (!Array.isArray(arr)) continue;
      const items = (arr as Array<unknown>).slice(0, 20).map((it) => {
        const obj = it as { keys?: unknown; options?: unknown };
        const keys = obj?.keys as unknown;
        const options = obj?.options as unknown;
        if (!keys || typeof keys !== "object" || Array.isArray(keys)) return null;
        return { keys: keys as Record<string, 1 | -1>, options: typeof options === "object" && options !== null ? (options as Record<string, unknown>) : undefined };
      }).filter(Boolean) as Array<{ keys: Record<string, 1 | -1>; options?: Record<string, unknown> }>;
      if (items.length) result[name] = items;
    }
    return Object.keys(result).length ? result : null;
  } catch (e) {
    log("warn", `Failed to parse mongodb_init_indexes: ${(e as Error).message}`);
    return null;
  }
}
