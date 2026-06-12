---
type: workflow
status: active
last_updated: 2026-06-12
author: Claude
tags: [workflow, multi-agent, operating-model, codex, claude, roles, async-pipeline]
related: [async-agent-collaboration, Phase-13-Multi-Agent-Collaboration, ADR-ARCH-002, DECISIONS]
---

# Multi-Agent Operating Model

## Purpose

Define how Claude and Codex operate as a **team of specialists** rather than two
agents solving the same problems. The goal is maximum leverage: Claude spends most
of its time thinking (architecture, planning, review); Codex spends most of its
time building (implementation, testing, verification).

This document is the **operating model**. It does not introduce new storage — it
choreographs the systems that already exist (Vault, Agent Mailbox, Agent
Orchestrator, review skills). Where this model needs a "document," it points at the
canonical Vault file rather than creating a parallel copy.

> Single source of truth is non-negotiable (`CLAUDE.md` → File Organization). Do
> not create a second `docs/` tree. Every artifact below already has a home.

## Roles

### Claude — Architect + Reviewer

Owns **thinking**: system architecture, feature design, requirements analysis,
task decomposition, risk analysis, technical decisions, documentation, and review
(architecture, security, performance, maintainability).

Claude answers: *How should this be designed? What are the tradeoffs? What risks
exist? What tasks should be created? Is the completed work correct and safe?*

Claude must **not**: implement large features, rewrite whole systems during review,
or expand scope beyond the request (`CLAUDE.md` → Scope Control).

### Codex — Builder + QA

Owns **execution**: feature implementation, bug fixing, refactoring, unit/integration
tests, dependency updates, build verification.

Codex answers: *Can this be implemented? Do tests pass? Is the build green? Is the
bug fixed?*

Codex must **not**: choose the architecture, set the roadmap, or act on ambiguous
instructions — it requests an explicit task package first (`AGENTS.md`).

## The Async Pipeline

The point of two agents is that they run **concurrently**, not in lockstep. The
discipline that makes this work: **Claude always stays one step ahead.** While Codex
builds the current task, Claude designs the next one and reviews the last one.

```text
        plan ahead              build current            review
Claude (Architect) ──▶ Mailbox ──▶ Codex (Builder) ──▶ Mailbox ──▶ Claude (Reviewer)
        ▲                                                              │
        │                          fix queue                          │
        └──────────────── Codex (Builder) ◀── Mailbox ◀───────────────┘
```

If Claude is idle waiting for Codex (or vice versa), the pipeline has stalled — the
fix is to deepen the plan queue, not to have both agents touch the same task.

## Where Everything Lives (no new files)

The operating manual's proposed documents all already exist. Use these:

| Concept | Canonical location |
|---------|--------------------|
| Architecture | `Vault/03-Projects/AI Software Factory/Architecture/Current.md` |
| Roadmap | `Vault/03-Projects/AI Software Factory/Roadmap.md` |
| Decisions | `Vault/07-Decisions/DECISIONS.md` (+ ADRs) |
| Standards | `Vault/01-Standards/` (Coding, Security, Architecture, Documentation) |
| Requirements | `Vault/09-Requirements/` |
| Handoffs / current task | **Agent Mailbox** (`node .claude/scripts/agent-mailbox.js`) |
| Structured task DAGs | **Agent Orchestrator** (`.claude/scripts/agent-orchestrator.js`) |
| Session handoff | `.claude/scripts/session-handoff.js` |
| Known problems | `Vault/10-Known-Problems/` |

## Task Lifecycle

1. **Design (Claude).** Produce a task package: goal, requirements, acceptance
   criteria, files impacted, dependencies, risks. Post it to the mailbox as a
   `handoff` (`--to codex`) with the **Task Handoff** format below.
2. **Build (Codex).** Claim the message, implement, test, verify. Post back a
   `handoff` (`--to claude`) using the **Completion Report** format, with evidence.
