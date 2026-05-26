#!/usr/bin/env bash
# Post-change scout — delegates to Node script (cross-platform).
set -euo pipefail
cd "$(dirname "$0")/.."
node scripts/scout.mjs
