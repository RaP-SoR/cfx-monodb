# Release notes

GitHub Release bodies are loaded from this folder when a matching file exists:

| Tag | File |
|-----|------|
| `v1.0.0-dev` | [v1.0.0-dev.md](v1.0.0-dev.md) |
| `v1.0.1-dev` | [v1.0.1-dev.md](v1.0.1-dev.md) |
| `v1.0.0` | [v1.0.0.md](v1.0.0.md) (create when merging to main) |
| `v1.0.1` | [v1.0.1.md](v1.0.1.md) (stable, after merge to main) |

## Channels

| Channel | Source | Tag pattern | Manifest version | GitHub Release | Assets |
|---------|--------|-------------|------------------|----------------|--------|
| **dev** (unstable) | `dev` branch | `vX.Y.Z-dev[.N]` | `X.Y.Z-dev+<sha>` | Pre-release | ZIP + npm `.tgz` |
| **stable** | `main` branch | `vX.Y.Z` | `X.Y.Z` | Latest / stable | ZIP + npm `.tgz` |

Push to `dev` or **`main`** → Actions artifact (ZIP + `.tgz`), no GitHub Release unless tagged.  
Tag on `dev` → pre-release with notes from `docs/releases/vX.Y.Z-dev.md`.  
Merge to `main` + tag `vX.Y.Z` → stable release.

### npm types package (optional)

Each release/artifact includes `cfx-mongodb-<label>.tgz` — TypeScript types only (`cfx-mongodb/types`).  
**Not** on npmjs.org; install from the GitHub Release download URL. See [CONFIGURATION.md](../CONFIGURATION.md).
