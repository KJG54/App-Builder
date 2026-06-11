# /efficiency

Identify and reduce waste in the Claude Code session runtime — tokens, context, MCP cost, and directory scope.

## What This Does

Executes the `runtime-efficiency-engineer-v1.0` skill from `Vault/05-Prompts/Skills/Cross-Cutting/`.

Analyzes:
- Always-loaded context files (size, necessity, duplication)
- Token waste in prompt and skill text
- MCP servers loading at session start that aren't used in this project
- Chroma retrieval efficiency (Top-K, result size)
- Claude Code directory scope (files scanned unnecessarily)
- Memory system bloat (stale or duplicate entries)
- npm dependency weight

Produces an efficiency report with quick wins and approval-required changes.

## Instructions

Load and follow: `Vault/05-Prompts/Skills/Cross-Cutting/runtime-efficiency-engineer-v1.0.md`

Default: recommendations only. No changes to settings, MCP config, or ignore rules without explicit approval.

Use real measurements (file sizes, `outputs.json` cost data) rather than estimates where data exists.

## Difference from `/curator`

- `/curator` — structural issues: dead files, redundant assets, documentation drift
- `/efficiency` — runtime cost: what's loading every session that doesn't need to be

## Related

- `Vault/05-Prompts/Skills/Cross-Cutting/runtime-efficiency-engineer-v1.0.md` — Full skill definition
- `Vault/03-Projects/AI Software Factory/Repository-Constitution.md` — MCP and context standards
- `Vault/Logs/` — Where efficiency reports are saved
