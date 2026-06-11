# Phase 16: Search Quality — Design Spec

**Date:** 2026-06-09  
**Status:** Approved  
**Author:** Claude-Builder-Agent  

---

## Overview

Phase 16 improves Chroma retrieval quality via semantic chunking, adds exact-match search, and activates the 14 Beta skills. The Chroma Node pipeline ingestion defect (never worked against the current server) is frontloaded as Stage 1 before any other work begins.

**Sequencing rationale:** The staged approach means each stage has a clear pass/fail signal before the next stage starts. Chunking (Stage 2) and search (Stage 4) are additive changes on top of a verified working client — not entangled with the fix.

---

## Stage 1 — Chroma Fix (Frontloaded)

### Problem

Two independent defects in the Node pipeline:

1. `chroma-ingest.js:385` posts to `/api/v1/collections/{name}/add` — v1 API removed from `chromadb/chroma:latest`
2. `context-assembly.js` queries `/api/v2/collections/{name}/query` — invalid v2 route (requires tenant/database/collection-ID paths)
3. Neither file sends embeddings; the Rust server rejects unembed­ded documents with HTTP 422

The current Docker volume is empty — Phase 4 collections don't exist.

### Approach: Drop-in client swap (Approach A)

Replace the raw `chromaRequest()` HTTP layer with the official `chromadb` JS client. All surrounding pipeline logic (scan, validate, classify, build metadata, audit log) is unchanged.

### Dependencies (require approval)

```
chromadb                    — official JS client, handles v2 routing
@chroma-core/default-embed  — all-MiniLM-L6-v2 embedding function
```

**Embedding compatibility:** `@chroma-core/default-embed` uses `all-MiniLM-L6-v2` — the same model as Python's `DefaultEmbeddingFunction`. Vectors from Node ingestion are query-compatible with the `chroma-mcp` Python server.

Model weights (~25MB) download on first run and cache locally.

### chroma-ingest.js changes

```js
// Replace chromaRequest() and ingestDocument() — keep everything else

const { ChromaClient } = require('chromadb');
const { DefaultEmbeddingFunction } = require('@chroma-core/default-embed');

const client = new ChromaClient({ path: CHROMA_HOST });
const embedder = new DefaultEmbeddingFunction();
```

- `initializeCollections()` — call `client.getOrCreateCollection()` for all three collections with embedder attached. Replaces the current heartbeat-check stub.
- `ingestDocument()` — use `collection.upsert({ ids, documents, metadatas })`. `upsert` makes re-runs idempotent.
- `chromaRequest()` — deleted.

### context-assembly.js changes

```js
// Replace queryChromaCollection() raw HTTP call

const collection = await client.getCollection({ name, embeddingFunction: embedder });
return collection.query({ queryTexts: [query], nResults, where });
```

Client and embedder initialized once at module load.

### Error handling

- `initializeCollections()` failure (server down) → fail fast with clear message rather than attempting 200+ documents
- Per-document errors → existing `auditLog.errors[]` already captures these; behavior unchanged
- `assembleContext()` Chroma errors → existing graceful degradation preserved (`chroma_error` field, local sources continue to load)

### Stage 1 Verification

1. `npm install` — `chromadb` and `@chroma-core/default-embed` install cleanly
2. `node .claude/scripts/chroma-ingest.js Vault ai-software-factory` — non-zero ingestion counts across all three collections
3. `node .claude/scripts/context-assembly.js ai-software-factory "What are the architectural decisions?"` — `facts` and `standards` arrays populated (no `chroma_error`)
4. `chroma-mcp` list collections — three collections exist with document counts
5. Re-run ingest — `upsert` is idempotent (same counts, no errors)

**Existing test suite:** Phase 14/15 suite (95 tests) tests metadata-building and classification logic, not the HTTP layer — all pass unchanged.

---

## Stage 2 — Chunkers

### 2a. markdown-chunker.js

Parse `#`/`##`/`###` heading hierarchy. Each chunk = heading + all content until next same-level heading. Chunk metadata includes `header_path` (e.g., `"Authentication > OAuth2 Strategy"`).

