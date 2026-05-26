# Examples

Copy-paste starters for **consumer resources** (not part of the `cfx-mongodb` build).

Examples are split by language so Lua authors never need to read TypeScript (and vice versa).

## Language folders

| Folder | For |
|--------|-----|
| **[lua/](lua/README.md)** | **Lua only** — snippets, query cookbook, patterns, `server.lua`, manifest |
| **[typescript/](typescript/README.md)** | **TypeScript only** — snippets, query cookbook, patterns, `server.ts`, manifest |

### Lua quick links

| File | Description |
|------|-------------|
| **[lua/use-cases.md](lua/use-cases.md)** | **FiveM scenarios** (account, character, vehicle, items) + all exports |
| [lua/snippets.md](lua/snippets.md) | Per-export quick reference |
| [lua/queries.md](lua/queries.md) | Filters, operators, updates, performance |
| [lua/patterns.md](lua/patterns.md) | `ready` event, success checks, pagination |
| [lua/server.lua](lua/server.lua) | Runnable CRUD tour |

### TypeScript quick links

| File | Description |
|------|-------------|
| **[typescript/use-cases.md](typescript/use-cases.md)** | **FiveM scenarios** + all exports |
| [typescript/snippets.md](typescript/snippets.md) | Per-export quick reference |
| [typescript/queries.md](typescript/queries.md) | Filters, operators, updates, performance |
| [typescript/patterns.md](typescript/patterns.md) | Patterns + npm types |
| [typescript/server.ts](typescript/server.ts) | Runnable CRUD tour |

### For hobby developers

1. Open **[lua/use-cases.md](lua/use-cases.md)** or **[typescript/use-cases.md](typescript/use-cases.md)** — export checklist shows nothing is missing.
2. Copy a **flow** (player join, character, garage) into your resource.
3. Use **[queries.md](lua/queries.md)** when filters get complex.
4. Run **[server.lua](lua/server.lua)** / **[server.ts](typescript/server.ts)** once against local Mongo to build confidence.
5. Copy **[sample-resource/](sample-resource/README.md)** into `resources/` for a realistic folder layout.

**Doc style:** Cookbook and pattern sections include a short **“What this does”** (and numbered **Steps** where useful) before code.

**Audit (2026-05):** [../DOCUMENTATION-AUDIT-2026.md](../DOCUMENTATION-AUDIT-2026.md) — confirms all exports are documented; lists intentional limitations (no aggregation export, `updateOne` only, etc.).

**Maintainers:** `yarn doc-audit` · Agent skill [`.cursor/skills/examples-docs/`](../../.cursor/skills/examples-docs/SKILL.md) · Block template [TEMPLATE.md](../../.cursor/skills/examples-docs/TEMPLATE.md)

## Sample resource (copy-paste)

| Path | Description |
|------|-------------|
| [sample-resource/](sample-resource/README.md) | **Multi-file Lua consumer** — `server/accounts.lua`, `characters.lua`, `vehicles.lua`, `items.lua` |

## Shared

| Path | Description |
|------|-------------|
| [config/](config/) | ConVar profile templates (`exec` + gitignore) |

## server.cfg order

> Full setup: [../CONFIGURATION.md](../CONFIGURATION.md)

```cfg
exec mongodb.local.cfg
ensure cfx-mongodb
ensure your-consumer-resource
```

Wait for **`cfx-mongodb:ready`** before CRUD — see [lua/patterns.md](lua/patterns.md) or [typescript/patterns.md](typescript/patterns.md).

## Export coverage

Canonical contract: [../API.md](../API.md).

| Export | lua/ | typescript/ |
|--------|:----:|:-----------:|
| CRUD + `findById` | ✓ | ✓ |
| `ensureIndexes`, `health`, `config` | ✓ | ✓ |
| Query operators cookbook | [lua/queries.md](lua/queries.md) | [typescript/queries.md](typescript/queries.md) |

**Not via exports:** aggregation pipelines, transactions, change streams — CRUD only, or trusted `getDb` ([API.md](../API.md)).

## Legacy paths (redirects)

| Old path | Use instead |
|----------|-------------|
| `lua.md` | [lua/snippets.md](lua/snippets.md) |
| `typescript.md` | [typescript/snippets.md](typescript/snippets.md) |
| `queries.md` (combined) | [lua/queries.md](lua/queries.md) or [typescript/queries.md](typescript/queries.md) |
| `patterns.md` (combined) | [lua/patterns.md](lua/patterns.md) or [typescript/patterns.md](typescript/patterns.md) |
| `server.lua` / `server.ts` (root) | [lua/server.lua](lua/server.lua) / [typescript/server.ts](typescript/server.ts) |
