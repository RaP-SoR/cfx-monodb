# Quality Audit 2026 — cfx-mongodb

> **Datum:** 2026-05-26  
> **Branch-Baseline:** `dev` @ nach Track A–C2 + CONFIGURATION-Doku  
> **Zweck:** Vergleichspunkt für spätere Audits — **kein Release-Zwang**  
> **Nächster Audit:** nach Track E/F/G oder bei größeren Änderungen

---

## Kontext (Betrieb)

| Fakt | Konsequenz für Prioritäten |
|------|----------------------------|
| **Ein Haupt-Consumer** (CTFFramework) | `main`-Release und öffentliche Semver weniger kritisch |
| **Stabilität im Alltag** | Feedback kommt direkt; Fixes landen auf `dev` |
| **Kleines Team (1–2 Personen)** | Direkt-Merge auf `dev` ist OK — PRs optional |
| **Externe Nutzer (später)** | Dann PRs + Issues + Download-Releases sinnvoller |

---

## Gesamtreife (Schätzung)

| Phase | Score | Anmerkung |
|-------|-------|-----------|
| **Vor Refactor / Audit-Start** | **~45%** | Monolith, dünne Tests/Doku, manuell |
| **Heute (`dev`)** | **~72%** | **~+27 Punkte** |

### Scorecard nach Bereich

| Bereich | Vorher (~) | Jetzt (~) | Δ |
|---------|------------|-----------|---|
| Architektur & Struktur | 40% | **88%** | +48 |
| API-Vertrag & Types | 50% | **85%** | +35 |
| Externe Dokumentation | 45% | **82%** | +37 |
| In-Code-Doku (TSDoc) | 20% | **55%** | +35 |
| Examples (ConVars + API) | 40% | **75%** | +35 |
| Unit-Tests | 35% | **68%** | +33 |
| Integration / Lasttests | 5% | **8%** | +3 |
| CI / Automatisierung | 25% | **55%** | +30 |
| Observability | 10% | **72%** | +62 |
| Logging & Fehler | 50% | **62%** | +12 |
| **Distribution (Download ohne Build)** | 15% | **20%** | +5 |

