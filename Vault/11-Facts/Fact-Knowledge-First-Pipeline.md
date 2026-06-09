---
type: fact
status: Current
authority: facts
domain: general
confidence: 0.95
agent_relevance: [architect, backend, frontend, devops, qa]
source: ADR-ARCH-001
tags: [knowledge, architecture, pipeline]
last_updated: 2026-06-09
---

# Fact: Knowledge Is the Primary Asset

**Statement:** Knowledge (ADRs, standards, architecture, session summaries) is the primary asset of the AI Software Factory — not the generated code. Agents must retrieve and apply existing knowledge before making decisions.

**Implications:**

- Every significant decision is recorded as an ADR before/while implementing
- Agents assemble context from the Vault (via Chroma) before acting
- Documentation updates are required, not optional, when behavior changes

**Source:** [[../07-Decisions/ADR-ARCH-001]] (Knowledge-First Pipeline Design), Decision 1 in [[../07-Decisions/DECISIONS.md]]
