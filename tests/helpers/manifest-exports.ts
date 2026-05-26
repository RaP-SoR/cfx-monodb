import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Parses `server_exports { ... }` from fxmanifest.lua.
 * Returns export names in manifest order.
 */
export function parseServerExportsFromManifest(
  manifestPath?: string
): string[] {
  const path = manifestPath ?? resolve(process.cwd(), "fxmanifest.lua");
  const content = readFileSync(path, "utf8");

  const blockMatch = content.match(/server_exports\s*\{([^}]*)\}/s);
  if (!blockMatch) {
    throw new Error("server_exports block not found in fxmanifest.lua");
  }

  const names: string[] = [];
  const lineRe = /^\s*['"]([^'"]+)['"]\s*,?\s*$/gm;
  let match: RegExpExecArray | null;
  while ((match = lineRe.exec(blockMatch[1])) !== null) {
    names.push(match[1]);
  }

  if (names.length === 0) {
    throw new Error("No server_exports entries parsed from fxmanifest.lua");
  }

  return names;
}
