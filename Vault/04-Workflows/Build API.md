---
type: Workflow
phase: 5
status: Active
authority: facts
chroma_collection: global-standards
tags: [workflow, api, backend, development]
related: [ADR-API-001, Backend.md, Coding Standards]
last_updated: 2026-06-07
---

# Workflow — Build API Endpoint

## Steps

1. Context Builder assembles: requirements, ADRs, current architecture, standards, test history
2. Verification Agent checks requirement coverage and ADR conflicts
3. Human approves plan
4. Backend Agent implements
5. QA Agent tests — bugs logged to `{project}-test-history`
6. Security Agent reviews
7. Human approves
8. Commit to Git
9. Documentation Agent updates docs
10. Session summary generated
11. Chroma re-indexed

## Related

- [[Coding Standards]]
- [[Security Standards]]
- [[Architecture Standards]]
