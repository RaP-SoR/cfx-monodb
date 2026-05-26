#!/usr/bin/env node
/**
 * Seed perf/stress collections for local MongoDB (opt-in, not in yarn gate).
 * Requires TEST_MONGODB_URI — same as integration tests.
 */
import { MongoClient } from "mongodb";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixture = JSON.parse(
  readFileSync(join(__dirname, "../tests/fixtures/perf-seed.json"), "utf8")
);

const uri = process.env.TEST_MONGODB_URI;
if (!uri) {
  console.error(
    "TEST_MONGODB_URI is required, e.g. mongodb://127.0.0.1:27017/cfx_mongodb_test"
  );
  process.exit(1);
}

const ACCOUNTS = fixture.defaults.accounts;
const CHARS_PER = fixture.defaults.charactersPerAccount;
const ITEMS_PER = fixture.defaults.itemsPerCharacter;
const BENCH_ITEMS = fixture.defaults.benchItems;

const COL = {
  accounts: "it_seed_accounts",
  characters: "it_seed_characters",
  items: "it_seed_items",
  bench: "it_seed_bench_items",
};

async function main() {
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
  await client.connect();
  const db = client.db();

  for (const name of Object.values(COL)) {
    await db.collection(name).drop().catch(() => {});
  }

  const now = new Date().toISOString();
  const accountDocs = [];
  for (let a = 0; a < ACCOUNTS; a++) {
    accountDocs.push({
      license: `license:perf${String(a).padStart(4, "0")}`,
      email: `perf${a}@example.test`,
      createdAt: now,
    });
  }
  const accountResult = await db.collection(COL.accounts).insertMany(accountDocs);
  const accountIds = Object.values(accountResult.insertedIds).map(String);

  const characterDocs = [];
  for (let a = 0; a < accountIds.length; a++) {
    const accountId = accountIds[a];
    const license = accountDocs[a].license;
    for (let slot = 1; slot <= CHARS_PER; slot++) {
      characterDocs.push({
        accountId,
        identifier: license,
        slot,
        name: `Char-${a}-${slot}`,
        job: "unemployed",
      });
    }
  }
  const charResult = await db
    .collection(COL.characters)
    .insertMany(characterDocs);
  const characterIds = Object.values(charResult.insertedIds).map(String);

  const itemDocs = [];
  for (const characterId of characterIds) {
    for (let i = 0; i < ITEMS_PER; i++) {
      itemDocs.push({
        characterId,
        name: `item_${i}`,
        count: 1,
      });
    }
  }
  await db.collection(COL.items).insertMany(itemDocs);

  const benchDocs = Array.from({ length: BENCH_ITEMS }, (_, i) => ({
    slot: i,
    label: `bench-item-${i}`,
    count: 0,
  }));
  await db.collection(COL.bench).insertMany(benchDocs);

  console.log("[seed] Done:");
  console.log(`  ${COL.accounts}: ${accountIds.length}`);
  console.log(`  ${COL.characters}: ${characterIds.length}`);
  console.log(`  ${COL.items}: ${itemDocs.length}`);
  console.log(`  ${COL.bench}: ${benchDocs.length}`);
  console.log(`  URI: ${uri.replace(/\/\/[^@]+@/, "//***:***@")}`);

  await client.close();
}

main().catch((err) => {
  console.error("[seed] Failed:", err.message);
  process.exit(1);
});
