-- Minimal Lua consumer for cfx-mongodb (single-file tour).
-- Split by feature: ../sample-resource/
-- Narrative: use-cases.md · Operators: queries.md
-- server.cfg: ensure cfx-mongodb BEFORE this resource.

AddEventHandler('cfx-mongodb:ready', function()
  -- Guard: ready fired but connection might still be checked explicitly.
  if not exports['cfx-mongodb']:isConnected() then
    print('[example-lua] isConnected=false after ready event')
    return
  end

  local version = exports['cfx-mongodb']:getVersion()
  print('[example-lua] getVersion', version)

  local health = exports['cfx-mongodb']:health()
  print('[example-lua] health', json.encode(health))

  -- Indexes for the collections used below (safe to re-run).
  exports['cfx-mongodb']:ensureIndexes('users', {
    { keys = { email = 1 }, options = { unique = true } },
    { keys = { createdAt = -1 } },
  })

  -- insert: create one row; insertedId is always a string.
  local ins = exports['cfx-mongodb']:insert('users', {
    email = 'user@example.com',
    createdAt = os.date('!%Y-%m-%dT%H:%M:%SZ'),
    active = true,
  })
  print('[example-lua] insert', json.encode(ins))

  if not ins.success or not ins.insertedId then
    print('[example-lua] insert failed', ins.error or 'unknown')
    return
  end

  -- find: equality filter; not found => success true, data nil.
  local one = exports['cfx-mongodb']:find('users', { email = 'user@example.com' })
  print('[example-lua] find', json.encode(one))

  local missing = exports['cfx-mongodb']:find('users', { email = '__no_such_user__' })
  if missing.success and missing.data == nil then
    print('[example-lua] find not-found: success true, data nil')
  end

  -- findById: primary key lookup with optional projection.
  local byId = exports['cfx-mongodb']:findById('users', ins.insertedId, { email = 1 })
  print('[example-lua] findById', json.encode(byId))

  -- findAll: list with sort, limit, projection (see queries.md for $in, $and, …).
  local many = exports['cfx-mongodb']:findAll('users', { active = true }, {
    projection = { email = 1 },
    sort = { createdAt = -1 },
    limit = 25,
    skip = 0,
  })
  print('[example-lua] findAll', json.encode(many))

  local staff = exports['cfx-mongodb']:findAll('users', {
    job = { ['$in'] = { 'admin', 'moderator' } },
  }, { limit = 10 })
  print('[example-lua] findAll $in', json.encode(staff))

  -- update: $set fields; check modifiedCount for “actually changed”.
  local upd = exports['cfx-mongodb']:update('users', { _id = ins.insertedId }, {
    ['$set'] = { active = false },
  })
  print('[example-lua] update', json.encode(upd))

  -- count: number of matches without loading documents.
  local cnt = exports['cfx-mongodb']:count('users', { active = false })
  print('[example-lua] count', json.encode(cnt))

  -- delete: removes one doc; second delete => success false (not found).
  local del = exports['cfx-mongodb']:delete('users', { _id = ins.insertedId })
  print('[example-lua] delete', json.encode(del))

  local delMissing = exports['cfx-mongodb']:delete('users', { _id = ins.insertedId })
  if not delMissing.success then
    print('[example-lua] delete not-found', delMissing.error)
  end

  local cfg = exports['cfx-mongodb']:config()
  print('[example-lua] config', json.encode(cfg))
end)
