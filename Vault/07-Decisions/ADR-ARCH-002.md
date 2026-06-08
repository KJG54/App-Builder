---
type: Decision
phase: 13
status: Accepted
authority: facts
chroma_collection: global-standards
tags: [architecture, multi-agent, orchestration, phase-13]
related: [ADR-ARCH-001, ADR-SEC-001, Phase-13-Multi-Agent-Collaboration]
last_updated: 2026-06-08
---

# ADR-ARCH-002: Multi-Agent Orchestration Design

**Date:** 2026-06-08  
**Status:** Accepted  
**Phase:** 13 — Multi-Agent Collaboration  
**Category:** Architecture (ARCH)

---

## Decision

Phase 13 implements **multi-agent orchestration** using human-guided task decomposition with a dependency-aware orchestrator. Agents work in parallel or sequence (based on dependencies) on shared tasks, with all context flowing between agents via completed outputs.

**Key design choices:**
1. **Human-specified subtasks** (not AI auto-decomposition)
2. **Escalate on failure** (agent failure blocks task; human decides next step)
3. **Context sharing** (each agent sees all prior work on the task)
4. **DAG-based dependency model** (subtasks form a directed acyclic graph, not strictly sequential)
5. **Slack notifications optional** (graceful no-op without token)

---

## Context

### Problem: Single-Agent Limitations

A single agent can design an API, but not deploy it. A single agent can write code, but not run tests. Many software tasks require **multiple specialized agents** working together:
- Architect designs → Backend implements → QA tests → DevOps deploys

Phases 1–12 gave agents tools (GitHub, Filesystem MCP), quality gates (Phase 10), and knowledge access (Chroma). But agents still work in isolation. Without orchestration, a human must manually hand off between agents.

### Why Human-Specified Decomposition?

**Alternative 1: AI auto-decomposes tasks**
- Pros: Flexible, handles novel tasks
- Cons: Error-prone, hard to debug, no human control

**Alternative 2: Human specifies subtasks (CHOSEN)**
- Pros: Predictable, human validates decomposition before execution, clear ownership
- Cons: Requires upfront human work

We choose human decomposition because **correctness > flexibility** for Phase 13. Agents auto-decomposing can split "Build feature" into incompatible subtasks; a human can ensure subtasks are well-ordered.

### Why Escalate on Failure (not Retry)?

**Alternative 1: Agents retry failed subtasks**
- Pros: More autonomous, might self-heal
- Cons: Can mask real problems, wastes tokens

**Alternative 2: Escalate on failure (CHOSEN)**
- Pros: Human reviews failure, decides next step, preserves intent
- Cons: Slower, requires human attention

We choose escalation because it aligns with [[ADR-SEC-001]] (Human Authority Preserved). If an agent fails, humans should decide whether to retry, escalate to a different agent, or redesign the subtask.

### Why Context Sharing?

Agents need to see prior work to build on it:
- Backend needs Architect's API design
- QA needs Backend's implementation
- DevOps needs test results before deploying

Context is shared by passing completed subtask outputs as input to the next agent. This is simpler than a shared database and keeps context localized to the task.

---

## Implementation

### Task Structure

A **task** is a unit of work with human-specified subtasks:

```json
{
  "id": "task-20260608-abc123",
  "description": "Build user authentication feature",
  "status": "in_progress",
  "created": "2026-06-08T16:00:00Z",
  "subtasks": [
    {
      "id": "subtask-001",
      "agent": "architect",
      "description": "Design auth API and schema",
      "status": "complete",
      "depends_on": [],
      "output_file": ".claude/tasks/subtask-001-output.md"
    },
    {
      "id": "subtask-002",
      "agent": "backend",
      "description": "Implement auth endpoints",
      "status": "in_progress",
      "depends_on": ["subtask-001"]
    }
  ]
}
```

### Orchestrator Responsibilities

1. **Create tasks** with subtask definitions
2. **Get next subtask** (respecting dependencies)
3. **Assign subtask** to agent with context
4. **Record output** when agent completes
5. **Escalate on failure** (mark blocked, trigger Phase 10 approval)
6. **Share context** (pass prior outputs to next agent)

### Context Flow

