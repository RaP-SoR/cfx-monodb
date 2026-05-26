# TypeScript snippets — cfx-mongodb

> **FiveM flows:** [use-cases.md](use-cases.md)  
> API: [../../API.md](../../API.md) · Patterns: [patterns.md](patterns.md) · Queries: [queries.md](queries.md) · Tour: [server.ts](server.ts)

| Export | Snippet below | Real scenario |
|--------|:-------------:|---------------|
| All CRUD + lifecycle | ✓ | [use-cases.md](use-cases.md) (coverage table + flows A–G) |
| `getQueryStats` / advanced | — | [use-cases reference](use-cases.md#export-reference) |

FiveM Node **22** required. Wait for `cfx-mongodb:ready` before CRUD.

Each section includes **what the export is for**. FiveM flows: [use-cases.md](use-cases.md).

## Configuration (server.cfg)

**What this does:** One Mongo connection for the server via ConVars — consumers do not call `connect()`.

> ConVars only — no `connect()` in consumer code.  
> See [../../CONFIGURATION.md](../../CONFIGURATION.md) · [../config/](../config/)

```cfg
exec mongodb.local.cfg
set mongodb_env dev
set mongodb_dev_url mongodb://localhost:27017/ctf_dev
ensure cfx-mongodb
```

## Events (server)

```typescript
let mongoReady = false;

on("cfx-mongodb:ready", () => {
  mongoReady = true;
  console.log("[my-resource] MongoDB ready");
});

on("cfx-mongodb:connected", (success: boolean) => {
  console.log("[my-resource] MongoDB connected:", success);
});
```

## Connection & diagnostics

```typescript
const isConnected = exports["cfx-mongodb"].isConnected();
const version = await exports["cfx-mongodb"].getVersion();
const health = await exports["cfx-mongodb"].health();
const cfg = await exports["cfx-mongodb"].config();
```

## Insert

```typescript
const result = await exports["cfx-mongodb"].insert("players", {
  identifier: "steam:123456789",
  name: "John Smith",
  level: 10,
});

if (result.success) {
  console.log(`Inserted ID: ${result.insertedId}`);
} else {
  console.error(result.error);
}
```

## Find one

```typescript
const player = await exports["cfx-mongodb"].find("players", {
  identifier: "steam:123456789",
});

if (!player.success) {
  console.error(player.error);
} else if (player.data === null) {
  console.log("No matching document");
} else {
  console.log(player.data.name);
}

const byId = await exports["cfx-mongodb"].findById("players", insertedId, { name: 1 });
```

## FindAll

```typescript
const all = await exports["cfx-mongodb"].findAll("players");

const top = await exports["cfx-mongodb"].findAll(
  "players",
  { level: { $gt: 5 } },
  { sort: { level: -1 }, limit: 10, skip: 0, projection: { name: 1 } }
);
```

More operators: [queries.md](queries.md).

## Update / delete / count

```typescript
const updated = await exports["cfx-mongodb"].update(
  "players",
  { _id: "674a1b2c3d4e5f6789012345" },
  { $set: { level: 11 } }
);

const deleted = await exports["cfx-mongodb"].delete("players", {
  _id: "674a1b2c3d4e5f6789012345",
});

const total = await exports["cfx-mongodb"].count("players", { active: true });
```

## ensureIndexes (manual)

```typescript
await exports["cfx-mongodb"].ensureIndexes("users", [
  { keys: { email: 1 }, options: { unique: true } },
]);
```

## Return types (summary)

| Export | Success |
|--------|---------|
| `insert` | `{ success: true, insertedId: string }` |
| `find` / `findById` | `{ success: true, data: T \| null }` |
| `findAll` | `{ success: true, data: T[] }` |
| `update` | `{ success: true, matchedCount, modifiedCount }` |
| `delete` | `{ success: true, deletedCount }` or not-found error |
| `count` | `{ success: true, data: number }` |
| `getVersion` | `string` (no envelope) |
| `health` | `{ success: true, data: { ok, rttMs } }` |

Errors: `{ success: false, error: string }` — exports never throw.

### Advanced / internal

`getDb`, `connect`, `disconnect` — trusted server only. See [../../API.md](../../API.md).

Consumer types: `cfx-mongodb/types` — [CONFIGURATION.md](../../CONFIGURATION.md).
