---
type: Decision
phase: 2
status: Accepted
authority: facts
chroma_collection: global-standards
tags: [architecture, knowledge-first, pipeline, core-decision]
related: [ADR-SEC-001, ADR-DATA-001, Architect.md, Backend.md, Frontend.md, DevOps.md]
last_updated: 2026-06-07
---

# ADR-ARCH-001: Knowledge-First Pipeline Design

**Date:** 2026-06-07  
**Status:** Accepted  
**Phase:** 2 — Knowledge System Development  
**Category:** Architecture (ARCH)

---

## Decision

The Application Builder Framework uses a **Knowledge-First Pipeline** architecture. This means:

1. **Knowledge is the primary asset** — System is organized around building and leveraging a growing knowledge base
2. **Pipeline model** — Work flows through distinct phases: Knowledge → Context → Planning → Verification → Implementation → Preservation
3. **Each phase uses knowledge** — Every phase queries and builds upon the knowledge system
4. **Agent specialization** — Specialized agents (Architect, Backend, Security, etc.) work within their domains using phase-specific knowledge

This is the core architectural decision that shapes all other decisions and system design.

---

## Context

### The Problem: Knowledge Waste

Traditional software development workflow:
```
Build code → Deploy → Run → Lessons learned → (Knowledge forgotten)
                                                      ↓
Next project: Start from scratch, repeat same mistakes
```

**Cost:** Every project reinvents solutions, rediscovers problems, relearns lessons.

### The Application Builder Framework Solution

Instead of code-first, use **knowledge-first**:
```
Accumulate knowledge → Use knowledge to plan → Build code → Validate → Archive knowledge

Future projects: Query knowledge base → Accelerate planning → Reduce development time
```

**Benefit:** Knowledge compounds multiplicatively. Second project is faster because it uses lessons from the first.

---

## The Knowledge-First Pipeline

### Phase 1: Knowledge Collection and Organization

**Goal:** Establish knowledge system with standards, architecture, and decisions.

**Work:**
- Document standards (Security, Architecture, Coding, Documentation)
- Create decision architecture (ADRs with reasoning)
- Build templates for future work
- Establish conventions and patterns

**Output:** Organized knowledge base in Obsidian Vault + Chroma semantic index

**Agents involved:** Documentation Agent, Architect Agent

---

### Phase 2: Context Assembly

**Goal:** Gather knowledge relevant to current work.

**Work:**
- Query Chroma for similar decisions
- Pull relevant standards and architectural patterns
- Identify applicable templates
- Understand constraints from prior decisions

**Process:**
```
User request → Identify scope (what project/feature?)
            → Query Chroma collections:
              - global-standards (applicable rules)
              - {project}-facts (decisions for this project)
              - {project}-architecture (current design)
              - Relevant ADRs (precedents)
            → Assemble context
            → Present to planning phase
```

**Output:** Context summary with relevant knowledge

**Agents involved:** Context Builder (future), Architect Agent

---

### Phase 3: Planning

**Goal:** Design solution using context from Phase 2.

**Work:**
- Review assembled context
- Identify decision points
- Evaluate alternatives using prior decisions
- Design approach
- Get human approval (Tier 3 approval gate)

**Usage of knowledge:**
- Reference prior ADRs to check for conflicts
- Use standards as design constraints
- Apply architectural patterns from {project}-architecture
- Check requirements from {project}-facts

**Output:** Approved plan with explicit references to decision basis

**Agents involved:** Architect Agent, Specialist Agents (Backend, Frontend, Security, DevOps)

---

### Phase 4: Verification

**Goal:** Check plan against system constraints and consistency.

**Work:**
- Verify plan matches [[ADR-ARCH-001]] (this decision)
- Verify plan respects [[ADR-SEC-001]] (approval gates)
- Check plan against [[Security Standards]], [[Architecture Standards]]
- Identify risks and edge cases
- Validate assumptions

**Output:** Verification report; approved/rejected for implementation

**Agents involved:** Verification Agent, Security Agent

---

### Phase 5: Implementation

**Goal:** Execute plan while building for knowledge preservation.

