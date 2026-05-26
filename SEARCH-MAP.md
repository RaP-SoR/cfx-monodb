# Search Map — cfx-mongodb

Navigationskarte für KI-Agenten und Entwickler. Lies diese Datei zuerst, bevor du im Repo suchst.

## Was ist dieses Projekt?

FiveM/RedM **Server-Resource** (`cfx-mongodb`): TypeScript-Wrapper um den offiziellen MongoDB Node-Treiber. Andere Ressourcen sprechen MongoDB **ausschließlich über FiveM-Exports** an — kein direkter DB-Zugriff.

**Kritisch:** Laufzeit ist FiveMs eingebettetes Node **22** (`node_version '22'` in `fxmanifest.lua`). Ohne das laufen ältere Node-Versionen und `mongodb@7` bricht.

## Schnellnavigation (Aufgabe → Datei)

| Aufgabe | Wo suchen |
|---------|-----------|
| Export hinzufügen/ändern | `src/exports.ts` → `registerExports()` |
| Rückgabe-Typen (success/error) | `src/responses.ts` |
| MongoDB-Verbindung / Singleton | `src/connector.ts` |
| ConVar-Konfiguration (URLs, Pool) | `src/config.ts` |
| Query-Sicherheit (Denylist) | `src/validateQuery.ts` |
| findAll-Optionen (limit/skip/sort) | `src/types/options.ts`, `src/exports.ts` |
| FiveM-Globals (GetConvar, exports) | `src/types/fivem.d.ts` |
| Resource-Start / Index-Init | `src/index.ts` |
| Hilfsfunktionen (log, ObjectId) | `src/utils.ts` |
| Manifest, server_exports, node_version | `fxmanifest.lua` |
| Build (Vite SSR → dist/) | `vite.config.mjs`, `yarn build` |
| Externe API (Vertrag) | `docs/API.md` |
| Architektur-Überblick | `docs/ARCHITECTURE.md` |
| Agent-Regeln & Workflow | `AGENTS.md` |
| Lua-Beispiele | `doc-lua.md`, `examples/server.lua` |
| TypeScript-Beispiele | `doc-typescript.md`, `examples/server.ts` |
| Changelog | `CHANGES.md` |

## Modulgraph

```
fxmanifest.lua
  └── dist/index.js  ← yarn build aus src/
        ├── index.ts          onResourceStart/Stop, Index-Init
        ├── connector.ts      MongoClient, connect(), registerExports()
        ├── exports.ts        Alle FiveM-Exports (CRUD, health, …)
        ├── config.ts         ConVar → mongoUrl + Pool-Optionen
        ├── validateQuery.ts  Operator-Denylist
        ├── responses.ts      Insert/Update/Delete/Response-Typen
        └── utils.ts          log, exportFn, toObjectIdIfValid
```

## Export-Register (Quelle der Wahrheit)

Implementiert in `src/exports.ts`:

| Export | Zweck |
|--------|-------|
| `insert` | insertOne → `{ success, insertedId: string }` |
| `find` | findOne, `_id`-String→ObjectId |
| `findAll` | find + limit/skip/sort/projection |
| `update` | updateOne, liefert `modifiedCount` |
| `delete` | deleteOne, liefert `deletedCount` |
| `count` | countDocuments |
| `getVersion` | Semver aus fxmanifest |
| `findById` | findOne by id string, optional projection |
| `getDb` | Returns `Db \| null` (TS advanced scenarios) |
| `ensureIndexes` | createIndexes (max 20) |
| `health` | ping + RTT |
| `config` | sichere Laufzeit-Config (keine Secrets) |
| `isConnected` | boolean |
| `connect` / `disconnect` | Runtime-Override |

**CTFFramework-Pflicht-Exports:** `find`, `findAll`, `insert`, `update`, `delete`, `count`, `getVersion` — siehe `docs/API.md`.

| `findById` | findOne by string id, optional projection → `{ success, data: doc \| null }` |
| `getDb` | Sync, returns `Db \| null` (TypeScript advanced use) |

## Events

| Event | Wann |
|-------|------|
| `cfx-mongodb:ready` | Nach Connect + optionaler Index-Init (`TriggerEvent`) |
| `cfx-mongodb:connected` | Nach erfolgreichem Connect (`TriggerEvent`) |

Consumer-Ressourcen sollten auf `cfx-mongodb:ready` warten, bevor sie Exports nutzen.

## ConVars (Keywords)

`mongodb_env`, `mongodb_dev_url`, `mongodb_prod_url`, `mongodb_test_url`, `mongodb_timeout`, `mongodb_max_pool`, `mongodb_min_pool`, `mongodb_log_level`, `mongodb_init_indexes`

## Build & Dev (Keywords)

```bash
yarn install   # Node 22 lokal
yarn build     # src/ → dist/index.js
yarn dev       # watch rebuild
yarn tsc       # type-check only
yarn lint      # eslint
```

**Nie** `dist/` manuell editieren — immer `src/` ändern und bauen.

## Sicherheits-Invarianten (nicht brechen)

1. Exports werfen **keine** Exceptions — immer `{ success: false, error }`.
2. `insertedId` ist immer **String** (kein ObjectId-Objekt).
3. Gefährliche Operatoren blockiert: `$where`, `$function`, `$merge`, … (`validateQuery.ts`).
4. `node_version '22'` in `fxmanifest.lua` beibehalten.
5. Keine Credentials in Repo — nur ConVars.

## Typische Agent-Aufgaben

### Neues Export-Feld / API-Änderung
1. `src/exports.ts` + `src/responses.ts`
2. `fxmanifest.lua` → `server_exports` (falls neuer Export)
3. `docs/API.md` + `doc-lua.md` / `doc-typescript.md`
4. `yarn build` + `yarn tsc`

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
