---
type: Workflow
phase: 1
status: Active
authority: facts
chroma_collection: global-standards
tags: [workflow, project-creation, planning]
related: [Architect.md, 03-Projects README, Documentation Standards]
last_updated: 2026-06-07
---

# Workflow — New Project

## Trigger

```bash
./scripts/new-project.sh "Project Name"
```

## Steps

1. Run bootstrap script
2. Confirm tech stack — fill in ADR-ARCH-001
3. Define business requirements in `09-Requirements/[Project Name]/`
4. Set current priorities in CLAUDE.md
5. Write initial architecture in `03-Projects/[Project Name]/Architecture/v1.0.md`
6. Copy v1.0.md to Current.md
7. Add project to Docker Compose network
8. Verify Chroma collections were created
9. Run first session summary after initial setup

## Related

- [[CLAUDE.md Strategy]]
- [[Architecture Versioning]]
