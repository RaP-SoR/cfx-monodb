# Agent Guidelines — cfx-mongodb

## Start here

1. **[docs/SEARCH-MAP.md](docs/SEARCH-MAP.md)** — navigation map (task → file), save context tokens
2. **[docs/API.md](docs/API.md)** — canonical external export contract
3. **[docs/SECURITY.md](docs/SECURITY.md)** — trust model, consumer checklist (pre-stable)
4. **[docs/CHECKLIST.md](docs/CHECKLIST.md)** — pre-push / PR checklist (Track E)
4. **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** — runtime, lifecycle, build pipeline
5. **[docs/AI-STACK.md](docs/AI-STACK.md)** — Cursor skills, rules, agent workflows

Project skills: `.cursor/skills/cfx-mongodb/SKILL.md` · `.cursor/skills/post-change-scout/SKILL.md`

## What this project is

TypeScript MongoDB wrapper for FiveM/RedM. Other resources call MongoDB **only via exports** (`exports["cfx-mongodb"]`). Runs on FiveM Node **22 only** (`node_version '22'`, `engines: >=22.0.0 <23`) with `mongodb@7`. No Node 16/18 support.

## Project Structure

| Path | Purpose |
|------|---------|
| `src/` | TypeScript source (edit here) |
| `src/api/handlers/` | Export handler modules (read, write, admin, lifecycle) |
| `src/api/registerExports.ts` | Wires handlers to FiveM exports |
| `dist/` | Compiled output (`yarn build`) — do not edit |
| `fxmanifest.lua` | Resource manifest, ConVars, `server_exports` |
| `docs/API.md` | External API reference |
| `docs/examples/` | Language-specific examples + sample consumer resources |
| `tests/` | Unit tests (Vitest) |

## Build, Test, Dev

```bash
yarn install   # Node 22 locally
yarn build     # src/ → dist/index.js
yarn dev       # watch rebuild
yarn tsc       # type-check
yarn lint      # eslint
yarn test      # vitest (Export-API)
yarn gate      # lint + tsc + test + build (pre-push)
yarn scout     # gate + change reminders (Track E)
```

In FiveM: folder `cfx-mongodb`, `ensure cfx-mongodb` in server.cfg.

## Coding Style

- TypeScript, 2 spaces, semicolons, Prettier defaults
- `camelCase` functions/vars, `PascalCase` classes, `kebab-case.ts` files
- Keep public export APIs typed and minimal

## In-code documentation (TSDoc)

- **Consumer contract** stays in `docs/API.md` — do not duplicate export signatures in handler files.
- **Pipeline / infra modules** (`withDb`, `validateQuery`, `connector`, `indexService`, `perf`): module `@file` header + `@param`/`@returns` on public functions.
- Handlers: one-line module header linking to `docs/API.md` is enough; no per-export TSDoc unless non-obvious.

## Export change checklist

Full checklist: **[docs/CHECKLIST.md](docs/CHECKLIST.md)**. After edits run **`yarn scout`**.

- [ ] `src/api/handlers/*.ts` + `src/api/registerExports.ts` + `src/responses.ts`
- [ ] CTFFramework contract in `docs/API.md`
- [ ] `fxmanifest.lua` → `server_exports` if new export
- [ ] `yarn gate` (or `yarn scout`)
- [ ] Update `docs/examples/typescript/` **and** `docs/examples/lua/` on behavior change (skill: `.cursor/skills/examples-docs/`, `yarn doc-audit`)

## Invariants

- Exports never throw — return `{ success: false, error }`
- `insertedId` is always a string
- Query validation: no `$where` / dangerous operators from user input
- Never commit MongoDB credentials — use ConVars (`mongodb_*_url`)
- Retain `node_version '22'` in `fxmanifest.lua` — Node 16/18 not supported

## Security

- Validate/whitelist query fields in consuming resources
- `validateQuery.ts` blocks worst-case operators only — not a full sandbox
- Pre-stable: [docs/SECURITY.md](docs/SECURITY.md) · fixes [docs/plans/SECURITY-FIXES-PLAN.md](docs/plans/SECURITY-FIXES-PLAN.md)

## Commits & PRs

- Imperative subject: `fix(exports): ensure insertedId is string`
- PRs: description, repro, breaking-change notes
- Update docs when API changes
