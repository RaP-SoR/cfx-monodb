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
│  docs/SEARCH-MAP.md → Navigation (zuerst lesen) │
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
| `examples-docs` | `.cursor/skills/examples-docs/SKILL.md` | Consumer-Beispiele Lua+TS, Cookbook, Doc-Audit nach Merge/Commit |
| `post-change-scout` | `.cursor/skills/post-change-scout/SKILL.md` | Vor Commit/Push — `yarn scout`, Checklist, Drift-Check |
| `integration-review` | `.cursor/skills/integration-review/SKILL.md` | Track J — real Mongo tests, CI integration job |
| `logging-review` | `.cursor/skills/logging-review/SKILL.md` | Track K — log policy, redaction, tests |

Der Skill verweist auf `reference.md` für API-Details — **progressive disclosure** (Skill kurz, Referenz ausführlich).

### Persönliche vs. Projekt-Skills

- **Projekt-Skill** (`.cursor/skills/`): Im Repo, für alle Contributors — **empfohlen und angelegt**
- **Persönliche Skills** (`~/.cursor/skills/`): Nur für lokale Workflows (z.B. dein CTFFramework-Monorepo)

## Cursor Rules — Verwendung

| Rule | Globs | Zweck |
|------|-------|-------|
| `exports-api.mdc` | `src/exports.ts`, `src/responses.ts` | Response-Envelope, keine Exceptions |
| `node22-runtime.mdc` | `**/*` (always) | Node 22 + Build-Pflicht |
| `examples-docs.mdc` | `docs/examples/**`, `docs/API.md` | Lua+TS examples parallel, TEMPLATE |

Rules sind **kurz (<50 Zeilen)** und ergänzen AGENTS.md um datei-spezifische Invarianten.

## Search Map als Kontext-Sparer

`docs/SEARCH-MAP.md` ersetzt breites Repo-Scannen:

1. Agent liest Search Map (~2 min Kontext)
2. Springt direkt zur Zieldatei
3. Liest `docs/API.md` nur bei API-Fragen

**Token-Einsparung:** Kein Grep über `node_modules`, kein Lesen aller Examples bei Export-Tasks.

## Dokumentations-Hierarchie

| Priorität | Datei | Zielgruppe |
|-----------|-------|------------|
| 1 | `docs/API.md` | Externe Consumer, CTFFramework |
| 2 | `docs/SEARCH-MAP.md` | Agents, Maintainer |
| 3 | `AGENTS.md` | Cursor/CI Contributors |
| 4 | `docs/examples/typescript/` / `lua/` | Sprach-spezifische Beispiele (getrennte Ordner) |
| 5 | `docs/GUIDE.md` / `README.md` | Menschliche Übersicht |
| 6 | `docs/examples/lua/server.lua` / `typescript/server.ts` | Copy-Paste-Starter |

Bei Widersprüchen gilt **`docs/API.md`** + **`src/api/handlers/*`** (Implementierung).

## Agent-Workflows (Checklisten)

**Canonical:** [CHECKLIST.md](CHECKLIST.md) · **Automated:** `yarn gate` / `yarn scout` / `yarn doc-audit` · **Examples skill:** `.cursor/skills/examples-docs/`

### Export ändern
- [ ] See [CHECKLIST.md — Export / API](CHECKLIST.md#export--api-behavior-change)
- [ ] Run `yarn scout` before push

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
- **Exceptions aus Exports** — bricht CTFFramework
- **node_version entfernen** — mongodb@7 bricht

## Refactor-Archiv (historisch)

Waves 1–4 sind in `dev` gemerged (PR #1). Specs und Status-Board:
[docs/archive/refactor/](archive/refactor/README.md). Orchestrator-Skill archiviert unter
[refactor-orchestrator-SKILL.md](archive/refactor-orchestrator-SKILL.md).

## Erweiterungsmöglichkeiten (optional, später)

| Idee | Nutzen |
|------|--------|
| OpenAPI-ähnliches JSON-Schema | Maschinenlesbarer Vertrag für CTFFramework-Codegen |
| CI-Check: API.md ↔ exports.ts | Drift verhindern (Wave 2B scaffold started) |
