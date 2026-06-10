---
type: Workflow
phase: 13
status: Active
last_updated: 2026-06-08
tags: [multi-agent, orchestration, workflow-example, code-review]
related: [ADR-ARCH-002, Phase-13-Multi-Agent-Collaboration, Phase-8, Phase-10]
---

# Workflow C: Code Review → Security Audit → Architecture Validation

**Type:** Quality assurance workflow  
**Agents:** Security → Architecture → Verification (Phase 10)  
**Duration:** ~30 minutes to 2 hours (depending on findings)

---

## Overview

After a PR is created, specialized agents review it before human approval:
1. **Security** agent checks for vulnerabilities
2. **Architect** validates against design
3. **Verification** (Phase 8) runs rules engine and scores output
4. Human approves merge via Phase 10 pipeline

---

## Scenario

**Context:** Backend just created PR #456 for user profile feature (Workflow A)

**PR:** 
- Files: 3 changed, 145 lines added
- Tests: 12 new tests (all passing)
- Target: main branch

**Goal:** Verify PR meets security, architectural, and quality standards before merge

---

## Task Definition

```javascript
const orchestrator = new AgentOrchestrator();

// PR #456 is passed as context to orchestrator
const task = orchestrator.createTask(
  'Code Review & QA: User Profile Feature PR #456',
  [
    {
      agent: 'security',
      description: 'Audit PR for security vulnerabilities',
      depends_on: []
    },
    {
      agent: 'architect',
      description: 'Validate PR against design and architecture standards',
      depends_on: [0]  // Depends on Security (allows blocking if vuln found)
    },
    {
      agent: 'verification',  // Phase 8 verification layer
      description: 'Run verification rules engine and produce compliance score',
      depends_on: [1]  // Depends on Architect approval
    }
  ]
);

console.log(`Code review task created: ${task.id}`);
```

---

## Step 1: Security Audit

**Input:** PR #456 code + tests

**Process:**
```javascript
const next = orchestrator.getNextSubtask(task.id);

// Security agent analyzes code
// Checks: OWASP top 10, input validation, secrets, cryptography, auth

const securityOutput = `# Security Audit: PR #456

## Code Review
File: src/api/profiles.py

### ✅ PASS: Input Validation
- Email validated with regex + DNS lookup
- Avatar URL validated (URL format, domain whitelist)
- Name validated (length, no HTML/JS)
- Proper 400 response for invalid input

### ✅ PASS: No SQL Injection
- All queries use parameterized queries (SQLAlchemy ORM)
- No raw SQL found
- No string formatting in queries

### ✅ PASS: Authentication & Authorization
- All endpoints require valid JWT token
- User can only modify own profile (checked user_id == request.user.id)
- Proper 401/403 responses

### ✅ PASS: No Secrets in Code
- No hardcoded API keys or passwords
- No credentials in comments
- No secrets in test fixtures

### ⚠️ WARNING: Password Hashing (not applicable)
- No password fields in profile (handled elsewhere)
- N/A for this PR

## Test Security

### ✅ PASS: XSS Prevention
- Avatar URL is escaped when returned in JSON
- Name field is escaped in responses
- No HTML rendering on client expected (API returns JSON)

### ✅ PASS: CSRF Protection
- All write operations require CSRF token
- Token properly validated

## Sensitive Data Handling

### ✅ PASS: No Sensitive Data Logging
- No email/phone logged in debug output
- No sensitive data in error messages returned to client

## Overall Assessment

**Security Score: 95/100**
- No critical vulnerabilities found
- No high severity issues
- 1 medium recommendation: Add rate limiting to profile endpoints (future)
- Recommendation: **APPROVED** from security perspective
`;

orchestrator.completeSubtask(task.id, next.subtask.id, securityOutput);
```

**Output:**
- Security audit complete
- Score: 95/100
- No vulnerabilities found
- 1 future recommendation (non-blocking)
- Status: ✅ Approved

---

## Step 2: Architecture Validation

**Input:** PR + Security audit + Architect's original design (Workflow A)

**Process:**
```javascript
const next = orchestrator.getNextSubtask(task.id);
// Context includes:
// - Security audit (95/100, approved)
// - Original design from Architect (Workflow A, Step 1)

const architectOutput = `# Architecture Review: PR #456

## Design Adherence

### Endpoints (Per Design)
✅ GET /api/v1/users/{id}/profile
✅ PUT /api/v1/users/{id}/profile
✅ DELETE /api/v1/users/{id}/profile
(All endpoints present, no extras, no missing)

### Request/Response Format
✅ Follows design (JSON, proper status codes)
✅ Error format matches standard (code, message, details)
✅ Pagination: Not required per design, correctly omitted

### Database Schema
✅ Matches design DDL exactly
- id, user_id, name, email, avatar_url fields present
- Timestamps (created_at, updated_at) present
- Foreign key constraint on user_id correct

## Standards Compliance

### [[Coding Standards]]
✅ Type hints: All function signatures have types
✅ Testing: 87% code coverage (exceeds 70% minimum)
✅ Comments: Only explain WHY, not WHAT (good)
✅ Naming: clear and descriptive (get_profile, update_profile)
✅ No magic numbers: Validates input length with named constants

### [[API Standards]] (ADR-API-001)
✅ RESTful design: Resource-based (profiles), standard methods
✅ Versioning: /api/v1/ in path (correct)
✅ Status codes: 200, 201, 400, 401, 404 used correctly
✅ OpenAPI doc: Updated in docs/api.openapi.yaml

