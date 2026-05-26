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

**Recommendation:** C1 → C2 → **C3b (optional NUI)** for staging/test admins → C4 for local dev → C6 optional CI.

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
| `mongodb_perf_enabled` | `0` | Master switch — timing + buffer |
| `mongodb_perf_log` | `0` | Log each op at `info` (requires `mongodb_perf_enabled 1`) |
| `mongodb_perf_slow_ms` | `100` | Mark/log slow ops |
| `mongodb_perf_ui` | `0` | Enable admin NUI dashboard (requires `mongodb_perf_enabled 1`) |
| `mongodb_perf_ui_ace` | `mongodb.perf_ui` | ACE permission to open UI (draft) |

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

### Phase C3a — External visualization (local dev)

Lives under `tools/` on a **developer machine**:

```
tools/
  perf-log-parser/
  query-dashboard/     # Vite SPA — 127.0.0.1
```

---

### Phase C3b — Optional admin NUI (CEF, ingame)

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

| Phase | Effort |
|-------|--------|
| C1 timing + ConVars | 4–6 h |
| C2 stats export | 4–6 h |
| C3a dev dashboard (`tools/`) | 8–16 h (optional) |
| C3b admin NUI (CEF) | 12–20 h (optional, ConVar + ACE) |
| C4 CI bench | 4–8 h (optional) |

**Start with C1 only** after Track A cleanup merge.
