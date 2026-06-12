---
type: plan
status: deferred
last_updated: 2026-06-12
author: Claude
tags: [plan, information-architecture, optimization, vault, deferred, framework]
related: [multi-agent-operating-model, DECISIONS, INDEX, STATUS]
---

# Information Architecture Optimization Plan (DEFERRED)

> **Status: DEFERRED.** This is a forward plan, not active work. Do not execute any
> workstream below without explicit approval and a fresh scope check — the framework
> changes constantly and these items must be re-validated before they begin. This
> document exists so the thinking is not lost.

## Why this exists

As the framework has grown (18 phases, 14 numbered Vault categories, a mailbox, an
orchestrator, agent memory, Chroma indexing, skills, and now a two-agent operating
model), the **structure and flow of information** has accumulated friction that is
worth optimizing deliberately rather than letting it drift:

- Multiple plausible homes for the same kind of fact (e.g. a "decision" could land in
  DECISIONS.md, an ADR, a retrospective, or agent memory).
- Agents re-discover where things live instead of following a known path.
- Context loading is ad hoc; there is no codified "load set" per role.
- Ephemeral coordination (mailbox) and permanent knowledge (Vault) have no explicit
  promotion rule, so operational notes can either get lost or pollute the Vault.

The [[multi-agent-operating-model]] reduces *some* of this by naming canonical
locations. This plan is the deeper, structural pass.

## Goals

1. One obvious home for every kind of information; zero ambiguity.
2. Fast, predictable context loading per agent role.
3. Clean promotion path from ephemeral → permanent knowledge.
4. Retrieval quality (Chroma) high and contamination-free.
5. Drift detected automatically, not by accident.

## Proposed Workstreams (each re-scoped before starting)

### WS1 — Canonical-Source Map
Produce a single authoritative table: *for each information type (decision, ADR,
requirement, architecture, standard, known problem, session summary, fact, entity,
relationship, agent-memory, handoff, task), the one canonical location and the
allowed cross-references.* Publish as `Vault/INDEX.md` section or a dedicated map.
**Outcome:** any agent can answer "where does this go?" in one lookup.

### WS2 — Context-Loading Profiles
Codify per-role "load sets" (what Claude-Architect, Claude-Reviewer, and Codex each
load by default) as referenced in the operating model. Consider a small helper that
assembles the set. **Outcome:** lean, repeatable context; less token waste.

### WS3 — Ephemeral → Permanent Promotion Rules
Define exactly when a mailbox message or session note must be promoted to a Vault
artifact (and which one), and when it should simply expire. Possibly automate a
"promotion check" at session handoff. **Outcome:** nothing important is lost; nothing
operational pollutes the Vault.

### WS4 — Entry-Point & Index Hygiene
Audit `INDEX.md`, `STATUS.md`, `MEMORY.md`, and category READMEs as navigation
entry points. Ensure backlinks are bidirectional and no orphans exist (extends what
`/curator` already does). **Outcome:** the Vault is navigable from a small set of
stable entry points.

### WS5 — Taxonomy Review (14 numbered categories)
Assess whether the 00–14 category scheme is still optimal or has overlap/gaps
(e.g. Facts/Entities/Relationships vs Agent-Memory boundaries). Recommend
consolidation or clarification — **changing the taxonomy is a Tier 4 decision and
requires an ADR.** **Outcome:** a taxonomy that matches how knowledge is actually used.

### WS6 — Chroma Retrieval Tuning
Review facts-vs-sessions separation (Decision 2), collection boundaries
(framework vs per-project), chunking, and embedding/index freshness. Add retrieval
quality checks. **Outcome:** high-precision retrieval, no contamination.

### WS7 — Drift Automation
Extend `npm run doctor` / `/audit` / `/curator` with checks that enforce the
canonical-source map (WS1) and promotion rules (WS3) — e.g. flag a decision recorded
only in a retrospective, or a doc with no backlinks. **Outcome:** structure stays
correct without manual vigilance.

## Sequencing (when undeferred)

WS1 first (everything else depends on the canonical map) → WS3 + WS4 (flow and
navigation) → WS2 (loading profiles) → WS6 (retrieval) → WS5 (taxonomy, gated by
ADR) → WS7 (automate the rules once stable).

## Risks

- **Over-engineering.** This must not become process for its own sake; each
  workstream needs a concrete pain it removes (`CLAUDE.md` → Complexity Budget).
- **Taxonomy churn.** WS5 touches the Vault's spine — high blast radius; ADR-gated.
- **Premature automation.** WS7 should follow the rules being stable, not precede them.

## Trigger to undefer

Revisit when any of: (a) agents repeatedly mis-file or fail to find information;
(b) context-loading cost becomes a visible problem; (c) a `/audit` reports recurring
structural drift; or (d) the user prioritizes it.

## Related

- [[multi-agent-operating-model]] — names canonical locations this plan would formalize
- [[DECISIONS]] — Decision 2 (facts/sessions separation) constrains WS6
- [[INDEX]] / [[STATUS]] — entry points WS4 audits
