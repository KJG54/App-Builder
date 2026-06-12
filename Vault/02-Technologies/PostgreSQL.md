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

## References

- [PostgreSQL Documentation](https://www.postgresql.org/docs/current/)
- [SQLAlchemy ORM Docs](https://docs.sqlalchemy.org/en/20/)
- [Alembic Migration Docs](https://alembic.sqlalchemy.org/en/latest/)
- [PostgreSQL MCP Server](https://github.com/modelcontextprotocol/servers/tree/main/src/postgres)
- [psycopg3 Driver](https://www.psycopg.org/psycopg3/docs/)