**Work:**
- Write code following [[Coding Standards]]
- Make architectural decisions: document in ADRs
- Test thoroughly
- Prepare for knowledge archival

**Output:** Tested code, new ADRs, implementation notes

**Agents involved:** Backend, Frontend, DevOps, Security agents

---

### Phase 6: Preservation

**Goal:** Archive implementation learnings for future projects.

**Work:**
- Document decisions made (create ADRs if not done in Phase 5)
- Record lessons learned
- Update {project}-architecture with v[X] versioning
- Ingest code patterns into Chroma
- Create session summary
- Link architecture to implementation

**Output:** Preserved knowledge that increases system value over time

**Agents involved:** Documentation Agent, Architect Agent

---

## Pipeline Flow Diagram

```
User Request
     ↓
Phase 1: Knowledge ← Build/maintain Vault, standards, ADRs
     ↓
Phase 2: Context ← Query Chroma; assemble relevant knowledge
     ↓
Phase 3: Planning ← Design using context; get approval
     ↓
Phase 4: Verification ← Validate against standards
     ↓
Phase 5: Implementation ← Build code; create new ADRs
     ↓
Phase 6: Preservation ← Archive learnings; update Vault
     ↓
Knowledge Base grows ← Chroma indexed; available for next project
```

---

## Why This Architecture

### Knowledge Compounds

- Project 1: Build knowledge base (10 hour investment)
- Project 2: Reuse knowledge (5 hours saved)
- Project 3: Reuse + build (8 hours saved)
- Project 4+: Accelerating returns (15+ hours saved per project)

**Formula:** Knowledge value = (effort to create) × (number of future uses)

### Specialization Works

Each agent specializes in one domain and focuses on it:
- Architect: System design, ADRs, technology selection
- Backend: APIs, databases, business logic
- Frontend: UI, components, state management
- Security: Threat modeling, vulnerability analysis
- DevOps: Deployment, infrastructure, containerization

**Result:** Higher quality work; less context switching; reduced mistakes

### Knowledge-First Prevents Rework

Without knowledge:
```
Feature request → Design 1 → Find conflict with prior decision → Redesign
                                                                    ↓
                                                          Waste: 40% of effort
```

With knowledge:
```
Feature request → Query prior decisions → Design using constraints → Implement
                                                                            ↓
                                                                  Efficient: 100% effort used
```

### Reproducibility and Learning

Each project documents:
- Why we made each decision (reasoning in ADRs)
- What alternatives we considered (in ADRs)
- What we learned (in session summaries)

Future projects can:
- Avoid repeating the same mistakes
- Adapt solutions faster
- Make better trade-off decisions

---

## Agent Roles in the Pipeline

### Architect Agent (Opus)
- Phases: 1 (knowledge), 3 (planning), 6 (preservation)
- Work: System design, ADR authoring, technology selection
- Authority: Tier 3 decisions (proposes, human approves)
- Constraints: Must respect [[ADR-ARCH-001]], [[ADR-SEC-001]]

### Backend Agent (Sonnet)
- Phases: 3 (planning), 5 (implementation)
- Work: API design, database design, business logic
- Authority: Tier 2 decisions (codes, human reviews)
- Constraints: Must follow [[Architecture Standards]], [[Security Standards]]

### Frontend Agent (Sonnet)
- Phases: 3 (planning), 5 (implementation)
- Work: UI components, state management, accessibility
- Authority: Tier 2 decisions (codes, human reviews)
- Constraints: Must follow [[Architecture Standards]], [[Coding Standards]]

### Security Agent (Opus)
- Phases: 2 (context), 4 (verification)
- Work: Threat modeling, vulnerability analysis, security review
- Authority: Tier 3 decisions (recommends, human decides)
- Constraints: Must follow [[Security Standards]]

### DevOps Agent (Sonnet)
- Phases: 3 (planning), 5 (implementation)
- Work: Docker setup, deployment pipelines, infrastructure-as-code
- Authority: Tier 2 decisions (codes, human reviews)
- Constraints: Must follow [[Architecture Standards]]

