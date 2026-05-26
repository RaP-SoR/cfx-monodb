# Lua examples — cfx-mongodb

> **Nur Lua** — kein TypeScript in diesen Dateien. API-Vertrag: [../../API.md](../../API.md)

**Neu hier?** → **[use-cases.md](use-cases.md)** (Account/Character/Vehicle/Items, **jeder Export** mit FiveM-Szenario)

| Datei | Inhalt |
|-------|--------|
| **[use-cases.md](use-cases.md)** | **FiveM-Szenarien** — Join, Charakter, Garage, Inventar, Ban; Export-Checkliste |
| [snippets.md](snippets.md) | Kurzreferenz pro Export |
| [queries.md](queries.md) | Query-Cookbook — JOIN-Analogy, Zeitzonen (EU/US/Asia), Operatoren |
| [datetime-helpers.lua](datetime-helpers.lua) | UTC + Region-Offsets zum Kopieren |
| [patterns.md](patterns.md) | `ready`, Success-Checks, Pagination, Indexes |
| [server.lua](server.lua) | Minimale lauffähige CRUD-Tour (kommentiert) |
| [../sample-resource/](../sample-resource/README.md) | **Multi-File-Resource** (accounts, characters, vehicles, items) |
| [fxmanifest-lua-example.lua](fxmanifest-lua-example.lua) | Manifest-Vorlage |

### Alle Exports abgedeckt?

Ja — siehe Tabelle in [use-cases.md § Export coverage](use-cases.md#export-coverage-nothing-missing).

TypeScript-Beispiele: [../typescript/README.md](../typescript/README.md)

## server.cfg

```cfg
exec ../config/mongodb.local.cfg
ensure cfx-mongodb
ensure your-lua-resource
```

Vor jedem CRUD auf **`cfx-mongodb:ready`** warten — siehe [patterns.md §1](patterns.md#1-startup--wait-for-ready).

## Export-Syntax (Lua)

```lua
-- Üblich in FiveM:
exports['cfx-mongodb']:find('collection', { field = 'value' })

-- Mongo-Operatoren brauchen oft Klammer-Keys:
{ level = { ['$gte'] = 10 } }
{ ['$and'] = { { active = true }, { level = { ['$gte'] = 5 } } } }
```

Ergebnisse prüfen: `if result.success then … else print(result.error) end` — Exports **werfen nicht**.

## Empfohlener Lernpfad (Lua)

1. **[use-cases.md](use-cases.md)** — Account/Charakter/Fahrzeug/Inventar (sofort FiveM-Kontext)
2. **[patterns.md](patterns.md)** — `ready` abwarten, `success` richtig prüfen
3. **[queries.md](queries.md)** — wenn Filter komplex werden (`$in`, `$and`, …)
4. **[server.lua](server.lua)** — einmal lokal gegen Mongo laufen lassen
5. **[snippets.md](snippets.md)** — Kurzreferenz mit „What this does“ pro Export
6. **[../sample-resource/](../sample-resource/README.md)** — Ordnerstruktur wie auf einem echten Server
