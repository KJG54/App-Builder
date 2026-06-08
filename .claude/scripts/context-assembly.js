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

const path = require('path');

// Configuration
const CHROMA_HOST = process.env.CHROMA_HOST || 'http://localhost:8000';
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
 * @param {object} options - { includeSession: bool, maxResults: int }
 * @returns {object} - Context with facts, standards, sessions
 */
async function assembleContext(query, projectName, options = {}) {
  const {
    includeSession = false,
    maxResults = 5
  } = options;

  const context = {
    timestamp: new Date().toISOString(),
    query: query,
    projectName: projectName,
    standards: [],
    facts: [],
    sessions: [],
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
      { is_authoritative: true }
    );

    context.standards = formatResults(standardsResults, 'standards');
    console.error(`[Context Assembly] Found ${context.standards.length} standards`);

    // 2. Query project facts (decisions, requirements, architecture)
    console.error(`[Context Assembly] Querying ${projectName}-facts...`);
    const factsResults = await queryChromaCollection(
      `${projectName}-facts`,
      query,
      maxResults,
      { is_authoritative: true }
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
        { is_authoritative: false }
      );

      context.sessions = formatResults(sessionResults, 'sessions');
      console.error(`[Context Assembly] Found ${context.sessions.length} sessions`);
    }

    // Generate summary
    context.summary = generateSummary(context);
    console.error(`[Context Assembly] Complete. Total items: ${context.standards.length + context.facts.length + context.sessions.length}`);

    return context;
  } catch (error) {
    console.error(`[Context Assembly] Error: ${error.message}`);
    throw error;
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
