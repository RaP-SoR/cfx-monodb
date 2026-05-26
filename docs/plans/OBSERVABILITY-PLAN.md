# Observability & Performance Plan — cfx-mongodb

> **Status:** Design only — do not implement until Track A cleanup is done and this plan is reviewed.  
> **Parent:** [MAINTENANCE-ROADMAP.md](MAINTENANCE-ROADMAP.md) Track C

## Problem

Operators and developers want to know:

- How long do CRUD exports take (find, insert, update, …)?
- Which collections/queries are hot?
- Is slowness MongoDB, network, or pool exhaustion?

Today we only have:

| Signal | Where | Limit |
|--------|-------|-------|
| `health()` → `rttMs` | `handlers/admin.ts` | Ping only, not real queries |
| `mongodb_log_level debug` | `utils.log` | Ad-hoc strings, no structure |
| Update filter log | `handlers/write.ts` | Single path, no timing |

Unit tests use **mock DB** — they cannot measure real MongoDB latency.

---

## Operating modes (decision)

Observability and any UI **never run by default on a production game server**. Three explicit modes:

| Mode | Who | ConVars | What runs | Website / UI |
|------|-----|---------|-----------|--------------|
| **Production** | Live server | All `mongodb_perf_*` **off** (default) | Normal CRUD only | **None** — no HTTP, no bundled UI in `cfx-mongodb` |
| **Admin diagnostic** | Server operator | Admin **consciously sets** ConVars (e.g. `mongodb_perf_enabled 1`) | Timing logs + optional in-memory stats / `getQueryStats` | **None inside FiveM** — read server console or call admin export from trusted resource |
| **Development** | Local / CI | Perf ConVars optional | Same as diagnostic + external tooling | **`tools/query-dashboard/`** on localhost only — separate from `dist/index.js`, not deployed to prod |

**Hard rule:** `cfx-mongodb` does **not** embed a website, HTTP server, or static assets in the FiveM resource bundle. Charts/dashboards live in `tools/` for dev machines, or admins use logs/stats when ConVars are enabled.

Production servers stay lean: **zero perf overhead** until an admin opts in via ConVar.

---

## Goals & non-goals

### Goals

1. **Opt-in** observability (ConVar) — zero overhead when disabled
2. **Server-side only** — no client exposure of query data
3. **Redaction** — no full URIs, no large document bodies in logs
4. **Compatible with CTFFramework** — no change to existing export return shapes (unless additive optional export)

### Non-goals

1. **Any UI or HTTP server** inside the FiveM resource (production or admin mode)
2. **Auto-enabling perf** in prod — ConVars default off; admin must switch explicitly
3. **Persistent query store** on disk (complexity, PII, FiveM I/O)
4. **Full MongoDB profiler replacement**
5. **Automatic slow-query killing**

---

## Architecture options (compare)

| Option | Pros | Cons | Verdict |
|--------|------|------|---------|
| **C1 — Debug log timing in `withDb`** | Minimal code, uses existing `log()` | Unstructured; hard to chart | Good **Phase 1** |
| **C2 — In-memory ring buffer + `getQueryStats()` export** | Queryable from server; testable | Memory bound; needs admin export | Good **Phase 2** |
| **C3 — JSON lines to console** | Easy to ship logs to Loki/ELK | noisy; needs external stack | Optional ConVar mode |
| **C4 — Separate Node dev dashboard** | Rich UI, charts | Not in FiveM runtime | **`tools/` only** — localhost dev, never prod bundle |
| **C5 — CI perf job vs real MongoDB** | Regression detection | Needs Mongo service in CI; flaky | Optional CI job |

**Recommendation:** C1 → C2 → optionally C4 as `tools/query-dashboard/` **outside** `dist/index.js`.

---

## Proposed design (phased)

### Phase C1 — Timing wrapper (low risk)

Extend `withDb` (or thin `withDbTimed` used only when enabled):

```typescript
// Pseudocode — not implemented
if (perfEnabled) {
  const t0 = Date.now();
  const result = await op(db);
  record({ op: "withDb", ms: Date.now() - t0, exportName?, collection? });
}
```

**ConVars (draft):**

