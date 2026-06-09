#!/usr/bin/env node

/**
 * Context Assembly API
 *
 * Implements Phase 2 of the Knowledge-First Pipeline (ADR-ARCH-001):
 * Given a task query, retrieve and assemble authoritative context from Chroma.
 *
 * Output: Structured context with facts, standards, and optional sessions
 * for agents to use before making decisions.
 */

const fs = require('fs');
const path = require('path');

// Configuration
const CHROMA_HOST = process.env.CHROMA_HOST || 'http://localhost:8000';
const VAULT_DIR = process.env.VAULT_PATH || 'Vault';
const PROJECT_NAME = process.argv[2] || 'ai-software-factory';
const QUERY = process.argv[3] || 'What should I know?';
const INCLUDE_SESSIONS = process.argv[4] === '--include-sessions';
const MAX_RESULTS = parseInt(process.argv[5] || '5');

/**
 * Main context assembly flow
 */
async function main() {
  try {
    const context = await assembleContext(
      QUERY,
      PROJECT_NAME,
      { includeSession: INCLUDE_SESSIONS, maxResults: MAX_RESULTS }
    );

    // Output as JSON for programmatic use
    console.log(JSON.stringify(context, null, 2));
  } catch (error) {
    console.error('Context assembly failed:', error.message);
    process.exit(1);
  }
}

/**
 * Assemble task-specific context from Chroma
 *
 * @param {string} query - Task description or question
 * @param {string} projectName - Project name (e.g., ai-software-factory)
 * @param {object} options - {
 *   includeSession: bool,
 *   maxResults: int,
 *   agentRole: string|null,   // Phase 15.3: include agent memory for this role
 *   filters: object           // Phase 15.2: metadata filters (e.g., { domain: 'api' })
 * }
 * @returns {object} - Context with facts, standards, sessions, agent_memory, relationships
 */
async function assembleContext(query, projectName, options = {}) {
  const {
    includeSession = false,
    maxResults = 5,
    agentRole = null,
    filters = {}
  } = options;

  const context = {
    timestamp: new Date().toISOString(),
    query: query,
    projectName: projectName,
    agentRole: agentRole,
    standards: [],
    facts: [],
    sessions: [],
    agent_memory: {},
    relationships: [],
    session_handoff: null,
    summary: null
  };

  console.error(`[Context Assembly] Query: "${query}"`);
  console.error(`[Context Assembly] Project: ${projectName}`);
  console.error(`[Context Assembly] Max Results: ${maxResults}`);

  try {
    // 1. ALWAYS query global standards (mandatory constraints)
    console.error(`[Context Assembly] Querying global-standards...`);
    const standardsResults = await queryChromaCollection(
      'global-standards',
      query,
      maxResults,
      buildWhere({ is_authoritative: true }, filters)
    );

    context.standards = formatResults(standardsResults, 'standards');
    console.error(`[Context Assembly] Found ${context.standards.length} standards`);

    // 2. Query project facts (decisions, requirements, architecture)
    console.error(`[Context Assembly] Querying ${projectName}-facts...`);
    const factsResults = await queryChromaCollection(
      `${projectName}-facts`,
      query,
      maxResults,
      buildWhere({ is_authoritative: true }, filters)
    );

    context.facts = formatResults(factsResults, 'facts');
    console.error(`[Context Assembly] Found ${context.facts.length} facts`);

    // 3. Optionally query sessions (background/history)
    if (includeSession) {
      console.error(`[Context Assembly] Querying ${projectName}-sessions...`);
      const sessionResults = await queryChromaCollection(
        `${projectName}-sessions`,
        query,
        Math.floor(maxResults / 2),
        buildWhere({ is_authoritative: false }, filters)
      );

      context.sessions = formatResults(sessionResults, 'sessions');
      console.error(`[Context Assembly] Found ${context.sessions.length} sessions`);
    }
  } catch (error) {
    // Chroma unavailable — degrade gracefully, local sources below still load
    console.error(`[Context Assembly] Chroma error (continuing with local sources): ${error.message}`);
    context.chroma_error = error.message;
  }

  // 4. Phase 15.3: Agent memory from Vault/14-Agent-Memory/<agent>/
  if (agentRole) {
    context.agent_memory = loadAgentMemory(agentRole);
    console.error(`[Context Assembly] Agent memory for '${agentRole}': ${context.agent_memory.content ? 'loaded' : 'none'}`);
  }

  // 5. Phase 15.3: Relationships from Vault/13-Relationships/
  context.relationships = loadRelationships();
  console.error(`[Context Assembly] Found ${context.relationships.length} relationships`);

  // 6. Phase 15.5: Recent session handoff from Vault/00-Inbox/
  context.session_handoff = loadSessionHandoff();
  if (context.session_handoff) {
    console.error(`[Context Assembly] Session handoff: ${context.session_handoff.file}`);
  }

  // Generate summary
  context.summary = generateSummary(context);
  console.error(`[Context Assembly] Complete. Total items: ${context.standards.length + context.facts.length + context.sessions.length + context.relationships.length}`);

  return context;
}

/**
 * Build a Chroma where clause from a base condition plus optional metadata
 * filters (Phase 15.2). Multiple conditions are combined with $and.
 */
