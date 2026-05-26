# Security — cfx-mongodb

> **Status:** ✅ **Concept finalized** (2026-05-27) — implement [SECURITY-FIXES-PLAN.md](plans/SECURITY-FIXES-PLAN.md) next (SF-1/SF-2).

Security model and boundaries for **any** CFX server resource (Lua or TypeScript). This resource is a **thin MongoDB adapter** — not a multi-tenant API gateway, WAF, or auth layer.

**Related:** [API.md](API.md#sicherheit) · [LOGGING.md](LOGGING.md) · [validateQuery.ts](../src/validateQuery.ts) · [DOCUMENTATION-AUDIT-2026.md](DOCUMENTATION-AUDIT-2026.md)

---

## Purpose

| Question | Answer |
|----------|--------|
| Who is the trusted caller? | **Server-side code** in other resources — not clients. **Not** automatically “safe”: any resource can call exports; see [Caller context](#caller-context--workload-tiers). |
| What does cfx-mongodb protect? | Worst-case Mongo operators, query size, single-doc writes, URI/PII in logs |
| What must consumers protect? | User input mapping, auth, rate of calls, collection design, broad filters |
| CTFFramework-specific? | **No** — same rules for ESX, QBCore, standalone Lua, or custom TS resources |

---

## Trust model (CFX)

```text
Client  ──X──>  cfx-mongodb exports     (clients never call exports directly)
                    ^
                    │ server-side only
Player data ──>  Your resource  ──>  exports['cfx-mongodb']:find(...)
```

1. **Exports are server-only** (`server_only 'yes'` in `fxmanifest.lua`).
2. **Any resource** on the server can invoke exports — FiveM does not isolate callers. Treat `getDb` / `connect` as **privileged** (bootstrap/admin only).
3. **Consumer resources** must validate player input **before** building filters or documents. cfx-mongodb validates **shape and denylist**, not business rules.

---

## Caller context & workload tiers

The export boundary is **coarse today**: cfx-mongodb does **not** know whether a call is player-driven, vehicle/inventory UI, or a scheduled autosave. FiveM only tells you (optionally) **which resource** invoked the export — not `source`, not “system vs player intent”.

```text
                    ┌─────────────────────────────────────┐
  player event      │  inventory resource               │
  (open stash)  ──> │  ──> 200× update (bug or abuse)   │──> cfx-mongodb
                    └─────────────────────────────────────┘

                    ┌─────────────────────────────────────┐
  cron / 15 min     │  housing-autosave resource          │
  autosave      ──> │  ──> many updates in sequence     │──> cfx-mongodb
                    └─────────────────────────────────────┘
```

Both look identical at the MongoDB layer: **N export calls in a row**.

### What “trusted caller” really means

| Layer | Trust | cfx-mongodb role |
|-------|-------|------------------|
| **Client → server** | Untrusted | Out of scope — clients never call exports |
| **Resource → export** | **Coarse trust** — any `ensure`d resource can call | Same limits for all callers today |
| **Player-triggered path inside resource** | Must be designed in **your** resource | Debounce, caps, batching before export |
| **System job (autosave, boot)** | Higher burst OK — still your resource’s job to batch | No special “system flag” in core today |

**`GetInvokingResource()`** (FiveM) could identify the **resource name** in future perf/logs or optional quotas — it does **not** prove player vs system; a autosave script and an inventory script are both just resources.

### Workload tiers (recommended consumer pattern)

Define tiers in **your** gameplay/admin resources — not in MongoDB documents:

| Tier | Examples | Stricter limits | Typical pattern |
|------|----------|-----------------|-----------------|
| **Player-interactive** | Open inventory, use item, trade | Low burst; short cooldown | Cache in RAM; 1–few exports per action; reject loops |
| **Player-session** | Character select, spawn load | Moderate; once per spawn | Batch reads; session map `source → ids` |
| **System / scheduled** | 15‑min house+vehicle autosave | Higher burst; off-peak OK | Queue + batch; spread over ticks; one doc update where possible |
| **Admin / migration** | Index build, one-off backfill | Controlled window | Direct resource or `getDb` in maintenance mode |

Optional **context flag** (consumer-only, not in cfx-mongodb today):

```lua
-- Illustrative — your wrapper, not a core export
Mongo.savePlayerInventory(source, items)  -- tier = player, max 1 update/doc
Mongo.runAutosaveBatch(batch)             -- tier = system, chunked
```

Core could later add optional quotas per **invoking resource** (ConVar map) — see [SECURITY-FIXES-PLAN SF-5](plans/SECURITY-FIXES-PLAN.md). **Not required for v1.0.0.**

### Configurable limits — operator choice

Limits belong in **two places**, both under **your** control:

| Where | How | Who decides |
|-------|-----|-------------|
| **cfx-mongodb (core)** | ConVars in `server.cfg` — pool, timeout, `findAll` clamp, future optional rate caps | Server owner; change without recompile |
| **Consumer resources** | Constants or ConVars in **your** scripts — per-player cooldown, batch size, autosave interval | Framework / resource author |

**Design principle:** cfx-mongodb documents defaults and hard safety floors (denylist, depth/size). It does **not** lock operators into conservative caps. Want to stress-test or run hot? Raise pool sizes, disable optional quotas, or burst autosave — **your server, your choice**. Optional future rate limits (SF-5) would ship **off by default** and tune via ConVar, same as perf logging.

Consumer-tier limits (player vs system) stay in **your code or your ConVars** — we do not mandate a single policy for all frameworks.

### Deliberate load / “200 item updates” abuse

Two different threats:

| Threat | Who | Example | Mitigation |
|--------|-----|---------|------------|
| **Malicious resource** | Bad `ensure` / leaked script | Loop `update` 10k times | Server cfg: only trusted resources; audit `server.cfg` |
| **Exploit in trusted resource** | Player triggers event spam | Drop item dupe script fires 200 updates/sec | Rate-limit **events** + cap exports per `source`/second in **your** resource |
| **Bug (no malice)** | Autosave + inventory overlap | 15‑min save hits same collections as live play | Separate tiers; stagger jobs; embed/batch writes |

cfx-mongodb **already** limits damage per call (`updateOne`, `findAll` max 1000). It does **not** limit **calls per second** — that is intentional (autosave legitimately bursts). **Player paths** should be stricter in consumer code; **system paths** should **batch**, not bypass all discipline.

**Red flags to handle in consumer design:**

- One network event → unbounded export loop
- Reloading full inventory from DB on every UI tick
- 200 sequential `update` where one `$set` on embedded array or one bulk script would suffice

Document patterns: [DATA-PERF-VALIDATION-PLAN.md](plans/DATA-PERF-VALIDATION-PLAN.md) (bench 200 updates) · [queries.md](examples/lua/queries.md) (embed vs separate collection).

---

## What the core protects today

### Query / update validation (`validateQuery.ts`)

Applied on: **`find`**, **`findAll`**, **`count`** (filter), **`update`** (filter + update doc), **`delete`** (filter).

| Control | Value | On violation |
|---------|-------|--------------|
| Denied operators | `$where`, `$function`, `$expr`, `$jsonSchema`, `$accumulator`, `$regexFind`, `$regexFindAll`, `$out`, `$merge` | `{ success: false, error }` |
| Max nesting depth | **8** | error envelope |
| Max nodes walked | **100** | error envelope |
| Empty update | rejected | error envelope |

**Not a sandbox:** Allowed operators (`$regex`, `$in`, `$gt`, …) can still be dangerous if fed untrusted strings. Consumers must **whitelist fields and values**.

### Write semantics

| Export | Driver op | Mass-write risk |
|--------|-----------|-----------------|
| `update` | `updateOne` | At most **one** document per call |
| `delete` | `deleteOne` | At most **one** document per call |
| `insert` | `insertOne` | One document; **no operator denylist on document body today** |

### Read limits (`findAll`)

| Option | Clamp |
|--------|-------|
| `limit` | 1–**1000** (default 100) |
| `skip` | 0–**1_000_000** |
| Query timeout | `serverSelectionTimeoutMS` from config (AbortController on cursor) |

`find` / `findById` / `count` have no row cap beyond filter match — design queries and indexes in the consumer.

### Connection & pool

| ConVar | Role |
|--------|------|
| `mongodb_*_url` | Credentials — **never** in git; use `exec mongodb.local.cfg` |
| `mongodb_max_pool` | 0–50 (default 10) |
| `mongodb_timeout` | Server selection / findAll abort |

Pool exhaustion from **many concurrent exports** is mitigated by pool size; there is **no per-export or per-resource rate limit** in core.

### Logging

- Mongo URIs redacted in logs (`redactMongoUri`)
- Filter **values** not logged at info/debug — keys only ([LOGGING.md](LOGGING.md))

---

## Known gaps (honest boundaries)

| Gap | Risk | Owner | Planned |
|-----|------|-------|---------|
| **`insert` skips `validateDocument`** | `$`-operators or huge nested docs in insert payload | Core fix candidate | [SECURITY-FIXES-PLAN.md](plans/SECURITY-FIXES-PLAN.md) |
| **No caller ACL on exports** | Any resource can CRUD | Platform / server cfg (`ensure` order, trust resources) | Document only |
| **Collection name = caller string** | Typo or injection into wrong collection | Consumer — never pass raw client input as collection name | Document + examples |
| **No export rate limiting** | Loop calling `findAll` / `update` → load | Consumer — batch, cache, debounce | Optional future ConVar |
| **`getDb()` / raw driver** | Bypasses all validation | Consumer — admin-only | Document only |
| **`connect()` / `disconnect()`** | Runtime URI override; errors via `TriggerEvent`, not envelope | Bootstrap resource only | Document only |
| **`$regex` with user input** | ReDoS / broad match | Consumer — escape or disallow | Document + queries.md |
| **Broad filter** on update/delete | Wrong doc updated/deleted | Consumer — always include `_id` or unique key | patterns.md |

---

## Abuse & “DDoS” in practice

cfx-mongodb runs **inside** your game server process. “DDoS” here means **resource-induced load**, not internet volumetric attacks.

| Scenario | Core behavior | Mitigation |
|----------|---------------|------------|
| Tight loop `findAll` 1000 rows | Each call hits MongoDB; max 1000 docs | Consumer: cache, pagination, cooldown; **tier player** |
| 200 sequential `update` calls | 200 round-trips | Consumer: batch/embed; **rate-limit player events**; system jobs chunked |
| **200 updates from one player action** (deliberate or bug) | Same as above — export layer sees 200 identical-shaped calls | Cap exports per `source`/event in **your** resource; log with perf |
| Many resources connect at once | Single singleton connector | One `ensure cfx-mongodb`; ConVars only |
| Huge filter object | Rejected at 100 nodes / depth 8 | Already limited |
| `ensureIndexes` with bad specs | Index creation load | Admin-only; validate JSON ConVar |

**Staging:** enable `mongodb_perf_enabled 1` and use `getQueryStats` to find hot exports before production.

---

## Consumer checklist (any framework)

Use in **your** resource before calling exports:

1. **Never** pass client/network event args directly into filters or `$regex`.
2. **Whitelist** query fields (e.g. only `license`, `_id`, `accountId`).
3. Prefer **`findById` / filter by `_id`** for updates and deletes.
4. Set explicit **`limit`** on every `findAll` used for UI lists.
5. Do **not** expose wrappers around `getDb`, `connect`, or `disconnect` to gameplay code.
6. Store secrets in **ConVars** or host panel — see [CONFIGURATION.md](CONFIGURATION.md).
7. On errors, check `result.success` — exports do not throw.

Examples: [examples/lua/patterns.md](examples/lua/patterns.md) · [examples/lua/queries.md](examples/lua/queries.md)

---

## Admin / advanced exports

| Export | Validation | Intended use |
|--------|------------|--------------|
| `getDb` | None | Migrations, aggregation (trusted code only) |
| `connect` / `disconnect` | None | Runtime override — rare; prefer ConVars |
| `ensureIndexes` | Index specs | Startup / admin |
| `health` / `config` / `getQueryStats` | Read-only diagnostics | Ops |

If these are callable from too many resources, **any** of them can become a privilege-escalation path to the database.

---

## Pre-stable roadmap (project)

Aligned with release planning — not CTFFramework-specific.

| Step | Work | Status |
|------|------|--------|
| **1** | This document + [SECURITY-FIXES-PLAN.md](plans/SECURITY-FIXES-PLAN.md) | ✅ **Finalized** |
| **2** | Implement agreed fixes on `dev` | After concept sign-off |
| **3** | Manual practice test (account/char flows, any consumer resource) | You |
| **4** | Optional scripts/datasets + perf validation ([DATA-PERF-VALIDATION-PLAN.md](plans/DATA-PERF-VALIDATION-PLAN.md)) | Step 2 track |
| **5** | `integration.yml` green + `yarn gate` | CI |
| **6** | Merge `dev` → `main`, tag **`v1.0.0`** | Stable |
| **7** | Framework-specific test when framework params settle | Post-stable |

New features are **out of scope** until stable; maintenance-only mode after release unless a concrete need appears.

---

## Maintainer invariants

Do not regress without changelog + security review:

- Exports **never throw** — `{ success, error }` envelopes
- Denylist in `validateQuery.ts` stays centralized
- No raw credentials or filter values in logs
- `updateOne` / `deleteOne` semantics preserved (CTFFramework and generic consumers rely on counts)

On export or validation changes: `yarn doc-audit` · `yarn scout` · update this doc.

---

## References

| Doc | Topic |
|-----|-------|
| [plans/SECURITY-FIXES-PLAN.md](plans/SECURITY-FIXES-PLAN.md) | Concrete fixes after concept |
| [plans/DATA-PERF-VALIDATION-PLAN.md](plans/DATA-PERF-VALIDATION-PLAN.md) | Scripts, datasets, perf step 2 |
| [plans/PRE-STABLE-ROADMAP.md](plans/PRE-STABLE-ROADMAP.md) | Path to `main` |
| [plans/QUALITY-AUDIT-2026.md](plans/QUALITY-AUDIT-2026.md) | Maturity scores |
