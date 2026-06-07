# Major Decisions and Rationale

**Purpose:** Records all major decisions, their rationale, and impact for the AI Software Factory.

**Audience:** AI agents, team members, stakeholders

**Status:** Active - Updated as decisions are made

---

## Core Architecture Decisions (Made in Phase 1)

### Decision 1: Knowledge as Primary Asset

**Date Decided:** 2026-06-07

**Approved By:** Krystian Garcia (Project Lead)

**Decision:** Knowledge (ADRs, standards, architecture, sessions) is the primary asset, not the code itself. The system must preserve and compound knowledge across projects.

**Context:** Traditional software factories focus on code generation and reuse. The AI Software Factory recognizes that institutional knowledge—architectural decisions, lessons learned, failure analysis—is the most valuable asset that compounds over time.

**Alternatives Considered:**
1. **Code-first approach** - Generate and reuse code templates
   - Pros: Faster initial implementation
   - Cons: Knowledge is scattered, lessons don't transfer, each project restarts from scratch

2. **Knowledge-first approach (CHOSEN)**
   - Pros: Knowledge compounds, reduces context switching, enables better decisions
   - Cons: Requires upfront investment in documentation

**Rationale:** Knowledge compounds multiplicatively. The cost of documenting one architectural decision is negligible compared to the cost of rediscovering it in 5 future projects. A knowledge-first system becomes exponentially more valuable with time.

**Impact:**
- Technical: All design decisions driven by knowledge preservation
- Timeline: Phase 2-5 focused on knowledge systems before code generation
- Cost: Higher upfront documentation cost, lower long-term cost
- Risk: Retrieval quality is critical; poor knowledge taxonomy undermines entire system

**Implementation:** 
- Obsidian Vault as source of truth
- Chroma for semantic retrieval
- ADR system for decision recording
- Session summaries for operational knowledge

**Validation:** Track knowledge reuse across projects; measure time saved when architectural patterns are retrieved from knowledge base

**Status:** Active

**Related ADR:** [[ADR-ARCH-001]] — Knowledge-First Pipeline Design

---

### Decision 2: Facts and Sessions Must Be Separate

**Date Decided:** 2026-06-07

**Approved By:** Krystian Garcia (Project Lead)

**Decision:** Authoritative knowledge (approved ADRs, accepted requirements, finalized architecture) must be stored separately in Chroma from exploratory session content.

**Context:** Mixing facts and exploratory content in retrieval causes "retrieval contamination" — agents retrieve speculative content as if it were settled fact, leading to hallucination and cascading errors.

**Alternatives Considered:**
1. **Single unified collection** - All content mixed
   - Pros: Simpler to manage
   - Cons: Retrieval quality degrades, contamination spreads

2. **Separate collections (CHOSEN)**
   - Pros: Clean retrieval, prevents contamination, enables different retention policies
   - Cons: Requires classification discipline

**Rationale:** Retrieval quality is the foundation of a multi-agent system. A single contaminated retrieval can cascade through multiple agents and require extensive rollback.

**Impact:**
- Technical: Chroma collection schema must separate `{project}-facts` from `{project}-sessions`
- Timeline: Must be enforced from Phase 5 (Chroma integration)
- Cost: Minimal (different collection names)
- Risk: HIGH - if violated, all subsequent agent decisions are compromised

**Implementation:**
- `{project}-facts`: Only approved ADRs, finalized architecture, accepted requirements
- `{project}-sessions`: Experimental notes, discussions, research, work logs
- Ingestion rules: Explicit classification before adding to facts

**Validation:** Monitor retrieval quality metrics; audit for mixed content

**Status:** Active

**Related ADR:** [[ADR-DATA-001]] — Chroma Collection Schema & Facts/Sessions Separation (future)

---

### Decision 3: Human Authority Preserved

**Date Decided:** 2026-06-07

**Approved By:** Krystian Garcia (Project Lead)

**Decision:** The human must remain the final authority for all meaningful decisions. The system must not take irreversible actions without explicit human approval.

**Context:** In a Human-in-the-Loop system, the human is the ultimate risk manager. The AI is a tool that amplifies capability, not a replacement for human judgment.

**Alternatives Considered:**
1. **Full automation** - AI makes all decisions autonomously
   - Pros: Maximum speed
   - Cons: Unrecoverable errors, loss of human control

2. **Human-in-the-loop (CHOSEN)**
   - Pros: Human retains control, catches errors, learns from AI suggestions
   - Cons: Slower, requires human discipline

**Rationale:** The cost of an irreversible mistake far exceeds the cost of slowing down to get human approval. Human judgment provides the error-correction feedback loop.

