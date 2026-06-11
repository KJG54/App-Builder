# Hybrid Search (FlexSearch + RRF) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add lexical (keyword) search alongside vector (semantic) search, merging results with Reciprocal Rank Fusion so documents appearing in both passes are boosted.

**Architecture:** `lexical-indexer.js` builds an in-memory FlexSearch index from Vault markdown files; `hybrid-search.js` applies RRF to merge Chroma vector results with FlexSearch lexical results; `context-assembly.js` calls both and feeds merged results to the existing re-ranker. No disk persistence — FlexSearch rebuilds in-memory each call (Vault is ~180 files, indexing takes <200ms, well within Chroma round-trip time).

**Tech Stack:** `flexsearch` (^0.7.31), existing `chromadb` JS SDK, Node.js — no new infrastructure.

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `.claude/scripts/lexical-indexer.js` | Walk Vault .md files → FlexSearch index + docs array |
| Create | `.claude/scripts/hybrid-search.js` | RRF merge of Chroma results + FlexSearch results |
| Modify | `.claude/scripts/context-assembly.js` | Wrap each Chroma query with hybrid merge |
| Create | `.claude/scripts/validate-phase-16-hybrid.js` | 5-test validator (no Docker required) |
| Modify | `package.json` | Add `flexsearch` dep + `test:phase-16-hybrid` script |

---

## Task 1: Install FlexSearch

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install flexsearch**

```bash
cd "C:\Users\kryst\Code\App Builder"
npm install flexsearch@0.7.31
```

Expected: `added 1 package` in output, no errors.

- [ ] **Step 2: Verify installation**

```bash
node -e "const { Index } = require('flexsearch'); const i = new Index(); i.add(1, 'hello world'); console.log(i.search('hello'));"
```

Expected output: `[ 1 ]`

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "feat: add flexsearch for hybrid search lexical pass"
```

---

## Task 2: Create `lexical-indexer.js`

**Files:**
- Create: `.claude/scripts/lexical-indexer.js`

- [ ] **Step 1: Create the file**

```javascript
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
    .map((id, rank) => ({ ...docs[id], lexical_rank: rank }));
}

module.exports = { loadVaultDocs, buildIndex, searchDocs };
```

Write this to `.claude/scripts/lexical-indexer.js`.

- [ ] **Step 2: Syntax check**

```bash
node --check ".claude/scripts/lexical-indexer.js"
```

Expected: no output (clean).

- [ ] **Step 3: Smoke test**

```bash
node -e "
const { loadVaultDocs, buildIndex, searchDocs } = require('./.claude/scripts/lexical-indexer');
const docs = loadVaultDocs('Vault', 'ai-software-factory');
console.log('docs loaded:', docs.length);
const idx = buildIndex(docs);
const r = searchDocs(idx, docs, 'architecture', 'facts', 5);
console.log('hits for architecture/facts:', r.length);
r.forEach(d => console.log(' -', d.file.split('/').pop(), '(rank', d.lexical_rank + ')'));
"
```

Expected: `docs loaded: N` (N > 0), `hits: N` (N > 0), list of filenames.

- [ ] **Step 4: Commit**

```bash
git add .claude/scripts/lexical-indexer.js
git commit -m "feat: lexical-indexer — FlexSearch index over Vault docs (Phase 16.4)"
```

---

## Task 3: Create `hybrid-search.js`

**Files:**
- Create: `.claude/scripts/hybrid-search.js`

- [ ] **Step 1: Create the file**

```javascript
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
  const scores = new Map();   // source_path → cumulative RRF score
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
```

Write this to `.claude/scripts/hybrid-search.js`.

- [ ] **Step 2: Syntax check**

```bash
node --check ".claude/scripts/hybrid-search.js"
```

Expected: no output (clean).

- [ ] **Step 3: Unit test the RRF merge**

```bash
node -e "
const { rrfMerge } = require('./.claude/scripts/hybrid-search');

