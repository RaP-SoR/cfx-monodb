#!/usr/bin/env bash
# Build a FiveM-ready resource zip (dist + fxmanifest + prod node_modules).
#
# Usage (CI):
#   RELEASE_VERSION=1.0.0-dev+abc1234 \
#   RELEASE_CHANNEL=dev \
#   RELEASE_BRANCH=dev \
#   RELEASE_COMMIT=abc1234 \
#   RELEASE_BUILD_DATE=2026-05-26T12:00:00Z \
#   ./scripts/pack-release.sh cfx-mongodb-1.0.0-dev-abc1234
#
# Usage (local smoke test):
#   yarn build && ./scripts/pack-release.sh local-dev

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ZIP_LABEL="${1:-local-dev}"
STAGING_ROOT="$ROOT/.release-staging"
STAGING="$STAGING_ROOT/cfx-mongodb"
OUT="$ROOT/cfx-mongodb-${ZIP_LABEL}.zip"

RELEASE_VERSION="${RELEASE_VERSION:-$(node -p "require('${ROOT}/package.json').version")}"
RELEASE_CHANNEL="${RELEASE_CHANNEL:-dev}"
RELEASE_BRANCH="${RELEASE_BRANCH:-local}"
RELEASE_COMMIT="${RELEASE_COMMIT:-local}"
RELEASE_BUILD_DATE="${RELEASE_BUILD_DATE:-$(date -u +%Y-%m-%dT%H:%M:%SZ)}"

cd "$ROOT"

if [[ ! -f dist/index.js ]]; then
  echo "error: dist/index.js missing — run yarn build first" >&2
  exit 1
fi

rm -rf "$STAGING_ROOT"
mkdir -p "$STAGING"

cp -r dist "$STAGING/"
cp fxmanifest.lua package.json "$STAGING/"

# Stamp version + channel into the shipped resource
sed -i "s/^version '.*'/version '${RELEASE_VERSION}'/" "$STAGING/fxmanifest.lua"
node -e "
  const fs = require('fs');
  const p = '${STAGING}/package.json';
  const pkg = JSON.parse(fs.readFileSync(p, 'utf8'));
  pkg.version = '${RELEASE_VERSION}';
  fs.writeFileSync(p, JSON.stringify(pkg, null, 2) + '\n');
"

# Production deps only (mongodb driver — not bundled in dist)
rm -rf node_modules
yarn install --production --frozen-lockfile 2>/dev/null || yarn install --production
cp -r node_modules "$STAGING/"

STABILITY_LINE="Channel: ${RELEASE_CHANNEL}"
if [[ "$RELEASE_CHANNEL" == "dev" ]]; then
  STABILITY_LINE="${STABILITY_LINE} (UNSTABLE — not for production)"
else
  STABILITY_LINE="${STABILITY_LINE} (stable)"
fi

cat > "$STAGING/BUILD_INFO.txt" << EOF
cfx-mongodb — build metadata
=============================
Version:  ${RELEASE_VERSION}
${STABILITY_LINE}
Branch:   ${RELEASE_BRANCH}
Commit:   ${RELEASE_COMMIT}
Built:    ${RELEASE_BUILD_DATE}
Repo:     https://github.com/RaP-SoR/cfx-mongodb

Stable releases: tag vX.Y.Z on main after merging dev.
Dev pre-releases: dev branch artifacts or tags vX.Y.Z-dev on dev.
EOF

if [[ "$RELEASE_CHANNEL" == "dev" ]]; then
  cat > "$STAGING/INSTALL.txt" << 'EOF'
cfx-mongodb — DEV pre-built release (unstable)
==============================================

WARNING: This build comes from the dev branch or a vX.Y.Z-dev tag.
         Do not use on production servers until a stable vX.Y.Z release
         is published from main.

1. Extract this folder to your server's resources directory as cfx-mongodb
2. Configure ConVars (see docs/CONFIGURATION.md in the GitHub repo)
3. server.cfg: ensure cfx-mongodb (before consumer resources)
4. Wait for event cfx-mongodb:ready before CRUD from other resources
5. Check BUILD_INFO.txt for branch, commit, and channel

No yarn build required — dist/ and node_modules/mongodb are included.

Verify version at runtime:
  exports["cfx-mongodb"]:getVersion()  -- expect a -dev suffix on dev builds
EOF
else
  cat > "$STAGING/INSTALL.txt" << 'EOF'
cfx-mongodb — stable pre-built release
======================================

1. Extract this folder to your server's resources directory as cfx-mongodb
2. Configure ConVars (see docs/CONFIGURATION.md in the GitHub repo)
3. server.cfg: ensure cfx-mongodb (before consumer resources)
4. Wait for event cfx-mongodb:ready before CRUD from other resources
5. Check BUILD_INFO.txt for commit and build date

No yarn build required — dist/ and node_modules/mongodb are included.
EOF
fi

cd "$STAGING_ROOT"
rm -f "$OUT"
zip -r "$OUT" cfx-mongodb
echo "Created $OUT (${RELEASE_CHANNEL}, version ${RELEASE_VERSION})"
