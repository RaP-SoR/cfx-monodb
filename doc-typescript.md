# MongoDB API für TypeScript

Hinweise für Node 22 und konfigurierbare Performance/Sicherheit.

## Runtime & Konfiguration
- Node 22 aktivieren: `node_version '22'` in `fxmanifest.lua`.
- Ressource: Ordner `cfx-mongodb`, in `server.cfg`: `ensure cfx-mongodb`.
- Wichtige ConVars:
  - `mongodb_env` (`dev|prod|test`), `mongodb_*_url`
  - `mongodb_timeout` (ms), `mongodb_max_pool`, `mongodb_min_pool`
  - `mongodb_log_level` (`error|warn|info|debug`)
  - `mongodb_init_indexes` (JSON): z. B. `{ "users": [{ "keys": { "email": 1 }, "options": { "unique": true } }] }`

## Verbindungsstatus prüfen

```typescript
const isConnected = exports['cfx-mongodb'].isConnected();
console.log(`Ist die Datenbank verbunden? ${isConnected ? 'Ja' : 'Nein'}`);
```

## Dokument einfügen

```typescript
interface Player {
  identifier: string;
  name: string;
  level: number;
  inventory: object[];
}

const playerDoc: Player = {
  identifier: 'steam:123456789',
  name: 'John Smith',
  level: 10,
  inventory: [{id: 'revolver', count: 1}, {id: 'ammo', count: 12}]
};

const result = await exports['cfx-mongodb'].insert('players', playerDoc);
if (result.success) {
  console.log(`Spieler eingefügt mit ID: ${result.insertedId}`);
} else {
  console.error(`Fehler beim Einfügen: ${result.error}`);
}
```

## Dokumente finden

```typescript
// Alle Dokumente in einer Sammlung finden
const allPlayers = await exports['cfx-mongodb'].findAll('players');
if (allPlayers.success) {
  console.log(`${allPlayers.data.length} Spieler gefunden`);
  allPlayers.data.forEach((player: Player) => {
    console.log(`Spieler: ${player.name}, Level: ${player.level}`);
  });
} else {
  console.error(`Fehler bei der Suche: ${allPlayers.error}`);
}

// Mit Filter und Optionen
const highLevelPlayers = await exports['cfx-mongodb'].findAll('players', 
  { level: { $gt: 5 } },  // Filter: Spieler mit Level über 5
  { sort: { level: -1 }, limit: 10 }  // Optionen: Nach Level absteigend sortiert, max. 10 Ergebnisse
);
```

## Ein Dokument finden

```typescript
// Einen bestimmten Spieler finden
const player = await exports['cfx-mongodb'].find('players', { identifier: 'steam:123456789' });
if (player.success && player.data) {
  console.log(`Spieler gefunden: ${player.data.name}`);
} else if (player.success) {
  console.log('Spieler nicht gefunden');
} else {
  console.error(`Fehler beim Suchen: ${player.error}`);
}
```

## Dokument aktualisieren

```typescript
// Spieler-Level erhöhen
const updateResult = await exports['cfx-mongodb'].update(
  'players',
  { identifier: 'steam:123456789' },  // Filter
  { $set: { level: 11 } }  // Aktualisierung mit Operator
);

// Alternative Syntax ohne expliziten $set Operator
const simpleUpdate = await exports['cfx-mongodb'].update(
  'players',
  { identifier: 'steam:123456789' },
  { level: 12, lastUpdated: new Date() }
);

if (updateResult.success) {
  console.log(`Übereinstimmende Dokumente: ${updateResult.matchedCount}`);
  console.log(`Geänderte Dokumente: ${updateResult.modifiedCount}`);
}
```

## Dokument löschen

```typescript
const deleteResult = await exports['cfx-mongodb'].delete(
  'players',
  { identifier: 'steam:123456789' }
);

if (deleteResult.success) {
  console.log(`Gelöschte Dokumente: ${deleteResult.deletedCount}`);
} else {
  console.error(`Fehler beim Löschen: ${deleteResult.error}`);
}
```

## Rückgabewerte

Alle Funktionen (außer `isConnected`) geben ein Objekt mit mindestens einem `success`-Feld zurück:
- Bei Erfolg: `{success: true, ...}` mit zusätzlichen Daten je nach Funktion
- Bei Fehler: `{success: false, error: 'Fehlermeldung'}`
```

### Rückgabetypen im Detail

- insert: `{success: true, insertedId: ObjectId|string}`
- findAll: `{success: true, data: T[]}`
- find: `{success: true, data: T | null}`
- update: `{success: true, matchedCount: number, modifiedCount: number}`
- delete: `{success: true, deletedCount: number}`
- isConnected: `boolean`

Zusätzlich verfügbare Exporte: `count`, `ensureIndexes`, `health`, `config`.
```