const chromaResults = [
  { type: 'facts', content: 'Docker compose file', metadata: { source_path: 'Vault/docker-compose.md' }, relevance: 0.9, position: 1 },
  { type: 'facts', content: 'Chroma setup guide', metadata: { source_path: 'Vault/chroma-setup.md' }, relevance: 0.8, position: 2 },
  { type: 'facts', content: 'Env vars doc', metadata: { source_path: 'Vault/env-vars.md' }, relevance: 0.7, position: 3 },
];
const lexicalResults = [
  { file: 'Vault/docker-compose.md', content: 'CHROMA_SERVER_HOST=...', collectionKey: 'facts', lexical_rank: 0 },
  { file: 'Vault/env-example.md',    content: '.env example file',      collectionKey: 'facts', lexical_rank: 1 },
];

const merged = rrfMerge(chromaResults, lexicalResults, 5);
console.log('merged count:', merged.length);
console.log('top result:', merged[0].metadata.source_path);
console.log('top score:', merged[0].relevance.toFixed(4));

// docker-compose appears in both → must be rank 1
if (merged[0].metadata.source_path !== 'Vault/docker-compose.md') {
  console.error('FAIL: docker-compose should be rank 1 (boost from both passes)');
  process.exit(1);
}
// env-example is lexical-only → must appear in results
const hasEnvExample = merged.some(r => r.metadata.source_path === 'Vault/env-example.md');
if (!hasEnvExample) {
  console.error('FAIL: env-example.md (lexical-only) should appear in results');
  process.exit(1);
}
console.log('PASS: RRF boost and lexical-only inclusion both correct');
"
```

Expected last line: `PASS: RRF boost and lexical-only inclusion both correct`

- [ ] **Step 4: Commit**

```bash
git add .claude/scripts/hybrid-search.js
git commit -m "feat: hybrid-search — RRF merge of vector + lexical results (Phase 16.5)"
```

---

## Task 4: Wire Hybrid Search into `context-assembly.js`

**Files:**
- Modify: `.claude/scripts/context-assembly.js`

- [ ] **Step 1: Add requires at top of file (after existing requires)**

In `context-assembly.js`, after line 18 (`const { DefaultEmbeddingFunction } ...`), add:

```javascript
const { loadVaultDocs, buildIndex, searchDocs } = require('./lexical-indexer');
const { rrfMerge } = require('./hybrid-search');
```

- [ ] **Step 2: Build the lexical index at the top of `assembleContext()`**

In `assembleContext()`, after the `const context = { ... }` block (around line 95), and before the `log('Query: ...')` call, add:

```javascript
  // Lexical index — built in-memory once per call, degrades gracefully
  let _lexDocs = null;
  let _lexIndex = null;
  try {
    _lexDocs  = loadVaultDocs(VAULT_DIR);
    _lexIndex = buildIndex(_lexDocs);
    log(`Lexical index: ${_lexDocs.length} docs indexed`);
  } catch (lexErr) {
    log(`Lexical index unavailable (degrading): ${lexErr.message}`);
  }

  function hybridQuery(chromaResults, collectionKey) {
    if (!_lexIndex || !_lexDocs) return chromaResults;
    const lexResults = searchDocs(_lexIndex, _lexDocs, query, collectionKey, fetchN);
    return rrfMerge(chromaResults, lexResults, fetchN);
  }
```

- [ ] **Step 3: Replace raw Chroma results with hybridQuery() calls**

In the `try { ... }` block that queries Chroma (around lines 106-130), change each Chroma result to go through `hybridQuery`:

**Before (standards query, ~line 108):**
```javascript
    context.standards = rerankResults(
      await queryCollection(client, ef, 'global-standards', query, fetchN, filters),
      agentRole
    ).slice(0, maxResults);
```

**After:**
```javascript
    context.standards = rerankResults(
      hybridQuery(
        await queryCollection(client, ef, 'global-standards', query, fetchN, filters),
        'standards'
      ),
      agentRole
    ).slice(0, maxResults);
