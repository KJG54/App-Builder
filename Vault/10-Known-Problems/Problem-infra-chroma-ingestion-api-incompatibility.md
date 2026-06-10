---
type: knownproblem
status: open
severity: high
category: infra
authority: sessions
chroma_collection: ai-software-factory-known-problems
tags: [chroma, ingestion, api, embeddings]
related: []
discovered: 2026-06-09
opened: 2026-06-09
resolved: null
resolved_by_task: null
resolution_summary: null
last_updated: 2026-06-09
---

# infra — Chroma ingestion/query API incompatibility (no client-side embeddings)

**Status:** open
**Severity:** high
**Affected Agents:** all (retrieval degraded for every agent)
**Discovered:** 2026-06-09 (during Phase 15 validation)

---

## Problem Description

Document ingestion into Chroma does not work, and never has against the current server version. Two independent defects:

1. **Wrong endpoints:** `chroma-ingest.js` posts to `/api/v1/collections/{name}/add` (v1 API removed from `chromadb/chroma:latest`). `context-assembly.js` queries `/api/v2/collections/{name}/query`, which is not a valid v2 route — v2 requires `/api/v2/tenants/{tenant}/databases/{database}/collections/{collection_id}/...` with collection IDs, not names.
2. **No embeddings:** The v2 REST API requires client-side embeddings (`missing field 'embeddings'`, HTTP 422). The server does not embed documents, even when the collection is configured with an embedding function. The Node pipeline has no embedding capability and no dependency that provides one.

Verified empirically 2026-06-09 against a live `chromadb/chroma:latest` container: collection create (v2) works; add without embeddings is rejected; the server's collection list was empty — the "Phase 4 pre-created" collections do not exist in the current Docker volume.

---

## Symptoms

- `chroma-ingest.js` run: 0 documents ingested, 97 × HTTP 405 errors
- `assembleContext()` Chroma queries fail; context degrades to local sources (agent memory, relationships, handoff)
- The Chroma MCP server (`chroma-mcp`, Python) works because the Python client embeds client-side — masking the defect in the Node pipeline

---

## Root Cause

The raw-HTTP Node pipeline was written against an older Chroma API surface and assumed server-side embedding. Current Chroma (v2-only Rust server) requires client-computed embeddings.

---

## Impact

- Semantic retrieval (standards/facts/sessions) unavailable to agents from the Node pipeline
- Phase 15.2 metadata schema is implemented and unit-verified, but documents cannot land in Chroma until embeddings are solved

---

## Workaround

Phase 15.3 local context sources (agent memory, relationships, session handoff) load regardless of Chroma availability; `assembleContext()` degrades gracefully and reports `chroma_error`.

---

## Permanent Fix

**Decision (2026-06-09, approved by Krystian):** Defer to Phase 16, which already mandates a full Chroma rebuild and re-index with new chunking. Fix as part of that work:

1. Adopt the official `chromadb` JS client (+ `@chroma-core/default-embed`) — dependency addition needs explicit approval at implementation time
2. Rewrite `chromaRequest` paths to v2 tenant/database/collection-ID routes (collection name → ID resolution via `get_or_create`)
3. Recreate the three collections and ingest the full Vault with the Phase 15.2 metadata schema

**Related:** Phase 16.1–16.5 in [[../03-Projects/AI Software Factory/Phase-14-17-Roadmap]]

---

**Created:** 2026-06-09
**Last Updated:** 2026-06-09
