# Observability & Performance Plan — cfx-mongodb

> **Status:** Design only — **UI & full monitoring: final planning later.**  
> **First implementation target:** MySQL-style **slow query warnings** (ConVar-gated).  
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

### Priority: slow query warnings (MySQL analogy)

Like MySQL’s **`slow_query_log`** / `long_query_time`: log operations that exceed a threshold so admins can tune indexes and queries without a dashboard.

| MySQL | cfx-mongodb (planned) |
|-------|------------------------|
| `slow_query_log` | `mongodb_perf_enabled 1` |
| `long_query_time` (seconds) | `mongodb_perf_slow_ms` (milliseconds) |
| Log line with duration + query | Log: export, collection, duration, `slow` flag — **redacted** filter (keys only at `info`) |

**Default:** all off — no timing until admin opts in.  
**UI / NUI / charts:** deferred — separate planning session; not part of first ship.

---

## Operating modes (decision)

**Default:** all perf/UI ConVars **off** — production behaviour unchanged, no extra overhead.

Admins **decide consciously** via ConVars what to enable. Scale matters:

| Server profile | Typical load | Perf logging | Admin UI (NUI/CEF) |
|----------------|--------------|--------------|---------------------|
| **Production** | 100–200+ players | **Off** (default) | **Off** — UI overhead not appropriate at scale |
| **Staging / test** | ~10–20 players | Optional (`mongodb_perf_enabled 1`) | **Optional** (`mongodb_perf_ui 1`) — ideal for system testing |
| **Local dev** | 0–5 | Optional | `tools/` localhost **or** ingame NUI |

Three modes:

| Mode | Who | ConVars | What runs |
|------|-----|---------|-----------|
| **Production** | Live server | Defaults (`mongodb_perf_*` = `0`) | CRUD only |
| **Admin diagnostic** | Operator | Sets `mongodb_perf_enabled 1` (+ optional `mongodb_perf_ui 1`) | Timing, stats export, optional ingame dashboard |
| **Development** | Local / CI | Optional | Above + `tools/query-dashboard/` on localhost |

**Principle:** Not forbidden — **opt-in**. Admins know their server; documentation must warn clearly: UI + perf collection is useful on small test servers, **not recommended** on high-population live servers.

When all perf ConVars are `0`, timing/UI code paths are no-ops (single boolean check).

---

## Goals & non-goals

### Goals

1. **Opt-in** observability and UI (ConVar) — zero overhead when disabled
2. **Admin choice** — suitable for test/staging (~10–20 players); documented risk at 100+ pop
3. **Server-side data** — stats collected server-side; UI is a view, not a second DB path
4. **Redaction** — no full URIs, no document bodies in logs/UI
5. **Compatible with CTFFramework** — no change to existing export return shapes (additive optional export/UI only)

### Non-goals

1. **Auto-enabling perf or UI** — ConVars default off
2. **UI recommended for high-pop production** — warn, do not block
3. **Persistent query store** on disk
4. **Full MongoDB profiler replacement**
5. **Automatic slow-query killing**
6. **Public/client-facing perf UI** — admin-only (ACE / command gated)

---

## Architecture options (compare)

| Option | Pros | Cons | Verdict |
|--------|------|------|---------|
| **C1 — Debug log timing in `withDb`** | Minimal code, uses existing `log()` | Unstructured; hard to chart | Good **Phase 1** |
| **C2 — In-memory ring buffer + `getQueryStats()` export** | Queryable from server; testable | Memory bound; needs admin export | Good **Phase 2** |
| **C3 — JSON lines to console** | Easy to ship logs to Loki/ELK | noisy; needs external stack | Optional ConVar mode |
| **C4 — External dev dashboard** | Rich UI, charts | Outside FiveM | `tools/` — localhost dev |
| **C5 — Admin NUI (CEF)** | Ingame panel for test servers | Needs client scripts + CEF; load at scale | **Optional Phase C3b** — ConVar + ACE |
| **C6 — CI perf job vs real MongoDB** | Regression detection | CI only | Optional |

**Recommendation (revised):** **C1 slow-query log first** → optional C2 ring buffer / `getQueryStats` → **UI (C3b/C4) later** when monitoring is finalized.

---

## Proposed design (phased)

### Phase C1 — Slow query log (first ship)

MySQL-style: measure each `withDb` operation; **warn when duration ≥ threshold**.

```typescript
// Pseudocode — not implemented
if (perfEnabled) {
  const t0 = Date.now();
  const result = await op(db);
  const ms = Date.now() - t0;
  if (ms >= slowMs) {
    log("warn", `slow query ${exportName} ${collection} ${ms}ms`);
  } else if (perfLogAll) {
    log("debug", `perf ${exportName} ${collection} ${ms}ms`);
  }
}
```

