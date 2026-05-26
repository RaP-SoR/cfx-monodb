# MongoDB profile templates (ConVars)

Copy to your **FiveM server root** (txData), rename, and `exec` from `server.cfg`.

| Template | Purpose |
|----------|---------|
| [mongodb.dev.cfg.example](mongodb.dev.cfg.example) | Local development |
| [mongodb.prod.cfg.example](mongodb.prod.cfg.example) | Production skeleton |
| [mongodb.local.cfg.example](mongodb.local.cfg.example) | Personal machine — **copy to `mongodb.local.cfg`** |

## Usage

```cfg
# server.cfg
exec mongodb.local.cfg
ensure cfx-mongodb
```

## Gitignore (server repo)

```gitignore
mongodb.local.cfg
*.local.cfg
```

**Never commit** files containing real passwords or Atlas URIs.

Full guide: [../CONFIGURATION.md](../CONFIGURATION.md)
