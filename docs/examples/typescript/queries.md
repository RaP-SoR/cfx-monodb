# Query & filter cookbook (TypeScript) — cfx-mongodb

> **TypeScript only** — copy-paste filters and updates  
> API: [../../API.md](../../API.md) · Snippets: [snippets.md](snippets.md) · Patterns: [patterns.md](patterns.md)

Filters are plain **objects** passed to `find`, `findAll`, `count`, `update`, and `delete`. No SQL `WHERE` string.

Wait for **`cfx-mongodb:ready`** — [patterns.md §1](patterns.md#1-startup--wait-for-ready).

**How to read this doc:** Subsections use **“What this does”** before code (same style as [../lua/queries.md](../lua/queries.md)). FiveM flows: [use-cases.md](use-cases.md).

---

## 1. MySQL ↔ MongoDB

| MySQL | cfx-mongodb |
|-------|-------------|
| `LIMIT 10` | `findAll(col, filter, { limit: 10 })` — default **100**, max **1000** |
| `OFFSET 20` | `{ skip: 20 }` |
| `SELECT col1` | `{ projection: { col1: 1 } }` |
| `WHERE id = ?` | `findById(col, id)` or `{ _id: id }` |
| `COUNT(*)` | `count(col, filter)` |
| `JOIN` | **Not via exports** — [§8](#8-no-joins) |

Use **`find`** / **`findById`** for one doc; **`findAll`** with filter + **`limit`** for lists.

---

## 2. Allowed vs blocked operators

Blocked: `$where`, `$function`, `$expr`, `$jsonSchema`, `$accumulator`, `$regexFind`, `$regexFindAll`, `$out`, `$merge`.

```typescript
const bad = await exports["cfx-mongodb"].find("players", {
  $expr: { $gt: ["$level", 10] },
});
// { success: false, error: "Operator not allowed: $expr" }
```

See [../../API.md](../../API.md). Whitelist client fields in your resource.

---

## 3. Read filters

### 3.1 Equality

```typescript
const one = await exports["cfx-mongodb"].find("players", {
  identifier: "steam:110000100000000",
  active: true,
});
```

### 3.2 Comparisons

```typescript
const veterans = await exports["cfx-mongodb"].findAll(
  "players",
  { level: { $gte: 10, $lte: 99 } },
  { sort: { level: -1 }, limit: 50 }
);

const notBanned = await exports["cfx-mongodb"].findAll("players", {
  status: { $ne: "banned" },
});
```

### 3.3 `$in` / `$nin`

```typescript
const staff = await exports["cfx-mongodb"].findAll("players", {
  job: { $in: ["police", "ems", "mechanic"] },
});

const outsiders = await exports["cfx-mongodb"].findAll("players", {
  job: { $nin: ["police", "ems"] },
  active: true,
});
```

### 3.4 `$and` / `$or`

```typescript
const eligible = await exports["cfx-mongodb"].findAll(
  "players",
  {
    $and: [
      { active: true },
      { level: { $gte: 5 } },
      { $or: [{ vip: true }, { playtimeHours: { $gte: 100 } }] },
    ],
  },
  { limit: 100, projection: { identifier: 1, name: 1, level: 1 } }
);
```

### 3.5 `$exists`

```typescript
const withEmail = await exports["cfx-mongodb"].findAll("users", {
  email: { $exists: true },
});
```

### 3.6 `$regex`

```typescript
const matches = await exports["cfx-mongodb"].findAll(
  "players",
  { name: { $regex: "^John", $options: "i" } },
  { limit: 20, projection: { name: 1, identifier: 1 } }
);
```

### 3.7 Nested fields + JOIN-like data (account → character → vehicle)

**SQL mental model:** `accounts (1) → characters (many) → vehicles / items / clothing (many per character)`.

Mongo has no `JOIN` export. Use **foreign keys** (`identifier`, `characterId`) + **`findAll`**, or **embedded arrays** on `characters`.

**Steps to load one spawned character’s “join”:**

1. Have `identifier` from connect.
2. `findById` or `find` the selected **character**.
3. `findAll('vehicles', { characterId })` for garage.
4. Read **items/clothing** from embedded `character.inventory` / `character.clothing`, or separate `stash` collection.
5. Optional: `find('accounts', { identifier })` for ban / slot limits.

```typescript
const identifier = "license:abc123";

const chars = await exports["cfx-mongodb"].findAll(
  "characters",
  { identifier, deleted: { $ne: true } },
  { sort: { slot: 1 }, limit: 10 }
);

const characterId = chars.data?.[0]?._id;

const vehicles = await exports["cfx-mongodb"].findAll(
  "vehicles",
  { characterId, stored: true },
  { projection: { plate: 1, model: 1 }, limit: 50 }
);

const char = await exports["cfx-mongodb"].findById("characters", characterId!, {
  inventory: 1,
  clothing: 1,
});

const highStats = await exports["cfx-mongodb"].find("characters", {
  "stats.level": { $gte: 50 },
  "inventory.cash": { $gte: 1000 },
  "clothing.watch.model": "luxury_gold",
});
```

See [../lua/queries.md §3.7](../lua/queries.md#37-nested-fields--join-like-data-account--character--vehicle) for the full Lua narrative.

### 3.8 Arrays

```typescript
await exports["cfx-mongodb"].find("players", { roles: "admin" });

await exports["cfx-mongodb"].find("players", {
  items: { $elemMatch: { itemId: "weapon_pistol", qty: { $gte: 1 } } },
});
```

### 3.9 Dates and time zones (UTC + EU / US / Asia)

**Steps:**

1. Store **UTC ISO** strings in Mongo (`toISOString()`).
2. “Last 24h” → `Date.now() - 86400000` (no timezone math).
3. “Start of today” in EU/US/Asia → convert local midnight to UTC, then `$gte` (see [datetime-helpers.ts](datetime-helpers.ts)).

| Region | Example zone | Offset (winter) | Seconds |
|--------|--------------|-----------------|---------|
| EU Germany | CET / CEST | +1 h / +2 h | `3600` / `7200` |
| US East | EST / EDT | −5 h / −4 h | `-18000` / `-14400` |
| US West | PST / PDT | −8 h / −7 h | `-28800` / `-25200` |
| Asia Japan | JST | +9 h | `32400` |
| Asia China | CST | +8 h | `28800` |
| Asia India | IST | +5 h 30 m | `19800` |

```typescript
import {
  isoUtcNow,
  startOfLocalDayUtcIso,
  OFFSET_EU_CET,
  OFFSET_US_EAST,
  OFFSET_ASIA_TOKYO,
} from "./datetime-helpers"; // copy from docs/examples/typescript/

const since = new Date(Date.now() - 86400000).toISOString();
await exports["cfx-mongodb"].findAll("audit_log", { createdAt: { $gte: since } }, { limit: 100 });

const sinceEu = startOfLocalDayUtcIso(OFFSET_EU_CET);
const sinceUsEast = startOfLocalDayUtcIso(OFFSET_US_EAST);
const sinceTokyo = startOfLocalDayUtcIso(OFFSET_ASIA_TOKYO);

await exports["cfx-mongodb"].insert("characters", {
  identifier: "license:abc",
  slot: 1,
  createdAt: isoUtcNow(),
});
```

Full table + Lua copy: [../lua/queries.md §3.9](../lua/queries.md#39-dates-and-time-zones-utc--eu--us--asia).

### 3.10 `_id` / `findById`

```typescript
await exports["cfx-mongodb"].update("players", { _id: insertedId }, { $set: { level: 2 } });
const doc = await exports["cfx-mongodb"].findById("players", insertedId, { name: 1, level: 1 });
```

### 3.11 `count` + pagination

```typescript
const total = await exports["cfx-mongodb"].count("players", { active: true });
if (!total.success) return;

const page = await exports["cfx-mongodb"].findAll(
  "players",
  { active: true },
  { limit: 25, skip: 0, sort: { name: 1 } }
);
```

---

## 4. Update operators

Plain fields → auto **`$set`**.

```typescript
await exports["cfx-mongodb"].update("players", { _id: id }, { level: 10, name: "Ada" });
await exports["cfx-mongodb"].update("players", { _id: id }, { $set: { "stats.xp": 0 } });

await exports["cfx-mongodb"].update(
  "players",
  { identifier: "steam:110000100000000" },
  { $inc: { coins: 50 }, $set: { lastSeen: new Date().toISOString() } }
);

await exports["cfx-mongodb"].update("players", { _id: id }, { $unset: { tempFlag: "" } });

await exports["cfx-mongodb"].update("players", { _id: id }, { $push: { roles: "vip" } });
await exports["cfx-mongodb"].update("players", { _id: id }, { $pull: { roles: "vip" } });
```

---

## 5. `findAll` options

```typescript
const page = 3;
const pageSize = 50;

const rows = await exports["cfx-mongodb"].findAll(
  "players",
  { active: true, season: "2026-s1" },
  {
    limit: pageSize,
    skip: (page - 1) * pageSize,
    sort: { score: -1 },
    projection: { identifier: 1, name: 1, score: 1 },
  }
);
```

---

## 6. Whitelist client input

```typescript
type PlayerListQuery = { job?: string; minLevel?: number };

function buildPlayerFilter(input: PlayerListQuery) {
  const filter: Record<string, unknown> = { active: true };
  const allowedJobs = new Set(["police", "ems", "civilian"]);
  if (input.job && allowedJobs.has(input.job)) filter.job = input.job;
  if (typeof input.minLevel === "number" && input.minLevel >= 0 && input.minLevel <= 200) {
    filter.level = { $gte: input.minLevel };
  }
  return filter;
}

await exports["cfx-mongodb"].findAll("players", buildPlayerFilter(payload), { limit: 50 });
```

---

## 7. Performance tips

1. Index filter + sort fields.
2. Always set `limit` on UI `findAll`.
3. Use `projection` for heavy subdocuments.
4. Use `count` for totals.
5. Avoid `findAll(col, {})` on large collections.
6. Prefer equality over `$regex` at scale.
7. One `find` per player — not `findAll` + JS filter.
8. `mongodb_perf_enabled` + `getQueryStats()` for staging.

---

## 8. Relationships without SQL JOIN

**Steps (character → account):**

1. `findById` character.
2. Read `character.identifier`.
3. `find` account with that identifier.

```typescript
const char = await exports["cfx-mongodb"].findById("characters", characterId);
if (!char.success || !char.data) return;

const account = await exports["cfx-mongodb"].find("accounts", {
  identifier: char.data.identifier,
});
```

Tree diagram + vehicles/items: [../lua/queries.md §3.7](../lua/queries.md#37-nested-fields--join-like-data-account--character--vehicle).

---

## 9. Quick index

| Goal | Snippet |
|------|---------|
| Exact | `{ field: value }` |
| Range | `{ field: { $gte: a, $lte: b } }` |
| In list | `{ field: { $in: ["a", "b"] } }` |
| AND | `{ $and: [{...}, {...}] }` |
| Paginate | `findAll(col, f, { limit, skip, sort })` |

Lua examples: [../lua/queries.md](../lua/queries.md).
