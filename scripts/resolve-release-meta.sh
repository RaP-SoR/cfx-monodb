#!/usr/bin/env bash
# Resolve release channel, display version, zip label, and prerelease flag for CI.
# Writes key=value lines to GITHUB_OUTPUT when set, else prints to stdout.
#
# Env: GITHUB_REF, GITHUB_REF_TYPE, GITHUB_SHA, GITHUB_EVENT_NAME, GITHUB_RUN_NUMBER,
#      RELEASE_DISPATCH_CHANNEL (workflow_dispatch: dev|stable)

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BASE_VERSION="$(node -p "require('${ROOT}/package.json').version")"
SHORT_SHA="${GITHUB_SHA:0:7}"
BUILD_DATE="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

emit() {
  if [[ -n "${GITHUB_OUTPUT:-}" ]]; then
    echo "$1" >> "$GITHUB_OUTPUT"
  else
    echo "$1"
  fi
}

channel=""
display_version=""
zip_label=""
prerelease="false"
branch=""
release_notes_path=""

if [[ "${GITHUB_REF_TYPE:-}" == "tag" ]]; then
  tag="${GITHUB_REF#refs/tags/}"
  branch="tag:${tag}"

  if [[ "$tag" =~ ^v[0-9]+\.[0-9]+\.[0-9]+-dev(\.[0-9]+)?$ ]]; then
    channel="dev"
    display_version="${tag#v}"
    zip_label="$tag"
    prerelease="true"
    notes_file="${ROOT}/docs/releases/${tag}.md"
    if [[ -f "$notes_file" ]]; then
      release_notes_path="$notes_file"
    fi
  elif [[ "$tag" =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    git fetch origin main --depth=50 2>/dev/null || true
    if ! git merge-base --is-ancestor "$GITHUB_SHA" origin/main 2>/dev/null; then
      echo "error: stable tag ${tag} must point to a commit on origin/main." >&2
      echo "       Merge dev → main first, or use a dev tag like v${BASE_VERSION}-dev" >&2
      exit 1
    fi
    channel="stable"
    display_version="${tag#v}"
    zip_label="$tag"
    prerelease="false"
    notes_file="${ROOT}/docs/releases/${tag}.md"
    if [[ -f "$notes_file" ]]; then
      release_notes_path="$notes_file"
    fi
  else
    echo "error: unsupported tag '${tag}'." >&2
    echo "       Use vX.Y.Z (stable, main only) or vX.Y.Z-dev[.N] (dev pre-release)." >&2
    exit 1
  fi
elif [[ "${GITHUB_REF:-}" == "refs/heads/dev" ]]; then
  channel="dev"
  branch="dev"
  display_version="${BASE_VERSION}-dev+${SHORT_SHA}"
  zip_label="${BASE_VERSION}-dev-${SHORT_SHA}"
  prerelease="true"
elif [[ "${GITHUB_REF:-}" == "refs/heads/main" ]]; then
  channel="stable"
  branch="main"
  display_version="${BASE_VERSION}+${SHORT_SHA}"
  zip_label="${BASE_VERSION}-${SHORT_SHA}"
  prerelease="false"
elif [[ "${GITHUB_EVENT_NAME:-}" == "workflow_dispatch" ]]; then
  dispatch="${RELEASE_DISPATCH_CHANNEL:-dev}"
  run_no="${GITHUB_RUN_NUMBER:-0}"
  if [[ "$dispatch" == "stable" ]]; then
    channel="stable"
    branch="manual"
    display_version="${BASE_VERSION}+manual.${run_no}"
    zip_label="${BASE_VERSION}-manual-${run_no}"
    prerelease="false"
  else
    channel="dev"
    branch="manual"
    display_version="${BASE_VERSION}-dev+manual.${run_no}"
    zip_label="${BASE_VERSION}-dev-manual-${run_no}"
    prerelease="true"
  fi
else
  echo "error: release workflow triggered from unsupported ref: ${GITHUB_REF:-unknown}" >&2
  exit 1
fi

emit "channel=${channel}"
emit "display_version=${display_version}"
emit "zip_label=${zip_label}"
emit "prerelease=${prerelease}"
emit "branch=${branch}"
emit "release_notes_path=${release_notes_path}"
emit "build_date=${BUILD_DATE}"
