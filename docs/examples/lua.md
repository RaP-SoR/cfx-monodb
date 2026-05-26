# Lua Examples — cfx-mongodb

> Full API: [../API.md](../API.md) · Runnable sample: [server.lua](server.lua)

Requires FiveM Node **22** (`node_version '22'`). Wait for `cfx-mongodb:ready` before CRUD.

## Configuration (server.cfg)

```cfg
set mongodb_env dev
set mongodb_dev_url mongodb://localhost:27017/ctf_dev
set mongodb_prod_url mongodb://localhost:27017/ctf_prod
set mongodb_test_url mongodb://localhost:27017/ctf_test
set mongodb_timeout 5000
set mongodb_max_pool 15
set mongodb_min_pool 2
set mongodb_log_level info
set mongodb_init_indexes {"users":[{"keys":{"email":1},"options":{"unique":true}}]}
ensure cfx-mongodb
```

## Events (server)

cfx-mongodb fires lifecycle events with **`TriggerEvent`** (server-local). Use **`AddEventHandler`** — not `emitNet`.

```lua
local mongoReady = false

AddEventHandler('cfx-mongodb:ready', function()
  mongoReady = true
  print('[my-resource] MongoDB ready')
end)

AddEventHandler('cfx-mongodb:connected', function(success)
  print('[my-resource] MongoDB connected:', success)
end)
```

| Event | When |
|-------|------|
| `cfx-mongodb:ready` | After connect + optional index init — **before CRUD** |
| `cfx-mongodb:connected` | After successful connect |

## Connection & diagnostics

```lua
local isConnected = exports['cfx-mongodb']:isConnected()
local version = exports['cfx-mongodb']:getVersion()
local health = exports['cfx-mongodb']:health()
local cfg = exports['cfx-mongodb']:config()
```

## Insert

```lua
local result = exports['cfx-mongodb']:insert('players', {
  identifier = 'steam:123456789',
  name = 'John Smith',
  level = 10,
})

if result.success then
  print('Inserted ID:', result.insertedId) -- string
else
  print('Error:', result.error)
end
```

## Find one

```lua
local player = exports['cfx-mongodb']:find('players', {
  identifier = 'steam:123456789',
})

if not player.success then
  print('Error:', player.error)
elseif player.data == nil then
  -- Not found — success true, data nil (aligned with findById)
  print('No matching document')
else
  print('Found:', player.data.name)
end

local byId = exports['cfx-mongodb']:findById('players', insertedId, { name = 1 })
if byId.success and byId.data then
  print('By ID:', byId.data.name)
end
```

## FindAll

```lua
local all = exports['cfx-mongodb']:findAll('players')

local filtered = exports['cfx-mongodb']:findAll(
  'players',
  { level = { ['$gt'] = 5 } },
  { sort = { level = -1 }, limit = 10, skip = 0, projection = { name = 1 } }
)
```

## Update / delete / count

```lua
local updated = exports['cfx-mongodb']:update(
  'players',
  { _id = '674a1b2c3d4e5f6789012345' },
  { ['$set'] = { level = 11 } }
)

local deleted = exports['cfx-mongodb']:delete('players', {
  _id = '674a1b2c3d4e5f6789012345',
})

local total = exports['cfx-mongodb']:count('players', { active = true })
```

## ensureIndexes (manual)

```lua
exports['cfx-mongodb']:ensureIndexes('users', {
  { keys = { email = 1 }, options = { unique = true } },
})
```

## Return values (summary)

| Export | Success |
|--------|---------|
| `insert` | `{ success = true, insertedId = string }` |
| `find` / `findById` | `{ success = true, data = table \| nil }` |
| `findAll` | `{ success = true, data = table[] }` |
| `update` | `{ success = true, modifiedCount, matchedCount }` |
| `delete` | `{ success = true, deletedCount }` or not-found error |
| `count` | `{ success = true, data = number }` |
| `getVersion` | string (no envelope) |
| `health` | `{ success = true, data = { ok, rttMs } }` |

On error: `{ success = false, error = 'message' }` — exports never throw.

### Advanced / internal

`getDb`, `connect`, `disconnect` bypass envelope and query validation — trusted server resources only. See [API.md](../API.md).
