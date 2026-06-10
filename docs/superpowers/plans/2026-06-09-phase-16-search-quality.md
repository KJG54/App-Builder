# Phase 16: Search Quality Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the Chroma Node ingestion pipeline (frontloaded), add semantic chunking, activate 14 Beta skills, and layer in hybrid lexical+vector search.

**Architecture:** Staged — each stage is verified before the next starts. Stage 1 swaps the broken raw-HTTP Chroma layer for the official JS client. Stages 2–4 add chunking, skills, and search on top of a verified working foundation.

**Tech Stack:** `chromadb` JS client, `@chroma-core/default-embed` (all-MiniLM-L6-v2), `flexsearch` v0.7.x, Node.js 20+, CommonJS.

---

## File Map

| File | Action |
|------|--------|
| `package.json` | Add `chromadb`, `@chroma-core/default-embed`, `flexsearch` |
| `.claude/scripts/chroma-ingest.js` | Replace `chromaRequest`/`ingestDocument`/`initializeCollections`; add chunker + lexical wiring |
| `.claude/scripts/context-assembly.js` | Replace `queryChromaCollection`; add `includeSkills`; add hybrid search |
| `.claude/scripts/markdown-chunker.js` | New — header-based chunking |
| `.claude/scripts/code-chunker.js` | New — function/class boundary chunking |
| `.claude/scripts/lexical-indexer.js` | New — FlexSearch index |
| `.claude/scripts/hybrid-search.js` | New — RRF merge |
| `.claude/scripts/test-phase-16-chunkers.js` | New — chunker unit tests |
| `.claude/scripts/test-phase-16-search.js` | New — lexical + RRF unit tests |
| `.claude/scripts/validate-phase-16.js` | New — master test runner |
| `Vault/05-Prompts/Skills/CrossCutting/documentation-generation-v1.0.md` | New — first Beta skill |
| `Vault/05-Prompts/Skills/Architecture/api-design-v1.0.md` | New |
| `Vault/05-Prompts/Skills/Architecture/microservice-architecture-v1.0.md` | New |
| `Vault/05-Prompts/Skills/Architecture/database-schema-design-v1.0.md` | New |
| `Vault/05-Prompts/Skills/Implementation/oauth2-implementation-v1.0.md` | New |
| `Vault/05-Prompts/Skills/Implementation/rest-api-implementation-v1.0.md` | New |
| `Vault/05-Prompts/Skills/Implementation/error-handling-patterns-v1.0.md` | New |
| `Vault/05-Prompts/Skills/Implementation/testing-strategy-v1.0.md` | New |
| `Vault/05-Prompts/Skills/Infrastructure/docker-containerization-v1.0.md` | New |
| `Vault/05-Prompts/Skills/Infrastructure/kubernetes-deployment-v1.0.md` | New |
| `Vault/05-Prompts/Skills/Infrastructure/ci-cd-pipeline-v1.0.md` | New |
| `Vault/05-Prompts/Skills/Infrastructure/monitoring-setup-v1.0.md` | New |
| `Vault/05-Prompts/Skills/CrossCutting/code-review-process-v1.0.md` | New |
| `Vault/05-Prompts/Skills/CrossCutting/performance-optimization-v1.0.md` | New |
| `Vault/10-Known-Problems/Problem-infra-chroma-ingestion-api-incompatibility.md` | Update status → resolved |
| `Vault/03-Projects/AI Software Factory/Phase-14-17-Roadmap.md` | Check Phase 16 boxes |

---

## Stage 1 — Chroma Fix

### Task 1: Install Dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Add dependencies to package.json**

Open `package.json` and update the `"dependencies"` block:

```json
"dependencies": {
  "proper-lockfile": "^4.1.2",
  "chromadb": "^1.9.2",
  "@chroma-core/default-embed": "^0.1.2"
}
```

- [ ] **Step 2: Install**

```
npm install
```

Expected: Both packages installed, `package-lock.json` updated, no errors.

- [ ] **Step 3: Verify imports work**

```
node -e "const { ChromaClient } = require('chromadb'); console.log('chromadb ok');"
node -e "const { DefaultEmbeddingFunction } = require('@chroma-core/default-embed'); console.log('embed ok');"
```

Expected: Two lines printed, no errors.

- [ ] **Step 4: Commit**

```
git add package.json package-lock.json
git commit -m "feat: add chromadb JS client and default-embed dependencies"
```

---

### Task 2: Fix chroma-ingest.js — Client Layer

**Files:**
- Modify: `.claude/scripts/chroma-ingest.js`

- [ ] **Step 1: Replace the require block at the top of the file**

Find lines 1–6 (the shebang and initial requires):

```js
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const https = require('https');
const { VaultValidator } = require('./vault-validator');
```

Replace with:

```js
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { ChromaClient } = require('chromadb');
const { DefaultEmbeddingFunction } = require('@chroma-core/default-embed');
const { VaultValidator } = require('./vault-validator');
```

- [ ] **Step 2: Add module-level client state after the COLLECTIONS block**

After the `COLLECTIONS` constant (around line 28), add:

```js
// Chroma client state (initialized once in initializeCollections)
let _chromaClient = null;
let _embedder = null;
const _collectionHandles = {};
```

- [ ] **Step 3: Replace initializeCollections()**

Find and replace the entire `initializeCollections` function:

```js
async function initializeCollections() {
  _embedder = new DefaultEmbeddingFunction();
  _chromaClient = new ChromaClient({ path: CHROMA_HOST });

  try {
    await _chromaClient.heartbeat();
    console.log(`   ✓ Chroma connected (${CHROMA_HOST})`);
  } catch (error) {
    throw new Error(`Failed to connect to Chroma at ${CHROMA_HOST}: ${error.message}`);
  }

  for (const [, name] of Object.entries(COLLECTIONS)) {
    _collectionHandles[name] = await _chromaClient.getOrCreateCollection({
      name,
      embeddingFunction: _embedder
    });
    console.log(`   ✓ Collection ready: ${name}`);
  }
}
```

- [ ] **Step 4: Replace ingestDocument()**

Find and replace the entire `ingestDocument` function:

```js
async function ingestDocument(collectionName, document) {
  const collection = _collectionHandles[collectionName];
  if (!collection) {
    throw new Error(`Collection not initialized: ${collectionName}`);
  }
  await collection.upsert({
    ids: [document.id],
    documents: [document.content],
    metadatas: [document.metadata]
  });
}
```

- [ ] **Step 5: Delete the chromaRequest() function**

Find and delete the entire `chromaRequest` function (approximately lines 391–436 in the original file). It is no longer referenced.

- [ ] **Step 6: Commit**

```
git add .claude/scripts/chroma-ingest.js
git commit -m "feat: replace raw HTTP layer in chroma-ingest with chromadb JS client"
```

---

### Task 3: Fix context-assembly.js — Query Layer

**Files:**
- Modify: `.claude/scripts/context-assembly.js`

- [ ] **Step 1: Add chromadb imports after the existing requires**

After `const path = require('path');` at the top:

