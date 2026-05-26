# Query & filter cookbook (Lua) — cfx-mongodb

> **Lua only** — copy-paste filters and updates  
> API: [../../API.md](../../API.md) · Snippets: [snippets.md](snippets.md) · Patterns: [patterns.md](patterns.md)

Filters are **Lua tables** passed to `find`, `findAll`, `count`, `update`, and `delete`. There is no SQL `WHERE` string.

**How to read this doc:** Each subsection has a short **“What this does”** line, then copy-paste Lua. For full FiveM flows (account, garage, inventory), see [use-cases.md](use-cases.md). For a multi-file resource layout, see [../sample-resource/README.md](../sample-resource/README.md).

Wait for **`cfx-mongodb:ready`** before running these — [patterns.md §1](patterns.md#1-startup--wait-for-ready).

## Lua syntax reminder

| Need | Write |
|------|--------|
| Export call | `exports['cfx-mongodb']:find('col', filter)` |
| Operator key `$gt` | `{ ['$gt'] = 5 }` inside field table |
| Top-level `$and` | `{ ['$and'] = { { ... }, { ... } } }` |
| Debug result | `print(json.encode(result))` |
| Not found | `result.data == nil` (not an error) |

---

## 1. MySQL ↔ MongoDB

| MySQL | cfx-mongodb (Lua) |
|-------|-------------------|
| `LIMIT 10` | `findAll('col', filter, { limit = 10 })` — default limit **100**, max **1000** |
| `OFFSET 20` | `{ skip = 20 }` |
| `SELECT col1` | `{ projection = { col1 = 1 } }` |
| `WHERE id = ?` | `findById('col', id)` or `{ _id = id }` |
| `COUNT(*)` | `count('col', filter)` |
| `JOIN` | **Not via exports** — embed or second query ([§8](#8-kein-join)) |

Use **`find`** / **`findById`** for one document. Use **`findAll`** with **filter + limit** for lists.

---

## 2. Allowed vs blocked operators

**What this does:** cfx-mongodb walks your filter/update tables and rejects dangerous Mongo operators. Normal gameplay queries (`$in`, `$gte`, …) are fine.

| Blocked | Allowed (examples) |
|---------|-------------------|
| `$where`, `$function`, `$expr`, `$jsonSchema`, `$accumulator`, `$regexFind`, `$regexFindAll`, `$out`, `$merge` | `$gt`, `$gte`, `$in`, `$and`, `$or`, `$set`, `$inc`, `$push`, … |

Full denylist: [../../API.md](../../API.md). Max depth **8**, max **100** nodes — else `{ success = false, error = '...' }`.

**What this does (blocked example):** Server-side expression filters are denied — you get `success = false` instead of running arbitrary logic in Mongo.

```lua
local bad = exports['cfx-mongodb']:find('players', {
  ['$expr'] = { ['$gt'] = { '$level', 10 } },
})
-- success false: Operator not allowed: $expr
```

Whitelist fields from clients — validation is **not** a schema sandbox.

---

## 3. Read filters

### 3.1 Equality

**What this does:** Match documents where fields equal exact values — typical “load player by steam/license” or “vehicle by plate”.

**Steps:**

1. Build a table `{ field = value }`.
2. Call `find` (one row) or `findAll` (many rows).
3. Check `result.success`, then `result.data` (nil = not found for `find`).

```lua
local one = exports['cfx-mongodb']:find('players', {
  identifier = 'steam:110000100000000',
  active = true,
})
```

### 3.2 Comparisons

**What this does:** Filter numeric ranges (level, money) or exclude a status (`$ne` = not equal).

```lua
local veterans = exports['cfx-mongodb']:findAll('players', {
  level = { ['$gte'] = 10, ['$lte'] = 99 },
}, { sort = { level = -1 }, limit = 50 })

local notBanned = exports['cfx-mongodb']:findAll('players', {
  status = { ['$ne'] = 'banned' },
})
```

### 3.3 `$in` / `$nin`

**What this does:** Match job/role in a list (`$in`) or exclude groups (`$nin`) — e.g. staff jobs or “not impounded”.

**Steps:**

1. Put allowed values in a Lua array `{ 'police', 'ems' }`.
2. Use `{ field = { ['$in'] = array } }` inside the filter.
3. Combine with other keys (e.g. `active = true`) in the same filter table.

```lua
local staff = exports['cfx-mongodb']:findAll('players', {
  job = { ['$in'] = { 'police', 'ems', 'mechanic' } },
})

local outsiders = exports['cfx-mongodb']:findAll('players', {
  job = { ['$nin'] = { 'police', 'ems' } },
  active = true,
})
```

### 3.4 `$and` / `$or`

**What this does:** Combine rules in one query instead of filtering in Lua after a huge `findAll`.

```lua
local eligible = exports['cfx-mongodb']:findAll('players', {
  ['$and'] = {
    { active = true },
    { level = { ['$gte'] = 5 } },
    { ['$or'] = {
      { vip = true },
      { playtimeHours = { ['$gte'] = 100 } },
    } },
  },
}, { limit = 100, projection = { identifier = 1, name = 1, level = 1 } })
```

### 3.5 `$exists`

**What this does:** Only documents that have (or miss) a field — e.g. accounts with email set.

```lua
local withEmail = exports['cfx-mongodb']:findAll('users', {
  email = { ['$exists'] = true },
})
```

### 3.6 `$regex` (slow on large collections)

**What this does:** Text search on a field. Works, but does not scale like an indexed exact match — always add `limit`.

```lua
local matches = exports['cfx-mongodb']:findAll('players', {
  name = { ['$regex'] = '^John', ['$options'] = 'i' },
}, { limit = 20, projection = { name = 1, identifier = 1 } })
```

### 3.7 Nested fields + “JOIN-like” data (account → character → vehicle)

**SQL mental model (FiveM):**

```text
accounts (1)  ──<  characters (many)     e.g. 3 slots per license
characters (1) ──<  vehicles (many)      garage per character
characters (1) ──<  items / clothing      often embedded array on character
```

MongoDB has **no** `JOIN` export. You model the same relationships in two ways:

| Approach | When | How it feels like SQL |
|----------|------|------------------------|
| **Separate collections** | Many vehicles/items per character, large lists | `SELECT * FROM vehicles WHERE characterId = ?` → `findAll('vehicles', { characterId = id })` |
| **Embedded arrays** | Small lists always loaded with character (outfit, pockets) | `character.clothing[]` in one document — dot notation / `$elemMatch` |
| **Foreign key field** | Link rows like SQL | `characters.identifier` = account license; `vehicles.characterId` = char `_id` |

**What happens (load full “join” for one spawned character):**

1. You already have `account.identifier` from connect (Flow A).
2. `find` or `findById` the **character** the player selected.
3. `findAll` **vehicles** where `characterId = character._id` (garage menu).
4. Read **items/clothing** from `character.inventory` / `character.clothing` (embedded) **or** `findAll('stash', { characterId })` if separate.
5. Optional: `find` **account** again if you need ban/maxSlots from parent row.

**Step 1–2 — Parent + child by foreign key (like SQL `WHERE account_id = ?`):**

```lua
local identifier = 'license:abc123' -- from player connect

-- All characters for this account (like JOIN accounts → characters)
local chars = exports['cfx-mongodb']:findAll('characters', {
  identifier = identifier,
  deleted = { ['$ne'] = true },
}, { sort = { slot = 1 }, limit = 10 })

if not chars.success then return end

local characterId = chars.data[1]._id -- player picked slot 1 in your UI
```

**Step 3 — Children in another collection (vehicles per character):**

```lua
local vehicles = exports['cfx-mongodb']:findAll('vehicles', {
  characterId = characterId,
  stored = true,
}, {
  projection = { plate = 1, model = 1, garage = 1 },
  limit = 50,
})
```

**Step 4a — Embedded “join” (items/clothing on character document):**

```lua
local char = exports['cfx-mongodb']:findById('characters', characterId, {
  inventory = 1,
  clothing = 1,
})

-- Dot notation filter: characters with expensive equipped watch
local rich = exports['cfx-mongodb']:find('characters', {
  ['clothing.watch.model'] = 'luxury_gold',
})
```

**Step 4b — Nested stats / cash (dot keys, still one document):**

```lua
local highStats = exports['cfx-mongodb']:find('characters', {
  ['stats.level'] = { ['$gte'] = 50 },
  ['inventory.cash'] = { ['$gte'] = 1000 },
})
```

**Step 5 — Batch “join” for many IDs (`$in`, keep list small):**

```lua
local ids = {} -- gather character _id strings from a menu
local batch = exports['cfx-mongodb']:findAll('characters', {
  _id = { ['$in'] = ids },
}, { projection = { firstName = 1, lastName = 1 } })
```

Full flows: [use-cases.md](use-cases.md) · Sample layout: [../sample-resource/](../sample-resource/README.md).

### 3.8 Arrays

**What this does:** Match values inside arrays (roles) or objects in arrays (`$elemMatch` for inventory lines).

```lua
-- array contains value
exports['cfx-mongodb']:find('players', { roles = 'admin' })

-- array of objects
exports['cfx-mongodb']:find('players', {
  items = { ['$elemMatch'] = {
    itemId = 'weapon_pistol',
    qty = { ['$gte'] = 1 },
  } },
})
```

### 3.9 Dates and time zones (UTC + EU / US / Asia)

**Rule for MongoDB:** Store and compare **UTC ISO-8601 strings** (`...Z`) or Unix epoch — same format on insert and in filters.

**What happens (recommended daily pattern):**

1. On **insert/update**, set `createdAt = os.date('!%Y-%m-%dT%H:%M:%SZ')` (UTC).
2. For “last 24 hours”, compute `since` in UTC and use `$gte` (works worldwide).
3. For “start of today in Germany/US/Japan”, convert local midnight → UTC once, then query (see helpers below).
4. Show local time in UI/NUI on the client — server DB stays UTC.

**Step 1–2 — Last 24 hours (no timezone math):**

```lua
local since = os.date('!%Y-%m-%dT%H:%M:%SZ', os.time() - 86400)

local recent = exports['cfx-mongodb']:findAll('audit_log', {
  createdAt = { ['$gte'] = since },
}, { sort = { createdAt = -1 }, limit = 100 })
```

**Step 3 — Fixed offsets (copy-paste; adjust for DST in production):**

| Region | Zone (example) | Offset from UTC | Seconds |
|--------|----------------|-----------------|---------|
| **EU** Germany / France / Spain | CET (winter) | +1 h | `3600` |
| **EU** Germany (summer) | CEST | +2 h | `7200` |
| **EU** UK (winter) | GMT | +0 h | `0` |
| **EU** UK (summer) | BST | +1 h | `3600` |
| **US** East (New York winter) | EST | −5 h | `-18000` |
| **US** East (summer) | EDT | −4 h | `-14400` |
| **US** West (Los Angeles winter) | PST | −8 h | `-28800` |
| **US** West (summer) | PDT | −7 h | `-25200` |
| **Asia** Japan | JST | +9 h | `32400` |
| **Asia** China / Singapore | CST | +8 h | `28800` |
| **Asia** UAE | GST | +4 h | `14400` |
| **Asia** India | IST | +5 h 30 m | `19800` |

```lua
-- Pick ONE offset for “local calendar day” queries (examples use winter values)
local OFFSET_EU_CET = 3600
local OFFSET_US_EAST = -18000
local OFFSET_US_WEST = -28800
local OFFSET_ASIA_TOKYO = 32400
local OFFSET_ASIA_SHANGHAI = 28800
local OFFSET_ASIA_INDIA = 19800

--- UTC ISO “now” (always safe to store in Mongo).
local function isoUtcNow()
  return os.date('!%Y-%m-%dT%H:%M:%SZ')
end

--- Start of “today” in a fixed offset, returned as UTC ISO for filters.
local function startOfLocalDayUtcIso(offsetSeconds)
  local now = os.time()
  local localNow = now + offsetSeconds
  local startLocal = localNow - (localNow % 86400)
  return os.date('!%Y-%m-%dT%H:%M:%SZ', startLocal - offsetSeconds)
end

-- 1) EU: audit log since midnight Central European (CET winter)
local sinceEu = startOfLocalDayUtcIso(OFFSET_EU_CET)
exports['cfx-mongodb']:findAll('audit_log', { createdAt = { ['$gte'] = sinceEu } }, { limit = 200 })

-- 2) US East: daily leaderboard reset boundary
local sinceUsEast = startOfLocalDayUtcIso(OFFSET_US_EAST)
exports['cfx-mongodb']:findAll('leaderboard', { seasonDay = { ['$gte'] = sinceUsEast } }, { limit = 100 })

-- 3) US West
local sinceUsWest = startOfLocalDayUtcIso(OFFSET_US_WEST)

-- 4) Asia Tokyo
local sinceTokyo = startOfLocalDayUtcIso(OFFSET_ASIA_TOKYO)

-- 5) Asia Shanghai / Beijing
local sinceShanghai = startOfLocalDayUtcIso(OFFSET_ASIA_SHANGHAI)

-- 6) Asia India (IST +5:30)
local sinceIndia = startOfLocalDayUtcIso(OFFSET_ASIA_INDIA)
```

**Step 4 — Insert with explicit UTC timestamp:**

```lua
exports['cfx-mongodb']:insert('characters', {
  identifier = 'license:abc',
  slot = 1,
  createdAt = isoUtcNow(),
  lastPlayed = isoUtcNow(),
})
```

Copy-ready module: [datetime-helpers.lua](datetime-helpers.lua).  
DST changes twice per year — for exact `Europe/Berlin` / `America/New_York` rules use a timezone library or store **UTC only** and convert in UI.

### 3.10 `_id` / `findById`

**What this does:** Update or load one document when you already have its Mongo id string from a previous `insert` or menu selection.

```lua
exports['cfx-mongodb']:update('players', { _id = insertedId }, {
  ['$set'] = { level = 2 },
})

local doc = exports['cfx-mongodb']:findById('players', insertedId, { name = 1, level = 1 })
```

### 3.11 `count` + paginated `findAll`

**What this does:** `count` for UI totals (slot limit); `findAll` with `limit`/`skip` for the actual page of rows.

```lua
local total = exports['cfx-mongodb']:count('players', { active = true })
if not total.success then return end

local pageSize = 25
local page = exports['cfx-mongodb']:findAll('players', { active = true }, {
  limit = pageSize,
  skip = 0,
  sort = { name = 1 },
})
```

---

## 4. Update operators

**What this does:** Change documents matched by the filter. Plain fields become `$set`; use `$inc` / `$push` for counters and arrays.

Without `$` keys → auto **`$set`**.

```lua
exports['cfx-mongodb']:update('players', { _id = id }, { level = 10, name = 'Ada' })

exports['cfx-mongodb']:update('players', { _id = id }, {
  ['$set'] = { ['stats.xp'] = 0 },
})
```

**What this does:** Increment money and set a timestamp in one round-trip.

```lua
exports['cfx-mongodb']:update('players', { identifier = 'steam:110000100000000' }, {
  ['$inc'] = { coins = 50 },
  ['$set'] = { lastSeen = os.date('!%Y-%m-%dT%H:%M:%SZ') },
})

exports['cfx-mongodb']:update('players', { _id = id }, {
  ['$unset'] = { tempFlag = '' },
})
```

**What this does:** Append to an array field (roles, inventory) without reading the full document first.

```lua
exports['cfx-mongodb']:update('players', { _id = id }, {
  ['$push'] = { roles = 'vip' },
})

exports['cfx-mongodb']:update('players', { _id = id }, {
  ['$pull'] = { roles = 'vip' },
})
```

Update success: `(modifiedCount or 0) > 0` — [patterns.md §2](patterns.md#2-ctfframework-success-checks).

---

## 5. `findAll` options (LIMIT / OFFSET)

**What this does:** Control how many rows come back and which fields — essential for garage lists and leaderboards.

```lua
local page, pageSize = 3, 50

local rows = exports['cfx-mongodb']:findAll('players', {
  active = true,
  season = '2026-s1',
}, {
  limit = pageSize,
  skip = (page - 1) * pageSize,
  sort = { score = -1 },
  projection = { identifier = 1, name = 1, score = 1 },
})
```

---

## 6. Whitelist client input

**What this does:** Turn NUI/`emitNet` payload into a **safe** filter — only allowed jobs and numeric level ranges reach Mongo.

```lua
local allowedJobs = { police = true, ems = true, civilian = true }

local function buildPlayerFilter(job, minLevel)
  local filter = { active = true }
  if job and allowedJobs[job] then
    filter.job = job
  end
  if type(minLevel) == 'number' and minLevel >= 0 and minLevel <= 200 then
    filter.level = { ['$gte'] = minLevel }
  end
  return filter
end

local result = exports['cfx-mongodb']:findAll(
  'players',
  buildPlayerFilter(payload.job, payload.minLevel),
  { limit = 50 }
)
```

---

## 7. Performance tips

1. Index fields you filter/sort on (`ensureIndexes` / `mongodb_init_indexes`).
2. Always set **`limit`** on player-facing `findAll`.
3. Use **`projection`** to skip large sub-tables (`inventory`, vehicles).
4. Use **`count`** instead of loading all rows for totals.
5. Avoid `findAll('col', {})` on huge collections — add `active`, date, or season.
6. Prefer exact match over `$regex` on big data sets.
7. One **`find`** per player lookup — not `findAll` + loop in Lua.
8. Staging: `mongodb_perf_enabled` + `getQueryStats()` — [../../API.md](../../API.md).

---

## 8. Relationships without SQL JOIN

**What this does:** Replace SQL `JOIN` with **linked collections** + optional **embedded arrays**. See [§3.7](#37-nested-fields--join-like-data-account--character--vehicle) for the full tree.

| SQL idea | Mongo pattern |
|----------|----------------|
| `accounts JOIN characters` | Same `identifier` on both; `findAll('characters', { identifier })` |
| `characters JOIN vehicles` | `vehicles.characterId = character._id` |
| Items on character | `character.inventory[]` embedded or `findAll` on `stash` |
| Load parent from child | `findById('accounts', …)` after `find` character |

**What happens (account → character → account metadata):**

1. `find` character by `characterId`.
2. Read `character.identifier` (foreign key to account).
3. `find` account row for ban / maxSlots.

```lua
local char = exports['cfx-mongodb']:findById('characters', characterId)
if not char.success or not char.data then return end

local account = exports['cfx-mongodb']:find('accounts', {
  identifier = char.data.identifier,
})
```

---

## 9. Quick index (Lua)

| Goal | Example |
|------|---------|
| Exact | `{ field = 'value' }` |
| Greater | `{ field = { ['$gt'] = n } }` |
| Range | `{ field = { ['$gte'] = a, ['$lte'] = b } }` |
| In list | `{ field = { ['$in'] = { 'a', 'b' } } }` |
| AND | `{ ['$and'] = { {...}, {...} } }` |
| Paginate | `findAll(col, filter, { limit = n, skip = s, sort = { f = -1 } })` |
| Increment | `update(col, filter, { ['$inc'] = { n = 1 } })` |

TypeScript examples: [../typescript/queries.md](../typescript/queries.md).
