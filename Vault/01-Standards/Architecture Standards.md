# Architecture Standards

Status: Draft

## General

- Prefer modular, single-responsibility services
- Define service boundaries before implementation begins
- All architecture changes require a new versioned architecture file and an ADR

## APIs

- RESTful by default
- OpenAPI/Swagger documentation required
- Versioned endpoints (`/v1/`, `/v2/`)

## Databases

- Migrations managed via code (never manual schema changes)
- No raw SQL in business logic — use ORM or query builder

## Related

- [[Coding Standards]]
- [[Security Standards]]
- [[ADR-ARCH-001]]
