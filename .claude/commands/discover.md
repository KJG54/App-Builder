# /discover

Run a structured project discovery interview to extract requirements, constraints, and assumptions before any implementation begins.

## What This Does

Executes the `project-discovery-interview-v1.0` skill from `Vault/05-Prompts/Skills/Cross-Cutting/`.

Conducts a progressive interview covering:
- Project vision and goals
- Users and personas
- Functionality and features
- User experience direction
- Technical decisions and tradeoffs
- Automation opportunities (existing tools before custom builds)
- Constraints (timeline, budget, hosting, security)
- Future growth

Produces a formal Project Specification saved to `Vault/09-Requirements/`.

## Instructions

Load and follow: `Vault/05-Prompts/Skills/Cross-Cutting/project-discovery-interview-v1.0.md`

Default: start with a single high-level opening question. Do not list all areas at once. Drill down progressively.

Do NOT generate code, architecture, or implementation plans during the interview. Discovery must complete and be confirmed before any building begins.

## Related

- `Vault/05-Prompts/Project-Discovery.md` — Full agent prompt
- `Vault/09-Requirements/` — Where specs are saved
- `/audit` — Run after the project is built to check its health
