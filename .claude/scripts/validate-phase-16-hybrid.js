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

      if (merged[0]?.metadata?.source_path === 'Vault/docker.md') {
        this.pass('Cross-pass doc (docker.md) is ranked first');
      } else {
        this.fail(`Expected docker.md at rank 1, got: ${merged[0]?.metadata?.source_path}`);
      }

      if (merged.some(r => r.metadata?.source_path === 'Vault/env.md')) {
        this.pass('Lexical-only doc (env.md) included in merged results');
      } else {
        this.fail('Lexical-only doc (env.md) missing from merged results');
      }

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
