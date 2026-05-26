# Documentation audit — cfx-mongodb (2026-05)

Final review: **codebase capabilities vs docs/examples**. Status: **ready to ship** for consumer DX; minor API.md gaps closed in the same pass.

## Score (consumer documentation)

| Area | Coverage | Notes |
|------|:--------:|-------|
| All 16 `server_exports` | ✅ 100% | Index in API.md + [lua/use-cases.md](examples/lua/use-cases.md) coverage table |
| CRUD + envelopes | ✅ | API.md, patterns, snippets |
| Query operators / cookbook | ✅ | [lua/queries.md](examples/lua/queries.md) (+ TS mirror) |
| FiveM use cases (account/char/vehicle/items) | ✅ | use-cases + [sample-resource/](examples/sample-resource/) |
| Events (`ready`, `connected`) | ✅ | API.md, patterns; `disconnected` documented below |
| ConVars | ✅ | API.md + CONFIGURATION.md (pool/init_indexes beyond fxmanifest category) |
| Security / denylist | ✅ | queries + API.md (aligned with `validateQuery.ts`) |
| What is **not** supported | ✅ | See [Limitations](#limitations-not-in-exports) below + examples/README |
| TypeScript types (npm) | ✅ | CONFIGURATION.md, TS patterns |
| Agent navigation | ✅ | SEARCH-MAP.md, AGENTS.md |

**Overall:** ~**95%** for hobby/framework consumers. Remaining 5% = intentional (advanced `getDb`, aggregation via driver only).

---

## Export ↔ documentation matrix

| Export | API.md | use-cases | snippets | queries | sample-resource |
|--------|:------:|:---------:|:--------:|:-------:|:---------------:|
| `find` | ✅ | Flow A,F,G | ✅ | ✅ | accounts.lua |
| `findById` | ✅ | Flow B | ✅ | ✅ | characters.lua |
| `findAll` | ✅ | Flow B,C | ✅ | ✅ | characters/vehicles |
| `insert` | ✅ | Flow A,B,F | ✅ | ✅ | accounts/characters |
| `update` | ✅ | Flow A,D,E,G | ✅ | ✅ | all modules |
| `delete` | ✅ | reference | ✅ | — | — |
| `count` | ✅ | Flow B | ✅ | ✅ | — |
| `getVersion` | ✅ | reference | ✅ | — | main.lua |
| `isConnected` | ✅ | Flow A | ✅ | — | main.lua |
| `ensureIndexes` | ✅ | reference | ✅ | — | main.lua |
| `health` | ✅ | reference | ✅ | — | main.lua |
| `config` | ✅ | reference | ✅ | — | — |
| `getQueryStats` | ✅ | reference | — | perf § | — |
| `connect` | ✅ Advanced | Advanced | — | — | — |
| `disconnect` | ✅ Advanced | Advanced | — | — | — |
| `getDb` | ✅ Advanced | Advanced | — | — | — |

---

## Events ↔ documentation

| Event | Code | Documented |
|-------|------|------------|
| `cfx-mongodb:ready` | `bootstrap.ts` | ✅ API.md, all examples |
| `cfx-mongodb:connected` | `connector.ts`, `lifecycle.connect` | ✅ API.md (payload `success`, optional error on failure) |
| `cfx-mongodb:disconnected` | `lifecycle.disconnect` | ✅ API.md (added in audit pass) |

Consumer rule: **CRUD after `ready`**, not only `connected`.

---

## Query & Mongo capabilities

| Capability | Via exports | Documented where |
|------------|-------------|------------------|
| Filters (`$in`, `$and`, …) | `find` / `findAll` / `count` | queries.md §3 |
| Updates (`$set`, `$inc`, `$push`, …) | `update` | queries.md §4 |
| Dot notation / nested docs | filters | queries.md §3.7 |
| “JOIN-like” 1:N (account→char→vehicle) | multiple `find`/`findAll` | queries.md §3.7, use-cases |
| Pagination `limit`/`skip`/`sort`/`projection` | `findAll` | API.md, patterns, queries §5 |
| `_id` string → ObjectId | all filters | patterns, API.md |
| UTC + region day boundaries | filters on ISO dates | queries.md §3.9, datetime-helpers.* |
| Index bootstrap | `ensureIndexes`, ConVar | patterns, CONFIGURATION |
| Slow query stats | `getQueryStats` + perf ConVars | API.md, patterns §6 |

---

## Limitations (not in exports)

Documented for expectations management — **not gaps**, by design:

| Feature | Status | Doc |
|---------|--------|-----|
| Aggregation pipeline (`aggregate`) | ❌ | examples/README, API.md § limitations |
| Transactions | ❌ | same |
| Change streams | ❌ | same |
| `updateMany` / `deleteMany` | ❌ — only `updateOne` / `deleteOne` | API.md § limitations |
| SQL `JOIN` | ❌ — link collections manually | queries.md §3.7, §8 |
| `insert` operator denylist | ✅ `validateDocument` on insert (SF-1) | [SECURITY.md](SECURITY.md) |
| `validateDocument` exists in code | unused on `insert` path | note for future hardening |

---

## ConVars: fxmanifest vs full list

`fxmanifest.lua` `convar_category` lists perf + URLs. Also used (documented in API.md / CONFIGURATION.md):

- `mongodb_max_pool`, `mongodb_min_pool`, `mongodb_log_level`, `mongodb_init_indexes`

---

## Recommended reading order (Lua consumer)

1. [examples/lua/use-cases.md](examples/lua/use-cases.md)
2. [examples/lua/patterns.md](examples/lua/patterns.md)
3. [examples/lua/queries.md](examples/lua/queries.md)
4. [examples/sample-resource/README.md](examples/sample-resource/README.md) — copy to server
5. [API.md](API.md) — contract details
6. [CONFIGURATION.md](CONFIGURATION.md) — install

TypeScript: replace `lua/` with `typescript/` in paths above.

---

## Ideas backlog (post-close, optional)

| Idea | Priority | Notes |
|------|----------|-------|
| Call `validateDocument` on `insert` | Medium | Code ready; behavior change → changelog |
| `docs/examples/schema-versioning.md` | Low | Plan exists in plans/ |
| Integration test doc in CI | Track J | plans/INTEGRATION-REVIEW-PLAN.md |
| RedM-specific callout in GUIDE | Low | fxmanifest already lists `rdr3` |

---

## Audit conclusion

**Documentation matches the shipped export surface.** Examples go beyond API signatures (FiveM flows, numbered steps, time zones, sample resource). No blocking doc work before calling the examples track **done**.

Maintainers: on export/validation changes:

```bash
yarn doc-audit   # export list + files to verify
yarn scout       # gate + reminders
```

Agent routine: `.cursor/skills/examples-docs/SKILL.md` · Template: `.cursor/skills/examples-docs/TEMPLATE.md`
