# MongoDB API für TypeScript

Diese Dokumentation enthält Beispiele für die Verwendung der MongoDB-Schnittstelle in RedM mit TypeScript.

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

const result = await exports['cfx-mongodb'].insertOne('players', playerDoc);
if (result.success) {
  console.log(`Spieler eingefügt mit ID: ${result.insertedId}`);
} else {
  console.error(`Fehler beim Einfügen: ${result.error}`);
}
```

## Dokumente finden

```typescript
// Alle Dokumente in einer Sammlung finden
const allPlayers = await exports['cfx-mongodb'].find('players');
if (allPlayers.success) {
  console.log(`${allPlayers.data.length} Spieler gefunden`);
  allPlayers.data.forEach((player: Player) => {
    console.log(`Spieler: ${player.name}, Level: ${player.level}`);
  });
} else {
  console.error(`Fehler bei der Suche: ${allPlayers.error}`);
}

// Mit Filter und Optionen
const highLevelPlayers = await exports['cfx-mongodb'].find('players', 
  { level: { $gt: 5 } },  // Filter: Spieler mit Level über 5
  { sort: { level: -1 }, limit: 10 }  // Optionen: Nach Level absteigend sortiert, max. 10 Ergebnisse
);
```

## Ein Dokument finden

```typescript
// Einen bestimmten Spieler finden
const player = await exports['cfx-mongodb'].findOne('players', { identifier: 'steam:123456789' });
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
const updateResult = await exports['cfx-mongodb'].updateOne(
  'players',
  { identifier: 'steam:123456789' },  // Filter
  { $set: { level: 11 } }  // Aktualisierung mit Operator
);

// Alternative Syntax ohne expliziten $set Operator
const simpleUpdate = await exports['cfx-mongodb'].updateOne(
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
const deleteResult = await exports['cfx-mongodb'].deleteOne(
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

- insertOne: `{success: true, insertedId: ObjectId}` oder `{success: false, error: string}`
- find: `{success: true, data: T[]}` oder `{success: false, error: string}`
- findOne: `{success: true, data: T | null}` oder `{success: false, error: string}`
- updateOne: `{success: true, matchedCount: number, modifiedCount: number}` oder `{success: false, error: string}`
- deleteOne: `{success: true, deletedCount: number}` oder `{success: false, error: string}`
- isConnected: `boolean`
```