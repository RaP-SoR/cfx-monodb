# Lua consumer patterns — cfx-mongodb

> CTFFramework & Lua resources · API: [../../API.md](../../API.md) · Queries: [queries.md](queries.md) · FiveM flows: [use-cases.md](use-cases.md) · Runnable split resource: [../sample-resource/README.md](../sample-resource/README.md)

Each section explains **why** the pattern exists, then shows Lua you can paste.

---

## 1. Startup — wait for `ready`

**What this does:** `cfx-mongodb` connects on its own `onResourceStart`. Your resource may start before Mongo is usable. The `cfx-mongodb:ready` event fires when connect (and optional index init) finished — only then should you call `find` / `insert` / etc.

```lua
local mongoReady = false

-- Flip flag when the provider is safe for CRUD.
AddEventHandler('cfx-mongodb:ready', function()
  mongoReady = true
end)

-- Use before a batch job if you are not inside the ready handler.
local function waitMongoReady()
  while not mongoReady do Wait(100) end
end
```

**What this does (guard):** Quick check before a long handler — avoids hammering exports while disconnected.

```lua
if not exports['cfx-mongodb']:isConnected() then
  return
end
```

---

## 2. CTFFramework success checks

**What this does:** Exports return `{ success = true/false, ... }` and **never throw**. Your gameplay code must branch; otherwise you treat errors as “no data” or miss failed updates.

| Operation | Check | Meaning |
|-----------|--------|---------|
| **Insert** | `result.success and result.insertedId` | Insert OK; id is always a **string** |
| **Find / findById** | `result.success` then `result.data == nil` | Not found is **not** an error |
| **Update** | `result.success and (result.modifiedCount or 0) > 0` | Matched but unchanged → `modifiedCount == 0` |
| **Delete** | `result.success and result.deletedCount == 1` | Zero deleted → often `success = false` from export |
| **Count** | `result.success` → `result.data` | Number of matching documents |
| **findAll** | `result.success` → `result.data` | Array; may be empty `{}` |

**What this does (helpers):** Reusable predicates for framework-style “did it work?” checks.

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

Operator details: [queries.md](queries.md). FiveM stories: [use-cases.md](use-cases.md).

### `_id` as string

**What this does:** You store and pass Mongo `_id` as a plain string; cfx-mongodb converts valid ObjectIds internally.

```lua
exports['cfx-mongodb']:update('players', { _id = insertedId }, { ['$set'] = { level = 2 } })
exports['cfx-mongodb']:findById('players', insertedId)
```

Prefer **`findById(collection, id)`** when the lookup is only by primary key — clearer and same `data == nil` when missing.

### Whitelist user input

**What this does:** `validateQuery` blocks dangerous operators but **does not** validate field names. Build filters from keys you control, not from raw client JSON.

```lua
-- Good: only server-known keys
local filter = { identifier = playerIdentifier, active = true }

-- Risky: never use raw client payload as filter
-- local filter = json.decode(untrustedPayload)
```

### Updates (auto `$set`)

**What this does:** If you omit `$`-operators, the resource wraps your table as `{ ['$set'] = { ... } }`.

```lua
exports['cfx-mongodb']:update('players', { _id = id }, { level = 10, name = 'x' })

-- Multiple operators in one update:
exports['cfx-mongodb']:update('players', { _id = id }, {
  ['$inc'] = { coins = 1 },
  ['$set'] = { lastSeen = os.date('!%Y-%m-%dT%H:%M:%SZ') },
})
```

---

## 4. Pagination (`findAll`)

**What this does:** Loads a **page** of documents. Default `limit` is 100 (max 1000). Use `skip` for page 2, 3, … — like SQL `LIMIT` / `OFFSET`.

```lua
local page, pageSize = 2, 50

local result = exports['cfx-mongodb']:findAll('players', { active = true }, {
  limit = pageSize,
  skip = (page - 1) * pageSize,
  sort = { name = 1 },
})

if not result.success then
  print(result.error)
  return
end

for _, row in ipairs(result.data) do
  -- row._id is always string in results
end
```

On large collections, filter on **indexed** fields and keep `limit` small for menus and leaderboards.

---

## 5. Indexes

**What this does:** Indexes speed up `find` / `findAll` / `count` on hot fields (`identifier`, `plate`, etc.). Define once at boot — safe to run again (idempotent).

**server.cfg (recommended for shared DB):**

```cfg
set mongodb_init_indexes {"players":[{"keys":{"identifier":1},"options":{"unique":true}}]}
```

**On `ready` from your resource:**

```lua
AddEventHandler('cfx-mongodb:ready', function()
  exports['cfx-mongodb']:ensureIndexes('characters', {
    { keys = { identifier = 1, slot = 1 }, options = { unique = true } },
  })
end)
```

Max **20** index specs per `ensureIndexes` call.

---

## 6. Diagnostics

**What this does:** `health` pings Mongo (RTT). `config` returns safe settings (env, pool, perf flags) — **no passwords or URLs**.

```lua
local health = exports['cfx-mongodb']:health()
local cfg = exports['cfx-mongodb']:config()
```

**What this does (slow queries):** Enable timing in cfg, then inspect ring buffer from server console.

```cfg
set mongodb_perf_enabled 1
set mongodb_perf_slow_ms 150
```

---

## 7. Anti-patterns

| Avoid | Use instead | Why |
|-------|-------------|-----|
| `connect()` in every resource | ConVars in `server.cfg` | One connection for the whole server |
| `getDb()` for normal CRUD | `find` / `insert` / `update` | Envelope + query validation |
| `find` not-found as error | `success` true, `data` nil | Wave 2 / CTFFramework contract |
| Update OK = `matchedCount > 0` | `(modifiedCount or 0) > 0` | No field change → modified 0 |
| Client/NUI calling mongo | Server-only exports | Security |
| Raw client JSON as filter | Whitelist in your script | No automatic schema sandbox |
