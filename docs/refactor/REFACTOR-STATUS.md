# Refactor Status Board

> Orchestrator maintains this file after each merge. Do not edit agent-owned rows while work is in progress.

**Base branch:** `refactor/staged-hardening`  
**Integration HEAD:** `4b100f2` (Wave 3 complete — W3D wiring merged)  
**Final target:** `dev`  
**Last updated:** 2026-05-26

## Wave overview

| Wave | Focus | Agents | Status |
|------|-------|--------|--------|
| **1** | Security + hygiene + manifest/types | 5 parallel | 🟢 Merged |
| **2** | Export pipeline (`withDb`) + find semantics | 2 sequential | 🟢 Complete |
| **3** | Architecture split | 2 + 3 + 1 staged | 🟢 Complete |
| **4** | TS6 + contract hardening | 2 parallel | 🔵 Ready |

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
- [x] `WAVE-3-SPEC.md` created

## Wave 3 — agents

| ID | Role | Branch | Status | Merge |
|----|------|--------|--------|-------|
| **W3A** | Bootstrap | `refactor/w3a-bootstrap` | 🟢 | `50b798d` |
| **W3B** | IndexService | `refactor/w3b-index-service` | 🟢 | `6cb1192` |
| **W3C1** | Read handlers | `refactor/w3c1-handlers-read` | 🟢 | `d2ead21` |
| **W3C2** | Write handlers | `refactor/w3c2-handlers-write` | 🟢 | `9a76cc4` |
| **W3C3** | Admin/lifecycle | `refactor/w3c3-handlers-ops` | 🟢 | `830eb19` |
| **W3D** | Wiring + shim | `refactor/w3d-register-exports` | 🟢 | `4b100f2` |

**Spec:** [WAVE-3-SPEC.md](WAVE-3-SPEC.md)  
**Order:** W3A → W3B → (W3C1 ∥ W3C2 ∥ W3C3) → W3D

### Wave 3 integration gate

```bash
yarn tsc && yarn test && yarn build && yarn lint
```

**Result:** `yarn tsc` ✓ · **70/70 tests** · `yarn build` ✓ · `yarn lint` ✓

### Wave 3 changes

- [x] `bootstrap.ts` decouples lifecycle from connector
- [x] `IndexService` shared for startup + `ensureIndexes`
- [x] Handlers split: `read`, `write`, `admin`, `lifecycle`
- [x] `registerExports.ts` wiring; `exports.ts` is 1-line shim

## Next: Wave 4

TS6 upgrade + contract hardening — [WAVE-4-SPEC.md](WAVE-4-SPEC.md). Run `/multitask` with prompt in [README.md](README.md).

## Wave 4 — agents

| ID | Role | Branch | Status | Merge |
|----|------|--------|--------|-------|
| **W4A** | TypeScript 6 + tsconfig | `refactor/w4a-typescript6` | 🔵 | — |
| **W4B** | Contract tests + CI | `refactor/w4b-contract-ci` | 🔵 | — |

**Spec:** [WAVE-4-SPEC.md](WAVE-4-SPEC.md)  
**Order:** W4A ∥ W4B → integration gate → PR to `dev`
