---
type: index
phase: 7
status: Active
authority: facts
chroma_collection: global-standards
tags: [skills, index, reference]
related: [README.md, Templates/Skill.md]
last_updated: 2026-06-11
---

# Skills Index — Master Reference

All skills for the Application Builder Framework, organized by domain and status.

**Legend:**
- ✅ Active = Recommended for use
- ⏳ Beta = Validated but not yet widely used
- ⚠️ Deprecated = Use newer version instead
- 🔧 Draft = Under review, not yet approved

---

## Architecture Skills

Skills for system design, component architecture, data flow.

| Skill | Version | Status | Maintenance Owner | Last Updated | Next Review | Relevance |
|-------|---------|--------|-------------------|--------------|-------------|-----------|
| [[Architecture/user-authentication-system-design-v1.0.md\|User Authentication System Design]] | 1.0 | ✅ Active | Security Team | 2026-06-08 | 2026-09-08 | 0.95 |
| API Design | 1.0 | 🔧 Draft (planned) | Backend Team | — | — | — |
| Microservice Architecture | 1.0 | 🔧 Draft (planned) | Architecture Team | — | — | — |
| Database Schema Design | 1.0 | 🔧 Draft (planned) | Backend Team | — | — | — |

**Total:** 4 skills (1 Active, 3 Draft/planned)

---

## Implementation Skills

Skills for code patterns, libraries, testing, error handling.

| Skill | Version | Status | Maintenance Owner | Last Updated | Next Review | Relevance |
|-------|---------|--------|-------------------|--------------|-------------|-----------|
| OAuth 2.0 Implementation | 1.0 | 🔧 Draft (planned) | Backend Team | — | — | — |
| REST API Implementation | 1.0 | 🔧 Draft (planned) | Backend Team | — | — | — |
| Error Handling Patterns | 1.0 | 🔧 Draft (planned) | Backend Team | — | — | — |
| Testing Strategy | 1.0 | 🔧 Draft (planned) | QA Team | — | — | — |

**Total:** 4 skills (0 Active, 4 Draft/planned)

---

## Infrastructure Skills

Skills for deployment, monitoring, operations, CI/CD.

| Skill | Version | Status | Maintenance Owner | Last Updated | Next Review | Relevance |
|-------|---------|--------|-------------------|--------------|-------------|-----------|
| Docker Containerization | 1.0 | 🔧 Draft (planned) | DevOps Team | — | — | — |
| Kubernetes Deployment | 1.0 | 🔧 Draft (planned) | DevOps Team | — | — | — |
| CI/CD Pipeline | 1.0 | 🔧 Draft (planned) | DevOps Team | — | — | — |
| Monitoring Setup | 1.0 | 🔧 Draft (planned) | DevOps Team | — | — | — |

**Total:** 4 skills (0 Active, 4 Draft/planned)

---

## Cross-Cutting Skills

Skills for processes, practices applicable across all domains.

| Skill | Version | Status | Maintenance Owner | Last Updated | Next Review | Relevance |
|-------|---------|--------|-------------------|--------------|-------------|-----------|
| [[Cross-Cutting/ai-software-factory-audit-v1.0.md\|AI Software Factory Audit]] | 1.0 | ✅ Active | Human | 2026-06-10 | 2026-09-10 | 0.95 |
| [[Cross-Cutting/project-discovery-interview-v1.0.md\|Project Discovery Interview]] | 1.1 | ✅ Active | Human | 2026-06-10 | 2026-09-10 | 0.90 |
| [[Cross-Cutting/project-guardian-v1.0.md\|Project Guardian]] | 1.0 | ✅ Active | Human | 2026-06-10 | 2026-09-10 | 0.90 |
| [[Cross-Cutting/phase-plan-generator-v1.0.md\|Phase Plan Generator]] | 1.0 | ✅ Active | Human | 2026-06-10 | 2026-09-10 | 0.92 |
| [[Cross-Cutting/repository-curator-v1.0.md\|Repository Curator]] | 1.0 | ✅ Active | Human | 2026-06-11 | 2026-09-11 | 0.88 |
| [[Cross-Cutting/runtime-efficiency-engineer-v1.0.md\|Runtime Efficiency Engineer]] | 1.0 | ✅ Active | Human | 2026-06-11 | 2026-09-11 | 0.88 |
| [[Cross-Cutting/simplification-audit-v1.0.md\|Simplification Audit]] | 1.0 | ✅ Active | Human | 2026-06-11 | 2026-09-11 | 0.85 |
| Code Review Process | 1.0 | 🔧 Draft (planned) | Engineering Lead | — | — | — |
| Documentation Generation | 1.0 | 🔧 Draft (planned) | Tech Writer | — | — | — |
| Performance Optimization | 1.0 | 🔧 Draft (planned) | Architecture Team | — | — | — |