| ConVar | Default | Description |
|--------|---------|-------------|
| `mongodb_perf_enabled` | `0` | Master switch — **must be `1` for any perf feature** |
| `mongodb_perf_log` | `0` | Log each op at `info` (only if `mongodb_perf_enabled 1`) |
| `mongodb_perf_slow_ms` | `100` | Mark/log slow ops |

When `mongodb_perf_enabled` is `0` (production default), the timing wrapper is a no-op — no buffer, no extra logs, no measurable overhead beyond a single boolean check.

**Log line example (redacted):**

```
[CFX-MongoDB] perf find players 23ms ok
[CFX-MongoDB] perf update players 142ms slow
```

**Changes:** `withDb.ts`, `utils.ts`, `config.ts`, `docs/API.md` Configuration, tests for record helper.

Handlers pass **export name + collection** into wrapper (small signature change internal only).

---

### Phase C2 — Stats export (admin)

New **optional** export (manifest + API.md + contract test):

```typescript
getQueryStats(): {
  success: true;
  data: {
    enabled: boolean;
    samples: Array<{
      export: string;
      collection: string;
      ms: number;
      ok: boolean;
      at: string; // ISO timestamp
    }>;
    aggregates: {
      count: number;
      p50Ms: number;
      p95Ms: number;
      slowCount: number;
    };
  };
}
```

- Ring buffer: last **N** samples (ConVar `mongodb_perf_buffer`, default 100, max 1000)
- Cleared on resource restart
- Category: **Advanced / Internal** (like `getDb`)

---

### Phase C3 — External visualization (development only)

**Never part of the FiveM resource runtime.** Lives under `tools/` and runs on a **developer machine** (or admin workstation tailing logs while diagnostic ConVars are on):

```
tools/
  perf-log-parser/     # Read server console or JSON lines
  query-dashboard/     # Vite SPA — bind 127.0.0.1 only
```

Data flow (dev or admin diagnostic session):

```
FiveM server console  →  file tail / Docker logs  →  parser  →  chart (browser on localhost)
```

Optional: trusted admin resource calls `getQueryStats()` while `mongodb_perf_enabled 1` and forwards to local tooling — still **no server-hosted UI**.

**Production deployment:** do not ship `tools/` to game servers; do not set perf ConVars unless actively debugging.

---

### Phase C4 — CI performance benchmarks (optional)

```yaml
# .github/workflows/perf.yml (optional, manual dispatch)
services:
  mongodb:
    image: mongo:7
```

- Script: `tools/bench/run.ts` — insert/find/update/delete N times against real Mongo
- Thresholds: fail if p95 > X ms (tuned for CI runner, not production)
- **Not** a replacement for production monitoring

---

## Security & privacy

- Log **collection name** + **export name** + **duration** — not full filter objects at `info`
- At `debug`, optional redacted filter hash or keys-only: `{ keys: ["_id", "email"] }`
- Never log document contents
- `getQueryStats` / perf ConVars documented as **server admin only**

---

## Testing strategy

| Layer | Test |
|-------|------|
| Unit | Mock clock; assert ring buffer, percentiles, ConVar off = no op |
| Contract | If `getQueryStats` added → manifest sync test |
| Integration | Manual / CI bench against Mongo (Phase C4) |
| FiveM | Smoke on dev server with `mongodb_perf_enabled 1` |

---

## Documentation deliverables (when implementing)

- `docs/API.md` — new ConVars + optional export
- `docs/GUIDE.md` — troubleshooting slow queries
- `docs/ARCHITECTURE.md` — diagram: handler → withDb → perf recorder
- `docs/examples/` — no change for consumers unless they opt into stats

---

## Open questions (review before code)

1. Is **`getQueryStats` export** acceptable, or stats-only via `config()` extension?
2. Default **`mongodb_perf_slow_ms`** for FiveM game servers?
3. Should perf data include **caller resource name** (`GetInvokingResource()`)? Useful but privacy-sensitive.
4. CI perf job: worth the flake/maintenance?

**Resolved:**

- ~~Embedded website in production?~~ **No** — UI only in `tools/` for dev; prod/admin use ConVar-gated logs + optional stats export only.

---

## Estimated effort

| Phase | Effort |
|-------|--------|
| C1 timing + ConVars | 4–6 h |
| C2 stats export | 4–6 h |
| C3 dev dashboard | 8–16 h (optional, separate folder) |
| C4 CI bench | 4–8 h (optional) |

**Start with C1 only** after Track A cleanup merge.