```

**Before (facts query, ~line 116):**
```javascript
    context.facts = rerankResults(
      await queryCollection(client, ef, `${projectName}-facts`, query, fetchN, { is_authoritative: true, ...filters }),
      agentRole
    ).slice(0, maxResults);
```

**After:**
```javascript
    context.facts = rerankResults(
      hybridQuery(
        await queryCollection(client, ef, `${projectName}-facts`, query, fetchN, { is_authoritative: true, ...filters }),
        'facts'
      ),
      agentRole
    ).slice(0, maxResults);
```

**Before (sessions query, ~line 125):**
```javascript
      context.sessions = rerankResults(
        await queryCollection(client, ef, `${projectName}-sessions`, query, Math.ceil(fetchN / 2), filters),
        agentRole
      ).slice(0, Math.ceil(maxResults / 2));
```

**After:**
```javascript
      context.sessions = rerankResults(
        hybridQuery(
          await queryCollection(client, ef, `${projectName}-sessions`, query, Math.ceil(fetchN / 2), filters),
          'sessions'
        ),
        agentRole
      ).slice(0, Math.ceil(maxResults / 2));
```

- [ ] **Step 4: Syntax check**

```bash
node --check ".claude/scripts/context-assembly.js"
```

Expected: no output (clean).

- [ ] **Step 5: Smoke test (no Docker needed — degraded mode)**

```bash
node -e "
const { assembleContext } = require('./.claude/scripts/context-assembly');
assembleContext('design a database layer', 'ai-software-factory', { maxResults: 3 })
  .then(ctx => {
    console.log('summary:', ctx.summary);
    console.log('chroma_error:', ctx.chroma_error || 'none');
  })
  .catch(err => { console.error('FAIL:', err.message); process.exit(1); });
" 2>&1 | grep -E '(summary|chroma_error|Lexical index|FAIL)'
```

Expected: `Lexical index: N docs indexed` in stderr, `summary: ...` in stdout. No crash.

- [ ] **Step 6: Commit**

```bash
git add .claude/scripts/context-assembly.js
git commit -m "feat: wire hybrid search into context-assembly (Phase 16.5)"
```

---

## Task 5: Validator and package.json

**Files:**
- Create: `.claude/scripts/validate-phase-16-hybrid.js`
- Modify: `package.json`

- [ ] **Step 1: Create the validator**

```javascript
#!/usr/bin/env node
/**
 * Phase 16 Hybrid Search Validator
 *
 * 5 tests — no Docker required (all pure JS logic).
 *
 * Usage: node validate-phase-16-hybrid.js
 */

const fs   = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT        = path.resolve(__dirname, '..', '..');
const SCRIPTS_DIR = path.join(ROOT, '.claude', 'scripts');
const VAULT_DIR   = path.join(ROOT, 'Vault');

class Phase16HybridValidator {
  constructor() {
    this.passCount = 0;
    this.failCount = 0;
  }

  pass(msg) { console.log(`   ✅ PASS: ${msg}`); this.passCount++; }
  fail(msg) { console.error(`   ❌ FAIL: ${msg}`); this.failCount++; }

  // ── Test 1: New scripts exist ─────────────────────────────────────────────

  test1_ScriptsExist() {
    console.log('\n📋 Test 1: Hybrid Search Scripts Exist');
    for (const script of ['lexical-indexer.js', 'hybrid-search.js']) {
      const filePath = path.join(SCRIPTS_DIR, script);
      if (fs.existsSync(filePath)) {
        this.pass(`${script} exists`);
      } else {
        this.fail(`${script} not found`);
      }
    }
  }

  // ── Test 2: Syntax check ─────────────────────────────────────────────────

