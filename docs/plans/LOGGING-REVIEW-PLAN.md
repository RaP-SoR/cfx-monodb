# Logging review & implementation plan (Track K)

> **Agent:** Logging review (see [PARALLEL-REVIEW-WORKFLOW.md](PARALLEL-REVIEW-WORKFLOW.md))  
> **Audit 2 score:** ~**62%** — **weak for stable `v1.0.0`**  
> **Target Audit 3:** **≥80%**  
> **Review completed:** 2026-05-26 (readonly agent — no `src/` changes)

---

## Current state (baseline)

| Component | Behavior |
|-----------|----------|
| **`utils.log()`** | ConVar `mongodb_log_level` — error/warn/info/debug filter; prefix `[CFX-MongoDB]` |
| **`config.ts`** | **`console.log`** on load — **bypasses** log level |
| **`connector.ts`** | Uses `log()` + `redactMongoUri` on connect URLs |
| **`withDb.ts`** | Errors via `log("error", ...)` + `formatError` — no export/collection suffix |
| **`write.ts`** | **debug** logs full normalized **filter JSON**; **info** delete log also logs full filter |
| **`perf.ts`** | Separate `SLOW QUERY` lines — filter keys only (good) |
| **Tests** | `redactMongoUri`, `formatError` only — **no `log()` / level tests** |

Observability (C1/C2 perf) is **separate** — this track is **logging policy + safety + consistency**, not perf UI.

**Grep summary (`src/`):** 32 `log()` call sites across 10 files + 1 stray `console.log` in `config.ts`. `utils.ts` also uses `console.*` internally inside `log()` (expected). `read.ts` / `admin.ts` — zero log calls.

---

## Review findings (agent fills this section)

> **Status:** 🟢 Review complete (2026-05-26)

### Call-site inventory (agent completes)

| File | Calls | Uses | Levels | Redaction / notes |
|------|-------|------|--------|-------------------|
| `utils.ts` | 3 | `log()` impl + 2 internal | error/warn/info/debug | Entry point; `console.*` only inside `log()`. `parseInitIndexes` warns on truncate/parse fail — safe (counts/messages only). |
| `config.ts` | 1 | **`console.log`** | always-on (≈info) | **Bypass:** `Environment: ${environment}` — ignores `mongodb_log_level`; duplicate prefix manual. |
| `connector.ts` | 10 | `log()` | info/error | URI lines use `redactMongoUri` (L25, L46, L77). Errors: message only (L73, L98). |
| `bootstrap.ts` | 5 | `log()` | info/error | Resource name + error messages only — safe. |
| `registerExports.ts` | 1 | `log()` | info | Static registration line — safe. |
| `withDb.ts` | 1 | `log()` | error | `formatError(err)` only — no collection/export context despite `ctx` available. |
| `write.ts` | 4 | `log()` | debug/info/warn | **HIGH:** L55 debug — full filter via `JSON.stringify(normalized)`. **HIGH:** L112–114 **info** — full filter on every successful delete. L64 debug counts only (safe). L110 warn count only (safe). |
| `indexService.ts` | 2 | `log()` | info/warn | Collection name + index count / error message — safe. |
| `lifecycle.ts` | 4 | `log()` | info/error | Connect URL redacted (L31). Errors message-only (L34–36, L54–56). |
| `perf.ts` | 2 | `log()` | warn/debug | `filter_keys=` suffix only — **good pattern** (L120–133). |
| `read.ts` | 0 | — | — | No logging. |
| `admin.ts` | 0 | — | — | No logging; `config()` export returns raw `GetConvar("mongodb_log_level")` without `getLogLevel()` validation. |

**Per-call detail (non-obvious sites):**

| Location | Message pattern | Risk |
|----------|-----------------|------|
| `write.ts:55` | `Updating with filter: ${JSON.stringify(normalized)}` | PII at **debug** |
| `write.ts:112–114` | `Deleted document with filter: ${JSON.stringify(filter)}` | PII at **info (default)** — worse than debug line |
| `connector.ts:71–77` | Dual error lines on connect fail | URL redacted on second line; first is driver message (may contain host) |
| `admin.ts:65` | `logLevel` in `config()` response | Invalid ConVar value passed through unchanged vs `getLogLevel()` fallback |

### Policy questions (agent decides)

- [x] Should **debug** update logs include filter **values** or **keys only** (align with perf)?  
  **→ Keys only by default.** Reuse `extractFilterKeys()` (already used for perf + delete ctx). Full values only behind a new opt-in ConVar `mongodb_log_verbose_filters` (default `0`) when operators explicitly need value-level debugging.

- [x] Should **`config.ts` env line** use `log("info", ...)` instead of `console.log`?  
  **→ Yes.** Import `log` from `./utils`, replace `console.log` with `log("info", \`Environment: ${environment}\`)`. Removes bypass, deduplicates prefix handling, respects `mongodb_log_level`. Environment name is not secret.

