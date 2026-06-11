#!/usr/bin/env node
/**
 * Lexical Indexer — Phase 16.4 (disk cache added in Phase 16.6)
 *
 * Walks Vault markdown files, classifies them into collections (facts/sessions/standards),
 * and builds a FlexSearch index for keyword search.
 *
 * loadOrBuildIndex() is the primary entry point: it returns a cached index from
 * .claude/cache/lexical/ when the Vault fingerprint matches, otherwise rebuilds
 * and saves. Cold build ~230ms; warm load ~20ms.
 *
 * Uses classifyDocument() from chroma-ingest.js to mirror the same routing logic,
 * ensuring lexical search covers exactly the same docs as Chroma.
 */

const fs   = require('fs');
const path = require('path');
const { Index } = require('flexsearch');
const { parseYamlFrontmatter, classifyDocument } = require('./chroma-ingest');

const CACHE_DIR = path.join(__dirname, '..', 'cache', 'lexical');

// ---------------------------------------------------------------------------
// Vault walking
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Index build
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Fingerprinting
// ---------------------------------------------------------------------------

/**
 * Compute a lightweight fingerprint over all .md files in vaultDir:
 * sorted list of "relpath:mtime:size" joined by \n.
 * Cheap (stat-only, no file reads) and changes whenever any doc is modified/added/removed.
 */
function vaultFingerprint(vaultDir) {
  const entries = [];
  _collectStats(vaultDir, vaultDir, entries);
  entries.sort((a, b) => a.rel.localeCompare(b.rel));
  return entries.map(e => `${e.rel}:${e.mtime}:${e.size}`).join('\n');
}

function _collectStats(dir, vaultDir, entries) {
  let items;
  try { items = fs.readdirSync(dir, { withFileTypes: true }); }
  catch { return; }
  for (const item of items) {
    const full = path.join(dir, item.name);
    if (item.isDirectory()) {
      _collectStats(full, vaultDir, entries);
    } else if (item.name.endsWith('.md')) {
      try {
        const st = fs.statSync(full);
        entries.push({
          rel:   path.relative(vaultDir, full).replace(/\\/g, '/'),
          mtime: st.mtimeMs,
          size:  st.size,
        });
      } catch { /* skip */ }
    }
  }
}

// ---------------------------------------------------------------------------
// Disk cache
// ---------------------------------------------------------------------------

const META_PATH  = path.join(CACHE_DIR, 'meta.json');
const DOCS_PATH  = path.join(CACHE_DIR, 'docs.json');
const INDEX_PATH = path.join(CACHE_DIR, 'index.json');

function _ensureCacheDir() {
  if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });
}

/**
 * Serialize FlexSearch index to a plain object.
 * FlexSearch 0.7.x export() fires callbacks via chained setTimeouts — resolve
 * when the 'ctx' key arrives (always the last of the 4 chunks: reg/cfg/map/ctx).
 */
function _exportIndex(index) {
  return new Promise(resolve => {
    const chunks = {};
    index.export((key, data) => {
      chunks[key] = data;
      if (key === 'ctx') resolve(chunks);
    });
  });
}

/** Load serialized chunks back into a new FlexSearch index. */
function _importIndex(chunks) {
  const index = new Index({ tokenize: 'forward' });
  for (const [key, data] of Object.entries(chunks)) {
    index.import(key, data);
  }
  return index;
}

/**
 * Save index + docs + fingerprint to disk cache.
 * @param {Array} docs
 * @param {Index} index
 * @param {string} fingerprint
 */
async function saveIndex(docs, index, fingerprint) {
  _ensureCacheDir();
  const chunks = await _exportIndex(index);
  fs.writeFileSync(DOCS_PATH,  JSON.stringify(docs),   'utf8');
  fs.writeFileSync(INDEX_PATH, JSON.stringify(chunks), 'utf8');
  fs.writeFileSync(META_PATH,  JSON.stringify({ fingerprint, docCount: docs.length, savedAt: Date.now() }), 'utf8');
}

/**
 * Load index + docs from disk if fingerprint matches. Returns null on miss.
 * @param {string} fingerprint
 * @returns {{docs: Array, index: Index}|null}
 */
function loadIndex(fingerprint) {
  try {
    const meta = JSON.parse(fs.readFileSync(META_PATH, 'utf8'));
    if (meta.fingerprint !== fingerprint) return null;
    const docs   = JSON.parse(fs.readFileSync(DOCS_PATH,  'utf8'));
    const chunks = JSON.parse(fs.readFileSync(INDEX_PATH, 'utf8'));
    return { docs, index: _importIndex(chunks) };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Primary entry point
// ---------------------------------------------------------------------------

/**
 * Load the lexical index from disk cache if the Vault is unchanged; otherwise
 * rebuild from source and save to disk.
 *
 * @param {string} vaultDir - Absolute path to Vault/
 * @param {object} [opts]
 * @param {boolean} [opts.forceRebuild=false] - Skip cache check and always rebuild
 * @param {Function} [opts.log] - Optional logger (string) => void
 * @returns {Promise<{docs: Array, index: Index, fromCache: boolean}>}
 */
async function loadOrBuildIndex(vaultDir, { forceRebuild = false, log = () => {} } = {}) {
  const fp = vaultFingerprint(vaultDir);

  if (!forceRebuild) {
    const cached = loadIndex(fp);
    if (cached) {
      log(`Lexical index: ${cached.docs.length} docs loaded from cache`);
      return { ...cached, fromCache: true };
    }
  }

  log('Lexical index: cache miss — rebuilding...');
  const docs  = loadVaultDocs(vaultDir);
  const index = buildIndex(docs);
  await saveIndex(docs, index, fp);
  log(`Lexical index: ${docs.length} docs indexed and cached`);
  return { docs, index, fromCache: false };
}

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

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

module.exports = { loadVaultDocs, buildIndex, searchDocs, loadOrBuildIndex, saveIndex, loadIndex, vaultFingerprint };