**Impact:**
- Technical: All architecture, infrastructure, and dependency changes require human approval
- Timeline: Adds approval gates to all workflows
- Cost: Human time investment
- Risk: Mitigated - humans catch errors

**Implementation:**
- Verification Agent pre-implementation gate with human sign-off
- All infrastructure/dependency changes flagged for manual approval
- Product direction, business decisions: human-only
- Low-confidence outputs flagged before action

**Validation:** Track decisions that would have been wrong; monitor approval latency

**Status:** Active

**Related ADR:** [[ADR-SEC-001]] — Human Approval Gate Requirements

---

## Technology Decisions

### Decision 4: Obsidian + Chroma for Knowledge Layer

**Date Decided:** 2026-06-07

**Approved By:** Krystian Garcia

**Decision:** Use Obsidian as the source of truth (durable, human-readable, versionable) and Chroma for semantic retrieval (context assembly, similarity search).

**Rationale:**
- Obsidian: Markdown is human-writable, git-versionable, survives tool obsolescence
- Chroma: Pure vector database, fast semantic search, explicit schema for facts/sessions
- Combination: Humans author in Obsidian, AI retrieves via Chroma

**Status:** Active

**Related ADR:** [To be created in Phase 2 - ADR-INFRA-001]

---

### Decision 5: Docker for Execution and Isolation

**Date Decided:** 2026-06-07

**Approved By:** Krystian Garcia

**Decision:** All execution environments (services, agents, databases) must run in Docker containers via Docker Compose.

**Rationale:**
- Reproducibility: Any project can be rebuilt from Git + Docker Compose
- Isolation: Agent workspaces don't interfere with each other
- Local-first: All core components run locally

**Status:** Active

**Related Technologies:** [[02-Technologies/Docker]]

---

## Process Decisions

### Decision 6: ADR Categories with Prefixes

**Date Decided:** 2026-06-07

**Approved By:** Krystian Garcia

**Decision:** Architecture Decision Records (ADRs) use category prefixes (ADR-ARCH-001, ADR-SEC-001, etc.) rather than plain numbering.

**Rationale:** Category prefixes enable semantic organization and retrieval. Agents can search for "all security decisions" or "all architecture decisions."

**Categories:**
- ARCH: Architecture decisions
- SEC: Security decisions
- DATA: Data/database decisions
- INFRA: Infrastructure decisions
- API: API design decisions
- INT: Integration decisions

**Status:** Active

**Related Document:** [[01-Standards/Documentation Standards]]

---

## Agent Role Decisions

### Decision 7: 8 Specialized Agent Roles

**Date Decided:** 2026-06-07

**Approved By:** Krystian Garcia

**Decision:** Define 8 specialized AI agent roles with clear responsibilities instead of a single generalist agent.

**Roles:**
1. Architect (Opus) — System design, ADRs
2. Backend (Sonnet) — API, database, business logic
3. Frontend (Sonnet) — UI, components, state
4. QA (Sonnet) — Testing, bug detection
5. Security (Opus) — Threat analysis, compliance
6. DevOps (Sonnet) — Docker, deployment
7. Documentation (Haiku) — Docs, session summaries
8. Verification (Opus) — Pre-implementation gate

**Rationale:** Specialization enables:
- Better outputs per role
- Clear responsibility boundaries
- Cost optimization (smaller models where possible)
- Knowledge consolidation per domain

**Status:** Active

**Related Document:** [[05-Prompts/AI_SKILLS.md]]

---

## Roadmap Decisions

### Decision 8: Knowledge System Before Code Generation

**Date Decided:** 2026-06-07

**Approved By:** Krystian Garcia

**Decision:** Prioritize knowledge system development (Phases 1-5) before code generation and multi-agent orchestration (Phases 6-13).

**Rationale:** A retrieval system built on poor knowledge will compound errors. Knowledge quality must be established first.

**Phase Order:**
1. Foundation (infrastructure)
2. Knowledge System (documentation, standards)
3. Requirements Management (structured requirements)
4. Fact/Session Separation (Chroma schema)
5. Chroma Integration (semantic retrieval)
6-13. Code generation, agents, orchestration

**Status:** Active

**Related Document:** [[03-Projects/AI Software Factory/Roadmap]]

---

## Pending Decisions

| Decision | Timeline | Owner | Status |
|----------|----------|-------|--------|
| Which MCP servers to prioritize (GitHub, Jira, AWS?) | Phase 12 | TBD | Pending |
| Docker networking strategy for agent containers | Phase 12 | DevOps Agent | Pending |
| Chroma persistence and backup strategy | Phase 5 | DevOps Agent | Pending |
| Cost optimization thresholds (when to use Haiku vs Sonnet vs Opus) | Phase 9 | Architect Agent | Pending |
| Knowledge retention policy (how long to keep sessions?) | Phase 11 | TBD | Pending |

