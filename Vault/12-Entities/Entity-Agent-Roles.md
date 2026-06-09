---
type: entity
status: Current
authority: facts
entity_kind: agent
domain: general
agent_relevance: [architect, backend, frontend, devops, qa]
tags: [agents, roles, registry]
last_updated: 2026-06-09
---

# Entity: Agent Roles

The 8 specialized agent roles defined by Decision 7 ([[../07-Decisions/DECISIONS.md]]).

| Role | Model Tier | Responsibility | Orchestrated |
|------|-----------|----------------|--------------|
| Architect | Opus | System design, ADRs | ✅ `architect` |
| Backend | Sonnet | API, database, business logic | ✅ `backend` |
| Frontend | Sonnet | UI, components, state | ✅ `frontend` |
| QA | Sonnet | Testing, bug detection | ✅ `qa` |
| DevOps | Sonnet | Docker, deployment | ✅ `devops` |
| Security | Opus | Threat analysis, compliance | — (review gate) |
| Documentation | Haiku | Docs, session summaries | — (support) |
| Verification | Opus | Pre-implementation gate | — (review gate) |

**Interfaces:**

- Orchestrated roles are validated by the authorization matrix in `.claude/scripts/mcp-authorization.js`
- Each orchestrated role has a memory directory: `Vault/14-Agent-Memory/<role>/`
- Performance metrics per role live in `.claude/metrics/<role>/<version>/outputs.json` (the `test` metrics directory maps to the `qa` role)

**Related:** [[../11-Facts/Fact-Agent-Role-Specialization]] | [[../05-Prompts/AI_SKILLS.md]]
