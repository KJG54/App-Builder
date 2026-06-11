---
type: Skill
name: "runtime-efficiency-engineer"
version: "1.0"
phase: 19
status: Active
last_updated: 2026-06-11
authority: facts
chroma_collection: ai-software-factory-skills
tags: [skill, efficiency, tokens, context, mcp, performance, cross-cutting]
related: [Repository-Constitution.md, repository-curator-v1.0.md, 02-Technologies/MCP_SERVERS.md]
created_date: 2026-06-11
created_by: Claude-Builder-Agent
validation_status: Active
maintenance_owner: Human
next_review_date: 2026-09-11
---

# Skill: Runtime Efficiency Engineer v1.0

**Skill ID:** runtime-efficiency-engineer-v1.0  
**Domain:** Cross-Cutting  
**Status:** Active  
**Complexity:** Medium

---

## Problem Statement

Use this skill to identify and reduce waste in the Claude Code session runtime. Every token loaded unnecessarily, every MCP schema parsed for a tool you don't use, and every directory Claude scans that contains no relevant code is overhead that slows every session and increases cost.

**Scope of this skill (defer everything else to `repository-curator`):**
- Token waste in prompts and skill text
- Always-loaded context file size and necessity
- MCP startup cost and schema overhead per session
- `.claudecodeignore` / directory scope for Claude Code
- Retrieval efficiency (Top-K limits, result size)
- Memory system bloat
- Dependency weight (npm packages)
- Agent handoff and orchestration overhead

**Not in scope:** dead files, structural redundancy, documentation drift, architectural drift — those belong to `repository-curator`.

---

## Trigger Examples

- "Is the project wasting tokens or context?"
- "Which MCPs should I disable to reduce session cost?"
- "Why is each session starting slowly / using a lot of context?"
- "Optimize for fewer tokens and faster responses."
- "Audit runtime efficiency."
- "What's loading every session that doesn't need to be?"

---

## Required Inputs

- Access to `.claude/settings.json`, `.claude/settings.local.json`, `.mcp.json`
- Access to `outputs.json` files (if they exist) for actual cost data
- Whether the user wants recommendations only, or approved to implement safe changes

---

## Core Workflow

### Phase 1 — Runtime Discovery

Map everything that loads or runs at session start:
- Read `.claude/settings.json` + `.claude/settings.local.json`: hooks, permissions, attribution
- Read `.mcp.json`: which MCP servers are configured
- Identify always-loaded files: CLAUDE.md, MEMORY.md, `*.md` in memory directories, session handoffs
- Identify hook scripts that run at SessionStart and PostCompact
- Note: skill list is loaded by harness at session start — 60+ skills = 60+ schema chunks

Build a runtime cost map before any recommendations.

### Phase 2 — Context Analysis

Review always-loaded files:

**Too large?** Flag files that are > 10KB and always loaded. Can content be made conditional (loaded only when relevant) or split into smaller focused files?

**Duplicated?** Flag information repeated across CLAUDE.md, Constitution, skill files, and agent prompts. Centralizing saves tokens on every session.

**Stale?** Flag context files referencing systems that no longer exist (old phase numbers, deprecated tools, removed scripts).

**Evidence-based:** Use file sizes (`stat`) rather than estimating.

### Phase 3 — Token Efficiency Analysis

Review prompt/skill text for waste:

- **Repeated principles** — the same rule stated multiple times across CLAUDE.md, skill files, or agent prompts
- **Verbose introductions** — skill files with 50-line preambles before the actual workflow
- **Redundant examples** — multiple examples where one would do
- **Legacy baggage** — instructions for removed features or old workflows

Estimate token savings as: `(word count removed) × 1.3 ≈ tokens saved`.

### Phase 4 — Retrieval Efficiency Analysis

Review Chroma/search configuration:

- What is the current Top-K for `assembleContext()`? (Check `context-assembly.js`)
- Are full documents returned when excerpts would suffice?
- Are multiple collections queried when one would do?
- Is the same content indexed in multiple collections?

