# Refactor Status Board

> Orchestrator maintains this file after each merge. Do not edit agent-owned rows while work is in progress.

**Base branch:** `refactor/staged-hardening`  
**Integration HEAD:** `c370b0f` (Wave 1 complete)  
**Final target:** `dev`  
**Last updated:** 2026-05-26

## Wave overview

| Wave | Focus | Agents | Status |
|------|-------|--------|--------|
| **1** | Security + hygiene + manifest/types | 5 parallel | 🟢 Merged |
| **2** | Export pipeline (`withDb`) | 1 + tests | 🔵 Ready to start |
| **3** | Architecture split | 3–6 parallel | ⚪ Blocked by Wave 2 |
| **4** | TS6 + contract hardening | 2 parallel | ⚪ Blocked by Wave 3 |

Legend: 🔵 Not started · 🟡 In progress · 🟢 Merged · 🔴 Blocked

---

## Wave 1 — agents

| ID | Role | Branch | Worktree | Owned files | Status | Merge |
|----|------|--------|----------|-------------|--------|-------|
| **W1A** | Security | `refactor/w1a-security` | `../worktrees/cfx-mongodb/w1a` | `validateQuery.ts`, `tests/validateQuery.test.ts` | 🟢 | `6eb9aae` |
| **W1B** | Logging | `refactor/w1b-logging` | `../worktrees/cfx-mongodb/w1b` | `utils.ts`, `tests/utils.test.ts` | 🟢 | `b3c415b` |
| **W1C** | Cleanup | `refactor/w1c-cleanup` | `../worktrees/cfx-mongodb/w1c` | `index.ts`, `connector.ts`, `vite.config.mjs`, `package.json` | 🟢 | `358a7a7` |
| **W2A** | Manifest/Docs | `refactor/w2a-manifest` | `../worktrees/cfx-mongodb/w2a` | `fxmanifest.lua`, `docs/API.md`, `SEARCH-MAP.md`, … | 🟢 | `c370b0f` |
| **W2B** | API types | `refactor/w2b-types` | `../worktrees/cfx-mongodb/w2b` | `src/types/api.ts`, `tests/api-contract.test.ts` | 🟢 | `1fc422b` |

### Wave 1 merge order (applied)

1. W1C → `358a7a7` — gate: 19/19 tests ✓
2. W1B → `b3c415b` — gate: 30/30 tests ✓
3. W1A → `6eb9aae` — gate: 52/52 tests ✓
4. W2B → `1fc422b` — gate: 54 pass, 1 todo ✓
5. W2A → `c370b0f` — gate: 54 pass, 1 todo ✓

### Wave 1 integration gate (final)

```bash
yarn tsc && yarn test && yarn build
```

**Result:** `yarn tsc` ✓ · **54 passed | 1 todo** (4 test files) · `yarn build` ✓

---

## Checklist — Wave 1 complete

- [x] All 5 agent branches merged into `refactor/staged-hardening`
- [x] Gate commands green on integration branch
- [x] `REFACTOR-STATUS.md` updated
- [ ] Wave 2 spec unlocked (orchestrator creates `WAVE-2-SPEC.md`)

---

## Next: Wave 2

- Wire `redactMongoUri` / `formatError` into export pipeline (`withDb`)
- Resolve `find` vs `findById` not-found semantics (`.todo` in `tests/api-contract.test.ts`)
- See `.cursor/skills/refactor-orchestrator/SKILL.md` for orchestrator duties
