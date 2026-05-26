/**
 * @file Opt-in slow-query logging (MySQL-style). ConVar-gated; default off.
 * @see docs/plans/OBSERVABILITY-PLAN.md
 */

import { log } from "./utils";

/** Context passed from handlers into {@link withDb} for perf lines. */
export interface PerfContext {
  exportName: string;
  collection?: string;
  filterKeys?: string[];
}

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

/**
 * Log slow or verbose perf lines. No-op when perf is disabled.
 * Never logs filter values — keys only when provided.
 */
export function recordPerf(ctx: PerfContext, ms: number, ok: boolean): void {
  if (!isPerfEnabled()) return;

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
