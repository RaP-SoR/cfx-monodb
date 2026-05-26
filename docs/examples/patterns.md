# Consumer patterns — cfx-mongodb

> **CTFFramework & third-party resources**  
> Canonical API: [../API.md](../API.md) · Snippets: [typescript.md](typescript.md) · [lua.md](lua.md)

Reusable patterns for correct export usage. These are **consumer-side** conventions — cfx-mongodb enforces envelopes and query safety, but your resource still owns field whitelisting and business logic.

---

## 1. Startup — wait for `ready`

Never call CRUD on consumer `onResourceStart` alone. Wait for **`cfx-mongodb:ready`** (after connect + optional index init).

**TypeScript**

```typescript
let mongoReady = false;

on("cfx-mongodb:ready", () => {
  mongoReady = true;
});

async function whenMongoReady(): Promise<void> {
  while (!mongoReady) {
    await new Promise((r) => setTimeout(r, 100));
  }
}
```

**Lua**

```lua
local mongoReady = false

AddEventHandler('cfx-mongodb:ready', function()
  mongoReady = true
end)

local function waitMongoReady()
  while not mongoReady do Wait(100) end
end
```

Optional guard before each batch:

```typescript
if (!exports["cfx-mongodb"].isConnected()) {
  return { ok: false, reason: "mongo_down" };
}
```

---

## 2. CTFFramework success checks

Exports **never throw**. Always branch on `success` and the fields below.

| Operation | Check | Notes |
|-----------|--------|-------|
| **Insert** | `result.success && result.insertedId` | `insertedId` is always a **string** |
| **Find / findById** | `result.success` then `result.data === null` = not found | Not an error — Wave 2 semantics |
| **Update** | `result.success && (result.modifiedCount ?? 0) > 0` | `matchedCount` alone is not enough |
| **Delete** | `result.success && result.deletedCount === 1` | `deletedCount === 0` → `{ success: false, error: "Document not found" }` |
| **Count** | `result.success` → use `result.data` | |
| **findAll** | `result.success` → `result.data` array (may be empty) | |

**TypeScript helper (optional)**

```typescript
import type { CfxMongoUpdateResult, CfxMongoDeleteResult } from "cfx-mongodb/types";

export function updateOk(r: CfxMongoUpdateResult): boolean {
  return r.success && (r.modifiedCount ?? 0) > 0;
}

export function deleteOk(r: CfxMongoDeleteResult): boolean {
  return r.success && r.deletedCount === 1;
}
```

**Lua**

```lua
local function updateOk(r)
  return r.success and (r.modifiedCount or 0) > 0
end

local function deleteOk(r)
  return r.success and r.deletedCount == 1
end
```

---

## 3. Filter patterns

### `_id` as string

Pass MongoDB `_id` as a **string** in filters — cfx-mongodb converts valid ObjectIds automatically.

```typescript
await exports["cfx-mongodb"].update("players", { _id: insertedId }, { $set: { level: 2 } });
await exports["cfx-mongodb"].findById("players", insertedId);
```

Prefer **`findById(collection, id)`** over `find(collection, { _id: id })` when lookup is by primary key — clearer intent, same not-found semantics.

### Whitelist user input

`validateQuery` blocks dangerous operators (`$where`, `$function`, …) — **not** a schema sandbox. Build filters from known fields only:

```typescript
// Good — fixed keys
const filter = { identifier: playerIdentifier, active: true };

// Risky — passing raw client JSON as filter
// const filter = JSON.parse(untrustedPayload);
```

### Updates

Plain objects are wrapped as `$set`:

```typescript
await exports["cfx-mongodb"].update("players", { _id: id }, { level: 10, name: "x" });
// same as { $set: { level: 10, name: "x" } }
```

Use explicit operators when needed:

```typescript
await exports["cfx-mongodb"].update(
  "players",
  { _id: id },
  { $inc: { coins: 1 }, $set: { lastSeen: new Date().toISOString() } }
);
```

---

## 4. Pagination (`findAll`)

Defaults: `limit` **100**, clamped **1–1000**; `skip` clamped **0–1_000_000**.

```typescript
const page = 2;
const pageSize = 50;

const result = await exports["cfx-mongodb"].findAll(
  "players",
  { active: true },
  { limit: pageSize, skip: (page - 1) * pageSize, sort: { name: 1 } }
);

if (!result.success) {
  console.error(result.error);
  return;
}

for (const row of result.data) {
  // row._id is always string
}
```

For large collections prefer **indexed filter fields** + modest `limit` — avoid unbounded scans from consumer code.

---

## 5. Indexes

**At server boot** — ConVar (recommended for shared collections):

```cfg
set mongodb_init_indexes {"players":[{"keys":{"identifier":1},"options":{"unique":true}}]}
```

**From a consumer on `ready`** — `ensureIndexes` export:

```typescript
on("cfx-mongodb:ready", async () => {
  await exports["cfx-mongodb"].ensureIndexes("characters", [
    { keys: { userId: 1, slot: 1 }, options: { unique: true } },
  ]);
});
```

Max **20** index specs per call; idempotent re-runs are safe.

---

## 6. TypeScript types (CTFFramework)

Runtime lives in the **FiveM resource ZIP**. Types are optional for IDE/checking:

```json
"cfx-mongodb": "file:../cfx-mongodb"
```

```typescript
import type {
  CfxMongoResult,
  CfxMongoInsertResult,
  CfxMongoUpdateResult,
} from "cfx-mongodb/types";
```

Release builds: install matching `.tgz` from the same GitHub Release as the server ZIP — [CONFIGURATION.md](../CONFIGURATION.md#steps-typescript-consumer--npm-tgz-optional).

Lua resources do **not** need the npm package.

---

## 7. Diagnostics (staging / admins)

```typescript
const health = await exports["cfx-mongodb"].health();
const cfg = await exports["cfx-mongodb"].config();
// cfg.data has env, pool sizes, perf flags — no URLs/passwords
```

Slow queries (optional ConVars):

```cfg
set mongodb_perf_enabled 1
set mongodb_perf_slow_ms 150
```

Then `getQueryStats()` for ring-buffer snapshot — see [API.md](../API.md#getquerystats).

---

## 8. Anti-patterns

| Avoid | Use instead |
|-------|-------------|
| `connect()` in every consumer | ConVars once in `server.cfg` |
| `getDb()` for normal CRUD | `find` / `insert` / `update` / … |
| Treat `find` not-found as `success: false` | `success: true`, `data: null` |
| Update success = `matchedCount > 0` | `(modifiedCount ?? 0) > 0` |
| Client-side or `emitNet` for mongo | Server-only exports + `TriggerEvent` |
| Raw user JSON as Mongo filter | Whitelist fields in your resource |

---

## 9. Related docs

| Doc | Topic |
|-----|--------|
| [API.md](../API.md) | Full export reference |
| [CONFIGURATION.md](../CONFIGURATION.md) | Install, ConVars, GitHub ZIP / npm `.tgz` |
| [typescript.md](typescript.md) | Per-export snippets |
| [lua.md](lua.md) | Lua snippets |
| [server.ts](server.ts) / [server.lua](server.lua) | Runnable end-to-end tour |
