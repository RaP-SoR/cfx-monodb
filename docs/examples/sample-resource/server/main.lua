-- Bootstrap: wait for Mongo, register indexes, expose test commands.
-- See docs/examples/lua/use-cases.md for the full narrative.

local mongoReady = false

--- Called by cfx-mongodb after connect (+ optional mongodb_init_indexes).
AddEventHandler('cfx-mongodb:ready', function()
  mongoReady = true
  print('[cfx-mongodb-sample] Mongo ready')

  -- Indexes for collections this sample uses (idempotent).
  exports['cfx-mongodb']:ensureIndexes('accounts', {
    { keys = { identifier = 1 }, options = { unique = true } },
  })
  exports['cfx-mongodb']:ensureIndexes('characters', {
    { keys = { identifier = 1, slot = 1 }, options = { unique = true } },
    { keys = { identifier = 1 } },
  })
  exports['cfx-mongodb']:ensureIndexes('vehicles', {
    { keys = { plate = 1 }, options = { unique = true } },
    { keys = { characterId = 1, garage = 1 } },
  })
end)

--- Block until ready (simple pattern for other server files).
function SampleWaitMongo()
  while not mongoReady do
    Wait(100)
  end
  return exports['cfx-mongodb']:isConnected()
end

--- Optional: admin command to verify DB from in-game console.
RegisterCommand('mongosample_health', function(src)
  if src ~= 0 then return end
  local h = exports['cfx-mongodb']:health()
  print('[cfx-mongodb-sample] health', json.encode(h))
end, true)
