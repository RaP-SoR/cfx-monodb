# API Reference — cfx-mongodb (Server Exports)

Kanonische Referenz für externe Consumer (CTFFramework, Lua/TS-Ressourcen).

**Resource-Name:** `cfx-mongodb`  
**Aufruf TypeScript:** `exports["cfx-mongodb"].find(...)`  
**Aufruf Lua:** `exports['cfx-mongodb']:find(...)`

Warte auf Event `cfx-mongodb:ready` bevor du CRUD-Exports nutzt.

---

## Export-Index (`server_exports`)

Alle in `fxmanifest.lua` registrierten Exports (Reihenfolge wie im Manifest):

| Export | Kategorie |
|--------|-----------|
| `connect` | Advanced / Internal |
| `disconnect` | Advanced / Internal |
| `isConnected` | Lifecycle |
| `getDb` | Advanced / Internal |
| `findById` | CRUD |
| `findAll` | CRUD (CTFFramework) |
| `find` | CRUD (CTFFramework) |
| `insert` | CRUD (CTFFramework) |
| `update` | CRUD (CTFFramework) |
| `delete` | CRUD (CTFFramework) |
| `count` | CRUD (CTFFramework) |
| `getVersion` | Lifecycle (CTFFramework) |
| `ensureIndexes` | Erweitert |
| `health` | Erweitert |
| `config` | Erweitert |
| `getQueryStats` | Advanced / Internal |

---

## Response-Envelope

Alle CRUD-Exports (außer `isConnected`, `getVersion`, `getDb`) geben ein Objekt zurück — **nie Exceptions**.

```typescript
interface CfxMongoResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

interface CfxMongoInsertResult {
  success: boolean;
  insertedId?: string;   // immer plain String
  error?: string;
}

interface CfxMongoUpdateResult {
  success: boolean;
  modifiedCount?: number;
  matchedCount?: number;  // zusätzlich, nicht vom Framework gefordert
  error?: string;
}

interface CfxMongoDeleteResult {
  success: boolean;
  deletedCount?: number;
  error?: string;
}
```

---

## CTFFramework Contract (Pflicht-Exports)

Diese Signaturen **müssen** exakt erfüllt werden:

| Export | Signatur | Erfolgs-Rückgabe |
|--------|----------|------------------|
| `find` | `(collection, filter)` | `{ success: true, data: doc \| null }` |
| `findAll` | `(collection, filter, options?)` | `{ success: true, data: doc[] }` |
| `insert` | `(collection, doc)` | `{ success: true, insertedId: string }` |
| `update` | `(collection, filter, update)` | `{ success: true, modifiedCount: number }` |
| `delete` | `(collection, filter)` | `{ success: true, deletedCount: number }` |
| `count` | `(collection, filter)` | `{ success: true, data: number }` |
| `getVersion` | `()` | `Promise<string>` (Semver, z.B. `"1.0.1"`) |
| `findById` | `(collection, id, projection?)` | `{ success: true, data: doc \| null }` |

### `findById(collection, id, projection?)`

Lookup by MongoDB `_id` as string. Converts valid ObjectId strings automatically.

```typescript
const result = await exports["cfx-mongodb"].findById("players", insertedId, { name: 1 });
// Found:   { success: true, data: { _id: "674a...", name: "test" } }
// Missing: { success: true, data: null }
```

`find` uses the same not-found semantics as `findById` (Wave 2).

### Framework-Erfolgslogik

- **Update:** `(result.modifiedCount ?? 0) > 0` → Erfolg
- **Delete:** `result.deletedCount === 1` → exakter Einzellöschungs-Check
- **Insert:** `insertedId` muss String sein (kein ObjectId-Objekt)

---

## CRUD Exports (Detail)

### `insert(collection, doc)`

```typescript
const result = await exports["cfx-mongodb"].insert("players", { name: "test" });
// { success: true, insertedId: "674a1b2c3d4e5f6789012345" }
```

### `find(collection, filter?)`

Gibt ein einzelnes Dokument zurück. Wenn nicht gefunden: `{ success: true, data: null }` (wie `findById`).

`_id` als String im Filter wird automatisch konvertiert.

### `findAll(collection, filter?, options?)`

```typescript
const result = await exports["cfx-mongodb"].findAll("players", {}, {
  limit: 10,
  skip: 0,
  sort: { name: 1 }   // 1 = asc, -1 = desc
});
// { success: true, data: [...] }
```

