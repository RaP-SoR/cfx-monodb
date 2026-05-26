-- Minimal Lua consumer for cfx-mongodb.
-- Use with fxmanifest-lua-example.lua.
-- server.cfg: ensure cfx-mongodb BEFORE this resource.

AddEventHandler('cfx-mongodb:ready', function()
  if not exports['cfx-mongodb']:isConnected() then
    print('[example-lua] isConnected=false after ready event')
    return
  end

  local version = exports['cfx-mongodb']:getVersion()
  print('[example-lua] getVersion', version)

  local health = exports['cfx-mongodb']:health()
  print('[example-lua] health', json.encode(health))

  exports['cfx-mongodb']:ensureIndexes('users', {
    { keys = { email = 1 }, options = { unique = true } },
    { keys = { createdAt = -1 } },
  })

  local ins = exports['cfx-mongodb']:insert('users', {
    email = 'user@example.com',
    createdAt = os.time(),
    active = true,
  })
  print('[example-lua] insert', json.encode(ins))

  if not ins.success or not ins.insertedId then
    print('[example-lua] insert failed', ins.error or 'unknown')
    return
  end

  local one = exports['cfx-mongodb']:find('users', { email = 'user@example.com' })
  print('[example-lua] find', json.encode(one))

  local missing = exports['cfx-mongodb']:find('users', { email = '__no_such_user__' })
  if missing.success and missing.data == nil then
    print('[example-lua] find not-found: success true, data nil')
  end

  local byId = exports['cfx-mongodb']:findById('users', ins.insertedId, { email = 1 })
  print('[example-lua] findById', json.encode(byId))

  local many = exports['cfx-mongodb']:findAll('users', { active = true }, {
    projection = { email = 1 },
    sort = { createdAt = -1 },
    limit = 25,
    skip = 0,
  })
  print('[example-lua] findAll', json.encode(many))

  local upd = exports['cfx-mongodb']:update('users', { _id = ins.insertedId }, {
    ['$set'] = { active = false },
  })
  print('[example-lua] update', json.encode(upd))

  local cnt = exports['cfx-mongodb']:count('users', { active = false })
  print('[example-lua] count', json.encode(cnt))

  local del = exports['cfx-mongodb']:delete('users', { _id = ins.insertedId })
  print('[example-lua] delete', json.encode(del))

  local delMissing = exports['cfx-mongodb']:delete('users', { _id = ins.insertedId })
  if not delMissing.success then
    print('[example-lua] delete not-found', delMissing.error)
  end

  local cfg = exports['cfx-mongodb']:config()
  print('[example-lua] config', json.encode(cfg))
end)
