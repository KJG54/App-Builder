# /guardian

Run a Project Guardian health check — continuous quality monitoring, duplication detection, technical debt tracking, and improvement recommendations.

## What This Does

Executes the `project-guardian-v1.0` skill from `Vault/05-Prompts/Skills/Cross-Cutting/`.

Audits:
- Governance alignment (CLAUDE.md, WORKFLOW.md vs. actual behavior)
- Architecture consistency and competing implementations
- Code: dead code, duplication, complexity, security
- Agents: overlapping roles, contradictory instructions
- Tools: unused, missing, or better external alternatives
- Documentation: missing, stale, or contradictory docs
- Testing: coverage gaps, test side effects on Vault files
- Dependencies: unused, outdated, insecure packages
- Knowledge: undocumented decisions, orphaned Vault files
- Git hygiene: tracked-but-ignored files, stale branches

Produces a health report saved to `Vault/Logs/guardian-report-{date}.md` with severity-grouped findings, an improvement backlog, and trend notes comparing to prior reports.

## Instructions

Load and follow: `Vault/05-Prompts/Skills/Cross-Cutting/project-guardian-v1.0.md`

Default scope: whole-project audit.
Default: destructive changes forbidden. Safe fixes (metadata, `.gitignore`, cleanup plans) allowed.
Ask before deleting files, running `git rm`, adding dependencies, or changing governance.

## Difference from `/audit`

- `/audit` — comprehensive one-time deep scan with a task plan
- `/guardian` — continuous health monitoring with trend tracking and improvement backlog

Use `/audit` for a thorough first-pass. Use `/guardian` regularly to track whether the project is getting healthier.

## Related

- `Vault/05-Prompts/Project-Guardian.md` — Full agent prompt
- `Vault/Logs/` — Where health reports are saved
- `Vault/10-Known-Problems/` — Where recurring issues are tracked
- `/audit` — One-time deep scan companion
