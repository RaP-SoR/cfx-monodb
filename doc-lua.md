# MongoDB API for Lua

English quick guide to use the MongoDB wrapper from Lua in FiveM/RedM.

## Check connection state

```lua
local isConnected = exports['cfx-mongodb']:isConnected()
print('DB connected?', isConnected)
```

## Insert a document

```lua
local playerDoc = {
  identifier = 'steam:123456789',
  name = 'John Smith',
  level = 10,
  inventory = {
    {id = 'revolver', count = 1},
    {id = 'ammo', count = 12}
  }
}

local result = exports['cfx-mongodb']:insert('players', playerDoc)
if result.success then
  print('Inserted with ID:', result.insertedId)
else
  print('Insert error:', result.error)
end
```

## Find documents

```lua
-- List all documents in a collection
local allPlayers = exports['cfx-mongodb']:findAll('players')
if allPlayers.success then
  print(#allPlayers.data, 'players found')
else
  print('Find error:', allPlayers.error)
end

-- With filter and options
local highLevelPlayers = exports['cfx-mongodb']:findAll(
  'players', 
  {level = {['$gt'] = 5}},
  {sort = {level = -1}, limit = 10}
)
```

## Find one document

```lua
local player = exports['cfx-mongodb']:find('players', {identifier = 'steam:123456789'})
if player.success and player.data then
  print('Player found:', player.data.name)
elseif player.success then
  print('Player not found')
else
  print('Find error:', player.error)
end
```

## Update a document

```lua
-- Using operator
local updateResult = exports['cfx-mongodb']:update(
  'players',
  {identifier = 'steam:123456789'},
  {['$set'] = {level = 11}}
)

-- Or partial object (auto-wraps with $set)
local simpleUpdate = exports['cfx-mongodb']:update(
  'players',
  {identifier = 'steam:123456789'},
  {level = 12, lastUpdated = os.time()}
)

if updateResult.success then
  print('Matched:', updateResult.matchedCount)
  print('Modified:', updateResult.modifiedCount)
end
```

## Delete a document

```lua
local deleteResult = exports['cfx-mongodb']:delete(
  'players',
  {identifier = 'steam:123456789'}
)

if deleteResult.success then
  print('Deleted:', deleteResult.deletedCount)
else
  print('Delete error:', deleteResult.error)
end
```

## Return values

All functions (except `isConnected`) return a table with `success`:
- Success: `{ success = true, ... }`
- Error: `{ success = false, error = 'message' }`

### Details by export

- insert: `{ success = true, insertedId = string }`
- findAll: `{ success = true, data = Array<Table> }`
- find: `{ success = true, data = Table|nil }`
- update: `{ success = true, matchedCount = number, modifiedCount = number }`
- delete: `{ success = true, deletedCount = number }`
- isConnected: `boolean`
```
