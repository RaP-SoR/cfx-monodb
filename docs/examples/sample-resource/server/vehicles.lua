-- Flow C + F: garage list and store vehicle with unique plate.
-- docs/examples/lua/use-cases.md § Flow C, Flow F

function SampleListGarageVehicles(characterId, garageName)
  SampleWaitMongo()
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

function SampleStoreVehicle(characterId, plate, model, props, garage)
  SampleWaitMongo()

  local existing = exports['cfx-mongodb']:find('vehicles', { plate = plate })
  if existing.success and existing.data then
    return false, 'plate_taken'
  end

  local ins = exports['cfx-mongodb']:insert('vehicles', {
    characterId = characterId,
    plate = plate,
    model = model,
    props = props or {},
    garage = garage,
    stored = true,
    fuel = 100,
    createdAt = os.date('!%Y-%m-%dT%H:%M:%SZ'),
  })

  if not ins.success then
    return false, ins.error
  end

  return true, ins.insertedId
end

function SampleMarkVehicleOut(plate)
  SampleWaitMongo()
  local res = exports['cfx-mongodb']:update('vehicles', { plate = plate }, {
    ['$set'] = {
      stored = false,
      lastTakenOut = os.date('!%Y-%m-%dT%H:%M:%SZ'),
    },
  })
  return res.success and (res.modifiedCount or 0) > 0
end