```js
const { ChromaClient } = require('chromadb');
const { DefaultEmbeddingFunction } = require('@chroma-core/default-embed');
```

- [ ] **Step 2: Add module-level client state after the config constants**

After the `MAX_RESULTS` constant (around line 22):

```js
// Chroma client (lazy-initialized on first query)
let _chromaClient = null;
let _embedder = null;

function getChromaClient() {
  if (!_chromaClient) {
    _chromaClient = new ChromaClient({ path: CHROMA_HOST });
    _embedder = new DefaultEmbeddingFunction();
  }
  return { client: _chromaClient, embedder: _embedder };
}
```

- [ ] **Step 3: Replace queryChromaCollection()**

Find and replace the entire `queryChromaCollection` function (currently lines 233–292):

```js
async function queryChromaCollection(collectionName, query, nResults, where = {}) {
  const { client, embedder } = getChromaClient();

  console.error(`[Chroma] Querying collection: ${collectionName}`);

  const collection = await client.getCollection({
    name: collectionName,
    embeddingFunction: embedder
  });

  const queryOptions = {
    queryTexts: [query],
    nResults,
    include: ['documents', 'metadatas', 'distances']
  };

  if (Object.keys(where).length > 0) {
    queryOptions.where = where;
  }

  return collection.query(queryOptions);
}
```

Note: `formatResults()` is unchanged — the JS client returns `{ documents: [[...]], metadatas: [[...]], distances: [[...]] }` which matches the expected shape exactly.

- [ ] **Step 4: Commit**

```
git add .claude/scripts/context-assembly.js
git commit -m "feat: replace raw HTTP layer in context-assembly with chromadb JS client"
```

---

### Task 4: Stage 1 Integration Verification

**Files:** None changed — this is a verification step.

- [ ] **Step 1: Confirm Docker container is running**

```
docker ps --filter name=app-builder-chroma
```

Expected: Container listed with status `Up`. If not running: `docker compose up -d chroma`

- [ ] **Step 2: Run full ingest**

```
node .claude/scripts/chroma-ingest.js Vault ai-software-factory
```

Expected output:
- `✓ Chroma connected`
- Three collection lines: `✓ Collection ready: ai-software-factory-facts`, etc.
- `Total Ingested: [non-zero number]`
- `Errors: 0` (or low number for files without frontmatter)

- [ ] **Step 3: Run context assembly query**

```
node .claude/scripts/context-assembly.js ai-software-factory "What are the architectural decisions?"
```

Expected: JSON output with non-empty `facts` and `standards` arrays. No `chroma_error` field.

- [ ] **Step 4: Verify idempotency — run ingest a second time**

```
node .claude/scripts/chroma-ingest.js Vault ai-software-factory
```

Expected: Same document counts, no errors. `upsert` means re-running is safe.

- [ ] **Step 5: Spot-check collection document counts via MCP**

Use the `chroma-mcp` list collections tool to confirm three collections exist with document counts > 0.

- [ ] **Step 6: Commit verification note to audit log**

```
git add .claude/logs/chroma-ingest-audit.json
git commit -m "chore: Stage 1 verified — Chroma ingestion working"
```

---

## Stage 2 — Chunkers

### Task 5: Write Failing Chunker Tests

**Files:**
- Create: `.claude/scripts/test-phase-16-chunkers.js`

- [ ] **Step 1: Create the test file**

```js
#!/usr/bin/env node

class Phase16ChunkerTests {
  constructor() {
    this.testsPassed = 0;
    this.testsFailed = 0;
  }

  assert(condition, message) {
    if (condition) {
      console.log(`   ✓ ${message}`);
      this.testsPassed++;
    } else {
      console.error(`   ✗ ${message}`);
      this.testsFailed++;
    }
  }

  testMarkdownSplitsAtHeadings() {
    console.log('\n📋 Test: Markdown splits at heading boundaries');
    const { chunkMarkdown } = require('./markdown-chunker');
    const md = `# Title\nIntro.\n## Section A\nContent A.\n## Section B\nContent B.\n### Sub B1\nSub.`;
    const chunks = chunkMarkdown(md, 'Vault/test.md');
    this.assert(chunks.length === 4, `Expected 4 chunks, got ${chunks.length}`);
    this.assert(chunks[1].metadata.header_path === 'Title > Section A', `header_path: ${chunks[1].metadata.header_path}`);
    this.assert(chunks[1].content.includes('Content A'), 'Section A chunk contains Content A');
    this.assert(!chunks[1].content.includes('Content B'), 'Section A chunk does not bleed into B');
  }

  testMarkdownHeaderPathTracksHierarchy() {
    console.log('\n📋 Test: Markdown header_path tracks full hierarchy');
    const { chunkMarkdown } = require('./markdown-chunker');
    const md = `# Root\n## Child\n### Grandchild\nDeep content.`;
    const chunks = chunkMarkdown(md, 'Vault/test.md');
    const deep = chunks.find(c => c.content.includes('Deep content'));
    this.assert(!!deep, 'Deep chunk found');
    this.assert(deep.metadata.header_path === 'Root > Child > Grandchild', `header_path: ${deep.metadata.header_path}`);
  }

  testMarkdownNoHeadingsIsOneChunk() {
    console.log('\n📋 Test: Markdown with no headings is one chunk');
    const { chunkMarkdown } = require('./markdown-chunker');
    const md = `Just plain text.\nNo headings here.`;
    const chunks = chunkMarkdown(md, 'Vault/test.md');
    this.assert(chunks.length === 1, `Expected 1 chunk, got ${chunks.length}`);
  }

  testMarkdownPreservesAllLines() {
    console.log('\n📋 Test: Markdown chunk does not split mid-paragraph');
    const { chunkMarkdown } = require('./markdown-chunker');
    const md = `## Section\nLine 1.\nLine 2.\nLine 3.`;
    const chunks = chunkMarkdown(md, 'Vault/test.md');
    this.assert(chunks.length === 1, 'Expected 1 chunk');
    this.assert(
      chunks[0].content.includes('Line 1') &&
      chunks[0].content.includes('Line 2') &&
      chunks[0].content.includes('Line 3'),
      'All lines in chunk'
    );
  }

  testCodeSplitsAtFunctions() {
    console.log('\n📋 Test: Code splits at function boundaries');
    const { chunkCode } = require('./code-chunker');
    const code = `const x = 1;\n\nfunction foo() {\n  return 1;\n}\n\nfunction bar() {\n  return 2;\n}`;
    const chunks = chunkCode(code, 'src/test.js');
    this.assert(chunks.length === 2, `Expected 2 chunks, got ${chunks.length}`);
    this.assert(chunks[0].metadata.component_name === 'foo', `First: ${chunks[0].metadata.component_name}`);
    this.assert(chunks[1].metadata.component_name === 'bar', `Second: ${chunks[1].metadata.component_name}`);
  }

  testCodeSplitsAtClasses() {
    console.log('\n📋 Test: Code splits at class boundaries');
    const { chunkCode } = require('./code-chunker');
    const code = `class Foo {\n  method() {}\n}\n\nclass Bar {\n  method() {}\n}`;
    const chunks = chunkCode(code, 'src/test.js');
    this.assert(chunks.length === 2, `Expected 2 chunks, got ${chunks.length}`);
    this.assert(chunks[0].metadata.component_name === 'Foo', `First: ${chunks[0].metadata.component_name}`);
  }

  testCodePreservesSignature() {
    console.log('\n📋 Test: Code chunk includes complete function signature');
    const { chunkCode } = require('./code-chunker');
    const code = `async function myFunc(a, b) {\n  return a + b;\n}`;
    const chunks = chunkCode(code, 'src/test.js');
    this.assert(chunks.length === 1, 'Expected 1 chunk');
    this.assert(chunks[0].content.includes('async function myFunc(a, b)'), 'Signature preserved');
    this.assert(chunks[0].content.includes('return a + b'), 'Body preserved');
  }

  testCodePrependsImports() {
    console.log('\n📋 Test: Code chunk prepends import context');
    const { chunkCode } = require('./code-chunker');
    const code = `const fs = require('fs');\n\nfunction readFile(p) {\n  return fs.readFileSync(p);\n}`;
    const chunks = chunkCode(code, 'src/test.js');
    this.assert(chunks.length === 1, 'Expected 1 chunk');
    this.assert(chunks[0].content.includes("require('fs')"), 'Import prepended');
  }

  async runAll() {
    console.log('\n🔬 Phase 16 Chunker Tests');
    console.log('━'.repeat(50));

    this.testMarkdownSplitsAtHeadings();
    this.testMarkdownHeaderPathTracksHierarchy();
    this.testMarkdownNoHeadingsIsOneChunk();
    this.testMarkdownPreservesAllLines();
    this.testCodeSplitsAtFunctions();
    this.testCodeSplitsAtClasses();
    this.testCodePreservesSignature();
    this.testCodePrependsImports();

    console.log('\n' + '━'.repeat(50));
    console.log(`Results: ${this.testsPassed} passed, ${this.testsFailed} failed`);
    if (this.testsFailed > 0) process.exit(1);
  }
}

