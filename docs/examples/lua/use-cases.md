# FiveM use cases (Lua) — cfx-mongodb

> **Start here for real server scripts** — not only “what parameters does `find` have?”  
> Every `server_export` has an example below. Each flow includes **what happens step by step** before the code.  
> Query operators: [queries.md](queries.md) · Startup: [patterns.md](patterns.md) · Multi-file sample: [../sample-resource/README.md](../sample-resource/README.md)

Typical **collections** on a GTA/FiveM server (names are yours — stay consistent):

| Collection | Stores | Indexed field (example) |
|------------|--------|-------------------------|
| `accounts` | License/Steam row, ban, lastSeen | `identifier` (unique) |
| `characters` | Slot, name, job, position, stats | `identifier` + `slot` (unique compound) |
| `vehicles` | Plate, model, garage, owner char id | `plate` (unique), `characterId` |
| `item_defs` | Static item metadata (weight, label) | `name` |
| `characters.inventory[]` | Items (embedded) | — |
| `characters.clothing[]` | Outfits (embedded) | — |
| `stash` (optional) | Large inventories separate from char doc | `characterId` |

**SQL JOIN analogy (one account, many related rows):**

```text
accounts (1 license)
   └── characters (slot 1, 2, 3…)
          ├── vehicles (many plates per character)
          ├── inventory[] (items — embedded)
          └── clothing[] (outfits — embedded)
```

