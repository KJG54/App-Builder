---
type: guide
status: active
last_updated: 2026-06-09
author: Claude-Builder-Agent
---

# PostgreSQL

## Version

16+

## Usage

Primary relational database.

## Standards

- Migrations via Alembic (never manual schema changes)
- Connection pooling required in production
- All queries through SQLAlchemy ORM

## Related ADRs

- [[ADR-DATA-001]]

## Known Issues

- [[PostgreSQL-Issues]] (to be created as needed)