**Distribution** ist bewusst niedrig: Consumer müssen heute klonen + `yarn build` — siehe Abschnitt [Distribution](#distribution--vorgebaute-releases).

---

## Stärken (heute)

- Handler-Architektur, `withDb`-Pipeline, Contract-Tests
- [`docs/API.md`](../API.md), [`docs/CONFIGURATION.md`](../CONFIGURATION.md), Examples
- Slow-Query-Log + `getQueryStats` (ConVar-gated)
- CI auf `dev`/`main`: lint, tsc, test, build; `dist`-Artifact im Workflow

---

## Lücken (priorisiert)

| Prio | Thema | Einschätzung |
|------|-------|--------------|
| **Hoch** | Automatisierung nach Änderung (Scout, Checkliste) | Prozess, kein Feature |
| **Hoch** | **Vorgebautes Release-Zip** (dist + deps, kein yarn build) | DX für Server-Betreiber |
| **Mittel** | Testtiefe (Handler splitten, Bootstrap-Fehler, optional Mongo-CI) | Vor größeren Refactors |
| **Mittel** | Doku: `patterns.md`, API-Beispiele pro Export | Onboarding |
| **Mittel** | TSDoc-Header auf bootstrap, config, responses, handlers | Track B ergänzen |
| **Niedrig** | Lasttests (tausende Queries) | Optional, staging/CI manuell |
| **Niedrig** | `connect()`-Envelope, Fehlercodes | Ops-Polish |

---

## Nächste Tracks (Qualität, keine Features)

```text
Track E — Automatisierung & Review-Routinen     (1–2 Tage)
Track F — Dokumentation vertiefen               (2–3 Tage)
Track G — Test-Matrix                           (3–5 Tage)
Track H — Perf / Last-Bench                     (optional)
Track I — Distribution & CI-Releases            (1–2 Tage)  ← siehe unten
```

Details E–H: [IDEAS-BACKLOG.md](IDEAS-BACKLOG.md) · Vorgeschlagene Reihenfolge dort.

### Track E — Automatisierung

- PR-/Commit-Checkliste (Export → API.md, fxmanifest, examples, tests)
- Cursor-Skill **post-change-scout**
- Optional: pre-push Gate lokal
- **Kein Zwang zu GitHub-PRs** — Skill auch nach direktem Push auf `dev`

### Track F — Doku

- `docs/examples/patterns.md`
- API.md: ein Beispiel pro Export
- TSDoc `@file` auf restlichen Modulen

### Track G — Tests

- Handler-Tests aufteilen
- `config`- und Bootstrap-Fehlerpfade
- Optional: Mongo smoke in CI

### Track H — Performance

- `tools/bench/` — N Queries gegen echtes Mongo
- Nicht blockierend für Alltag

---

## Workflow: Solo-Team vs. Pull Requests

### Empfohlen für euch (1–2 Personen, ein Consumer)

```text
Feature/fix lokal → yarn test && yarn build → push dev
Kein PR nötig · Issues optional · Stabilität im CTFFramework-Alltag
```

Das ist **völlig legitim** für interne Library-Pflege.

### Wann PRs trotzdem Vorteile bringen (ohne sie zu erzwingen)

| Vorteil | Nutzen |
|---------|--------|
| **CI vor Merge** | Roter Build fällt auf, bevor `dev` kaputt ist — auch ohne Reviewer |
| **Diff-Übersicht** | „Was hat sich an der API geändert?“ — hilft beim Scout |
| **Pause zum Nachdenken** | Kleiner Change-Set statt 50 Commits am Stück |
| **Externe Contributors** | Erst relevant, wenn andere Server/Teams die Resource nutzen |
| **Release-Notes** | PR-Titel/Liste → CHANGELOG für öffentliche Releases |

**Kompromiss ohne PR-Zwang:** Push auf `dev` → **GitHub Actions laufen trotzdem** (habt ihr schon). PR nur wenn *du* Review willst oder extern jemand beiträgt.

### Issues

Für internes Projekt: **optional**. Sinnvoll wenn:

- Bugs vom Live-Server protokolliert werden sollen
- Externe Nutzer Feedback geben
- Track D/I aus dem Backlog priorisiert wird

---

## CI auf Branch — ohne Merge

**Ziel:** Gate auf `dev` (oder Feature-Branch) testen, **ohne** `main` zu mergen.

| Mechanismus | Verhalten |
|-------------|-----------|
| **Push auf `dev`** | CI läuft bereits (`.github/workflows/build.yml`) |
| **Feature-Branch push** | CI mit `branches: [main, dev]` — Feature-Branches erweitern oder `pull_request` nutzen |
| **Manuell** | `workflow_dispatch` — Gate + Artifact on demand |
| **Tag auf `dev`** | z. B. `v1.0.2-dev.1` → Release bauen ohne `main` |

Empfehlung Track I: Workflow **`release.yml`** mit `workflow_dispatch` + optional Tag `v*`:

1. lint, tsc, test, build  
2. `yarn install --production` (nur `mongodb`)  
3. Zip: `dist/`, `fxmanifest.lua`, `package.json`, `node_modules/` (prod)  
4. GitHub Release (pre-release) zum Download  

**Kein Merge nötig** — nur grüner Build + Artefakt.

---

## Distribution — vorgebaute Releases

### Problem heute

```text
git clone → yarn install → yarn build → Resource in txData legen → ConVars
```

Für Server-Admins **ohne Node-Tooling** ist das zu viel.

### Zielbild

```text
Release-Zip von GitHub laden → entpacken nach resources/cfx-mongodb → ConVars → ensure
```

### Was im Zip sein muss (FiveM Node 22)

| Pfad | Grund |
|------|--------|
| `dist/index.js` (+ `.map` optional) | Kompilierte Resource |
| `fxmanifest.lua` | Manifest + `node_version '22'` |
| `package.json` | Metadaten |
| `node_modules/mongodb/` | Treiber ist **nicht** gebundelt — FiveM lädt aus node_modules |

**Nicht nötig im Zip:** `src/`, TypeScript, Vite, Vitest (nur für Maintainer).

### Einmaliger Minimal-Schritt auf dem Server

Entweder Zip **mit** `node_modules` (größer, ~null Build) **oder** einmalig im Resource-Ordner:

```bash
yarn install --production
```

(nur wenn Zip ohne node_modules ausgeliefert wird)

### Versionierung

- Tag = fxmanifest `version` / `package.json` version  
- Pre-releases: `1.0.2-dev.1` von Branch `dev`  
- Stable später: `1.0.2` wenn gewünscht — **kein Muss** für euren Single-Consumer-Betrieb

---

## Vergleich für nächsten Audit

Beim nächsten Audit diese Felder erneut bewerten:

| Feld | Wert 2026-05-26 |
|------|-----------------|
| Gesamtscore | ~72% |
| Tests (Anzahl) | 89 |
| TSDoc `@file` in src/ | 9 Module |
| CI | build.yml auf push dev/main |
| Pre-built Release | Nein |
| Tracks offen | E, F, G, H, I |

**Changelog Audit:** Datum + Branch + Commit-Hash + neue Scores eintragen.

---

## Referenzen

| Dokument | Inhalt |
|----------|--------|
| [MAINTENANCE-ROADMAP.md](MAINTENANCE-ROADMAP.md) | Tracks A–D (A–C2 erledigt) |
| [IDEAS-BACKLOG.md](IDEAS-BACKLOG.md) | Ideen & Priorisierung |
| [CONFIGURATION.md](../CONFIGURATION.md) | ConVar-Installation |
| [.github/workflows/build.yml](../../.github/workflows/build.yml) | Aktuelles CI |

---

## Audit-Historie

| Datum | Branch | Gesamt | Notizen |
|-------|--------|--------|---------|
| 2026-05-26 | `dev` | ~72% | Erster Audit nach Maintenance-Tracks; Distribution-Schwäche benannt |
