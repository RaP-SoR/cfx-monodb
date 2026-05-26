-- Minimal Lua example usage for cfx-mongodb

AddEventHandler('onResourceStart', function(res)
  if res ~= GetCurrentResourceName() then return end

  -- Optional: wait for ready event
  AddEventHandler('cfx-mongodb:ready', function()
    print('[example-lua] cfx-mongodb ready')
  end)

  -- Health
  local health = exports['cfx-mongodb']:health()
  print('[example-lua] health', json.encode(health))

  -- Ensure indexes
  exports['cfx-mongodb']:ensureIndexes('users', {
    { keys = { email = 1 }, options = { unique = true } },
    { keys = { createdAt = -1 } }
  })

  -- Insert
  local ins = exports['cfx-mongodb']:insert('users', { email = 'user@example.com', createdAt = os.time(), active = true })
  print('[example-lua] insert', json.encode(ins))

  -- Find
  local one = exports['cfx-mongodb']:find('users', { email = 'user@example.com' })
  print('[example-lua] find', json.encode(one))

  -- FindAll
  local many = exports['cfx-mongodb']:findAll('users', { active = true }, { projection = { email = 1 }, sort = { createdAt = -1 }, limit = 25, skip = 0 })
  print('[example-lua] findAll', json.encode(many))

  -- Update
  local upd = exports['cfx-mongodb']:update('users', { email = 'user@example.com' }, { ['$set'] = { active = false } })
  print('[example-lua] update', json.encode(upd))

  -- Count
  local cnt = exports['cfx-mongodb']:count('users', { active = false })
  print('[example-lua] count', json.encode(cnt))

  -- Delete
  local del = exports['cfx-mongodb']:delete('users', { email = 'user@example.com' })
  print('[example-lua] delete', json.encode(del))

  -- Config
  local cfg = exports['cfx-mongodb']:config()
  print('[example-lua] config', json.encode(cfg))
end)