- [x] Standard prefix: `[CFX-MongoDB]` only or add `[export/collection]` where cheap?  
  **→ Keep `[CFX-MongoDB]` as the only mandatory prefix** (applied in `log()`). Add optional suffix on **errors** from `withDb` when `ctx` is present: e.g. `withDb error: … [export=update collection=players]`. Do not retrofit every info line in K2/K3 — perf already encodes export/collection in its own format.

- [x] Log driver errors — include `error.code` / `errorName` when present?  
  **→ Yes for MongoDB driver errors**, without logging query/filter/document payloads. Extend `formatError()` (or a thin `formatDriverError()`) to append `(code=11000)` / `(name=MongoServerError)` when `err` has those fields. Keeps messages actionable for ops.

- [x] Should `mongodb_log_level` changes require restart (today: read every `log()` call — OK)?  
  **→ No restart required** — `getLogLevel()` reads ConVar on every `log()` call; live `set mongodb_log_level …` works. Document this in `docs/LOGGING.md`. **Also:** align `config()` export to use `getLogLevel()` so API reflects effective level after invalid ConVar values.

### Known gaps (pre-review seed)

| ID | Gap | Severity | Evidence (codebase) |
|----|-----|----------|---------------------|
| K-G1 | No unit tests for `getLogLevel()` / `log()` filtering | **High** | `tests/utils.test.ts` covers `redactMongoUri` + `formatError` only. No mock of `GetConvar` for level gating. Invalid ConVar fallback (`utils.ts:6–8`) untested. |
| K-G2 | `console.log` bypass in `config.ts` | **Medium** | `config.ts:71` — always prints regardless of `mongodb_log_level`; only stray `console.*` outside `log()` impl. |
| K-G3 | Debug/info filter logging may leak PII in values | **High** | `write.ts:55` (debug, full JSON). **`write.ts:112–114` (info, full JSON on every delete)** — leaks at default prod level `info`. Contrast: `perf.ts:120–123` keys-only; `extractFilterKeys` exists in `utils.ts:77–82`. |
| K-G4 | No audit test that connector logs never contain raw password | **Medium** | `redactMongoUri` unit-tested (`tests/utils.test.ts`) but no test spies on `log()` output from `connector.ts` constructor/connect error paths. Regression could reintroduce raw URI logging. |
| K-G5 | Inconsistent structure (string concat vs perf format) | **Low** | Ad-hoc prose (`connector.ts`), JSON blobs (`write.ts`), structured perf lines (`SLOW QUERY … filter_keys=`). No shared helper for filter debug text. |
| K-G6 | No documented logging policy for operators | **Medium** | `CONFIGURATION.md` / `GUIDE.md` mention ConVar levels; no dedicated policy doc (`docs/LOGGING.md` missing). Dev cfg examples set `mongodb_log_level debug` (`mongodb.dev.cfg.example`) without PII warning. |

### Agent notes

**Prioritized fixes (implementation order):**

| P | Fix | Phase | Rationale |
|---|-----|-------|-----------|
| **P0** | `write.ts` delete **info** line → keys only (or remove; perf/delete ctx already has keys) | K3 | **Active PII leak at default `info`** — highest production risk |
| **P0** | `write.ts` update **debug** line → keys only (or gate behind `mongodb_log_verbose_filters`) | K3 | Align with perf; dev configs often use `debug` |
| **P1** | `tests/log.test.ts` — level filter, invalid ConVar, suppressed debug | K2 | Closes K-G1; prevents regressions |
| **P1** | `config.ts` → `log("info", …)` | K2 | Closes K-G2; one-line fix |
| **P1** | Connector log redaction regression test (mock `log`, assert no `secret` in messages) | K2 | Closes K-G4 |
| **P2** | `docs/LOGGING.md` + links from CONFIGURATION / API security | K1 | Closes K-G6 |
| **P2** | `formatError` / driver code suffix; `withDb` error context suffix | K4 | Ops clarity without new PII |
| **P2** | `config()` export uses `getLogLevel()` | K4 | API consistency |
| **P3** | Shared `formatFilterForLog(filter, verbose?)` helper | K3/K4 | Closes K-G5 |

**Non-issues / acceptable:**

- `utils.ts` internal `console.*` — required sink for `log()`; not a bypass.
- URI redaction at connect paths — consistently applied where URL appears in logs.
- `read.ts` silent — queries not logged (good for PII).
- Live ConVar reads — acceptable; document for operators.

**Coordination:** K3 `write.ts` edits independent of Track J. K4 `withDb.ts` suffix — merge before integration tests if both touch `withDb.ts` (see parallel workflow).

---

## Target policy (draft — agent refines)

