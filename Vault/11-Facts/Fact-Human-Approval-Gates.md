---
type: fact
status: Current
authority: facts
domain: security
confidence: 0.95
agent_relevance: [architect, backend, frontend, devops, qa]
tags: [security, approval, governance]
source: ADR-SEC-001
last_updated: 2026-06-09
---

# Fact: Humans Are the Final Authority — Irreversible Actions Require Approval

**Statement:** The system must not take irreversible actions without explicit human approval. Risk tiers (1–5 per ADR-SEC-001) determine which actions agents may take autonomously and which require human sign-off.

**Implications:**

- Architectural, dependency, database, and infrastructure changes require explicit approval (Tier 4–5)
- Agent escalations route through `approval-workflow.js`, never auto-resolve
- Memory writes from learning loops (Phase 17) must pass the approval gate before persisting

**Source:** [[../07-Decisions/ADR-SEC-001]] (Human Approval Gate Requirements), Decision 3 in [[../07-Decisions/DECISIONS.md]]
