# Wave 4 parallel worktrees — W4A (TS6) + W4B (contract/CI)
# Run from repo root on refactor/staged-hardening

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$base = "refactor/staged-hardening"

$agents = @(
  @{ Id = "W4A"; Branch = "refactor/w4a-typescript6"; Path = "../cfx-mongodb-w4a" },
  @{ Id = "W4B"; Branch = "refactor/w4b-contract-ci"; Path = "../cfx-mongodb-w4b" }
)

Push-Location $root
try {
  git fetch origin 2>$null
  foreach ($a in $agents) {
    $wt = Join-Path (Split-Path $root -Parent) ($a.Path -replace "^\.\./", "")
    if (Test-Path -LiteralPath $wt) {
      Write-Host "[$($a.Id)] worktree exists: $wt"
      continue
    }
    Write-Host "[$($a.Id)] creating $($a.Branch) at $wt"
    git worktree add -b $($a.Branch) $wt $base
  }
  Write-Host "`nWave 4 worktrees ready. See docs/refactor/README.md for /multitask prompts."
}
finally {
  Pop-Location
}