**Total:** 10 skills (7 Active, 3 Draft/planned)

---

## Deprecated Skills

Skills superseded by newer versions.

| Skill | Version | Deprecated On | Replaced By | Migration Status |
|-------|---------|---------------|------------|------------------|
| (none yet) | — | — | — | — |

**Total:** 0 skills

---

## Summary

| Domain | Active | Draft/Planned | Deprecated | Total |
|--------|--------|---------------|-----------|-------|
| Architecture | 1 | 3 | 0 | 4 |
| Implementation | 0 | 4 | 0 | 4 |
| Infrastructure | 0 | 4 | 0 | 4 |
| Cross-Cutting | 7 | 3 | 0 | 10 |
| **TOTAL** | **8** | **14** | **0** | **22** |

**Progress:** 8 skills fully Active (with files); 14 planned (no files yet — create file to promote to Beta)

---

## How to Use This Index

### Find a Skill for Your Task

1. **Identify your domain:**
   - System/component design? → Architecture Skills
   - Implement code/library? → Implementation Skills
   - Deploy/monitor? → Infrastructure Skills
   - Process/best practice? → Cross-Cutting Skills

2. **Query Chroma for your problem:**
   ```
   assembleContext(
     "{{YOUR_PROBLEM}}",
     "ai-software-factory",
     { includeSkills: true, skillDomains: ["{{DOMAIN}}"] }
   )
   ```

3. **Review the skill's relevance score** (0.0-1.0)
   - 0.90+ = Perfect match, use directly
   - 0.75-0.89 = Good match, may need adaptation
   - <0.75 = Check if applicable to your context

4. **Read the skill's "When to Use" section** to confirm it applies

### Request Approval for a Skill

If you think a skill is missing:
1. Document problem statement
2. Propose skill creation with team
3. Create in Draft status
4. Request review in engineering channel
5. Once approved, skill becomes Active

### Report a Skill Issue

If a skill isn't working or is outdated:
1. Comment with: skill name, version, issue
2. Tag maintenance owner
3. If critical: Create GitHub issue
4. Maintenance owner evaluates for deprecation/update

---

## Skill Query Examples

### Architect Queries
```
"Design user authentication" → user-authentication-system-design-v1.0
"Design REST API" → API Design (if available)
"Design microservices" → Microservice Architecture (if available)
```

### Backend Queries
```
"Implement OAuth" → OAuth 2.0 Implementation (if available)
"Build REST API" → REST API Implementation (if available)
"Handle errors properly" → Error Handling Patterns (if available)
```

### Frontend Queries
```
"Write component tests" → Testing Strategy (if available)
"Optimize performance" → Performance Optimization (if available)
"Build accessible forms" → (future skill)
```

### DevOps Queries
```
"Containerize app" → Docker Containerization (if available)
"Deploy to Kubernetes" → Kubernetes Deployment (if available)
"Set up monitoring" → Monitoring Setup (if available)
```

---

## Skill Status Guide

**✅ Active**
- Approved and validated
- Recommended for use
- Supported by maintenance owner
- May be used in all new projects

**⏳ Beta**
- Proposed and documented
- Undergoing validation (2+ real-world uses)
- Not yet officially approved
- Use at own risk; feedback welcome

**⚠️ Deprecated**
- Superseded by newer version
- Do not use for new projects
- Existing projects should migrate
- Maintained for reference only

**🔧 Draft**
- Under review
- Not yet ready for use
- Author refining based on feedback

---

## Creating a New Skill

To propose a new skill:

1. **Check this index** — Does it already exist?
2. **Create file** in appropriate domain folder:
   - `Vault/05-Prompts/Skills/Architecture/{{name}}-v1.0.md`
   - `Vault/05-Prompts/Skills/Implementation/{{name}}-v1.0.md`
   - etc.
3. **Use template:** [[../../Templates/Skill.md]]
4. **Set status: Draft** and **validation_status: Under Review**
5. **Request review** in engineering channel
6. **Once approved:** Update this index, skill becomes searchable

---

## Next Steps

**Phase 7 Task:** Create foundational skills in each domain
- [ ] Complete user-authentication-system-design-v1.0 (DONE)
- [ ] Create oauth2-implementation-v1.0 (Beta)
- [ ] Create docker-containerization-v1.0 (Beta)
- [ ] Create error-handling-patterns-v1.0 (Beta)
- [ ] Create testing-strategy-v1.0 (Beta)

**Phase 8+:** Expand skill library as projects create and validate new skills

---

**Last Updated:** 2026-06-11  
**Total Skills:** 22 (8 Active with files, 14 Draft/planned — no files yet)  
**Next Review:** Quarterly