function buildWhere(base, filters = {}) {
  const conditions = { ...base, ...filters };
  const keys = Object.keys(conditions);

  if (keys.length <= 1) {
    return conditions;
  }

  return { $and: keys.map(key => ({ [key]: conditions[key] })) };
}

/**
 * Load agent memory file for a role (Phase 15.3)
 * Returns { agent, file, content } — content is the raw memory.yaml text.
 * Structured parsing/updating is the Phase 17 memory-updater's concern.
 */
function loadAgentMemory(agentRole) {
  const memoryFile = path.join(VAULT_DIR, '14-Agent-Memory', agentRole, 'memory.yaml');

  try {
    const content = fs.readFileSync(memoryFile, 'utf8');
    return { agent: agentRole, file: memoryFile, content };
  } catch (err) {
    return { agent: agentRole, file: memoryFile, content: null };
  }
}

/**
 * Load relationship documents from Vault/13-Relationships/ (Phase 15.3)
 */
function loadRelationships() {
  const relDir = path.join(VAULT_DIR, '13-Relationships');

  try {
    return fs.readdirSync(relDir)
      .filter(f => f.endsWith('.md') && f !== 'README.md')
      .map(f => ({
        type: 'relationship',
        file: path.join(relDir, f),
        content: fs.readFileSync(path.join(relDir, f), 'utf8')
      }));
  } catch (err) {
    return [];
  }
}

/**
 * Load the most recent session handoff from Vault/00-Inbox/ (Phase 15.5)
 * Only handoffs from the last 7 days are considered current.
 */
function loadSessionHandoff(maxAgeDays = 7) {
  const inboxDir = path.join(VAULT_DIR, '00-Inbox');

  try {
    const handoffs = fs.readdirSync(inboxDir)
      .filter(f => /^session-handoff-\d{4}-\d{2}-\d{2}\.md$/.test(f))
      .sort()
      .reverse();

    if (handoffs.length === 0) return null;

    const latest = handoffs[0];
    const dateStr = latest.match(/(\d{4}-\d{2}-\d{2})/)[1];
    const ageDays = (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24);

    if (ageDays > maxAgeDays) return null;

    return {
      file: path.join(inboxDir, latest),
      date: dateStr,
      content: fs.readFileSync(path.join(inboxDir, latest), 'utf8')
    };
  } catch (err) {
    return null;
  }
}

/**
 * Query a Chroma collection via HTTP API v2
 */
async function queryChromaCollection(collectionName, query, nResults, where = {}) {
  const payload = {
    query_texts: [query],
    n_results: nResults,
    include: ['documents', 'metadatas', 'distances']
  };

  if (Object.keys(where).length > 0) {
    payload.where = where;
  }

  const url = `${CHROMA_HOST}/api/v2/collections/${encodeURIComponent(collectionName)}/query`;

  console.error(`[Chroma] POST ${url}`);

  return new Promise((resolve, reject) => {
    const https = require('https');
    const http = require('http');

    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;

    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = client.request(options, (res) => {
      let data = '';

      res.on('data', chunk => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode >= 400) {
          const error = new Error(`HTTP ${res.statusCode}: ${data}`);
          error.statusCode = res.statusCode;
          reject(error);
        } else {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error(`Failed to parse Chroma response: ${e.message}`));
          }
        }
      });
    });

    req.on('error', reject);
    req.write(JSON.stringify(payload));
    req.end();
  });
}

/**
 * Format Chroma query results into readable context items
 */
function formatResults(chromaResult, type) {
  if (!chromaResult.documents || !chromaResult.documents[0]) {
    return [];
  }

  const documents = chromaResult.documents[0];
  const metadatas = chromaResult.metadatas[0] || [];
  const distances = chromaResult.distances[0] || [];

  return documents.map((doc, i) => ({
    type: type,
    content: doc,
    metadata: metadatas[i] || {},
    relevance: distances[i] !== undefined ? 1 - distances[i] : null,
    position: i + 1
  }));
}

/**
 * Generate human-readable summary of context
 */
function generateSummary(context) {
  const items = [];

  if (context.standards.length > 0) {
    items.push(`Standards: ${context.standards.length} constraint(s)`);
  }
  if (context.facts.length > 0) {
    items.push(`Facts: ${context.facts.length} authoritative document(s)`);
  }
  if (context.sessions.length > 0) {
    items.push(`Sessions: ${context.sessions.length} exploratory note(s)`);
  }
  if (context.agent_memory && context.agent_memory.content) {
    items.push(`Agent memory: ${context.agent_memory.agent}`);
  }
  if (context.relationships.length > 0) {
    items.push(`Relationships: ${context.relationships.length} cause/effect chain(s)`);
  }
  if (context.session_handoff) {
    items.push(`Session handoff: ${context.session_handoff.date}`);
  }

  if (items.length === 0) {
    return 'No context retrieved';
  }

  return `Context assembled: ${items.join(', ')}`;
}

/**
 * Export for use as library (not just CLI)
 */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { assembleContext, queryChromaCollection };
}

// Run if invoked as CLI
if (require.main === module) {
  main();
}
