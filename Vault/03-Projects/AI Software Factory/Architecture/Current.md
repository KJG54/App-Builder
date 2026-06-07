# Architecture — v1.0

Date: 2026-06-07
Previous Version: None (initial)
Changes: Initial architecture definition
Reason: Project inception

## Linked ADRs

**Core Architecture:**
- [[../../07-Decisions/ADR-ARCH-001]] — Knowledge-First Pipeline Design (informs entire system design)
- [[../../07-Decisions/ADR-DATA-001]] — Chroma Collection Schema (informs data layer and semantic retrieval)
- [[../../07-Decisions/ADR-SEC-001]] — Human Approval Gates (informs verification layer and agent authority)

**Infrastructure & Integration:**
- [[../../07-Decisions/ADR-INFRA-001]] — VS Code Workspace Configuration (informs operational environment)
- [[../../07-Decisions/ADR-INT-001]] — MCP Server Integration Policy (informs tool access layer)

**API & Workflows:**
- [[../../07-Decisions/ADR-API-001]] — RESTful API Design Conventions (informs API component)
- [[../../07-Decisions/ADR-PROC-001]] — ADR Authoring Workflow (informs decision process)

## System Overview

Human-in-the-Loop AI development OS. Human retains final authority. AI handles analysis, implementation, testing, and documentation.

Core pipeline:

```
Knowledge → Context → Planning → Verification → Implementation → Preservation
```

## Components

| Component | Role |
|---|---|
| VS Code | Primary operational environment |
| Claude CLI | Reasoning engine |
| Obsidian | Source of truth / organizational memory |
| Chroma | Semantic vector memory |
| Docker | Execution and agent isolation |
| MCP Servers | Tool access layer |
| Git | Version control and audit trail |

## Agent Layer

- Architect (Opus)
- Verification (Opus)
- Backend (Sonnet)
- Frontend (Sonnet)
- QA (Sonnet)
- Security (Opus)
- DevOps (Sonnet)
- Documentation (Haiku)

## Chroma Collections

```
global-standards
global-prompts
global-known-problems
{project}-facts
{project}-architecture
{project}-code
{project}-sessions
{project}-test-history
{project}-research
```

## Open Questions

- Which MCP servers to stand up first (Phase 12)
- Docker networking strategy for agent containers
- Chroma persistence and backup strategy
