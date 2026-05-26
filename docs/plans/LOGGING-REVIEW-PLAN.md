# Logging review & implementation plan (Track K)

> **Agent:** Logging review (see [PARALLEL-REVIEW-WORKFLOW.md](PARALLEL-REVIEW-WORKFLOW.md))  
> **Audit 2 score:** ~**62%** — **weak for stable `v1.0.0`**  
> **Target Audit 3:** **≥80%**

---

## Current state (baseline)

| Component | Behavior |
|-----------|----------|
| **`utils.log()`** | ConVar `mongodb_log_level` — error/warn/info/debug filter |
| **`config.ts`** | **`console.log`** on load — **bypasses** log level |
| **`connector.ts`** | Uses `log()` + `redactMongoUri` on connect URLs |
| **`withDb.ts`** | Errors via `log("error", ...)` + `formatError` |
| **`write.ts`** | **debug** logs full normalized **filter JSON** — keys + values |
| **`perf.ts`** | Separate `SLOW QUERY` lines — filter keys only (good) |
| **Tests** | `redactMongoUri`, `formatError` only — **no `log()` / level tests** |

Observability (C1/C2 perf) is **separate** — this track is **logging policy + safety + consistency**, not perf UI.

---

## Review findings (agent fills this section)

> **Status:** 🔴 Template — run Logging agent to complete.

### Call-site inventory (agent completes)

| File | Uses | Level | Redaction concern |
|------|------|-------|-------------------|
| `utils.ts` | `log()` | all | — |
| `config.ts` | `console.log` | info | bypass |
| `connector.ts` | `log()` | info/error | URI redacted |
| `bootstrap.ts` | `log()` | info/error | |
| `withDb.ts` | `log()` | error | message only |
| `write.ts` | `log()` | debug/info/warn | **filter values at debug** |
| `indexService.ts` | `log()` | info/warn | |
| `lifecycle.ts` | `log()` | info/error | URI redacted |
| `registerExports.ts` | `log()` | info | |
| `perf.ts` | `log()` | warn/debug | keys only |

### Policy questions (agent decides)

- [ ] Should **debug** update logs include filter **values** or **keys only** (align with perf)?
- [ ] Should **`config.ts` env line** use `log("info", ...)` instead of `console.log`?
- [ ] Standard prefix: `[CFX-MongoDB]` only or add `[export/collection]` where cheap?
- [ ] Log driver errors — include `error.code` / `errorName` when present?
- [ ] Should `mongodb_log_level` changes require restart (today: read every `log()` call — OK)?

### Known gaps (pre-review seed)

| ID | Gap | Severity |
|----|-----|----------|
| K-G1 | No unit tests for `getLogLevel()` / `log()` filtering | High |
| K-G2 | `console.log` bypass in `config.ts` | Medium |
| K-G3 | Debug filter logging may leak PII in values | High |
| K-G4 | No audit test that connector logs never contain raw password | Medium |
| K-G5 | Inconsistent structure (string concat vs perf format) | Low |
| K-G6 | No documented logging policy for operators | Medium |

### Agent notes

_(Findings from readonly review go here.)_

---

## Target policy (draft — agent refines)

1. **Never log:** full URIs with credentials, document bodies, user identifiers in prod-default levels  
2. **info default:** lifecycle + index summary + export registration  
3. **debug:** filter **keys only** unless ConVar `mongodb_log_verbose_filters 1` (new, default off)  
4. **error:** always on; use `formatError`; optional Mongo error code  
5. **Single entry:** all paths through `log()` — no stray `console.*` in `src/`

Document final policy in **`docs/LOGGING.md`** (new, short).

---

## Implementation phases

### K1 — Review & inventory (~2–3 h)

- [ ] Complete call-site table above
- [ ] Grep `console.` in `src/` — list violations
- [ ] Write **`docs/LOGGING.md`** — operator + maintainer guide
- [ ] Link from CONFIGURATION.md + API.md security section

### K2 — Tests & config fix (~3–5 h)

- [ ] `tests/log.test.ts` — `getLogLevel`, level filtering, invalid ConVar fallback
- [ ] Test: `log("debug", ...)` suppressed when level `info`
- [ ] Replace `config.ts` `console.log` → `log("info", ...)`
- [ ] Test: connector connect log line never contains raw credentials (mock `log` or capture console)

### K3 — Redaction & debug safety (~3–5 h)

- [ ] Change `write.ts` debug line to **keys only** (or gate behind ConVar)
- [ ] Optional: `logDebugFilter(filter)` helper shared with perf
- [ ] Audit `delete` info log — keys only in message
- [ ] Add tests for filter redaction helper if extracted

### K4 — Polish (optional)

- [ ] Structured suffix `[export=find collection=players]` on errors from `withDb` (already has exportName in perf)
- [ ] `config()` export documents effective log level (already exposes `logLevel`)
- [ ] CHANGELOG + audit score update

---

## Success criteria (Audit 3)

| Criterion | Met when |
|-----------|----------|
| Policy doc | `docs/LOGGING.md` merged |
| Tests | `log.test.ts` + redaction regression |
| No bypass | zero `console.log` in `src/` except tests |
| PII safety | debug paths keys-only by default |
| Score | Logging **≥80%** in audit |

---

## Parallel with Track J

| Touch point | Risk | Mitigation |
|-------------|------|------------|
| `withDb.ts` | Both may edit | Logging K4 first; integration adds tests only |
| `connector.ts` | Integration tests assert connect | Logging K3 redaction tests first |
| CI time | +integration job | Logging = unit only, no CI time add |

---

## Out of scope (Track K)

- Perf UI / NUI (OBSERVABILITY-PLAN C3+)
- External log shipping (Loki, ELK)
- Client-side logs

---

## References

- [utils.ts](../../src/utils.ts)
- [OBSERVABILITY-PLAN.md](OBSERVABILITY-PLAN.md) — perf vs logging boundary
- [CONFIGURATION.md](../CONFIGURATION.md) — `mongodb_log_level`
