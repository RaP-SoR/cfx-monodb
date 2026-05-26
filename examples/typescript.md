# TypeScript Examples

## Configuration (server.cfg)
- Purpose: Set environment, URIs, timeouts, pool sizes, log level, and optional auto-indexing.
- Example:
  - set mongodb_env dev
  - set mongodb_dev_url mongodb://localhost:27017/ctf_dev
  - set mongodb_prod_url mongodb://localhost:27017/ctf_prod
  - set mongodb_test_url mongodb://localhost:27017/ctf_test
  - set mongodb_timeout 5000                 # server selection timeout (ms)
  - set mongodb_max_pool 15                  # clamp 0–50
  - set mongodb_min_pool 2                   # clamp 0–20
  - set mongodb_log_level info               # error|warn|info|debug
  - set mongodb_init_indexes {"users":[{"keys":{"email":1},"options":{"unique":true}}]}
  - ensure cfx-mongodb

## Ready Event
- What: Emitted after connect and auto-index creation.
- Why: Other resources can wait until DB is ready.
- Usage: on('cfx-mongodb:ready', () => { /* safe to call exports */ })

## Health
- What: Pings MongoDB and measures RTT (ms) to verify connectivity.
- const health = await (exports as any)['cfx-mongodb'].health();

## Config
- What: Returns effective, non-sensitive runtime settings (env, timeouts, pool sizes, log level).
- const cfg = await (exports as any)['cfx-mongodb'].config();

## Connect (override)
- When: Only if you must override the URI/timeouts at runtime (normally use ConVars).
- await (exports as any)['cfx-mongodb'].connect('mongodb://localhost:27017/ctf_dev', { serverSelectionTimeoutMS: 5000, maxPoolSize: 10 });

## isConnected
- Quick boolean to check current DB state.
- const ok = (exports as any)['cfx-mongodb'].isConnected();

## Insert
- What: Insert a document; returns insertedId.
- await (exports as any)['cfx-mongodb'].insert('users', { email: 'user@example.com', createdAt: Date.now(), active: true });

## Find (single)
- What: Find one document matching a filter; returns data or null.
- const one = await (exports as any)['cfx-mongodb'].find('users', { email: 'user@example.com' });

## FindAll (many)
- What: List documents with controls.
- Options:
  - projection: select fields (e.g., { email: 1 })
  - sort: sort order (e.g., { createdAt: -1 })
  - limit: default 100, clamped 1–1000
  - skip: default 0, clamped ≥ 0
- const many = await (exports as any)['cfx-mongodb'].findAll('users', { active: true }, { projection: { email: 1 }, sort: { createdAt: -1 }, limit: 50, skip: 0 });

## Update
- What: Update one document using update operators or a partial object (auto-wraps with $set if needed).
- await (exports as any)['cfx-mongodb'].update('users', { email: 'user@example.com' }, { $set: { active: false } });

## Delete
- What: Delete one document by filter; returns deletedCount.
- await (exports as any)['cfx-mongodb'].delete('users', { email: 'user@example.com' });

## Count
- What: Count documents by filter.
- const cnt = await (exports as any)['cfx-mongodb'].count('users', { active: false });

## ensureIndexes (manual)
- What: Create multiple indexes; idempotent and safe to call on startup or migrations.
- await (exports as any)['cfx-mongodb'].ensureIndexes('users', [ { keys: { email: 1 }, options: { unique: true } } ]);
