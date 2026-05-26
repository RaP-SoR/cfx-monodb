#!/usr/bin/env bash
# Creates 5 git worktrees for Wave 1 parallel agents (Linux/macOS).
# Run from repo root: ./scripts/setup-worktrees-wave1.sh

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WORKTREE_ROOT="$(dirname "$REPO_ROOT")/worktrees/cfx-mongodb"
BASE_BRANCH="refactor/staged-hardening"

declare -a AGENTS=(
  "w1a:refactor/w1a-security"
  "w1b:refactor/w1b-logging"
  "w1c:refactor/w1c-cleanup"
  "w2a:refactor/w2a-manifest"
  "w2b:refactor/w2b-types"
)

echo "Repo:           $REPO_ROOT"
echo "Worktree root:  $WORKTREE_ROOT"
echo "Base branch:    $BASE_BRANCH"
echo

cd "$REPO_ROOT"
git fetch origin "$BASE_BRANCH" 2>/dev/null || true

mkdir -p "$WORKTREE_ROOT"

for entry in "${AGENTS[@]}"; do
  subdir="${entry%%:*}"
  branch="${entry#*:}"
  path="$WORKTREE_ROOT/$subdir"

  if [[ -d "$path" ]]; then
    echo "[SKIP] $subdir — path exists: $path"
    continue
  fi

  echo "[ADD]  $subdir — $branch -> $path"
  if git show-ref --verify --quiet "refs/heads/$branch"; then
    git worktree add "$path" "$branch"
  else
    git worktree add "$path" "$BASE_BRANCH" -b "$branch"
  fi
done

echo
git worktree list
echo
echo "Open each worktree in a separate Cursor window. See docs/refactor/WAVE-1-SPEC.md"
