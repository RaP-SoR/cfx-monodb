#!/usr/bin/env bash
# Build a FiveM-ready resource zip (dist + fxmanifest + prod node_modules).
# Usage: ./scripts/pack-release.sh [version-label]
# Example: yarn build && ./scripts/pack-release.sh v1.0.1

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VERSION="${1:-dev}"
STAGING_ROOT="$ROOT/.release-staging"
STAGING="$STAGING_ROOT/cfx-mongodb"
OUT="$ROOT/cfx-mongodb-${VERSION}.zip"

cd "$ROOT"

if [[ ! -f dist/index.js ]]; then
  echo "error: dist/index.js missing — run yarn build first" >&2
  exit 1
fi

rm -rf "$STAGING_ROOT"
mkdir -p "$STAGING"

cp -r dist "$STAGING/"
cp fxmanifest.lua package.json "$STAGING/"

# Production deps only (mongodb driver — not bundled in dist)
rm -rf node_modules
yarn install --production --frozen-lockfile 2>/dev/null || yarn install --production
cp -r node_modules "$STAGING/"

cat > "$STAGING/INSTALL.txt" << 'EOF'
cfx-mongodb — pre-built release
================================

1. Extract this folder to your server's resources directory as cfx-mongodb
2. Configure ConVars (see docs/CONFIGURATION.md in the GitHub repo)
3. server.cfg: ensure cfx-mongodb (before consumer resources)
4. Wait for event cfx-mongodb:ready before CRUD from other resources

No yarn build required — dist/ and node_modules/mongodb are included.
EOF

cd "$STAGING_ROOT"
rm -f "$OUT"
zip -r "$OUT" cfx-mongodb
echo "Created $OUT"
