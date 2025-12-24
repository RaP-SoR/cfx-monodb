# Repository Guidelines

## Project Structure & Modules
- `src/` — TypeScript source for the MongoDB wrapper and FiveM exports.
- `dist/` — compiled JS output consumed by the resource runtime.
- `server.lua` — resource entry for server-side glue (exports/initialization).
- `fxmanifest.lua` — FiveM resource manifest (name, files, deps).
- `doc-typescript.md`, `doc-lua.md` — usage docs for TS/Lua consumers.
- `tests/` — add Node-based tests here if contributing new logic.

## Build, Test, and Dev
- Node.js: FiveM’s default runtime is a custom v16; this resource supports `node_version '22'` (see `fxmanifest.lua`). Use Node 22 locally to match prod.
- `yarn install` — install deps with Node 22; clean old locks if upgrading (`rimraf node_modules yarn.lock` first).
- `yarn build` — type-check and compile TS to `dist/` via Vite/tsc.
- `yarn dev` — fast rebuilds for local iteration.
- `yarn test` — run unit tests (if present under `tests/`).
- In FiveM/RedM, keep folder named `cfx-mongodb` and add `ensure cfx-mongodb` in server cfg.

## Coding Style & Naming
- Language: TypeScript (ES modules). Indent with 2 spaces.
- Naming: `camelCase` for variables/functions, `PascalCase` for classes, `SCREAMING_SNAKE_CASE` for constants.
- Files: library modules use `kebab-case.ts` (e.g., `mongo-client.ts`).
- Lint/format: use Prettier defaults (2 spaces, semicolons). Keep public APIs typed and minimal.

## Testing Guidelines
- Place tests under `tests/` mirroring `src/` names: `src/mongo-client.ts` → `tests/mongo-client.test.ts`.
- Prefer Vitest/Jest-style unit tests; stub FiveM natives where needed.
- Aim for coverage on new logic and error paths; run `yarn test` locally.

## Commit & PR Guidelines
- Commits: concise imperative subject, scope optional (e.g., `fix(client): handle reconnect backoff`).
- PRs: include a short description, linked issues, reproduction or screenshots/logs, and notes on breaking changes.
- Keep diffs focused; update `doc-typescript.md`/`doc-lua.md` when APIs change.

## Security & Configuration
- Secrets: never commit credentials. Use convars/env for Mongo URIs (`mongodb_*_url`).
- Queries: validate/whitelist fields; avoid `$where` or unbounded operators from user input.
- Manifest: review `fxmanifest.lua` when adding files and confirm `node_version '22'` is retained.
