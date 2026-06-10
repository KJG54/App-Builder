---
type: Phase
phase: 4
status: Complete
last_updated: 2026-06-07
date_completed: 2026-06-07
authority: facts
chroma_collection: ai-software-factory-facts
tags: [phase-4, fact-vs-session, data-separation, phase-complete]
related: [Roadmap.md, ADR-DATA-001.md, DECISIONS.md]
---

# Phase 4: Fact vs Session Separation

**Completion Date:** 2026-06-07  
**Status:** ✅ Complete

---

## Objectives

Implement the critical distinction between authoritative knowledge (facts) and exploratory work (sessions) in the knowledge base. This prevents retrieval contamination and ensures agents work with verified information.

---

## Deliverables

### 1. Chroma Collection Schema
- **3 Chroma collections** with proper metadata schemas:
  - `{project}-facts`: Authoritative, approved documents only
  - `{project}-sessions`: Exploratory content, work logs
  - `global-standards`: Cross-project standards and governance

### 2. Classification Logic
- Authority field routing (facts vs sessions vs standards)
- Metadata schema defining required fields for each collection type
- Validation gates preventing draft documents from entering facts collection

### 3. Document Ingestion
- **6 authoritative documents** (facts): ADRs and requirements
- **1 session note** (exploratory content)
- Complete ingestion pipeline with classification

### 4. Validation Testing
- Zero cross-contamination verified
- Retrieval isolation confirmed: Facts ≠ Sessions
- Metadata enforcement working correctly

---

## Key Decisions Made

**Decision 2: Facts and Sessions Must Be Separate** (DECISIONS.md)

Authoritative knowledge (approved ADRs, accepted requirements, finalized architecture) must be stored separately from exploratory session content.

**Rationale:**
- Retrieval contamination causes agents to treat speculation as fact
- Cascading errors if wrong information enters decision pipeline
- Different retention policies needed (facts permanent, sessions temporary)

---

## Technical Architecture

### Authority Classification
```
Document Type             → Authority    → Collection
Approved ADR              → facts         → {project}-facts
Accepted Requirement      → facts         → {project}-facts
Standards/Governance      → facts         → global-standards
Session notes/work log    → sessions      → {project}-sessions
Draft documents           → sessions      → {project}-sessions
```

### Retrieval Isolation
- Agent queries search facts collection exclusively
- Sessions indexed separately for historical reference
- No mixing of collections in single query

---

## Standards Established

- **Separation Discipline:** Explicit classification required before any document ingestion
- **Metadata Validation:** Authority + Status fields determine routing
- **Change Control:** Moving from sessions → facts requires approval
- **Retention Policy:** Facts retained indefinitely; sessions may be archived

---

## Impact on Future Phases

- **Phase 5:** Chroma integration relies on clean fact/session separation
- **Phase 6:** Agent context assembly can confidently use facts collection
- **Phase 8:** Verification layer trusts fact collection integrity
- **Phase 10+:** Review pipeline monitoring prevents contamination

---

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| Enforcement discipline lacking | Automated classification rules in Chroma schema |
| Accidental facts contamination | Status field validation gate (draft blocked) |
| Retrieval pollution | Separate collections, distinct queries |

---

## Related Documents

- [[ADR-DATA-001.md|ADR-DATA-001: Chroma Collection Schema]]
- [[02-Technologies/Chroma-Indexing.md|Chroma Indexing Strategy]]
- [[DECISIONS.md|Decision 2: Facts/Sessions Separation]]
- [[Roadmap.md|Roadmap - Phase 4]]

---

**Last Updated:** 2026-06-07  
**Maintained By:** Krystian Garcia  
**Next Phase:** [[Phase-5-Chroma-Integration.md|Phase 5: Chroma Integration]]
