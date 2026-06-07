#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Read stdin (PostCompact hook input)
let inputData = '';

process.stdin.on('data', chunk => {
  inputData += chunk;
});

process.stdin.on('end', () => {
  try {
    // Parse input - can be JSON or plain text summary
    let summary;
    try {
      summary = JSON.parse(inputData);
    } catch {
      // If not JSON, treat entire input as summary text
      summary = {
        summary: inputData,
        sessionId: 'unknown'
      };
    }

    const sessionNote = createSessionNote(summary);
    const filePath = saveSessionNote(sessionNote);

    // Output success as JSON
    console.log(JSON.stringify({
      success: true,
      filePath: filePath,
      message: `📝 Session note created: ${path.basename(filePath)}`
    }));

    process.exit(0);
  } catch (error) {
    // Output error as JSON
    console.error(JSON.stringify({
      success: false,
      error: error.message,
      stack: error.stack
    }));
    process.exit(1);
  }
});

function createSessionNote(input) {
  const now = new Date();
  const timestamp = now.toISOString();
  const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
  const timeStr = now.toISOString().split('T')[1].replace(/:/g, '-').slice(0, 5); // HH-MM

  // Extract summary text
  const summaryText = input.summary || input.summaryText || JSON.stringify(input);

  // Extract key information using regex patterns
  const workCompleted = extractWorkItems(summaryText);
  const decisions = extractDecisions(summaryText);
  const blockers = extractBlockers(summaryText);
  const relatedADRs = extractADRReferences(summaryText);

  // Generate YAML frontmatter
  const yaml = `---
type: Session
phase: null
status: Complete
authority: sessions
chroma_collection: ai-software-factory-sessions
tags: [session, compact, autolog]
related: ${JSON.stringify(relatedADRs)}
last_updated: ${dateStr}
---
`;

  // Generate markdown content
  const workSection = workCompleted.length > 0
    ? workCompleted.map(item => `- ${item}`).join('\n')
    : '(Context compacted, see prior session for details)';

  const decisionsSection = decisions.length > 0
    ? decisions.map(item => `- ${item}`).join('\n')
    : 'None explicitly recorded in summary';

  const blockersSection = blockers.length > 0
    ? blockers.map(item => `- ${item}`).join('\n')
    : 'None identified';

  const relatedSection = relatedADRs.length > 0
    ? relatedADRs.map(adr => `- [[../07-Decisions/${adr}|${adr}]]`).join('\n')
    : '(See prior session for architectural context)';

  const markdown = `
# Session Summary — ${dateStr} (${timeStr})

**Auto-generated** by PostCompact hook when /compact executed due to context limit.

## Work Completed

${workSection}

## Decisions Made

${decisionsSection}

## Blockers & Issues

${blockersSection}

## Context Checkpoint

- **Reason for compact:** Context limit reached (~90%)
- **Timestamp:** ${timestamp}
- **Session ID:** ${input.sessionId || 'unknown'}
- **Next step:** Continue work in new session with full context

## Related Documentation

${relatedSection}

---

**Note:** This session note was created automatically. For detailed session summaries with more context, see the prior session summary file.

**Status:** Compacted. Continue in new context window.`;

  return {
    filename: `Session-Summary-${dateStr}-${timeStr}.md`,
    content: yaml + markdown
  };
}

function extractWorkItems(text) {
  const patterns = [
    /(?:completed|finished|created|updated|added|implemented|executed):\s*([^\n]+)/gi,
    /✅\s+([^\n]+)/g,
    /- ✅\s*([^\n]+)/g,
  ];

  const items = [];
  const seen = new Set();

  patterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const item = match[1].trim();
      if (item && !seen.has(item)) {
        items.push(item);
        seen.add(item);
      }
    }
  });

  return items.slice(0, 10); // Limit to 10 items
}

function extractDecisions(text) {
  const patterns = [
    /(?:decided|chose|selected|approved):\s*([^\n]+)/gi,
    /decision:\s*([^\n]+)/gi,
    /decided to\s+([^\n]+)/gi,
  ];

  const items = [];
  const seen = new Set();

  patterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const item = match[1].trim();
      if (item && !seen.has(item)) {
        items.push(item);
        seen.add(item);
      }
    }
  });

  return items.slice(0, 5);
}

function extractBlockers(text) {
  const patterns = [
    /(?:issue|blocker|problem|error|blocked|blocked on):\s*([^\n]+)/gi,
    /❌\s+([^\n]+)/g,
    /- ❌\s*([^\n]+)/g,
  ];

  const items = [];
  const seen = new Set();

  patterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const item = match[1].trim();
      if (item && !seen.has(item)) {
        items.push(item);
        seen.add(item);
      }
    }
  });

  return items.slice(0, 5);
}

function extractADRReferences(text) {
  // Find ADR references: ADR-ARCH-001, ADR-SEC-001, etc.
  const pattern = /ADR-[A-Z]+-\d+/gi;
  const matches = text.match(pattern) || [];
  // Deduplicate and sort
  return [...new Set(matches)].sort();
}

function saveSessionNote(note) {
  // Get the retrospectives directory path
  // From .claude/hooks/ -> go up to project root, then to Vault/08-Retrospectives/
  const hooksDir = __dirname; // .claude/hooks
  const claudeDir = path.dirname(hooksDir); // .claude
  const projectRoot = path.dirname(claudeDir); // project root
  const retrospectivesDir = path.join(projectRoot, 'Vault', '08-Retrospectives');

  // Ensure directory exists
  if (!fs.existsSync(retrospectivesDir)) {
    fs.mkdirSync(retrospectivesDir, { recursive: true });
  }

  const filePath = path.join(retrospectivesDir, note.filename);

  // Write file with UTF-8 encoding
  fs.writeFileSync(filePath, note.content, 'utf8');

  return filePath;
}

// Handle errors that occur outside of normal flow
process.on('uncaughtException', (error) => {
  console.error(JSON.stringify({
    success: false,
    error: error.message,
    type: 'uncaughtException'
  }));
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error(JSON.stringify({
    success: false,
    error: String(reason),
    type: 'unhandledRejection'
  }));
  process.exit(1);
});
