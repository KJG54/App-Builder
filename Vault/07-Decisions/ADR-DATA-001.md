---
type: Decision
phase: 2
status: Accepted
authority: facts
chroma_collection: global-standards
tags: [data, chroma, facts-sessions-separation, critical-decision]
related: [ADR-ARCH-001, Chroma-Indexing.md]
last_updated: 2026-06-07
---

# ADR-DATA-001: Chroma Collection Schema & Facts/Sessions Separation

**Date:** 2026-06-07  
**Status:** Accepted  
**Phase:** 2 — Knowledge System Development  
**Category:** Data (DATA)

---

## Decision

All knowledge stored in Chroma must be classified as either **facts** (authoritative) or **sessions** (exploratory). Facts and sessions must be stored in separate collections to prevent retrieval contamination.

Collection naming:
- `{project}-facts` — Approved ADRs, finalized architecture, accepted requirements, standards
- `{project}-sessions` — Session notes, experiments, discussions, research, work logs
- `global-standards` — Cross-project standards (Security, Architecture, Coding, Documentation)

---

## Context

### The Problem: Retrieval Contamination

When facts and exploratory content are mixed in a single Chroma collection, agents retrieve speculative content as if it were settled fact. This leads to hallucination and cascading errors.

**Example of contamination:**
```
Session notes (exploratory):
"We might switch to MongoDB for better scalability"

Agent retrieves this note and assumes it's a finalized decision:
"The architecture uses MongoDB for all data storage"

Agent makes design decisions based on false assumption
Downstream work conflicts with actual architecture
Rollback required; waste of effort
```

### Why It Matters

Retrieval quality is the foundation of a multi-agent system. One contaminated retrieval can cascade through multiple agents and require extensive rollback. The cost of preventing contamination (classification discipline) is far lower than the cost of fixing cascading errors.

**Risk Assessment:** HIGH — If violated, all subsequent agent decisions are compromised.

---

## Rationale

### Separation Prevents Hallucination

Facts = **Approved** knowledge. Agents can trust what they retrieve.
Sessions = **Exploratory** knowledge. Agents treat as reference, not source of truth.

This distinction is critical for:
- **Consistency:** All agents reference same facts
- **Safety:** Exploratory work can't contaminate decisions
- **Trust:** When agents retrieve facts, they're guaranteed authoritative
- **Auditability:** Can trace decisions to fact sources, not speculations

### Separate Retention Policies

Facts are permanent (append-only; never deleted unless explicitly deprecated).
Sessions can be archived or deleted (exploratory work expires).

This enables:
- **Knowledge accumulation:** Facts grow over time; sessions ephemeral
- **Performance:** Old sessions can be archived; facts remain indexed
- **Privacy:** Session notes don't leak into decision records

### Classification Discipline

Separation requires discipline at ingestion time: every document must be classified before adding to Chroma. This is a small cost that prevents major problems.

---

## Alternatives Considered

### Alternative 1: Single Unified Collection

**All content mixed in one collection**

Pros:
- Simpler to manage (one collection, one schema)
- No classification overhead
- Faster ingestion (no filtering)