Flag: retrieval explosion (20 docs when 3 suffice), duplicate indexes, or overly broad queries.

### Phase 5 — MCP Session Cost Analysis

For each MCP in `.mcp.json` or `settings.local.json`:

| MCP | Session use (this project) | Schema cost | Verdict |
|-----|---------------------------|-------------|---------|
| filesystem | High | Low | Keep |
| github | High | Medium | Keep |
| chroma | Conditional | Low | Keep (optional profile) |
| context7 | Occasional | Medium | Keep |
| playwright | Rare | Medium | Optional profile |
| figma | Rare | High | Disable unless needed |
| slack/sentry/linear | None (require auth) | High | Disable |
| huggingface | None | High | Disable |

**Auth-required MCPs** (figma, slack, sentry, linear, huggingface): each loads a large schema at session start even when you never authenticate. If not used in this project, disable in `settings.local.json`.

### Phase 8 — Claude Code Directory Scope

Review what Claude Code scans:

- Check `.gitignore` for directories that should be excluded from Claude's view
- Are `node_modules/`, `docker/volumes/`, `.git/`, and generated directories excluded?
- Does a `.claudeignore` or `.claudecodeignore` file exist? If not, should one?
- Large directories (logs/, archives/, chroma data) that Claude scans but never needs

Recommend additions to ignore rules where scan cost exceeds benefit.

### Phase 9 — Memory Efficiency Analysis

Review `.claude/projects/.../memory/` and `.remember/` directories:

- How many memory files? What is the total loaded size?
- Are there stale project memories that no longer apply?
- Are duplicate memories present (same fact in two files)?
- Are accumulated one-time permission approvals still relevant in settings files?

Recommend: compress stale memories, remove duplicates, archive historical project state.

---

## Evidence Requirements

Every recommendation must include:

| Item | Current | Optimized | Estimated Saving |
|------|---------|-----------|-----------------|

Use real measurements (file sizes, word counts, `outputs.json` cost data) rather than guesses. If data doesn't exist, say "estimate" and explain the basis.

---

## Allowed Actions (No Approval Required)

- Read files, check file sizes, count tokens/words
- Read `outputs.json` for actual cost data
- Draft recommendations
- Create efficiency reports in `Vault/Logs/`

---

## Approval Required

- Modifying `settings.json` or `settings.local.json`
- Disabling MCP servers
- Modifying `.gitignore` or creating `.claudeignore`
- Modifying prompt or skill content
- Removing memory entries

---

## Output Template

```markdown
# Runtime Efficiency Report — {date}

## Executive Summary
[Overall runtime health. Most significant inefficiencies. Highest-value wins.]

## Context Cost Map
[Always-loaded files and estimated token cost each]

## Phase 2: Context Waste
| File | Current Size | Issue | Recommendation | Estimated Saving |
|------|-------------|-------|---------------|-----------------|

## Phase 3: Token Waste
| Location | Issue | Recommendation | Estimated Saving |
|----------|-------|---------------|-----------------|

## Phase 4: Retrieval Waste
[Top-K, result size, duplicate index findings]

## Phase 5: MCP Session Cost
| MCP | Verdict | Reason |
|-----|---------|--------|

## Phase 8: Directory Scope
[Files Claude scans unnecessarily; recommended ignore rules]

## Phase 9: Memory Bloat
[Stale or duplicate memory entries]

## Quick Wins
[High-impact, low-risk, implementable immediately]

## Requires Approval
[Changes that need explicit sign-off before implementation]
```

---

## Quality Bar

Analysis is successful when:
- Every finding uses actual measurements, not estimates where data exists
- MCP recommendations distinguish session-cost (this skill) from structural redundancy (curator)
- Quick wins are genuinely implementable without architectural changes
- Context savings are expressed in concrete token estimates
- No recommendation sacrifices correctness or reliability for marginal efficiency gain
