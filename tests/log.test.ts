import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import MongoDBConnector from "../src/connector";
import { getLogLevel, log } from "../src/utils";
import { getExport } from "./helpers/export-registry";
import { createMockCollection } from "./helpers/mock-db";
import { registerWithDb } from "./helpers/register-exports";

function stubLogLevel(level: string): void {
  vi.stubGlobal("GetConvar", (name: string, defaultValue: string) => {
    if (name === "mongodb_log_level") return level;
    return defaultValue;
  });
}

describe("getLogLevel", () => {
  it("returns valid ConVar levels", () => {
    for (const level of ["error", "warn", "info", "debug"] as const) {
      stubLogLevel(level);
      expect(getLogLevel()).toBe(level);
    }
  });

  it("falls back to info for invalid ConVar values", () => {
    stubLogLevel("verbose");
    expect(getLogLevel()).toBe("info");
  });
});

describe("log", () => {
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("suppresses debug when effective level is info", () => {
    stubLogLevel("info");
    log("debug", "hidden debug message");
    expect(console.log).not.toHaveBeenCalled();
  });

  it("emits info when effective level is info", () => {
    stubLogLevel("info");
    log("info", "visible info message");
    expect(console.log).toHaveBeenCalledWith(
      "[CFX-MongoDB] visible info message"
    );
  });

  it("routes error level to console.error", () => {
    stubLogLevel("info");
    log("error", "failure");
    expect(console.error).toHaveBeenCalledWith("[CFX-MongoDB] failure");
    expect(console.log).not.toHaveBeenCalled();
  });

  it("respects live ConVar changes without restart", () => {
    stubLogLevel("error");
    log("warn", "first");
    expect(console.warn).not.toHaveBeenCalled();

    stubLogLevel("warn");
    log("warn", "second");
    expect(console.warn).toHaveBeenCalledWith("[CFX-MongoDB] second");
  });
});

describe("connector URI logging", () => {
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
    stubLogLevel("debug");
  });

  afterEach(async () => {
    const connector = MongoDBConnector.getInstance();
    if (connector.isDbConnected()) {
      await connector.disconnect();
    }
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("never logs raw credentials when configuring a remote URL", async () => {
    const messages: string[] = [];
    vi.mocked(console.log).mockImplementation((...args: unknown[]) => {
      messages.push(args.map(String).join(" "));
    });

    const connector = MongoDBConnector.getInstance();
    const secretUri = "mongodb://testuser:testpass@127.0.0.1:27017/cfx_test";

    try {
      await connector.connect(secretUri, { serverSelectionTimeoutMS: 500 });
    } catch {
      // No MongoDB in unit CI — logging happens before connect failure.
    }

    const joined = messages.join("\n");
    expect(joined).toContain("***:***@");
    expect(joined).not.toContain("testuser");
    expect(joined).not.toContain("testpass");
  });
});

describe("write handler logging", () => {
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    stubLogLevel("info");
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("does not log filter values on successful delete at info level", async () => {
    const collection = createMockCollection({
      deleteOne: vi.fn().mockResolvedValue({ deletedCount: 1 }),
    });
    registerWithDb({ collections: { players: collection } });

    const del = getExport<
      (
        name: string,
        filter: object
      ) => Promise<{ success: boolean; deletedCount?: number }>
    >("delete");

    const result = await del("players", { email: "secret@example.com" });

    expect(result.success).toBe(true);
    const lines = vi
      .mocked(console.log)
      .mock.calls.map((call) => String(call[0]))
      .join("\n");
    expect(lines).not.toContain("secret@example.com");
    expect(lines).toContain("filter_keys=email");
  });
});