  test2_SyntaxCheck() {
    console.log('\n📋 Test 2: Syntax Check');
    for (const script of ['lexical-indexer.js', 'hybrid-search.js', 'context-assembly.js']) {
      const filePath = path.join(SCRIPTS_DIR, script);
      try {
        execSync(`node --check "${filePath}"`, { stdio: 'pipe' });
        this.pass(`${script} syntax OK`);
      } catch (err) {
        this.fail(`${script} syntax error: ${err.stderr?.toString().trim() || err.message}`);
      }
    }
  }

  // ── Test 3: loadVaultDocs returns docs ───────────────────────────────────

  test3_LoadVaultDocs() {
    console.log('\n📋 Test 3: loadVaultDocs() loads Vault files');
    try {
      const { loadVaultDocs } = require(path.join(SCRIPTS_DIR, 'lexical-indexer'));
      if (!fs.existsSync(VAULT_DIR)) {
        this.fail('Vault directory not found');
        return;
      }
      const docs = loadVaultDocs(VAULT_DIR, 'ai-software-factory');
      if (docs.length > 0) {
        this.pass(`Loaded ${docs.length} docs from Vault`);
      } else {
        this.fail('loadVaultDocs returned 0 docs — check Vault path and frontmatter');
      }
      const keys = [...new Set(docs.map(d => d.collectionKey))];
      if (keys.length > 0) {
        this.pass(`Collection keys found: ${keys.join(', ')}`);
      } else {
        this.fail('No collectionKey values on docs');
      }
    } catch (err) {
      this.fail(`loadVaultDocs threw: ${err.message}`);
    }
  }

  // ── Test 4: FlexSearch index returns results ─────────────────────────────

  test4_SearchReturnsResults() {
    console.log('\n📋 Test 4: buildIndex() + searchDocs() return results');
    try {
      const { loadVaultDocs, buildIndex, searchDocs } = require(path.join(SCRIPTS_DIR, 'lexical-indexer'));
      const docs  = loadVaultDocs(VAULT_DIR, 'ai-software-factory');
      const index = buildIndex(docs);
      const results = searchDocs(index, docs, 'architecture', 'facts', 5);
      if (results.length > 0) {
        this.pass(`searchDocs returned ${results.length} results for 'architecture' in facts`);
      } else {
        this.fail('searchDocs returned 0 results for "architecture" in facts — expected at least 1');
      }
      const allHaveFile = results.every(r => typeof r.file === 'string' && r.file.length > 0);
      if (allHaveFile) {
        this.pass('All results have file field');
      } else {
        this.fail('Some results missing file field');
      }
    } catch (err) {
      this.fail(`Search test threw: ${err.message}`);
    }
  }

  // ── Test 5: RRF merge boosts cross-pass docs ─────────────────────────────

  test5_RrfBoostIsCorrect() {
    console.log('\n📋 Test 5: rrfMerge() boosts docs appearing in both passes');
    try {
      const { rrfMerge } = require(path.join(SCRIPTS_DIR, 'hybrid-search'));

      const chromaResults = [
        { type: 'facts', content: 'Docker compose', metadata: { source_path: 'Vault/docker.md' }, relevance: 0.9, position: 1 },
        { type: 'facts', content: 'Chroma guide',   metadata: { source_path: 'Vault/chroma.md' }, relevance: 0.8, position: 2 },
      ];
      const lexicalResults = [
        { file: 'Vault/docker.md',  content: 'CHROMA_SERVER_HOST', collectionKey: 'facts', lexical_rank: 0 },
        { file: 'Vault/env.md',     content: '.env example',       collectionKey: 'facts', lexical_rank: 1 },
      ];

      const merged = rrfMerge(chromaResults, lexicalResults, 5);

      // docker.md is in both → must rank first
      if (merged[0]?.metadata?.source_path === 'Vault/docker.md') {
        this.pass('Cross-pass doc (docker.md) is ranked first');
      } else {
        this.fail(`Expected docker.md at rank 1, got: ${merged[0]?.metadata?.source_path}`);
      }

      // env.md is lexical-only → must appear
      if (merged.some(r => r.metadata?.source_path === 'Vault/env.md')) {
        this.pass('Lexical-only doc (env.md) included in merged results');
      } else {
        this.fail('Lexical-only doc (env.md) missing from merged results');
      }

      // merged.length must be 3 (2 chroma + 1 lexical-only)
      if (merged.length === 3) {
        this.pass(`Merged count correct: ${merged.length}`);
      } else {
        this.fail(`Expected 3 merged results, got ${merged.length}`);
      }
    } catch (err) {
      this.fail(`RRF test threw: ${err.message}`);
    }
  }

