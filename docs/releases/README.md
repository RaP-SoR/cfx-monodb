# Release notes

GitHub Release bodies are loaded from this folder when a matching file exists:

| Tag | File |
|-----|------|
| `v1.0.0-dev` | [v1.0.0-dev.md](v1.0.0-dev.md) |
| `v1.0.0` | [v1.0.0.md](v1.0.0.md) (create when merging to main) |

## Channels

| Channel | Source | Tag pattern | Manifest version | GitHub Release |
|---------|--------|-------------|------------------|----------------|
| **dev** (unstable) | `dev` branch | `vX.Y.Z-dev[.N]` | `X.Y.Z-dev+<sha>` | Pre-release |
| **stable** | `main` branch | `vX.Y.Z` | `X.Y.Z` | Latest / stable |

Push to `dev` → Actions artifact only (no GitHub Release).  
Tag on `dev` → pre-release with notes from `docs/releases/vX.Y.Z-dev.md`.  
Merge to `main` + tag `vX.Y.Z` → stable release.
