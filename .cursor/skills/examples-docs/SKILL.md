---
name: examples-docs
description: >-
  Maintain cfx-mongodb consumer documentation and examples (Lua + TypeScript in
  parallel). Run after export/API changes, before commit or merge, doc audits, or
  when adding FiveM examples. Syncs docs/examples/lua and typescript folders,
  use-cases coverage table, API.md, and DOCUMENTATION-AUDIT. Use with yarn scout.
---

# Examples & documentation routine — cfx-mongodb

Keeps **Lua** and **TypeScript (JavaScript runtime)** examples in sync with `server_exports` and `docs/API.md`.

## When to run

- After changing `src/api/handlers/*`, `registerExports`, `responses`, `validateQuery`
- Before **commit** or after **merge** to `dev` / `main`
- User asks: doc audit, examples update, cookbook, consumer docs
- New export or changed envelope semantics

## One-command routine (human or agent)

```bash
yarn doc-audit    # export list + doc file checklist (no gate)
yarn scout        # doc-audit reminders + yarn gate
```

Agent without shell: follow [Routine](#routine-agent) below, then require `yarn gate` pass.

## Fixed folder structure (do not invent new layouts)

```text
docs/examples/
├── README.md
├── lua/                    # Lua ONLY
│   ├── README.md
│   ├── use-cases.md        # every export + FiveM flows
│   ├── queries.md          # operators, JOIN analogy, timezones
│   ├── patterns.md
│   ├── snippets.md
│   ├── server.lua
│   └── datetime-helpers.lua
├── typescript/             # TypeScript ONLY
│   ├── README.md
│   ├── use-cases.md
│   ├── queries.md
│   ├── patterns.md
│   ├── snippets.md
│   ├── server.ts
│   └── datetime-helpers.ts
└── sample-resource/        # multi-file Lua reference
```

**Never** mix Lua and TypeScript in the same example file.

## Routine (agent)

Copy checklist — tick as you go:

```markdown
- [ ] 1. Read fxmanifest `server_exports` + docs/API.md for changed behavior
- [ ] 2. Update docs/API.md (canonical contract)
- [ ] 3. Update BOTH languages (same section order, same “What this does” / Steps)
- [ ] 4. Refresh use-cases.md export coverage table (lua + typescript)
- [ ] 5. If new query pattern → queries.md (lua + typescript)
- [ ] 6. If startup/success semantics → patterns.md (lua + typescript)
- [ ] 7. sample-resource/ only if flow/architecture changed
- [ ] 8. DOCUMENTATION-AUDIT-2026.md matrix if exports added/removed
- [ ] 9. yarn scout (gate must pass)
```

### Step 2 — Which files to touch

| Change type | Files |
|-------------|--------|
| New/changed **export** | API.md, `lua/snippets.md`, `typescript/snippets.md`, both `use-cases.md` (coverage + reference) |
| Filter/update **operators** | both `queries.md` |
| **FiveM flow** (account, vehicle, …) | both `use-cases.md`, optional `sample-resource/server/*.lua` |
| **Events** | API.md, both `patterns.md`, both snippets (Events section) |
| **ConVars** | CONFIGURATION.md, API.md config table, snippet server.cfg blocks |
| **Limitations** (no aggregate, etc.) | API.md § Limitations, examples/README |

### Step 3 — Writing rules (template)

Use [TEMPLATE.md](TEMPLATE.md) for every new or updated example block:

1. **What this does** — 1–2 sentences (plain language)
2. **Steps** — numbered `1.` `2.` `3.` when flow has order
3. **Code** — copy-paste ready; Lua uses `['$gt']` for operators
4. **FiveM context** — prefer `accounts`, `characters`, `vehicles`, not generic `users` unless generic on purpose

### Step 4 — Parity check (Lua ↔ TypeScript)

Same exports documented in both trees:

| Check | Lua | TypeScript |
|-------|-----|------------|
| Coverage table row | `lua/use-cases.md` | `typescript/use-cases.md` |
| Minimal snippet | `lua/snippets.md` | `typescript/snippets.md` |
| Operator example | `lua/queries.md` | `typescript/queries.md` |

TypeScript may link to Lua for long narratives: `See ../lua/queries.md §3.7` — but **must** still include TS code sample.

### Step 8 — Audit doc

Compare against [docs/DOCUMENTATION-AUDIT-2026.md](../../../docs/DOCUMENTATION-AUDIT-2026.md). Update export matrix if `server_exports` changed.

## Report template (after routine)

```markdown
## Examples/docs report

**Trigger:** export change | merge | manual audit
**Exports touched:** find, …
**Files updated:** API.md, lua/…, typescript/…
**Parity:** Lua/TS aligned yes/no
**Coverage:** all server_exports documented yes/no
**Gate:** pass/fail
```

## Related

- Template: [TEMPLATE.md](TEMPLATE.md)
- Checklist: [docs/CHECKLIST.md](../../../docs/CHECKLIST.md)
- Scout: [.cursor/skills/post-change-scout/SKILL.md](../post-change-scout/SKILL.md)
- API work: [.cursor/skills/cfx-mongodb/SKILL.md](../cfx-mongodb/SKILL.md)
- Audit matrix: [docs/DOCUMENTATION-AUDIT-2026.md](../../../docs/DOCUMENTATION-AUDIT-2026.md)
