# Architecture — cfx-mongodb

## Zweck

Standalone FiveM-Server-Resource, die MongoDB für andere Ressourcen über **Exports** bereitstellt. Primärer Consumer: **CTFFramework** (Provider/Repository-Pattern über `exports["cfx-mongodb"]`).

## Laufzeit-Stack

```
FiveM Server (CitizenFX)
  └── Node 22 Runtime (fxmanifest: node_version '22')
        └── dist/index.js (CommonJS, Vite SSR build)
              └── mongodb@7 (external, nicht gebundelt)
                    └── MongoDB Server
```

### Warum Node 22 only?

FiveM/RedM liefern teils noch Node 16 oder 18. Diese Laufzeiten binden veraltete, sicherheitskritische Paketversionen. Ab **1.0.1** unterstützt cfx-mongodb **ausschließlich Node 22** — lokal (`engines`) und in der Resource (`node_version '22'`).

## Lebenszyklus

1. **Resource Start** (`src/index.ts` → `onResourceStart`)
2. **Connect** (`MongoDBConnector.connect()` aus ConVars)
3. **Register Exports** (`registerExports()` in `connector.ts` nach Connect)
4. **Optional:** Index-Init aus `mongodb_init_indexes` ConVar
5. **Event:** `TriggerEvent("cfx-mongodb:ready")`
6. **Resource Stop** → `disconnect()`

Exports sind erst nach erfolgreichem Connect registriert.

## Schichten

| Schicht | Datei | Verantwortung |
|---------|-------|---------------|
| Entry | `index.ts` | Lifecycle, Index-Init, Events |
| Connector | `connector.ts` | Singleton, MongoClient, Pool |
| Exports | `exports.ts` | Öffentliche API, Fehler-Envelope |
| Config | `config.ts` | ConVar → URI + Pool-Optionen |
| Validation | `validateQuery.ts` | Operator-Denylist |
| Types | `responses.ts`, `types/*` | Response-Contracts |

## Build-Pipeline

```
src/**/*.ts  ──vite build (SSR, target node22)──►  dist/index.js
```

- MongoDB-Treiber bleibt **external** (FiveM lädt aus `node_modules`)
- Vite-Polyfills für `navigator`/`window` (RedM-Kompatibilität, siehe `vite.config.mjs`)
- Source Maps in `dist/index.js.map`

## Fehlerbehandlung (Design)

Alle async Exports fangen Fehler und geben `{ success: false, error: string }` zurück. Consumer (CTFFramework) haben kein try/catch um Export-Calls — **Exceptions würden den Caller crashen**.

## _id-Behandlung

Filter mit String-`_id` werden intern via `toObjectIdIfValid()` in MongoDB `ObjectId` konvertiert (`find`, `update`, `delete`). Rückgabe-Dokumente serialisieren `_id` als String.

## Erweiterungspunkte

- Neuer Export → `exports.ts` + `fxmanifest.lua` server_exports + `docs/API.md`
- Neue ConVar → `config.ts` + `docs/API.md` Configuration
- Neue Validierung → `validateQuery.ts`
