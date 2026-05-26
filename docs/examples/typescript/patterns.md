# TypeScript consumer patterns — cfx-mongodb

> CTFFramework & TS resources · API: [../../API.md](../../API.md) · Queries: [queries.md](queries.md) · FiveM flows: [use-cases.md](use-cases.md)

Each section: short **“What this does”**, then TypeScript. Same narrative style as [../lua/patterns.md](../lua/patterns.md).

---

## 1. Startup — wait for `ready`

**What this does:** Wait until cfx-mongodb finished connect/index init before any `await exports[...]` CRUD.

```typescript
let mongoReady = false;

on("cfx-mongodb:ready", () => {
  mongoReady = true;
});

async function whenMongoReady(): Promise<void> {
  while (!mongoReady) {
    await new Promise((r) => setTimeout(r, 100));
  }
}
```

```typescript
if (!exports["cfx-mongodb"].isConnected()) {
  return { ok: false, reason: "mongo_down" };
}
```

---

## 2. CTFFramework success checks

**What this does:** Branch on `success` and the right fields — exports never throw; not-found is `data === null`.

| Operation | Check |
|-----------|--------|
| **Insert** | `result.success && result.insertedId` |
| **Find / findById** | `result.success` then `result.data === null` = not found |
| **Update** | `result.success && (result.modifiedCount ?? 0) > 0` |
| **Delete** | `result.success && result.deletedCount === 1` |
| **Count** | `result.success` → `result.data` |
| **findAll** | `result.success` → `result.data` |

```typescript
import type { CfxMongoUpdateResult, CfxMongoDeleteResult } from "cfx-mongodb/types";

export function updateOk(r: CfxMongoUpdateResult): boolean {
  return r.success && (r.modifiedCount ?? 0) > 0;
}

export function deleteOk(r: CfxMongoDeleteResult): boolean {
  return r.success && r.deletedCount === 1;
}
```

---

## 3. Filter patterns

Cookbook: [queries.md](queries.md).

```typescript
await exports["cfx-mongodb"].update("players", { _id: insertedId }, { $set: { level: 2 } });
await exports["cfx-mongodb"].findById("players", insertedId);
```

```typescript
const filter = { identifier: playerIdentifier, active: true };
```

```typescript
await exports["cfx-mongodb"].update("players", { _id: id }, { level: 10, name: "x" });

await exports["cfx-mongodb"].update("players", { _id: id }, {
  $inc: { coins: 1 },
  $set: { lastSeen: new Date().toISOString() },
});
```

---

## 4. Pagination (`findAll`)

```typescript
const page = 2;
const pageSize = 50;

const result = await exports["cfx-mongodb"].findAll(
  "players",
  { active: true },
  { limit: pageSize, skip: (page - 1) * pageSize, sort: { name: 1 } }
);

if (!result.success) {
  console.error(result.error);
  return;
}

for (const row of result.data) {
  // row._id is always string
}
```

---

## 5. Indexes

```cfg
set mongodb_init_indexes {"players":[{"keys":{"identifier":1},"options":{"unique":true}}]}
```

```typescript
on("cfx-mongodb:ready", async () => {
  await exports["cfx-mongodb"].ensureIndexes("characters", [
    { keys: { userId: 1, slot: 1 }, options: { unique: true } },
  ]);
});
```

---

## 6. TypeScript types (optional)

```json
"cfx-mongodb": "file:../cfx-mongodb"
```

```typescript
import type {
  CfxMongoResult,
  CfxMongoInsertResult,
  CfxMongoUpdateResult,
} from "cfx-mongodb/types";
```

See [CONFIGURATION.md](../../CONFIGURATION.md) for release `.tgz`.

---

## 7. Diagnostics

```typescript
const health = await exports["cfx-mongodb"].health();
const cfg = await exports["cfx-mongodb"].config();
```

---

## 8. Anti-patterns

| Avoid | Use instead |
|-------|-------------|
| `connect()` in every consumer | ConVars in `server.cfg` |
| `getDb()` for normal CRUD | `find` / `insert` / `update` |
| `find` not-found as error | `success: true`, `data: null` |
| Update OK = `matchedCount > 0` | `(modifiedCount ?? 0) > 0` |
| Client-side mongo | Server-only exports |
| Raw client JSON as filter | Whitelist fields |
