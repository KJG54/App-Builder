---
type: workflow
status: active
last_updated: 2026-06-12
author: Codex
tags: [workflow, multi-agent, async-collaboration, codex, claude]
related: [Phase-13-Multi-Agent-Collaboration, ADR-ARCH-002]
---

# Async Agent Collaboration

## Purpose

Provide a simple handoff protocol for agents that share this workspace but do not run inside the same orchestration session.

This workflow complements the Phase 13 Agent Orchestrator. Use the orchestrator for planned multi-agent tasks with explicit subtasks and dependencies. Use the mailbox when Codex, Claude, or another agent needs to leave status, intent, blockers, or next actions for an agent that will arrive later.

## Storage

Runtime state lives in `.claude/agent-mailbox/` and is not committed. The mailbox is managed by:

```bash
node .claude/scripts/agent-mailbox.js
```

The script writes:

| File | Purpose |
|------|---------|
| `.claude/agent-mailbox/mailbox.json` | Source of truth for messages |
| `.claude/agent-mailbox/latest.md` | Human-readable open/closed summary |

Do not edit these files directly. Use the CLI so writes are locked and consistently shaped.

## When to Use

Use the mailbox when:

- Codex is handing work to Claude or Claude is handing work to Codex.
- Work will continue later and the next agent needs concise state.
- One agent is blocked and needs another agent to investigate.
- A file or decision changed and the next agent must know before editing.

Do not use the mailbox for permanent architecture decisions, requirements, or session summaries. Put those in the appropriate Vault folder.

## Core Commands

Initialize or inspect:

```bash
node .claude/scripts/agent-mailbox.js init
node .claude/scripts/agent-mailbox.js status
node .claude/scripts/agent-mailbox.js list --to claude --open
```

Post an update:

```bash
node .claude/scripts/agent-mailbox.js post --from codex --to claude --subject "Subtitle app capture fix" --body "Changed capture to 48k stereo loopback." --files "Projects/apps/live-subtitle-translator/src/audio/capture.py"
```

Leave a handoff:

```bash
node .claude/scripts/agent-mailbox.js handoff --from codex --to claude --summary "Model now loads before Qt and audio capture is stable." --next "Read logs after the user's next run and decide whether to add WAV capture debug." --files "Projects/apps/live-subtitle-translator/main.py,Projects/apps/live-subtitle-translator/src/audio/chunker.py"
```

Claim and close work:

```bash
node .claude/scripts/agent-mailbox.js claim --id msg-20260612-abc123 --by claude --note "Reviewing logs now."
node .claude/scripts/agent-mailbox.js close --id msg-20260612-abc123 --by claude --note "Log issue diagnosed and documented."
```

Mark blocked:

```bash
node .claude/scripts/agent-mailbox.js block --id msg-20260612-abc123 --by claude --note "Need the latest app_stdout.log from a fresh run."
```

## Message Lifecycle

1. `open` - message exists and is available.
2. `claimed` - an agent is actively working on it.
3. `blocked` - progress needs human input, external state, or another agent.
4. `closed` - work is handled or superseded.

## Handoff Format

A good handoff includes:

- Current state: what changed or what was learned.
- Next action: the single best next step.
- Files: exact paths touched or relevant.
- Blockers: what prevents progress, if anything.
- Verification: commands run or evidence checked.

Keep mailbox messages operational. If the content should remain permanent, also record it in a Vault note, ADR, known problem, or session summary.

## Safety Rules

- Check `git status` before editing shared files.
- Claim mailbox work before making changes for that handoff.
- Never revert another agent's changes unless the user explicitly requests it.
- Include errors and failed commands in the handoff.
- Close messages only after the stated work is actually handled.

## Relationship to Existing Framework Tools

| Tool | Use For |
|------|---------|
| Agent Mailbox | Async status, ownership, handoffs between separate agents |
| Agent Orchestrator | Structured task/subtask execution with dependencies |
| Session Handoff | End-of-session summary generated from retrospectives |
| Agent Memory | Long-term role-specific performance learnings |
| Vault | Permanent project knowledge |

## Success Criteria

- The next agent can start without re-discovering the whole task.
- File ownership and current intent are clear.
- Blockers are explicit.
- Runtime coordination does not pollute git history.