**ConVars (draft):**

| ConVar | Default | Description |
|--------|---------|-------------|
| `mongodb_perf_enabled` | `0` | Master switch — enable timing |
| `mongodb_perf_slow_ms` | `100` | **Slow query threshold** (ms) — log at `warn` when exceeded |
| `mongodb_perf_log_all` | `0` | If `1`, log every op at `debug` (verbose; staging only) |

Legacy name in earlier draft: `mongodb_perf_log` → renamed to `mongodb_perf_log_all` for clarity vs slow-only mode.

**Typical prod/staging config (slow only):**

```cfg
set mongodb_perf_enabled 1
set mongodb_perf_slow_ms 150
# mongodb_perf_log_all 0  → only slow queries appear (warn)
```

**Slow query log line (redacted):**

```
[CFX-MongoDB] SLOW QUERY find players 142ms (threshold 100ms)
[CFX-MongoDB] SLOW QUERY update users 89ms filter_keys=_id,email
```

When `mongodb_perf_enabled` is `0`, no timing — no overhead beyond one boolean check.

**Changes:** `withDb.ts`, `utils.ts`, `config.ts`, `docs/API.md` Configuration, tests for record helper.

Handlers pass **export name + collection** into wrapper (small signature change internal only).

---

### Phase C2 — Stats export (optional, after C1)

Ring buffer + `getQueryStats()` for admins who want aggregates without reading console — still ConVar-gated, no UI required.

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

### Phase C3+ — UI & monitoring (deferred)

**Final planning later** — not part of the first implementation.

Includes:

- **C3a** — `tools/query-dashboard/` (localhost dev)
- **C3b** — Admin NUI/CEF (ConVar `mongodb_perf_ui`, ACE, staging servers)
- Full monitoring dashboards, charts, ingame panels

Depends on C1 slow-query log (+ optional C2 stats) being stable first.

ConVars reserved for later (draft, not implemented yet):

| ConVar | Purpose |
|--------|---------|
| `mongodb_perf_ui` | Enable admin NUI |
| `mongodb_perf_ui_ace` | ACE permission |

---

### Phase C3a — External visualization (local dev) — *deferred*

Lives under `tools/` on a **developer machine**:

```
tools/
  perf-log-parser/
  query-dashboard/     # Vite SPA — 127.0.0.1
```

---

### Phase C3b — Optional admin NUI (CEF, ingame) — *deferred*

For **staging / test servers** (~10–20 players) where admins want ingame visibility without leaving the client.

**Activation:** `mongodb_perf_enabled 1` **and** `mongodb_perf_ui 1` in `server.cfg` — conscious operator decision.

**Implementation sketch:**

```
ui/perf/           # HTML/CSS/JS (CEF) — charts, query table from getQueryStats
client/perf.lua    # Open/close NUI, NUI callbacks (minimal)
server command     # e.g. mongodb_perf_ui — ACE restricted
```

- Data: server polls ring buffer / `getQueryStats()` → `SendNUIMessage` to **admin client only**
- **No** separate Node HTTP server in production path — uses FiveM **NUI/CEF** (Chromium embedded)
- `fxmanifest.lua`: `ui_page` + optional `client_scripts` only when UI bundle is shipped; document that UI is inactive unless ConVars set
- **ACE:** only admins with permission can open panel
- **Not for 100–200 player live servers** — document CPU/memory/CEF cost; startup log warning when `mongodb_perf_ui 1`

**Alternative (cleaner split):** optional sibling resource `cfx-mongodb-monitor` depends on `cfx-mongodb`, holds all UI/client code — keeps core resource `server_only`. Decide during implementation.

**Production deployment:** leave `mongodb_perf_ui 0`; use logs or external tools only if perf is enabled at all.

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
- NUI panel: **ACE-gated**; no query data to non-admin clients
- Log warning on resource start if `mongodb_perf_ui 1`: *"Perf UI enabled — intended for test/staging servers, not high-population production"*

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

- ~~Embedded website in production?~~ **Admin choice via ConVar** — default off; NUI/CEF optional for test/staging (~10–20 players); strongly discouraged at 100+ pop; external `tools/` dashboard for local dev.
- ~~Hard ban on UI in resource?~~ **No** — optional Phase C3b (NUI) or separate monitor resource; core stays lean when ConVars off.

---

## Estimated effort

| Phase | Effort | When |
|-------|--------|------|
| **C1 slow query log** | 4–6 h | After Track A — **first ship** |
| C2 stats export | 4–6 h | Optional after C1 |
| C3+ UI & monitoring | TBD | **Deferred** — finalize plan later |
| C4 CI bench | 4–8 h | Optional |

**Start with C1 only** (MySQL-style slow query warnings).
