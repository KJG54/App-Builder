---
type: Skill
name: "ai-software-factory-audit"
version: "1.0"
phase: 17
status: Active
last_updated: 2026-06-10
authority: facts
chroma_collection: ai-software-factory-skills
tags: [skill, audit, repository-hygiene, health-check, missing-capability, cross-cutting]
related: [CLAUDE.md, WORKFLOW.md, AI-Software-Factory-Audit-Agent.md, Vault/03-Projects/AI Software Factory/Architecture/Current.md]
created_date: 2026-06-10
created_by: Codex
validation_status: Draft
maintenance_owner: Human
next_review_date: 2026-09-10
---

# Skill: AI Software Factory Audit v1.0

**Skill ID:** ai-software-factory-audit-v1.0  
**Domain:** Cross-Cutting  
**Status:** Active  
**Complexity:** Medium

---

## Problem Statement

Use this skill when the project needs a repeatable audit of the AI Software Factory system, including repository hygiene, Vault health, governance alignment, validator/test reliability, generated artifact boundaries, missing capabilities, and improvement planning.

This skill should produce a report and task plan. It may perform safe automatic fixes when explicitly allowed by the user or by the task scope.

---

## Trigger Examples

Use this skill for requests like:

- "Audit the AI Software Factory project and recommend improvements."
- "Check whether this repo is healthy."
- "Create a cleanup plan for the AI Software Factory."
- "Review the Vault, scripts, tests, and generated artifacts."
- "Find drift between CLAUDE.md, validators, and actual project structure."
- "Run a whole-system project health check."
- "Audit one section of the AI Software Factory."

---

## Required Inputs

Before starting, identify:

- Audit scope: whole project or specific section.
- Whether safe fixes are allowed.
- Whether destructive changes are forbidden. Default: forbidden.
- Whether external research is allowed for missing capability review.

If the user does not specify scope, default to whole-project audit.

---

## Core Project Map

Treat these as fundamental to project operation:

- `CLAUDE.md` - governance and agent operating rules.
- `WORKFLOW.md` - git and execution workflow.
- `package.json` - test commands.
- `.gitignore` - source/runtime boundary.
- `.mcp.json` - MCP inventory.
- `docker-compose.yml` and `docker/` - local infrastructure.
- `.claude/scripts/` - validators, tests, orchestration, and automation.
- `Vault/` - source of truth.
- `Vault/INDEX.md` and `Vault/STATUS.md` - navigation and state.
- `Vault/01-Standards/` - standards.
- `Vault/03-Projects/AI Software Factory/Architecture/Current.md` - current architecture.
- `Vault/03-Projects/AI Software Factory/` - roadmap, phases, cleanup plans.
- `Vault/05-Prompts/` - prompts and skills.
- `Vault/07-Decisions/` - ADRs.
- `Vault/08-Retrospectives/` - session history.
- `Vault/09-Requirements/` - requirements.
- `Vault/10-Known-Problems/` - recurring problems.
- `Vault/Templates/` - document templates.

---

## Missing Capability Rule

Before recommending custom implementation for a missing capability:

1. Name the exact missing capability.
2. Pause implementation for non-trivial work.
3. Research existing solutions when research access is available.
4. Prefer solutions in this order:
   - MCPs
   - Skills
   - Agents
   - APIs
   - Libraries
   - Custom code
5. Produce a short recommendation before adding any dependency, integration, agent, or custom implementation.
6. Build custom code only when no practical existing solution fits.

---

## Allowed Automatic Actions

The agent may do these without separate approval when the user has requested an audit:

- Read files.
- Search repository content.
- Run validators and tests.
- Inspect git status and ignored tracked files.
- Add missing Vault metadata.
- Create cleanup plans.
- Update `.gitignore` for clear generated/runtime artifacts.
- Draft reports and implementation plans.
- Draft test/validator improvements.

---

## Approval Required

Pause and ask before:

- Deleting files.
- Moving or archiving source-of-truth documents.
- Running destructive git commands.
- Running `git rm`, including `git rm --cached`.
- Adding dependencies.
- Changing architecture decisions.
- Changing MCP configuration.
- Introducing custom implementation for a missing capability.
- Making changes that alter project governance beyond the requested audit.

---

## Audit Workflow

### Step 1: Discovery

Read the core project map. Search for:

- Redundant or conflicting docs.
- Validator and test commands.
- Generated/runtime directories.
- Ignored tracked files.
- Vault metadata conventions.
- Existing cleanup plans.
- Known problems related to testing, validation, Chroma, MCP, or repository hygiene.

### Step 2: Health Checks

Run or propose:

```powershell
node ./.claude/scripts/vault-validator.js
npm.cmd test
git ls-files -ci --exclude-standard
git status --short
```

Use `npm test` instead of `npm.cmd test` on shells where that is appropriate.

### Step 3: Section Audits

Audit these sections independently:

- Governance and operating rules
- Vault structure and metadata
- Architecture and ADR consistency
- Requirements and phase roadmap
- Prompts and skills
- Automation scripts and validators
- Tests and test side effects
- Runtime/generated artifact boundaries
- Git hygiene and ignored tracked files
- MCP/tooling integration
- Docker/local services
- Documentation redundancy and archive needs
- Missing capabilities

### Step 4: Safe Fixes

If safe fixes are allowed:

- Add missing `last_updated` or other required frontmatter only when the correct value can be inferred.
- Update validators when they conflict with documented project taxonomy.
- Update `.gitignore` only for obvious generated/runtime paths.
- Create cleanup plans rather than deleting or moving files.

### Step 5: Report and Plan

Produce:

- Executive summary
- Health check results
- Findings by severity
- Section-by-section audit
- Missing capability review
- Phased task plan
- Do now / do later list
- Stop conditions

---

## Output Template

```markdown
# AI Software Factory Audit Report

## Executive Summary
[Healthy / partially healthy / unhealthy, top risks, top opportunities.]

## Health Check Results
| Check | Result | Notes |
|---|---|---|

## Findings
### Critical
### High
### Medium
### Low

Each finding:
- Evidence:
- Why it matters:
- Recommended action:
- Automatic or approval required:

## Section Audits
### Governance and Operating Rules
### Vault Structure and Metadata
### Architecture and ADR Consistency
### Requirements and Roadmap
### Prompts and Skills
### Automation Scripts and Validators
### Tests and Side Effects
### Runtime and Generated Artifacts
### Git Hygiene
### MCP and Tooling
### Docker and Local Services
### Documentation Redundancy
### Missing Capabilities

## Missing Capability Review
[Capability, existing solutions considered, recommended path.]

## Task Plan
| Phase | Task | Files | Risk | Approval | Verification |
|---|---|---|---|---|---|

## Do Now
## Do Later
## Stop Conditions
```

---

## Quality Bar

The audit is successful when:

- Findings are specific and file-backed.
- The task plan separates automatic work from approval-required work.
- Health checks are reproducible.
- Generated/runtime artifacts are not confused with source.
- Missing capabilities are evaluated before custom code is proposed.
- The final plan reduces operational noise rather than adding process weight.

