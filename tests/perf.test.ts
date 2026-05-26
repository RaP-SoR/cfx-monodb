import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  getPerfBufferSize,
  getPerfSlowMs,
  getQueryStatsData,
  isPerfEnabled,
  isPerfLogAll,
  recordPerf,
  resetPerfBufferForTests,
} from "../src/perf";
import * as utils from "../src/utils";

describe("perf", () => {
  beforeEach(() => {
    resetPerfBufferForTests();
    vi.spyOn(utils, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    resetPerfBufferForTests();
    vi.stubGlobal("GetConvar", (name: string, defaultValue: string) => defaultValue);
  });

  it("isPerfEnabled defaults to false", () => {
    expect(isPerfEnabled()).toBe(false);
  });

  it("getPerfSlowMs defaults to 100", () => {
    expect(getPerfSlowMs()).toBe(100);
  });

  it("getPerfBufferSize defaults to 100 and caps at 1000", () => {
    expect(getPerfBufferSize()).toBe(100);

    vi.stubGlobal("GetConvar", (name: string, defaultValue: string) => {
      if (name === "mongodb_perf_buffer") return "5000";
      return defaultValue;
    });

    expect(getPerfBufferSize()).toBe(1000);
  });

  it("recordPerf is no-op when perf disabled", () => {
    recordPerf({ exportName: "find", collection: "players" }, 500, true);
    expect(utils.log).not.toHaveBeenCalled();
    expect(getQueryStatsData().samples).toEqual([]);
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

  it("stores samples in ring buffer when perf enabled", () => {
    vi.stubGlobal("GetConvar", (name: string, defaultValue: string) => {
      if (name === "mongodb_perf_enabled") return "1";
      return defaultValue;
    });

    recordPerf({ exportName: "find", collection: "players" }, 50, true);
    recordPerf({ exportName: "insert", collection: "users" }, 80, false);

    const stats = getQueryStatsData();
    expect(stats.enabled).toBe(true);
    expect(stats.samples).toHaveLength(2);
    expect(stats.samples[0].export).toBe("find");
    expect(stats.samples[1].ok).toBe(false);
  });

  it("ring buffer evicts oldest samples when over capacity", () => {
    vi.stubGlobal("GetConvar", (name: string, defaultValue: string) => {
      if (name === "mongodb_perf_enabled") return "1";
      if (name === "mongodb_perf_buffer") return "2";
      return defaultValue;
    });

    recordPerf({ exportName: "find", collection: "a" }, 10, true);
    recordPerf({ exportName: "find", collection: "b" }, 20, true);
    recordPerf({ exportName: "find", collection: "c" }, 30, true);

    const stats = getQueryStatsData();
    expect(stats.samples).toHaveLength(2);
    expect(stats.samples[0].collection).toBe("b");
    expect(stats.samples[1].collection).toBe("c");
  });

  it("computes p50, p95 and slowCount aggregates", () => {
    vi.stubGlobal("GetConvar", (name: string, defaultValue: string) => {
      if (name === "mongodb_perf_enabled") return "1";
      if (name === "mongodb_perf_slow_ms") return "100";
      return defaultValue;
    });

    recordPerf({ exportName: "find", collection: "a" }, 50, true);
    recordPerf({ exportName: "find", collection: "b" }, 100, true);
    recordPerf({ exportName: "find", collection: "c" }, 150, true);
    recordPerf({ exportName: "find", collection: "d" }, 200, true);

    const { aggregates } = getQueryStatsData();
    expect(aggregates.count).toBe(4);
    expect(aggregates.p50Ms).toBe(100);
    expect(aggregates.p95Ms).toBe(200);
    expect(aggregates.slowCount).toBe(3);
  });

  it("getQueryStatsData returns enabled false when perf off", () => {
    const stats = getQueryStatsData();
    expect(stats.enabled).toBe(false);
    expect(stats.samples).toEqual([]);
    expect(stats.aggregates).toEqual({
      count: 0,
      p50Ms: 0,
      p95Ms: 0,
      slowCount: 0,
    });
  });
});