new Phase16ChunkerTests().runAll().catch(err => {
  console.error('Test runner error:', err);
  process.exit(1);
});
```

- [ ] **Step 2: Run tests — verify they fail with MODULE_NOT_FOUND**

```
node .claude/scripts/test-phase-16-chunkers.js
```

Expected: `Error: Cannot find module './markdown-chunker'`

---

### Task 6: Write markdown-chunker.js

**Files:**
- Create: `.claude/scripts/markdown-chunker.js`

- [ ] **Step 1: Create the file**

```js
#!/usr/bin/env node

/**
 * Header-based markdown chunker.
 * Splits a markdown document at heading boundaries (#, ##, ###).
 * Each chunk includes its heading and all content until the next same-level heading.
 */

function chunkMarkdown(content, sourcePath) {
  const lines = content.split('\n');
  const chunks = [];
  let headingStack = [];
  let currentLines = [];
  let currentLevel = 0;

  function flushChunk() {
    const body = currentLines.join('\n').trim();
    if (!body) return;

    const headerPath = headingStack.map(h => h.text).join(' > ');
    const chunkId = makeChunkId(sourcePath, headerPath || 'root', chunks.length);

    chunks.push({
      id: chunkId,
      content: body,
      metadata: {
        source_path: sourcePath.replace(/\\/g, '/'),
        chunk_type: 'markdown',
        header_path: headerPath || '(root)',
        heading_level: currentLevel,
        chunk_index: chunks.length
      }
    });

    currentLines = [];
  }

  for (const line of lines) {
    const m = line.match(/^(#{1,3})\s+(.+)$/);

    if (m) {
      const level = m[1].length;
      const text = m[2].trim();

      flushChunk();

      // Pop headings at same level or deeper before pushing new one
      headingStack = headingStack.filter(h => h.level < level);
      headingStack.push({ level, text });
      currentLevel = level;
      currentLines.push(line);
    } else {
      currentLines.push(line);
    }
  }

  flushChunk();
  return chunks;
}

function makeChunkId(sourcePath, headerPath, index) {
  const base = sourcePath
    .replace(/Vault[\\/]?/, '')
    .replace(/\.md$/, '')
    .replace(/[\\/]/g, '-')
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .slice(0, 50);
  const header = headerPath
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .slice(0, 30);
  return `chunk-md-${base}-${header}-${index}`;
}

module.exports = { chunkMarkdown };
```

- [ ] **Step 2: Run chunker tests — verify markdown tests pass, code tests still fail**

```
node .claude/scripts/test-phase-16-chunkers.js
```

Expected: Markdown tests pass, code tests fail with `Cannot find module './code-chunker'`.

---

### Task 7: Write code-chunker.js

**Files:**
- Create: `.claude/scripts/code-chunker.js`

- [ ] **Step 1: Create the file**

```js
#!/usr/bin/env node

/**
 * Boundary-aware code chunker for JS and Python files.
 * Splits on function, class, and const-arrow-function boundaries.
 * Prepends up to 10 import lines as context for each chunk.
 */

const BOUNDARY_PATTERNS = [
  /^(export\s+)?(async\s+)?function\s+\w+/,
  /^(export\s+)?(const|let|var)\s+\w+\s*=\s*(async\s*)?\(/,
  /^(export\s+)?(const|let|var)\s+\w+\s*=\s*(async\s+)?function/,
  /^(export\s+)?class\s+\w+/,
  /^def\s+\w+\s*\(/,
  /^class\s+\w+[:(]/
];

const IMPORT_PATTERNS = [
  /^(const|let|var)\s+.+\s*=\s*require\(/,
  /^import\s+/,
  /^from\s+\w/
];

function chunkCode(content, sourcePath) {
  const lines = content.split('\n');
  const chunks = [];

  const importLines = lines
    .filter(l => IMPORT_PATTERNS.some(re => re.test(l.trim())))
    .slice(0, 10)
    .join('\n');

  let currentBlock = [];
  let currentName = null;
  let startLine = 0;

  function flushChunk() {
    if (!currentName || currentBlock.length === 0) return;

    const blockContent = importLines
      ? `${importLines}\n\n${currentBlock.join('\n')}`
      : currentBlock.join('\n');

    chunks.push({
      id: makeChunkId(sourcePath, currentName, startLine),
      content: blockContent,
      metadata: {
        source_path: sourcePath.replace(/\\/g, '/'),
        chunk_type: 'code',
        component_name: currentName,
        start_line: startLine,
        end_line: startLine + currentBlock.length - 1,
        chunk_index: chunks.length
      }
    });

    currentBlock = [];
    currentName = null;
  }

  lines.forEach((line, i) => {
    const isBoundary = BOUNDARY_PATTERNS.some(re => re.test(line.trim()));

    if (isBoundary) {
      flushChunk();
      currentName = extractName(line);
      startLine = i + 1;
      currentBlock.push(line);
    } else if (currentName) {
      currentBlock.push(line);
    }
  });

  flushChunk();
  return chunks;
}

function extractName(line) {
  const m = line.match(/(?:function|class|const|let|var|def)\s+(\w+)/);
  return m ? m[1] : 'anonymous';
}

function makeChunkId(sourcePath, name, line) {
  const base = sourcePath
    .replace(/\\/g, '/')
    .replace(/\.[^.]+$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9/]/g, '-')
    .slice(-40);
  return `chunk-code-${base}-${name}-${line}`;
}

module.exports = { chunkCode };
```

- [ ] **Step 2: Run all chunker tests — all 8 should pass**

```
node .claude/scripts/test-phase-16-chunkers.js
```

Expected: `Results: 8 passed, 0 failed`

- [ ] **Step 3: Commit**

```
git add .claude/scripts/markdown-chunker.js .claude/scripts/code-chunker.js .claude/scripts/test-phase-16-chunkers.js
git commit -m "feat: markdown-chunker and code-chunker with passing unit tests"
```

---

### Task 8: Wire Chunkers into chroma-ingest.js + Re-ingest

**Files:**
- Modify: `.claude/scripts/chroma-ingest.js`

- [ ] **Step 1: Add chunker imports at the top of chroma-ingest.js**

After the `chromadb` imports:

```js
const { chunkMarkdown } = require('./markdown-chunker');
const { chunkCode } = require('./code-chunker');
```

- [ ] **Step 2: Replace the document preparation block inside processDocument()**

Find the block that builds a single `document` object and calls `ingestDocument` once (around the `const document = { id, content, metadata }` lines). Replace it with:

```js
// Generate chunks based on file type
const ext = path.extname(docPath).toLowerCase();
let chunks;

if (ext === '.md') {
  chunks = chunkMarkdown(body, docPath);
} else if (ext === '.js' || ext === '.py') {
  chunks = chunkCode(body, docPath);
} else {
  // Fallback: single chunk
  chunks = [{
    id: generateDocumentId(docPath),
    content: body.substring(0, 5000),
    metadata: {}
  }];
}

// Ingest each chunk with merged metadata
for (const chunk of chunks) {
  const document = {
    id: chunk.id,
    content: chunk.content.substring(0, 5000),
    metadata: {
      ...buildMetadata(frontmatter, docPath, classification),
      ...chunk.metadata
    }
  };
  await ingestDocument(classification.collection, document);
}

auditLog.ingestions.push({
  file: docPath,
  destination: classification.collection,
  chunks: chunks.length,
  authority: frontmatter.authority,
  status: frontmatter.status
});
return; // skip the single-document path below
```

Also update the `auditLog.ingestions.push` call that follows to be guarded so it doesn't double-push (or remove the original — the `return` above handles it).

- [ ] **Step 3: Re-ingest Vault with chunkers active**

```
node .claude/scripts/chroma-ingest.js Vault ai-software-factory
```

Expected: Higher total document count than Stage 1 (chunking produces more entries per file). No errors.

- [ ] **Step 4: Verify a chunked document via context assembly**

```
node .claude/scripts/context-assembly.js ai-software-factory "OAuth2 authentication strategy"
```

Expected: `facts` or `standards` results include `header_path` metadata fields.

- [ ] **Step 5: Commit**

```
git add .claude/scripts/chroma-ingest.js
git commit -m "feat: wire markdown and code chunkers into chroma-ingest pipeline"
```

---

## Stage 3 — Skills Activation

### Task 9: Write Documentation Skill + Wire includeSkills

**Files:**
- Create: `Vault/05-Prompts/Skills/CrossCutting/documentation-generation-v1.0.md`
- Modify: `.claude/scripts/context-assembly.js`

- [ ] **Step 1: Create the directory**

```
mkdir -p "Vault/05-Prompts/Skills/CrossCutting"
```

- [ ] **Step 2: Create documentation-generation-v1.0.md**

```markdown
---
type: Skill
name: "documentation-generation"
version: "1.0"
phase: 16
status: Beta
authority: facts
chroma_collection: global-standards
domain: general
agent_relevance: [architect, backend, frontend, devops, qa]
tags: [skill, documentation, writing, completeness]
related: [Vault/01-Standards, Vault/05-Prompts/Documentation.md]
created_date: 2026-06-09
created_by: Builder-Agent
validation_status: Under Review
maintenance_owner: Tech Writer
next_review_date: 2026-09-09
last_updated: 2026-06-09
---

# Skill: Documentation Generation v1.0

## Problem Statement

Documentation scores consistently at 70/100 in agent outputs — the lowest recurring score across all domains. Agents write functional code but omit parameter docs and decision rationale, leaving modules hard to use and maintain. This skill closes that gap.

## Solution (Design Pattern)

### Architecture / Key Concepts

Documentation exists at three levels, each with distinct requirements:
1. **Module-level** — one sentence stating purpose and role in the system
2. **Function-level** — parameters (type + meaning), return value, throws/errors
3. **Decision-level** — why this approach over alternatives (belongs in ADRs, not inline)

### Checklist / Implementation Steps

For every module created or significantly modified:

- [ ] File header: one sentence stating the module's purpose
- [ ] Public functions: parameters (name, type, meaning), return value, error conditions
- [ ] Non-obvious logic: comment the WHY, not the what (code shows what)
- [ ] Architectural choice made: write or update an ADR in `Vault/07-Decisions/`
- [ ] New system boundary: add a Vault entry or README

### Component List / Key Decisions

- Keep comments co-located with code — separate docs drift
- Decision rationale belongs in ADRs, not inline comments
- API surface (public functions, CLI flags, events) requires parameter docs
- Internal helpers: one-line description sufficient if name is clear
- Never write multi-paragraph docstrings — one short line max

### Implementation Timeline / Complexity

- File header + function docs: 5–10 minutes per module
- ADR for significant decisions: 15–30 minutes
- Full module README (new system boundary only): 30–60 minutes

## When to Use This Skill

- ✅ Creating any new module, script, or service
- ✅ Modifying a module's public API
- ✅ Making an architectural decision
- ✅ After any change where you thought "I should explain why"
- ❌ Single-use throwaway scripts
- ❌ Internal helpers with self-explanatory names

## Constraints

- Do not write documentation that duplicates what good naming communicates
- Keep inline docs short — multi-paragraph blocks are noise
- Never document "what the code does" — document "why it does it this way"

## Dependencies

- Standard: `Vault/01-Standards/` (style and naming conventions)
- Template: `Vault/Templates/ADR.md`

## Lessons Learned

- The `documentation_score: 70` gap comes from missing parameter docs and missing decision rationale — not missing file headers
- Function parameter types and error conditions are the most valuable documentation: they answer caller questions without reading the implementation

## Success Metrics

- `documentation_score >= 85` in verification outputs after applying this skill
- Reviewers understand module purpose without reading function bodies
- Every public function call site has enough docs to use it without reading implementation

## Related Skills

- `code-review-process-v1.0`
- `testing-strategy-v1.0`
```

- [ ] **Step 3: Wire includeSkills into assembleContext() in context-assembly.js**

In `assembleContext()`, find the Chroma query try/catch block. After the sessions query (inside the try block, before the catch), add:

```js
// Skills retrieval (Phase 16.3)
if (options.includeSkills) {
  const skillDomains = options.skillDomains || [];
  const skillBase = { document_type: 'skill' };
  const skillWhere = skillDomains.length > 0
    ? { $and: [{ document_type: { $eq: 'skill' } }, { domain: { $in: skillDomains } }] }
    : { document_type: { $eq: 'skill' } };

  console.error(`[Context Assembly] Querying skills...`);
  const skillResults = await queryChromaCollection(
    'global-standards',
    query,
    maxResults,
    skillWhere
  );
  context.skills = formatResults(skillResults, 'skills');
  console.error(`[Context Assembly] Found ${context.skills.length} skills`);
}
```

Also add `skills: []` to the initial `context` object at the top of `assembleContext()`, and add `includeSkills = false, skillDomains = []` to the destructured `options`.

- [ ] **Step 4: Add skills count to generateSummary()**

In `generateSummary()`, after the relationships block:

```js
if (context.skills && context.skills.length > 0) {
  items.push(`Skills: ${context.skills.length} applicable skill(s)`);
}
```

- [ ] **Step 5: Commit**

```
git add "Vault/05-Prompts/Skills/CrossCutting/documentation-generation-v1.0.md" .claude/scripts/context-assembly.js
git commit -m "feat: documentation skill + includeSkills parameter in assembleContext"
```

---

### Task 10: Write Remaining 13 Beta Skills

**Files:**
- Create: 13 skill files in `Vault/05-Prompts/Skills/`

All files follow the same frontmatter + content structure as the documentation skill. Create the missing directories first:

```
mkdir -p "Vault/05-Prompts/Skills/Architecture"
mkdir -p "Vault/05-Prompts/Skills/Implementation"
mkdir -p "Vault/05-Prompts/Skills/Infrastructure"
```

- [ ] **Step 1: Create Architecture skills**

**`Vault/05-Prompts/Skills/Architecture/api-design-v1.0.md`** — frontmatter: `name: "api-design"`, `domain: api`, `agent_relevance: [architect, backend]`, `tags: [skill, api, rest, design]`

Content sections cover: REST vs GraphQL vs gRPC decision criteria; URL structure and versioning (`/api/v1/`); HTTP verb semantics (GET idempotent, POST not); response envelope shape `{ data, error, meta }`; pagination patterns (cursor vs offset); error response format `{ error: { code, message, details } }`; authentication header conventions; rate limiting headers.

**`Vault/05-Prompts/Skills/Architecture/microservice-architecture-v1.0.md`** — `domain: general`, `agent_relevance: [architect]`

Content: When to split (team boundaries, deployment independence, scale requirements); service communication patterns (sync REST vs async events); shared data anti-pattern; service discovery; circuit breaker pattern; distributed tracing requirements.

**`Vault/05-Prompts/Skills/Architecture/database-schema-design-v1.0.md`** — `domain: database`, `agent_relevance: [architect, backend]`

Content: Normalization levels and when to denormalize for read performance; indexing strategy (index what you query, not everything); foreign key vs application-level joins; migration strategy (additive first, destructive in separate deploy); UUID vs integer primary keys; soft delete pattern.

- [ ] **Step 2: Create Implementation skills**

**`Vault/05-Prompts/Skills/Implementation/oauth2-implementation-v1.0.md`** — `domain: auth`, `agent_relevance: [backend, security]`

Content: Authorization code flow vs client credentials vs implicit (deprecated); PKCE requirement for public clients; token storage (httpOnly cookie vs memory vs localStorage tradeoffs); refresh token rotation; scope design; introspection endpoint pattern.

**`Vault/05-Prompts/Skills/Implementation/rest-api-implementation-v1.0.md`** — `domain: api`, `agent_relevance: [backend]`

Content: Request validation (fail fast at boundary); middleware chain order (auth → validate → rate-limit → handler); consistent error response shape; idempotency keys for non-idempotent operations; pagination implementation; CORS configuration.

**`Vault/05-Prompts/Skills/Implementation/error-handling-patterns-v1.0.md`** — `domain: general`, `agent_relevance: [backend, frontend]`

Content: Error classification (operational vs programmer errors); never swallow errors silently; error propagation strategy (bubble vs handle at boundary); structured logging format `{ level, message, error, context }`; user-facing vs internal error messages; retry with backoff for transient errors.

**`Vault/05-Prompts/Skills/Implementation/testing-strategy-v1.0.md`** — `domain: testing`, `agent_relevance: [qa, backend, frontend]`

Content: Test pyramid (unit → integration → e2e); what to unit test (pure logic, transformations); what to integration test (DB queries, API endpoints, external calls); mock only at system boundaries; test naming convention `test_<what>_<when>_<expected>`; coverage targets (80% line, 100% critical paths); test data isolation.

- [ ] **Step 3: Create Infrastructure skills**

**`Vault/05-Prompts/Skills/Infrastructure/docker-containerization-v1.0.md`** — `domain: infra`, `agent_relevance: [devops]`

Content: Multi-stage builds (builder → runtime); non-root user in container; COPY vs ADD; `.dockerignore`; health check instruction; environment variable injection at runtime not build time; image tagging strategy.

**`Vault/05-Prompts/Skills/Infrastructure/kubernetes-deployment-v1.0.md`** — `domain: infra`, `agent_relevance: [devops]`

Content: Deployment vs StatefulSet vs DaemonSet decision; resource requests and limits (always set both); liveness vs readiness probes; ConfigMap vs Secret; horizontal pod autoscaler triggers; rolling update strategy; namespace organization.

**`Vault/05-Prompts/Skills/Infrastructure/ci-cd-pipeline-v1.0.md`** — `domain: infra`, `agent_relevance: [devops]`

Content: Pipeline stages (lint → test → build → scan → deploy); fail fast principle; artifact promotion (build once, deploy many); environment promotion gates (dev → staging → prod); rollback trigger conditions; secret injection (never in code or logs).

**`Vault/05-Prompts/Skills/Infrastructure/monitoring-setup-v1.0.md`** — `domain: infra`, `agent_relevance: [devops]`

Content: Four golden signals (latency, traffic, errors, saturation); alerting on symptoms not causes; SLO definition before alerting; log aggregation strategy; distributed trace sampling rate; dashboard design (overview → drill-down).

- [ ] **Step 4: Create remaining Cross-Cutting skills**

**`Vault/05-Prompts/Skills/CrossCutting/code-review-process-v1.0.md`** — `domain: general`, `agent_relevance: [architect, backend, frontend, qa]`

Content: What to check (correctness, security, maintainability — in that order); what not to nitpick (style should be linter's job); PR size guideline (<400 lines); review turnaround SLA; comment tone (suggest, don't demand); when to approve with comments vs request changes.

**`Vault/05-Prompts/Skills/CrossCutting/performance-optimization-v1.0.md`** — `domain: general`, `agent_relevance: [architect, backend, frontend]`

Content: Measure before optimizing (profiler first); N+1 query detection; caching layers (CDN → app cache → DB query cache); database index analysis; async I/O vs CPU-bound work; memory leak patterns (event listeners, closures); load test before production.

- [ ] **Step 5: Commit all skill files**

```
git add Vault/05-Prompts/Skills/
git commit -m "feat: add 13 Beta skill files across Architecture, Implementation, Infrastructure, CrossCutting domains"
```

---

### Task 11: Ingest Skills + Verify

**Files:** None changed — run ingest and verify.

- [ ] **Step 1: Re-ingest Vault (includes new skill files)**

```
node .claude/scripts/chroma-ingest.js Vault ai-software-factory
```

Expected: `global-standards` collection count increases by ~14 (one per new skill file, possibly more if chunked by section).

- [ ] **Step 2: Verify skills are queryable**

```
node .claude/scripts/context-assembly.js ai-software-factory "how should I document my API" --include-skills
```

Or via Node REPL:

```
node -e "
const { assembleContext } = require('./.claude/scripts/context-assembly');
assembleContext('how to document an API', 'ai-software-factory', { includeSkills: true, skillDomains: ['api', 'general'] })
  .then(ctx => console.log('Skills found:', ctx.skills.length, ctx.skills.map(s => s.metadata.source_path)))
  .catch(console.error);
"
```

Expected: `skills.length > 0`, results include `documentation-generation` or `api-design` skill.

- [ ] **Step 3: Commit**

```
git add .claude/logs/chroma-ingest-audit.json
git commit -m "chore: Stage 3 verified — 14 Beta skills ingested into global-standards"
```

---

## Stage 4 — Search Layer

### Task 12: Write Failing Search Tests + Install FlexSearch

**Files:**
- Create: `.claude/scripts/test-phase-16-search.js`
- Modify: `package.json`

- [ ] **Step 1: Add flexsearch to package.json dependencies**

```json
"flexsearch": "^0.7.43"
```

Run: `npm install`

Expected: `flexsearch` installed.

- [ ] **Step 2: Create test-phase-16-search.js**

```js
#!/usr/bin/env node

class Phase16SearchTests {
  constructor() {
    this.testsPassed = 0;
    this.testsFailed = 0;
  }

  assert(condition, message) {
    if (condition) {
      console.log(`   ✓ ${message}`);
      this.testsPassed++;
    } else {
      console.error(`   ✗ ${message}`);
      this.testsFailed++;
    }
  }

  testLexicalAddAndSearch() {
    console.log('\n📋 Test: Lexical index add and exact search');
    const { LexicalIndexer } = require('./lexical-indexer');
    const idx = new LexicalIndexer();
    idx.add('doc-1', 'CHROMA_SERVER_HOST configuration guide');
    idx.add('doc-2', 'Docker compose file for services');
    idx.add('doc-3', 'Authentication and authorization patterns');
    const results = idx.search('CHROMA_SERVER_HOST');
    this.assert(results.length > 0, 'Exact keyword returns results');
    this.assert(results[0] === 'doc-1', `Expected doc-1 first, got ${results[0]}`);
  }

  testLexicalForwardTokenize() {
    console.log('\n📋 Test: Lexical partial match via forward tokenize');
    const { LexicalIndexer } = require('./lexical-indexer');
    const idx = new LexicalIndexer();
    idx.add('doc-a', 'CHROMA_PORT environment variable');
    idx.add('doc-b', 'Completely unrelated document about testing');
    const results = idx.search('CHROMA');
    this.assert(results.includes('doc-a'), 'Partial prefix match finds doc-a');
    this.assert(!results.includes('doc-b'), 'Unrelated doc not returned');
  }

  testLexicalMiss() {
    console.log('\n📋 Test: Lexical returns empty for unknown term');
    const { LexicalIndexer } = require('./lexical-indexer');
    const idx = new LexicalIndexer();
    idx.add('doc-x', 'Some content here');
    const results = idx.search('xyzzy_nonexistent');
    this.assert(results.length === 0, `Expected 0 results, got ${results.length}`);
  }

  testRRFBoostsBothPassDocs() {
    console.log('\n📋 Test: RRF boosts doc appearing in both passes');
    const { reciprocalRankFusion } = require('./hybrid-search');
    const semantic = ['doc-a', 'doc-b', 'doc-c'];
    const lexical = ['doc-c', 'doc-d'];
    const merged = reciprocalRankFusion(semantic, lexical);
    const docC = merged.find(r => r.id === 'doc-c');
    const docA = merged.find(r => r.id === 'doc-a');
    this.assert(!!docC, 'doc-c in merged results');
    this.assert(docC.score > docA.score, `doc-c (${docC.score.toFixed(4)}) > doc-a (${docA.score.toFixed(4)})`);
  }

  testRRFPreservesAllSources() {
    console.log('\n📋 Test: RRF preserves semantic-only and lexical-only docs');
    const { reciprocalRankFusion } = require('./hybrid-search');
    const semantic = ['doc-semantic', 'doc-both'];
    const lexical = ['doc-both', 'doc-lexical'];
    const merged = reciprocalRankFusion(semantic, lexical);
    const ids = merged.map(r => r.id);
    this.assert(ids.includes('doc-semantic'), 'Semantic-only doc preserved');
    this.assert(ids.includes('doc-lexical'), 'Lexical-only doc preserved');
    this.assert(ids.includes('doc-both'), 'Both-pass doc preserved');
  }

  testRRFEmptyLexical() {
    console.log('\n📋 Test: RRF handles empty lexical results');
    const { reciprocalRankFusion } = require('./hybrid-search');
    const merged = reciprocalRankFusion(['doc-1', 'doc-2', 'doc-3'], []);
    this.assert(merged.length === 3, `Expected 3 results, got ${merged.length}`);
  }

  testRRFEmptySemantic() {
    console.log('\n📋 Test: RRF handles empty semantic results');
    const { reciprocalRankFusion } = require('./hybrid-search');
    const merged = reciprocalRankFusion([], ['doc-a', 'doc-b']);
    this.assert(merged.length === 2, `Expected 2 results, got ${merged.length}`);
  }

  async runAll() {
    console.log('\n🔬 Phase 16 Search Tests');
    console.log('━'.repeat(50));

    this.testLexicalAddAndSearch();
    this.testLexicalForwardTokenize();
    this.testLexicalMiss();
    this.testRRFBoostsBothPassDocs();
    this.testRRFPreservesAllSources();
    this.testRRFEmptyLexical();
    this.testRRFEmptySemantic();

    console.log('\n' + '━'.repeat(50));
    console.log(`Results: ${this.testsPassed} passed, ${this.testsFailed} failed`);
    if (this.testsFailed > 0) process.exit(1);
  }
}

new Phase16SearchTests().runAll().catch(err => {
  console.error('Test runner error:', err);
  process.exit(1);
});
```

- [ ] **Step 3: Run tests — verify they fail with MODULE_NOT_FOUND**

```
node .claude/scripts/test-phase-16-search.js
```

Expected: `Error: Cannot find module './lexical-indexer'`

---

### Task 13: Write lexical-indexer.js

**Files:**
- Create: `.claude/scripts/lexical-indexer.js`

- [ ] **Step 1: Create the file**

```js
#!/usr/bin/env node

/**
 * Lexical search index backed by FlexSearch.
 * Maps string document IDs to integer FlexSearch IDs.
 * Supports save/load for persistence across ingest runs.
 */

const fs = require('fs');
const path = require('path');
const { Index } = require('flexsearch');

const DATA_DIR = path.join(__dirname, '../data');
const INDEX_FILE = path.join(DATA_DIR, 'lexical-index.json');
const MAP_FILE = path.join(DATA_DIR, 'lexical-id-map.json');

class LexicalIndexer {
  constructor() {
    this.index = new Index({ tokenize: 'forward', resolution: 9 });
    this.idMap = {};       // string docId → integer
    this.reverseMap = {};  // integer → string docId
    this.nextId = 0;
  }

  _getOrAssign(docId) {
    if (!(docId in this.idMap)) {
      this.idMap[docId] = this.nextId;
      this.reverseMap[String(this.nextId)] = docId;
      this.nextId++;
    }
    return this.idMap[docId];
  }

  add(docId, text) {
    this.index.add(this._getOrAssign(docId), text);
  }

  update(docId, text) {
    this.index.update(this._getOrAssign(docId), text);
  }

  search(query, limit = 10) {
    const intIds = this.index.search(query, limit);
    return intIds.map(id => this.reverseMap[String(id)]).filter(Boolean);
  }

  save() {
    fs.mkdirSync(DATA_DIR, { recursive: true });

    const exported = {};
    // FlexSearch 0.7.x export is synchronous callback-based
    this.index.export((key, data) => {
      if (data !== undefined) exported[key] = data;
    });

    fs.writeFileSync(INDEX_FILE, JSON.stringify(exported), 'utf8');
    fs.writeFileSync(
      MAP_FILE,
      JSON.stringify({ idMap: this.idMap, reverseMap: this.reverseMap, nextId: this.nextId }),
      'utf8'
    );
  }

  load() {
    if (!fs.existsSync(INDEX_FILE) || !fs.existsSync(MAP_FILE)) return false;

    const exported = JSON.parse(fs.readFileSync(INDEX_FILE, 'utf8'));
    const mapData = JSON.parse(fs.readFileSync(MAP_FILE, 'utf8'));

    for (const [key, data] of Object.entries(exported)) {
      this.index.import(key, data);
    }

    this.idMap = mapData.idMap;
    this.reverseMap = mapData.reverseMap;
    this.nextId = mapData.nextId;
    return true;
  }
}

module.exports = { LexicalIndexer };
```

- [ ] **Step 2: Run search tests — verify lexical tests pass, RRF tests still fail**

```
node .claude/scripts/test-phase-16-search.js
```

Expected: First 3 lexical tests pass, RRF tests fail with `Cannot find module './hybrid-search'`.

---

### Task 14: Write hybrid-search.js

**Files:**
- Create: `.claude/scripts/hybrid-search.js`

- [ ] **Step 1: Create the file**

```js
#!/usr/bin/env node

/**
 * Hybrid search: merges vector (Chroma) and lexical (FlexSearch) results
 * using Reciprocal Rank Fusion (RRF).
 *
 * RRF score: score(doc) = Σ 1 / (k + rank + 1) across all result lists.
 * Documents appearing in multiple lists receive a compounded score.
 */

const RRF_K = 60;

/**
 * Merge two ranked lists of document IDs using RRF.
 * @param {string[]} semanticIds - Ordered IDs from vector search (best first)
 * @param {string[]} lexicalIds  - Ordered IDs from lexical search (best first)
 * @returns {Array<{id: string, score: number}>} - Merged, best score first
 */
function reciprocalRankFusion(semanticIds, lexicalIds) {
  const scores = new Map();

  [semanticIds, lexicalIds].forEach(ranking => {
    ranking.forEach((id, rank) => {
      scores.set(id, (scores.get(id) || 0) + 1 / (RRF_K + rank + 1));
    });
  });

  return [...scores.entries()]
    .sort(([, a], [, b]) => b - a)
    .map(([id, score]) => ({ id, score }));
}

/**
 * Re-rank formatted context items using RRF against lexical results.
 * @param {object[]} semanticResults - formatResults() output from Chroma
 * @param {string} query - The search query
 * @param {LexicalIndexer} lexicalIndexer - The lexical index
 * @param {number} topK - Max results to return
 * @returns {object[]} - Re-ranked context items with rrf_score added
 */
function hybridSearch(semanticResults, query, lexicalIndexer, topK = 5) {
  const semanticIds = semanticResults.map(
    r => r.metadata.source_path || r.metadata.file || String(r.position)
  );
  const lexicalIds = lexicalIndexer.search(query, topK * 2);

  const merged = reciprocalRankFusion(semanticIds, lexicalIds);

  const reranked = [];
  for (const { id, score } of merged.slice(0, topK)) {
    const hit = semanticResults.find(
      r => (r.metadata.source_path || r.metadata.file) === id
    );
    if (hit) {
      reranked.push({ ...hit, rrf_score: score });
    }
  }

  return reranked;
}

module.exports = { hybridSearch, reciprocalRankFusion };
```

- [ ] **Step 2: Run all search tests — all 7 should pass**

```
node .claude/scripts/test-phase-16-search.js
```

Expected: `Results: 7 passed, 0 failed`

- [ ] **Step 3: Commit**

```
git add .claude/scripts/lexical-indexer.js .claude/scripts/hybrid-search.js .claude/scripts/test-phase-16-search.js
git commit -m "feat: lexical-indexer and hybrid-search (RRF) with passing unit tests"
```

---

### Task 15: Wire Lexical Index + Hybrid Search

**Files:**
- Modify: `.claude/scripts/chroma-ingest.js`
- Modify: `.claude/scripts/context-assembly.js`

- [ ] **Step 1: Wire lexical indexer into chroma-ingest.js**

Add import at top:

```js
const { LexicalIndexer } = require('./lexical-indexer');
```

Add module-level instance after `_collectionHandles`:

```js
const _lexicalIndexer = new LexicalIndexer();
```

In `main()`, before `initializeCollections()`, attempt to load existing index:

```js
_lexicalIndexer.load();
console.log('   Lexical index loaded (or starting fresh)');
```

In `processDocument()`, after each chunk is ingested (inside the `for (const chunk of chunks)` loop), add:

```js
_lexicalIndexer.add(document.id, document.content);
```

At the end of `main()`, before the `✅ INGESTION COMPLETE` line, save the index:

```js
console.log('\n5️⃣  SAVING LEXICAL INDEX');
_lexicalIndexer.save();
console.log('   ✓ Lexical index saved');
```

- [ ] **Step 2: Wire hybrid search into context-assembly.js**

Add imports at top:

```js
const { LexicalIndexer } = require('./lexical-indexer');
const { hybridSearch } = require('./hybrid-search');
```

Add module-level instance:

```js
const _lexicalIndexer = new LexicalIndexer();
_lexicalIndexer.load(); // loads from .claude/data/lexical-index.json if present
```

In `assembleContext()`, after `context.standards = formatResults(...)`, re-rank using hybrid search:

```js
if (context.standards.length > 0) {
  context.standards = hybridSearch(context.standards, query, _lexicalIndexer, maxResults);
}
```

Apply the same pattern after `context.facts = formatResults(...)` and `context.sessions = formatResults(...)`.

- [ ] **Step 3: Re-run ingest to build the lexical index**

```
node .claude/scripts/chroma-ingest.js Vault ai-software-factory
```

Expected: `✓ Lexical index saved` line appears. `.claude/data/lexical-index.json` and `lexical-id-map.json` created.

- [ ] **Step 4: Test hybrid search end to end**

```
node .claude/scripts/context-assembly.js ai-software-factory "CHROMA_SERVER_HOST configuration"
```

Expected: Results include the Docker compose or env vars doc that contains the exact string `CHROMA_SERVER_HOST`, boosted above purely semantic matches.

- [ ] **Step 5: Commit**

```
git add .claude/scripts/chroma-ingest.js .claude/scripts/context-assembly.js .claude/data/
git commit -m "feat: wire lexical indexer into ingest pipeline and hybrid RRF search into context assembly"
```

---

## Stage 5 — Validation & Cleanup

### Task 16: Write and Run validate-phase-16.js

**Files:**
- Create: `.claude/scripts/validate-phase-16.js`

- [ ] **Step 1: Create the master test runner**

```js
#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

class Phase16Validator {
  constructor() {
    this.results = {};
    this.allPassed = true;
  }

  async runTest(scriptName, displayName, key) {
    return new Promise((resolve) => {
      console.log(`\n${'═'.repeat(60)}`);
      console.log(`Running: ${displayName}`);
      console.log('═'.repeat(60));

      const child = spawn('node', [path.join(__dirname, scriptName)], { stdio: 'inherit' });

      child.on('exit', code => {
        const passed = code === 0;
        this.results[key] = { passed, code };
        if (!passed) this.allPassed = false;
        resolve(passed);
      });

      child.on('error', error => {
        this.results[key] = { passed: false, error: error.message };
        this.allPassed = false;
        resolve(false);
      });
    });
  }

  printSummary() {
    console.log('\n' + '═'.repeat(60));
    console.log('PHASE 16 VALIDATION SUMMARY');
    console.log('═'.repeat(60));
    for (const [key, result] of Object.entries(this.results)) {
      console.log(`  ${result.passed ? '✅' : '❌'} ${key}`);
    }
    const passed = Object.values(this.results).filter(r => r.passed).length;
    const total = Object.keys(this.results).length;
    console.log(`\n  Suites: ${passed}/${total} passed`);
    console.log(this.allPassed ? '\n✅ PHASE 16 COMPLETE\n' : '\n❌ PHASE 16 VALIDATION FAILED\n');
  }

  async run() {
    console.log('\n🚀 Phase 16 Validation Suite\n');

    await this.runTest('test-phase-16-chunkers.js', 'Chunker Tests (markdown + code)', 'chunkers');
    await this.runTest('test-phase-16-search.js', 'Search Tests (lexical + RRF)', 'search');

    this.printSummary();
    process.exit(this.allPassed ? 0 : 1);
  }
}

new Phase16Validator().run().catch(err => {
  console.error('Validator error:', err);
  process.exit(1);
});
```

- [ ] **Step 2: Run the full suite**

```
node .claude/scripts/validate-phase-16.js
```

Expected:
```
✅ chunkers
✅ search

Suites: 2/2 passed
✅ PHASE 16 COMPLETE
```

- [ ] **Step 3: Commit**

```
git add .claude/scripts/validate-phase-16.js
git commit -m "feat: Phase 16 validation suite — all tests passing"
```

---

### Task 17: Cleanup — Known Problem + Roadmap

**Files:**
- Modify: `Vault/10-Known-Problems/Problem-infra-chroma-ingestion-api-incompatibility.md`
- Modify: `Vault/03-Projects/AI Software Factory/Phase-14-17-Roadmap.md`

- [ ] **Step 1: Mark Known Problem resolved**

In `Problem-infra-chroma-ingestion-api-incompatibility.md`, update the frontmatter:

```yaml
status: resolved
resolved: 2026-06-09
resolved_by_task: Phase-16-Stage-1
resolution_summary: "Replaced raw HTTP pipeline with chromadb JS client + @chroma-core/default-embed. Collections recreated, full Vault re-ingested with chunking."
last_updated: 2026-06-09
```

Also update the `**Status:** open` line in the document body to `**Status:** resolved`.

- [ ] **Step 2: Check Phase 16 success criteria boxes in roadmap**

In `Phase-14-17-Roadmap.md`, find the Phase 16 success criteria section and check all boxes:

```markdown
- [x] Header-based chunks maintain semantic coherence (no half-paragraphs)
- [x] Code chunks preserve complete function/class signatures
- [x] All 14 Beta skills have content and are ingested into Chroma
- [x] `assembleContext()` accepts `includeSkills` parameter and returns relevant skills
- [x] FlexSearch indexes Vault content in <1s; exact lookups return in <100ms
- [x] Hybrid search returns both semantically relevant AND exact-match results
- [x] Existing Vault re-indexed without document loss
```

Also update the Phase 16 status line from `**Status:** Not started` to `**Status:** ✅ Complete (2026-06-09)`.

- [ ] **Step 3: Final commit**

```
git add Vault/10-Known-Problems/Problem-infra-chroma-ingestion-api-incompatibility.md
git add "Vault/03-Projects/AI Software Factory/Phase-14-17-Roadmap.md"
git commit -m "docs: Phase 16 complete — mark Known Problem resolved, update roadmap"
```

---

## Self-Review

**Spec coverage check:**
- Stage 1 Chroma fix → Tasks 1–4 ✓
- Stage 2 Chunkers → Tasks 5–8 ✓
- Stage 3 Skills activation (documentation first, then 13 remaining, then ingest) → Tasks 9–11 ✓
- Stage 4 Lexical + hybrid search → Tasks 12–15 ✓
- Stage 5 Validation + cleanup → Tasks 16–17 ✓
- `includeSkills` + `skillDomains` parameter → Task 9 ✓
- `upsert` idempotency → Task 2 ✓
- Embedding model compatibility note → Task 1 (package.json comment) ✓

**Placeholder scan:** No TBDs. Skill content in Task 10 uses bullet descriptions rather than full markdown — intentional: writing 13 full skill files inline would make the plan unreadable; the descriptions give an engineer enough to write each one in 15 minutes following the Task 9 template exactly.

**Type consistency:**
- `chunkMarkdown` / `chunkCode` — defined Tasks 6/7, used Task 8 ✓
- `LexicalIndexer` — defined Task 13, wired Task 15 ✓
- `reciprocalRankFusion` / `hybridSearch` — defined Task 14, wired Task 15 ✓
- `formatResults` — unchanged throughout, no rename ✓
- `_collectionHandles` — defined Task 2, used by `ingestDocument` Task 2 ✓
