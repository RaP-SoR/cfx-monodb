import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  getPerfSlowMs,
  isPerfEnabled,
  isPerfLogAll,
  recordPerf,
} from "../src/perf";
import * as utils from "../src/utils";

describe("perf", () => {
  beforeEach(() => {
    vi.spyOn(utils, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.stubGlobal("GetConvar", (name: string, defaultValue: string) => defaultValue);
  });

  it("isPerfEnabled defaults to false", () => {
    expect(isPerfEnabled()).toBe(false);
  });

  it("getPerfSlowMs defaults to 100", () => {
    expect(getPerfSlowMs()).toBe(100);
  });

  it("recordPerf is no-op when perf disabled", () => {
    recordPerf({ exportName: "find", collection: "players" }, 500, true);
    expect(utils.log).not.toHaveBeenCalled();
  });

  it("recordPerf logs warn for slow queries when enabled", () => {
    vi.stubGlobal("GetConvar", (name: string, defaultValue: string) => {
      if (name === "mongodb_perf_enabled") return "1";
      if (name === "mongodb_perf_slow_ms") return "100";
      return defaultValue;
    });

    recordPerf(
      { exportName: "find", collection: "players", filterKeys: ["_id"] },
      142,
      true
    );

    expect(utils.log).toHaveBeenCalledWith(
      "warn",
      "SLOW QUERY find players 142ms (threshold 100ms) filter_keys=_id"
    );
  });

  it("recordPerf logs debug for fast queries when log_all enabled", () => {
    vi.stubGlobal("GetConvar", (name: string, defaultValue: string) => {
      if (name === "mongodb_perf_enabled") return "1";
      if (name === "mongodb_perf_slow_ms") return "100";
      if (name === "mongodb_perf_log_all") return "1";
      return defaultValue;
    });

    recordPerf({ exportName: "count", collection: "users" }, 12, true);

    expect(utils.log).toHaveBeenCalledWith(
      "debug",
      "perf count users 12ms ok=true"
    );
  });

  it("isPerfLogAll defaults to false", () => {
    expect(isPerfLogAll()).toBe(false);
  });
});
