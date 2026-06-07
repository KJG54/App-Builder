# Agent Library

**See also:** [[../INDEX.md|Vault INDEX]] | [[../STATUS.md|STATUS]]

---

## Overview

This folder contains **AI agent instruction prompts** that define each agent's role, capabilities, and constraints within the Application Builder Framework.

**Agents are Claude models with specialized instructions** for different tasks:
- **Architect** — System design and technology decisions (Claude Opus)
- **Backend** — API and database implementation (Claude Sonnet)
- **Frontend** — UI components and accessibility (Claude Sonnet)
- **DevOps** — Infrastructure and deployment (Claude Sonnet)

---

## The 4 Agents

| Agent | Model | Role | When Active | Reference |
|-------|-------|------|---|----------|
| **Architect** | Claude Opus | Design systems, evaluate technologies, make architecture decisions | Phase 3+ | [[Architect.md|Architect Prompt]] |
| **Backend** | Claude Sonnet | Implement APIs, business logic, databases | Phase 5+ | [[Backend.md|Backend Prompt]] |
| **Frontend** | Claude Sonnet | Build UI, components, accessibility | Phase 5+ | [[Frontend.md|Frontend Prompt]] |
| **DevOps** | Claude Sonnet | Containerize, deploy, monitor, scale | Phase 5+ | [[DevOps.md|DevOps Prompt]] |

---

## Agent Capabilities Matrix

| Agent | Read Architecture | Design APIs | Implement Code | Deploy | Manage Infra | Query Chroma | Approve Code |
|-------|---|---|---|---|---|---|---|
| Architect | ✅ | ✅ | - | - | - | ✅ | ✅ |
| Backend | ✅ | ✅ | ✅ | - | - | ✅ | ✅ |
| Frontend | ✅ | - | ✅ | - | - | ✅ | ✅ |
| DevOps | ✅ | - | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## How to Use These Prompts

Each prompt includes:

1. **Core Identity** — What is this agent's role?
2. **Capabilities** — What can it do (Tier 1-2, Tier 3, blocked actions)?
3. **Standards** — Which standards must it follow?
4. **Process** — Step-by-step workflow for common tasks
5. **Quality Gate** — Checklist before submitting work
6. **Constraints** — What it cannot do
7. **Meta-Prompt** — Optimization priorities

**To invoke an agent:**
1. Load the appropriate prompt (Architect.md, Backend.md, etc.)
2. Provide task context (what needs to be done?)
3. Agent will query standards, architecture, prior decisions from vault
4. Agent designs/implements following established patterns
5. Use quality gate checklist before submitting

---

## Agent Authority Tiers

Agents operate under **Approval Tiers** from [[../07-Decisions/ADR-SEC-001.md|ADR-SEC-001]]:

| Tier | Agent Can... | Example | Requires |
|------|----------|---------|----------|
| **Tier 1** | Direct action, audit logged | Code review, write tests, refactor | Nothing |
| **Tier 2** | Action, code review required | Create PR, push to staging, write API | Code review approval |
| **Tier 3** | Action, requires approval | Merge to main, deploy staging | Human approval |
| **Tier 4** | Propose only | Change tech stack, database strategy | Human decision |
| **Tier 5** | Escalate only | Delete databases, force push main | Human-only action |

Each agent prompt specifies which tiers it operates in.

---

## When Each Agent Activates

**Phase 3:** Architect begins design work  
**Phase 5:** Backend, Frontend, DevOps implement  
**Phase 6+:** All agents operational in steady state

---

## Creating or Updating a Prompt

To create a new agent prompt:

1. **Use template:** [[../Templates/Prompt.md|Prompt template]]
2. **Define role:** What is this agent's specialty?
3. **List capabilities:** What can it do? What tiers?
4. **Document constraints:** What it cannot do
5. **Define process:** Step-by-step workflow for common tasks
6. **Create quality gate:** Checklist before submitting work
7. **Test:** Have the agent perform a task; verify it follows the prompt

To update an existing prompt:
1. Document the change (what's being updated and why?)
2. Increment version number
3. Create ADR if this changes agent authority
4. Test the updated prompt

---

## Prompt Versioning

Each prompt has a **version** and **status**:
- **Status:** Draft, Active, Deprecated
- **Version:** 1.0, 1.1, 2.0 (backward-incompatible)

When updating a prompt:
- **Minor changes** (clarifications, examples): 1.0 → 1.1
- **Major changes** (new capabilities, new constraints): 1.0 → 2.0
- Create ADR if authority changes (Tier 3+)

---

## Cross-References

**Each agent prompt includes:**
- Links to applicable [[../01-Standards/README.md|Standards]]
- Links to applicable [[../07-Decisions/README.md|ADRs]]
- Links to applicable [[../04-Workflows/README.md|Workflows]]

**Standards reference agents:**
- [[../01-Standards/Architecture Standards.md|Architecture Standards]] → Architect agent
- [[../01-Standards/Coding Standards.md|Coding Standards]] → Backend, Frontend, DevOps agents
- [[../01-Standards/Security Standards.md|Security Standards]] → All agents
- [[../01-Standards/Documentation Standards.md|Documentation Standards]] → All agents

**Workflows use agents:**
- [[../04-Workflows/New Project.md|New Project]] → Architect
- [[../04-Workflows/Build API.md|Build API]] → Architect (design) + Backend (implement)
- [[../04-Workflows/Deploy Service.md|Deploy Service]] → DevOps

---

## FAQ

**Q: How are agents different from people?**  
A: Agents are Claude models with specialized instructions. They follow the same standards, workflows, and approval gates as humans. Key difference: agents can't make Tier 4-5 decisions (human-only).

**Q: What if an agent gets it wrong?**  
A: Code review catches it. The quality gate checklist in each prompt helps agents self-verify before submitting. If issues persist, update the prompt.

**Q: Can agents collaborate?**  
A: Yes. For example: Architect designs, Backend implements, DevOps deploys. Each agent knows its role and constraints.

**Q: Can I create a new agent?**  
A: Yes. Use [[../Templates/Prompt.md|Prompt template]], define role, capabilities, constraints. New agents require Tier 3 approval (ADR).

---

**See also:** [[../INDEX.md|Vault INDEX]] | [[../01-Standards/README.md|Standards Navigator]] | [[../07-Decisions/README.md|ADR Guide]]
