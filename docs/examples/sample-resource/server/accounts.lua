-- Flow A: resolve license/steam identifier, find or insert accounts row.
-- docs/examples/lua/use-cases.md § Flow A

local function normalizeIdentifier(src)
  for i = 0, GetNumPlayerIdentifiers(src) - 1 do
    local id = GetPlayerIdentifier(src, i)
    if id and (id:find('license:') == 1 or id:find('steam:') == 1) then
      return id
    end
  end
  return nil
end

--- Returns account table or nil, err string.
function SampleLoadOrCreateAccount(src)
  SampleWaitMongo()

  local identifier = normalizeIdentifier(src)
  if not identifier then
    return nil, 'no_identifier'
  end

  -- One document per player identity.
  local found = exports['cfx-mongodb']:find('accounts', { identifier = identifier })
  if not found.success then
    return nil, found.error
  end

  if found.data then
    -- Touch lastSeen; ignore update errors for sample simplicity.
    exports['cfx-mongodb']:update('accounts', { identifier = identifier }, {
      ['$set'] = {
        lastSeen = os.date('!%Y-%m-%dT%H:%M:%SZ'),
        lastSource = src,
      },
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

  local row = exports['cfx-mongodb']:findById('accounts', created.insertedId)
  if not row.success or not row.data then
    return nil, row.error or 'reload_failed'
  end

  return row.data, nil
end

AddEventHandler('playerConnecting', function(_, _, deferrals)
  deferrals.defer()
  Wait(0)

  if not exports['cfx-mongodb']:isConnected() then
    deferrals.done('Database not ready (cfx-mongodb)')
    return
  end

  local account, err = SampleLoadOrCreateAccount(source)
  if not account then
    deferrals.done('Account error: ' .. tostring(err))
    return
  end

  -- Store for character module (your framework may use exports or global state).
  Player(source).state:set('accountIdentifier', account.identifier, true)
  deferrals.done()
end)
