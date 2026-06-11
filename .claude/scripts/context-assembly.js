#!/usr/bin/env node

/**
 * Context Assembly API
 *
 * Implements Phase 2 of the Knowledge-First Pipeline (ADR-ARCH-001):
 * Given a task query, retrieve and assemble authoritative context from Chroma.
 *
 * Uses the chromadb JS SDK (ADR-INFRA-003) — replaces broken HTTP v2 calls.
 *
 * Output: Structured context with facts, standards, optional sessions,
 * agent memory, relationships, and session handoff for agent consumption.
 */

const fs   = require('fs');
const path = require('path');
const { ChromaClient }           = require('chromadb');
const { DefaultEmbeddingFunction } = require('@chroma-core/default-embed');
const { loadOrBuildIndex, searchDocs } = require('./lexical-indexer');
const { rrfMerge } = require('./hybrid-search');

// ── Configuration ─────────────────────────────────────────────────────────────

const CHROMA_HOST   = process.env.CHROMA_SERVER_HOST || 'localhost';
const CHROMA_PORT   = parseInt(process.env.CHROMA_SERVER_PORT || '8000');
const VAULT_DIR     = process.env.VAULT_PATH || path.resolve(process.cwd(), 'Vault');
const PROJECT_NAME  = process.argv[2] || 'ai-software-factory';
const QUERY         = process.argv[3] || 'What should I know?';
const INCLUDE_SESSIONS = process.argv.includes('--include-sessions');
const MAX_RESULTS   = parseInt(process.argv.find(a => /^\d+$/.test(a) && process.argv.indexOf(a) > 3) || '5');

// ── Shared SDK client (lazy init) ──────────────────────────────────────────────

let _client = null;
let _ef     = null;

function getClient() {
  if (!_client) _client = new ChromaClient({ host: CHROMA_HOST, port: CHROMA_PORT });
  return _client;
}

function getEf() {
  if (!_ef) _ef = new DefaultEmbeddingFunction();
  return _ef;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  try {
    const context = await assembleContext(QUERY, PROJECT_NAME, {
      includeSession: INCLUDE_SESSIONS,
      maxResults:     MAX_RESULTS,
    });
    console.log(JSON.stringify(context, null, 2));
  } catch (err) {
    console.error('Context assembly failed:', err.message);
    process.exit(1);
  }
}

// ── Public API ─────────────────────────────────────────────────────────────────

/**
 * Assemble task-specific context from Chroma plus local Vault sources.
 *
 * @param {string} query        - Task description or question
 * @param {string} projectName  - Project name (e.g., ai-software-factory)
 * @param {object} options      - {
 *   includeSession: bool,
 *   maxResults: int,
 *   agentRole: string|null,   // load agent memory for this role
 *   filters: object           // metadata filters e.g. { domain: 'api' }
 * }
 * @returns {object} Context object
 */
async function assembleContext(query, projectName, options = {}) {
  const {
    includeSession = false,
    maxResults     = 5,
    agentRole      = null,
    filters        = {},
  } = options;

  const context = {
    timestamp:       new Date().toISOString(),
    query,
    projectName,
    agentRole,
    standards:       [],
    facts:           [],
    sessions:        [],
    agent_memory:    {},
    relationships:   [],
    session_handoff: null,
    summary:         null,
  };

  log(`Query: "${query}"`);
  log(`Project: ${projectName}, maxResults: ${maxResults}`);

  // Fetch 2× then re-rank down to maxResults for better relevance
  const fetchN = maxResults * 2;

  // Lexical index — load from disk cache or rebuild; degrades gracefully
  let _lexDocs = null;
  let _lexIndex = null;
  try {
    const lex = await loadOrBuildIndex(VAULT_DIR, { log });
    _lexDocs  = lex.docs;
    _lexIndex = lex.index;
  } catch (lexErr) {
    log(`Lexical index unavailable (degrading): ${lexErr.message}`);
  }

  function hybridQuery(chromaResults, collectionKey) {
    if (!_lexIndex || !_lexDocs) return chromaResults;
    const lexResults = searchDocs(_lexIndex, _lexDocs, query, collectionKey, fetchN);
    return rrfMerge(chromaResults, lexResults, fetchN);
  }

  try {
    const client = getClient();
    const ef     = getEf();

    // 1. Global standards (mandatory constraints — no authority filter needed)
    log(`Querying global-standards...`);
    context.standards = rerankResults(
      hybridQuery(
        await queryCollection(client, ef, 'global-standards', query, fetchN, filters),
        'standards'
      ),
      agentRole
    ).slice(0, maxResults);
    log(`Found ${context.standards.length} standards`);

    // 2. Project facts (authoritative decisions, requirements, architecture)
    log(`Querying ${projectName}-facts...`);
    context.facts = rerankResults(
      hybridQuery(
        await queryCollection(client, ef, `${projectName}-facts`, query, fetchN, { is_authoritative: true, ...filters }),
        'facts'
      ),
      agentRole
    ).slice(0, maxResults);
    log(`Found ${context.facts.length} facts`);

    // 3. Sessions (optional background)
    if (includeSession) {
      log(`Querying ${projectName}-sessions...`);
      context.sessions = rerankResults(
        hybridQuery(
          await queryCollection(client, ef, `${projectName}-sessions`, query, Math.ceil(fetchN / 2), filters),
          'sessions'
        ),
        agentRole
      ).slice(0, Math.ceil(maxResults / 2));
      log(`Found ${context.sessions.length} sessions`);
    }
  } catch (err) {
    // Degrade gracefully — local sources below still load
    log(`Chroma error (degrading gracefully): ${err.message}`);
    context.chroma_error = err.message;
  }

  // 4. Agent memory from Vault/14-Agent-Memory/<role>/memory.yaml
  if (agentRole) {
    context.agent_memory = loadAgentMemory(agentRole);
    log(`Agent memory for '${agentRole}': ${context.agent_memory.content ? 'loaded' : 'none'}`);
  }

  // 5. Relationships from Vault/13-Relationships/
  context.relationships = loadRelationships();
  log(`Found ${context.relationships.length} relationships`);

  // 6. Recent session handoff from Vault/00-Inbox/
  context.session_handoff = loadSessionHandoff();
  if (context.session_handoff) log(`Session handoff: ${context.session_handoff.date}`);

  context.summary = generateSummary(context);
  log(`Complete. Total items: ${context.standards.length + context.facts.length + context.sessions.length + context.relationships.length}`);

  return context;
}

