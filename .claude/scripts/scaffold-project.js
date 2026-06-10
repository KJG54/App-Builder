#!/usr/bin/env node

/**
 * Phase 18.1 — Project Scaffold System
 *
 * Creates a new project from the framework template.
 *
 * Usage:
 *   node scaffold-project.js                  # interactive prompts
 *   node scaffold-project.js <name> <cat> <type>  # non-interactive
 *
 * What gets copied (structure + governance only):
 *   Vault/01-Standards/        — coding/arch/doc/security standards
 *   Vault/Templates/           — document templates
 *   Vault/<folder-skeletons>/  — empty directories with README stubs
 *   .claude/scripts/           — tool scripts
 *   CLAUDE.md                  — framework governance (then appended with project rules)
 *
 * What stays in the framework (accessible via Chroma cross-indexing):
 *   Vault/07-Decisions/        — framework ADRs
 *   Vault/08-Retrospectives/   — framework session summaries
 *   Vault/03-Projects/AI Software Factory/ — framework project docs
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const readline = require('readline');
const { ingestProjectVault } = require('./chroma-ingest');

const ROOT         = path.resolve(__dirname, '..', '..');
const PROJECTS_DIR = path.join(ROOT, 'Projects');
const REGISTRY     = path.join(ROOT, 'Vault', '03-Projects', 'Registry.md');

// Vault subdirs to copy verbatim into the new project
const VAULT_COPY_DIRS = ['01-Standards', 'Templates'];

// Vault subdirs to create as empty skeletons (with a stub README)
const VAULT_SKELETON_DIRS = [
  '02-Technologies',
  '03-Projects',
  '04-Workflows',
  '05-Prompts',
  '06-Glossary',
  '07-Decisions',
  '08-Retrospectives',
  '09-Requirements',
  '10-Known-Problems',
];

// Directories to skip when copying .claude/scripts/
const SKIP_DIRS = new Set(['.git', 'node_modules', '.obsidian', '.vscode', 'Projects']);

const PROJECT_TYPES = ['web-app', 'api', 'desktop-app', 'ai-system', 'game', 'automation', 'internal-tool', 'other'];
const CATEGORIES    = ['apps', 'tools', 'games', 'experiments', 'client-work', 'internal'];

// ── Helpers ────────────────────────────────────────────────────────────────────

function ask(rl, question) {
  return new Promise(resolve => rl.question(question, resolve));
}

function copyDir(src, dest, skipDirs = SKIP_DIRS) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src)) {
    if (skipDirs.has(entry)) continue;
    const srcPath  = path.join(src, entry);
    const destPath = path.join(dest, entry);
    if (fs.statSync(srcPath).isDirectory()) {
      copyDir(srcPath, destPath, skipDirs);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

// ── Prompt helpers ─────────────────────────────────────────────────────────────

async function promptName(rl) {
  while (true) {
    const raw = (await ask(rl, 'Project name (e.g. "My Cool App"): ')).trim();
    if (raw.length >= 2) return raw;
    console.log('  Name must be at least 2 characters.');
  }
}

async function promptChoice(rl, label, choices) {
  console.log(`\n${label}:`);
  choices.forEach((c, i) => console.log(`  ${i + 1}. ${c}`));
  while (true) {
    const raw = (await ask(rl, `Choice (1–${choices.length}): `)).trim();
    const n = parseInt(raw, 10);
    if (n >= 1 && n <= choices.length) return choices[n - 1];
    console.log(`  Enter a number between 1 and ${choices.length}.`);
  }
}

// ── Scaffold logic ─────────────────────────────────────────────────────────────

function createProjectDir(category, slug) {
  const projectDir = path.join(PROJECTS_DIR, category, slug);
  if (fs.existsSync(projectDir)) {
    throw new Error(`Project directory already exists: ${projectDir}`);
  }
  fs.mkdirSync(projectDir, { recursive: true });
  return projectDir;
}

function scaffoldVault(projectDir, projectName, projectType) {
  const vaultDest = path.join(projectDir, 'Vault');
  const vaultSrc  = path.join(ROOT, 'Vault');

  // Copy standards and templates verbatim
  for (const dir of VAULT_COPY_DIRS) {
    const src  = path.join(vaultSrc, dir);
    const dest = path.join(vaultDest, dir);
    if (fs.existsSync(src)) copyDir(src, dest);
  }

  // Create skeleton directories with stub READMEs
  for (const dir of VAULT_SKELETON_DIRS) {
    const dest = path.join(vaultDest, dir);
    fs.mkdirSync(dest, { recursive: true });
    const readmePath = path.join(dest, 'README.md');
    if (!fs.existsSync(readmePath)) {
      fs.writeFileSync(readmePath, [
        `---`,
        `type: readme`,
        `status: active`,
        `last_updated: ${today()}`,
        `---`,
        ``,
        `# ${dir}`,
        ``,
        `_No entries yet. Add documents as the project grows._`,
        ``,
      ].join('\n'));
    }
  }

  // Vault INDEX stub
  fs.writeFileSync(path.join(vaultDest, 'INDEX.md'), [
    `---`,
    `type: index`,
    `status: active`,
    `last_updated: ${today()}`,
    `---`,
    ``,
    `# ${projectName} — Vault Index`,
    ``,
    `**Project type:** ${projectType}`,
    `**Created:** ${today()}`,
    ``,
    `## Navigation`,
    ``,
    `- [[01-Standards/]] — Coding, architecture, documentation, security standards`,
    `- [[02-Technologies/]] — Technology guides and integration notes`,
    `- [[03-Projects/]] — Project architecture and planning`,
    `- [[04-Workflows/]] — Processes and workflows`,
    `- [[05-Prompts/]] — Agent prompts and skills`,
    `- [[07-Decisions/]] — Architectural decision records`,
    `- [[08-Retrospectives/]] — Session summaries`,
    `- [[09-Requirements/]] — Requirements (BR/FR/NFR)`,
    `- [[10-Known-Problems/]] — Known issues and solutions`,
    `- [[Templates/]] — Document templates`,
    ``,
  ].join('\n'));

  // STATUS.md stub
  fs.writeFileSync(path.join(vaultDest, 'STATUS.md'), [
    `---`,
    `type: guide`,
    `status: active`,
    `last_updated: ${today()}`,
    `---`,
    ``,
    `# ${projectName} — Project Status`,
    ``,
    `**Created:** ${today()}`,
    `**Type:** ${projectType}`,
    ``,
    `## Phase Progress`,
    ``,
    `_Phases will be added after discovery and planning._`,
    ``,
    `## Current Work`,
    ``,
    `_Discovery phase — run \`/discover\` to begin requirements gathering._`,
    ``,
  ].join('\n'));
}

function scaffoldScripts(projectDir) {
  const scriptsSrc  = path.join(ROOT, '.claude', 'scripts');
  const scriptsDest = path.join(projectDir, '.claude', 'scripts');
  // Copy scripts; skip nested .claude to prevent infinite recursion
  copyDir(scriptsSrc, scriptsDest, new Set(['.git', 'node_modules', '.claude']));
}

function scaffoldClaudeDir(projectDir) {
  // Create expected .claude subdirectories (no content — runtime artifacts)
  for (const sub of ['logs', 'metrics', 'reviews', 'approvals', 'plans', 'mcp-audit']) {
    fs.mkdirSync(path.join(projectDir, '.claude', sub), { recursive: true });
    // .gitkeep so the dir is trackable in the new project's git repo
    fs.writeFileSync(path.join(projectDir, '.claude', sub, '.gitkeep'), '');
  }
}

function scaffoldClaudeMd(projectDir, projectName, projectType) {
  const frameworkClaudeMd = path.join(ROOT, 'CLAUDE.md');
  const destClaudeMd      = path.join(projectDir, 'CLAUDE.md');

  // Start with framework governance
  let content = fs.readFileSync(frameworkClaudeMd, 'utf8');

  // Append project-specific section
  const projectSection = [
    ``,
    `---`,
    ``,
    `# Project-Specific Rules`,
    ``,
    `**Project name:** ${projectName}`,
    `**Project type:** ${projectType}`,
    `**Created:** ${today()}`,
    ``,
    `## Technology Stack`,
    ``,
    `_Fill in after technology selection during discovery/planning._`,
    ``,
    `## Key Decisions`,
    ``,
    `_Record project-specific decisions here. Framework decisions are in the framework Vault._`,
    ``,
    `## Out of Scope`,
    ``,
    `_List features explicitly excluded from this project._`,
    ``,
    `## Coding Conventions`,
    ``,
    `_Project-specific conventions beyond framework defaults._`,
    ``,
  ].join('\n');

  fs.writeFileSync(destClaudeMd, content + projectSection);
}

function scaffoldPackageJson(projectDir, projectName, slug) {
  const pkg = {
    name: slug,
    version: '0.1.0',
    description: projectName,
    private: true,
    scripts: {
      test: 'echo "No tests defined yet"',
    },
    keywords: [],
    author: '',
    license: 'MIT',
    engines: { node: '>=20.0.0' },
  };
  fs.writeFileSync(
    path.join(projectDir, 'package.json'),
    JSON.stringify(pkg, null, 2) + '\n'
  );
}

function scaffoldGitignore(projectDir) {
  const content = [
    `node_modules/`,
    `.env`,
    `.env.*`,
    `*.env`,
    `.claude/logs/`,
    `.claude/metrics/`,
    `.claude/reviews/`,
    `.claude/approvals/`,
    `.claude/mcp-audit/`,
    `.claude/.fsm-state.json`,
    `.DS_Store`,
    `Thumbs.db`,
    ``,
  ].join('\n');
  fs.writeFileSync(path.join(projectDir, '.gitignore'), content);
}

function scaffoldReadme(projectDir, projectName, projectType, category) {
  fs.writeFileSync(path.join(projectDir, 'README.md'), [
    `# ${projectName}`,
    ``,
    `**Type:** ${projectType}  `,
    `**Category:** ${category}  `,
    `**Created:** ${today()}`,
    ``,
    `## Getting Started`,
    ``,
    `_Fill in after planning phase._`,
    ``,
    `## Project Vault`,
    ``,
    `See \`Vault/\` for requirements, architecture decisions, and session notes.`,
    ``,
    `Run \`/discover\` in Claude Code to begin a requirements interview.`,
    ``,
  ].join('\n'));
}

function registerProject(projectName, slug, category, projectType, chromaCollection) {
  const dateStr = today();
  const newRow = `| ${projectName} | ${category} | ${projectType} | ${chromaCollection} | scaffolded | ${dateStr} | — |`;

  if (!fs.existsSync(REGISTRY)) {
    // Registry doesn't exist yet — create it (shouldn't happen but be safe)
    const header = [
      `---`,
      `type: registry`,
      `status: active`,
      `last_updated: ${dateStr}`,
      `---`,
      ``,
      `# Project Registry`,
      ``,
      `| Name | Category | Type | Chroma Collection | Status | Created | GitHub |`,
      `|------|----------|------|-------------------|--------|---------|--------|`,
      newRow,
      ``,
    ].join('\n');
    fs.writeFileSync(REGISTRY, header);
    return;
  }

  let content = fs.readFileSync(REGISTRY, 'utf8');

  // Find the Registry table header row and insert after the last data row in that table
  const headerMarker = '| Name | Category | Type | Chroma Collection | Status | Created | GitHub |';
  const headerIdx = content.indexOf(headerMarker);
  if (headerIdx === -1) {
    content += `\n${newRow}\n`;
  } else {
    // Find separator row (---|---) after the header, then scan for last data row
    const afterHeader = content.indexOf('\n', headerIdx) + 1; // start of separator line
    const afterSep    = content.indexOf('\n', afterHeader) + 1; // start of first data row (or next section)

    // Scan forward from afterSep to find last consecutive | line
    let pos = afterSep;
    let lastRowEnd = afterSep;
    while (pos < content.length && content[pos] === '|') {
      const lineEnd = content.indexOf('\n', pos);
      if (lineEnd === -1) break;
      lastRowEnd = lineEnd + 1;
      pos = lastRowEnd;
    }
    content = content.slice(0, lastRowEnd) + newRow + '\n' + content.slice(lastRowEnd);
  }

  // Update last_updated in frontmatter
  content = content.replace(/last_updated: \d{4}-\d{2}-\d{2}/, `last_updated: ${dateStr}`);

  fs.writeFileSync(REGISTRY, content);
}

// ── Main ───────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);

  let projectName, category, projectType;

  if (args.length >= 3) {
    // Non-interactive mode
    projectName = args[0];
    category    = args[1];
    projectType = args[2];
  } else {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    console.log('\n🏗️  Project Scaffold — AI Software Factory\n');

    try {
      projectName = await promptName(rl);
      category    = await promptChoice(rl, 'Category', CATEGORIES);
      projectType = await promptChoice(rl, 'Project type', PROJECT_TYPES);
    } finally {
      rl.close();
    }
  }

  const slug            = slugify(projectName);
  const chromaCollection = `project-${slug}`;

  console.log(`\n📁 Scaffolding: Projects/${category}/${slug}/`);

  // 1. Create project directory
  const projectDir = createProjectDir(category, slug);

  // 2. Vault structure + governance
  scaffoldVault(projectDir, projectName, projectType);

  // 3. .claude/scripts + subdirectories
  scaffoldScripts(projectDir);
  scaffoldClaudeDir(projectDir);

  // 4. CLAUDE.md (framework governance + project rules section)
  scaffoldClaudeMd(projectDir, projectName, projectType);

  // 5. Minimal project files
  scaffoldPackageJson(projectDir, projectName, slug);
  scaffoldGitignore(projectDir);
  scaffoldReadme(projectDir, projectName, projectType, category);

  // 6. Register in Registry.md
  registerProject(projectName, slug, category, projectType, chromaCollection);

  // 7. Register project Vault in Chroma for cross-project indexing (Phase 18.3)
  const projectVaultPath = path.join(projectDir, 'Vault');
  try {
    await ingestProjectVault(projectVaultPath, chromaCollection);
    console.log(`   Chroma cross-index: ${chromaCollection} ✓`);
  } catch (err) {
    console.log(`   Chroma cross-index: skipped (${err.message.split('—')[0].trim()})`);
    console.log(`   Re-index later: node .claude/scripts/chroma-ingest.js --project-vault ${projectVaultPath} ${chromaCollection}`);
  }

  console.log(`✅ Project scaffolded at: Projects/${category}/${slug}/`);
  console.log(`   Chroma collection: ${chromaCollection}`);
  console.log(`   Registered in: Vault/03-Projects/Registry.md`);
  console.log(`\nNext steps:`);
  console.log(`  1. cd Projects/${category}/${slug}`);
  console.log(`  2. git init && git add . && git commit -m "chore: scaffold project"`);
  console.log(`  3. Run /discover in Claude Code to begin requirements gathering\n`);
}

main().catch(err => {
  console.error(`❌ Scaffold failed: ${err.message}`);
  process.exit(1);
});
