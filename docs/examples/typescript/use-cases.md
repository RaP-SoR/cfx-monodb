# FiveM use cases (TypeScript) — cfx-mongodb

> **Start here for real server scripts** — every `server_export` has an example; flows include step-by-step context before code.  
> Query operators: [queries.md](queries.md) · Startup: [patterns.md](patterns.md) · Lua multi-file sample: [../sample-resource/README.md](../sample-resource/README.md)

Typical **collections** on a GTA/FiveM server:

| Collection | Stores | Indexed field (example) |
|------------|--------|-------------------------|
| `accounts` | License/Steam, ban, lastSeen | `identifier` (unique) |
| `characters` | Slot, name, job, position, stats | `identifier` + `slot` (unique) |
| `vehicles` | Plate, model, garage, owner | `plate` (unique), `characterId` |
| `item_defs` | Static item metadata | `name` |
| `characters.inventory[]` / `clothing[]` | Embedded items & outfits | — |

**JOIN analogy:** `accounts → characters → vehicles` + embedded items/clothing — see [../lua/queries.md §3.7](../lua/queries.md#37-nested-fields--join-like-data-account--character--vehicle) (numbered steps).

Wait for **`cfx-mongodb:ready`** before CRUD ([patterns.md §1](patterns.md#1-startup--wait-for-ready)).

---

## Export coverage

| Export | FiveM example | Also in |
|--------|:-------------:|---------|
| `find` | [Account load](#flow-a--player-joins-load-account) | [snippets.md](snippets.md) |
| `findById` | [Character load](#flow-b--select-character) | snippets |
| `findAll` | [Garage](#flow-c--garage-list-vehicles) | [queries.md](queries.md) |
| `insert` | [New character](#flow-b--select-character) | snippets |
| `update` | [Save on logout](#flow-d--save-character-on-logout) | queries |
| `delete` | [Export reference](#export-reference-delete) | snippets |
| `count` | [Slot limit](#flow-b--select-character) | snippets |
| `getVersion` | [Reference](#export-reference-getversion) | snippets |
| `isConnected` | [Reference](#export-reference-isconnected) | snippets |
| `ensureIndexes` | [Reference](#export-reference-ensureindexes) | patterns |
| `health` | [Reference](#export-reference-health) | snippets |
| `config` | [Reference](#export-reference-config) | snippets |
| `getQueryStats` | [Reference](#export-reference-getquerystats) | — |
| `connect` / `disconnect` | [Advanced](#export-reference-connect--disconnect) | API.md |
| `getDb` | [Advanced](#export-reference-getdb) | API.md |

---

## Flow A — Player joins (load account)

```typescript
function normalizeIdentifier(src: number): string | undefined {
  for (let i = 0; i < GetNumPlayerIdentifiers(src); i += 1) {
    const id = GetPlayerIdentifier(src, i);
    if (id?.startsWith("license:") || id?.startsWith("steam:")) return id;
  }
  return undefined;
}

async function loadOrCreateAccount(src: number) {
  const identifier = normalizeIdentifier(src);
  if (!identifier) return { ok: false as const, error: "no_identifier" };

  const found = await exports["cfx-mongodb"].find("accounts", { identifier });
  if (!found.success) return { ok: false as const, error: found.error };

  if (found.data) {
    await exports["cfx-mongodb"].update(
      "accounts",
      { identifier },
      { $set: { lastSeen: new Date().toISOString(), lastSource: src } }
    );
    return { ok: true as const, account: found.data };
  }

  const created = await exports["cfx-mongodb"].insert("accounts", {
    identifier,
    createdAt: new Date().toISOString(),
    banned: false,
    maxCharacters: 3,
  });

  if (!created.success || !created.insertedId) {
    return { ok: false as const, error: created.error };
  }

  const row = await exports["cfx-mongodb"].findById("accounts", created.insertedId);
  return row.success && row.data
    ? { ok: true as const, account: row.data }
    : { ok: false as const, error: "load_failed" };
}
```

Uses: **`find`**, **`insert`**, **`update`**, **`findById`**.

---

## Flow B — Select character

```typescript
async function listCharacters(identifier: string) {
  return exports["cfx-mongodb"].findAll(
    "characters",
    { identifier, deleted: { $ne: true } },
    {
      sort: { slot: 1 },
      limit: 10,
      projection: { firstName: 1, lastName: 1, job: 1, slot: 1 },
    }
  );
}

async function canCreateCharacter(identifier: string, maxSlots: number) {
  const n = await exports["cfx-mongodb"].count("characters", {
    identifier,
    deleted: { $ne: true },
  });
  if (!n.success) return { ok: false, error: n.error };
  return { ok: n.data < maxSlots };
}

async function createCharacter(
  identifier: string,
  slot: number,
  firstName: string,
  lastName: string
) {
  const gate = await canCreateCharacter(identifier, 3);
  if (!gate.ok) return { ok: false, error: "slot_limit" };

  const ins = await exports["cfx-mongodb"].insert("characters", {
    identifier,
    slot,
    firstName,
    lastName,
    job: "unemployed",
    position: { x: -269.4, y: -955.3, z: 31.2, heading: 205 },
    inventory: [],
    createdAt: new Date().toISOString(),
  });

  if (!ins.success || !ins.insertedId) return { ok: false, error: ins.error };
  return { ok: true, characterId: ins.insertedId };
}

async function loadCharacterById(characterId: string) {
  const doc = await exports["cfx-mongodb"].findById("characters", characterId, {
    firstName: 1,
    lastName: 1,
    job: 1,
    position: 1,
    inventory: 1,
  });
  if (!doc.success) return { ok: false, error: doc.error };
  if (doc.data === null) return { ok: false, error: "not_found" };
  return { ok: true, character: doc.data };
}
```

Uses: **`findAll`**, **`count`**, **`insert`**, **`findById`**.

---

## Flow C — Garage (list vehicles)

```typescript
async function listGarageVehicles(characterId: string, garageName: string) {
  return exports["cfx-mongodb"].findAll(
    "vehicles",
    { characterId, garage: garageName, impounded: { $ne: true } },
    {
      sort: { plate: 1 },
      limit: 50,
      projection: { plate: 1, model: 1, fuel: 1, stored: 1 },
    }
  );
}

async function markVehicleOut(plate: string) {
  const res = await exports["cfx-mongodb"].update(
    "vehicles",
    { plate },
    { $set: { stored: false, lastTakenOut: new Date().toISOString() } }
  );
  return res.success && (res.modifiedCount ?? 0) > 0;
}
```

---

## Flow D — Save character on logout

```typescript
type Vec4 = { x: number; y: number; z: number; heading: number };

async function saveCharacterState(
  characterId: string,
  position: Vec4,
  health: number,
  inventory: unknown[]
) {
  const res = await exports["cfx-mongodb"].update(
    "characters",
    { _id: characterId },
    {
      $set: {
        position,
        health,
        inventory,
        lastPlayed: new Date().toISOString(),
      },
    }
  );
  return res.success && (res.modifiedCount ?? 0) > 0;
}

on("playerDropped", async () => {
  const src = global.source;
  const characterId = Player(src).state.characterId as string | undefined;
  if (!characterId) return;

  const ped = GetPlayerPed(src);
  const [x, y, z] = GetEntityCoords(ped, false);
  const heading = GetEntityHeading(ped);

  await saveCharacterState(
    characterId,
    { x, y, z, heading },
    GetEntityHealth(ped),
    []
  );
});
```

---

## Flow E — Items

```typescript
async function giveItem(characterId: string, itemName: string, count: number) {
  return exports["cfx-mongodb"].update(
    "characters",
    { _id: characterId },
    {
      $push: {
        inventory: { name: itemName, count, acquiredAt: Date.now() },
      },
    }
  );
}

async function getItemDef(itemName: string) {
  return exports["cfx-mongodb"].find("item_defs", { name: itemName });
}
```

---

## Flow F — Store vehicle

```typescript
async function storeVehicle(
  characterId: string,
  plate: string,
  model: string,
  props: Record<string, unknown>,
  garage: string
) {
  const existing = await exports["cfx-mongodb"].find("vehicles", { plate });
  if (existing.success && existing.data) {
    return { ok: false, error: "plate_taken" };
  }

  const ins = await exports["cfx-mongodb"].insert("vehicles", {
    characterId,
    plate,
    model,
    props,
    garage,
    stored: true,
    fuel: 100,
    createdAt: new Date().toISOString(),
  });

  if (!ins.success || !ins.insertedId) return { ok: false, error: ins.error };
  return { ok: true, vehicleId: ins.insertedId };
}
```

---

## Flow G — Ban account

```typescript
async function setAccountBanned(identifier: string, reason: string, untilIso: string) {
  const res = await exports["cfx-mongodb"].update(
    "accounts",
    { identifier },
    { $set: { banned: true, banReason: reason, banUntil: untilIso } }
  );
  return res.success && (res.modifiedCount ?? 0) > 0;
}

async function isBanned(identifier: string) {
  const acc = await exports["cfx-mongodb"].find("accounts", { identifier });
  return Boolean(acc.success && acc.data?.banned);
}
```

---

## Export reference

### `find` / `findById` / `findAll` / `insert` / `update` / `delete` / `count`

See flows above. Delete example:

```typescript
const del = await exports["cfx-mongodb"].delete("vehicles", { plate: "TEST 001" });
if (!del.success) console.error(del.error);
```

Soft-delete (characters):

```typescript
await exports["cfx-mongodb"].update("characters", { _id: id }, { $set: { deleted: true } });
```

### `getVersion`

```typescript
const v = await exports["cfx-mongodb"].getVersion();
console.log("cfx-mongodb", v);
```

### `isConnected`

```typescript
if (!exports["cfx-mongodb"].isConnected()) return;
```

### `ensureIndexes`

```typescript
on("cfx-mongodb:ready", async () => {
  await exports["cfx-mongodb"].ensureIndexes("characters", [
    { keys: { identifier: 1, slot: 1 }, options: { unique: true } },
  ]);
  await exports["cfx-mongodb"].ensureIndexes("vehicles", [
    { keys: { plate: 1 }, options: { unique: true } },
  ]);
});
```

### `health` / `config`

```typescript
const health = await exports["cfx-mongodb"].health();
const cfg = await exports["cfx-mongodb"].config();
```

### `getQueryStats`

```typescript
const stats = exports["cfx-mongodb"].getQueryStats();
if (stats.success && stats.data.enabled) {
  console.log(stats.data.aggregates.p95Ms);
}
```

### `connect` / `disconnect` / `getDb`

Avoid in gameplay resources — use CRUD exports. See [../../API.md](../../API.md).

---

## DX tips

1. Wrap exports in one `server/db.ts` module for your framework.
2. Whitelist client input before building filters ([queries.md §6](queries.md#6-whitelist-client-input)).
3. Use types from `cfx-mongodb/types` for envelopes ([patterns.md §6](patterns.md#6-typescript-types-optional)).

Tour: [server.ts](server.ts) · Operators: [queries.md](queries.md).
