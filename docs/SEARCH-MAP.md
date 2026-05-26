# Search Map — cfx-mongodb

Navigationskarte für KI-Agenten und Entwickler. Lies diese Datei zuerst, bevor du im Repo suchst.

## Was ist dieses Projekt?

FiveM/RedM **Server-Resource** (`cfx-mongodb`): TypeScript-Wrapper um den offiziellen MongoDB Node-Treiber. Andere Ressourcen sprechen MongoDB **ausschließlich über FiveM-Exports** an — kein direkter DB-Zugriff.

**Kritisch:** Laufzeit ist FiveMs eingebettetes Node **22** (`node_version '22'` in `fxmanifest.lua`). Ohne das laufen ältere Node-Versionen und `mongodb@7` bricht.

## Schnellnavigation (Aufgabe → Datei)

| Aufgabe | Wo suchen |
|---------|-----------|
| Export hinzufügen/ändern | `src/api/handlers/*.ts` + `src/api/registerExports.ts` |
| Export-Shim (Re-Export) | `src/exports.ts` |
| Rückgabe-Typen (success/error) | `src/responses.ts` |
| MongoDB-Verbindung / Singleton | `src/connector.ts` |
| ConVar-Konfiguration (URLs, Pool) | `src/config.ts` |
| Query-Sicherheit (Denylist) | `src/validateQuery.ts` |
| findAll-Optionen (limit/skip/sort) | `src/types/options.ts`, `src/api/handlers/read.ts` |
| Resource-Start / Index-Init | `src/bootstrap.ts` |
| FiveM-Globals (GetConvar, exports) | `src/types/fivem.d.ts` |
| Hilfsfunktionen (log, ObjectId) | `src/utils.ts` |
| Slow-query-Logging (ConVar) | `src/perf.ts`, `src/api/withDb.ts` |
| Manifest, server_exports, node_version | `fxmanifest.lua` |
| Build (Vite SSR → dist/) | `vite.config.mjs`, `yarn build` |
| Externe API (Vertrag) | `docs/API.md` |
| Architektur-Überblick | `docs/ARCHITECTURE.md` |
| Agent-Regeln & Workflow | `AGENTS.md` |
| Lua-Beispiele | `docs/examples/lua.md`, `docs/examples/server.lua` |
| TypeScript-Beispiele | `docs/examples/typescript.md`, `docs/examples/server.ts` |
| Changelog | `docs/CHANGELOG.md` |
| Dokumentations-Index | `docs/README.md` |

## Modulgraph

```
fxmanifest.lua
  └── dist/index.js  ← yarn build aus src/
        ├── index.ts              import bootstrap
        ├── bootstrap.ts          lifecycle, registerExports, index init
        ├── connector.ts          MongoClient singleton (DbProvider)
        ├── exports.ts            shim → api/registerExports
        ├── api/
        │     ├── registerExports.ts
        │     ├── withDb.ts, normalizeIdFilter.ts
        │     └── handlers/       read, write, admin, lifecycle
        ├── services/indexService.ts
        ├── config.ts             ConVar → mongoUrl + Pool
        ├── validateQuery.ts      Operator-Denylist
        ├── perf.ts               Slow-query timing (ConVar-gated)
        ├── responses.ts          Response-Typen
        └── utils.ts              log, exportFn, redactMongoUri
```

## Export-Register

Implementiert in `src/api/handlers/*` via `src/api/registerExports.ts` (Shim: `src/exports.ts`), registriert in `fxmanifest.lua` → `server_exports`:

| Export | Kategorie | Zweck |
|--------|-----------|-------|
| `insert` | CRUD | insertOne → `{ success, insertedId: string }` |
| `find` | CRUD | findOne, `_id`-String→ObjectId |
| `findAll` | CRUD | find + limit/skip/sort/projection |
| `findById` | CRUD | findOne by string id, optional projection → `{ success, data: doc \| null }` |
| `update` | CRUD | updateOne, liefert `modifiedCount` |
| `delete` | CRUD | deleteOne, liefert `deletedCount` |
| `count` | CRUD | countDocuments |
| `getVersion` | Lifecycle | Semver aus fxmanifest |
| `isConnected` | Lifecycle | boolean, sync |
| `ensureIndexes` | Erweitert | createIndexes (max 20) |
| `health` | Erweitert | ping + RTT |
| `config` | Erweitert | sichere Laufzeit-Config (keine Secrets) |
| `getQueryStats` | **Advanced / Internal** | Sync — perf ring buffer + p50/p95 (ConVar-gated) |
| `getDb` | **Advanced / Internal** | Sync, returns `Db \| null` — umgeht Envelope/validateQuery |
| `connect` | **Advanced / Internal** | Runtime-URI-Override |
| `disconnect` | **Advanced / Internal** | Verbindung schließen |

