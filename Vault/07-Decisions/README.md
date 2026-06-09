---
type: guide
status: active
last_updated: 2026-06-09
author: Claude-Builder-Agent
---

# ADR Guide — How to Read & Create Architectural Decision Records

**See also:** [[../INDEX.md|Vault INDEX]] | [[../STATUS.md|STATUS]] | [[DECISIONS.md|Master Decision Index]]

---

## Overview

**ADRs (Architectural Decision Records)** document significant decisions about the system's design, technology, and governance.

This folder contains **7 ADRs** organized by category (ARCH, SEC, DATA, INFRA, API, INT, PROC).

---

## What's an ADR?

An ADR answers three questions:
1. **What did we decide?** (Decision statement)
2. **Why?** (Context, problem, rationale)
3. **What are the consequences?** (Trade-offs, alternatives rejected)

ADRs are **permanent records** — once approved, they become constraints on future decisions.

---

## ADR Categories

| Category | Prefix | Examples | When Created |
|----------|--------|----------|---|
| **Architecture** | ARCH | Service design, API strategy, tech selection | Major structural changes |
| **Security** | SEC | Authentication, approval gates, threat modeling | Security policy changes |
| **Data** | DATA | Database strategy, Chroma schema, data models | Data layer changes |
| **Infrastructure** | INFRA | Docker, deployment, cloud strategy | Deployment strategy changes |
| **API** | API | RESTful design, versioning, error handling | API design decisions |
| **Integration** | INT | MCP servers, third-party integrations | Integration strategy changes |
| **Process** | PROC | ADR workflow, review process | Process changes |

---

## The 7 Current ADRs

### Architecture (ARCH)

**[[ADR-ARCH-001.md|ADR-ARCH-001: Knowledge-First Pipeline Design]]**  
**Status:** Accepted | **Phase:** 2  
Defines the 6-phase pipeline for all work (discover → understand → design → implement → verify → learn).

---

### Security (SEC)

**[[ADR-SEC-001.md|ADR-SEC-001: Human Approval Gate Requirements]]**  
**Status:** Accepted | **Phase:** 2  
Defines 5 tiers of approval authority (Tier 1: agent, Tier 5: human-only). Critical for governance.

---

### Data (DATA)

**[[ADR-DATA-001.md|ADR-DATA-001: Chroma Collection Schema & Facts/Sessions Separation]]**  
**Status:** Accepted | **Phase:** 2  
**CRITICAL DECISION:** Separates facts (approved, authoritative) from sessions (exploratory, reference). Prevents retrieval contamination.

---

### Infrastructure (INFRA)

**[[ADR-INFRA-001.md|ADR-INFRA-001: Docker for Chroma & Obsidian Vault]]**  
**Status:** Accepted | **Phase:** 1  
Uses Docker + Docker Compose for Chroma; Obsidian for vault storage. Reproducible, portable, declarative.

---

### API (API)

**[[ADR-API-001.md|ADR-API-001: RESTful API Design Conventions]]**  
**Status:** Accepted | **Phase:** 3  
All APIs use RESTful conventions with URL-path versioning, OpenAPI docs, standard error responses. Ensures consistency across services.

---

### Integration (INT)

**[[ADR-INT-001.md|ADR-INT-001: MCP Server Integration Policy]]**  
**Status:** Accepted | **Phase:** 3  
All agent integrations use Model Context Protocol (MCP) servers, not direct API calls. Unified interface, auditable, extensible.

---

### Process (PROC)

**[[ADR-PROC-001.md|ADR-PROC-001: ADR Authoring and Review Workflow]]**  
**Status:** Accepted | **Phase:** 2  
Formalizes how ADRs are created, reviewed, approved. Ensures consistency and quality.

---

## How to Read an ADR

ADRs follow a standard format:

```markdown
# ADR-[CATEGORY]-[###]: [Title]

## Decision
[One-paragraph statement: what was decided?]

## Context
[Background: what problem prompted this?]

## Problem
[What is the specific issue?]

## Rationale
[Why is this the best choice?]

## Alternatives Considered
[Options evaluated; why rejected?]

## Implementation
[How will this be operationalized?]

## Related Standards
[Which standards enforce this decision?]

## Related Decisions
[Which other ADRs link to this?]

## Timeline
[When will this be implemented?]

## Consequences
[Positive outcomes | Negative impacts | Mitigations]

## Approval
[Who approved? When? Status?]
```

**Reading tips:**
1. Start with the Decision statement (one paragraph)
2. Read Context to understand what prompted this
3. Read Rationale to understand WHY it was chosen
4. Read Alternatives to see what was rejected
5. Read Consequences for long-term implications
6. Check Related Decisions/Standards for connected work

---

## How to Create a New ADR

### Step 1: Identify if ADR is needed

Use this decision matrix:

| Scope | Reversibility | Requires ADR? |
|-------|---------------|---|
| Single module | Easy | No |
| Single service | Easy | No |
| Multiple services | Hard | **Yes** |
| System-wide | Irreversible | **Yes** |