  // ── Runner ────────────────────────────────────────────────────────────────

  run() {
    console.log('\n🔍 Phase 16 Hybrid Search Validator');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    this.test1_ScriptsExist();
    this.test2_SyntaxCheck();
    this.test3_LoadVaultDocs();
    this.test4_SearchReturnsResults();
    this.test5_RrfBoostIsCorrect();

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Results: ${this.passCount} passed, ${this.failCount} failed`);
    if (this.failCount > 0) {
      console.error('\n❌ Phase 16 Hybrid Search: INCOMPLETE\n');
      process.exit(1);
    } else {
      console.log('\n✅ Phase 16 Hybrid Search: ALL PASS\n');
    }
  }
}

new Phase16HybridValidator().run();
```

Write to `.claude/scripts/validate-phase-16-hybrid.js`.

- [ ] **Step 2: Add script to package.json**

In `package.json`, in the `scripts` object:

1. Add after `"test:phase-16": ...`:
```json
"test:phase-16-hybrid": "node ./.claude/scripts/validate-phase-16-hybrid.js",
```

2. In `test:all` and `test` commands, append `&& node ./.claude/scripts/validate-phase-16-hybrid.js` at the end of the chain.

- [ ] **Step 3: Run the validator**

```bash
node ".claude/scripts/validate-phase-16-hybrid.js"
```

Expected: `✅ Phase 16 Hybrid Search: ALL PASS` with 7/7 (or 8/8 if all sub-checks counted) passing.

- [ ] **Step 4: Run full test suite**

```bash
npm test
```

Expected: All suites pass (Chroma-related tests will show `Failed to connect` warnings — that is expected and does not count as failure per existing behavior).

- [ ] **Step 5: Commit**

```bash
git add .claude/scripts/validate-phase-16-hybrid.js package.json
git commit -m "feat: Phase 16.4-16.5 hybrid search validator + package.json scripts"
```

---

## Self-Review

**Spec coverage:**
- ✅ 16.4: FlexSearch lexical index over Vault content (`lexical-indexer.js`)
- ✅ 16.5: RRF merge of vector + lexical results (`hybrid-search.js`)
- ✅ 16.5: `context-assembly.js` uses hybrid search instead of vector-only
- ✅ RRF formula `score = Σ 1/(60 + rank)` implemented in `rrfMerge()`
- ✅ Documents appearing in both passes are boosted (verified in Test 5)
- ✅ Lexical-only documents appear in output
- ✅ Graceful degradation if FlexSearch fails (falls back to Chroma-only)
- ⚠️ 16.4 mentions "trigger lexical index updates on document changes" — this plan uses on-demand build instead. Disk persistence is deferred; on-demand rebuild is fast enough given Vault size (~180 files).

**Placeholder scan:** No TBDs, TODOs, or vague steps found.

**Type consistency:**
- `loadVaultDocs()` → array of `{id, file, content, collectionKey}` — used consistently in Tasks 2, 4, 5
- `buildIndex(docs)` → `Index` — used consistently in Tasks 2, 4, 5
- `searchDocs(index, docs, query, collectionKey, nResults)` → array with `lexical_rank` — used consistently
- `rrfMerge(chromaResults, lexicalResults, nResults)` — signature consistent across Tasks 3 and 5
- Join key: `source_path` (Chroma) ↔ `file` (lexical) — consistently normalized to forward slashes
