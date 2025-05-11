# MongoDB API für Lua

Diese Dokumentation enthält Beispiele für die Verwendung der MongoDB-Schnittstelle in RedM mit Lua.

## Verbindungsstatus prüfen

```lua
local isConnected = exports['cfx-mongodb']:isConnected()
print('Ist die Datenbank verbunden?', isConnected)
```

## Dokument einfügen

```lua
local playerDoc = {
  identifier = 'steam:123456789',
  name = 'John Smith',
  level = 10,
  inventory = {
    {id = 'revolver', count = 1},
    {id = 'ammo', count = 12}
  }
}

local result = exports['cfx-mongodb']:insertOne('players', playerDoc)
if result.success then
  print('Spieler eingefügt mit ID:', result.insertedId)
else
  print('Fehler beim Einfügen:', result.error)
end
```

## Dokumente finden

```lua
-- Alle Dokumente in einer Sammlung finden
local allPlayers = exports['cfx-mongodb']:find('players')
if allPlayers.success then
  print(#allPlayers.data, 'Spieler gefunden')
  for _, player in ipairs(allPlayers.data) do
    print('Spieler:', player.name, 'Level:', player.level)
  end
else
  print('Fehler bei der Suche:', allPlayers.error)
end

-- Mit Filter und Optionen
local highLevelPlayers = exports['cfx-mongodb']:find(
  'players', 
  {level = {['$gt'] = 5}},  -- Filter: Spieler mit Level über 5
  {sort = {level = -1}, limit = 10}  -- Optionen: Nach Level absteigend sortiert, max. 10 Ergebnisse
)
```

## Ein Dokument finden

```lua
-- Einen bestimmten Spieler finden
local player = exports['cfx-mongodb']:findOne('players', {identifier = 'steam:123456789'})
if player.success and player.data then
  print('Spieler gefunden:', player.data.name)
elseif player.success then
  print('Spieler nicht gefunden')
else
  print('Fehler beim Suchen:', player.error)
end
```

## Dokument aktualisieren

```lua
-- Spieler-Level erhöhen
local updateResult = exports['cfx-mongodb']:updateOne(
  'players',
  {identifier = 'steam:123456789'},  -- Filter
  {['$set'] = {level = 11}}  -- Aktualisierung mit Operator
)

-- Alternative Syntax ohne expliziten $set Operator
local simpleUpdate = exports['cfx-mongodb']:updateOne(
  'players',
  {identifier = 'steam:123456789'},
  {level = 12, lastUpdated = os.time()}
)

if updateResult.success then
  print('Übereinstimmende Dokumente:', updateResult.matchedCount)
  print('Geänderte Dokumente:', updateResult.modifiedCount)
end
```

## Dokument löschen

```lua
local deleteResult = exports['cfx-mongodb']:deleteOne(
  'players',
  {identifier = 'steam:123456789'}
)

if deleteResult.success then
  print('Gelöschte Dokumente:', deleteResult.deletedCount)
else
  print('Fehler beim Löschen:', deleteResult.error)
end
```

## Rückgabewerte

Alle Funktionen (außer `isConnected`) geben ein Tabelle mit mindestens einem `success`-Feld zurück:
- Bei Erfolg: `{success = true, ...}` mit zusätzlichen Daten je nach Funktion
- Bei Fehler: `{success = false, error = 'Fehlermeldung'}`

### Rückgabetypen im Detail

- insertOne: `{success = true, insertedId = string}` oder `{success = false, error = string}`
- find: `{success = true, data = Array<Table>}` oder `{success = false, error = string}`
- findOne: `{success = true, data = Table|nil}` oder `{success = false, error = string}`
- updateOne: `{success = true, matchedCount = number, modifiedCount = number}` oder `{success = false, error = string}`
- deleteOne: `{success = true, deletedCount = number}` oder `{success = false, error = string}`
- isConnected: `boolean`
```