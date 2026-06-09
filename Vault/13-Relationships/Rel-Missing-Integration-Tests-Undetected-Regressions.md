---
type: relationship
status: active
authority: sessions
relationship_kind: blocks
domain: general
agent_relevance: [qa, backend, frontend]
source_problems: [Problem-Testing-missing-integration-tests]
confidence: 0.75
tags: [testing, integration, regression]
last_updated: 2026-06-09
---

# Relationship: Missing Integration Tests Block Regression Detection

**Chain:** unit-only test coverage → cross-module behavior unverified (`integration-tests` flag, 32 occurrences) → regressions surface only at verification gates instead of in test suites

**Evidence:**

- [[../10-Known-Problems/Problem-Testing-missing-integration-tests]] — 32 occurrences across backend, api, and frontend
- Pairs with the consistently low `consistency_score: 75` baseline — cross-component consistency is not being checked mechanically

**Implication for agents:** QA should require at least one integration-level test per cross-module change. Backend/frontend agents should flag in their outputs which integration points are untested rather than omitting the information.

**Lifecycle:** Re-evaluate when the source problem reaches `resolved` status.
