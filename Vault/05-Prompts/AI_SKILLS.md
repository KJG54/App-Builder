# AI Skills and Agent Capabilities

**Purpose:** Inventory of AI agent skills and capabilities for the AI Software Factory.

**Audience:** AI agents, developers

**Status:** Active - Updated as skills are validated

---

## Agent Roles and Capabilities

### Architect Agent (Opus)

**Primary Skills:**
- System design and architecture planning
- Technology stack evaluation
- Infrastructure design
- ADR authoring for architecture decisions

**Quality Level:** High
**Tested:** Partial (Phase 1 only)
**Last Used:** 2026-06-07

---

### Backend Agent (Sonnet)

**Primary Skills:**
- API design and implementation
- Database schema design
- Business logic implementation
- Integration with external services
- Performance optimization

**Quality Level:** High
**Tested:** Not yet (pre-Phase 3)
**Dependencies:** PostgreSQL, FastAPI, SQLAlchemy knowledge

---

### Frontend Agent (Sonnet)

**Primary Skills:**
- UI/UX component design
- Frontend framework implementation
- State management
- Client-side testing
- Responsive design

**Quality Level:** High
**Tested:** Not yet (pre-Phase 3)

---

### QA Agent (Sonnet)

**Primary Skills:**
- Test case design and generation
- Integration test creation
- End-to-end test design
- Bug detection and analysis
- Quality metrics tracking

**Quality Level:** Medium-High
**Tested:** Not yet (pre-Phase 8)

---

### Security Agent (Opus)

**Primary Skills:**
- Security threat analysis
- Vulnerability assessment
- Authentication/authorization design
- Compliance checking
- Security code review

**Quality Level:** High
**Tested:** Partial (standards review)
**Last Used:** 2026-06-07

---

### DevOps Agent (Sonnet)

**Primary Skills:**
- Docker containerization
- Compose orchestration
- Deployment pipeline design
- Infrastructure-as-Code
- Monitoring and observability setup

**Quality Level:** Medium (Docker focused)
**Tested:** Not yet (pre-Phase 1)

---

### Documentation Agent (Haiku)

**Primary Skills:**
- Technical documentation generation
- README creation
- API documentation
- Architecture diagram generation
- Session summary writing

**Quality Level:** High
**Tested:** Yes (documentation skills strong)

---

### Verification Agent (Opus)

**Primary Skills:**
- Requirement coverage analysis
- ADR conflict detection
- Security compliance checking
- Standards compliance verification
- Confidence reporting

**Quality Level:** High
**Tested:** Partial (conceptual validation)
**Critical For:** Pre-implementation gate (Phase 8)

---

## Cross-Agent Workflows

### Workflow 1: New Feature Implementation

1. **Architect** → Design architecture changes, create ADR
2. **Verification** → Check requirement coverage, ADR conflicts, security implications
3. **Backend** → Implement API and business logic
4. **Frontend** → Implement UI components
5. **QA** → Generate and run tests
6. **Security** → Final security review
7. **Documentation** → Generate docs and session summary

### Workflow 2: Bug Fix and Debug

1. **QA/Backend** → Identify bug, analyze root cause
2. **Backend** → Implement fix
3. **QA** → Verify fix with test
4. **Documentation** → Log to known-problems collection

### Workflow 3: Deployment

1. **DevOps** → Update Docker/Compose configuration
2. **Verification** → Check infrastructure compliance
3. **Backend** → Confirm all tests passing
4. **Security** → Final infrastructure review
5. **DevOps** → Deploy and smoke test
6. **Documentation** → Update deployment notes

---

## Skill Quality Metrics

| Agent | Primary Skills | Quality Level | Tested | Ready for Production |
|-------|---|---|---|---|
| Architect | System design, ADR authoring | High | Partial | Phase 2+ |
| Backend | API impl., DB design | High | No | Phase 3+ |
| Frontend | UI components, state mgmt | High | No | Phase 3+ |
| QA | Test generation, bug detection | Medium-High | No | Phase 8+ |
| Security | Threat analysis, compliance | High | Partial | Phase 2+ |
| DevOps | Docker, Compose | Medium | No | Phase 1 |
| Documentation | Doc generation, summaries | High | Yes | Immediate |
| Verification | Requirement/ADR checking | High | Partial | Phase 2+ |

---

## Known Limitations

### Architect (Opus)
- Works best with clear constraints
- May not optimize for cost initially
- Needs human review on critical decisions

### Backend (Sonnet)
- Requires clear API specifications
- Limited to defined tech stack (FastAPI/SQLAlchemy)
- Struggles with complex state machines

### Frontend (Sonnet)
- Requires clear UI mockups or descriptions
- Limited to supported frameworks
- May need human UX review

### QA (Sonnet)
- Test quality depends on clear acceptance criteria
- Limited visibility into false positives

### Security (Opus)
- Works best with threat model defined
- May be overly cautious initially
- Needs human judgment on risk tolerance

### DevOps (Sonnet)
- Docker focus; limited K8s knowledge
- Requires clear environment specifications

### Documentation (Haiku)
- May miss nuanced context
- Works best with code already written

### Verification (Opus)
- Depends on quality of requirements/ADRs
- May miss implicit dependencies
- Needs human final validation

---

## Skill Dependencies

**Backend depends on:**
- Architect (architecture decisions)
- Security (authentication/authorization patterns)

**Frontend depends on:**
- Architect (UI architecture)
- Backend (API contracts)

**QA depends on:**
- All other agents (understanding their outputs)

**Security depends on:**
- Architect (system design)

**DevOps depends on:**
- Architect (infrastructure requirements)
- Backend (deployment requirements)

**Verification depends on:**
- Architect (architecture knowledge)
- All domain agents (understanding constraints)

---

## Agent Skill Development Roadmap

### Phase 1-2 (Now)
- ✓ Architect: ADR authoring, standards definition
- ✓ Security: Standards review
- ✓ Documentation: Setup documentation

### Phase 3-4
- Backend: API implementation, database design
- Frontend: Component generation
- QA: Test generation and case design

### Phase 5-8
- Verification: Pre-implementation checking
- DevOps: Docker and deployment
- All agents: Cross-workflow validation

### Phase 9-13
- Advanced: Multi-agent orchestration
- Prompt optimization: Performance tracking
- Skill refinement: Based on actual usage metrics

---

## Related Documents

- [[02-Technologies/Chroma]] — Knowledge storage for agent context
- [[03-Projects/AI Software Factory/Architecture/Current]] — Agent architecture design
- [[51_MCP_SERVERS.md]] — MCP servers supporting agent capabilities
- [[04-Workflows/Build API]] — Example backend workflow
- [[04-Workflows/Deploy Service]] — Example DevOps workflow

---

**Last Updated:** 2026-06-07
**Total Agents:** 8
**Production-Ready Agents:** 2 (Documentation, partial Security)
**In Development:** 6
**Roadmap:** Phases 1-13
