# Änderungen (Changelog)

## Unreleased (dev)

### Runtime

- **FiveM FS sandbox:** `src/fivemFsCompat.ts` stubs `fs.promises.access` for MongoDB’s `/.dockerenv` probe so connect no longer fails with `Access to this API has been restricted` (official [Cfx workaround](https://docs.fivem.net/docs/scripting-manual/migrating-from-other-platforms/)). Loaded from `src/index.ts` before bootstrap.

---

## 1.0.1 — Examples, security, integration (2026-05-27)

> **Dev pre-release:** tag [`v1.0.1-dev`](releases/v1.0.1-dev.md) · **130** unit tests · Node 22 + `mongodb@7`

Patch release on **`dev`**: consumer documentation, security hardening, integration CI, and maintainer tooling since [`v1.0.0`](#100--erstes-github-release-2026-05-26).

### Security

- **`insert`:** `validateDocument()` before `insertOne` — blocks `$operator` payloads and depth/size overflow
- **`config()`:** `logLevel` uses effective `getLogLevel()` after invalid ConVar
- **`docs/SECURITY.md`** — trust model, caller tiers, configurable limits (ConVar / consumer code)
- **Examples (SF-3):** collection-name literals + insert validation in `lua/patterns.md` and `typescript/patterns.md`
- **Plans:** `SECURITY-FIXES-PLAN.md` (SF-1…4 done), `PRE-STABLE-FIXLIST.md`, revised `PRE-STABLE-ROADMAP.md`

### Examples & documentation

- **Language split:** `docs/examples/lua/` and `docs/examples/typescript/` — snippets, queries, patterns, use-cases, runnable `server.lua` / `server.ts`
- **`sample-resource/`** — copyable multi-file Lua consumer (accounts, characters, vehicles, items)
- **FiveM flows:** export coverage tables, JOIN analogy, time zones, `datetime-helpers.*`
- **`yarn doc-audit`** · **examples-docs** skill · `DOCUMENTATION-AUDIT-2026.md` · API limitations / denylist
- **Cleanup:** removed root example stubs; use `yarn gate` / `yarn scout` (dropped `scripts/gate.sh`, `scripts/scout.sh`)
- Root redirect stubs: `lua.md`, `typescript.md`, `queries.md`, `patterns.md` → language folders

### Testing & integration

- **130** unit tests — handler modules (`admin`, `read`, `write`, `lifecycle`), contract sync, logging
- **Integration:** `connector.test.ts`, `crud-roundtrip.test.ts`, `batch-update.test.ts` (200 export updates &lt;30s)
- **`.github/workflows/integration.yml`**

### Performance & observability

- **`yarn seed:test-data`** / **`yarn bench:crud`** — local Mongo stress without a framework
- **`tests/fixtures/perf-seed.json`** · `scripts/README.md`
- Slow-query logging + **`getQueryStats`** (ConVars; see [CONFIGURATION.md](CONFIGURATION.md))

### Tooling & CI

- **`yarn gate`**, **`yarn scout`**, **`docs/CHECKLIST.md`**, PR template
- **Release channels:** `dev` → `vX.Y.Z-dev` pre-releases; `main` → stable `vX.Y.Z`
- **Quality audit 3:** ~92% in `QUALITY-AUDIT-2026.md` (Tracks E–K)

### Upgrade from v1.0.0

- No breaking export API changes — same `server_exports` and response envelopes
- **`insert`** now rejects documents with forbidden operators (same rules as filters/updates)
- Example paths moved under `docs/examples/lua/` and `docs/examples/typescript/` (root stubs removed)

---

## 1.0.0 — Erstes GitHub Release (2026-05-26)

> **Stable baseline** on `main` · tag `v1.0.0` · dev pre-release was `v1.0.0-dev`

- **Erstes Release-Zip** via GitHub Actions (`release.yml`) — Download ohne lokales `yarn build`
- Refactor (Handler-Split, `withDb`, Node 22, MongoDB v7), Slow-Query-Log, `getQueryStats`
- Doku: `docs/CONFIGURATION.md`, API, Examples, Quality-Audit-Baseline
- **89 Tests**, Contract-Sync manifest ↔ `CFX_MONGODB_EXPORTS`

## Earlier development (archive)

> Entries below predate the **v1.0.0** GitHub release and are kept for history.

## Docs — GitHub Release CI (Track I)

- **`.github/workflows/release.yml`** — gate + ZIP on `dev` push, tag `v*`, manual dispatch
- **`scripts/pack-release.sh`** — local/CI pack (dist + fxmanifest + prod node_modules)
- **[CONFIGURATION.md](CONFIGURATION.md)** — install from Releases/Artifacts without `yarn build`

## Docs — configuration guide & dev/prod profiles

- **[CONFIGURATION.md](CONFIGURATION.md)** — ConVar-first install (recommended callout), multi-developer `exec` + gitignore, dev vs prod.
- Profile templates: [examples/config/](examples/config/) (`mongodb.dev/prod/local.cfg.example`).

## Maintenance — Track C2 (getQueryStats) (dev)

- **`getQueryStats` export:** Sync admin snapshot — samples ring buffer, aggregates (p50/p95/slowCount).
- **ConVar:** `mongodb_perf_buffer` (default 100, max 1000).
- **Tests:** Ring buffer, percentiles, contract sync for `getQueryStats` (89 tests total).

## Maintenance — Track B (TSDoc) & Track C1 (slow query log) (dev)

- **TSDoc:** Module headers on `withDb`, `validateQuery`, `connector`, `indexService`, `registerExports`, `perf`; TSDoc standard in `AGENTS.md`.
- **Slow queries:** Opt-in ConVars `mongodb_perf_enabled`, `mongodb_perf_slow_ms`, `mongodb_perf_log_all` — MySQL-style `SLOW QUERY` warnings via `withDb` (default off, no overhead when disabled).
- **`config()` export:** Returns `perfEnabled`, `perfSlowMs`, `perfLogAll` for admin diagnostics.
- **Tests:** `tests/perf.test.ts` + slow-query case in `withDb.test.ts` (83 tests total).

## Docs — examples & lifecycle diagrams (dev)

- Runnable `docs/examples/server.ts` and `server.lua` now wait for `cfx-mongodb:ready` (no CRUD race on consumer start).
- Coverage matrix in `docs/examples/README.md`; `findById`, `getVersion`, not-found cases in runnable samples.
- Mermaid lifecycle + module diagrams in `docs/ARCHITECTURE.md`.

## Docs — consolidation under `docs/` (dev)

- Root MD files moved: `DOCS.md` → `docs/GUIDE.md`, `CHANGES.md` → `docs/CHANGELOG.md`, `SEARCH-MAP.md` → `docs/SEARCH-MAP.md`.
- Examples unified under `docs/examples/` (`typescript.md`, `lua.md`, `server.ts`, `server.lua`, manifests).
- New hub: `docs/README.md`. Updated for post-refactor architecture and `find` not-found semantics.

## Wave 4 (refactor/staged-hardening) — TypeScript 6 & contract hardening

- **W4A:** `typescript@6` — `tsconfig.json` auf `target: ES2022`, `moduleResolution: bundler`, `lib: ES2022` (kein DOM; Node-22-only).
- **W4B:** `tests/api-contract.test.ts` — `fxmanifest.lua` ↔ `CFX_MONGODB_EXPORTS` Sync + Response-Envelope-Invarianten.
- **CI:** Build-Workflow auch für `dev` und `refactor/staged-hardening`; `yarn npm audit --severity moderate` (informational, `continue-on-error`).

## Wave 3 (refactor/staged-hardening) — Bootstrap & IndexService

- **W3A:** `src/bootstrap.ts` — Lifecycle aus `index.ts`; `connector.ts` ohne `registerExports` (kein zirkulärer Import).
- **W3B:** `src/services/indexService.ts` — gemeinsame Index-Logik für Startup und `ensureIndexes`-Export.
- **W3C–W3D:** Handler in `src/api/handlers/*`, Wiring in `src/api/registerExports.ts`; `src/exports.ts` ist Shim-Re-Export.

## Wave 2 (refactor/staged-hardening) — Export pipeline & find semantics

- **Breaking:** `find(collection, filter)` bei fehlendem Dokument → `{ success: true, data: null }` (aligned mit `findById`).
- **Refactor:** CRUD-Exports nutzen `withDb`-Pipeline (`src/api/withDb.ts`) und `normalizeIdFilter`.
- **Logging:** Kein `console.*` mehr in `exports.ts`; Connection-URLs in `connector.ts` mit `redactMongoUri`.
- **Events:** `connect`/`disconnect` nutzen `TriggerEvent` statt `emitNet` (server-only Resource).

## Wave 1 (refactor/staged-hardening) — Manifest & Docs Sync (W2A)

- **Kein Runtime-Break:** Verhalten unverändert; nur Manifest- und Dokumentationsabgleich.
- **`fxmanifest.lua`:** `ensureIndexes`, `health`, `config` zu `server_exports` hinzugefügt (waren implementiert, fehlten im Manifest).
- **`docs/API.md`:** Vollständiger Export-Index; `getDb`, `connect`, `disconnect` als Advanced/Internal mit Sicherheitswarnung; Events (`TriggerEvent` vs `emitNet`, `cfx-mongodb:ready`, `cfx-mongodb:connected`).
- **`SEARCH-MAP.md`:** Export-Tabelle bereinigt und mit Manifest synchronisiert.
- **`doc-lua.md` / `doc-typescript.md`:** Event-Handler-Beispiele und Internal-Export-Hinweise ergänzt.

### Legacy — CTFFramework compatibility track (pre-1.0.0)

- **Laufzeit:** Offiziell nur noch **Node 22** (`node_version '22'`, `engines: >=22 <23`). Kein Support für FiveM/RedM Node 16/18.
- **API:** `getVersion()` Export; CTFFramework-Contract (`insertedId` als String, `modifiedCount`, `deletedCount`, `findAll`-Options)
- **Dependencies** (Minor/Patch): `mongodb` 7.0.0 → 7.2.0, `vite` 7.3.0 → 7.3.3, `@typescript-eslint/*` 8.50.1 → 8.60.0, …
- **Neu:** `findById`, `getDb` Exports implementiert; alle Registrierungen über `exportFn`
- **Tests:** Vitest-Suite unter `tests/exports.test.ts` (19 Tests für Export-API)

## 1.1.0 – Node 22, Sicherheit & Performance, Beispiele

- Laufzeit & Build
  - Node 22-Unterstützung (fxmanifest `node_version '22'`).
  - Vite auf Node-SSR umgestellt (keine Browser-Polyfills, `global.navigator` entfernt/definiert).
  - Abhängigkeiten aktualisiert (u. a. `mongodb@^7`, `vite@^5/7`, TypeScript ^5.x).

- Sicherheit & Stabilität
  - Validierung von Filtern/Updates mit Denylist gefährlicher Operatoren (`$where`, `$accumulator`, `$function`, …).
  - Konfigurierbare Poolgrößen über ConVars: `mongodb_max_pool`, `mongodb_min_pool` (mit Clamping).
  - Zeitüberschreitung via `mongodb_timeout` konsistent angewendet.
  - Strukturierte Logs mit `mongodb_log_level` (`error|warn|info|debug`).

- API & Exporte (Server)
  - Bestehende CRUD-Exporte beibehalten: `insert`, `find`, `findAll`, `update`, `delete`, `count`, `getDb`, `isConnected`.
  - Neu: `ensureIndexes` (manuell Indizes anlegen).
  - Neu: `health` (Ping/RTT), `config` (sichere Laufzeitkonfiguration einsehbar).
  - `findAll` unterstützt `projection`, `sort`, `limit`, `skip` (mit sicheren Defaults/Clamps).
  - Einheitliche `_id`-Behandlung (String ↔ ObjectId) über Hilfsfunktion.

- Automatische Indizes
  - ConVar `mongodb_init_indexes` (JSON) ermöglicht Anlegen von Indizes beim Start.
  - Begrenzungen: max. 50 Collections, 20 Indizes je Collection; Logging je Ergebnis.
  - Event `cfx-mongodb:ready` nach erfolgreicher Verbindung & Index-Initialisierung.

- Typen & Linting
  - TS-Konfiguration auf Server-Typen fokussiert (`@citizenfx/server`), moderne Libs, `skipLibCheck`.
  - ESLint v9 Flat-Config + Prettier integriert; verbleibende Warnungen nur bei unvermeidbaren Casts (FiveM-Globals/Driver-Optionen).

- CI/CD
  - CI-Build nur noch Node 22 (kein node16-Branch mehr).

- Beispiele & Dokus
  - Neue Beispiele: `examples/server.ts`, `examples/server.lua`.
  - Leitfäden: `examples/typescript.md`, `examples/lua.md`.
  - Beispiel-Manifeste: `examples/fxmanifest-lua-example.lua`, `examples/fxmanifest-ts-example.lua`.
  - README ergänzt: „Quick Test außerhalb der Ressource“ inkl. ConVars & Startreihenfolge.

## Hinweise zum Upgrade von v6 → v7 (mongodb)
- Entfernte/veraltete Optionen (z. B. `useNewUrlParser`, `useUnifiedTopology`) nicht mehr setzen.
- `FindOptions<T>` → ohne generischen Parameter verwenden.
- Empfohlen: explizite Timeout-/Pool-Optionen und Validierung nutzen.

## Breaking Changes
- Erfordert Node 22-Laufzeit (siehe `fxmanifest.lua`).
- Einige API-Beispiele in den alten Docs wurden auf aktuelle Exportnamen (`insert`, `findAll`, `update`, `delete`) angepasst.
