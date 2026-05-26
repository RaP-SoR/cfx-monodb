---
name: cfx-mongodb
description: >-
  Work on the cfx-mongodb FiveM MongoDB wrapper — exports API, CTFFramework
  contract, Node 22 runtime, query validation, and Vite build. Use when editing
  cfx-mongodb exports, MongoDB integration, CTFFramework database compatibility,
  or FiveM server-side MongoDB calls.
---

# cfx-mongodb Skill

## Before coding

1. Read [docs/SEARCH-MAP.md](../../../docs/SEARCH-MAP.md) for file locations.
2. For API contracts read [docs/API.md](../../../docs/API.md).
3. Edit `src/`, never `dist/`. Run `yarn build` after changes.

## Invariants (never break)

- Exports return `{ success, ... }` or `{ success: false, error }` — **never throw**.
- `insertedId` is always a **string** (`String(result.insertedId)`).
- `update` must include `modifiedCount`; `delete` must include `deletedCount`.
- `getVersion()` returns `Promise<string>` from fxmanifest version.
- Keep `node_version '22'` in `fxmanifest.lua`.
- Block dangerous operators via `validateQuery.ts` — do not bypass.

## CTFFramework required exports

`find`, `findAll`, `insert`, `update`, `delete`, `count`, `getVersion`

Framework success checks:
- Update: `(modifiedCount ?? 0) > 0`
- Delete: `deletedCount === 1`

## Common edit locations

| Change | Files |
|--------|-------|
| New/changed export | `src/api/handlers/*.ts`, `src/api/registerExports.ts`, `src/responses.ts`, `fxmanifest.lua`, `docs/API.md` |
| ConVar config | `src/config.ts` |
| Connection logic | `src/connector.ts` |
| Query safety | `src/validateQuery.ts` |
| findAll options | `src/types/options.ts`, `src/api/handlers/read.ts` |
| Slow query perf | `src/perf.ts`, `src/api/withDb.ts` |
| Query stats export | `getQueryStats` in `src/api/handlers/admin.ts` |

## Documentation

- Pipeline/security modules → add/update TSDoc when editing (see AGENTS.md).
- Export behavior changes → update `docs/API.md` + examples, not handler comments.

## Build verify

```bash
yarn gate    # preferred before push
# or: yarn build && yarn tsc && yarn test
```

## Additional resources

- Full API: [reference.md](reference.md)
- Architecture: [docs/ARCHITECTURE.md](../../../docs/ARCHITECTURE.md)
- AI tooling: [docs/AI-STACK.md](../../../docs/AI-STACK.md)
