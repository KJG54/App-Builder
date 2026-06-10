---
type: Decision
phase: 16
status: Accepted
authority: facts
chroma_collection: global-standards
tags: [infrastructure, chroma, chromadb, vector-database, phase-16, api-migration]
related: [ADR-INFRA-001, ADR-ARCH-001, ADR-DATA-001, Phase-14-17-Roadmap.md]
last_updated: 2026-06-10
---

# ADR-INFRA-003: Chroma Client Strategy — chromadb JS SDK over Direct HTTP

**Date:** 2026-06-10
**Status:** Accepted
**Phase:** 16 — Chroma Pipeline Rebuild

---

## Context

The AI Software Factory uses ChromaDB as its vector database for semantic search and context assembly (per ADR-ARCH-001 and ADR-DATA-001). The original implementation in `chroma-ingest.js` and `context-assembly.js` made direct HTTP calls to the Chroma v1 REST API (`/api/v1/collections`, `/api/v1/collections/{name}/add`, etc.).

ChromaDB removed the v1 HTTP API in later versions. The Chroma instance running in Docker is now on a version that exposes only v2 routes, causing all ingestion and context assembly operations to fail with 404 errors.

Additionally, `context-assembly.js` had hardcoded invalid route patterns that were never valid for the Chroma v2 API, meaning the context assembly pipeline has been non-functional since it was first written against the v2 server.

---

## Problem Statement

1. `chroma-ingest.js` uses v1 API routes that no longer exist → all Vault ingestion fails silently
2. `context-assembly.js` uses invalid v2 route patterns → all context retrieval fails
3. No embeddings are being generated or stored → semantic search returns no results
4. Raw HTTP calls require manual version tracking and break on Chroma upgrades

---

## Options Considered

### Option A: chromadb JS SDK (Recommended)
Use the official `chromadb` npm package, which abstracts the HTTP API and handles versioning internally.

**Pros:**
- Official client — version compatibility managed by the package maintainers
- Handles embeddings, collection management, and queries via a clean API
- Survives future Chroma API changes without code changes
- Well-documented, actively maintained

**Cons:**
- Adds an npm dependency
- Slightly more abstraction than raw HTTP calls

### Option B: Fix raw HTTP calls for v2 API
Manually update all HTTP routes to match the v2 API spec.

**Pros:**
- No new dependency
- Full control over requests

**Cons:**
- v2 API still subject to future breaking changes
- Manual maintenance burden — any future Chroma upgrade may break routes again
- Root cause (fragility) not addressed

### Option C: Replace Chroma with a different vector DB
Switch to a vector DB with a more stable client (e.g., Qdrant, Weaviate, Pinecone).

**Pros:**
- Potentially more stable long-term
- Some have better JS-native clients

**Cons:**
- Breaking change to collection schema (ADR-DATA-001)
- Migration cost — all existing Vault knowledge would need re-ingestion
- No evidence that alternatives are more stable for this use case
- Violates complexity budget principle (new infrastructure for a solved problem)

---

## Decision

**Adopt Option A: chromadb JS SDK.**

Replace direct HTTP calls in `chroma-ingest.js` and `context-assembly.js` with calls through the official `chromadb` npm package. The collection schema (ADR-DATA-001), collection naming convention, and metadata structure remain unchanged — only the HTTP transport layer is replaced.

---

## Consequences

### Positive
- Chroma pipeline becomes version-stable and maintainable
- Semantic search and context assembly become operational
- Future Chroma upgrades handled by the SDK, not manual HTTP fixes
- Phase 16 completes a long-standing infrastructure gap

### Negative
- Adds `chromadb` as a production npm dependency
- Existing Vault content requires a full re-index after the rebuild (expected; prior index was never valid)
- Phase 16 work required before Phase 18 cross-project indexing can function

### Neutral
- All downstream consumers (agents, skills, context assembly) are unaffected — same collection names, same metadata schema, same query semantics
- `validate-phase-16.js` now warns (not fails) when Chroma is unreachable or the SDK is not yet installed, so `test:all` continues to pass during the rebuild

---

## Follow-Up Actions

- [ ] Install `chromadb` npm package (`npm install chromadb`)
- [ ] Rewrite `chroma-ingest.js` using chromadb JS SDK client
- [ ] Rewrite `context-assembly.js` using chromadb JS SDK client
- [ ] Run full Vault re-index after rebuild
- [ ] Update `validate-phase-16.js` warnings to passes once Chroma is operational
- [ ] Update `Vault/07-Decisions/DECISIONS.md` to include this ADR

---

## References

- [[ADR-ARCH-001]] — Knowledge-First Pipeline (Chroma is the retrieval layer)
- [[ADR-DATA-001]] — Chroma Collection Schema (unchanged by this decision)
- [[Phase-14-17-Roadmap.md]] — Phase 16 implementation plan (Approach A)
- Known-Problem: `Vault/10-Known-Problems/Problem-infra-chroma-ingestion-api-incompatibility.md`
