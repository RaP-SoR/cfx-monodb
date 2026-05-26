#!/usr/bin/env node
/**
 * Benchmark sequential updates against seeded data (driver direct — not FiveM exports).
 * For export-path batch timing see tests/integration/batch-update.test.ts
 */
import { MongoClient } from "mongodb";

const uri = process.env.TEST_MONGODB_URI;
if (!uri) {
  console.error("TEST_MONGODB_URI is required");
  process.exit(1);
}

function arg(name, fallback) {
  const i = process.argv.indexOf(name);
  if (i === -1 || !process.argv[i + 1]) return fallback;
  return process.argv[i + 1];
}

const updates = Math.max(1, parseInt(arg("--updates", "200"), 10));
const collection = arg("--collection", "it_seed_bench_items");

async function main() {
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
  await client.connect();
  const col = client.db().collection(collection);

  const total = await col.countDocuments();
  if (total < updates) {
    console.error(
      `[bench] Collection "${collection}" has ${total} docs; need ${updates}. Run: yarn seed:test-data`
    );
    await client.close();
    process.exit(1);
  }

  const docs = await col.find({}, { projection: { _id: 1 } }).limit(updates).toArray();

  const t0 = Date.now();
  for (let i = 0; i < docs.length; i++) {
    await col.updateOne(
      { _id: docs[i]._id },
      { $set: { count: i + 1, benchAt: new Date().toISOString() } }
    );
  }
  const elapsed = Date.now() - t0;

  console.log("[bench] Sequential updateOne (driver direct):");
  console.log(`  collection: ${collection}`);
  console.log(`  updates:    ${updates}`);
  console.log(`  total:      ${elapsed} ms`);
  console.log(`  avg:        ${(elapsed / updates).toFixed(2)} ms/op`);
  console.log(
    "  note: export-path timing → yarn test:integration (batch-update.test.ts)"
  );

  await client.close();
}

main().catch((err) => {
  console.error("[bench] Failed:", err.message);
  process.exit(1);
});
