-- Flow B + D: character list, create, load by id, save on drop.
-- docs/examples/lua/use-cases.md § Flow B, Flow D

--- List non-deleted characters for one account (menu data).
function SampleListCharacters(identifier)
  SampleWaitMongo()
  return exports['cfx-mongodb']:findAll('characters', {
    identifier = identifier,
    deleted = { ['$ne'] = true },
  }, {
    sort = { slot = 1 },
    limit = 10,
    projection = { firstName = 1, lastName = 1, job = 1, slot = 1 },
  })
end

--- Enforce max character slots before insert.
function SampleCanCreateCharacter(identifier, maxSlots)
  local n = exports['cfx-mongodb']:count('characters', {
    identifier = identifier,
    deleted = { ['$ne'] = true },
  })
  if not n.success then
    return false, n.error
  end
  return n.data < maxSlots, nil
end

function SampleCreateCharacter(identifier, slot, firstName, lastName)
  SampleWaitMongo()

  local ok, err = SampleCanCreateCharacter(identifier, 3)
  if not ok then
    return nil, err or 'slot_limit'
  end

  local ins = exports['cfx-mongodb']:insert('characters', {
    identifier = identifier,
    slot = slot,
    firstName = firstName,
    lastName = lastName,
    job = 'unemployed',
    position = { x = -269.4, y = -955.3, z = 31.2, heading = 205.0 },
    inventory = {},
    clothing = {},
    createdAt = os.date('!%Y-%m-%dT%H:%M:%SZ'),
  })

  if not ins.success then
    return nil, ins.error
  end

  return ins.insertedId, nil
end

function SampleLoadCharacter(characterId)
  SampleWaitMongo()
  local doc = exports['cfx-mongodb']:findById('characters', characterId, {
    firstName = 1,
    lastName = 1,
    job = 1,
    position = 1,
    inventory = 1,
  })
  if not doc.success then
    return nil, doc.error
  end
  if doc.data == nil then
    return nil, 'not_found'
  end
  return doc.data, nil
end

function SampleSaveCharacter(characterId, coords, health, inventory)
  SampleWaitMongo()
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
  local characterId = Player(src).state.characterId
  if not characterId then
    return
  end

  local ped = GetPlayerPed(src)
  local c = GetEntityCoords(ped)
  local heading = GetEntityHeading(ped)

  SampleSaveCharacter(characterId, {
    x = c.x,
    y = c.y,
    z = c.z,
    heading = heading,
  }, GetEntityHealth(ped), {})
end)

-- Demo: /mongosample_char — creates slot 1 if none (server console: src 0 skipped)
RegisterCommand('mongosample_char', function(src)
  if src == 0 then return end
  local identifier = Player(src).state.accountIdentifier
  if not identifier then
    print('[cfx-mongodb-sample] no accountIdentifier on player')
    return
  end

  local id, err = SampleCreateCharacter(identifier, 1, 'Jane', 'Doe')
  if not id then
    print('[cfx-mongodb-sample] create failed', err)
    return
  end

  Player(src).state:set('characterId', id, true)
  print('[cfx-mongodb-sample] characterId', id)
end, false)
