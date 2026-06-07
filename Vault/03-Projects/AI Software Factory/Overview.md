# AI Software Factory

Created: 2026-06-07
Status: Active

## Overview

A local-first, Human-in-the-Loop AI software development operating system for a solo developer.

Combines VS Code, Claude CLI, Obsidian, Chroma, MCP Servers, Docker, and Git into a unified workflow where AI agents operate using accumulated project knowledge under human oversight.

## Tech Stack

- Claude CLI (reasoning engine)
- Obsidian (knowledge layer / source of truth)
- Chroma (vector semantic memory)
- Docker + Docker Compose (execution layer)
- MCP Servers (tool access layer)
- VS Code (operational environment)
- Git (version control)

## Status

Phase 1 — Foundation ✅ (2026-06-07)  
Phase 2 — Knowledge System ✅ (2026-06-07)  
Phase 3 — Requirements Management ⏳ (in progress)

## Key Links

- Specification: [[AI Software Factory/AI Software Factory]]
- Architecture: [[Architecture/Current]]
- Requirements: [[09-Requirements/README.md|Requirements Management]] (3 BR, 3 FR, 3 NFR)
- Session Summary: [[08-Retrospectives/Session-Summary-2026-06-07]]

## Key ADRs

8 ADRs completed in Phase 2:
- [[../../07-Decisions/ADR-ARCH-001|ADR-ARCH-001]] — Knowledge-First Pipeline Design
- [[../../07-Decisions/ADR-SEC-001|ADR-SEC-001]] — Human Approval Gate Requirements
- [[../../07-Decisions/ADR-DATA-001|ADR-DATA-001]] — Chroma Collection Schema & Facts/Sessions Separation
- [[../../07-Decisions/ADR-API-001|ADR-API-001]] — RESTful API Design Conventions
- [[../../07-Decisions/ADR-INT-001|ADR-INT-001]] — MCP Server Integration Policy
- [[../../07-Decisions/ADR-PROC-001|ADR-PROC-001]] — ADR Authoring and Review Workflow
- [[../../07-Decisions/ADR-INFRA-001|ADR-INFRA-001]] — VS Code Workspace Configuration
- Plus supporting standards and prompts

## Health Metrics

- Test Coverage: N/A
- Open Defects: 0
- Security Findings: 0
- Documentation Coverage: Specification complete
- Last Updated: 2026-06-07
