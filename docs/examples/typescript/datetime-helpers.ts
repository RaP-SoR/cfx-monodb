/**
 * Optional copy-paste helpers for docs/examples/typescript/queries.md §3.9
 * Not part of cfx-mongodb build — copy into your resource.
 * Store UTC in Mongo; offsets are fixed (adjust for DST in production).
 */

/** Seconds east of UTC (winter examples). */
export const OFFSET_EU_CET = 3600;
export const OFFSET_EU_CEST = 7200;
export const OFFSET_UK_GMT = 0;
export const OFFSET_UK_BST = 3600;
export const OFFSET_US_EAST_EST = -18000;
export const OFFSET_US_EAST_EDT = -14400;
export const OFFSET_US_WEST_PST = -28800;
export const OFFSET_US_WEST_PDT = -25200;
export const OFFSET_ASIA_TOKYO = 32400;
export const OFFSET_ASIA_SHANGHAI = 28800;
export const OFFSET_ASIA_DUBAI = 14400;
export const OFFSET_ASIA_INDIA = 19800;

export function isoUtcNow(): string {
  return new Date().toISOString();
}

export function isoUtcFromEpoch(epochMs: number): string {
  return new Date(epochMs).toISOString();
}

/** Start of current local calendar day (fixed offset), as UTC ISO for Mongo $gte. */
export function startOfLocalDayUtcIso(offsetSeconds: number): string {
  const nowSec = Math.floor(Date.now() / 1000);
  const localNow = nowSec + offsetSeconds;
  const startLocal = localNow - (localNow % 86400);
  return new Date((startLocal - offsetSeconds) * 1000).toISOString();
}

export function sinceHoursAgoUtc(hours: number): string {
  return new Date(Date.now() - hours * 3600000).toISOString();
}