3. **Review (Claude).** Run `/code-review` and, when relevant, `/security-review`
   against the diff. Post **Review Findings** to the mailbox (or close if clean).
4. **Fix (Codex).** Claim findings, apply corrections + tests, report again.
5. **Complete.** Close the mailbox message. Update the canonical Vault docs that
   changed (architecture/decisions/roadmap), not a separate handoff log.

### Choosing the lightweight vs full path

- **Mailbox (lightweight)** — single handoffs, status, blockers, ad-hoc coordination.
  Default for most work.
- **Orchestrator (full)** — planned multi-task work with explicit dependencies.
  Use when a feature decomposes into ordered subtasks across roles.

This mirrors `async-agent-collaboration.md` — the mailbox complements, never
replaces, the orchestrator.

## Handoff Formats

These are the **standard shape of mailbox messages**, not separate files. Full
templates live in `AGENTS.md` (Codex's contract) and are summarized here.

- **Task Handoff** (Claude → Codex): Goal, Requirements, Files, Acceptance Criteria, Risks.
- **Completion Report** (Codex → Claude): Files Modified, Tests (with output), Build, Known Issues.
- **Review Findings** (Claude → Codex): numbered issues + Required Actions.

Keep mailbox messages operational. Anything permanent (a decision, an architecture
change, a known problem) must also be written to the appropriate Vault folder.

## Parallel Work — The One Hard Rule

Multiple Codex agents may run concurrently (e.g. backend / frontend / tests / docs).

> **No two agents edit the same file without an active mailbox claim on it.**

The claim + `--files` list is the coordination primitive. Before editing a shared
file, run `agent-mailbox.js status`, confirm no open claim touches it, then claim.
This is the single most important rule for safe parallelism — file collisions are
the main failure mode.

## Keyword Mapping (use existing tooling, not new keywords)

The manual proposed `SYNC` and `VAULT` keywords. Map them to what exists:

| Intent | Use |
|--------|-----|
| SYNC (summarize, update roadmap/decisions/handoffs, find next tasks) | `/curator` + `session-handoff.js` |
| VAULT (record discoveries, decisions, lessons, open issues) | `CLAUDE.md` → Vault "After Work" rules + `/curator` |
| Review (security / quality / architecture) | `/code-review`, `/security-review`, `/review` |
| Health check / drift detection | `/audit`, `npm run doctor` |

## Context Loading

Load only what the role needs (`CLAUDE.md` → keep context lean):

- **Claude (Architect/Reviewer):** Architecture/Current.md, Roadmap.md, DECISIONS.md,
  relevant Standards, the diff under review.
- **Codex (Builder):** the claimed mailbox task, relevant Standards, the specific
  source files, test output. Avoid loading the whole project.

## Relationship to Existing Framework Tools

| Tool | Use For |
|------|---------|
| Multi-Agent Operating Model (this doc) | Roles, the async pipeline, the review loop |
| Agent Mailbox | Async status, ownership, handoffs between agents |
| Agent Orchestrator | Structured task/subtask execution with dependencies |
| Session Handoff | End-of-session summary from retrospectives |
| Agent Memory | Long-term role-specific performance learnings |
| Vault | Permanent project knowledge (source of truth) |
| Review skills | `/code-review`, `/security-review`, `/review` |

## Success Criteria

- Claude and Codex are rarely doing the same work.
- Claude is usually one task ahead (planning/reviewing) while Codex builds.
- Every handoff carries evidence; no completion claim without test/build output.
- No file is edited by two agents without a claim.
- Permanent knowledge lands in the Vault, not in a parallel doc tree.

## Related

- [[async-agent-collaboration]] — the mailbox protocol this model runs on
- [[DECISIONS]] — Decision 12 adopts this operating model
- `AGENTS.md` (repo root) — Codex's side of the contract, with handoff templates
- `CLAUDE.md` (repo root) — governance contract; Multi-Agent Operating Model section