---

## Decision Categories

### Architecture (ADR-ARCH-xxx)

These decisions define system structure:

- Decision 1: Knowledge-first architecture → [[ADR-ARCH-001]]
- Decision 8: Phases prioritization → [[Roadmap]]
- [Future: Microservices patterns (ADR-ARCH-002), caching strategy (ADR-ARCH-003)]

### Data (ADR-DATA-xxx)

These decisions define data storage and retrieval:

- Decision 2: Facts/sessions separation → [[ADR-DATA-001]]
- [Future: Database migration strategy (ADR-DATA-002), backup and recovery (ADR-DATA-003)]

### API (ADR-API-xxx)

These decisions define API design and evolution:

- RESTful API Design Conventions → [[ADR-API-001]]
- [Future: Pagination strategy (ADR-API-002), versioning deprecation (ADR-API-003)]

### Integration (ADR-INT-xxx)

These decisions define external system integration:

- MCP Server Integration Policy → [[ADR-INT-001]]
- [Future: Webhook strategy (ADR-INT-002), rate limiting (ADR-INT-003)]

### Infrastructure (ADR-INFRA-xxx)

These decisions define deployment and operations:

- Decision 4: Obsidian + Chroma
- Decision 5: Docker containerization
- [Future: Networking (ADR-INFRA-002), monitoring (ADR-INFRA-003), backup (ADR-INFRA-004)]

### Security (ADR-SEC-xxx)

These decisions define security posture:

- Decision 3: Human authority preservation → [[ADR-SEC-001]]
- [Future: Authentication (ADR-SEC-002), authorization (ADR-SEC-003), encryption (ADR-SEC-004)]

### Process (ADR-PROC-xxx)

These decisions define workflow and governance:

- ADR Authoring and Review Workflow → [[ADR-PROC-001]]
- Decision 6: ADR categories (operationalized in ADR-PROC-001)
- Decision 7: Agent roles → [[AI_SKILLS.md]]
- [Future: Approval workflows (ADR-PROC-002), escalation (ADR-PROC-003)]

---

## Decision Impact Analysis

### High Impact Decisions
These affect multiple areas and the entire system:
- Decision 1: Knowledge-first approach (affects all phases)
- Decision 2: Facts/sessions separation (affects retrieval quality)
- Decision 3: Human authority (affects all workflows)

### Medium Impact Decisions
These affect one major area:
- Decision 5: Docker containerization (affects Phase 1, 12)
- Decision 8: Phase prioritization (affects roadmap)

### Low Impact Decisions
These affect specific areas:
- Decision 6: ADR naming (affects documentation only)
- Decision 7: Agent role count (can be adjusted later)

---

## Risk from Decisions

| Decision | Risk | Mitigation |
|----------|------|-----------|
| Knowledge-first approach | Knowledge quality determines system quality | Phase 2-4 standards + review gates |
| Facts/sessions separation | Enforcement discipline required | Automated classification rules |
| Human authority preservation | Slower decision-making | Design workflows to minimize approval latency |
| Obsidian dependency | Tool obsolescence risk | Markdown is portable; can migrate to any tool |
| Docker for everything | Learning curve, operational complexity | Docker Compose simplification |
| Agent specialization | Coordination complexity increases | Verification Agent pre-gate, clear handoffs |

---

## Decision Timeline

| Date | Decision | Category | Status |
|------|----------|----------|--------|
| 2026-06-07 | Knowledge-first architecture | ARCH | Active |
| 2026-06-07 | Facts/sessions separation | ARCH | Active |
| 2026-06-07 | Human authority preserved | SEC | Active |
| 2026-06-07 | Obsidian + Chroma | INFRA | Active |
| 2026-06-07 | Docker containerization | INFRA | Active |
| 2026-06-07 | ADR categories | PROC | Active |
| 2026-06-07 | 8 agent roles | PROC | Active |
| 2026-06-07 | Phase prioritization | PROC | Active |

---

## Superseded Decisions

[None yet - this is the initial release]

---

## Related Documents

- [[01-Standards/Documentation Standards]] — Guides ADR creation
- [[03-Projects/AI Software Factory/Architecture/Current]] — Architecture implementing these decisions
- [[03-Projects/AI Software Factory/Roadmap]] — Roadmap based on these decisions
- [[05-Prompts/AI_SKILLS.md]] — Agent roles from Decision 7
- [[02-Technologies/MCP_SERVERS.md]] — MCP planning from Decision 4

---

**Last Updated:** 2026-06-07
**Total Decisions:** 8
**Active Decisions:** 8
**Pending Decisions:** 5
**Superseded Decisions:** 0