1. **Never log (any level):** full URIs with credentials, document bodies, full filter/update payloads with user-identifying values, raw `mongodb_*_url` ConVar values.  
2. **`info` default (production):** lifecycle, index summary, export registration, connection state — **no filter values**. Delete success should log collection + filter **keys** only (or omit entirely).  
3. **`debug`:** filter **keys only** by default; full filter JSON only when `mongodb_log_verbose_filters 1` (new ConVar, default off). Update result counts (matched/modified) remain safe at debug.  
4. **`warn`:** operational anomalies (slow query, index ensure failure, parse truncation) — keys/counts only.  
5. **`error`:** always emitted regardless of level setting; use `formatError` + optional Mongo `code`/`name`; prefer `withDb` suffix `[export=… collection=…]` when context exists.  
6. **Single entry:** all application paths through `log()` — no stray `console.*` in `src/` except inside `log()` implementation.  
7. **ConVar behavior:** `mongodb_log_level` effective immediately (no restart); invalid values fall back to `info` (`getLogLevel()`); `config()` export must reflect effective level.

Document final policy in **`docs/LOGGING.md`** (new, short) — K1 deliverable.

---

## Implementation phases

### K1 — Review & inventory (~2–3 h)

- [x] Complete call-site table above (grep verified 2026-05-26)
- [x] Grep `console.` in `src/` — **1 violation:** `config.ts:71` (+ expected `utils.ts` sink)
- [ ] Write **`docs/LOGGING.md`** — operator + maintainer guide (policy § above, ConVar table, PII examples)
- [ ] Link from CONFIGURATION.md + API.md security section

**Effort note:** Review done; remaining K1 work is documentation only (~1–2 h).

### K2 — Tests & config fix (~3–5 h)

- [ ] `tests/log.test.ts` — `getLogLevel`, level filtering (`debug` suppressed at `info`), invalid ConVar → `info`
- [ ] Test: `log("debug", …)` suppressed when level `info` (mock `GetConvar` + spy `console.log`)
- [ ] Replace `config.ts` `console.log` → `log("info", …)`
- [ ] Test: connector connect log line never contains raw credentials (instantiate connector with mocked URL, capture `log` or console output)
- [ ] Optional: test `delete` info path does not log filter values after K3 fix (add in K3 if delete fix lands same PR)

**Recommended first implementation slice:** **K2 + P0 delete info fix from K3** in one PR — tests + config bypass + stop info-level filter leak (biggest audit lift).

### K3 — Redaction & debug safety (~3–5 h)

- [ ] Change `write.ts:55` debug line to **keys only** (via `extractFilterKeys` or shared helper)
- [ ] Change `write.ts:112–114` **info** delete line to keys only or remove (P0)
- [ ] Optional ConVar: `mongodb_log_verbose_filters` for full JSON at debug
- [ ] Optional: `formatFilterForLog(filter, verbose?)` shared with perf key extraction
- [ ] Add tests for filter redaction helper if extracted

### K4 — Polish (optional, ~2–3 h)

- [ ] Structured suffix `[export=find collection=players]` on `withDb` errors when `ctx` present
- [ ] `formatError` appends Mongo driver `code` / `name` when available
- [ ] `config()` export uses `getLogLevel()` instead of raw `GetConvar`
- [ ] CHANGELOG + audit score update in QUALITY-AUDIT-2026.md

---

## Success criteria (Audit 3)

| Criterion | Met when |
|-----------|----------|
| Policy doc | `docs/LOGGING.md` merged |
| Tests | `log.test.ts` + redaction regression |
| No bypass | zero stray `console.log` in `src/` (only `log()` sink in `utils.ts`) |
| PII safety | filter paths keys-only by default at info **and** debug |
| Score | Logging **≥80%** in audit |

---

## Parallel with Track J

| Touch point | Risk | Mitigation |
|-------------|------|------------|
| `withDb.ts` | Both may edit | Logging K4 first; integration adds tests only |
| `connector.ts` | Integration tests assert connect | Logging K2 redaction tests first |
| `write.ts` | Integration CRUD may assert delete | K3 delete log fix before/alongside integration |
| CI time | +integration job | Logging = unit only, no CI time add |

---

## Out of scope (Track K)

- Perf UI / NUI (OBSERVABILITY-PLAN C3+)
- External log shipping (Loki, ELK)
- Client-side logs

---

## References

- [utils.ts](../../src/utils.ts)
- [write.ts](../../src/api/handlers/write.ts) — PII hotspots L55, L112–114
- [config.ts](../../src/config.ts) — console bypass L71
- [OBSERVABILITY-PLAN.md](OBSERVABILITY-PLAN.md) — perf vs logging boundary
- [CONFIGURATION.md](../CONFIGURATION.md) — `mongodb_log_level`
