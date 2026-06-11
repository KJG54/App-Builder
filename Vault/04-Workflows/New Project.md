---
type: Workflow
phase: 1
status: Active
authority: facts
chroma_collection: global-standards
tags: [workflow, project-creation, planning]
related: [Architect.md, 03-Projects README, Documentation Standards]
last_updated: 2026-06-11
---

# Workflow — New Project

## Trigger

Run `/discover` in Claude Code to begin the interview flow.

## Steps

1. Run `/discover` — Claude interviews you about goals, tech, and constraints. Spec saved to `Vault/09-Requirements/[Project Name]/`.
2. Run `/plan-project` — Generates a phased implementation plan from the spec.
3. Run `npm run scaffold` — Creates a scaffolded project folder in `Projects/` (gitignored). Each project gets its own git repo.
4. Work on the project using agents, skills, and Chroma context.
5. Run `npm run build` / `npm run ship` — Build and ship pipeline.
6. Run `/remember` after initial setup to create the first session summary.

## Related

- [[CLAUDE.md Strategy]]
- [[Architecture Versioning]]
