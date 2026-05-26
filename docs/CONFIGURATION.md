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

CI builds a **ready-to-use ZIP** (`dist/` + `fxmanifest.lua` + `node_modules/mongodb`). No `yarn build` on the server.

### Where to download

| Trigger | Where |
|---------|--------|
| **Tag** `v*` (e.g. `v1.0.1`) | [GitHub Releases](https://github.com/RaP-SoR/cfx-mongodb/releases) |
| **Push to `dev`** | Actions → latest **Release** workflow → Artifact `cfx-mongodb-dev-{sha}` |
| **Manual** | Actions → **Release** → **Run workflow** → Artifact |

### Steps

1. Download `cfx-mongodb-*.zip` from Releases or Actions artifacts  
2. Extract into `resources/cfx-mongodb` (folder name must match)  
3. Configure ConVars (`exec mongodb.local.cfg` or inline in `server.cfg`)  
4. `ensure cfx-mongodb` before consumer resources  

### Version tags (maintainers)

```bash
# After changes on dev, when a build should be downloadable as a named version:
git tag v1.0.2
git push origin v1.0.2
```

CI runs tests, builds, packs the ZIP, and publishes a **GitHub Release** automatically.

### Check for updates (automation idea)

Compare local `fxmanifest` / `GetResourceMetadata` version with latest tag:

- GitHub API: `GET /repos/RaP-SoR/cfx-mongodb/releases/latest`  
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
| [examples/typescript.md](examples/typescript.md) | TS consumer patterns |
| [examples/lua.md](examples/lua.md) | Lua consumer patterns |
| [examples/config/README.md](examples/config/README.md) | Profile templates |

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
