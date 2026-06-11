---
type: architecture
status: complete
phase: 18
last_updated: 2026-06-10
author: Claude-Builder-Agent
tags: [phase-18, build-pipeline, scaffold, ship, getting-started, cross-project]
related: [Roadmap.md, Architecture/Current.md, ../05-Prompts/Skills/Cross-Cutting/phase-plan-generator-v1.0.md]
---

# Phase 18: Project Build Pipeline

**Status:** ✅ Complete (2026-06-10)

---

## Goal

Complete end-to-end project lifecycle: interview → research → recommend → build → review → ship. Make the framework usable as a turnkey tool for new projects.

---

## Deliverables

**Core pipeline scripts:**
- `scaffold-project.js` — Generates project directory structure from tech-stack recommendations. Creates `src/`, `tests/`, `docs/`, config files. Respects framework selection (web/api/desktop/game).
- `build-runner.js` — Orchestrates multi-agent build from plan file. Dispatches tasks to architect, backend, frontend, devops agents in dependency order. Validates each subtask output before proceeding.
- `ship-project.js` — Final deployment preparation. Generates deployment config, runs build, creates release bundle. Supports Docker and native deployment targets.

**Cross-project Chroma indexing:**
- `npm run ingest:project` — Indexes any target project's docs/code into a project-specific Chroma collection alongside the AI Software Factory collection
- Enables context assembly from both framework knowledge and project-specific history

**Phase Plan Generator skill:**
- `/plan-project` command — Runs project discovery interview, generates a structured phase plan in Vault format
- Skill file: `Vault/05-Prompts/Skills/Cross-Cutting/phase-plan-generator-v1.0.md`
- Status: ✅ Active

**Documentation:**
- `GETTING-STARTED.md` — 8-section guide covering setup, first run, framework walkthrough, mental model, troubleshooting. Published 2026-06-10.

---

## Bug Fixes (post-delivery)

7 bugs found in code review and fixed in `ship-project.js`:
1. Shell injection via unescaped project name in exec call
2. Windows path separator compatibility
3. Regex corruption from unescaped special characters
4. Silent JSON parse failure on malformed config
5. Duplicate diff entries in release bundle
6. Slug injection via unsanitized input
7. Uncaught async error in deployment config writer

---

## Validation

Full pipeline verified: discovery interview → plan generation → scaffold → build → ship.

`npm run test:all` — all suites pass after bug fixes.

---

## Related

- [[Roadmap.md]] — 18-phase roadmap; Phase 18 is the final milestone
- [[../05-Prompts/Skills/Cross-Cutting/phase-plan-generator-v1.0.md]] — Plan generator skill
- [[Architecture/Current.md]] — Updated to reflect pipeline additions