**Options:**

| Feld | Typ | Default | Clamp |
|------|-----|---------|-------|
| `limit` | number | 100 | 1–1000 |
| `skip` | number | 0 | 0–1_000_000 |
| `sort` | `Record<string, 1 \| -1>` | — | — |
| `projection` | object | — | (Erweiterung) |

Alle `_id`-Felder in Ergebnissen werden als String serialisiert.

### `update(collection, filter, update)`

Akzeptiert MongoDB-Update-Operatoren oder Partial (auto-`$set`):

```typescript
await exports["cfx-mongodb"].update("players", { _id: "674a..." }, { $set: { name: "x" } });
// { success: true, matchedCount: 1, modifiedCount: 1 }
```

### `delete(collection, filter)`

```typescript
await exports["cfx-mongodb"].delete("players", { _id: "674a..." });
// { success: true, deletedCount: 1 }
```

Wenn kein Dokument gelöscht: `{ success: false, error: "Document not found" }`.

### `count(collection, filter?)`

```typescript
const result = await exports["cfx-mongodb"].count("players", { active: true });
// { success: true, data: 42 }
```

### `getVersion()`

```typescript
const version = await exports["cfx-mongodb"].getVersion();
// "1.0.1" — aus fxmanifest.lua version '...'
```

---

## Lifecycle Exports

| Export | Rückgabe | Beschreibung |
|--------|----------|--------------|
| `isConnected()` | `boolean` | Sync, kein Envelope — DB-Verbindung aktiv? |

---

## Erweiterte Exports (optional für Consumer)

| Export | Rückgabe | Beschreibung |
|--------|----------|--------------|
| `ensureIndexes(collection, specs[])` | `{ success, data: number }` | Indizes idempotent anlegen (max. 20 Specs) |
| `health()` | `{ success, data: { ok, rttMs } }` | MongoDB ping + Round-Trip-Zeit |
| `config()` | `{ success, data: { env, timeout, maxPoolSize, minPoolSize, logLevel, perfEnabled, perfSlowMs, perfLogAll, perfBuffer } }` | Sichere Laufzeit-Config — **keine Secrets/URLs** |

---

## Advanced / Internal Exports

> **Sicherheitswarnung:** Diese Exports umgehen den normalen CRUD-Envelope und können die Singleton-Verbindung oder den MongoDB-Treiber direkt exponieren. Nur in vertrauenswürdigen Server-Ressourcen verwenden — **nicht** an Client-Logik oder untrusted Input weitergeben. Bevorzuge immer die CRUD-Exports oben.

| Export | Rückgabe | Beschreibung |
|--------|----------|--------------|
| `getDb()` | `Db \| null` | Sync — interne MongoDB-`Db`-Instanz oder `null` wenn getrennt |
| `getQueryStats()` | `{ success, data: { enabled, samples[], aggregates } }` | Sync — Ring-Buffer-Snapshot (nur wenn `mongodb_perf_enabled` aktiv war) |
| `connect(url, options?)` | void | Runtime-URI-Override; ersetzt die ConVar-Verbindung |
| `disconnect()` | void | Verbindung schließen |

### `getDb()`

```typescript
const db = exports["cfx-mongodb"].getDb();
if (db) {
  // Direkter Treiber-Zugriff — umgeht validateQuery und Envelope-Konventionen
}
```

Typischer Anwendungsfall: eine andere **Server-Node-Ressource** braucht Treiber-APIs, die cfx-mongodb nicht als Export anbietet. Für normale CRUD immer `find` / `insert` / … nutzen.

### `getQueryStats()`

Erfordert zuvor `mongodb_perf_enabled 1` — sonst leerer Buffer. Samples werden bei Resource-Restart gelöscht.

```typescript
const stats = exports["cfx-mongodb"].getQueryStats();
if (stats.success && stats.data.enabled) {
  console.log(stats.data.aggregates.p95Ms, stats.data.samples.length);
}
```

TypScript-Typ: `CfxMongoQueryStatsResult` in `src/types/api.ts`.

---

## Events

### Server-seitig: `TriggerEvent` vs `emitNet`

| Mechanismus | Geltungsbereich | Consumer-Pattern |
|-------------|-----------------|------------------|
| **`TriggerEvent`** | Nur **Server** — lokale Event-Handler in anderen Server-Ressourcen | `AddEventHandler("cfx-mongodb:ready", fn)` |
| **`emitNet`** | Server → **Client** (Netzwerk) | `RegisterNetEvent` + Client-Handler — **nicht** für Server-CRUD-Startup |

