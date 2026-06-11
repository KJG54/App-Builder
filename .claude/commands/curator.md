# /curator

Find and resolve redundant, dead, misplaced, and contradictory assets in the repository.

## What This Does

Executes the `repository-curator-v1.0` skill from `Vault/05-Prompts/Skills/Cross-Cutting/`.

Curates:
- Dead files, orphaned scripts, unused skills and agents
- Redundant implementations and duplicate documentation
- Misplaced files that violate storage rules
- Contradictory documentation
- Architectural drift from ADRs

Produces a findings report with a consolidation roadmap in `Vault/Logs/`.

## Modes

- **Incremental** (default) — phases 3-5 only, scoped to recently changed files. Fast.
- **Full** — all 9 phases including relationship mapping, structural review, and health scoring. Use quarterly.

To run full mode: `/curator full`

## Instructions

Load and follow: `Vault/05-Prompts/Skills/Cross-Cutting/repository-curator-v1.0.md`

**Always read `Vault/03-Projects/AI Software Factory/Repository-Constitution.md` and `Vault/07-Decisions/DECISIONS.md` before making any recommendations.** Never recommend removing an asset that was deliberately kept per an ADR without flagging the conflict.

Default: destructive changes forbidden. Safe actions (reading, drafting, reporting) are allowed. Deleting or moving files requires explicit approval.

## Difference from `/audit`

- `/audit` — comprehensive one-time health snapshot with a task plan
- `/curator` — ongoing hygiene maintenance focused on dead/redundant asset consolidation

Use `/audit` for a thorough first-pass health check. Use `/curator` regularly to keep the repository lean.

## Related

- `Vault/05-Prompts/Skills/Cross-Cutting/repository-curator-v1.0.md` — Full skill definition
- `Vault/03-Projects/AI Software Factory/Repository-Constitution.md` — Project standards
- `Vault/Logs/` — Where curator reports are saved
