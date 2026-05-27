# Configuration & Installation — cfx-mongodb

> **Canonical API (ConVar list):** [API.md](API.md#configuration-convars)  
> **Consumer integration:** this document — **start here for server setup**

---

> ### Recommended — connection via ConVars (FiveM native)
>
> **Configure MongoDB once in `server.cfg` (or an `exec` profile file).**  
> Consumer resources **do not** call `connect()` or pass URLs — they wait for `cfx-mongodb:ready` and use CRUD exports.
>
> | Do | Don't |
> |----|-------|
> | `set mongodb_*_url` in server config | Hardcode URIs in resource source |
> | `ensure cfx-mongodb` before consumers | Call `connect()` from every module |
> | `exec mongodb.local.cfg` for per-developer secrets | Commit credentials to git |
> | `mongodb_env dev` on local, `prod` on live | Share prod URLs in Discord/screenshots |
>
> Programmatic `connect(url)` is **Advanced/Internal** — runtime override only, not the default path. See [API.md](API.md#advanced--internal-exports).

---

## Quick install (minimal)

**1. Resource**

```cfg
ensure cfx-mongodb
```

**2. One environment + URL**

```cfg
set mongodb_env dev
set mongodb_dev_url mongodb://localhost:27017/ctf_dev
```

**3. Consumer resource** (after `cfx-mongodb` in `server.cfg`)

```cfg
ensure my-resource
```

**4. In code** — wait for ready, then CRUD:

```typescript
on("cfx-mongodb:ready", async () => {
  const r = await exports["cfx-mongodb"].find("players", { license: "abc" });
});
```

No connection code in the consumer. That is intentional.

---

## Install from GitHub (pre-built, no local build)

CI builds **two optional artifacts** per run (same version label):

| Asset | Purpose |
|-------|---------|
| **`cfx-mongodb-*.zip`** | FiveM server resource (`dist/`, `fxmanifest`, `node_modules/mongodb`) |
| **`cfx-mongodb-*.tgz`** | npm types package for TypeScript consumer resources (not on npmjs.org) |

No `yarn build` on the game server for the ZIP.

### Dev vs stable

| Channel | Branch | Tag example | `fxmanifest` in git | Shipped manifest / `getVersion()` | GitHub Release |
|---------|--------|-------------|---------------------|-----------------------------------|----------------|
| **dev** (unstable) | `dev` | `v1.0.1-dev` | `1.0.1-dev` | `1.0.1-dev` (tag) or `1.0.1-dev+dev.abc1234` (push artifact) | Pre-release |
| **stable** | `main` | `v1.0.1` | `1.0.1` (no `-dev`) | `1.0.1` | Latest (stable) |

- **`dev` builds are not production-ready.** txAdmin and F8 show `getVersion()` from `fxmanifest` — a **`-dev`** suffix means unstable / dev branch work.
- **`package.json`** always uses base semver (`1.0.1`) on both branches; only **`fxmanifest.lua`** carries the channel suffix in git.
- **Stable** builds are published only after merging `dev` → `main`, setting `version 'X.Y.Z'` (no `-dev`), and tagging `vX.Y.Z`.
- **`main` branch pushes** also trigger CI and upload **stable-channel** artifacts (ZIP + npm `.tgz`) — same gate as `dev`, without creating a GitHub Release until you tag.

Inside every ZIP: read **`BUILD_INFO.txt`** (channel, branch, commit) and **`INSTALL.txt`**.

### Where to download

| Trigger | Where | Channel | Assets |
|---------|--------|---------|--------|
| **Tag** `vX.Y.Z-dev` on `dev` | [GitHub Releases](https://github.com/RaP-SoR/cfx-mongodb/releases) (pre-release) | dev | ZIP + `.tgz` |
| **Tag** `vX.Y.Z` on `main` | GitHub Releases (stable) | stable | ZIP + `.tgz` |
| **Push to `dev`** | Actions → **Release** workflow → Artifact | dev | ZIP + `.tgz` |
| **Push to `main`** | Actions → **Release** workflow → Artifact | stable snapshot | ZIP + `.tgz` |
| **Manual** | Actions → **Release** → **Run workflow** → choose channel | dev or stable | ZIP + `.tgz` |

### Steps (FiveM server — ZIP)

1. Download `cfx-mongodb-*.zip` from Releases or Actions artifacts  
2. Extract into `resources/cfx-mongodb` (folder name must match)  
3. Read `BUILD_INFO.txt` — confirm channel matches your intent (dev vs stable)  
4. Configure ConVars (`exec mongodb.local.cfg` or inline in `server.cfg`)  
5. `ensure cfx-mongodb` before consumer resources  

### Steps (TypeScript consumer — npm `.tgz`, optional)

Use the **matching** `.tgz` from the same Release or artifact (same tag / commit as the server ZIP).

```bash
# yarn (example — replace tag and filename from the Release page)
yarn add cfx-mongodb@https://github.com/RaP-SoR/cfx-mongodb/releases/download/v1.0.0-dev/cfx-mongodb-v1.0.0-dev.tgz
```

```bash
# npm
npm install https://github.com/RaP-SoR/cfx-mongodb/releases/download/v1.0.0-dev/cfx-mongodb-v1.0.0-dev.tgz
```

```typescript
import type { CfxMongoInsertResult, CfxMongoResult } from "cfx-mongodb/types";
```

- **Not published to [npmjs.org](https://www.npmjs.com/)** — install only from GitHub Release URLs or a local path (`file:./cfx-mongodb-v1.0.0-dev.tgz`).
- Pin the **same version/channel** as the `cfx-mongodb` resource on your server.
- Local monorepo: `"cfx-mongodb": "file:../cfx-mongodb"` also works via root `exports` (`./types`).

### Version tags (maintainers)

**Development (unstable):**

```bash
# Named dev pre-release on dev branch:
git tag v1.0.0-dev
git push origin v1.0.0-dev
# → GitHub Release (pre-release), notes from docs/releases/v1.0.0-dev.md
```

Every push to `dev` also uploads an artifact `1.0.0-dev-{sha}` (ZIP + npm `.tgz`) without creating a Release.

Every push to **`main`** uploads a **stable-channel** artifact `1.0.0-{sha}` (ZIP + `.tgz`) — use for pre-tag smoke tests on main.

**Stable (production):**

```bash
git checkout main
git merge dev
git tag v1.0.0
git push origin main v1.0.0
# → stable GitHub Release; tag must be on main (CI enforces)
```

Base semver in repo (`package.json` / source `fxmanifest.lua`) stays `X.Y.Z`; CI stamps `-dev+…` or build metadata into release ZIPs only.

Release notes templates: [docs/releases/](releases/README.md).

### Check for updates (automation idea)

- **Stable servers:** `GET /repos/RaP-SoR/cfx-mongodb/releases/latest` (excludes pre-releases)  
- **Dev servers:** latest pre-release or compare `getVersion()` / `BUILD_INFO.txt`  
- Or compare tag list to deployed folder  

Suitable for a small update script on the game server or in CTFFramework — not part of this resource.

---

## How `mongodb_env` chooses dev vs prod

| Input | Result |
|-------|--------|
| `set mongodb_env dev` | Uses `mongodb_dev_url` + dev timeouts/pool defaults |
| `set mongodb_env prod` | Uses `mongodb_prod_url` |
| `set mongodb_env test` | Uses `mongodb_test_url` |
| **Omitted** | Auto: `dev` if `sv_hostname` contains `dev`, `test`, or `local`; else `prod` |

On startup you will see: `[CFX-MongoDB] Environment: dev` (or prod/test).

**Tip:** On local machines, set `sv_hostname "My Local Dev"` or explicitly `set mongodb_env dev` so you never accidentally point at prod.

---

## Multi-developer & multi-server workflow

FiveM has no built-in `.env` loader like Node — **ConVars are the runtime config**. Teams usually mirror the **`.env` pattern** with **profile files + gitignore**:

```mermaid
flowchart LR
  subgraph git [Committed to git]
    EX[*.cfg.example templates]
    MAIN[server.cfg skeleton]
  end
  subgraph local [Per machine — gitignored]
    LOC[mongodb.local.cfg]
  end
  MAIN -->|exec| LOC
  LOC -->|set mongodb_*| FX[FiveM ConVars]
  FX --> CM[cfx-mongodb auto-connect]
```

### Step 1 — Copy a template

Templates live in [examples/config/](examples/config/):

| File | Use |
|------|-----|
| `mongodb.dev.cfg.example` | Local MongoDB, debug logging |
| `mongodb.prod.cfg.example` | Live server skeleton (no real secrets) |
| `mongodb.local.cfg.example` | Personal overrides — copy to `mongodb.local.cfg` |

```bash
# From your txData server root (not inside the resource repo)
cp resources/[cfxframework]/cfx-mongodb/docs/examples/config/mongodb.local.cfg.example mongodb.local.cfg
# Edit mongodb.local.cfg — set your URI
```

### Step 2 — `exec` from `server.cfg`

```cfg
# server.cfg (committed — no secrets)
exec mongodb.local.cfg

ensure cfx-mongodb
ensure ctf-core
# … other resources
```

Or keep profiles inside the resource path:

```cfg
exec resources/[cfxframework]/cfx-mongodb/docs/examples/config/mongodb.local.cfg
```

(Prefer **server root** `mongodb.local.cfg` so the resource repo stays secret-free.)

### Step 3 — Gitignore local files

Add to your **server** or **monorepo** `.gitignore`:

```gitignore
# MongoDB / FiveM local overrides — never commit
mongodb.local.cfg
*.local.cfg
.env
.env.local
```

The cfx-mongodb resource repo already ignores `.env.local` and `.env.*.local` for Node tooling.

### Step 4 — Each developer

1. Clone server/resources  
2. Copy `mongodb.local.cfg.example` → `mongodb.local.cfg`  
3. Set `mongodb_dev_url` to their local MongoDB (Docker, Atlas free tier, etc.)  
4. `set mongodb_env dev`  
5. Start server — no code changes  

---

## Environment profiles (reference)

### Development (local machine)

```cfg
set mongodb_env dev
set mongodb_dev_url mongodb://localhost:27017/ctf_dev
set mongodb_timeout 5000
set mongodb_log_level debug
set mongodb_max_pool 10
```

Optional: `mongodb_init_indexes` for auto-index on boot (JSON one-liner).

### Production (live server)

```cfg
set mongodb_env prod
set mongodb_prod_url mongodb://USER:PASS@host:27017/ctf_prod?authSource=admin
set mongodb_timeout 10000
set mongodb_log_level info
set mongodb_max_pool 15
# Perf off by default on high-pop — enable only when diagnosing
# set mongodb_perf_enabled 0
```

Store prod URL **only** in host panel / `mongodb.local.cfg` on the machine — not in git.

### Staging / test

```cfg
set mongodb_env test
set mongodb_test_url mongodb://staging-host:27017/ctf_staging
set mongodb_log_level info
# Optional perf for tuning:
# set mongodb_perf_enabled 1
# set mongodb_perf_slow_ms 150
```

---

## What consumer resources need (checklist)

| Step | Owner |
|------|--------|
| MongoDB URI & pool | **Server** — ConVars / `exec` profile |
| `ensure cfx-mongodb` order | **server.cfg** — before consumers |
| Wait `cfx-mongodb:ready` | **Consumer** — one event handler |
| CRUD calls | **Consumer** — exports only |
| `connect()` / `getDb()` | **Avoid** — internal/advanced only |

### Framework wrapper (optional)

If many resources share boilerplate, CTFFramework can expose:

```typescript
await ctf.db.whenReady(async (mongo) => { ... });
```

Connection stays in ConVars; the wrapper only handles `ready` + typing.

---

## Verifying the connection

After server start:

```typescript
on("cfx-mongodb:ready", async () => {
  const m = exports["cfx-mongodb"];
  console.log("connected:", m.isConnected());
  const h = await m.health();
  console.log("health:", h);
  const c = m.config();
  console.log("config:", c); // no URL — safe to log
});
```

Or enable `mongodb_log_level debug` and watch for `[CFX-MongoDB] Successfully connected`.

---

## `.env` files (Node tooling vs FiveM runtime)

| Context | `.env` useful? |
|---------|----------------|
| **FiveM server runtime** (cfx-mongodb) | **No** — uses ConVars, not `process.env` |
| **Local `yarn test` / CI** | Yes — Vitest mocks `GetConvar` |
| **Generating `mongodb.local.cfg`** | Optional script can read `.env` and write `exec` file |

If your team loves `.env`, use a **small script** (outside this resource) that generates `mongodb.local.cfg` from `.env` — still **ConVars at runtime**, secrets **gitignored**.

---

## Programmatic `connect()` — when (rare)

Use only when:

- A **single** trusted bootstrap resource must override URI at runtime  
- You accept **non-envelope** errors (`TriggerEvent` only)  
- You understand bootstrap already connected from ConVars  

**Default for CTFFramework and third-party resources:** ConVars + `ready`.

---

## Related docs

| Doc | Content |
|-----|---------|
| [API.md](API.md) | Full ConVar table + export reference |
| [GUIDE.md](GUIDE.md) | Overview, troubleshooting |
| [examples/typescript/](examples/typescript/README.md) | TS consumer examples |
| [examples/lua/](examples/lua/README.md) | Lua consumer examples |
| [examples/config/README.md](examples/config/README.md) | Profile templates |
| [LOGGING.md](LOGGING.md) | Log levels, PII policy, filter redaction |
| [SECURITY.md](SECURITY.md) | Trust model, denylist, consumer checklist, abuse boundaries |
| [plans/PRE-STABLE-ROADMAP.md](plans/PRE-STABLE-ROADMAP.md) | Path to stable `v1.0.0` on `main` |

**Contributors:** integration tests — `yarn test:integration` with `TEST_MONGODB_URI` (see [tests/integration/README.md](../tests/integration/README.md)).

---

## Troubleshooting config

| Symptom | Check |
|---------|--------|
| Consumer hangs | `cfx-mongodb:ready` never fired — MongoDB down or bad URI |
| Wrong database | `mongodb_env` vs URL mismatch (`dev` URL but `prod` env) |
| Prod data on local | Explicit `set mongodb_env dev` + local URL |
| Secrets in git history | Rotate credentials; use `mongodb.local.cfg` + gitignore |
| `isConnected()` false after ready | Check server console for connect errors |

See [GUIDE.md#troubleshooting](GUIDE.md#troubleshooting).
