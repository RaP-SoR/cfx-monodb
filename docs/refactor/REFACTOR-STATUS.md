# Refactor Status Board

> Orchestrator maintains this file after each merge. Do not edit agent-owned rows while work is in progress.

**Base branch:** `refactor/staged-hardening`  
**Integration HEAD:** `b6dc6f9` (Wave 2 W2A pipeline infra merged)  
**Final target:** `dev`  
**Last updated:** 2026-05-26

## Wave overview

| Wave | Focus | Agents | Status |
|------|-------|--------|--------|
| **1** | Security + hygiene + manifest/types | 5 parallel | 🟢 Merged |
| **2** | Export pipeline (`withDb`) + find semantics | 2 sequential | 🟡 W2A merged — W2B next |
| **3** | Architecture split | 3–6 parallel | ⚪ Blocked by Wave 2 |
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

### Wave 1 integration gate

**Result:** `yarn tsc` ✓ · **54 passed | 1 todo** · `yarn build` ✓

---

## Wave 2 — agents

| ID | Role | Branch | Owned files | Status | Merge |
|----|------|--------|-------------|--------|-------|
| **W2A** | Pipeline infra | `refactor/w2a-pipeline-infra` | `src/api/*`, `src/types/dbProvider.ts`, tests | 🟢 | `b6dc6f9` |
| **W2B** | Exports wire-up | `refactor/w2b-exports-pipeline` | `exports.ts`, connector logs, docs, contract test | 🔵 | — |

**Spec:** [WAVE-2-SPEC.md](WAVE-2-SPEC.md)  
**Merge order:** W2A → gate → W2B → gate (sequential, not parallel)

### Wave 2 decisions

- [x] `find` not-found → `{ success: true, data: null }` (breaking — CHANGES.md required)
- [ ] Resolve `it.todo` in `tests/api-contract.test.ts`

---

## Checklist — Wave 1 complete

- [x] All 5 agent branches merged into `refactor/staged-hardening`
- [x] Gate commands green on integration branch
- [x] `REFACTOR-STATUS.md` updated
- [x] `WAVE-2-SPEC.md` created

## Checklist — Wave 2 complete

- [x] W2A merged
- [ ] W2B merged
- [ ] 0 todos in test suite (or documented deferrals)
- [ ] `REFACTOR-STATUS.md` Wave 2 → 🟢
