CititzenFX (FiveM/RedM) MongoDB TypeScript Wrapper

Full Documentation
- See `DOCS.md` for a complete guide (setup, configuration, API, examples).

Overview
- A lightweight, secure, and performant MongoDB wrapper for FiveM/RedM server resources.
- Targets Node 22 and MongoDB driver v7, with query validation, pooled connections, logging, and index helpers.

Requirements
- FiveM/RedM runtime with Node 22 enabled in your resource manifest: `node_version '22'`.
- MongoDB server reachable from your game server.

Installation & Configuration
- In `server.cfg`:
  - ensure cfx-mongodb
  - set mongodb_env dev|prod|test
  - set mongodb_dev_url mongodb://localhost:27017/ctf_dev
  - set mongodb_prod_url mongodb://localhost:27017/ctf_prod
  - set mongodb_test_url mongodb://localhost:27017/ctf_test
  - set mongodb_timeout 5000                # server selection timeout (ms)
  - set mongodb_max_pool 15                 # clamp 0–50
  - set mongodb_min_pool 2                  # clamp 0–20
  - set mongodb_log_level info              # error|warn|info|debug
  - set mongodb_init_indexes {"users":[{"keys":{"email":1},"options":{"unique":true}}]}
  - (optional) set mongodb_slow_ms 200      # warn on slow queries (> ms)

Exports (Server)
- insert(collection, doc)
- find(collection, filter?) → single doc
- findAll(collection, filter?, options?) → array (supports projection, sort, limit, skip)
- update(collection, filter, update|partial)
- delete(collection, filter)
- count(collection, filter?)
- ensureIndexes(collection, [ { keys, options? }, ... ])
- isConnected() → boolean
- connect(url, options?) → override (prefer ConVars normally)
- health() → { success, data: { ok, rttMs } }
- config() → { success, data: { env, timeout, maxPoolSize, minPoolSize, logLevel } }

Ready Event
- Emitted after connect and automatic index initialization: `cfx-mongodb:ready`
- Other resources can listen and safely call exports once ready.

Security & Performance
- Query validation blocks dangerous operators (e.g., `$where`, `$function`).
- Pooling via `mongodb_max_pool` / `mongodb_min_pool` with safe clamps.
- Slow query logging via `mongodb_slow_ms` (warn) and debug timing logs.
- No browser polyfills; built as Node SSR.

Development
- Build: `yarn build`
- Type-check: `yarn tsc`
- Lint: `yarn lint`

CI & Releases
- Branch CI for `node22` and `node16` branches.
- Release workflow on `main` (artifacts; tag `vX.Y.Z` for a GitHub Release).

Examples & Docs
- TypeScript guide: `examples/typescript.md`
- Lua guide: `examples/lua.md`
- Lua sample: `examples/server.lua`
- TypeScript sample: `examples/server.ts`
- Changelog: `CHANGES.md`
