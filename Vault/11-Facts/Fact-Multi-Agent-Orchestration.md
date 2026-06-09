---
type: fact
status: Current
authority: facts
domain: general
confidence: 0.9
agent_relevance: [architect, backend, devops]
tags: [orchestration, agents, escalation]
source: ADR-ARCH-002
last_updated: 2026-06-09
---

# Fact: Orchestration Uses Human-Specified Decomposition and Escalation-on-Failure

**Statement:** Multi-agent tasks use human-specified task decomposition. Agents receive prior subtask outputs as context and escalate failures to the approval workflow rather than retrying autonomously.

**Implications:**

- `agent-orchestrator.js` enforces ID-based dependencies with cycle detection
- Context flows between agents: design → code → tests
- Failed subtasks route to `approval-workflow.js` escalations, honoring human approval gates

**Source:** [[../07-Decisions/ADR-ARCH-002]], Decision 10 in [[../07-Decisions/DECISIONS.md]]
