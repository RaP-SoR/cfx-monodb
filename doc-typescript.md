# MongoDB API für TypeScript

> Vollständige Referenz: [docs/API.md](docs/API.md)

FiveM Node **22** erforderlich (`node_version '22'`). Auf `cfx-mongodb:ready` warten.

## Verbindungsstatus

```typescript
const isConnected = exports['cfx-mongodb'].isConnected();
const version = await exports['cfx-mongodb'].getVersion();
```

## Dokument einfügen

```typescript
const result = await exports['cfx-mongodb'].insert('players', {
  identifier: 'steam:123456789',
  name: 'John Smith',
  level: 10,
});

if (result.success) {
  console.log(`Eingefügt mit ID: ${result.insertedId}`); // string
} else {
  console.error(result.error);
}
```

## Dokumente finden

```typescript
// Alle (Default limit: 100)
const all = await exports['cfx-mongodb'].findAll('players');

// Mit Filter und Optionen
const top = await exports['cfx-mongodb'].findAll(
  'players',
  { level: { $gt: 5 } },
  { sort: { level: -1 }, limit: 10, skip: 0 }
);
```

## Ein Dokument finden

```typescript
const player = await exports['cfx-mongodb'].find('players', {
  identifier: 'steam:123456789',
});

if (player.success && player.data) {
  console.log(player.data.name);
} else if (!player.success) {
  console.error(player.error);
}

const byId = await exports['cfx-mongodb'].findById('players', insertedId, { name: 1 });
if (byId.success && byId.data) {
  console.log(byId.data.name);
}
```

## Aktualisieren

```typescript
const result = await exports['cfx-mongodb'].update(
  'players',
  { _id: '674a1b2c3d4e5f6789012345' },
  { $set: { level: 11 } }
);

if (result.success) {
  console.log(`Geändert: ${result.modifiedCount}`);
}
```

## Löschen

```typescript
const result = await exports['cfx-mongodb'].delete('players', {
  _id: '674a1b2c3d4e5f6789012345',
});

if (result.success) {
  console.log(`Gelöscht: ${result.deletedCount}`);
}
```

## Zählen

```typescript
const result = await exports['cfx-mongodb'].count('players', { active: true });
if (result.success) console.log(result.data);
```

## Rückgabetypen

| Export | Erfolg |
|--------|--------|
| `insert` | `{ success: true, insertedId: string }` |
| `findAll` | `{ success: true, data: T[] }` |
| `find` | `{ success: true, data: T }` |
| `findById` | `{ success: true, data: T \| null }` |
| `update` | `{ success: true, modifiedCount: number, matchedCount: number }` |
| `delete` | `{ success: true, deletedCount: number }` |
| `count` | `{ success: true, data: number }` |
| `getVersion` | `string` (kein Envelope) |
| `getDb` | `Db \| null` (kein Envelope) |
| `isConnected` | `boolean` |

Fehler: `{ success: false, error: string }` — Exports werfen keine Exceptions.

Weitere Exporte: `ensureIndexes`, `health`, `config`, `connect`, `disconnect`.