Cons:
- Retrieval quality degrades (facts and speculation indistinguishable)
- Contamination spreads (one bad retrieval affects multiple agents)
- No retention policy (can't archive old sessions)
- Trust breaks (agents can't distinguish authoritative from exploratory)
- HIGH RISK: System becomes unreliable

### Alternative 2: Separate Collections (CHOSEN)

**Facts and sessions in separate Chroma collections**

Pros:
- Clean retrieval (agents know they're getting authoritative content)
- Prevents contamination (sessions can't leak into facts)
- Enables different retention (facts permanent; sessions ephemeral)
- Trust maintained (agents can rely on facts)
- Auditability (decisions traceable to sources)

Cons:
- Classification discipline required (must classify at ingestion)
- Slightly more complex schema
- Two collection queries (facts + sessions) for full knowledge search
- More operational overhead (manage two collections per project)

**We choose Alternative 2** because retrieval quality is non-negotiable. The cost of classification discipline is minimal compared to the risk of contaminated retrieval.

---

## Implementation

### Collection Structure

**`{project}-facts` Collection**

Contents: Only authoritative knowledge
- Approved ADRs (status: Accepted)
- Finalized architecture documents (versioned)
- Accepted requirements
- Published standards
- Operational procedures (approved workflows)

**Metadata schema:**
```json
{
  "document_type": "ADR|Architecture|Requirement|Standard|Procedure",
  "status": "Accepted|Current",
  "approval_date": "2026-06-07",
  "approved_by": "Krystian Garcia",
  "version": "1.0",
  "is_authoritative": true,
  "relates_to": ["other-doc-id", ...],
  "effective_date": "2026-06-07",
  "deprecation_date": null,
  "tags": ["security", "architecture", ...]
}
```

**Retention:** Permanent (append-only; deprecation dates tracked)

---

**`{project}-sessions` Collection**

Contents: Exploratory and operational knowledge
- Session notes and summaries
- Meeting notes and discussions
- Research and experiments
- Work logs and updates
- Drafts of documents (before approval)
- Analysis and investigations

**Metadata schema:**
```json
{
  "document_type": "SessionNote|MeetingNote|Research|WorkLog|Draft|Analysis",
  "session_date": "2026-06-07",
  "participant": "Claude (Haiku)",
  "duration_minutes": 120,
  "is_authoritative": false,
  "status": "Exploratory|In-Progress|Archived",
  "relates_to_facts": ["fact-doc-id", ...],
  "tags": ["phase-2", "investigation", ...],
  "archive_after_days": 90
}
```

**Retention:** Configurable (can be archived after `archive_after_days`; can be manually deleted)

---

**`global-standards` Collection**

Contents: Cross-project standards that apply everywhere
- Security Standards
- Architecture Standards
- Coding Standards
- Documentation Standards

**Metadata schema:**
```json
{
  "document_type": "Standard",
  "standard_category": "Security|Architecture|Coding|Documentation",
  "effective_date": "2026-06-07",
  "version": "1.0",
  "is_authoritative": true,
  "applies_to": "all-projects",
  "enforcement_gate": "CodeReview|Verification|Architecture",
  "tags": ["standards", "governance", ...]
}
```

**Retention:** Permanent (standards versioned; old versions retained)

---

### Ingestion Rules

**Rule 1: Classification Required**

Every document added to Chroma must be explicitly classified as facts or sessions **before ingestion**.

```python
def ingest_document(content: str, classification: str):
    """Classify before adding to Chroma."""
    if classification == "facts":
        # Verify: only approved documents
        verify_approval_status(content)
        chroma_facts.add(content)
    elif classification == "sessions":
        chroma_sessions.add(content)
    else:
        raise ValueError(f"Unknown classification: {classification}")
```

**Rule 2: ADRs Always Go to Facts**

All ADRs with status "Accepted" go to `{project}-facts`.
ADRs with status "Proposed" go to `{project}-sessions` (until approved).

```python
# ADR-SEC-001 with status: Accepted → facts
# ADR-DATA-002 with status: Proposed → sessions (until approved)
```

**Rule 3: Architecture Documents Always Go to Facts**

All versioned architecture documents (e.g., `Architecture — v1.2`) go to facts.
Draft architecture (during planning) goes to sessions.

**Rule 4: Standards Always Go to global-standards**

All approved standards (Security, Architecture, Coding, Documentation) go to `global-standards`.

**Rule 5: Session Notes Always Go to Sessions**

All meeting notes, work logs, and exploratory content goes to `{project}-sessions`.

---

### Retrieval Strategy

**For context assembly (Phase 2 in [[ADR-ARCH-001]]):**

```python
def assemble_context(query: str, project: str):
    """Assemble context from facts and sessions."""
    # Always include facts (authoritative)
    facts = chroma_facts.query(query, top_k=5)
    
    # Include relevant sessions (for reference, not trust)
    sessions = chroma_sessions.query(query, top_k=3)
    
    # Always include global standards (apply everywhere)
    standards = global_standards.query(query, top_k=3)
    
    return {
        "authoritative": facts,        # Trust these
        "reference": sessions,          # Use for context, verify
        "applicable_standards": standards
    }
```

**For agent queries:**

- Architects/Planners: Query `facts` + `global-standards` (trust these for decisions)
- Researchers: Query `facts` + `sessions` + `standards` (combine authoritative + exploratory)
- Implementers: Query `facts` + `standards` only (follow established decisions)

---

### Enforcement

**At Ingestion Time:**

- [ ] Document classification required (facts vs. sessions)
- [ ] Facts must have approval metadata (approved_by, approval_date)
- [ ] ADRs must reference related standards
- [ ] Architecture docs must be versioned

**During Retrieval:**

- [ ] Mark sessions with `is_authoritative: false`
- [ ] Mark facts with `is_authoritative: true`
- [ ] Agents can filter by `is_authoritative` flag
- [ ] Separate queries for facts and sessions

**In Code Review:**

- [ ] Verify no facts added without approval
- [ ] Verify ADRs use correct collection
- [ ] Verify standards in `global-standards`
- [ ] Verify sessions marked as exploratory

---

## Related Standards

[[Security Standards]] — Data Classification and Protection (sensitive data handling)  
[[Architecture Standards]] — Technology-Agnostic Design (Chroma as abstraction)  
[[Documentation Standards]] — Knowledge preservation and archival

---

## Related Decisions

**Decision 2:** Facts and Sessions Must Be Separate — This ADR (ADR-DATA-001)  
**Decision 1:** Knowledge-First Architecture — [[ADR-ARCH-001]] (uses this schema)  
**Decision 5:** Docker for Execution — Chroma runs in Docker container

---

## Implementation Timeline

- **Phase 2 (Now):** ADR-DATA-001 written; schema defined
- **Phase 4:** Chroma schema implementation; collections created
- **Phase 5:** Integration testing; retrieval validation
- **Phase 6+:** Operational governance; monitor for contamination

---

## Consequences

### Positive

✅ Retrieval contamination prevented; agents can trust facts  
✅ Clear distinction between authoritative and exploratory  
✅ Separate retention policies (facts permanent; sessions ephemeral)  
✅ Auditability (decisions traceable to authoritative sources)  
✅ Enables confidence in agent recommendations  
✅ Standards always available globally (no duplication)  

### Negative

❌ Classification discipline required (must classify at ingestion)  
❌ More complex schema (two main collections + global)  
❌ Two collection queries needed for full knowledge search  
❌ Operational overhead (manage multiple collections)  

### Mitigations

- Ingestion automation (tools auto-classify where possible)
- Clear classification rules (documented above)
- Schema simplicity (metadata straightforward)
- Benefit far exceeds cost (contamination prevention critical)

---

## Approval

- ✅ **Reviewed by:** User (Planning Phase)
- ✅ **Approved by:** User (AskUserQuestion approval)
- ✅ **Status:** Accepted
- ✅ **Ratified:** 2026-06-07

---

## Revision History

**v1.0 (2026-06-07):** Initial ADR formalizing Decision 2 (Facts/Sessions Separation)
- Defined collection schema for facts, sessions, and global standards
- Documented classification rules and retrieval strategy
- Specified enforcement at ingestion and retrieval time

---

**Last Updated:** 2026-06-07  
**Next Review:** Phase 5 (when Chroma integration begins)
