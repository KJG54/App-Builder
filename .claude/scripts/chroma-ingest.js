#!/usr/bin/env node

/**
 * Chroma Ingestion Pipeline
 *
 * Reads Vault documents, parses YAML frontmatter, and routes them to the
 * appropriate Chroma collections based on authority field and document status.
 *
 * Uses the chromadb JS SDK (ADR-INFRA-003) — replaces the broken v1 HTTP calls.
 *
 * Collections:
 *   {project}-facts     — Approved ADRs, requirements, architecture (authoritative)
 *   {project}-sessions  — Session notes, retrospectives (exploratory)
 *   global-standards    — Cross-project governance standards
 */

const fs = require('fs');
const path = require('path');
const { ChromaClient } = require('chromadb');
const { DefaultEmbeddingFunction } = require('@chroma-core/default-embed');
const { VaultValidator } = require('./vault-validator');

// ── Configuration ─────────────────────────────────────────────────────────────

const CHROMA_HOST = process.env.CHROMA_SERVER_HOST || 'localhost';
const CHROMA_PORT = parseInt(process.env.CHROMA_SERVER_PORT || '8000');
const VAULT_PATH  = path.resolve(process.argv[2] || 'Vault');
const PROJECT_PREFIX = process.argv[3] || 'ai-software-factory';

const COLLECTIONS = {
  facts:     `${PROJECT_PREFIX}-facts`,
  sessions:  `${PROJECT_PREFIX}-sessions`,
  standards: 'global-standards',
};

// ── State ─────────────────────────────────────────────────────────────────────

const auditLog = {
  timestamp:  new Date().toISOString(),
  ingestions: [],
  rejections: [],
  errors:     [],
};

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n📚 Chroma Ingestion Pipeline`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`Vault:       ${VAULT_PATH}`);
  console.log(`Collections: ${Object.values(COLLECTIONS).join(', ')}`);
  console.log(`Chroma:      http://${CHROMA_HOST}:${CHROMA_PORT}\n`);

  const client = new ChromaClient({ host: CHROMA_HOST, port: CHROMA_PORT });
  const ef     = new DefaultEmbeddingFunction();

  // 0. Validate Vault frontmatter
  console.log(`\n0️⃣  VALIDATING VAULT FRONTMATTER`);
  const validator = new VaultValidator(VAULT_PATH);
  const validationResults = validator.validateVault(true);
  validator.printSummary(validationResults);

  // 1. Verify Chroma connectivity
  console.log(`\n1️⃣  CONNECTING TO CHROMA`);
  try {
    await client.heartbeat();
    console.log(`   ✓ Chroma connected`);
  } catch (err) {
    throw new Error(`Cannot reach Chroma at ${CHROMA_HOST}:${CHROMA_PORT} — ${err.message}`);
  }

  // 2. Initialize collections
  console.log(`\n2️⃣  INITIALIZING COLLECTIONS`);
  const cols = {};
  for (const [key, name] of Object.entries(COLLECTIONS)) {
    cols[key] = await client.getOrCreateCollection({ name, embeddingFunction: ef });
    console.log(`   ✓ ${name}`);
  }

  // 3. Scan Vault
  console.log(`\n3️⃣  SCANNING VAULT`);
  const documents = scanVault(VAULT_PATH);
  console.log(`   Found ${documents.length} markdown files\n`);

  // 4. Process documents
  console.log(`4️⃣  PROCESSING DOCUMENTS`);
  let processed = 0;
  for (const docPath of documents) {
    await processDocument(docPath, cols, ef);
    processed++;
    if (processed % 10 === 0) {
      process.stdout.write(`   Processed: ${processed}/${documents.length}\r`);
    }
  }
  console.log(`   Processed: ${documents.length}/${documents.length} ✓`);

  // 5. Report
  console.log(`\n5️⃣  INGESTION SUMMARY`);
  reportResults();

  console.log(`\n✅ INGESTION COMPLETE\n`);
}

// ── Document processing ────────────────────────────────────────────────────────