### [[Architecture Standards]]
✅ Single responsibility: Profile service handles only profiles
✅ Clear boundaries: No cross-cutting concerns mixed in
✅ Migrations: Used ORM migrations (no raw SQL migrations)
✅ Error handling: Caught at boundary, proper logging

### [[Security Standards]]
✅ No secrets: No hardcoded credentials
✅ Input validation: Sanitized email, URL, strings
✅ Authentication: JWT required on all endpoints
✅ Authorization: User can only see/modify own profile

## Performance Expectations
✅ GET: ~50ms (acceptable for single record)
✅ PUT: ~100ms (acceptable for write)
✅ DELETE: ~80ms (acceptable for write)
(All within acceptable ranges per standards)

## Overall Assessment

**Architecture Score: 98/100**
- Implementation matches design exactly
- All standards met
- Code quality high
- One minor note: Consider caching profile endpoint in future (not required)

**Recommendation: APPROVED** from architecture perspective
`;

orchestrator.completeSubtask(task.id, next.subtask.id, architectOutput);
```

**Output:**
- Architecture review complete
- Design adherence: 100%
- Standards compliance: 100%
- Score: 98/100
- Status: ✅ Approved

---

## Step 3: Verification & Quality Score

**Input:** PR + Security audit (95) + Architecture review (98)

**Process:**
```javascript
const next = orchestrator.getNextSubtask(task.id);
// Verification agent (Phase 8) runs rules engine

const verificationOutput = `# Verification Report: PR #456

## Phase 8 Rules Engine

### Code Quality Rules
✅ No deprecated functions (0 violations)
✅ Test coverage >70% (87%, passes)
✅ Cyclomatic complexity <10 (max 4, passes)
✅ No hardcoded values (0 violations)
✅ Proper error handling (all code paths covered)

### Security Rules
✅ No raw SQL (0 violations)
✅ No secrets in code (0 violations)
✅ Input validation present (all endpoints)
✅ CSRF protection enabled (all write operations)

### Architecture Rules
✅ Single responsibility (service has one job)
✅ Dependency injection used (no tight coupling)
✅ Proper logging (sensitive data masked)

## Scoring (Phase 9 Metrics)

| Category | Score | Weight | Result |
|----------|-------|--------|--------|
| Security | 95 | 20% | 19 |
| Compliance | 98 | 50% | 49 |
| Performance | 100 | 20% | 20 |
| Test Coverage | 87 | 10% | 8.7 |
| **Total** | — | 100% | **96.7** |

## Approval Tier (ADR-SEC-001)

Score: 96.7 → **Tier 1 (Auto-Approve)**
- Tier 1: >95 score = auto-approve, no human review needed
- However, human still approves via Phase 10 review pipeline for visibility

## Final Recommendation

**APPROVED** for merge
- All security checks passed (95/100)
- All architecture checks passed (98/100)  
- Verification score: 96.7/100 (Tier 1)
- Ready for production merge
`;

orchestrator.completeSubtask(task.id, next.subtask.id, verificationOutput);
```

**Output:**
- Verification score: 96.7/100
- Tier 1 approval (auto-approve threshold exceeded)
- All checks passed
- Status: ✅ Complete, ready for merge

---

## Step 4: Human Approval (Phase 10)

**Orchestrator status:** Task complete

**Phase 10 review pipeline:**
- Security agent: Approved (95/100)
- Architecture agent: Approved (98/100)
- Verification: Approved (96.7/100, Tier 1)
- All checks: PASS

**Human approves:**
- Review PR one final time visually
- Merge to main branch
- Deploy to staging for integration testing

**Slack notification (optional):**
```
✅ Code Review Complete: PR #456
- Security: 95/100 ✅
- Architecture: 98/100 ✅
- Verification: 96.7/100 (Tier 1) ✅
- Status: Approved, merged to main
```

---

## Success Criteria

✅ Security audit complete with no blockers  
✅ Architecture validation shows design adherence  
✅ Verification rules pass (Tier 1 score)  
✅ All agents approve  
✅ Human merges PR

---

## Escalation Scenario

If Security finds a vulnerability:
```javascript
orchestrator.escalateSubtask(
  task.id,
  'subtask-001',  // Security step
  'SQL Injection vulnerability in email validation'
);

// Task blocked
// Phase 10: Escalation routed to Backend for fix
// Options:
// 1. Backend fixes vulnerability
// 2. PR marked for rejection (requires redesign)
```

---

## Variations

### Variation A: Minimal Review (No Security)
If PR is documentation-only or low-risk:
```javascript
orchestrator.createTask('Code review: docs update', [
  {
    agent: 'architect',
    description: 'Quick architecture check',
    depends_on: []
  },
  {
    agent: 'verification',
    description: 'Run quality checks',
    depends_on: [0]
  }
])
```

### Variation B: Full Team Review (+ Performance)
If PR is performance-critical:
```javascript
orchestrator.createTask('Full review: performance critical', [
  {
    agent: 'security',
    description: 'Security audit',
    depends_on: []
  },
  {
    agent: 'architect',
    description: 'Architecture review',
    depends_on: [0]
  },
  {
    agent: 'performance',  // New role
    description: 'Load test and profiling',
    depends_on: [1]
  },
  {
    agent: 'verification',
    description: 'Final verification',
    depends_on: [2]
  }
])
```

---

## Related Workflows

- [[design-implement-test.md]] — Where PR comes from (Backend step)
- [[bug-triage-fix.md]] — Similar review for bug fixes
