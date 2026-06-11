#!/usr/bin/env node
/**
 * Hybrid Search — Phase 16.5
 *
 * Merges Chroma (vector) results with FlexSearch (lexical) results using
 * Reciprocal Rank Fusion: score(d) = Σ 1 / (60 + rank_in_pass)
 *
 * Documents appearing in both passes are boosted (they accumulate scores
 * from two rank series). Lexical-only documents are included in the output
 * if they don't already appear in the vector results.
 *
 * Join key: Chroma metadata.source_path ↔ lexical doc.file (both normalized
 * to forward slashes by chroma-ingest.js buildMetadata()).
 */

/**
 * Merge Chroma vector results and FlexSearch lexical results via RRF.
 *
 * @param {Array} chromaResults - Output of context-assembly.js formatResults():
 *   [{type, content, metadata: {source_path, ...}, relevance, position}]
 * @param {Array} lexicalResults - Output of lexical-indexer.js searchDocs():
 *   [{id, file, content, collectionKey, lexical_rank}]
 * @param {number} nResults - Max results to return
 * @returns {Array} Merged results in RRF score order, each with relevance = RRF score
 */
function rrfMerge(chromaResults, lexicalResults, nResults = 10) {
  const scores = new Map();    // source_path → cumulative RRF score
  const docByPath = new Map(); // source_path → best result object

  // Score Chroma (vector) pass
  chromaResults.forEach((r, i) => {
    const key = r.metadata?.source_path || r.metadata?.file || '';
    if (!key) return;
    scores.set(key, (scores.get(key) || 0) + 1 / (60 + i + 1));
    docByPath.set(key, r);
  });

  // Score FlexSearch (lexical) pass
  lexicalResults.forEach((r, i) => {
    const key = r.file;
    scores.set(key, (scores.get(key) || 0) + 1 / (60 + i + 1));
    // If lexical-only (not in Chroma results), create a result object for it
    if (!docByPath.has(key)) {
      docByPath.set(key, {
        type:     r.collectionKey,
        content:  r.content,
        metadata: { source_path: key },
        relevance: 0,
        position:  null,
        source:   'lexical',
      });
    }
  });

  return [...scores.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, nResults)
    .map(([key, score]) => ({ ...docByPath.get(key), relevance: score }));
}

module.exports = { rrfMerge };
