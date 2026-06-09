---
type: fact
status: Current
authority: facts
domain: general
confidence: 0.9
agent_relevance: [architect, backend, frontend, devops, qa]
tags: [agents, roles, orchestration]
source: DECISIONS.md#decision-7
last_updated: 2026-06-09
---

# Fact: Eight Specialized Agent Roles, Not One Generalist

**Statement:** The factory defines 8 specialized agent roles — Architect, Backend, Frontend, QA, Security, DevOps, Documentation, Verification — each with clear responsibility boundaries and an appropriate model tier.

**Implications:**

- The authorization matrix (`mcp-authorization.js`) validates agent roles: architect, backend, frontend, devops, qa
- Each orchestrated agent has its own memory directory under [[../14-Agent-Memory/README|14-Agent-Memory]]
- Smaller models handle lower-complexity roles for cost optimization

**Source:** Decision 7 in [[../07-Decisions/DECISIONS.md]], [[../05-Prompts/AI_SKILLS.md]]
