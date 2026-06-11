# /simplify

Answer one question: what can be removed or simplified while preserving the core value of the project?

## What This Does

Executes the `simplification-audit-v1.0` skill from `Vault/05-Prompts/Skills/Cross-Cutting/`.

Applies the core question to every major asset category:

> "If this project needed to be reduced by 50% while preserving 95% of its value, what would be removed first?"

Audits:
- Scripts, skills, validators, commands — which are invoked regularly vs. rarely/never?
- Beta skills that haven't earned Active status — do they justify maintenance burden?
- MCP servers — which are actually used in this project?
- Memory entries — are old project-state entries still load-bearing?
- Vault documents — are there docs no one reads or updates?
- Over-engineering: abstractions with one implementation, configs always set to the same value

Produces a classified list: zero-effort removals, low-effort simplifications, approval-required consolidations.

## Instructions

Load and follow: `Vault/05-Prompts/Skills/Cross-Cutting/simplification-audit-v1.0.md`

This skill works **within** existing ADRs and architecture — it does not question foundational decisions. For a full "Day 0" architectural reconsideration, use `Vault/Templates/Strategic-Review-Prompt.md` instead.

Default: recommendations only. No deletions or merges without explicit approval.

## Related

- `Vault/05-Prompts/Skills/Cross-Cutting/simplification-audit-v1.0.md` — Full skill definition
- `Vault/Templates/Strategic-Review-Prompt.md` — Annual "Day 0" strategic review (not a skill)
- `/curator` — For relationship mapping and dead asset detection