**CTFFramework-Pflicht-Exports:** `find`, `findAll`, `insert`, `update`, `delete`, `count`, `getVersion` — siehe `docs/API.md`.

> **Sicherheit:** `getDb`, `connect`, `disconnect` nur in vertrauenswürdigen Server-Ressourcen — nicht an Client/untrusted Input.

## Events

Server-Consumer nutzen **`AddEventHandler`** (Lua) bzw. **`on(...)`** (TS) — cfx-mongodb feuert Lifecycle-Events per **`TriggerEvent`** (server-lokal). **`emitNet`** ist für Server→Client; nicht für MongoDB-Startup auf dem Server verwenden.

| Event | Mechanismus | Wann |
|-------|-------------|------|
| `cfx-mongodb:ready` | `TriggerEvent` | Nach Connect + optionaler Index-Init (`src/bootstrap.ts`) |
| `cfx-mongodb:connected` | `TriggerEvent` | Nach erfolgreichem Connect (`src/connector.ts`, Payload: `true`) |

Consumer-Ressourcen sollten auf **`cfx-mongodb:ready`** warten, bevor sie CRUD-Exports nutzen.

## ConVars (Keywords)

`mongodb_env`, `mongodb_dev_url`, `mongodb_prod_url`, `mongodb_test_url`, `mongodb_timeout`, `mongodb_max_pool`, `mongodb_min_pool`, `mongodb_log_level`, `mongodb_init_indexes`

## Build & Dev (Keywords)

```bash
yarn install   # Node 22 lokal
yarn build     # src/ → dist/index.js
yarn dev       # watch rebuild
yarn tsc       # type-check only
yarn lint      # eslint
yarn test      # vitest
```

**Nie** `dist/` manuell editieren — immer `src/` ändern und bauen.

## Sicherheits-Invarianten (nicht brechen)

1. Exports werfen **keine** Exceptions — immer `{ success: false, error }`.
2. `insertedId` ist immer **String** (kein ObjectId-Objekt).
3. Gefährliche Operatoren blockiert: `$where`, `$function`, `$merge`, … (`validateQuery.ts`).
4. `node_version '22'` in `fxmanifest.lua` beibehalten.
5. Keine Credentials in Repo — nur ConVars.
6. `getDb` / `connect` / `disconnect` nicht an untrusted Consumer exposen.

## Typische Agent-Aufgaben

### Neues Export-Feld / API-Änderung
1. `src/api/handlers/*.ts` + `src/api/registerExports.ts` + `src/responses.ts`
2. `fxmanifest.lua` → `server_exports` (falls neuer Export)
3. `docs/API.md` + `docs/examples/*.md` + `docs/SEARCH-MAP.md`
4. `yarn test` + `yarn build` + `yarn tsc`

### CTFFramework-Kompatibilität prüfen
1. `docs/API.md` → Abschnitt „CTFFramework Contract“
2. Rückgabeformate: `modifiedCount`, `deletedCount`, `insertedId` als String

### Verbindungsproblem debuggen
1. `src/config.ts` — welche URL/Env?
2. `src/connector.ts` — Connect-Fehler
3. ConVars in server.cfg
4. `mongodb_log_level debug`

## Verwandte Cursor-Artefakte

| Artefakt | Pfad |
|----------|------|
| Agent-Guidelines | `AGENTS.md` |
| Projekt-Skill | `.cursor/skills/cfx-mongodb/SKILL.md` |
| Export-Regel | `.cursor/rules/exports-api.mdc` |
| Node-22-Regel | `.cursor/rules/node22-runtime.mdc` |
| AI-Stack-Analyse | `docs/AI-STACK.md` |
