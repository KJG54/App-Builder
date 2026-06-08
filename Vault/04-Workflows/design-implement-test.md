---
type: Workflow
phase: 13
status: Active
tags: [multi-agent, orchestration, workflow-example, design-implement-test]
related: [ADR-ARCH-002, Phase-13-Multi-Agent-Collaboration]
---

# Workflow A: Design → Implement → Test

**Type:** Feature development workflow  
**Agents:** Architect → Backend → QA  
**Duration:** ~3–4 hours (depending on complexity)

---

## Overview

A complete feature is built from design through testing via agent collaboration:
1. **Architect** designs the API and database schema
2. **Backend** implements the endpoints and business logic
3. **QA** writes integration tests and verifies behavior
4. Human approves merge via Phase 10 review pipeline

---

## Task Definition

```javascript
const orchestrator = new AgentOrchestrator();

const task = orchestrator.createTask(
  'Build user profile management feature',
  [
    {
      agent: 'architect',
      description: 'Design user profile API and database schema',
      depends_on: []
    },
    {
      agent: 'backend',
      description: 'Implement profile endpoints (GET, PUT, DELETE)',
      depends_on: [0]  // Depends on Architect
    },
    {
      agent: 'qa',
      description: 'Write integration tests and verify endpoints',
      depends_on: [1]  // Depends on Backend
    }
  ]
);

console.log(`Task created: ${task.id}`);
// Output: Task created: task-20260608-abc123
```

---

## Step 1: Architect Designs

**Input:** Feature requirements ("User profile with name, email, avatar")

**Process:**
```javascript
const next = orchestrator.getNextSubtask(task.id);
// Returns: architect's design subtask + empty context (first step)

// Architect queries knowledge base
// Chroma query: "user profile API design patterns"
// Returns: Prior profiles, RESTful conventions, database patterns

// Architect designs:
const designOutput = `# User Profile API Design

## Endpoints
- GET /api/v1/users/{id}/profile → Fetch profile
- PUT /api/v1/users/{id}/profile → Update profile
- DELETE /api/v1/users/{id}/profile → Delete profile

## Database Schema
\`\`\`sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY,
  user_id UUID UNIQUE NOT NULL,
  name VARCHAR(255),
  email VARCHAR(255),
  avatar_url TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
\`\`\`

## Design Rationale
- Used UUID for IDs (consistent with platform)
- Soft delete not required per requirements
- Avatar stored as URL (not binary) for flexibility
`;

orchestrator.completeSubtask(task.id, next.subtask.id, designOutput);
```

**Output:**
- API design document
- Database schema (SQL DDL)
- Design rationale
- Status: ✅ Complete

---

## Step 2: Backend Implements

**Input:** Architect's design + requirements

**Process:**
```javascript
const next = orchestrator.getNextSubtask(task.id);
// Returns: backend's implementation subtask + context

// next.context.prior_outputs[0] = architect's design above
// Backend reads design and implements

// Backend creates PR via GitHub MCP:
const prOutput = `# PR: User Profile Feature

Created PR: https://github.com/project/repo/pull/456

## Changes
- src/api/profiles.py: GET/PUT/DELETE endpoints (145 lines)
- migrations/0042_create_profiles.sql: Schema (32 lines)
- tests/api_test.py: Unit tests (89 lines)
- docs/api.openapi.yaml: Updated spec

## Design Adherence
- Followed Architect's endpoints exactly
- Schema matches design doc
- Error handling: 400, 401, 404, 500 per standards
- Input validation: email, URL format checks

## Test Results
- Unit tests: 12/12 passing
- Type checking: 100% (mypy strict)
- Code coverage: 87%
`;

orchestrator.completeSubtask(task.id, next.subtask.id, prOutput);
```

**Output:**
- GitHub PR created and linked
- Code implementation (144 lines)
- Database migrations
- Unit tests
- Status: ✅ Complete

---

## Step 3: QA Tests

**Input:** Backend's PR + Architect's design

**Process:**
```javascript
const next = orchestrator.getNextSubtask(task.id);
// Returns: QA's testing subtask + context