**cfx-mongodb** feuert Lifecycle-Events per **`TriggerEvent`** (server-lokal). Consumer-Ressourcen auf dem Server sollen `AddEventHandler` verwenden — **nicht** `emitNet` oder Client-`RegisterNetEvent`.

### Lifecycle-Events

| Event | Mechanismus | Payload | Wann |
|-------|-------------|---------|------|
| `cfx-mongodb:ready` | `TriggerEvent` | — | Nach `onResourceStart`: Connect + optionaler Index-Init (`mongodb_init_indexes`) abgeschlossen |
| `cfx-mongodb:connected` | `TriggerEvent` | `(success: boolean)` | Nach erfolgreichem Connect im Connector (`success === true`) |

**Empfohlenes Startup-Pattern (Lua):**

```lua
local mongoReady = false

AddEventHandler('cfx-mongodb:ready', function()
  mongoReady = true
  print('[my-resource] MongoDB ready')
end)

-- Vor CRUD-Aufrufen warten (oder isConnected() prüfen)
CreateThread(function()
  while not mongoReady do Wait(100) end
  local result = exports['cfx-mongodb']:findAll('players')
end)
```

**TypeScript (Server-Resource):**

```typescript
let mongoReady = false;
on("cfx-mongodb:ready", () => {
  mongoReady = true;
});
```

`cfx-mongodb:connected` signalisiert den Connect-Schritt früher (vor Index-Init); für CRUD reicht in der Regel **`cfx-mongodb:ready`**.

---

## Configuration (ConVars)

| ConVar | Default | Beschreibung |
|--------|---------|--------------|
| `mongodb_env` | auto (dev/prod) | `dev`, `prod`, `test` |
| `mongodb_dev_url` | `mongodb://localhost:27017/ctf_dev` | Dev-URI |
| `mongodb_prod_url` | `mongodb://localhost:27017/ctf_prod` | Prod-URI |
| `mongodb_test_url` | `mongodb://localhost:27017/ctf_test` | Test-URI |
| `mongodb_timeout` | 5000/10000/2000 | Server selection timeout (ms) |
| `mongodb_max_pool` | 10 | Max pool (0–50) |
| `mongodb_min_pool` | 0 | Min pool (0–20) |
| `mongodb_log_level` | `info` | `error\|warn\|info\|debug` |
| `mongodb_init_indexes` | — | JSON: Collection → Index-Specs |
| `mongodb_perf_enabled` | `0` | Slow-query-Timing (0=aus) |
| `mongodb_perf_slow_ms` | `100` | Schwellwert für `SLOW QUERY`-Warnung (ms) |
| `mongodb_perf_log_all` | `0` | Alle Ops bei `debug` loggen (Staging) |
| `mongodb_perf_buffer` | `100` | Ring-Buffer für `getQueryStats` (max 1000) |

**Slow queries (optional):**

```cfg
set mongodb_perf_enabled 1
set mongodb_perf_slow_ms 150
# set mongodb_log_level warn
```

Log-Zeilen erscheinen als `[CFX-MongoDB] SLOW QUERY find players 142ms (threshold 150ms)`. Filter-Werte werden nicht geloggt — nur Schlüssel bei `update`/`delete`/`find`.

---

## Sicherheit

Blockierte Operatoren in Filtern/Updates: `$where`, `$function`, `$accumulator`, `$regexFind`, `$regexFindAll`, `$out`, `$merge`.

User-Input in Queries immer validieren/whitelisten — diese Resource blockiert nur die gefährlichsten Operatoren.

`getDb`, `connect`, `disconnect` und `getQueryStats` umgehen Query-Validierung bzw. sind Admin-Diagnostik — nur für vertrauenswürdige Server-Interna.

---

## Lua vs TypeScript

| | TypeScript (Node-Resource) | Lua |
|--|---------------------------|-----|
| Syntax | `exports["cfx-mongodb"].find(...)` | `exports['cfx-mongodb']:find(...)` |
| Async | `await` / `.then()` | Citizen await pattern |
| Events | `on("cfx-mongodb:ready", …)` | `AddEventHandler('cfx-mongodb:ready', …)` |
| Beispiele | [examples/typescript.md](examples/typescript.md) | [examples/lua.md](examples/lua.md) |
