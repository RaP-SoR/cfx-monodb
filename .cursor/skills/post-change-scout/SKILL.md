---
name: post-change-scout
description: >-
  After editing cfx-mongodb, run the post-change scout: yarn scout gate plus
  checklist reminders for exports, manifest, docs, and tests. Use when finishing
  export/API/CI changes, before commit or push to dev, or when asked to verify
  drift between fxmanifest, API.md, and handlers.
---

# Post-change scout — cfx-mongodb

Run **after** code or doc edits, **before** commit/push (PR optional).

## Quick path

```bash
yarn scout
```

Runs `scripts/scout.mjs`: change-based reminders + `yarn gate` (lint, tsc, test, build).

**Export or consumer docs changed?** Also run the examples routine:

```bash
yarn doc-audit
```

Then follow [.cursor/skills/examples-docs/SKILL.md](../examples-docs/SKILL.md) (Lua + TypeScript in parallel).

## Manual scout (agent)

If shell unavailable, run equivalent steps:

1. **`yarn gate`** — must pass
2. Read **[docs/CHECKLIST.md](../../../docs/CHECKLIST.md)** for change type
3. If exports/handlers changed:
   - `fxmanifest.lua` `server_exports` ↔ `src/types/api.ts` `CFX_MONGODB_EXPORTS`
   - `docs/API.md` ↔ behavior in `src/api/handlers/*`
   - `yarn test tests/api-contract.test.ts`
4. Report **scout summary** (see template below)

## Change → doc map

| Touched | Verify |
|---------|--------|
| `src/api/handlers/*`, `registerExports`, `responses` | API.md, fxmanifest, **lua/ + typescript/** examples, tests, `yarn doc-audit` |
| `src/config.ts`, ConVars in manifest | CONFIGURATION.md, `config()` in API.md |
| `.github/workflows`, `scripts/pack-*` | CONFIGURATION.md, docs/releases/ |
| Consumer semantics (find not-found, counts) | patterns.md, api-contract tests |

## Invariants (block merge if broken)

- Exports **never throw** — `{ success: false, error }`
- `insertedId` always **string**
- `node_version '22'` in fxmanifest
- No credentials in repo

## Scout report template

```markdown
## Scout report

**Gate:** pass / fail
**Change type:** export | config | docs | CI | other

### Checklist
- [ ] API.md synced
- [ ] fxmanifest server_exports
- [ ] tests added/updated
- [ ] examples (lua + typescript, use-cases coverage) if behavior changed
- [ ] examples-docs skill / TEMPLATE.md format

### Notes
(one line on drift found or "none")
```

## Related

- Checklist: [docs/CHECKLIST.md](../../../docs/CHECKLIST.md)
- Main skill: [.cursor/skills/cfx-mongodb/SKILL.md](../cfx-mongodb/SKILL.md)
- Contract tests: `tests/api-contract.test.ts`
