# Architecture — v1.0

Date: 2026-06-07
Previous Version: None (initial)
Changes: Initial architecture definition
Reason: Project inception
Linked ADRs: To be created in Phase 2

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