How to query that tree without SQL: numbered walkthrough in [queries.md §3.7](queries.md#37-nested-fields--join-like-data-account--character--vehicle).

All snippets assume **`cfx-mongodb:ready`** already fired ([patterns.md §1](patterns.md#1-startup--wait-for-ready)).

---

## Export coverage (nothing missing?)

| Export | FiveM example in this doc | Also in |
|--------|:-------------------------:|---------|
| `find` | [Account load](#flow-a--player-joins-load-account) | [snippets.md](snippets.md) |
| `findById` | [Character by id](#flow-b--select-character) | snippets |
| `findAll` | [Garage list](#flow-c--garage-list-vehicles) | [queries.md](queries.md) |
| `insert` | [New character](#flow-b--select-character) | snippets |
| `update` | [Save position](#flow-d--save-character-on-logout) | queries |
| `delete` | [Delete character](#export-reference-delete) | snippets |
| `count` | [Slot limit](#flow-b--select-character) | snippets |
| `getVersion` | [Export reference](#export-reference-getversion) | snippets |
| `isConnected` | [Guard before batch](#export-reference-isconnected) | snippets |
| `ensureIndexes` | [Boot indexes](#export-reference-ensureindexes) | patterns |
| `health` | [Admin check](#export-reference-health) | snippets |
| `config` | [Export reference](#export-reference-config) | snippets |
| `getQueryStats` | [Slow queries](#export-reference-getquerystats) | — |
| `connect` | [Advanced only](#export-reference-connect--disconnect) | API.md |
| `disconnect` | [Advanced only](#export-reference-connect--disconnect) | API.md |
| `getDb` | [Advanced only](#export-reference-getdb) | API.md |

---

## Flow A — Player joins (load account)

**Goal:** First connect → find or create `accounts` row by `identifier` (license/steam).

**What happens:**

1. Read `license:` / `steam:` from FiveM identifiers for `source`.
2. `find` on `accounts` — if found, `update` lastSeen and return row.
3. If not found, `insert` a new account, then `findById` with `insertedId` to return the document.
4. In `playerConnecting`, defer until Mongo is connected; kick with message if account step fails.

Runnable split version: [../sample-resource/server/accounts.lua](../sample-resource/server/accounts.lua).

```lua
local function normalizeIdentifier(src)
  for i = 0, GetNumPlayerIdentifiers(src) - 1 do
    local id = GetPlayerIdentifier(src, i)
    if id and (id:find('license:') == 1 or id:find('steam:') == 1) then
      return id
    end
  end
  return nil
end

local function loadOrCreateAccount(src)
  local identifier = normalizeIdentifier(src)
  if not identifier then
    return nil, 'no_identifier'
  end

  local found = exports['cfx-mongodb']:find('accounts', { identifier = identifier })
  if not found.success then
    return nil, found.error
  end

  if found.data then
    exports['cfx-mongodb']:update('accounts', { identifier = identifier }, {
      ['$set'] = { lastSeen = os.date('!%Y-%m-%dT%H:%M:%SZ'), lastSource = src },
    })
    return found.data, nil
  end

  local created = exports['cfx-mongodb']:insert('accounts', {
    identifier = identifier,
    createdAt = os.date('!%Y-%m-%dT%H:%M:%SZ'),
    banned = false,
    maxCharacters = 3,
  })

  if not created.success then
    return nil, created.error
  end

  return exports['cfx-mongodb']:findById('accounts', created.insertedId).data, nil
end

-- Example hook (your framework may differ):
AddEventHandler('playerConnecting', function(_, _, deferrals)
  local src = source
  deferrals.defer()
  Wait(0)
  if not exports['cfx-mongodb']:isConnected() then
    deferrals.done('Database not ready')
    return
  end
  local account, err = loadOrCreateAccount(src)
  if not account then
    deferrals.done('Account error: ' .. tostring(err))
    return
  end
  deferrals.done()
end)
```

Uses: **`find`**, **`insert`**, **`update`**, **`findById`**, **`isConnected`**.

---

## Flow B — Select character

**Goal:** List characters for account, enforce max slots, create new char.

**What happens:**

1. `findAll` characters for `identifier`, hide soft-deleted (`deleted != true`), project only menu fields.
2. `count` active characters vs `maxCharacters` before allowing creation.
3. `insert` new row with default spawn position and empty `inventory`.
4. `findById` when player picks a character to spawn (load full or partial document).

See [../sample-resource/server/characters.lua](../sample-resource/server/characters.lua).

```lua
local function listCharacters(identifier)
  return exports['cfx-mongodb']:findAll('characters', {
    identifier = identifier,
    deleted = { ['$ne'] = true },
  }, {
    sort = { slot = 1 },
    limit = 10,
    projection = { firstName = 1, lastName = 1, job = 1, slot = 1 },
  })
end

local function canCreateCharacter(identifier, maxSlots)
  local n = exports['cfx-mongodb']:count('characters', {
    identifier = identifier,
    deleted = { ['$ne'] = true },
  })
  if not n.success then return false, n.error end
  return n.data < maxSlots, nil
end

local function createCharacter(identifier, slot, firstName, lastName)
  local ok, err = canCreateCharacter(identifier, 3)
  if not ok then return nil, err or 'slot_limit' end

  local ins = exports['cfx-mongodb']:insert('characters', {
    identifier = identifier,
    slot = slot,
    firstName = firstName,
    lastName = lastName,
    job = 'unemployed',
    position = { x = -269.4, y = -955.3, z = 31.2, heading = 205.0 },
    inventory = {},
    createdAt = os.date('!%Y-%m-%dT%H:%M:%SZ'),
  })

  if not ins.success then return nil, ins.error end
  return ins.insertedId, nil
end

local function loadCharacterById(characterId)
  local doc = exports['cfx-mongodb']:findById('characters', characterId, {
    firstName = 1,
    lastName = 1,
    job = 1,
    position = 1,
    inventory = 1,
  })
  if not doc.success then return nil, doc.error end
  if doc.data == nil then return nil, 'not_found' end
  return doc.data, nil
end
```

Uses: **`findAll`**, **`count`**, **`insert`**, **`findById`**.

---

## Flow C — Garage (list vehicles)

**Goal:** Show owned vehicles for active character; filter by garage.

**What happens:**

1. `findAll` on `vehicles` where `characterId` and `garage` match, skip impounded.
2. `projection` limits fields sent to client (plate, model, fuel).
3. `update` sets `stored = false` when player takes a vehicle out.

See [../sample-resource/server/vehicles.lua](../sample-resource/server/vehicles.lua).

```lua
local function listGarageVehicles(characterId, garageName)
  return exports['cfx-mongodb']:findAll('vehicles', {
    characterId = characterId,
    garage = garageName,
    impounded = { ['$ne'] = true },
  }, {
    sort = { plate = 1 },
    limit = 50,
    projection = { plate = 1, model = 1, fuel = 1, stored = 1 },
  })
end

local function markVehicleOut(plate)
  local res = exports['cfx-mongodb']:update('vehicles', { plate = plate }, {
    ['$set'] = { stored = false, lastTakenOut = os.date('!%Y-%m-%dT%H:%M:%SZ') },
  })
  return res.success and (res.modifiedCount or 0) > 0
end
```

Uses: **`findAll`**, **`update`**.

---

## Flow D — Save character on logout

**Goal:** Persist coords, health, inventory snapshot when player drops.

**What happens:**

1. Read `characterId` from player state (set when they selected a character).
2. Read ped coords/heading and health from the game world.
3. `update` with `$set` on position, health, inventory, `lastPlayed` — success if `modifiedCount > 0`.

Hooked in sample `characters.lua` on `playerDropped`.

```lua
local function saveCharacterState(characterId, coords, health, inventory)
  local res = exports['cfx-mongodb']:update('characters', { _id = characterId }, {
    ['$set'] = {
      position = coords,
      health = health,
      inventory = inventory,
      lastPlayed = os.date('!%Y-%m-%dT%H:%M:%SZ'),
    },
  })
  return res.success and (res.modifiedCount or 0) > 0
end

AddEventHandler('playerDropped', function()
  local src = source
  -- resolve characterId from your session table
  local characterId = Player(src).state.characterId
  if not characterId then return end

  local ped = GetPlayerPed(src)
  local c = GetEntityCoords(ped)
  local heading = GetEntityHeading(ped)

  saveCharacterState(characterId, {
    x = c.x, y = c.y, z = c.z, heading = heading,
  }, GetEntityHealth(ped), {}) -- pass real inventory from your item resource
end)
```

Uses: **`update`**.

---

## Flow E — Items (give / remove in inventory)

**Goal:** Push item into embedded `inventory` array on character (no separate SQL inventory table).

**What happens:**

1. `update` with `$push` adds one entry to `characters.inventory` (or `clothing` for outfits).
2. `update` with `$pull` removes matching entries (same name/count shape).
3. `find` on `item_defs` loads static metadata (weight, label) for UI.
4. For “full outfit”, either embed in `clothing[]` on the character doc or use a separate collection linked by `characterId` (same JOIN idea as vehicles).

See [../sample-resource/server/items.lua](../sample-resource/server/items.lua).

```lua
local function giveItem(characterId, itemName, count)
  return exports['cfx-mongodb']:update('characters', { _id = characterId }, {
    ['$push'] = {
      inventory = { name = itemName, count = count, acquiredAt = os.time() },
    },
  })
end

local function removeItem(characterId, itemName, count)
  return exports['cfx-mongodb']:update('characters', { _id = characterId }, {
    ['$pull'] = {
      inventory = { name = itemName, count = count },
    },
  })
end

-- Static defs (read-only, cache in resource if needed)
local function getItemDef(itemName)
  return exports['cfx-mongodb']:find('item_defs', { name = itemName })
end
```

Uses: **`update`** (`$push` / `$pull`), **`find`**.

---

## Flow F — Store vehicle (insert + unique plate)

**What happens:**

1. `find` by `plate` — if document exists, reject (duplicate plate).
2. `insert` vehicle row linked to `characterId` and `garage`, `stored = true`.

```lua
local function storeVehicle(characterId, plate, model, props, garage)
  local existing = exports['cfx-mongodb']:find('vehicles', { plate = plate })
  if existing.success and existing.data then
    return false, 'plate_taken'
  end

  local ins = exports['cfx-mongodb']:insert('vehicles', {
    characterId = characterId,
    plate = plate,
    model = model,
    props = props,
    garage = garage,
    stored = true,
    fuel = 100,
    createdAt = os.date('!%Y-%m-%dT%H:%M:%SZ'),
  })

  if not ins.success then return false, ins.error end
  return true, ins.insertedId
end
```

Uses: **`find`**, **`insert`**.

---

## Flow G — Ban account (admin)

**What happens:**

1. `update` sets `banned`, reason, optional expiry on `accounts`.
2. `find` on connect (Flow A) can call `isBanned` before allowing join.

```lua
local function setAccountBanned(identifier, reason, untilIso)
  local res = exports['cfx-mongodb']:update('accounts', { identifier = identifier }, {
    ['$set'] = {
      banned = true,
      banReason = reason,
      banUntil = untilIso,
    },
  })
  return res.success and (res.modifiedCount or 0) > 0
end

local function isBanned(identifier)
  local acc = exports['cfx-mongodb']:find('accounts', { identifier = identifier })
  if not acc.success or not acc.data then return false end
  if not acc.data.banned then return false end
  -- optional: check banUntil vs os.time()
  return true
end
```

Uses: **`find`**, **`update`**.

---

## Export reference (quick copy)

One-liner per export. For narrative + tables, see sections above.

### `find`

**What this does:** Return **one** document or `data == nil` — account by identifier, vehicle by plate, item definition by name.

```lua
exports['cfx-mongodb']:find('vehicles', { plate = 'ABC 123' })
```

### `findById`

**What this does:** Same as `find` but by Mongo `_id` string — use after `insert` or when UI passes character/vehicle id.

```lua
exports['cfx-mongodb']:findById('characters', characterId)
```

### `findAll`

**What this does:** Return **array** of documents — garage list, job filters, paginated menus. Always set `limit`.

```lua
exports['cfx-mongodb']:findAll('characters', { job = { ['$in'] = { 'police', 'ems' } } }, { limit = 32 })
```

### `insert`

**What this does:** Create a document; use `insertedId` (string) for later `findById` / player state.

```lua
exports['cfx-mongodb']:insert('vehicles', { plate = 'XYZ 999', model = 'adder', characterId = id })
```

### `update`

**What this does:** Patch matched documents — save position, ban account, add money (`$inc`), add inventory (`$push`). Success: `(modifiedCount or 0) > 0`.

```lua
exports['cfx-mongodb']:update('characters', { _id = id }, { ['$inc'] = { cash = 500 } })
```

### `delete`

**What this does:** Permanently remove one matching document. Missing doc → `success = false`. Prefer soft-delete for player-facing data.

```lua
local del = exports['cfx-mongodb']:delete('vehicles', { plate = 'TEST 001' })
if not del.success then print(del.error) end
```

Soft-delete pattern (preferred for characters):

```lua
exports['cfx-mongodb']:update('characters', { _id = id }, { ['$set'] = { deleted = true } })
```

### `count`

**What this does:** Return number of matching documents without loading rows — character slot limit, statistics.

```lua
exports['cfx-mongodb']:count('vehicles', { characterId = id, stored = true })
```

### `getVersion`

**What this does:** Read cfx-mongodb resource version string (for support logs).

```lua
print('cfx-mongodb', exports['cfx-mongodb']:getVersion())
```

### `isConnected`

**What this does:** Sync check — is the singleton Mongo client connected right now?

```lua
if not exports['cfx-mongodb']:isConnected() then
  print('[my-resource] Mongo down')
  return
end
```

### `ensureIndexes`

**What this does:** Create indexes on your collections (idempotent). Run on `ready` or via `mongodb_init_indexes` in cfg.

```lua
AddEventHandler('cfx-mongodb:ready', function()
  exports['cfx-mongodb']:ensureIndexes('characters', {
    { keys = { identifier = 1, slot = 1 }, options = { unique = true } },
    { keys = { identifier = 1 } },
  })
  exports['cfx-mongodb']:ensureIndexes('vehicles', {
    { keys = { plate = 1 }, options = { unique = true } },
    { keys = { characterId = 1, garage = 1 } },
  })
end)
```

### `health`

**What this does:** Ping Mongo and measure round-trip ms — good for admin `/command` or startup logs.

```lua
local h = exports['cfx-mongodb']:health()
if h.success and h.data.ok then
  print(('Mongo RTT %sms'):format(h.data.rttMs))
end
```

### `config`

**What this does:** Safe runtime settings (env, pool, perf flags) — no connection URL or password.

```lua
local cfg = exports['cfx-mongodb']:config()
if cfg.success then
  print('env', cfg.data.env, 'pool', cfg.data.maxPoolSize)
end
```

### `getQueryStats`

**What this does:** Snapshot of slow-query ring buffer (after `mongodb_perf_enabled 1`) — tuning indexes on staging.

Requires `set mongodb_perf_enabled 1` in cfg first.

```lua
local stats = exports['cfx-mongodb']:getQueryStats()
if stats.success and stats.data.enabled then
  print('slow count', stats.data.aggregates.slowCount)
end
```

### `connect` / `disconnect`

**What this does:** Override URI at runtime — **avoid** in gameplay resources; use `server.cfg` ConVars instead.

### `getDb`

**What this does:** Raw Mongo driver `Db` — bypasses validation and envelopes. Only trusted maintenance tooling.

---

## Tips for hobby developers

1. **One place for DB access** — e.g. `my-framework/server/db.lua` wrapping exports; gameplay scripts call your functions.
2. **Never trust client filters** — build query tables on server from whitelisted fields ([queries.md §6](queries.md#6-whitelist-client-input)).
3. **Store FiveM ids as strings** — `identifier`, `plate`, `insertedId`; `_id` auto-converts.
4. **Prefer soft-delete** for characters/vehicles players expect to recover.
5. **Use `projection`** on `findAll` — do not load full inventories for a menu that only needs names.

Runnable tours: [server.lua](server.lua) (single file) · [../sample-resource/](../sample-resource/README.md) (split by feature) · Operators: [queries.md](queries.md).
