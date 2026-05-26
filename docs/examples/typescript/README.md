# TypeScript examples — cfx-mongodb

> **TypeScript only** — no Lua in these files. API contract: [../../API.md](../../API.md)

| File | Content |
|------|---------|
| **[use-cases.md](use-cases.md)** | **FiveM scenarios** — account/character/vehicle/items; every export |
| [snippets.md](snippets.md) | Short reference per export |
| [queries.md](queries.md) | Query cookbook — JOIN analogy, time zones, operators |
| [datetime-helpers.ts](datetime-helpers.ts) | UTC + EU/US/Asia offsets to copy |
| [patterns.md](patterns.md) | Startup, success checks, pagination, npm types |
| [server.ts](server.ts) | Minimal runnable CRUD tour |
| [fxmanifest-ts-example.lua](fxmanifest-ts-example.lua) | Manifest template (build `server.ts` → `dist/`) |

**New here?** Start with [use-cases.md](use-cases.md) — [export coverage table](use-cases.md#export-coverage) lists all 16 exports.

Lua examples: [../lua/README.md](../lua/README.md)

## server.cfg

```cfg
exec ../config/mongodb.local.cfg
ensure cfx-mongodb
ensure your-ts-resource
```

Wait for **`cfx-mongodb:ready`** before CRUD — see [patterns.md §1](patterns.md#1-startup--wait-for-ready).

## Requirements

- FiveM Node **22** (`node_version '22'` in consumer manifest)
- Optional types: `cfx-mongodb/types` — [CONFIGURATION.md](../../CONFIGURATION.md)
