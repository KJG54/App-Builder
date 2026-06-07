---
type: Workflow
phase: 6
status: Active
authority: facts
chroma_collection: global-standards
tags: [workflow, deployment, devops, release]
related: [ADR-INFRA-001, DevOps.md, ADR-SEC-001]
last_updated: 2026-06-07
---

# Workflow — Deploy Service

## Steps

1. Confirm all tests passing
2. Security Agent final review
3. Human approves deployment
4. DevOps Agent generates/updates Dockerfile and Compose config
5. Verification Agent checks infrastructure ADRs and security compliance
6. Human approves infrastructure changes
7. Deploy via Docker Compose
8. Smoke test
9. Update deployment notes in project Architecture/Current.md
10. Session summary generated

## Approval Required

- Infrastructure changes always require human approval
- New dependencies require human approval

## Related

- [[Docker]]
- [[Security Standards]]
