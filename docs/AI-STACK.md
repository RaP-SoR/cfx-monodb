# AI Stack & Agent Memory — cfx-mongodb

Analyse und Empfehlungen für KI-gestützte Entwicklung an diesem Projekt.

## Projektkontext für Agents

| Dimension | Wert |
|-----------|------|
| Domäne | FiveM/RedM Server, MongoDB über Exports |
| Sprache | TypeScript → CommonJS (`dist/index.js`) |
| Runtime | FiveM Node **22** (nicht Standard-Node) |
| Consumer | CTFFramework + beliebige Lua/TS-Ressourcen |
| Kein Frontend | Kein React, kein Browser-Bundle |
| Kein ORM | Direkter MongoDB-Treiber, dünner Wrapper |

## Empfohlener AI-Kontext-Stack

```
┌─────────────────────────────────────────────────┐
│  Cursor Agent Session                           │
├─────────────────────────────────────────────────┤
│  AGENTS.md          → Regeln, Build, Stil       │
│  SEARCH-MAP.md      → Navigation (zuerst lesen) │
│  docs/API.md        → Externer Vertrag          │
│  docs/ARCHITECTURE.md → Laufzeit & Schichten    │
├─────────────────────────────────────────────────┤
│  .cursor/rules/*.mdc  → Datei-spezifische Regeln│
│  .cursor/skills/      → On-Demand-Workflows     │
└─────────────────────────────────────────────────┘
```

### Warum kein schwerer „AI Stack“?

Dieses Repo ist eine **kleine, fokussierte Library** (~350 LOC Source). Es braucht:
- Kein RAG über eigene Embeddings
- Kein LLM-Memory-Service
- Kein MCP-Server

Stattdessen: **strukturierte Markdown-Artefakte** als persistentes Agent-Gedächtnis (Search Map + API + Skills).

## Memory Skills — Verwendung

| Skill | Pfad | Wann laden |
|-------|------|------------|
| `cfx-mongodb` | `.cursor/skills/cfx-mongodb/SKILL.md` | Export-Änderungen, CTFFramework-Kompatibilität, MongoDB-Wrapper-Arbeit |
| `refactor-orchestrator` | `.cursor/skills/refactor-orchestrator/SKILL.md` | Parallele Refactor-Waves, Merge-Train, Worktree-Koordination |

Der Skill verweist auf `reference.md` für API-Details — **progressive disclosure** (Skill kurz, Referenz ausführlich).

### Persönliche vs. Projekt-Skills

- **Projekt-Skill** (`.cursor/skills/`): Im Repo, für alle Contributors — **empfohlen und angelegt**
- **Persönliche Skills** (`~/.cursor/skills/`): Nur für lokale Workflows (z.B. dein CTFFramework-Monorepo)

## Cursor Rules — Verwendung

| Rule | Globs | Zweck |
|------|-------|-------|
| `exports-api.mdc` | `src/exports.ts`, `src/responses.ts` | Response-Envelope, keine Exceptions |
| `node22-runtime.mdc` | `**/*` (always) | Node 22 + Build-Pflicht |

Rules sind **kurz (<50 Zeilen)** und ergänzen AGENTS.md um datei-spezifische Invarianten.

## Search Map als Kontext-Sparer

`SEARCH-MAP.md` ersetzt breites Repo-Scannen:

1. Agent liest Search Map (~2 min Kontext)
2. Springt direkt zur Zieldatei
3. Liest `docs/API.md` nur bei API-Fragen

**Token-Einsparung:** Kein Grep über `node_modules`, kein Lesen aller Examples bei Export-Tasks.

## Dokumentations-Hierarchie

| Priorität | Datei | Zielgruppe |
|-----------|-------|------------|
| 1 | `docs/API.md` | Externe Consumer, CTFFramework |
| 2 | `SEARCH-MAP.md` | Agents, Maintainer |
| 3 | `AGENTS.md` | Cursor/CI Contributors |
| 4 | `doc-lua.md` / `doc-typescript.md` | Sprach-spezifische Beispiele |
| 5 | `DOCS.md` / `README.md` | Menschliche Übersicht |
| 6 | `examples/*` | Copy-Paste-Starter |

Bei Widersprüchen gilt **`docs/API.md`** + **`src/exports.ts`**.

## Agent-Workflows (Checklisten)

### Export ändern
- [ ] `src/exports.ts` + `src/responses.ts`
- [ ] CTFFramework-Contract in `docs/API.md` prüfen
- [ ] `fxmanifest.lua` server_exports
- [ ] `yarn build` + `yarn tsc`
- [ ] `doc-lua.md` / `doc-typescript.md` bei Verhaltensänderung

### Neuer Consumer (andere Resource)
- [ ] `ensure cfx-mongodb` in server.cfg
- [ ] Auf `cfx-mongodb:ready` warten
- [ ] `docs/API.md` für Signaturen
- [ ] `isConnected()` vor kritischen Ops optional

### Debugging
- [ ] `mongodb_log_level debug`
- [ ] `health()` Export testen
- [ ] `config()` für Env/Pool prüfen (keine URL — ConVar checken)

## Nicht empfohlen

- **dist/ manuell patchen** — wird bei Build überschrieben
- **findById annehmen** — in Manifest gelistet, aber nicht implementiert (siehe SEARCH-MAP)
- **Exceptions aus Exports** — bricht CTFFramework
- **node_version entfernen** — mongodb@7 bricht

## Staged Refactor (Multi-Agent)

| Artefakt | Pfad |
|----------|------|
| Playbook | `docs/refactor/README.md` |
| Wave 1 Spec | `docs/refactor/WAVE-1-SPEC.md` |
| Status board | `docs/refactor/REFACTOR-STATUS.md` |
| Target interfaces | `docs/refactor/INTERFACES.md` |
| Worktree script | `scripts/setup-worktrees-wave1.ps1` |

Branch: `refactor/staged-hardening`. Orchestrator tab loads `refactor-orchestrator` skill; implementer tabs get one worktree each.

## Erweiterungsmöglichkeiten (optional, später)

| Idee | Nutzen |
|------|--------|
| OpenAPI-ähnliches JSON-Schema | Maschinenlesbarer Vertrag für CTFFramework-Codegen |
| CI-Check: API.md ↔ exports.ts | Drift verhindern (Wave 2B scaffold started) |
