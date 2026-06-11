---
type: knownproblem
status: open
severity: medium
authority: sessions
last_updated: 2026-06-11
chroma_collection: ai-software-factory-sessions
tags: [chroma, ingestion, migration, chunking]
related: [../02-Technologies/Chroma-Indexing.md, ../07-Decisions/ADR-INFRA-003.md]
---

# Chroma — Stale Chunk IDs After Ingestion Schema Change

**Status:** Workaround  
**Severity:** Medium  
**Discovered:** 2026-06-11  
**Last Updated:** 2026-06-11

---

## Problem Description

When `chroma-ingest.js` changes how it generates document IDs or splits text into chunks, existing Chroma entries from the old scheme are not automatically removed. They become orphaned — stale entries that no longer correspond to any current vault document but still appear in query results.

---

## Symptoms

- Semantic queries return duplicate or near-duplicate results (same document content returned twice)
- `chunk_index` / `chunk_total` metadata is absent on some results (entries from before chunking was added)
- Collection entry count is higher than the number of vault documents × expected chunks
- Query results include content that was truncated at 5,000 characters (pre-2026-06-11 behavior)

---

## Root Cause

`npm run ingest` uses Chroma's `upsert` operation, which updates entries whose IDs already exist and inserts new ones. It never deletes entries whose IDs have changed.

The ID format changed on 2026-06-11:

| Era | ID Format | Example |
|-----|-----------|---------|
| Pre-2026-06-11 (truncation) | `doc-{slug}` | `doc-07-decisions-adr-arch-001` |
| Post-2026-06-11 (chunked) | `doc-{slug}-c{n}` | `doc-07-decisions-adr-arch-001-c0` |

Any environment that ran ingest before 2026-06-11 has the old single-ID entries alongside the new chunk entries.

---

## Impact

Retrieval quality degrades: agents receive duplicate context, some truncated at 5,000 chars (old entries) and some properly chunked (new entries). Facts and standards may appear twice in assembled context, wasting token budget and potentially confusing rankings.

---

## Workaround

Run ingest with the `--reset` flag **once** after upgrading to the chunked scheme. This wipes all three collections and re-indexes from scratch:

```bash
docker compose up -d          # Ensure Chroma is running
npm run ingest -- --reset     # Wipe collections, then full re-index
```

**Safe to run at any time** — all content is re-derived from Vault markdown files. No data is permanently lost.

**After running:** Verify with `cat .claude/logs/chroma-ingest-audit.json` — check that `totalChunks > ingestions.length` (confirms multi-chunk docs were split).

---

## Permanent Fix

Delta ingestion with tombstoning (Phase 3 of the Vault Health plan): track document content hashes and old IDs so that when a doc's ID scheme changes, the old IDs are explicitly deleted before the new ones are upserted.

Not yet implemented as of 2026-06-11.

---

## Links

- Operational runbook: [[../02-Technologies/Chroma-Indexing.md|Chroma Indexing — Operational Runbook]]
- SDK decision: [[../07-Decisions/ADR-INFRA-003.md|ADR-INFRA-003]]
