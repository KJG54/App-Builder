---
type: Skill
name: "project-guardian"
version: "1.0"
phase: 17
status: Active
authority: facts
chroma_collection: ai-software-factory-skills
tags: [skill, guardian, audit, continuous-improvement, technical-debt, project-health, cross-cutting]
related: [Project-Guardian.md, AI-Software-Factory-Audit-Agent.md, ai-software-factory-audit-v1.0.md, Verification.md, ADR-SEC-001]
created_date: 2026-06-10
created_by: Claude
validation_status: Draft
maintenance_owner: Human
next_review_date: 2026-09-10
last_updated: 2026-06-10
---

# Skill: Project Guardian v1.0

**Skill ID:** project-guardian-v1.0  
**Domain:** Cross-Cutting  
**Status:** Active  
**Complexity:** Medium

---

## Problem Statement

Use this skill when the project needs continuous health monitoring, proactive improvement recommendations, and trend-aware quality assessment. Unlike the one-time `/audit` deep scan, the Project Guardian runs regularly and tracks whether the project is getting healthier or drifting toward technical debt and inconsistency.

This skill should produce a health report, improvement backlog update, and trend notes.

---

## Trigger Examples

Use this skill for requests like:

- "Check the project's health"
- "Run the guardian on the project"
- "What's drifting or degrading in the project?"
- "Find duplication, debt, and inconsistencies"
- "Continuous improvement review"
- "What should we clean up?"
- "Is the project in good shape?"
- "Guardian audit"

---

## Required Inputs

Before starting, identify:

- Audit scope: whole project or a specific domain (see domain list below)
- Whether a previous guardian report exists in `Vault/Logs/` (for trend comparison)
- Whether safe fixes are allowed automatically (default: allowed)
- Whether destructive changes are forbidden (default: yes, always forbidden)

If no scope provided: default to whole-project audit.

---

## Project Constitution Rules

Every recommendation must respect these rules. If a recommendation would violate one, say so explicitly.

1. **Never reinvent** — Check existing project tools, agents, MCPs, and utilities first
2. **Search before building** — Check external MCPs, APIs, open-source before custom code
3. **Build last** — existing project → existing external → adapt → build new
4. **Preserve simplicity** — prefer fewer moving parts and less maintenance burden
5. **Optimize token usage** — minimize redundancy; never sacrifice accuracy or clarity
6. **Use project knowledge first** — check Vault, ADRs, requirements before making decisions
7. **Protect consistency** — every recommendation must align with existing architecture and naming
8. **Documentation must match reality** — flag any doc that has drifted from implementation
9. **Eliminate duplication** — actively search for duplicate code, agents, prompts, docs, services
10. **Every file must justify its existence** — flag files with no clear purpose

---

## Audit Workflow

### Step 1: Load Prior State

If a previous guardian report exists in `Vault/Logs/guardian-report-*.md`, read the most recent one. Note what was flagged, what was fixed, and what was deferred. This enables trend comparison.

### Step 2: Run Health Checks

```powershell
node ./.claude/scripts/vault-validator.js
npm.cmd run test:all
git ls-files -ci --exclude-standard
git status --short
```

Note: use `npm run test:all` instead of `npm.cmd test:all` on non-Windows shells.

### Step 3: Domain Audits

Audit each domain independently. For each, answer: what is missing, duplicated, conflicting, outdated, undocumented, or unnecessarily complex?

**Governance** — Does actual agent behavior match CLAUDE.md rules? Are any rules drifting from practice?

**Architecture** — Are there competing implementations? Dead infrastructure? Abandoned patterns?

**Code** — Dead code, duplicate logic, security concerns, excessive complexity, code smells

**Agents** — Overlapping responsibilities? Contradictory instructions? Redundant roles? Every agent should have a unique, clear purpose.

**Tools** — Unused tools, missing tools, duplicate tools. Is there a better external alternative (MCP, API, library) for anything currently custom-built?

