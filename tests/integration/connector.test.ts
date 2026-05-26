import { afterAll, beforeAll, describe, expect, it } from "vitest";
import MongoDBConnector from "../../src/connector";
import {
  skipIntegration,
  TEST_DB_OPTIONS,
  TEST_MONGODB_URI,
} from "./setup";

describe.skipIf(skipIntegration)("MongoDBConnector (integration)", () => {
  const connector = MongoDBConnector.getInstance();

  beforeAll(async () => {
    await connector.connect(TEST_MONGODB_URI, TEST_DB_OPTIONS);
  });

  afterAll(async () => {
    if (connector.isDbConnected()) {
      await connector.disconnect();
    }
  });

  it("connects and pings the server", async () => {
    expect(connector.isDbConnected()).toBe(true);
    const db = connector.getDb();
    expect(db).not.toBeNull();
    const ping = await db!.command({ ping: 1 });
    expect(ping.ok).toBe(1);
  });

  it("disconnects and reconnects", async () => {
    await connector.disconnect();
    expect(connector.isDbConnected()).toBe(false);

    await connector.connect(TEST_MONGODB_URI, TEST_DB_OPTIONS);
    expect(connector.isDbConnected()).toBe(true);

    const db = connector.getDb();
    const ping = await db!.command({ ping: 1 });
    expect(ping.ok).toBe(1);
  });
});
