# Staged Refactor — Multi-Agent Playbook

Orchestrated hardening and architecture refactor on branch `refactor/staged-hardening`.

## Documents

| File | Purpose |
|------|---------|
| [REFACTOR-STATUS.md](REFACTOR-STATUS.md) | Living board — wave/agent/branch/PR status |
| [WAVE-1-SPEC.md](WAVE-1-SPEC.md) | Wave 1: security, logging, cleanup (5 parallel agents) |
| [INTERFACES.md](INTERFACES.md) | Shared types for Wave 2–3 (read-only until merged) |

## Quick start (maintainer)

```powershell
# From repo root — creates 5 worktrees under ../worktrees/cfx-mongodb/
.\scripts\setup-worktrees-wave1.ps1
```

Open each worktree in a **separate Cursor window**. Assign one agent per worktree using the briefing template in [WAVE-1-SPEC.md](WAVE-1-SPEC.md).

## Orchestrator skill

Load `.cursor/skills/refactor-orchestrator/SKILL.md` in the orchestrator tab (no code edits — merge train only).

## Merge train

Target branch for all wave PRs: **`refactor/staged-hardening`**

After all waves complete → single PR `refactor/staged-hardening` → `dev`.
