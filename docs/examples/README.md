# Examples

Copy-paste starters for consuming resources (not part of the `cfx-mongodb` build).

| File | Description |
|------|-------------|
| [typescript.md](typescript.md) | TypeScript usage guide |
| [lua.md](lua.md) | Lua usage guide |
| [server.ts](server.ts) | Minimal TS consumer resource |
| [server.lua](server.lua) | Minimal Lua consumer resource |
| [fxmanifest-ts-example.lua](fxmanifest-ts-example.lua) | Manifest for TS consumer |
| [fxmanifest-lua-example.lua](fxmanifest-lua-example.lua) | Manifest for Lua consumer |

Ensure `cfx-mongodb` starts first in `server.cfg` and listen for `cfx-mongodb:ready`.
