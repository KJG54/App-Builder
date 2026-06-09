---
type: guide
status: active
last_updated: 2026-06-09
author: Claude-Builder-Agent
---

# Phase 2: Knowledge System Development — Implementation Plan

**Project:** Application Builder Framework  
**Phase:** 2 — Knowledge System Development  
**Date:** 2026-06-07  
**Status:** Approved

---

## Context

Phase 1 Foundation established the operational infrastructure (VS Code, Docker, Git). Phase 2 builds the **governance layer** that guides all future development. This includes:

1. **Formal standards** that specify HOW we build (coding, security, architecture, documentation)
2. **Architectural Decision Records** that formalize WHY we made key choices
3. **Prompt library** that programs AI agents with project-specific instructions
4. **Chroma indexing rules** that prevent retrieval contamination and ensure knowledge accuracy

Currently, the knowledge system has stubs and templates but lacks comprehensive governance. Phase 2 converts stubs → executable standards, templates → formalized decisions, and inventory → actual prompts.

---

## Approach: Option C (Core + Expansion)

**Two-stage approach** prevents circular dependencies and enables parallel work:
- **Phase 2.1 (Core):** Establish governance layer → expand standards, create 2 core ADRs
- **Phase 2.2 (Expansion):** Parallel streams → remaining standards, ADRs, prompts, Chroma indexing

### Why Option C

- **Option A (Parallel)** creates circular dependency: ADRs reference standards that haven't been expanded yet
- **Option B (Sequential Strict)** is inefficient: Chroma indexing has zero dependencies and can run in parallel
- **Option C** establishes governance layer first (Phase 2.1: standards + core ADRs), then expands in parallel (Phase 2.2)

---

## Phase 2.1: Core (Governance Layer) — 5-7 hours

### Sequential Sequence (in order)

1. **Expand Security Standards** (1-2 hours)
   - Current: 28 lines
   - Target: 200-300 lines with examples, violations, enforcement gates
   - Add: Threat modeling, secret management, agent rules, data classification, audit cadence

2. **Expand Architecture Standards** (1-2 hours)
   - Current: 22 lines
   - Target: 200-300 lines with examples
   - Add: Service boundaries, versioning, technology selection, migration patterns, ADR triggers

3. **Create ADR-SEC-001** (1-2 hours)
   - Topic: Human Approval Gate Requirements
   - Formalizes Decision 3 from DECISIONS.md
   - Operationalizes "human authority preserved" constraint

4. **Create ADR-ARCH-001** (1-2 hours)
   - Topic: Knowledge-First Pipeline Design
   - Formalizes Decision 1 from DECISIONS.md
   - Formalize pipeline: Knowledge → Context → Planning → Verification → Implementation → Preservation

5. **Update DECISIONS.md** (30 minutes)
   - Add ADR-SEC-001 and ADR-ARCH-001 to related documents

**Deliverables (Phase 2.1):**
- Expanded Security Standards.md (200-300 lines)
- Expanded Architecture Standards.md (200-300 lines)
- ADR-SEC-001.md
- ADR-ARCH-001.md
- Updated DECISIONS.md (cross-references)

---

## Phase 2.2: Expansion (Parallel Streams) — 12-16 hours

**All streams run in parallel after Phase 2.1 completes.**

### Stream A: Standards Completion (2 hours)
- Expand Coding Standards
- Expand Documentation Standards

### Stream B: Remaining ADRs (4-5 hours)
- ADR-PROC-001 (ADR Authoring and Review Workflow)
- ADR-DATA-001 (Chroma Collection Schema & Facts/Sessions Separation) — **CRITICAL**
- ADR-API-001 (RESTful API Design Conventions)
- ADR-INT-001 (MCP Server Integration Policy)

### Stream C: Prompt Library (3-4 hours)
Create 4 agent prompts (Architect, Backend, Frontend, DevOps):
- Prompt body
- Context requirements (which Chroma collections to query)
- Quality gate checklist

### Stream D: Chroma Indexing (2-3 hours, independent)
Create Chroma-Indexing.md:
- Metadata schema for all document types
- Collection assignment rules (enforces Decision 2)
- Chunking strategy per document type
- Retrieval priority for context assembly

