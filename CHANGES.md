# Änderungen (Changelog)

## 1.1.0 – Node 22, Sicherheit & Performance, Beispiele

- Laufzeit & Build
  - Node 22-Unterstützung (fxmanifest `node_version '22'`).
  - Vite auf Node-SSR umgestellt (keine Browser-Polyfills, `global.navigator` entfernt/definiert).
  - Abhängigkeiten aktualisiert (u. a. `mongodb@^7`, `vite@^5/7`, TypeScript ^5.x).

- Sicherheit & Stabilität
  - Validierung von Filtern/Updates mit Denylist gefährlicher Operatoren (`$where`, `$accumulator`, `$function`, …).
  - Konfigurierbare Poolgrößen über ConVars: `mongodb_max_pool`, `mongodb_min_pool` (mit Clamping).
  - Zeitüberschreitung via `mongodb_timeout` konsistent angewendet.
  - Strukturierte Logs mit `mongodb_log_level` (`error|warn|info|debug`).

- API & Exporte (Server)
  - Bestehende CRUD-Exporte beibehalten: `insert`, `find`, `findAll`, `update`, `delete`, `count`, `getDb`, `isConnected`.
  - Neu: `ensureIndexes` (manuell Indizes anlegen).
  - Neu: `health` (Ping/RTT), `config` (sichere Laufzeitkonfiguration einsehbar).
  - `findAll` unterstützt `projection`, `sort`, `limit`, `skip` (mit sicheren Defaults/Clamps).
  - Einheitliche `_id`-Behandlung (String ↔ ObjectId) über Hilfsfunktion.

- Automatische Indizes
  - ConVar `mongodb_init_indexes` (JSON) ermöglicht Anlegen von Indizes beim Start.
  - Begrenzungen: max. 50 Collections, 20 Indizes je Collection; Logging je Ergebnis.
  - Event `cfx-mongodb:ready` nach erfolgreicher Verbindung & Index-Initialisierung.

- Typen & Linting
  - TS-Konfiguration auf Server-Typen fokussiert (`@citizenfx/server`), moderne Libs, `skipLibCheck`.
  - ESLint v9 Flat-Config + Prettier integriert; verbleibende Warnungen nur bei unvermeidbaren Casts (FiveM-Globals/Driver-Optionen).

- CI/CD
  - Branch-spezifische Builds (node16/node22) und Release-Workflow nur für `main` inkl. Artefakt/Release.

- Beispiele & Dokus
  - Neue Beispiele: `examples/server.ts`, `examples/server.lua`.
  - Leitfäden: `examples/typescript.md`, `examples/lua.md`.
  - Beispiel-Manifeste: `examples/fxmanifest-lua-example.lua`, `examples/fxmanifest-ts-example.lua`.
  - README ergänzt: „Quick Test außerhalb der Ressource“ inkl. ConVars & Startreihenfolge.

## Hinweise zum Upgrade von v6 → v7 (mongodb)
- Entfernte/veraltete Optionen (z. B. `useNewUrlParser`, `useUnifiedTopology`) nicht mehr setzen.
- `FindOptions<T>` → ohne generischen Parameter verwenden.
- Empfohlen: explizite Timeout-/Pool-Optionen und Validierung nutzen.

## Breaking Changes
- Erfordert Node 22-Laufzeit (siehe `fxmanifest.lua`).
- Einige API-Beispiele in den alten Docs wurden auf aktuelle Exportnamen (`insert`, `findAll`, `update`, `delete`) angepasst.

