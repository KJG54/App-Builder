# /plan-project

Generate a phased implementation plan from a completed Project Specification before any building begins.

## What This Does

Executes the `phase-plan-generator-v1.0` skill from `Vault/05-Prompts/Skills/Cross-Cutting/`.

Takes a completed discovery spec (from `/discover`) and produces:
- A sequenced list of implementation phases
- Per-phase deliverables, dependencies, test plans, and effort estimates
- A cumulative cost estimate against the budget ceiling
- A mandatory human approval gate before any build begins

## Instructions

Load and follow: `Vault/05-Prompts/Skills/Cross-Cutting/phase-plan-generator-v1.0.md`

Default: locate the Project Specification in `Vault/09-Requirements/` or ask the user where it is. Read the full spec before generating any phases.

Do NOT begin implementation. The only output of this command is the phase plan document and a request for approval.

## Related

- `/discover` — Run this first to produce the spec this command consumes
- `Vault/05-Prompts/Skills/Cross-Cutting/phase-plan-generator-v1.0.md` — Full skill definition
- `Projects/[category]/[name]/Vault/03-Projects/[name]/Phase-Plan.md` — Where the plan is saved
