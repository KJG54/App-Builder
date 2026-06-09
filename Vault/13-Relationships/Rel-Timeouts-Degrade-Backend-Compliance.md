---
type: relationship
status: active
authority: sessions
relationship_kind: degrades
domain: api
agent_relevance: [backend, devops, qa]
source_problems: [Problem-api-api-response-timeout-issue, Problem-database-database-connection-timeout]
confidence: 0.8
tags: [api, database, timeout, compliance]
last_updated: 2026-06-09
---

# Relationship: Timeout Issues Degrade Backend Compliance Scores

**Chain:** unhandled API/database timeouts → verification failures (TEST-005, SEARCH-001) → backend compliance score reduced 20–25%

**Evidence:**

- [[../10-Known-Problems/Problem-api-api-response-timeout-issue]] — 5 occurrences, avg compliance −20%
- [[../10-Known-Problems/Problem-database-database-connection-timeout]] — 3 occurrences, avg compliance −25%
- Both affect the `backend` agent exclusively

**Implication for agents:** Backend work touching API endpoints or database connections should include explicit timeout handling and connection retry/pool configuration. QA should verify timeout behavior before approving backend outputs in the `api` and `database` domains.

**Lifecycle:** Re-evaluate when both source problems reach `resolved` status.