Ask yourself:
- Is this decision reversible?
- Does it affect multiple systems?
- Will future developers need to understand why?

### Step 2: Draft the ADR

Use [[../Templates/ADR.md|ADR template]].

**Sections to complete:**
1. **Decision:** One clear statement
2. **Context:** What problem? What's the background?
3. **Problem:** Why does this matter?
4. **Rationale:** Why is this the best choice?
5. **Alternatives:** 2-3 options; explain why rejected
6. **Implementation:** How will this be executed?
7. **Consequences:** What's gained? What's lost? Mitigations?

**Guidelines:**
- Decision statement should be <2 sentences
- Rationale should explain WHY, not just WHAT
- Alternatives should be realistic, not strawmen
- Consequences should be honest about trade-offs
- Link to related standards and decisions

### Step 3: Request review

1. Create pull request with ADR
2. Reference related work (other ADRs, standards, architecture)
3. Explain why this decision matters
4. Request human review

**PR template:**
```markdown
## ADR: [Title]

**Decision:** [One-line summary]

**Why this matters:** [Impact on system]

**Alternatives rejected:**
- [Option 1]: [Brief reason why not]
- [Option 2]: [Brief reason why not]

**Key concerns for reviewers:**
- [What should reviewers focus on?]

**Related:**
- [[Related ADR]]
- [[Related Standard]]
```

### Step 4: Incorporate feedback

Reviewers may ask for:
- Clearer decision statement
- Better rationale
- More realistic alternatives
- Risks identified
- Timeline clarified

Update ADR based on feedback.

### Step 5: Get approval

Once you have human approval:
1. Set `Status: Accepted`
2. Set `Approved By: [Name]`
3. Set `Ratified: [Date]`
4. Merge PR

### Step 6: Link from related documents

Add to:
- [[DECISIONS.md|DECISIONS.md]] (master index)
- Related standards (if applicable)
- Related ADRs (cross-references)
- Relevant workflows (if applicable)

### Step 7: Chroma indexing

Once merged:
- Add YAML metadata (type, phase, status, authority, chroma_collection, tags, related)
- Chroma indexing happens automatically in Phase 5

---

## When to Deprecate an ADR

If circumstances change and an ADR is no longer valid:

1. Create new ADR for the replacement decision
2. Update old ADR:
   - Set `Status: Deprecated`
   - Add note: "Replaced by [[ADR-ARCH-002]]"
   - Keep in history (don't delete)
3. Update [[DECISIONS.md|DECISIONS.md]]:
   - Mark old decision as deprecated
   - Link to replacement

---

## Cross-References

Each ADR references:
- **Standards** it operationalizes (Architecture, Coding, Security, Documentation)
- **Other ADRs** it depends on or informs
- **Workflows** it affects
- **Prompts** (agent instructions) it governs

All these connections are bidirectional:
- Standards link to ADRs that operationalize them
- Workflows link to ADRs that govern them
- Prompts link to ADRs that constrain them

---

## ADR Template

```markdown
# ADR-[CATEGORY]-[###]: [Title]

**Date:** YYYY-MM-DD  
**Status:** [Proposed | Accepted | Deprecated]  
**Phase:** [1-13]  
**Category:** [ARCH | SEC | DATA | INFRA | API | INT | PROC]

---

## Decision

[One or two sentences. What was decided?]

---

## Context

[Background and situation that prompted this decision.]

### Problem

[What specific problem are we solving?]

### Why This Matters

[Why should we care about this decision?]

---

## Rationale

[Why is this the right choice given the constraints?]

---

## Alternatives Considered

### Alternative 1: [Name]
**Pros:**
- Benefit 1
- Benefit 2

**Cons:**
- Cost 1
- Cost 2

### Alternative 2: [Name]
**Pros:**
- ...

**Cons:**
- ...

### Alternative 3: [Name] (CHOSEN)
**Pros:**
- Why this is best
- ...

**Cons:**
- Trade-offs we accept
- ...

---

## Implementation

[How will this decision be operationalized?]

---

## Related Standards

- [[../../01-Standards/Architecture Standards.md]]
- [[../../01-Standards/Security Standards.md]]

---

## Related Decisions

- [[ADR-ARCH-001]] (prerequisite)
- [[ADR-SEC-001]] (related governance)

---

## Timeline

[When will this be implemented?]

---

## Consequences

### Positive

[Good outcomes from this decision]

### Negative

[Challenges or costs]

### Mitigations

[How we mitigate the negative consequences]

---

## Approval

- ✅ **Reviewed by:** [Name] (Role)
- ✅ **Approved by:** [Name] (Project Lead)
- ✅ **Status:** Accepted
- ✅ **Ratified:** YYYY-MM-DD

---

## Revision History

**v1.0 (YYYY-MM-DD):** Initial ADR
- Summary of changes

---

**Last Updated:** YYYY-MM-DD  
**Next Review:** [Phase #] (when [trigger])
```

---

**See also:** [[DECISIONS.md|Master Decision Index]] | [[../INDEX.md|Vault INDEX]]
