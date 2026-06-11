---
type: Skill
name: "simplification-audit"
version: "1.0"
phase: 19
status: Active
last_updated: 2026-06-11
authority: facts
chroma_collection: ai-software-factory-skills
tags: [skill, simplification, complexity, pruning, cross-cutting]
related: [Repository-Constitution.md, repository-curator-v1.0.md, Templates/Strategic-Review-Prompt.md]
created_date: 2026-06-11
created_by: Claude-Builder-Agent
validation_status: Active
maintenance_owner: Human
next_review_date: 2026-09-11
---

# Skill: Simplification Audit v1.0

**Skill ID:** simplification-audit-v1.0  
**Domain:** Cross-Cutting  
**Status:** Active  
**Complexity:** Low

---

## Problem Statement

Use this skill to answer one focused question: **"What can be removed or simplified while preserving the core value of the project?"**

This is the lightweight version of the Strategic Review's Phase 10 — safe to run periodically without questioning foundational architectural decisions. It works within the current architecture and ADRs, not against them.

Unlike the Curator (which maps relationships and finds orphans), the Simplification Audit asks: "Even if this thing is used, does it justify its complexity cost?"

---

## Trigger Examples

- "The project feels bloated — what can we simplify?"
- "Run a simplification audit."
- "What would you cut if you had to remove 30% of the project?"
- "Is there unnecessary complexity we've accumulated?"
- "Simplicity review."

---

## Required Inputs

None required. Optionally: a target area (scripts, skills, MCPs, agents, documentation).

---

## The Core Question

> "If this project needed to be reduced by 50% while preserving 95% of its value, what would be removed first?"

Apply this question to each major asset category.

---

## Core Workflow

### Step 1: Identify Complexity Sources

Scan for:
- **Scripts** — `.claude/scripts/`: How many? What percentage are invoked regularly vs. rarely/never?
- **Skills** — `Vault/05-Prompts/Skills/`: How many are Active vs. Beta? Do Beta skills justify their maintenance burden?
- **MCP servers** — `.mcp.json`: How many? Which are used in this specific project?
- **Validators** — `validate-phase-*.js`: Are all phases still relevant to validate?
- **Memory entries** — `MEMORY.md`: How many entries? Are old project-state entries still load-bearing?
- **Vault documents** — Are there documents no one reads or updates?
- **Phase docs** — Are all 18 phase docs actively referenced or just historical records?
- **Commands** — `.claude/commands/`: Do all slash commands earn their place?

### Step 2: Apply the Value Test

For each item, ask:
1. **What breaks if this is removed?** (If nothing, it's a candidate)
2. **Was this built for a future use case that hasn't materialized?** (Premature generalization is removable)
3. **Is this complexity earning its maintenance cost?** (One-time scripts, unused Beta skills)
4. **Is a simpler alternative available that achieves 90%+ of the outcome?**

### Step 3: Classify

| Item | Value | Complexity Cost | Verdict |
|------|-------|----------------|---------|
| (each item) | High/Med/Low | High/Med/Low | Keep / Simplify / Remove |

**Keep:** High value, any complexity cost  
**Simplify:** Medium value, high complexity — reduce, not remove  
**Remove:** Low value at any complexity cost; OR zero value

### Step 4: Produce Recommendations

Group by effort:
- **Zero effort** — can be deleted immediately, no dependencies
- **Low effort** — one edit or move
- **Medium effort** — requires updating references
- **High effort** — requires replacement or migration

---

## What to Look for Specifically

### Over-Engineering Red Flags
- Abstractions with only one implementation
- Configuration options that are always set to the same value
- Interfaces designed for hypothetical future use cases
- Multi-step workflows for simple recurring tasks

### Premature Generalization
- Scripts that "could handle any project" but only handle one
- Skills that cover three domains but are only ever invoked for one
- Framework code that predates any real framework users

### Maintenance Debt
- Beta skills with no validation history (never moved to Active)
- Phase validators for phases that will never be re-run
- Permission allowlist entries superseded by broader rules
- Memory entries for completed phases with no ongoing relevance

---

## Allowed Actions (No Approval Required)

- Read files, measure sizes, count usage
- Draft recommendations and classification tables

---

## Approval Required

- Deleting any file
- Merging or consolidating assets
- Removing skills or commands

---

## Output Template

```markdown
# Simplification Audit — {date}

## The Core Question
"What could be removed while preserving 95% of the project's value?"

## Complexity Map
| Category | Count | High Value | Medium Value | Low Value |
|----------|-------|-----------|--------------|-----------|

## Candidates for Removal
| Asset | Reason | Dependencies | Effort | Verdict |
|-------|--------|-------------|--------|---------|

## Candidates for Simplification
| Asset | Current Complexity | Simpler Alternative | Estimated Saving |
|-------|--------------------|-------------------|-----------------|

## Immediate Actions (Zero/Low Effort, No Approval)
[List]

## Approval-Required Actions
[List with rationale]

## What's Earning Its Place
[Assets explicitly worth keeping despite complexity cost — brief justification]
```

---

## Quality Bar

Audit is successful when:
- Every removal candidate has a clear "what breaks if removed" answer
- Simplification recommendations are concrete, not vague ("consolidate" → "merge X into Y")
- The audit works within existing ADRs rather than questioning foundational decisions (use the Strategic Review template for that)
- The result is a shorter list of higher-value assets, not just more documentation about existing ones
