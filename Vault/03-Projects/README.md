# Projects Structure Guide

**See also:** [[../INDEX.md|Vault INDEX]] | [[../STATUS.md|STATUS]]

---

## Overview

This folder contains **project specifications, architecture, roadmaps, and requirements**.

Currently: **AI Software Factory** (the Application Builder Framework itself)

---

## Current Project: AI Software Factory

**Status:** Phase 2 Complete ✅  
**Overview:** [[AI Software Factory/Overview.md|Project Overview]]  
**Roadmap:** [[AI Software Factory/Roadmap.md|8-Phase Plan]]  
**Architecture:** [[AI Software Factory/Architecture/Current.md|System Design v1.0]]  
**Requirements:** [[AI Software Factory/README.md|Functional Requirements]]

---

## Project Folder Structure

Each project folder contains:

```
ProjectName/
├── Overview.md              # Vision, goals, tech stack, high-level design
├── Roadmap.md              # 8-phase plan with status and dates
├── Requirements/
│   ├── Business.md         # What are we building? Why?
│   ├── Functional.md       # What must it do?
│   └── Non-Functional.md   # What constraints? (performance, security, scale)
├── Architecture/
│   ├── Current.md          # v1.0, v1.1, etc. (versioned)
│   ├── v1.0.md            # Archive of earlier versions (for reference)
│   └── Diagrams/           # System diagrams, data flow, service topology
├── Implementation/
│   ├── API/               # API documentation, OpenAPI specs
│   ├── Services/          # Service implementations
│   ├── Database/          # Schema, migrations, data models
│   └── Frontend/          # UI components, pages
└── Testing/
    ├── Unit/              # Unit test suites
    ├── Integration/       # End-to-end tests
    └── Performance/       # Load tests, benchmarks
```

---

## Creating a New Project

### 1. Create project folder
```
Vault/03-Projects/MyProject/
```

### 2. Copy from template
Start with project template:
```
Overview.md (from Templates/Project.md)
Roadmap.md (8-phase plan)
Requirements/ (Business, Functional, Non-Functional)
Architecture/ (Current version)
```

### 3. Fill in sections

**Overview.md:**
- Mission and goals
- Key features
- Tech stack (link to [[../02-Technologies/README.md|Technologies]])
- Success criteria

**Roadmap.md:**
- 8-phase plan (use [[AI Software Factory/Roadmap.md|AI Software Factory roadmap]] as template)
- Phase descriptions
- Timeline
- Completion status

**Requirements/:**
- Business requirements (what problem does this solve?)
- Functional requirements (what must it do?)
- Non-functional requirements (performance, security, scale)

**Architecture/:**
- System design and components
- Service boundaries (follow [[../01-Standards/Architecture Standards.md|Architecture Standards]])
- Data models
- API contracts (following [[../07-Decisions/ADR-API-001.md|ADR-API-001]])
- Deployment topology

### 4. Link to governance

- Link to applicable [[../01-Standards/README.md|Standards]]
- Link to applicable [[../07-Decisions/README.md|ADRs]]
- Link to applicable [[../04-Workflows/README.md|Workflows]]

### 5. Version architecture

When architecture changes significantly:
1. Save current version as `v1.0.md` (archive)
2. Update `Current.md` (new version)
3. Create new ADR explaining the change
4. Update Roadmap with new architecture version

---

## AI Software Factory (Current Project)

**About:** The Application Builder Framework itself—a modular foundation for rapid design, planning, build, test, maintain.

**Key Files:**
- [[AI Software Factory/Overview.md|Overview]] — Vision and tech stack
- [[AI Software Factory/Roadmap.md|Roadmap]] — 8-phase implementation plan
- [[AI Software Factory/Requirements/Business Requirements.md|Business Requirements]]
- [[AI Software Factory/Requirements/Functional Requirements.md|Functional Requirements]]
- [[AI Software Factory/Architecture/Current.md|Current Architecture v1.0]]

**Status:** Phases 1-2 complete; Phase 3 (Requirements Management) coming next

---

## Project Naming & Organization

**Naming convention:**
- Folder name: `ProjectName` (no hyphens; use CapitalCase)
- Phase files: `Phase-N-Name.md` (e.g., `Phase-3-Requirements.md`)
- Architecture versions: `v1.0.md`, `v1.1.md`, `v2.0.md` (archive old; keep `Current.md` as latest)

**Archive old versions:**
- When creating v2.0, move v1.0 to `Archive/` or suffix with date: `v1.0-2026-06-07.md`
- Keep current version always accessible as `Current.md`
- Document migration path in ADR when upgrading major versions

---

## Cross-References

- **Related ADRs:**
  - [[../07-Decisions/ADR-ARCH-001.md|ADR-ARCH-001]] (Knowledge-first pipeline; applies to project structure)
  - [[../07-Decisions/ADR-SEC-001.md|ADR-SEC-001]] (Approval gates for project decisions)

- **Related Standards:**
  - [[../01-Standards/Architecture Standards.md|Architecture Standards]] (project design)
  - [[../01-Standards/Documentation Standards.md|Documentation Standards]] (what to document)

- **Related Workflows:**
  - [[../04-Workflows/New Project.md|New Project Workflow]] (how to start a project)

---

**See also:** [[../INDEX.md|Vault INDEX]] | [[../07-Decisions/README.md|ADR Guide]]
