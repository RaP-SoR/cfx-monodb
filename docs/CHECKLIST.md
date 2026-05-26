# Commit & PR checklist — cfx-mongodb

> **Track E** — use before every push to `dev` (PR optional for solo team).  
> Automated gate: `yarn gate` · Agent skill: `.cursor/skills/post-change-scout/SKILL.md`

---

## Always (every push)

```bash
yarn gate    # lint → tsc → test → build
```

- [ ] No edits in `dist/` (build output only)
- [ ] No MongoDB credentials or real URIs in committed files
- [ ] `node_version '22'` still in `fxmanifest.lua`

---

## Export / API behavior change

Touching `src/api/handlers/*`, `registerExports.ts`, `responses.ts`, or export semantics:

- [ ] Handler registered in `src/api/registerExports.ts`
- [ ] `fxmanifest.lua` → `server_exports` (if **new** export name)
- [ ] `src/types/api.ts` → `CFX_MONGODB_EXPORTS` if contract export
- [ ] **`docs/API.md`** — signature, envelope, CTFFramework section if applicable
- [ ] **`docs/examples/typescript.md`** and/or **`lua.md`** on behavior change
- [ ] **`docs/examples/patterns.md`** if success-check or consumer pattern changes
- [ ] **`tests/`** — handler test or `api-contract.test.ts` invariant
- [ ] `yarn test` includes manifest ↔ runtime sync (`tests/api-contract.test.ts`)

**Invariants:** exports never throw; `insertedId` string; update has `modifiedCount`; delete has `deletedCount`.

---

## ConVar / config change

Touching `src/config.ts`, `fxmanifest.lua` convar_category, perf module:

- [ ] **`docs/CONFIGURATION.md`** — ConVar table and examples
- [ ] **`docs/API.md`** — if `config()` export shape changes
- [ ] Admin handler / `config()` test if new fields

---

## Release / CI change

Touching `.github/workflows/*`, `scripts/pack-*.sh`, `scripts/resolve-release-meta.sh`:

- [ ] **`docs/CONFIGURATION.md`** — install / dev vs stable
- [ ] **`docs/releases/`** — release notes for new tags
- [ ] Tag naming: `vX.Y.Z-dev` on dev, `vX.Y.Z` on main only

---

## Documentation-only change

- [ ] Links resolve (no broken `docs/refactor/` paths — use `docs/archive/refactor/`)
- [ ] **`docs/API.md`** remains canonical if examples duplicate behavior

---

## Optional PR (when using GitHub PR)

Use [pull request template](../.github/pull_request_template.md). Minimum:

1. **What** changed (export / fix / docs / CI)
2. **Breaking?** yes/no — CTFFramework impact
3. **Test plan** — `yarn gate` + manual note if server tested

Direct push to `dev` is OK for 1–2 person team — run **`yarn scout`** or **`yarn gate`** anyway.

---

## Pre-push (optional local hook)

```bash
# .git/hooks/pre-push — example (Git Bash / Linux)
#!/usr/bin/env bash
yarn gate || exit 1
```

Make executable: `chmod +x .git/hooks/pre-push`  
Hooks are local-only (not committed).

---

## Quick commands

| Command | Purpose |
|---------|---------|
| `yarn gate` | Full quality gate (lint, tsc, test, build) |
| `yarn scout` | Gate + change-based reminders |
| `yarn test tests/api-contract.test.ts` | Manifest ↔ export contract only |

---

## References

| Doc | Topic |
|-----|--------|
| [API.md](API.md) | External contract |
| [examples/patterns.md](examples/patterns.md) | CTFFramework consumer patterns |
| [AI-STACK.md](AI-STACK.md) | Cursor skills & rules |
| [SEARCH-MAP.md](SEARCH-MAP.md) | File navigation |