async function processDocument(docPath, cols, ef) {
  try {
    const content = fs.readFileSync(docPath, 'utf8');
    const { frontmatter, body } = parseYamlFrontmatter(content);

    if (!frontmatter) {
      auditLog.rejections.push({ file: docPath, reason: 'No YAML frontmatter' });
      return;
    }

    const classification = classifyDocument(frontmatter, docPath);
    if (!classification.allowed) {
      auditLog.rejections.push({ file: docPath, reason: classification.reason });
      return;
    }

    const docId   = generateDocumentId(docPath);
    const docText = body.substring(0, 5000);
    const meta    = buildMetadata(frontmatter, docPath, classification);
    const col     = cols[classification.key];

    // Upsert so re-runs are idempotent
    await col.upsert({ ids: [docId], documents: [docText], metadatas: [meta] });

    auditLog.ingestions.push({
      file:        docPath,
      destination: classification.collection,
      id:          docId,
      authority:   frontmatter.authority,
      status:      frontmatter.status,
    });
  } catch (err) {
    auditLog.errors.push({ file: docPath, error: err.message });
  }
}

// ── Vault scanning ─────────────────────────────────────────────────────────────

function scanVault(vaultPath) {
  const docs = [];
  const SKIP_DIRS = new Set(['.git', '.obsidian', 'node_modules', '.vscode']);

  function walk(dir) {
    for (const entry of fs.readdirSync(dir)) {
      const full = path.join(dir, entry);
      if (fs.statSync(full).isDirectory()) {
        if (!SKIP_DIRS.has(entry)) walk(full);
      } else if (entry.endsWith('.md')) {
        docs.push(full);
      }
    }
  }

  walk(vaultPath);
  return docs;
}

// ── Classification ─────────────────────────────────────────────────────────────

function classifyDocument(frontmatter, docPath) {
  const authority = (frontmatter.authority || 'unknown').toLowerCase();
  const status    = (frontmatter.status    || 'draft').toLowerCase();
  const type      = (frontmatter.type      || '').toLowerCase();

  // Standards always go to global-standards regardless of authority
  if (type === 'standard' || frontmatter.type === 'Standard') {
    return { allowed: true, key: 'standards', collection: COLLECTIONS.standards };
  }

  if (authority === 'facts') {
    if (['accepted', 'approved', 'current', 'active', 'complete', 'verified'].includes(status)) {
      return { allowed: true, key: 'facts', collection: COLLECTIONS.facts };
    }
    return {
      allowed: false,
      reason: `authority:facts but status:${status} — approve first`,
    };
  }

  if (authority === 'sessions') {
    return { allowed: true, key: 'sessions', collection: COLLECTIONS.sessions };
  }

  // Default: sessions (exploratory)
  return { allowed: true, key: 'sessions', collection: COLLECTIONS.sessions };
}

// ── Metadata builder ───────────────────────────────────────────────────────────

function buildMetadata(frontmatter, docPath, classification) {
  const toStr = v => Array.isArray(v) ? v.join(',') : (v != null ? String(v) : null);

  const meta = {
    file:             docPath.replace(/\\/g, '/'),
    source_path:      docPath.replace(/\\/g, '/'),
    document_type:    deriveDocumentType(frontmatter, docPath),
    project:          PROJECT_PREFIX,
    authority:        frontmatter.authority  || 'unknown',
    type:             frontmatter.type       || 'guide',
    status:           frontmatter.status     || 'draft',
    phase:            frontmatter.phase != null ? String(frontmatter.phase) : null,
    domain:           deriveDomain(frontmatter),
    tags:             toStr(frontmatter.tags) || '',
    agent_relevance:  toStr(frontmatter.agent_relevance),
    confidence:       classification.key === 'sessions' ? 0.5 : 0.9,
    last_updated:     frontmatter.last_updated || new Date().toISOString().split('T')[0],
    is_authoritative: classification.key === 'facts' || classification.key === 'standards',
    collection_dest:  classification.collection,
  };

  // Chroma rejects null metadata values — strip them
  for (const key of Object.keys(meta)) {
    if (meta[key] === null || meta[key] === undefined) delete meta[key];
  }

  return meta;
}