### Sequential Wrap-Up (1 hour)
- Update DECISIONS.md (elaborate DATA, API, INT categories)
- Update Roadmap.md (Phase 2 complete)

**Deliverables (Phase 2.2):**
- Expanded Coding Standards.md (200-300 lines)
- Expanded Documentation Standards.md (200-300 lines)
- ADR-PROC-001.md, ADR-DATA-001.md, ADR-API-001.md, ADR-INT-001.md
- Vault/05-Prompts/Architect.md, Backend.md, Frontend.md, DevOps.md
- Vault/02-Technologies/Chroma-Indexing.md
- Updated DECISIONS.md (category elaborations)
- Updated Roadmap.md (Phase 2 status)

---

## ADR Topics (Mapped to Decisions)

| ADR | Decision | Topic | Rationale |
|-----|----------|-------|-----------|
| ADR-ARCH-001 | 1 | Knowledge-First Pipeline Design | Formalizes core architectural principle |
| ADR-DATA-001 | 2 | Chroma Collection Schema & Separation | Formalizes highest-risk decision (prevents hallucination) |
| ADR-SEC-001 | 3 | Human Approval Gate Requirements | Operationalizes human authority constraint |
| ADR-PROC-001 | 6 | ADR Authoring and Review Workflow | Formalizes ADR governance process |
| ADR-API-001 | NEW | RESTful API Design Conventions | Covers API design (no existing decision) |
| ADR-INT-001 | NEW | MCP Server Integration Policy | Covers agent tool access (no existing decision) |

---

## Timeline

| Phase | Activity | Duration |
|-------|----------|----------|
| **2.1** | Expand Security + Architecture Standards | 2-3 hours |
| **2.1** | Create ADR-SEC-001, ADR-ARCH-001 | 2-3 hours |
| **2.1** | Update DECISIONS.md | 30 min |
| **2.1 Subtotal** | | **5-7 hours** |
| **2.2A** | Expand Coding + Documentation Standards | 2 hours |
| **2.2B** | Create PROC, DATA, API, INT ADRs | 4-5 hours |
| **2.2C** | Create 4 agent prompts | 3-4 hours |
| **2.2D** | Create Chroma-Indexing.md | 2-3 hours |
| **2.2 Wrap** | Update DECISIONS.md, Roadmap.md | 1 hour |
| **2.2 Subtotal** | | **12-16 hours** |
| **Phase 2 Total** | | **17-23 hours (3-4 calendar days)** |

---

## Success Criteria

Phase 2 is complete when:

✓ **Standards Expansion:**
- All 4 standards are 200-300 lines (with rule + example + violation + gate pattern)
- Security Standards is highest quality (covers STRIDE, secrets, agent rules, data classification, audit)
- Each standard links to relevant ADRs and other standards
- Enforcement gates defined

✓ **ADRs:**
- 6 ADRs created (ARCH, SEC, PROC, DATA, API, INT)
- All use ADR-INFRA-001 format
- ADR-DATA-001 explicitly formalizes Decision 2 (facts/sessions separation with metadata)

✓ **Prompt Library:**
- 4 agent prompts created (Architect, Backend, Frontend, DevOps)
- Each includes: prompt body, context requirements, quality gate checklist
- All marked `status: draft, total_uses: 0`

✓ **Chroma Indexing:**
- Chroma-Indexing.md created with metadata schema, collection rules, chunking strategy, retrieval priority
- Enforces Decision 2 operationally

✓ **Integration:**
- DECISIONS.md updated (new ADRs + category elaborations)
- Roadmap.md updated (Phase 2 complete)
- All documents backlinked

---

## Related Documents

- **Phase-1-Foundation.md** — Phase 1 execution guide
- **ADR-INFRA-001.md** — Format precedent for all Phase 2 ADRs
- **AI_SKILLS.md** — Agent inventory (reference for prompts)
- **DECISIONS.md** — Architecture decisions (updated with Phase 2 ADRs)
- **Roadmap.md** — Phase timeline (updated with Phase 2 complete)

---

**Last Updated:** 2026-06-07  
**Status:** Approved and ready for implementation  
**Next Phase:** Phase 2.1 Core (Governance Layer)