`chroma-ingest.js` uses header-based chunking for `.md` files via `processDocument()`. The client layer (Stage 1) is untouched.

### 2b. code-chunker.js

Identify `function`, `const`, `class`, `async` block boundaries via regex. Each chunk = complete function/class with scope context prepended. Chunk metadata includes: file path, component name, scope line range, imports.

`chroma-ingest.js` uses block-aware chunking for `.js` and `.py` files.

### Stage 2 Verification

- Header-based chunks maintain semantic coherence (no half-paragraphs)
- Code chunks preserve complete function/class signatures
- Re-ingest with new chunks; spot-check a known document in Chroma

---

## Stage 3 — Skills Activation

- Write content for 14 Beta skills using `Templates/Skill.md` format; documentation skill first (addresses `documentation_score: 70` baseline)
- Add `includeSkills` parameter to `assembleContext()` — already documented in SKILLS-INDEX.md, code not yet implemented
- Ingest skills into `global-standards` collection

---

## Stage 4 — Search Layer

### 4a. lexical-indexer.js (FlexSearch)

Index Vault document titles, headings, code function names. Enable exact lookup (e.g., "find all references to `CHROMA_PORT`"). Triggered by `chroma-ingest.js` on document changes.

### 4b. hybrid-search.js (RRF)

Merge vector (semantic) + lexical (exact) results via Reciprocal Rank Fusion:

```
score(doc) = Σ 1 / (60 + rank)
```

Documents appearing in both semantic and lexical passes are boosted. `context-assembly.js` uses hybrid search instead of vector-only.

---

## Stage 5 — Validation & Docs

- Phase 16 test suite covering all new modules
- Update `Problem-infra-chroma-ingestion-api-incompatibility.md` → `status: resolved`
- Update Phase 14–17 Roadmap checkboxes for Phase 16

---

## Success Criteria

- [ ] `chromadb` JS client installs and connects to `chromadb/chroma:latest` container
- [ ] Full Vault ingest completes with non-zero counts in all three collections
- [ ] `assembleContext()` returns populated `facts` and `standards` (no `chroma_error`)
- [ ] Re-ingest is idempotent (upsert, not add)
- [ ] Header-based chunks maintain semantic coherence
- [ ] Code chunks preserve complete function/class signatures
- [ ] All 14 Beta skills have content and are ingested into `global-standards`
- [ ] `assembleContext()` accepts `includeSkills` parameter
- [ ] FlexSearch indexes Vault content; exact lookups return in <100ms
- [ ] Hybrid search returns semantically relevant AND exact-match results
- [ ] Chroma Known Problem marked resolved

---

## Key Files

| File | Change | Stage |
|------|--------|-------|
| `package.json` | Add `chromadb`, `@chroma-core/default-embed` | 1 |
| `.claude/scripts/chroma-ingest.js` | Swap client layer; add chunker wiring | 1, 2 |
| `.claude/scripts/context-assembly.js` | Swap client layer; add `includeSkills`; hybrid search | 1, 3, 4 |
| `.claude/scripts/markdown-chunker.js` | New | 2 |
| `.claude/scripts/code-chunker.js` | New | 2 |
| `.claude/scripts/lexical-indexer.js` | New | 4 |
| `.claude/scripts/hybrid-search.js` | New | 4 |
| `Vault/10-Known-Problems/Problem-infra-chroma-ingestion-api-incompatibility.md` | Mark resolved | 5 |
| `Vault/03-Projects/AI Software Factory/Phase-14-17-Roadmap.md` | Update Phase 16 checkboxes | 5 |

---

## Decisions Made

- **Client:** `chromadb` JS client + `@chroma-core/default-embed` (Approach A: drop-in swap, not wrapper module or rewrite)
- **Sequencing:** Staged — Chroma fix verified before chunking, chunking verified before search layer
- **Embedding model:** `all-MiniLM-L6-v2` for Node/Python vector compatibility
- **Ingest mode:** `upsert` for idempotency
