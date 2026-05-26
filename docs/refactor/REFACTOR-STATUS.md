# Refactor Status Board

> Orchestrator maintains this file after each merge. Do not edit agent-owned rows while work is in progress.

**Base branch:** `refactor/staged-hardening`  
**Integration HEAD:** Wave 2 complete (pending merge commit)  
**Final target:** `dev`  
**Last updated:** 2026-05-26

## Wave overview

| Wave | Focus | Agents | Status |
|------|-------|--------|--------|
| **1** | Security + hygiene + manifest/types | 5 parallel | 🟢 Merged |
| **2** | Export pipeline (`withDb`) + find semantics | 2 sequential | 🟢 Complete |
| **3** | Architecture split | 3–6 parallel | 🔵 Ready to start |
| **4** | TS6 + contract hardening | 2 parallel | ⚪ Blocked by Wave 3 |

Legend: 🔵 Not started · 🟡 In progress · 🟢 Merged · 🔴 Blocked

---

## Wave 1 — agents (complete)

| ID | Role | Branch | Status | Merge |
|----|------|--------|--------|-------|
| **W1A** | Security | `refactor/w1a-security` | 🟢 | `6eb9aae` |
| **W1B** | Logging | `refactor/w1b-logging` | 🟢 | `b3c415b` |
| **W1C** | Cleanup | `refactor/w1c-cleanup` | 🟢 | `358a7a7` |
| **W2A** | Manifest/Docs | `refactor/w2a-manifest` | 🟢 | `c370b0f` |
| **W2B** | API types | `refactor/w2b-types` | 🟢 | `1fc422b` |

---

## Wave 2 — agents (complete)

| ID | Role | Branch | Status | Merge |
|----|------|--------|--------|-------|
| **W2A** | Pipeline infra | `refactor/w2a-pipeline-infra` | 🟢 | `b6dc6f9` |
| **W2B** | Exports wire-up | `refactor/w2b-exports-pipeline` | 🟢 | (this commit) |

### Wave 2 integration gate

```bash
yarn tsc && yarn test && yarn build && yarn lint
```

**Result:** `yarn tsc` ✓ · **63/63 tests** · `yarn build` ✓ · `yarn lint` ✓

### Wave 2 changes

- [x] `withDb` pipeline wired in `exports.ts`
- [x] `find` not-found → `{ success: true, data: null }` (breaking — `CHANGES.md`)
- [x] `redactMongoUri` in connector logs
- [x] `TriggerEvent` instead of `emitNet` for connect/disconnect
- [x] `it.todo` resolved in `api-contract.test.ts`

---

## Checklist — Wave 2 complete

- [x] W2A merged
- [x] W2B implemented
- [x] 0 todos in test suite
- [x] `REFACTOR-STATUS.md` updated
- [ ] `WAVE-3-SPEC.md` created (architecture split)

## Next: Wave 3

Bootstrap + IndexService + handler split — see orchestrator skill.
