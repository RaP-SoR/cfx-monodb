/**
 * @file Opt-in slow-query logging (MySQL-style). ConVar-gated; default off.
 * Ring buffer + {@link getQueryStatsData} for admin diagnostics (Track C2).
 * @see docs/plans/OBSERVABILITY-PLAN.md
 */

import { log } from "./utils";

/** Context passed from handlers into {@link withDb} for perf lines. */
export interface PerfContext {
  exportName: string;
  collection?: string;
  filterKeys?: string[];
}

/** Single timed export operation stored in the ring buffer. */
export interface PerfSample {
  export: string;
  collection: string;
  ms: number;
  ok: boolean;
  at: string;
}

export interface QueryStatsAggregates {
  count: number;
  p50Ms: number;
  p95Ms: number;
  slowCount: number;
}

export interface QueryStatsData {
  enabled: boolean;
  samples: PerfSample[];
  aggregates: QueryStatsAggregates;
}

const ringBuffer: PerfSample[] = [];

/** Whether `mongodb_perf_enabled` is set. */
export function isPerfEnabled(): boolean {
  return GetConvar("mongodb_perf_enabled", "0") === "1";
}

/** Slow-query threshold in ms (`mongodb_perf_slow_ms`, default 100). */
export function getPerfSlowMs(): number {
  const raw = parseInt(GetConvar("mongodb_perf_slow_ms", "100"), 10);
  return Number.isFinite(raw) && raw > 0 ? raw : 100;
}

/** Whether every operation is logged at debug (`mongodb_perf_log_all`). */
export function isPerfLogAll(): boolean {
  return GetConvar("mongodb_perf_log_all", "0") === "1";
}

/** Ring buffer capacity (`mongodb_perf_buffer`, default 100, max 1000). */
export function getPerfBufferSize(): number {
  const raw = parseInt(GetConvar("mongodb_perf_buffer", "100"), 10);
  if (!Number.isFinite(raw) || raw < 1) return 100;
  return Math.min(1000, raw);
}

function computePercentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const rank = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(sorted.length - 1, rank))];
}

function pushSample(sample: PerfSample): void {
  const max = getPerfBufferSize();
  ringBuffer.push(sample);
  while (ringBuffer.length > max) {
    ringBuffer.shift();
  }
}

/**
 * Build query stats snapshot from the in-memory ring buffer.
 * Cleared on resource restart only.
 */
export function getQueryStatsData(): QueryStatsData {
  const slowMs = getPerfSlowMs();
  const msValues = ringBuffer.map((s) => s.ms);

  return {
    enabled: isPerfEnabled(),
    samples: ringBuffer.map((s) => ({ ...s })),
    aggregates: {
      count: ringBuffer.length,
      p50Ms: computePercentile(msValues, 50),
      p95Ms: computePercentile(msValues, 95),
      slowCount: ringBuffer.filter((s) => s.ms >= slowMs).length,
    },
  };
}

/** @internal Vitest only — clears ring buffer between tests. */
export function resetPerfBufferForTests(): void {
  ringBuffer.length = 0;
}

/**
 * Log slow or verbose perf lines. No-op when perf is disabled.
 * Never logs filter values — keys only when provided.
 */
export function recordPerf(ctx: PerfContext, ms: number, ok: boolean): void {
  if (!isPerfEnabled()) return;

  pushSample({
    export: ctx.exportName,
    collection: ctx.collection ?? "-",
    ms,
    ok,
    at: new Date().toISOString(),
  });

  const slowMs = getPerfSlowMs();
  const target = ctx.collection ?? "-";
  const keysSuffix =
    ctx.filterKeys && ctx.filterKeys.length > 0
      ? ` filter_keys=${ctx.filterKeys.join(",")}`
      : "";

  if (ms >= slowMs) {
    log(
      "warn",
      `SLOW QUERY ${ctx.exportName} ${target} ${ms}ms (threshold ${slowMs}ms)${keysSuffix}`
    );
  } else if (isPerfLogAll()) {
    log(
      "debug",
      `perf ${ctx.exportName} ${target} ${ms}ms ok=${ok}${keysSuffix}`
    );
  }
}
