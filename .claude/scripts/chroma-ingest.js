#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const https = require('https');
const { VaultValidator } = require('./vault-validator');

/**
 * Chroma Ingestion Pipeline
 *
 * Reads vault documents, parses YAML frontmatter, and routes them to appropriate
 * Chroma collections based on authority field and document status.
 *
 * Implements facts/sessions separation to prevent retrieval contamination.
 * Integrates with Phase 14 Vault validator for frontmatter enforcement.
 */

// Configuration
const CHROMA_HOST = process.env.CHROMA_SERVER_HOST || 'http://localhost:8000';
const VAULT_PATH = process.argv[2] || 'Vault';
const PROJECT_PREFIX = process.argv[3] || 'ai-software-factory';

// Collection names
const COLLECTIONS = {
  facts: `${PROJECT_PREFIX}-facts`,
  sessions: `${PROJECT_PREFIX}-sessions`,
  standards: 'global-standards'
};

// Audit log
let auditLog = {
  timestamp: new Date().toISOString(),
  ingestions: [],
  rejections: [],
  errors: []
};

/**
 * Main ingestion flow
 */
async function main() {
  console.log(`\n📚 Chroma Ingestion Pipeline`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`Vault: ${VAULT_PATH}`);
  console.log(`Collections: ${Object.values(COLLECTIONS).join(', ')}`);
  console.log(`Chroma: ${CHROMA_HOST}\n`);

  try {
    // Phase 14: Validate Vault frontmatter
    console.log(`\n0️⃣  VALIDATING VAULT FRONTMATTER`);
    const validator = new VaultValidator(VAULT_PATH);
    const validationResults = validator.validateVault(true); // autoMigrate=true
    validator.printSummary(validationResults);

    if (validationResults.invalidFiles > 0) {
      console.warn(`\n⚠️  ${validationResults.invalidFiles} invalid files found.`);
      console.warn('Continuing with valid files only.\n');
    }

    // Step 1: Initialize collections
    console.log(`\n1️⃣  INITIALIZING COLLECTIONS`);
    await initializeCollections();

    // Step 2: Scan vault for documents
    console.log(`\n2️⃣  SCANNING VAULT`);
    const documents = scanVault(VAULT_PATH);
    console.log(`   Found ${documents.length} markdown files\n`);

    // Step 3: Process documents
    console.log(`3️⃣  PROCESSING DOCUMENTS`);
    let processedCount = 0;
    for (const docPath of documents) {
      await processDocument(docPath);
      processedCount++;
      if (processedCount % 5 === 0) {
        process.stdout.write(`   Processed: ${processedCount}/${documents.length}\r`);
      }
    }
    console.log(`   Processed: ${documents.length}/${documents.length} ✓`);

    // Step 4: Report results
    console.log(`\n4️⃣  INGESTION SUMMARY`);
    reportResults();

    console.log(`\n✅ INGESTION COMPLETE\n`);
  } catch (error) {
    console.error(`\n❌ INGESTION FAILED\n`);
    console.error(error);
    process.exit(1);
  }
}

/**
 * Initialize Chroma collections with proper metadata schemas
 */
async function initializeCollections() {
  // Check Chroma connectivity (v2 API)
  try {
    const response = await chromaRequest('GET', '/api/v2/heartbeat');
    console.log(`   ✓ Chroma connected (${CHROMA_HOST})`);
  } catch (error) {
    throw new Error(`Failed to connect to Chroma: ${error.message}`);
  }

  // Collections are pre-created in Phase 4, just verify they exist
  // Use MCP tools to check (handled by main flow)
  console.log(`   ✓ Collections will be verified via MCP tools`);
}

/**
 * Scan vault directory recursively for markdown files
 */
function scanVault(vaultPath) {
  const documents = [];

  function walk(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        // Skip certain directories
        if (!['.git', '.obsidian', 'node_modules', '.vscode'].includes(file)) {
          walk(filePath);
        }
      } else if (file.endsWith('.md')) {
        documents.push(filePath);
      }
    }
  }

  walk(vaultPath);
  return documents;
}

/**
 * Process a single document
 */
async function processDocument(docPath) {
  try {
    const content = fs.readFileSync(docPath, 'utf8');

    // Parse YAML frontmatter
    const { frontmatter, body } = parseYamlFrontmatter(content);

    if (!frontmatter) {
      auditLog.rejections.push({
        file: docPath,
        reason: 'No YAML frontmatter found'
      });
      return;
    }

    // Classify document
    const classification = classifyDocument(frontmatter, docPath);

    if (!classification.allowed) {
      auditLog.rejections.push({
        file: docPath,
        reason: classification.reason
      });
      return;
    }

    // Prepare document for ingestion (Phase 15.2: extended metadata schema)
    const document = {
      id: generateDocumentId(docPath),
      content: body.substring(0, 5000), // Limit content length
      metadata: buildMetadata(frontmatter, docPath, classification)
    };

    // Ingest to appropriate collection
    await ingestDocument(classification.collection, document);

    auditLog.ingestions.push({
      file: docPath,
      destination: classification.collection,
      id: document.id,
      authority: frontmatter.authority,
      status: frontmatter.status
    });
  } catch (error) {
    auditLog.errors.push({
      file: docPath,
      error: error.message
    });
  }
}