// next.context.prior_outputs = [
//   { agent: 'architect', output: '# User Profile API Design\n...' },
//   { agent: 'backend', output: '# PR: User Profile Feature\n...' }
// ]

// QA reads design and tests implementation against it
const testOutput = `# Integration Test Results

## Test Coverage
- GET /api/v1/users/{id}/profile: 5 tests (200, 401, 404)
- PUT /api/v1/users/{id}/profile: 6 tests (200, 400, 401, 409 conflict)
- DELETE /api/v1/users/{id}/profile: 4 tests (204, 401, 404)

## Tests: 15/15 passing ✅

### Edge Cases Verified
- ✅ XSS prevention: Avatar URL sanitized
- ✅ SQL injection: Parameterized queries used
- ✅ Race condition: Concurrent updates handled
- ✅ Soft deletes: Not required, correctly omitted
- ✅ Pagination: Not required (single user profile), N/A

## Performance
- GET /profile: 45ms (acceptable)
- PUT /profile: 78ms (acceptable)
- DELETE /profile: 52ms (acceptable)

## Verification Against Design
✅ All endpoints match Architect's design
✅ Schema matches design DDL
✅ Error codes: 400, 401, 404, 500 as specified
✅ No deviations from design

## Recommendation
**APPROVED** for merge. Implementation matches design; all tests passing; no security issues found.
`;

orchestrator.completeSubtask(task.id, next.subtask.id, testOutput);
```

**Output:**
- Integration tests (15/15 passing)
- Performance verification
- Security audit
- Design compliance check
- Status: ✅ Complete, approved

---

## Step 4: Phase 10 Review

**Orchestrator status:** Task complete (all 3 subtasks done)

**Next step:** Phase 10 review pipeline:
- Review agent verifies design, code, tests
- Security agent checks for vulnerabilities
- Human approves and merges PR

```javascript
const status = orchestrator.getTaskStatus(task.id);
console.log(status);
// Output:
// {
//   id: 'task-20260608-abc123',
//   description: 'Build user profile management feature',
//   status: 'complete',
//   created: '2026-06-08T16:00:00Z',
//   completed: '2026-06-08T19:30:00Z',
//   stats: {
//     completed: 3,
//     total: 3,
//     percent_done: 100,
//     duration_minutes: 210  // 3.5 hours
//   }
// }
```

**Optional Slack notification:**
```
✅ Task Complete: Build user profile management feature
- Subtasks: 3/3
- Duration: 3h 30m
- Next: Code review via Phase 10
```

---

## Success Criteria

✅ All agents complete their subtasks  
✅ Context flows between agents (Backend reads Architect design, QA reads both)  
✅ Final output (PR + tests + design) ready for human review  
✅ No escalations (all agents succeeded)

---

## Variations

### Variation A: Parallel Design + Documentation
If documentation doesn't depend on implementation:
```javascript
orchestrator.createTask('Build feature with docs', [
  {
    agent: 'architect',
    description: 'Design API',
    depends_on: []
  },
  {
    agent: 'documentation',
    description: 'Write user guide',
    depends_on: [0]  // Can start once design is done
  },
  {
    agent: 'backend',
    description: 'Implement API',
    depends_on: [0]  // Also depends on design
  },
  {
    agent: 'qa',
    description: 'Test implementation',
    depends_on: [2]  // Waits for backend
  }
])
```

### Variation B: Escalation Recovery
If Backend fails:
```javascript
// Orchestrator detects failure, escalates
orchestrator.escalateSubtask(
  task.id,
  'subtask-002',  // Backend implementation
  'PR has merge conflicts with main branch'
);

// Task status: blocked
// Phase 10 approval workflow: human decides
// - Retry: Backend rebases and tries again
// - Reassign: Senior backend engineer takes over
```

---

## Related Workflows

- [[bug-triage-fix.md]] — Bug discovery → fix → test
- [[code-review-handoff.md]] — Code review → security audit → approval
