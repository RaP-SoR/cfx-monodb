# Sample consumer resource (Lua)

> **Reference only** — not built or `ensure`d by cfx-mongodb. Copy into your server’s `resources/` folder.

Shows how a **real FiveM resource** can split MongoDB access into small server files (accounts, characters, vehicles, items) instead of one huge `server.lua`.

## Install (local test)

1. Copy this folder to e.g. `resources/[local]/cfx-mongodb-sample/`
2. In `server.cfg` (after Mongo ConVars):

```cfg
ensure cfx-mongodb
ensure cfx-mongodb-sample
```

3. Use the same Mongo database as in [../config/mongodb.local.cfg.example](../config/mongodb.local.cfg.example)

## Files

| File | Role |
|------|------|
| `fxmanifest.lua` | Declares `dependency 'cfx-mongodb'` and server scripts |
| `server/main.lua` | Waits for `cfx-mongodb:ready`, creates indexes, wires events |
| `server/accounts.lua` | Load/create account on connect (Flow A) |
| `server/characters.lua` | List/create/load character (Flow B, D) |
| `server/vehicles.lua` | Garage list, store vehicle (Flow C, F) |
| `server/items.lua` | Give item, read item def (Flow E) |

## Docs map

| Topic | Doc |
|-------|-----|
| Every export + flows | [../lua/use-cases.md](../lua/use-cases.md) |
| Query operators | [../lua/queries.md](../lua/queries.md) |
| `ready` / success checks | [../lua/patterns.md](../lua/patterns.md) |

This sample **calls exports directly** — no ORM. Adapt collection names to your framework.
