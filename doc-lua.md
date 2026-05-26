# MongoDB API for Lua

> Full reference: [docs/API.md](docs/API.md)

Requires FiveM Node **22** (`node_version '22'`). Wait for `cfx-mongodb:ready` before CRUD calls.

## Events (server)

cfx-mongodb fires lifecycle events with **`TriggerEvent`** (server-local). Use **`AddEventHandler`** — not `emitNet` or client `RegisterNetEvent`.

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
| `cfx-mongodb:ready` | After connect + optional index init — **use this before CRUD** |
| `cfx-mongodb:connected` | After successful connect (earlier than `ready`) |

## Check connection

```lua
local isConnected = exports['cfx-mongodb']:isConnected()
local version = exports['cfx-mongodb']:getVersion()
print('Connected:', isConnected, 'Version:', version)
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

## Find documents

```lua
local all = exports['cfx-mongodb']:findAll('players')

local filtered = exports['cfx-mongodb']:findAll(
  'players',
  { level = { ['$gt'] = 5 } },
  { sort = { level = -1 }, limit = 10, skip = 0 }
)
```

## Find one

```lua
local player = exports['cfx-mongodb']:find('players', {
  identifier = 'steam:123456789',
})

if player.success and player.data then
  print('Found:', player.data.name)
elseif not player.success then
  print('Error:', player.error)
end

local byId = exports['cfx-mongodb']:findById('players', insertedId, { name = 1 })
if byId.success and byId.data then
  print('By ID:', byId.data.name)
end
```

## Update

```lua
local result = exports['cfx-mongodb']:update(
  'players',
  { _id = '674a1b2c3d4e5f6789012345' },
  { ['$set'] = { level = 11 } }
)

if result.success then
  print('Modified:', result.modifiedCount)
end
```

## Delete

```lua
local result = exports['cfx-mongodb']:delete('players', {
  _id = '674a1b2c3d4e5f6789012345',
})

if result.success then
  print('Deleted:', result.deletedCount)
end
```

## Count

```lua
local result = exports['cfx-mongodb']:count('players', { active = true })
if result.success then print('Count:', result.data) end
```

## Return values

| Export | Success |
|--------|---------|
| `insert` | `{ success = true, insertedId = string }` |
| `findAll` | `{ success = true, data = table[] }` |
| `find` | `{ success = true, data = table }` |
| `findById` | `{ success = true, data = table\|nil }` |
| `update` | `{ success = true, modifiedCount = number, matchedCount = number }` |
| `delete` | `{ success = true, deletedCount = number }` |
| `count` | `{ success = true, data = number }` |
| `getVersion` | string (no envelope) |
| `isConnected` | boolean |
| `ensureIndexes` | `{ success = true, data = number }` |
| `health` | `{ success = true, data = { ok, rttMs } }` |
| `config` | `{ success = true, data = table }` (no secrets/URLs) |

On error: `{ success = false, error = 'message' }` — exports never throw.

### Advanced / Internal (security warning)

`getDb`, `connect`, and `disconnect` bypass the normal CRUD envelope and query validation. Use only in trusted server resources — not from client-triggered code.

| Export | Notes |
|--------|-------|
| `getDb` | Returns driver `Db` or nil (no envelope) |
| `connect` | Runtime URI override |
| `disconnect` | Close connection |