function deriveDocumentType(frontmatter, docPath) {
  const p = docPath.replace(/\\/g, '/');
  const MAP = [
    ['07-Decisions',     'adr'],
    ['08-Retrospectives','retrospective'],
    ['09-Requirements',  'requirement'],
    ['10-Known-Problems','known_problem'],
    ['05-Prompts',       'skill'],
    ['01-Standards',     'standard'],
    ['11-Facts',         'fact'],
    ['12-Entities',      'entity'],
    ['13-Relationships', 'relationship'],
  ];
  for (const [dir, type] of MAP) {
    if (p.includes(`/${dir}/`)) return type;
  }
  return (frontmatter.type || 'guide').toLowerCase();
}

function deriveDomain(frontmatter) {
  const KNOWN = new Set(['api','auth','infra','security','database','testing','general']);
  const candidate = (frontmatter.domain || frontmatter.category || '').toLowerCase();
  return KNOWN.has(candidate) ? candidate : 'general';
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function parseYamlFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return { frontmatter: null, body: content };

  const frontmatter = {};
  for (const line of match[1].split(/\r?\n/)) {
    const colon = line.indexOf(':');
    if (colon < 1) continue;
    const key = line.substring(0, colon).trim();
    const val = line.substring(colon + 1).trim();
    if      (val === 'true')                              frontmatter[key] = true;
    else if (val === 'false')                             frontmatter[key] = false;
    else if (val === 'null' || val === '')                frontmatter[key] = null;
    else if (!isNaN(val) && val !== '')                   frontmatter[key] = Number(val);
    else if (val.startsWith('[') && val.endsWith(']'))    frontmatter[key] = val.slice(1,-1).split(',').map(v => v.trim());
    else                                                  frontmatter[key] = val;
  }

  return { frontmatter, body: match[2] };
}

function generateDocumentId(filePath) {
  return 'doc-' + filePath
    .replace(/Vault[\\/]?/, '')
    .replace(/\.md$/, '')
    .replace(/[\\/]/g, '-')
    .toLowerCase();
}

function reportResults() {
  const totals = {
    facts:     auditLog.ingestions.filter(i => i.destination === COLLECTIONS.facts).length,
    sessions:  auditLog.ingestions.filter(i => i.destination === COLLECTIONS.sessions).length,
    standards: auditLog.ingestions.filter(i => i.destination === COLLECTIONS.standards).length,
  };

  console.log(`\n   📊 INGESTION RESULTS`);
  console.log(`   ─────────────────────────────────`);
  console.log(`   ✓ Facts:     ${totals.facts} documents`);
  console.log(`   ✓ Sessions:  ${totals.sessions} documents`);
  console.log(`   ✓ Standards: ${totals.standards} documents`);
  console.log(`   ─────────────────────────────────`);
  console.log(`   Total Ingested: ${auditLog.ingestions.length}`);
  console.log(`   Rejected:       ${auditLog.rejections.length}`);
  console.log(`   Errors:         ${auditLog.errors.length}`);

  if (auditLog.rejections.length > 0) {
    console.log(`\n   ⚠️  REJECTIONS (showing first 5):`);
    auditLog.rejections.slice(0, 5).forEach(r =>
      console.log(`      - ${path.basename(r.file)}: ${r.reason}`)
    );
  }

  if (auditLog.errors.length > 0) {
    console.log(`\n   ❌ ERRORS:`);
    auditLog.errors.forEach(e =>
      console.log(`      - ${path.basename(e.file)}: ${e.error}`)
    );
  }

  const logPath = path.join('.claude', 'logs', 'chroma-ingest-audit.json');
  fs.mkdirSync(path.dirname(logPath), { recursive: true });
  fs.writeFileSync(logPath, JSON.stringify(auditLog, null, 2), 'utf8');
  console.log(`\n   📋 Audit log: ${logPath}`);
}

