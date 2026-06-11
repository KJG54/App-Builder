#!/usr/bin/env node
/**
 * Lexical Indexer — Phase 16.4
 *
 * Walks Vault markdown files, classifies them into collections (facts/sessions/standards),
 * and builds an in-memory FlexSearch index for keyword search.
 *
 * Uses classifyDocument() from chroma-ingest.js to mirror the same routing logic,
 * ensuring lexical search covers exactly the same docs as Chroma.
 */

const fs   = require('fs');
const path = require('path');
const { Index } = require('flexsearch');
const { parseYamlFrontmatter, classifyDocument } = require('./chroma-ingest');

/**
 * Walk vault dir and return flat array of doc objects for all ingestion-eligible .md files.
 * @param {string} vaultDir - Absolute path to Vault/
 * @param {string} projectPrefix - e.g. 'ai-software-factory'
 * @returns {Array<{id: number, file: string, content: string, collectionKey: string}>}
 */
function loadVaultDocs(vaultDir, projectPrefix = 'ai-software-factory') {
  const docs = [];
  _walk(vaultDir, vaultDir, docs, projectPrefix);
  return docs;
}

function _walk(dir, vaultDir, docs, projectPrefix) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); }
  catch { return; }

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      _walk(fullPath, vaultDir, docs, projectPrefix);
    } else if (entry.name.endsWith('.md')) {
      let raw;
      try { raw = fs.readFileSync(fullPath, 'utf8'); }
      catch { continue; }

      const { frontmatter, body } = parseYamlFrontmatter(raw);
      if (!frontmatter) continue;

      const classification = classifyDocument(frontmatter, fullPath);
      if (!classification.allowed) continue;

      docs.push({
        id:            docs.length,
        file:          fullPath.replace(/\\/g, '/'),
        content:       body,
        collectionKey: classification.key,   // 'facts' | 'sessions' | 'standards'
      });
    }
  }
}

/**
 * Build an in-memory FlexSearch index from a docs array.
 * @param {Array} docs - Output of loadVaultDocs()
 * @returns {Index}
 */
function buildIndex(docs) {
  const index = new Index({ tokenize: 'forward' });
  for (const doc of docs) {
    index.add(doc.id, doc.content);
  }
  return index;
}

/**
 * Search the index, filtering results to a specific collection.
 * @param {Index} index
 * @param {Array} docs
 * @param {string} query
 * @param {string} collectionKey - 'facts' | 'sessions' | 'standards'
 * @param {number} nResults
 * @returns {Array<{id, file, content, collectionKey, lexical_rank}>}
 */
function searchDocs(index, docs, query, collectionKey, nResults = 20) {
  // Fetch 4× to allow for collection filtering
  const ids = index.search(query, nResults * 4);
  return ids
    .filter(id => docs[id] && docs[id].collectionKey === collectionKey)
    .slice(0, nResults)
    .map((id, i) => ({ ...docs[id], lexical_rank: i }));
}

module.exports = { loadVaultDocs, buildIndex, searchDocs };
