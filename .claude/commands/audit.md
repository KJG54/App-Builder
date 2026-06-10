# /audit

Run a full AI Software Factory audit and produce an improvement report and task plan.

## What This Does

Executes the `ai-software-factory-audit-v1.0` skill from `Vault/05-Prompts/Skills/Cross-Cutting/`.

Audits:
- Governance and operating rules (CLAUDE.md, WORKFLOW.md)
- Vault structure and metadata health
- Architecture and ADR consistency
- Automation scripts and validators
- Tests and test side effects
- Runtime/generated artifact boundaries
- Git hygiene and ignored tracked files
- MCP and tooling integration
- Documentation redundancy
- Missing capabilities

## Instructions

Load and follow: `Vault/05-Prompts/Skills/Cross-Cutting/ai-software-factory-audit-v1.0.md`

Default scope: whole-project audit.
Default: destructive changes forbidden. Safe fixes allowed.
Ask before deleting files, running `git rm`, changing architecture, or adding dependencies.

Produce the full audit report and task plan using the output template in the skill.
