# Änderungen (Changelog)

## Wave 2 (refactor/staged-hardening) — Export pipeline & find semantics

- **Breaking:** `find(collection, filter)` bei fehlendem Dokument liefert jetzt `{ success: true, data: null }` statt `{ success: false, error: "Document not found" }` — aligned mit `findById`. CTFFramework-Consumer müssen `result.data === null` prüfen statt nur `!result.success`.
- **Refactor:** CRUD-Exports nutzen `withDb`-Pipeline (`src/api/withDb.ts`) und `normalizeIdFilter`.
- **Logging:** Kein `console.*` mehr in `exports.ts`; Connection-URLs in `connector.ts` mit `redactMongoUri`.
- **Events:** `connect`/`disconnect` nutzen `TriggerEvent` statt `emitNet` (server-only Resource).

## Wave 1 (refactor/staged-hardening) — Manifest & Docs Sync (W2A)

- **Kein Runtime-Break:** Verhalten unverändert; nur Manifest- und Dokumentationsabgleich.
- **`fxmanifest.lua`:** `ensureIndexes`, `health`, `config` zu `server_exports` hinzugefügt (waren implementiert, fehlten im Manifest).
- **`docs/API.md`:** Vollständiger Export-Index; `getDb`, `connect`, `disconnect` als Advanced/Internal mit Sicherheitswarnung; Events (`TriggerEvent` vs `emitNet`, `cfx-mongodb:ready`, `cfx-mongodb:connected`).
- **`SEARCH-MAP.md`:** Export-Tabelle bereinigt und mit Manifest synchronisiert.
- **`doc-lua.md` / `doc-typescript.md`:** Event-Handler-Beispiele und Internal-Export-Hinweise ergänzt.

## 1.0.1 – CTFFramework-Kompatibilität, Node-22-only, Dependency-Updates

- **Version:** `1.0.1` (experimentell — kein 2.x-Sprung)
- **Laufzeit:** Offiziell nur noch **Node 22** (`node_version '22'`, `engines: >=22 <23`). Kein Support für FiveM/RedM Node 16/18 — veraltete, sicherheitskritische Paketketten.
- **API:** `getVersion()` Export; CTFFramework-Contract (`insertedId` als String, `modifiedCount`, `deletedCount`, `findAll`-Options)
- **Dependencies** (Minor/Patch, keine Major-Breaks):
  - `mongodb` 7.0.0 → 7.2.0
  - `vite` 7.3.0 → 7.3.3
  - `@typescript-eslint/*` 8.50.1 → 8.60.0
  - `@citizenfx/client|server` 2.0.23683-1 → 2.0.29753-1
  - `@types/node` 25.0.3 → 25.9.1, `eslint` 9.39.2 → 9.39.4, `prettier` 3.7.4 → 3.8.3
- **Bewusst nicht aktualisiert** (Major, Breaking): `eslint@10`, `typescript@6`, `vite@8`
- **CI:** Node-16-Matrix entfernt; Build nur noch auf Node 22
- **Docs:** Search Map, API-Referenz, Cursor Skills/Rules für Agent-Arbeit
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

