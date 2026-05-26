/**
 * Documentation audit helper — lists server_exports and doc files to verify.
 * Usage: yarn doc-audit
 * Pair with: yarn scout (gate) and skill .cursor/skills/examples-docs/
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const EXPORTS = (() => {
  const manifest = readFileSync(path.join(root, "fxmanifest.lua"), "utf8");
  const block = manifest.match(/server_exports\s*\{([^}]+)\}/s);
  if (!block) return [];
  return [...block[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
})();

const DOC_FILES = [
  "docs/API.md",
  "docs/DOCUMENTATION-AUDIT-2026.md",
  "docs/examples/README.md",
  "docs/examples/lua/use-cases.md",
  "docs/examples/lua/snippets.md",
  "docs/examples/lua/queries.md",
  "docs/examples/lua/patterns.md",
  "docs/examples/typescript/use-cases.md",
  "docs/examples/typescript/snippets.md",
  "docs/examples/typescript/queries.md",
  "docs/examples/typescript/patterns.md",
];

function main() {
  console.log("=== cfx-mongodb documentation audit ===\n");
  console.log(`server_exports (${EXPORTS.length}):`);
  for (const e of EXPORTS) console.log(`  - ${e}`);

  console.log("\nVerify these files (Lua + TypeScript in parallel):");
  for (const f of DOC_FILES) console.log(`  - ${f}`);

  console.log("\nRoutine:");
  console.log("  1. Skill: .cursor/skills/examples-docs/SKILL.md");
  console.log("  2. Template: .cursor/skills/examples-docs/TEMPLATE.md");
  console.log("  3. yarn scout (gate)");
  console.log("\nExport change → update coverage tables in both use-cases.md");
}

main();