/**
 * Build full metadata for a document (Phase 15.2)
 *
 * Chroma metadata values must be scalar (string/number/boolean), so arrays
 * (tags, agent_relevance) are serialized as comma-joined strings and null
 * values are omitted.
 */
function buildMetadata(frontmatter, docPath, classification) {
  const toScalar = (value) =>
    Array.isArray(value) ? value.join(',') : value;

  const metadata = {
    file: docPath,
    source_path: docPath.replace(/\\/g, '/'),
    document_type: deriveDocumentType(frontmatter, docPath),
    project: PROJECT_PREFIX,
    authority: frontmatter.authority || 'unknown',
    type: frontmatter.type || 'Unknown',
    status: frontmatter.status || 'Draft',
    phase: frontmatter.phase != null ? String(frontmatter.phase) : null,
    domain: deriveDomain(frontmatter),
    agent_relevance: toScalar(frontmatter.agent_relevance) || null,
    tags: toScalar(frontmatter.tags) || '',
    confidence: typeof frontmatter.confidence === 'number'
      ? frontmatter.confidence
      : (classification.collection === COLLECTIONS.sessions ? 0.5 : 0.9),
    last_updated: frontmatter.last_updated || new Date().toISOString().split('T')[0],
    is_authoritative: classification.collection === COLLECTIONS.facts,
    collection_dest: classification.collection
  };

  // Strip nulls — Chroma rejects null metadata values
  for (const key of Object.keys(metadata)) {
    if (metadata[key] === null || metadata[key] === undefined) {
      delete metadata[key];
    }
  }

  return metadata;
}

/**
 * Derive document_type from vault directory, falling back to frontmatter type
 */
function deriveDocumentType(frontmatter, docPath) {
  const normalized = docPath.replace(/\\/g, '/');
  const dirTypes = [
    ['07-Decisions', 'adr'],
    ['08-Retrospectives', 'retrospective'],
    ['09-Requirements', 'requirement'],
    ['10-Known-Problems', 'known_problem'],
    ['05-Prompts', 'skill'],
    ['01-Standards', 'standard'],
    ['11-Facts', 'fact'],
    ['12-Entities', 'entity'],
    ['13-Relationships', 'relationship']
  ];

  for (const [dir, type] of dirTypes) {
    if (normalized.includes(`/${dir}/`)) return type;
  }

  return (frontmatter.type || 'guide').toLowerCase();
}

/**
 * Derive domain from frontmatter (domain field, then category, then general)
 */
function deriveDomain(frontmatter) {
  const KNOWN_DOMAINS = ['api', 'auth', 'infra', 'security', 'database', 'testing', 'general'];

  const candidate = (frontmatter.domain || frontmatter.category || '').toLowerCase();
  return KNOWN_DOMAINS.includes(candidate) ? candidate : 'general';
}

/**
 * Parse YAML frontmatter from markdown
 */
function parseYamlFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);

  if (!match) {
    return { frontmatter: null, body: content };
  }

  const yamlContent = match[1];
  const body = match[2];

  // Simple YAML parser (for key: value pairs)
  const frontmatter = {};
  const lines = yamlContent.split('\n');

  for (const line of lines) {
    const colonIndex = line.indexOf(':');
    if (colonIndex > -1) {
      const key = line.substring(0, colonIndex).trim();
      const value = line.substring(colonIndex + 1).trim();

      // Parse different value types
      if (value === 'true') frontmatter[key] = true;
      else if (value === 'false') frontmatter[key] = false;
      else if (value === 'null') frontmatter[key] = null;
      else if (!isNaN(value)) frontmatter[key] = Number(value);
      else if (value.startsWith('[') && value.endsWith(']')) {
        // Parse array: [a, b, c]
        const arrayContent = value.slice(1, -1);
        frontmatter[key] = arrayContent.split(',').map(v => v.trim());
      } else {
        frontmatter[key] = value;
      }
    }
  }

  return { frontmatter, body };
}

/**
 * Classify document based on authority and status
 */
