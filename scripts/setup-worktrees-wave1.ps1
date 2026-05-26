# Creates 5 git worktrees for Wave 1 parallel agents (Windows).
# Run from repo root: .\scripts\setup-worktrees-wave1.ps1
#
# Worktrees are created next to the repo:
#   ../worktrees/cfx-mongodb/w1a .. w2b

$ErrorActionPreference = "Stop"

$RepoRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$WorktreeRoot = Join-Path (Split-Path -Parent $RepoRoot) "worktrees\cfx-mongodb"
$BaseBranch = "refactor/staged-hardening"

$Agents = @(
    @{ Id = "w1a"; Branch = "refactor/w1a-security"; Subdir = "w1a" },
    @{ Id = "w1b"; Branch = "refactor/w1b-logging"; Subdir = "w1b" },
    @{ Id = "w1c"; Branch = "refactor/w1c-cleanup"; Subdir = "w1c" },
    @{ Id = "w2a"; Branch = "refactor/w2a-manifest"; Subdir = "w2a" },
    @{ Id = "w2b"; Branch = "refactor/w2b-types"; Subdir = "w2b" }
)

Write-Host "Repo:           $RepoRoot"
Write-Host "Worktree root:  $WorktreeRoot"
Write-Host "Base branch:    $BaseBranch"
Write-Host ""

Push-Location -LiteralPath $RepoRoot
try {
    $currentBranch = git branch --show-current
    $prevEap = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    git fetch origin $BaseBranch 2>&1 | Out-Null
    $ErrorActionPreference = $prevEap
    git show-ref --verify --quiet "refs/heads/$BaseBranch"
    if ($LASTEXITCODE -ne 0) {
        git branch $BaseBranch "origin/$BaseBranch" 2>$null
        if ($LASTEXITCODE -ne 0) {
            Write-Warning "Branch $BaseBranch not found on origin. Using current branch: $currentBranch"
            $BaseBranch = $currentBranch
        }
    }

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
    Write-Host "Worktrees:"
    git -C $RepoRoot worktree list

    Write-Host ""
    Write-Host "Next steps:"
    Write-Host "  1. Open each folder in a separate Cursor window"
    Write-Host "  2. Load docs/refactor/WAVE-1-SPEC.md in orchestrator tab"
    Write-Host "  3. Paste agent briefing from spec into each implementer tab"
    Write-Host ""
    Write-Host "Agent paths:"
    foreach ($agent in $Agents) {
        $path = Join-Path $WorktreeRoot $agent.Subdir
        Write-Host "  $($agent.Id.ToUpper()) ($($agent.Branch)): $path"
    }
}
finally {
    Pop-Location
}
