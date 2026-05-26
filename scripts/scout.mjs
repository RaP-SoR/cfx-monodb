/**
 * Post-change scout — diff reminders + yarn gate (Track E).
 * Usage: yarn scout
 */
import { execSync, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function gitLines(args) {
  try {
    return execSync(`git ${args.join(" ")}`, {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    })
      .trim()
      .split("\n")
      .filter(Boolean);
  } catch {
    return [];
  }
}

function collectChanged() {
  const sets = [
    gitLines(["diff", "--name-only", "HEAD"]),
    gitLines(["diff", "--name-only", "--cached"]),
    gitLines(["ls-files", "--others", "--exclude-standard"]),
  ];
  return [...new Set(sets.flat())];
}

function main() {
  console.log("=== cfx-mongodb post-change scout ===\n");

  const changed = collectChanged();

  if (changed.length === 0) {
    console.log("No local changes detected (working tree clean vs HEAD).\n");
  } else {
    console.log("Changed files:");
    for (const f of changed) console.log(`  - ${f}`);
    console.log("\nReminders:");

    const text = changed.join("\n");
    const remind = (msg) => console.log(`  → ${msg}`);

    if (/src\/api\/handlers|registerExports|responses\.ts|src\/types\/api\.ts/.test(text)) {
      remind("Export code touched — API.md + lua/ + typescript/ examples (skill: examples-docs)");
      remind("Run: yarn doc-audit — then update use-cases coverage tables both languages");
    }
    if (/fxmanifest\.lua/.test(text)) {
      remind("fxmanifest changed — keep node_version '22'; sync server_exports");
    }
    if (/src\/config\.ts|src\/perf\.ts|mongodb_/.test(text)) {
      remind("Config/perf touched — docs/CONFIGURATION.md, config() export docs");
    }
    if (/\.github\/workflows|scripts\/pack-|scripts\/resolve-release/.test(text)) {
      remind("Release/CI touched — docs/CONFIGURATION.md, docs/releases/");
    }
    if (/docs\/API\.md/.test(text)) {
      remind("API.md changed — verify docs/examples/typescript/ + lua/ still match");
    }
    if (/docs\/examples\//.test(text)) {
      remind("Examples changed — cross-check docs/API.md contract");
    }

    console.log("\nFull checklist: docs/CHECKLIST.md");
  }

  console.log("\nDoc export list: yarn doc-audit");
  console.log("Examples routine: .cursor/skills/examples-docs/SKILL.md\n");

  console.log("Running gate...\n");
  const result = spawnSync("yarn", ["gate"], { cwd: root, stdio: "inherit", shell: true });
  process.exit(result.status ?? 1);
}

main();
