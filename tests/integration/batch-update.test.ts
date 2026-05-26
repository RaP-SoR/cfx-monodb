import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { registerExports } from "../../src/exports";
import MongoDBConnector from "../../src/connector";
import {
  clearExports,
  getExport,
  installExportCapture,
} from "../helpers/export-registry";
import {
  skipIntegration,
  TEST_DB_OPTIONS,
  TEST_MONGODB_URI,
} from "./setup";

const COLLECTION = "it_batch_update";
const DOC_COUNT = 200;
const MAX_MS = 30_000;

describe.skipIf(skipIntegration)("Batch update (integration)", () => {
  const connector = MongoDBConnector.getInstance();
  const insertedIds: string[] = [];

  beforeAll(async () => {
    if (!connector.isDbConnected()) {
      await connector.connect(TEST_MONGODB_URI, TEST_DB_OPTIONS);
    }
    clearExports();
    installExportCapture();
    registerExports(connector);

    const db = connector.getDb();
    await db!.collection(COLLECTION).drop().catch(() => {});

    const insert = getExport<
      (name: string, doc: object) => Promise<{ success: boolean; insertedId?: string; error?: string }>
    >("insert");

    for (let i = 0; i < DOC_COUNT; i++) {
      const result = await insert(COLLECTION, { slot: i, count: 0 });
      if (!result.success || !result.insertedId) {
        throw new Error(`insert failed at ${i}: ${result.error ?? "unknown"}`);
      }
      insertedIds.push(result.insertedId);
    }
  }, 60_000);

  afterAll(async () => {
    const db = connector.getDb();
    if (db) {
      await db.collection(COLLECTION).drop().catch(() => {});
    }
    if (connector.isDbConnected()) {
      await connector.disconnect();
    }
  });

  it(`${DOC_COUNT} sequential export updates within ${MAX_MS}ms`, async () => {
    const update = getExport<
      (
        name: string,
        filter: object,
        updateDoc: object
      ) => Promise<{ success: boolean; modifiedCount?: number; error?: string }>
    >("update");

    const t0 = Date.now();
    for (let i = 0; i < insertedIds.length; i++) {
      const result = await update(
        COLLECTION,
        { _id: insertedIds[i] },
        { $set: { count: i + 1 } }
      );
      expect(result.success).toBe(true);
      expect(result.modifiedCount).toBe(1);
    }
    const elapsed = Date.now() - t0;

    expect(elapsed).toBeLessThan(MAX_MS);
  }, MAX_MS + 5_000);
});
