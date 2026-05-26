# TypeScript Examples — cfx-mongodb

> Full API: [../API.md](../API.md) · Runnable sample: [server.ts](server.ts)

FiveM Node **22** required (`node_version '22'`). Wait for `cfx-mongodb:ready` before CRUD.

## Configuration (server.cfg)

```cfg
set mongodb_env dev
set mongodb_dev_url mongodb://localhost:27017/ctf_dev
set mongodb_prod_url mongodb://localhost:27017/ctf_prod
set mongodb_test_url mongodb://localhost:27017/ctf_test
set mongodb_timeout 5000
set mongodb_max_pool 15
set mongodb_min_pool 2
set mongodb_log_level info
set mongodb_init_indexes {"users":[{"keys":{"email":1},"options":{"unique":true}}]}
ensure cfx-mongodb
```

## Events (server)

cfx-mongodb fires lifecycle events with **`TriggerEvent`** (server-local). Use **`on(...)`** — not `emitNet`.

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

| Event | When |
|-------|------|
| `cfx-mongodb:ready` | After connect + optional index init — **before CRUD** |
| `cfx-mongodb:connected` | After successful connect |

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
  console.log(`Inserted ID: ${result.insertedId}`); // always string
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
  // Not found — success true, data null (aligned with findById)
  console.log("No matching document");
} else {
  console.log(player.data.name);
}

const byId = await exports["cfx-mongodb"].findById("players", insertedId, { name: 1 });
if (byId.success && byId.data) {
  console.log(byId.data.name);
}
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

Options: `limit` (1–1000, default 100), `skip`, `sort`, `projection`.

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

`getDb`, `connect`, `disconnect` bypass envelope and query validation — trusted server resources only. See [API.md](../API.md).

Consumer types: import from `src/types/api.ts` in your resource (`CfxMongoResult`, `CfxMongoInsertResult`, …).