// ── Cross-project vault ingestion ─────────────────────────────────────────────
//
// Ingests an external project's Vault into a single flat Chroma collection.
// Used by scaffold-project.js and build-runner.js for cross-project indexing.
//
// CLI:  node chroma-ingest.js --project-vault <vaultPath> <collectionName>
// API:  await ingestProjectVault(vaultPath, collectionName)
//
// All documents are routed to one collection — no facts/sessions split.
// Useful similarity threshold for reuse detection: 0.85+

async function ingestProjectVault(vaultPath, collectionName) {
  const absVaultPath = path.resolve(vaultPath);

  if (!fs.existsSync(absVaultPath)) {
    throw new Error(`Project Vault not found: ${absVaultPath}`);
  }

  console.log(`\n📦 Cross-Project Vault Ingestion`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`Vault:      ${absVaultPath}`);
  console.log(`Collection: ${collectionName}`);
  console.log(`Chroma:     http://${CHROMA_HOST}:${CHROMA_PORT}\n`);

  const client = new ChromaClient({ host: CHROMA_HOST, port: CHROMA_PORT });
  const ef     = new DefaultEmbeddingFunction();

  try {
    await client.heartbeat();
    console.log(`   ✓ Chroma connected`);
  } catch (err) {
    throw new Error(`Cannot reach Chroma at ${CHROMA_HOST}:${CHROMA_PORT} — ${err.message}`);
  }

  const col = await client.getOrCreateCollection({ name: collectionName, embeddingFunction: ef });
  console.log(`   ✓ Collection ready: ${collectionName}`);

  const documents = scanVault(absVaultPath);
  console.log(`\n   Found ${documents.length} documents`);

  const projectLog = { ingested: 0, skipped: 0, errors: [] };

  for (const docPath of documents) {
    try {
      const content = fs.readFileSync(docPath, 'utf8');
      const { frontmatter, body } = parseYamlFrontmatter(content);

      if (!frontmatter) { projectLog.skipped++; continue; }

      const docId   = 'proj-' + collectionName + '-' + generateDocumentId(docPath);
      const docText = body.substring(0, 5000);
      const meta    = {
        file:          docPath.replace(/\\/g, '/'),
        collection:    collectionName,
        project:       collectionName,
        type:          (frontmatter.type   || 'guide').toLowerCase(),
        status:        (frontmatter.status || 'draft').toLowerCase(),
        last_updated:  frontmatter.last_updated || new Date().toISOString().split('T')[0],
        tags:          Array.isArray(frontmatter.tags) ? frontmatter.tags.join(',') : (frontmatter.tags || ''),
      };

      await col.upsert({ ids: [docId], documents: [docText], metadatas: [meta] });
      projectLog.ingested++;
    } catch (err) {
      projectLog.errors.push({ file: docPath, error: err.message });
    }
  }

  console.log(`\n   ✓ Ingested: ${projectLog.ingested}`);
  if (projectLog.skipped > 0)  console.log(`   ⚠ Skipped:  ${projectLog.skipped} (no frontmatter)`);
  if (projectLog.errors.length) console.log(`   ✗ Errors:   ${projectLog.errors.length}`);
  console.log(`\n✅ Cross-project ingestion complete\n`);

  return projectLog;
}

// ── Exports / entry point ──────────────────────────────────────────────────────

module.exports = { buildMetadata, deriveDocumentType, deriveDomain, classifyDocument, parseYamlFrontmatter, ingestProjectVault };

if (require.main === module) {
  const args = process.argv.slice(2);
  if (args[0] === '--project-vault') {
    // Cross-project mode: --project-vault <vaultPath> <collectionName>
    const [, vaultPath, collectionName] = args;
    if (!vaultPath || !collectionName) {
      console.error('Usage: chroma-ingest.js --project-vault <vaultPath> <collectionName>');
      process.exit(1);
    }
    ingestProjectVault(vaultPath, collectionName).catch(err => {
      console.error('Fatal:', err.message);
      process.exit(1);
    });
  } else {
    main().catch(err => {
      console.error('Fatal:', err.message);
      process.exit(1);
    });
  }
}
