---
type: guide
status: active
last_updated: 2026-06-09
author: Claude-Builder-Agent
---

# Docker

## Purpose

Execution environment for all services and agent workspaces.

## Standards

- All services run in containers
- Use Docker Compose for local development
- Pin base image versions
- Non-root users in all containers
- Mount Obsidian vault for shared knowledge access

## Related ADRs

- [[ADR-INFRA-001]]

## Known Issues

- [[Docker-Issues]] (to be created as needed)