// ── Re-ranking ─────────────────────────────────────────────────────────────────
//
// Boosts authoritative chunks (+0.1) and chunks matching the querying agent's
// role via the agent_relevance metadata field (+0.15). Caller slices the result
// to the desired maxResults after re-ranking.

function rerankResults(results, agentRole) {
  return results
    .map(r => {
      let score = r.relevance || 0;
      if (r.metadata?.is_authoritative) score += 0.1;
      if (agentRole && r.metadata?.agent_relevance) {
        const roles = r.metadata.agent_relevance.split(',').map(s => s.trim());
        if (roles.includes(agentRole)) score += 0.15;
      }
      return { ...r, relevance: score };
    })
    .sort((a, b) => b.relevance - a.relevance);
}

// ── Chroma query ───────────────────────────────────────────────────────────────

async function queryCollection(client, ef, collectionName, query, nResults, filters = {}) {
  try {
    const col = await client.getCollection({ name: collectionName, embeddingFunction: ef });

    const queryOpts = { queryTexts: [query], nResults, include: ['documents', 'metadatas', 'distances'] };
    const filterKeys = Object.keys(filters);
    if (filterKeys.length === 1) {
      queryOpts.where = filters;
    } else if (filterKeys.length > 1) {
      queryOpts.where = { $and: filterKeys.map(k => ({ [k]: filters[k] })) };
    }

    const result = await col.query(queryOpts);
    return formatResults(result, collectionName);
  } catch (err) {
    // Collection may not exist yet (e.g., before first ingest)
    log(`Collection '${collectionName}' not available: ${err.message}`);
    return [];
  }
}

function formatResults(result, sourceCollection) {
  if (!result.documents || !result.documents[0]) return [];

  return result.documents[0].map((doc, i) => ({
    type:       sourceCollection,
    content:    doc,
    metadata:   result.metadatas[0]?.[i] || {},
    relevance:  result.distances[0]?.[i] !== undefined ? 1 - result.distances[0][i] : null,
    position:   i + 1,
  }));
}

// ── Local Vault sources ────────────────────────────────────────────────────────

function loadAgentMemory(agentRole) {
  const file = path.join(VAULT_DIR, '14-Agent-Memory', agentRole, 'memory.yaml');
  try {
    return { agent: agentRole, file, content: fs.readFileSync(file, 'utf8') };
  } catch {
    return { agent: agentRole, file, content: null };
  }
}

function loadRelationships() {
  const relDir = path.join(VAULT_DIR, '13-Relationships');
  try {
    return fs.readdirSync(relDir)
      .filter(f => f.endsWith('.md') && f !== 'README.md')
      .map(f => ({
        type:    'relationship',
        file:    path.join(relDir, f),
        content: fs.readFileSync(path.join(relDir, f), 'utf8'),
      }));
  } catch {
    return [];
  }
}

function loadSessionHandoff(maxAgeDays = 7) {
  const inboxDir = path.join(VAULT_DIR, '00-Inbox');
  try {
    const handoffs = fs.readdirSync(inboxDir)
      .filter(f => /^session-handoff-\d{4}-\d{2}-\d{2}\.md$/.test(f))
      .sort().reverse();

    if (!handoffs.length) return null;

    const dateStr = handoffs[0].match(/(\d{4}-\d{2}-\d{2})/)[1];
    const ageDays = (Date.now() - new Date(dateStr).getTime()) / 86400000;
    if (ageDays > maxAgeDays) return null;

    return {
      file:    path.join(inboxDir, handoffs[0]),
      date:    dateStr,
      content: fs.readFileSync(path.join(inboxDir, handoffs[0]), 'utf8'),
    };
  } catch {
    return null;
  }
}

// ── Summary ────────────────────────────────────────────────────────────────────

function generateSummary(context) {
  const parts = [];
  if (context.standards.length)                parts.push(`Standards: ${context.standards.length}`);
  if (context.facts.length)                    parts.push(`Facts: ${context.facts.length}`);
  if (context.sessions.length)                 parts.push(`Sessions: ${context.sessions.length}`);
  if (context.agent_memory?.content)           parts.push(`Agent memory: ${context.agent_memory.agent}`);
  if (context.relationships.length)            parts.push(`Relationships: ${context.relationships.length}`);
  if (context.session_handoff)                 parts.push(`Handoff: ${context.session_handoff.date}`);
  return parts.length ? `Context assembled: ${parts.join(', ')}` : 'No context retrieved';
}

function log(msg) {
  process.stderr.write(`[Context Assembly] ${msg}\n`);
}

// ── Exports / entry point ──────────────────────────────────────────────────────

module.exports = { assembleContext, queryCollection };

if (require.main === module) {
  main();
}
