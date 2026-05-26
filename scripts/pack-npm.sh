#!/usr/bin/env bash
# Pack a types-only npm tarball for consumer resources (CTFFramework, etc.).
# Not published to npmjs.org — attached to GitHub Releases / Actions artifacts.
#
# Usage (CI):
#   RELEASE_VERSION=1.0.0-dev \
#   RELEASE_CHANNEL=dev \
#   ./scripts/pack-npm.sh v1.0.0-dev
#
# The FiveM server deploy ZIP is scripts/pack-release.sh — this package is optional.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ZIP_LABEL="${1:-local-dev}"
STAGING="$ROOT/.npm-pack-staging"
OUT="$ROOT/cfx-mongodb-${ZIP_LABEL}.tgz"

RELEASE_VERSION="${RELEASE_VERSION:-$(node -p "require('${ROOT}/package.json').version")}"
RELEASE_CHANNEL="${RELEASE_CHANNEL:-dev}"
RELEASE_BRANCH="${RELEASE_BRANCH:-local}"
RELEASE_COMMIT="${RELEASE_COMMIT:-local}"
RELEASE_BUILD_DATE="${RELEASE_BUILD_DATE:-$(date -u +%Y-%m-%dT%H:%M:%SZ)}"

cd "$ROOT"

rm -rf "$STAGING"
mkdir -p "$STAGING/src"
cp -r src/types "$STAGING/src/types"

node << EOF
const fs = require('fs');
const base = JSON.parse(fs.readFileSync('${ROOT}/package.json', 'utf8'));
const npmPkg = {
  name: base.name,
  version: '${RELEASE_VERSION}',
  description:
    'TypeScript types for cfx-mongodb FiveM exports (runtime is the FiveM resource ZIP)',
  repository: base.repository,
  license: base.license,
  author: base.author,
  engines: base.engines,
  files: ['src/types', 'README.md', 'BUILD_INFO.txt'],
  exports: {
    './types': './src/types/api.ts',
    './types/options': './src/types/options.ts',
    './types/*': './src/types/*',
  },
};
fs.writeFileSync('${STAGING}/package.json', JSON.stringify(npmPkg, null, 2) + '\n');
EOF

STABILITY_LINE="Channel: ${RELEASE_CHANNEL}"
if [[ "$RELEASE_CHANNEL" == "dev" ]]; then
  STABILITY_LINE="${STABILITY_LINE} (UNSTABLE — not for production)"
else
  STABILITY_LINE="${STABILITY_LINE} (stable)"
fi

cat > "$STAGING/BUILD_INFO.txt" << EOF
cfx-mongodb npm types package
=============================
Version:  ${RELEASE_VERSION}
${STABILITY_LINE}
Branch:   ${RELEASE_BRANCH}
Commit:   ${RELEASE_COMMIT}
Built:    ${RELEASE_BUILD_DATE}
Repo:     https://github.com/RaP-SoR/cfx-mongodb

This tarball is for TypeScript types only.
Deploy the matching cfx-mongodb-*.zip on your FiveM server.
EOF

cat > "$STAGING/README.md" << EOF
# cfx-mongodb — npm types package

This \`.tgz\` is **optional** and **not** the FiveM server resource.
It ships TypeScript types (\`CfxMongoResult\`, \`CFX_MONGODB_EXPORTS\`, …) for consumer resources.

## Server (FiveM)

Use \`cfx-mongodb-*.zip\` from the same GitHub Release or Actions artifact.

## TypeScript consumer resource

\`\`\`bash
# From a GitHub Release (replace tag + filename):
npm install https://github.com/RaP-SoR/cfx-mongodb/releases/download/v1.0.0-dev/cfx-mongodb-v1.0.0-dev.tgz

# Or yarn:
yarn add cfx-mongodb@https://github.com/RaP-SoR/cfx-mongodb/releases/download/v1.0.0-dev/cfx-mongodb-v1.0.0-dev.tgz
\`\`\`

\`\`\`typescript
import type { CfxMongoInsertResult, CfxMongoResult } from "cfx-mongodb/types";
\`\`\`

**Channel:** ${RELEASE_CHANNEL} · **Version:** ${RELEASE_VERSION}

Not published to npmjs.org — install from GitHub Release URLs only.
EOF

cd "$STAGING"
npm pack --pack-destination "$ROOT" --silent
generated="$(ls -1t "$ROOT"/cfx-mongodb-*.tgz | head -1)"
mv "$generated" "$OUT"
echo "Created $OUT (npm types, ${RELEASE_CHANNEL}, version ${RELEASE_VERSION})"
