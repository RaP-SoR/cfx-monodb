# Wave 4 Spec — TypeScript 6 + contract hardening

**Target merge branch:** `refactor/staged-hardening`  
**Prerequisite:** Wave 3 complete (`4b100f2` or later)

Wave 4 modernizes the toolchain for Node 22 / TS 7 readiness and locks the public export contract with CI guardrails.

**Strategy:** 2 **parallel** agents — no shared source files.

---

## Global rules

1. **No CTFFramework behavior changes** — response envelopes and export semantics unchanged.
2. Gate: `yarn tsc && yarn test && yarn build && yarn lint`
3. Exports never throw; `insertedId` always string.
4. Read `AGENTS.md` and `.cursor/skills/cfx-mongodb/SKILL.md`.
5. Update `CHANGES.md` when toolchain or CI behavior changes.

---

## Merge train overview

```
W4A (TS6 + tsconfig)  ∥  W4B (contract + CI)
         ↓ merge any order
   Wave 4 integration gate → PR refactor/staged-hardening → dev
```

---

## Agent W4A — TypeScript 6 + tsconfig modernization

**Branch:** `refactor/w4a-typescript6`  
**Model:** Claude Sonnet (compiler migration)

### OWNS

| File | Action |
|------|--------|
| `package.json` | bump `typescript` to `^6.0.0`; bump `@typescript-eslint/*` if TS 6 requires it |
| `yarn.lock` | refresh after install |
| `tsconfig.json` | modern Node-only settings (see below) |
| `CHANGES.md` | Wave 4 toolchain note |

### MUST NOT TOUCH

- `tests/api-contract.test.ts`, `tests/helpers/*` (W4B)
- `.github/workflows/*` (W4B)
- `src/api/handlers/*`, `fxmanifest.lua`

### Target `tsconfig.json` (intent)

| Option | From | To | Why |
|--------|------|-----|-----|
| `target` | `es2016` | `ES2022` | FiveM Node 22; drop legacy emit |
| `module` | `commonjs` | `commonjs` | keep — Vite emits CJS for FiveM |
| `moduleResolution` | `node` (deprecated) | `bundler` | TS 6 path with `module: commonjs` + Vite |
| `lib` | `es2022`, `dom`, `dom.iterable` | `ES2022` only | server-only resource — no DOM |
| `baseUrl` | `"."` | **remove** | unused; deprecated in TS 6 |

Do **not** set `"ignoreDeprecations": "6.0"` unless a deprecation cannot be resolved — prefer fixing config.

### Tasks

1. `yarn add -D typescript@^6.0.0` (and eslint TS packages if needed).
2. Apply tsconfig changes; fix any new type errors in `src/` only if caused by config (should be minimal).
3. Verify `yarn tsc`, `yarn test`, `yarn build`, `yarn lint` green.
4. Document upgrade in `CHANGES.md` under Wave 4.

### Acceptance

- [ ] `typescript` ≥ 6.0 in `package.json`
- [ ] No `dom` in `lib`; `moduleResolution` not `node`
- [ ] Full gate green
- [ ] No handler or export behavior changes

**Commit:** `chore(w4a): upgrade to TypeScript 6 and modernize tsconfig`

---

## Agent W4B — Contract hardening + CI

**Branch:** `refactor/w4b-contract-ci`  
**Model:** Codex / Composer Fast

### OWNS

| File | Action |
|------|--------|
| `tests/api-contract.test.ts` | extend contract coverage |
| `tests/helpers/manifest-exports.ts` | **new** — parse `fxmanifest.lua` `server_exports` |
| `.github/workflows/build.yml` | branch triggers + optional audit step |
| `CHANGES.md` | CI / contract notes (Wave 4 section only if W4A didn't add yet — coordinate in one bullet list) |

### MUST NOT TOUCH

- `package.json`, `tsconfig.json`, `yarn.lock` (W4A)
- `src/**` (unless a type-only import is strictly required — avoid)

### Contract tests to add

1. **`fxmanifest.lua` ↔ `CFX_MONGODB_EXPORTS` sync**
   - Parse `server_exports { ... }` from `fxmanifest.lua`.
   - Assert same set as `CFX_MONGODB_EXPORTS` (order may differ — compare sorted).

2. **Response envelope invariants** (mock db, existing helpers):
   - `insert` success → `{ success: true, insertedId: string }`
   - `insert` disconnected → `{ success: false, error: string }`
   - `update` success → `{ success: true, matchedCount, modifiedCount }`
   - `delete` zero matches → `{ success: false, error: "Document not found" }`
   - `health` success → `{ success: true, data: { ok: true, rttMs: number } }`

3. Keep existing not-found semantics test for `find` / `findById`.

### CI tasks

1. Extend workflow triggers:
   ```yaml
   branches: [main, dev, node22, refactor/staged-hardening]
   ```
   for both `push` and `pull_request`.

2. Add audit step after install (non-blocking or moderate threshold):
   ```yaml
   - name: Audit dependencies
     run: yarn npm audit --severity moderate
     continue-on-error: true
   ```
   Document in `CHANGES.md` that audit is informational until baseline is clean.

### Acceptance

- [ ] Manifest ↔ types export list test fails if either side drifts
- [ ] ≥ 3 new envelope invariant tests
- [ ] CI runs on `dev` and `refactor/staged-hardening`
- [ ] Full gate green (run with current TS 5.9 on branch; W4A merge may follow)

**Commit:** `test(w4b): harden API contract and extend CI gate`

---

## File ownership matrix (Wave 4)

| File | W4A | W4B |
|------|-----|-----|
| package.json / yarn.lock | ✅ | |
| tsconfig.json | ✅ | |
| tests/api-contract.test.ts | | ✅ |
| tests/helpers/manifest-exports.ts | | ✅ |
| .github/workflows/build.yml | | ✅ |
| CHANGES.md | ✅ (toolchain) | ✅ (CI) — merge conflict unlikely |

---

## Wave 4 complete checklist

- [ ] W4A + W4B merged (any order)
- [ ] Gate green (**70+** tests expected after W4B)
- [ ] `REFACTOR-STATUS.md` Wave 4 → 🟢
- [ ] Open PR `refactor/staged-hardening` → `dev` (orchestrator)

---

## After Wave 4 — milestone PR

When Wave 4 gate is green on `refactor/staged-hardening`:

1. Final gate on integration branch
2. PR → `dev` with summary from Waves 1–4 (`CHANGES.md` + `docs/refactor/REFACTOR-STATUS.md`)
3. Optional: merge `dev` → `main` after review