### Verification Agent (Opus)
- Phases: 4 (verification), 6 (preservation)
- Work: Validate plans, check consistency, identify risks
- Authority: Tier 2 decisions (reports, human decides)
- Constraints: Must check against all standards and ADRs

### Documentation Agent (Haiku)
- Phases: 1 (knowledge), 6 (preservation)
- Work: Write documentation, session summaries, templates
- Authority: Tier 1 (codes autonomously)
- Constraints: None; documentation rarely breaks things

See [[AI_SKILLS.md]] for full agent capability matrix.

---

## Implementation Timeline

- **Phase 1 (Now):** Establish knowledge system, document standards
- **Phase 2 (Now):** Create decision architecture (ADRs)
- **Phase 3 (Next):** Requirements management; validate knowledge structure
- **Phase 4 (Future):** Chroma integration; semantic search optimization
- **Phase 5 (Future):** Agent skill development; refine pipeline
- **Phase 6+:** Full pipeline operation; knowledge compounds

---

## Related Standards

[[Architecture Standards]] — Service design, versioning, technology selection  
[[Security Standards]] — Threat modeling, agent authority constraints  
[[Coding Standards]] — Implementation patterns within phases  
[[Documentation Standards]] — Knowledge preservation requirements

---

## Related Decisions

**Decision 1:** Knowledge-First Architecture — This ADR (ADR-ARCH-001)  
**Decision 2:** Facts/Sessions Separation — [[ADR-DATA-001]]  
**Decision 3:** Human Authority Preserved — [[ADR-SEC-001]]  
**Decision 8:** Phase Prioritization (Knowledge before code) — [[DECISIONS.md]]

---

## Consequences

### Positive
✅ Knowledge reuse reduces development time for future projects  
✅ Clear pipeline reduces decision paralysis  
✅ Specialization improves code quality  
✅ Decision rationale preserved; future teams understand why  
✅ Measurable progress (phases provide clear milestones)  
✅ Reproducible process (future projects can follow same pipeline)  

### Negative
❌ Requires upfront investment in knowledge system (Phase 1)  
❌ Knowledge maintenance overhead (keep Vault current)  
❌ Pipeline adds latency (can't skip phases)  
❌ Agents must learn domain knowledge (not immediate value)  

### Mitigations
- Phase 1 investment pays back in Project 2 (knowledge reuse)
- Chroma automates knowledge queries (reduces manual lookup)
- Parallel phases reduce latency (Context and Planning can overlap)
- Agent training is investment (pays back across all projects)

---

## Trade-offs

**Alternative: Code-First Pipeline** (traditional development)
- Faster initial project (no knowledge overhead)
- Slower for Project 2+ (rework mistakes)
- Knowledge lost (high turnover cost)
- Not suitable for AI-driven development

**Alternative: Documentation-Only** (wiki or git docs)
- Easier to update (humans write manually)
- Not queryable (Chroma requires structured data)
- No semantic search (must know exact terms)
- Slower context assembly

**Our Choice: Knowledge-First + Chroma**
- Slower Project 1, faster Project 2+ (better long-term)
- Queryable (Chroma semantic search)
- Preserves rationale (ADRs + session summaries)
- Best for AI-driven development

---

## Validation

How we measure success of this architecture:

- **Timeline:** Project 2 should be 30% faster than Project 1 (knowledge reuse)
- **Quality:** Fewer rework cycles (Phase 4 verification catches issues early)
- **Decisions:** All major decisions documented in ADRs (100% traceability)
- **Knowledge:** Chroma queries return relevant results (semantic index quality)
- **Preservation:** All projects have final session summaries (knowledge capture)

---

## Approval

- ✅ **Reviewed by:** User (Planning Phase)
- ✅ **Approved by:** User (AskUserQuestion approval)
- ✅ **Status:** Accepted
- ✅ **Ratified:** 2026-06-07

---

## Revision History

**v1.0 (2026-06-07):** Initial ADR formalizing Decision 1 (Knowledge-First Architecture)
- Defined 6-phase pipeline
- Specified agent roles for each phase
- Documented knowledge reuse model

---

**Last Updated:** 2026-06-07  
**Next Review:** Phase 4 (when Chroma integration begins)
