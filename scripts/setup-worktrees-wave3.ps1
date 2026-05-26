# Creates git worktrees for Wave 3 handler parallel agents (Windows).
# Run AFTER W3A and W3B are merged into refactor/staged-hardening.
# Usage: .\scripts\setup-worktrees-wave3.ps1

$ErrorActionPreference = "Stop"

$RepoRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$WorktreeRoot = Join-Path (Split-Path -Parent $RepoRoot) "worktrees\cfx-mongodb"
$BaseBranch = "refactor/staged-hardening"

$Agents = @(
    @{ Id = "w3c1"; Branch = "refactor/w3c1-handlers-read"; Subdir = "w3c1" },
    @{ Id = "w3c2"; Branch = "refactor/w3c2-handlers-write"; Subdir = "w3c2" },
    @{ Id = "w3c3"; Branch = "refactor/w3c3-handlers-ops"; Subdir = "w3c3" }
)

Write-Host "Repo:           $RepoRoot"
Write-Host "Worktree root:  $WorktreeRoot"
Write-Host "Base branch:    $BaseBranch"
Write-Host ""

Push-Location -LiteralPath $RepoRoot
try {
    $prevEap = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    git fetch origin $BaseBranch 2>&1 | Out-Null
    $ErrorActionPreference = $prevEap

    if (-not (Test-Path -LiteralPath $WorktreeRoot)) {
        New-Item -ItemType Directory -Path $WorktreeRoot -Force | Out-Null
    }

    foreach ($agent in $Agents) {
        $path = Join-Path $WorktreeRoot $agent.Subdir
        $branch = $agent.Branch

        if (Test-Path -LiteralPath $path) {
            Write-Host "[SKIP] $($agent.Id) - path exists: $path"
            continue
        }

        Write-Host "[ADD]  $($agent.Id) - $branch -> $path"
        git -C $RepoRoot worktree add $path $BaseBranch -b $branch
        if ($LASTEXITCODE -ne 0) {
            git -C $RepoRoot worktree add $path $branch
        }
    }

    Write-Host ""
    git -C $RepoRoot worktree list
}
finally {
    Pop-Location
}