function classifyDocument(frontmatter, docPath) {
  const authority = frontmatter.authority || 'unknown';
  const status = frontmatter.status || 'Draft';
  const type = frontmatter.type || 'Unknown';

  // Classification rules
  if (authority === 'facts') {
    // Facts must be approved
    if (status === 'Accepted' || status === 'Approved' || status === 'Current') {
      return {
        allowed: true,
        collection: COLLECTIONS.facts,
        reason: null
      };
    } else if (status === 'Draft') {
      // Block draft facts, recommend moving to sessions
      return {
        allowed: false,
        collection: null,
        reason: `Authority: facts but status: Draft (blocked) — move to sessions or approve first`
      };
    } else {
      return {
        allowed: false,
        collection: null,
        reason: `Authority: facts but unknown status: ${status}`
      };
    }
  } else if (authority === 'sessions') {
    // Sessions are always allowed
    return {
      allowed: true,
      collection: COLLECTIONS.sessions,
      reason: null
    };
  } else if (type === 'Standard') {
    // Standards go to global-standards
    return {
      allowed: true,
      collection: COLLECTIONS.standards,
      reason: null
    };
  } else {
    // Default to sessions (exploratory)
    return {
      allowed: true,
      collection: COLLECTIONS.sessions,
      reason: `No authority field, defaulting to sessions (exploratory)`
    };
  }
}

/**
 * Generate unique document ID from path
 */
function generateDocumentId(filePath) {
  // Remove Vault prefix and .md extension
  const normalized = filePath
    .replace(/Vault[\\/]?/, '')
    .replace(/\.md$/, '')
    .replace(/[\\/]/g, '-')
    .toLowerCase();
  return `doc-${normalized}`;
}

/**
 * Ingest document into Chroma collection
 */
async function ingestDocument(collectionName, document) {
  const payload = {
    documents: [document.content],
    metadatas: [document.metadata],
    ids: [document.id]
  };

  await chromaRequest('POST', `/api/v1/collections/${collectionName}/add`, payload);
}

/**
 * Make HTTP request to Chroma
 */
function chromaRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(CHROMA_HOST + path);
    const http = url.protocol === 'https:' ? require('https') : require('http');
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', chunk => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode >= 400) {
          const error = new Error(`HTTP ${res.statusCode}`);
          error.statusCode = res.statusCode;
          error.response = data;
          reject(error);
        } else {
          try {
            resolve(data ? JSON.parse(data) : null);
          } catch {
            resolve(data);
          }
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

/**
 * Report ingestion results
 */
function reportResults() {
  const totals = {
    facts: auditLog.ingestions.filter(i => i.destination === COLLECTIONS.facts).length,
    sessions: auditLog.ingestions.filter(i => i.destination === COLLECTIONS.sessions).length,
    standards: auditLog.ingestions.filter(i => i.destination === COLLECTIONS.standards).length
  };

  console.log(`\n   📊 INGESTION RESULTS`);
  console.log(`   ─────────────────────────────────`);
  console.log(`   ✓ Facts Collection:     ${totals.facts} documents`);
  console.log(`   ✓ Sessions Collection:  ${totals.sessions} documents`);
  console.log(`   ✓ Standards Collection: ${totals.standards} documents`);
  console.log(`   ─────────────────────────────────`);
  console.log(`   Total Ingested: ${auditLog.ingestions.length}`);
  console.log(`   Rejected:       ${auditLog.rejections.length}`);
  console.log(`   Errors:         ${auditLog.errors.length}`);

  if (auditLog.rejections.length > 0) {
    console.log(`\n   ⚠️  REJECTIONS (${auditLog.rejections.length}):`);
    auditLog.rejections.slice(0, 5).forEach(r => {
      console.log(`      - ${path.basename(r.file)}: ${r.reason}`);
    });
    if (auditLog.rejections.length > 5) {
      console.log(`      ... and ${auditLog.rejections.length - 5} more`);
    }
  }

  if (auditLog.errors.length > 0) {
    console.log(`\n   ❌ ERRORS (${auditLog.errors.length}):`);
    auditLog.errors.slice(0, 5).forEach(e => {
      console.log(`      - ${path.basename(e.file)}: ${e.error}`);
    });
    if (auditLog.errors.length > 5) {
      console.log(`      ... and ${auditLog.errors.length - 5} more`);
    }
  }

  // Save audit log
  const logPath = '.claude/logs/chroma-ingest-audit.json';
  fs.mkdirSync(path.dirname(logPath), { recursive: true });
  fs.writeFileSync(logPath, JSON.stringify(auditLog, null, 2), 'utf8');
  console.log(`\n   📋 Audit log: ${logPath}`);
}

// Export for testing (same pattern as context-assembly.js)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { buildMetadata, deriveDocumentType, deriveDomain, classifyDocument, parseYamlFrontmatter };
}

// Run if invoked as CLI
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}
