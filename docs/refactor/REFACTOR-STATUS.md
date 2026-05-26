# Refactor Status Board

> Orchestrator maintains this file after each merge. Do not edit agent-owned rows while work is in progress.

**Base branch:** `refactor/staged-hardening`  
**Final target:** `dev`  
**Last updated:** 2026-05-26

## Wave overview

| Wave | Focus | Agents | Status |
|------|-------|--------|--------|
| **1** | Security + hygiene + manifest/types | 5 parallel | 🔵 Not started |
| **2** | Export pipeline (`withDb`) | 1 + tests | ⚪ Blocked by Wave 1 |
| **3** | Architecture split | 3–6 parallel | ⚪ Blocked by Wave 2 |
| **4** | TS6 + contract hardening | 2 parallel | ⚪ Blocked by Wave 3 |

Legend: 🔵 Not started · 🟡 In progress · 🟢 Merged · 🔴 Blocked

---

## Wave 1 — agents

| ID | Role | Branch | Worktree | Owned files | Status | PR |
|----|------|--------|----------|-------------|--------|-----|
| **W1A** | Security | `refactor/w1a-security` | `../worktrees/cfx-mongodb/w1a` | `validateQuery.ts`, `tests/validateQuery.test.ts` | 🔵 | — |
| **W1B** | Logging | `refactor/w1b-logging` | `../worktrees/cfx-mongodb/w1b` | `utils.ts`, `tests/utils.test.ts` | 🔵 | — |
| **W1C** | Cleanup | `refactor/w1c-cleanup` | `../worktrees/cfx-mongodb/w1c` | `index.ts`, `connector.ts`, `vite.config.mjs`, `package.json` | 🔵 | — |
| **W2A** | Manifest/Docs | `refactor/w2a-manifest` | `../worktrees/cfx-mongodb/w2a` | `fxmanifest.lua`, `docs/API.md`, `SEARCH-MAP.md`, … | 🔵 | — |
| **W2B** | API types | `refactor/w2b-types` | `../worktrees/cfx-mongodb/w2b` | `src/types/api.ts`, `tests/api-contract.test.ts` | 🔵 | — |

### Wave 1 merge order

No file overlap — any order works. Suggested:

1. W1C (cleanup) — smallest diff
2. W1B (logging utils)
3. W1A (security)
4. W2B (types)
5. W2A (manifest — may reference new exports from docs)

### Wave 1 gate (after all merges)

```bash
yarn tsc && yarn test && yarn build && yarn lint
```

---

## Checklist — Wave 1 complete

- [ ] All 5 agent branches merged into `refactor/staged-hardening`
- [ ] Gate commands green on integration branch
- [ ] `REFACTOR-STATUS.md` updated
- [ ] Wave 2 spec unlocked (orchestrator creates `WAVE-2-SPEC.md`)
