# Security Standards

Status: Draft

## General

- No secrets in source code or Git history
- All secrets via environment variables or secret manager
- Input validation at all system boundaries
- Principle of least privilege on all service accounts

## Authentication

- JWT or OAuth 2.0 only
- Tokens must expire
- Refresh token rotation required

## Dependencies

- Review new dependencies before adding
- Pin dependency versions
- Run dependency audit regularly

## Related

- [[Coding Standards]]
- [[ADR-SEC-001]]