**Documentation** — Missing docs, contradictory docs, stale docs (check `last_updated` vs. actual behavior). Does every major system have a README or Vault entry?

**Testing** — Missing tests, redundant tests, false-positive tests. Do tests write to production Vault files as a side effect? Are all phase validators runnable via `npm run test:all`?

**Dependencies** — Unused, outdated, duplicate, or insecure `package.json` dependencies. Are all `node_modules` actually used?

**Knowledge** — Important decisions without ADRs? Vault documents with no inbound links? Phase completions without session summaries?

**Git hygiene** — Tracked-but-ignored files (`git ls-files -ci`), stale branches, commit message style consistency, uncommitted source changes.

### Step 4: Allowed Automatic Actions

These can be done without separate approval when running a guardian pass:

- Read all files
- Run validators and tests
- Inspect git status
- Normalize missing Vault frontmatter fields when correct values can be inferred
- Update `.gitignore` for obvious runtime/generated paths
- Create or update cleanup plans
- Write health report to `Vault/Logs/`
- Flag issues in `Vault/10-Known-Problems/`

### Step 5: Approval Required

Pause and ask before:

- Deleting files
- Moving or renaming source-of-truth documents
- Running `git rm` (including `--cached`)
- Adding external dependencies
- Changing architecture, governance, or MCP configuration
- Making any change that affects project authority or approval gates

### Step 6: Produce Report

Generate a full report using the output template. Save to `Vault/Logs/guardian-report-{YYYY-MM-DD}.md`.

---

## Output Template

```markdown
# Project Guardian Report — [Date]

## Executive Summary
[Healthy / Partially Healthy / Unhealthy — 2-3 sentences on top risks and top opportunities]

## Health Check Results
| Check | Result | Notes |
|---|---|---|
| vault-validator | ✅/❌ | |
| npm run test:all | ✅/❌ | X passed, Y failed |
| tracked-but-ignored files | ✅/❌ | N files |
| git status | ✅/❌ | |

## Findings

### Critical
### High
### Medium
### Low

Each finding:
- **Problem:**
- **Evidence:** [file path, line number, or command output]
- **Impact:**
- **Root Cause:**
- **Recommended Fix:**
- **Automatic or Approval Required:**

## Domain Audits
### Governance
### Architecture
### Code
### Agents
### Tools
### Documentation
### Testing
### Dependencies
### Knowledge
### Git Hygiene

## Improvement Backlog
[Ranked list of improvements — not yet critical but worth tracking]
| Priority | Item | Effort | Risk |
|----------|------|--------|------|

## Trend Notes
[Compared to prior report: what improved? What regressed? What is new?]

## Stop Conditions
[What must NOT be done without explicit approval]
```

---

## Relationship to `/audit`

| | `/audit` | `/guardian` |
|---|---|---|
| Trigger | On-demand | On-demand or recurring |
| Focus | Comprehensive one-time deep scan | Continuous health + trend tracking |
| Output | Report + one-time task plan | Report + improvement backlog + trend notes |
| Prior state | Not tracked | Reads previous reports for comparison |

Use `/audit` for a thorough first-pass or after major changes. Use `/guardian` for regular health checks and improvement tracking.

---

## Quality Bar

The guardian pass is successful when:

- All findings are specific and backed by file evidence
- Every finding has a recommended fix
- Approval-required items are clearly labeled
- Automatic actions do not exceed allowed scope
- Generated/runtime artifacts are not confused with source files
- The improvement backlog is prioritized by risk and effort
- Trend notes capture whether the project is getting healthier or drifting

---

## Related Skills

- [[../Cross-Cutting/ai-software-factory-audit-v1.0.md]] — One-time comprehensive deep scan; use alongside Guardian for periodic deep dives
- [[../Cross-Cutting/project-discovery-interview-v1.0.md]] — Use before building to prevent the problems Guardian detects
