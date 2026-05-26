import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { ObjectId } from "mongodb";
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

const COLLECTION = "it_crud_roundtrip";

describe.skipIf(skipIntegration)("CRUD roundtrip (integration)", () => {
  const connector = MongoDBConnector.getInstance();

  beforeAll(async () => {
    if (!connector.isDbConnected()) {
      await connector.connect(TEST_MONGODB_URI, TEST_DB_OPTIONS);
    }
    clearExports();
    installExportCapture();
    registerExports(connector);

    const db = connector.getDb();
    await db!.collection(COLLECTION).drop().catch(() => {});
  });

  afterAll(async () => {
    const db = connector.getDb();
    if (db) {
      await db.collection(COLLECTION).drop().catch(() => {});
    }
    if (connector.isDbConnected()) {
      await connector.disconnect();
    }
  });

  it("insert → find → findById → update → delete → count", async () => {
    const insert = getExport<
      (name: string, doc: object) => Promise<{ success: boolean; insertedId?: string; error?: string }>
    >("insert");
    const find = getExport<
      (name: string, query: object) => Promise<{ success: boolean; data?: Record<string, unknown> | null }>
    >("find");
    const findById = getExport<
      (name: string, id: string) => Promise<{ success: boolean; data?: Record<string, unknown> | null }>
    >("findById");
    const update = getExport<
      (
        name: string,
        filter: object,
        updateDoc: object
      ) => Promise<{ success: boolean; modifiedCount?: number; error?: string }>
    >("update");
    const del = getExport<
      (name: string, filter: object) => Promise<{ success: boolean; deletedCount?: number; error?: string }>
    >("delete");
    const count = getExport<
      (name: string, filter?: object) => Promise<{ success: boolean; data?: number }>
    >("count");

    const inserted = await insert(COLLECTION, {
      name: "integration-player",
      score: 10,
    });
    expect(inserted.success).toBe(true);
    expect(typeof inserted.insertedId).toBe("string");
    expect(ObjectId.isValid(inserted.insertedId!)).toBe(true);

    const found = await find(COLLECTION, { name: "integration-player" });
    expect(found.success).toBe(true);
    expect(found.data?.name).toBe("integration-player");
    expect(typeof found.data?._id).toBe("string");

    const byId = await findById(COLLECTION, inserted.insertedId!);
    expect(byId.success).toBe(true);
    expect(byId.data?.score).toBe(10);

    const updated = await update(
      COLLECTION,
      { _id: inserted.insertedId! },
      { $set: { score: 20 } }
    );
    expect(updated.success).toBe(true);
    expect(updated.modifiedCount).toBe(1);

    const afterUpdate = await findById(COLLECTION, inserted.insertedId!);
    expect(afterUpdate.data?.score).toBe(20);

    const beforeDeleteCount = await count(COLLECTION, {});
    expect(beforeDeleteCount.success).toBe(true);
    expect(beforeDeleteCount.data).toBe(1);

    const deleted = await del(COLLECTION, { _id: inserted.insertedId! });
    expect(deleted.success).toBe(true);
    expect(deleted.deletedCount).toBe(1);

    const afterDeleteCount = await count(COLLECTION, {});
    expect(afterDeleteCount.data).toBe(0);
  });
});
