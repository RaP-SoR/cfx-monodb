#!/usr/bin/env bash
# Local quality gate — delegates to package.json (cross-platform).
set -euo pipefail
cd "$(dirname "$0")/.."
yarn gate
