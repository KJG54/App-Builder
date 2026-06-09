---
type: relationship
status: active
authority: sessions
relationship_kind: causes
domain: security
agent_relevance: [backend, frontend, qa]
source_problems: [Problem-security-missing-input-validation]
confidence: 0.75
tags: [security, validation, recurring]
last_updated: 2026-06-09
---

# Relationship: Missing Input Validation Is the Most Recurrent Cross-Agent Gap

**Chain:** input validation omitted in generated code → recurring verification flag (`input-validation`, 32 occurrences) → latent security exposure across backend, api, and frontend outputs

**Evidence:**

- [[../10-Known-Problems/Problem-security-missing-input-validation]] — 32 occurrences across 3 agents (backend, api, frontend)
- Highest-frequency issue in the problem registry; no direct compliance score impact yet, which makes it easy to ignore

**Implication for agents:** Backend and frontend agents should treat input validation as a default requirement on every external boundary (API params, form inputs, file paths), not an optional hardening step. Frequency without score impact means this will not self-correct via score baselines alone.

**Lifecycle:** Re-evaluate when the source problem reaches `resolved` status.
