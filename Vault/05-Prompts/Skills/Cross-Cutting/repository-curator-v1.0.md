---
type: Skill
name: "repository-curator"
version: "1.0"
phase: 19
status: Active
last_updated: 2026-06-11
authority: facts
chroma_collection: ai-software-factory-skills
tags: [skill, curator, repository-hygiene, consolidation, dead-assets, cross-cutting]
related: [Repository-Constitution.md, ai-software-factory-audit-v1.0.md, 07-Decisions/DECISIONS.md]
created_date: 2026-06-11
created_by: Claude-Builder-Agent
validation_status: Active
maintenance_owner: Human
next_review_date: 2026-09-11
---

# Skill: Repository Curator v1.0

**Skill ID:** repository-curator-v1.0  
**Domain:** Cross-Cutting  
**Status:** Active  
**Complexity:** High

---

## Problem Statement

Use this skill to continuously improve the quality, maintainability, organization, and discoverability of the repository. Unlike `/audit` (which takes a health snapshot), the Curator identifies redundant, dead, misplaced, or contradictory assets and produces consolidation recommendations with evidence-backed actions.

**Scope of this skill (defer everything else to `runtime-efficiency-engineer`):**
- Structure, organization, discoverability
- Dead files, orphaned agents, unused skills
- Agent responsibility overlap
- MCP structural redundancy (which MCPs overlap)
- Documentation drift and contradiction
- Architectural drift from ADRs

**Not in scope:** token waste, context loading cost, MCP session cost, `.claudecodeignore` rules — those belong to `runtime-efficiency-engineer`.

---

## Trigger Examples

- "Curate the repository — find dead and redundant assets."
- "Check for duplicate implementations or conflicting documentation."
- "What can be merged, archived, or removed?"
- "Find orphaned skills, agents, and tests."
- "The repository feels bloated — what doesn't need to exist?"

---

## Required Inputs

- **Mode:** `full` (all phases, ~1-2 hours) or `incremental` (phases 3-5 only, scoped to changed files). Default: `incremental`.
- **Safe fixes allowed?** Default: no. Curator produces recommendations; user approves actions.
- **Scope override:** specific directory or asset type (optional).

If mode is not specified, ask before running a full investigation.

---

## Phase 0: Mandatory Pre-Read (Always Run)

Before any investigation, read:

1. `Vault/03-Projects/AI Software Factory/Repository-Constitution.md` — project standards
2. `Vault/07-Decisions/DECISIONS.md` — architectural decisions (assets may be kept intentionally)
3. `Vault/STATUS.md` — current project state

**Never recommend removing an asset that was deliberately kept per an ADR without flagging the ADR conflict.**

---

## Core Workflow

### Full Mode (Phases 1–9)

Run for first-time curation or quarterly reviews.

**Phase 1 — Inventory**
Build a complete asset list using Glob across all directories. Identify: files, scripts, skills, agents, commands, templates, test files, config files. Note: count, last modified, size.

**Phase 2 — Relationship Mapping**
Determine which assets reference each other:
- Use Grep to find imports and `require()` calls in scripts
- Read all skill `related:` frontmatter fields
- Search commands for skill names they invoke
- Search package.json for script references to `.claude/scripts/`
- Any asset with zero inbound references is a candidate for investigation

**Phase 3 — Dead Asset Detection**
Cross-reference inventory against relationship map. Flag:
- Files never imported or referenced
- Skills never invoked by a command
- Tests for removed functionality
- Documentation for systems that no longer exist
- ADRs not referenced by any fact or architecture doc

**Phase 4 — Redundancy Analysis**
Identify duplicate functionality:
- Two files solving the same problem
- Two skills with overlapping trigger conditions
- Multiple onboarding or setup docs
- Multiple implementations of same pattern

**Phase 5 — Consolidation Analysis**
For every overlap, classify:
- **Can Merge** — should become one asset
- **Can Refactor** — should share common logic
- **Can Archive** — historical value only
- **Can Delete** — no value

**Phase 6 — Structural Review** *(Full mode only)*
Evaluate organization against the Constitution's directory structure rules. Flag misplaced files.

**Phase 7 — Documentation Consistency** *(Full mode only)*
Compare documentation to reality. Flag stale, missing, or contradictory docs.

**Phase 8 — Architectural Drift** *(Full mode only)*
Check whether implementation still follows the ADR decisions. Flag workarounds, temporary hacks, competing patterns.

**Phase 9 — Health Scoring** *(Full mode only)*

Score 0-100:

| Category | Score | Notes |
|----------|-------|-------|
| Organization | | |
| Maintainability | | |
| Documentation | | |
| Discoverability | | |
| Tooling | | |
| Testing | | |
| AI Asset Quality | | |
| Architecture | | |
| **Overall** | | |

---

### Incremental Mode (Phases 3–5 Only)

Scope to files changed since last curator run or specified by user. Faster, lower cost. Best for regular maintenance.

---

## Classification System

Every finding must receive:

**Severity:** Critical | High | Medium | Low | Informational  
**Confidence:** High | Medium | Low  
**Action:** Keep | Move | Merge | Refactor | Archive | Delete

---

## Safety Rules

- Never recommend deletion without verifying: imports, references, workflows, documentation mentions, CI usage, skill/agent usage
- Never recommend deleting active production systems, security controls, or compliance controls without proof a replacement exists
- Flag ADR conflicts before recommending removal of anything deliberately kept

---

## Allowed Actions (No Approval Required)

- Read files, search repository
- Build relationship maps
- Draft recommendations
- Create cleanup plans in Vault/Logs/

---

## Approval Required

- Deleting any file
- Moving or renaming source-of-truth documents
- Running `git rm` (including `--cached`)
- Merging or consolidating assets
- Changing MCP configuration
- Modifying governance documents

---

## Output Template

```markdown
# Repository Curator Report — {date}

**Mode:** Full | Incremental  
**Scope:** {scope}

## Executive Summary
[Repository status. Major risks. Major opportunities. Overall health score if Full mode.]

## Pre-Read Findings
[Any Constitution violations or ADR conflicts found during Phase 0]

## Dead Assets
| Asset | Type | Last Referenced | Confidence | Recommended Action |
|-------|------|----------------|------------|-------------------|

## Redundant Assets
| Asset A | Asset B | Overlap | Recommended Action |
|---------|---------|---------|-------------------|

## Structural Issues
[Misplaced files, naming violations, directory rule violations]

## Documentation Gaps
[Missing, stale, or contradictory docs]

## Architectural Drift
[Workarounds, competing patterns, ADR violations]

## Consolidation Roadmap
Phase 1 — Immediate (safe, no approval): ...
Phase 2 — Approval Required: ...
Phase 3 — Long-Term: ...

## Health Scores (Full mode only)
[Score table]
```

---

## Quality Bar

Curation is successful when:
- Every finding is backed by specific file evidence
- ADR conflicts are surfaced before action
- Consolidation recommendations have a clear rationale
- The roadmap separates automatic from approval-required work
- The repository ends up smaller and clearer, not just annotated

**Relationship to `/audit`:** Use `/audit` for comprehensive one-time health snapshot with a task plan. Use `/curator` for ongoing hygiene maintenance and consolidation.
