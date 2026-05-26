import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import type { Db } from "mongodb";
import { withDb } from "../src/api/withDb";
import type { DbProvider } from "../src/types/dbProvider";
import * as utils from "../src/utils";

function makeProvider(db: Db | null, connected = db !== null): DbProvider {
  return {
    getDb: () => db,
    isDbConnected: () => connected,
  };
}

describe("withDb", () => {
  beforeEach(() => {
    vi.spyOn(utils, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns disconnected envelope when getDb is null", async () => {
    const result = await withDb(makeProvider(null), async () => "unused");

    expect(result).toEqual({
      success: false,
      error: "Database not connected",
    });
  });

  it("returns success envelope with op result", async () => {
    const db = {} as Db;
    const result = await withDb(makeProvider(db), async () => ({ count: 3 }));

    expect(result).toEqual({ success: true, data: { count: 3 } });
  });

  it("returns error envelope and logs when op throws", async () => {
    const db = {} as Db;
    const result = await withDb(makeProvider(db), async () => {
      throw new Error("collection timeout");
    });

    expect(result).toEqual({
      success: false,
      error: "collection timeout",
    });
    expect(utils.log).toHaveBeenCalledWith(
      "error",
      "withDb error: collection timeout"
    );
  });

  it("never throws to caller", async () => {
    const db = {} as Db;
    await expect(
      withDb(makeProvider(db), async () => {
        throw "raw failure";
      })
    ).resolves.toEqual({ success: false, error: "raw failure" });
  });
});