```
Task: "Build auth feature"
Subtasks (human-specified):
  1. Architect: Design API → Output: API spec
  2. Backend: Implement API (depends on 1) → Input: API spec
  3. QA: Test API (depends on 2) → Input: Implementation + spec
  4. DevOps: Deploy (depends on 3) → Input: Tests + code
```

Each agent receives:
```javascript
{
  task_id: "task-xyz",
  subtask: { agent, description, ... },
  context: {
    task_description: "Build auth feature",
    prior_outputs: [
      { agent: "architect", output: "# API Design\n..." },
      { agent: "backend", output: "// Code\n..." }
    ]
  }
}
```

### Dependency Model (DAG, not Sequential)

Subtasks form a **directed acyclic graph**:

```
Design API ──┬──> Implement Backend
             └──> Generate SDK (parallel)
                  ↓
             Test (depends on both)
```

This allows:
- Parallel work when possible (Design + Document in parallel)
- Reordering subtasks based on dependencies
- Skipping optional subtasks

### Escalation Workflow

If agent fails:
1. Orchestrator marks subtask as `blocked`
2. Escalation fired to Phase 10 approval workflow
3. Human approves one of:
   - **Retry:** Agent tries again
   - **Reassign:** Different agent takes subtask
   - **Redesign:** Cancel task, create new with adjusted subtasks
   - **Escalate:** Route to senior human (e.g., architect for design issues)

### Why Slack is Optional (not Critical Path)

Slack notifications are **not an approval channel**. Approvals stay in Phase 10 (code review, escalation workflow). Slack is:
- Async status updates ("Task complete!")
- Alert channel for escalations ("⚠️ Backend step failed")
- Not: approval requests, tool access, production decisions

If `SLACK_TOKEN` not set, orchestrator logs to console and continues. No failure. This keeps orchestration independent of Slack.

### Why PostgreSQL/Jira/AWS Deferred

**PostgreSQL:** Requires new Docker service + infra ADR (separate governance). Orchestration works without it.

**Jira/Linear:** Requires SaaS credentials not in scope for Phase 13. Orchestration works without it.

**AWS:** Cloud creds + higher risk. Not needed for orchestration demo.

All three can be added in Phase 14 as MCP servers (same framework as Phase 12).

---

## Related Standards

- [[ADR-ARCH-001]] — Knowledge-First Pipeline (orchestration is Phase 2 of the pipeline)
- [[ADR-SEC-001]] — Human Authority Preserved (escalation honors approval tiers)
- [[Architecture Standards]] — Service decomposition, clear boundaries

---

## Related Decisions

**Phase 12:** GitHub + Filesystem MCP integration (agents have tools)  
**Phase 10:** Review Pipeline (approval workflow for escalations)  
**Phase 8:** Verification Layer (agents' outputs are validated)

---

## Consequences

### Positive

✅ **Agents coordinate on complex tasks** without human intervention between steps  
✅ **Context flows explicitly** — agents see prior work and can build on it  
✅ **Humans control task decomposition** — no AI black-box splitting tasks  
✅ **Failures escalate safely** — Phase 10 approval gates preserved  
✅ **Extensible design** — more agents/servers can be added without redesign  
✅ **Optional Slack** — works fine without it (graceful degradation)  

### Negative

❌ **Humans must decompose tasks** (can't auto-decompose novel problems)  
❌ **No retry/healing loops** (failures escalate immediately; slower)  
❌ **No ML-based optimization** (task ordering not learned; Phase 14+)  
❌ **Storage is files, not database** (doesn't scale to 1000s of tasks)  

### Mitigations

- Phase 14 can add AI task decomposition if human bottleneck identified
- Phase 14 can add retry/healing if needed
- Migrate to database storage if scale demands it

---

## Approval

- ✅ **Reviewed by:** Phase 13 Planning
- ✅ **Approved by:** User (Phase 13 plan approval)
- ✅ **Status:** Accepted
- ✅ **Ratified:** 2026-06-08

---

## Revision History

**v1.0 (2026-06-08):** Initial ADR establishing multi-agent orchestration design
- Human-specified task decomposition rationale
- Escalate-on-failure strategy (vs. retry)
- Context sharing via prior outputs
- DAG-based dependency model
- Optional Slack notifications
- PostgreSQL/Jira/AWS deferral justification

---

**Last Updated:** 2026-06-08  
**Status:** Production Ready  
**Test Coverage:** 10/10 validation tests passing
