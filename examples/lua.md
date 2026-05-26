# Lua Examples

## Configuration (server.cfg)
- Purpose: Configure environment/URIs/timeouts/pools/logging/indexes.
- Example:
  - set mongodb_env dev
  - set mongodb_dev_url mongodb://localhost:27017/ctf_dev
  - set mongodb_prod_url mongodb://localhost:27017/ctf_prod
  - set mongodb_test_url mongodb://localhost:27017/ctf_test
  - set mongodb_timeout 5000                 # Timeout (ms)
  - set mongodb_max_pool 15                  # 0–50
  - set mongodb_min_pool 2                   # 0–20
  - set mongodb_log_level info               # error|warn|info|debug
  - set mongodb_init_indexes {"users":[{"keys":{"email":1},"options":{"unique":true}}]}
  - ensure cfx-mongodb

## Ready Event
- Emitted after connect & auto-index creation; lets you safely call exports.
- AddEventHandler('cfx-mongodb:ready', function() --[[ safe to call exports ]] end)

## Health
- Ping + RTT (ms) to validate connectivity.
- local health = exports['cfx-mongodb']:health()

## Config
- Effective (non-sensitive) runtime values.
- local cfg = exports['cfx-mongodb']:config()

## Connect (override)
- Use only if needed; prefer ConVars.
- exports['cfx-mongodb']:connect('mongodb://localhost:27017/ctf_dev', { serverSelectionTimeoutMS = 5000, maxPoolSize = 10 })

## isConnected
- Boolean connection state.
- local ok = exports['cfx-mongodb']:isConnected()

## Insert
- Insert a document; returns insertedId.
- exports['cfx-mongodb']:insert('users', { email = 'user@example.com', createdAt = os.time(), active = true })

## Find (single)
- Fetch one document by filter.
- local one = exports['cfx-mongodb']:find('users', { email = 'user@example.com' })

## FindAll (many)
- List documents with options:
  - projection: select fields (e.g., { email = 1 })
  - sort: sort order (e.g., { createdAt = -1 })
  - limit: default 100, capped 1–1000
  - skip: default 0, >= 0
- local many = exports['cfx-mongodb']:findAll('users', { active = true }, { projection = { email = 1 }, sort = { createdAt = -1 }, limit = 50, skip = 0 })

## Update
- Update a document; supports operators or partial object (auto-$set if needed).
- exports['cfx-mongodb']:update('users', { email = 'user@example.com' }, { ['$set'] = { active = false } })

## Delete
- Delete a document; returns deletedCount.
- exports['cfx-mongodb']:delete('users', { email = 'user@example.com' })

## Count
- Count documents matching a filter.
- local cnt = exports['cfx-mongodb']:count('users', { active = false })

## ensureIndexes (manual)
- Create multiple indexes idempotently (startup/migrations).
- exports['cfx-mongodb']:ensureIndexes('users', { { keys = { email = 1 }, options = { unique = true } } })
