# Logging — cfx-mongodb

Operator and maintainer guide for structured server logs. For ConVar setup see [CONFIGURATION.md](CONFIGURATION.md).

## ConVar

| ConVar | Default | Values |
|--------|---------|--------|
| `mongodb_log_level` | `info` | `error` \| `warn` \| `info` \| `debug` |

Changes take effect **immediately** on the next log line — no resource restart required:

```cfg
set mongodb_log_level warn
```

Invalid values fall back to `info` (see `getLogLevel()` in `src/utils.ts`).

## Prefix and levels

All messages use the prefix `[CFX-MongoDB]` via `log()` in `src/utils.ts`.

| Level | Typical use |
|-------|-------------|
| `error` | Connection failures, export pipeline errors |
| `warn` | Slow queries (perf), index warnings, parse truncation |
| `info` | Connect/disconnect, environment, successful deletes (keys only) |
| `debug` | Update diagnostics (filter **keys** only), verbose perf |

## PII and secrets policy

**Never log at any level:**

- Full MongoDB filter or document payloads (emails, names, license identifiers)
- Raw MongoDB connection strings with credentials

**Safe patterns:**

- URI logging uses `redactMongoUri()` — credentials become `***:***@`
- Write handlers log `filter_keys=field1,field2` only (aligned with perf slow-query logs)
- Error messages use `formatError()` — driver message text only, no query bodies

**Production default:** `mongodb_log_level info`. Use `debug` only on staging/dev servers.

## What bypasses logging?

Only `log()` in `src/utils.ts` should emit resource logs. Do not add stray `console.log` in `src/` — `config.ts` environment line uses `log("info", …)`.

Slow-query perf lines (`src/perf.ts`) also go through `log()` with `filter_keys=` suffixes.

## Maintainer checklist

When adding a new log line:

1. Use `log(level, msg)` — not `console.*`
2. Never `JSON.stringify(filter)` or full documents
3. For filters, use `extractFilterKeys()` (same as perf)
4. For URIs, use `redactMongoUri()`
5. Add or extend tests in `tests/log.test.ts` for level gating or redaction regressions

## Related docs

- [CONFIGURATION.md](CONFIGURATION.md) — all ConVars
- [API.md](API.md) — export contract and security notes
- [plans/LOGGING-REVIEW-PLAN.md](plans/LOGGING-REVIEW-PLAN.md) — audit track K
