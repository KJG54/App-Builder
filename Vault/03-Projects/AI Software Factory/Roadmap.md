# AI Software Factory — Roadmap

Last Updated: 2026-06-07

## Phase Status

| Phase | Name | Status |
|---|---|---|
| 1 | Foundation | ✅ Complete |
| 2 | Knowledge System | ✅ Complete |
| 3 | Requirements Management | Not Started |
| 4 | Fact vs Session Separation | Not Started |
| 5 | Chroma Integration | Not Started |
| 6 | Context Builder | Not Started |
| 7 | Skills System | Not Started |
| 8 | Verification Layer | Not Started |
| 9 | Prompt Versioning + Performance Tracking | Not Started |
| 10 | Review Pipeline + Observability | Not Started |
| 11 | Known Problems KB | Not Started |
| 12 | Advanced MCP Integration | Not Started |
| 13 | Multi-Agent Collaboration | Not Started |

## Completed Phases

### Phase 1 Foundation ✅ (2026-06-07)
- [x] Configure VS Code workspace and extensions
- [x] Stand up Docker Compose environment with Chroma
- [x] Create infrastructure ADR ([[07-Decisions/ADR-INFRA-001.md|ADR-INFRA-001]])
- [x] Initialize Git workflow (WORKFLOW.md)

**Deliverables:** VS Code config, Docker Compose, Git foundation

---

### Phase 2 Knowledge System ✅ (2026-06-07)

**Phase 2.1 Core (Governance Layer):**
- [x] Expanded Security Standards (350+ lines)
- [x] Expanded Architecture Standards (360+ lines)
- [x] Created ADR-SEC-001 (Human Approval Gate Requirements)
- [x] Created ADR-ARCH-001 (Knowledge-First Pipeline Design)
- [x] Updated DECISIONS.md with cross-references

**Phase 2.2 Expansion (4 Parallel Streams):**

Stream A: Standards Completion
- [x] Expanded Coding Standards (450+ lines)
- [x] Expanded Documentation Standards (650+ lines)

Stream B: Remaining ADRs
- [x] Created ADR-DATA-001 (Chroma Collection Schema & Facts/Sessions Separation)
- [x] Created ADR-API-001 (RESTful API Design Conventions)
- [x] Created ADR-INT-001 (MCP Server Integration Policy)
- [x] Created ADR-PROC-001 (ADR Authoring and Review Workflow)

Stream C: Prompt Library
- [x] Created Architect.md prompt (system design agent)
- [x] Created Backend.md prompt (API/database implementation)
- [x] Created Frontend.md prompt (UI implementation)
- [x] Created DevOps.md prompt (infrastructure and deployment)

Stream D: Chroma Indexing
- [x] Created Chroma-Indexing.md (indexing strategy and retrieval optimization)

**Additional Governance:**
- [x] Added Additional Governance Rules to CLAUDE.md (decision priority, complexity budget, etc.)

**Deliverables:**
- 4 comprehensive standards (1,096 lines)
- 6 ADRs with detailed rationale (2,300+ lines)
- 4 agent prompts (1,834 lines)
- Chroma indexing strategy (603 lines)
- Updated CLAUDE.md governance (235 lines)

**Total Phase 2:** 6,068+ lines of documentation and governance

## Next Actions

### Phase 3 Requirements Management
- [ ] Define initial requirements for Application Builder
- [ ] Create requirements template and structure
- [ ] Document user stories and acceptance criteria
- [ ] Set up requirements management workflow

### Phase 4 Fact vs Session Separation
- [ ] Implement Chroma collection separation
- [ ] Test retrieval contamination prevention
- [ ] Create ingestion validation rules

### Phase 5 Chroma Integration
- [ ] Integrate Chroma with development environment
- [ ] Index existing standards and ADRs
- [ ] Implement context assembly (Phase 2 of Knowledge-First Pipeline)
- [ ] Test semantic search quality

### Phase 6+ Multi-Agent System
- [ ] Deploy agent coordination layer
- [ ] Implement verification and review pipeline
- [ ] Add observability and monitoring
- [ ] Build advanced MCP integrations

## Related

- [[Overview]]
- [[Architecture/Current]]
- [[08-Retrospectives/Session-Summary-2026-06-07]]
