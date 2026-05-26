# Agent Guidelines — cfx-mongodb

## Start here

1. **[SEARCH-MAP.md](SEARCH-MAP.md)** — navigation map (task → file), save context tokens
2. **[docs/API.md](docs/API.md)** — canonical external export contract (CTFFramework)
3. **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** — runtime, lifecycle, build pipeline
4. **[docs/AI-STACK.md](docs/AI-STACK.md)** — Cursor skills, rules, agent workflows
5. **[docs/refactor/README.md](docs/refactor/README.md)** — staged refactor waves (multi-agent)

Project skill: `.cursor/skills/cfx-mongodb/SKILL.md`  
Refactor orchestrator: `.cursor/skills/refactor-orchestrator/SKILL.md`

## What this project is

TypeScript MongoDB wrapper for FiveM/RedM. Other resources call MongoDB **only via exports** (`exports["cfx-mongodb"]`). Runs on FiveM Node **22 only** (`node_version '22'`, `engines: >=22.0.0 <23`) with `mongodb@7`. No Node 16/18 support.

## Project Structure

| Path | Purpose |
|------|---------|
| `src/` | TypeScript source (edit here) |
| `dist/` | Compiled output (`yarn build`) — do not edit |
| `fxmanifest.lua` | Resource manifest, ConVars, `server_exports` |
| `docs/API.md` | External API reference |
| `doc-typescript.md` / `doc-lua.md` | Language-specific examples |
| `tests/` | Unit tests (add when contributing logic) |

## Build, Test, Dev

```bash
yarn install   # Node 22 locally
yarn build     # src/ → dist/index.js
yarn dev       # watch rebuild
yarn tsc       # type-check
yarn lint      # eslint
yarn test      # vitest (Export-API)
```

In FiveM: folder `cfx-mongodb`, `ensure cfx-mongodb` in server.cfg.

## Coding Style

- TypeScript, 2 spaces, semicolons, Prettier defaults
- `camelCase` functions/vars, `PascalCase` classes, `kebab-case.ts` files
- Keep public export APIs typed and minimal

## Export change checklist

- [ ] `src/exports.ts` + `src/responses.ts`
- [ ] CTFFramework contract in `docs/API.md`
- [ ] `fxmanifest.lua` → `server_exports` if new export
- [ ] `yarn build` + `yarn tsc`
- [ ] Update `doc-lua.md` / `doc-typescript.md` on behavior change

## Invariants

- Exports never throw — return `{ success: false, error }`
- `insertedId` is always a string
- Query validation: no `$where` / dangerous operators from user input
- Never commit MongoDB credentials — use ConVars (`mongodb_*_url`)
- Retain `node_version '22'` in `fxmanifest.lua` — Node 16/18 not supported

## Security

- Validate/whitelist query fields in consuming resources
- `validateQuery.ts` blocks worst-case operators only — not a full sandbox

## Commits & PRs

- Imperative subject: `fix(exports): ensure insertedId is string`
- PRs: description, repro, breaking-change notes
- Update docs when API changes
