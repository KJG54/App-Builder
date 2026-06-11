#!/usr/bin/env node

/**
 * Phase 18.6 — Review and Ship
 *
 * Pre-ship checklist and artifact generation for a completed project.
 *
 * Usage:
 *   node ship-project.js <projectDir>
 *   node ship-project.js <projectDir> --dry-run    # report only
 *
 * What it does:
 *   1. Generates a diff summary + decision log (what changed, why)
 *   2. Adds Dockerfile scaffold (if not present)
 *   3. Adds GitHub Actions CI scaffold (if not present)
 *   4. Writes post-build Vault record
 *   5. Writes session summary to project's Vault/08-Retrospectives/
 *   6. Updates Registry.md status to "shipped"
 *   7. Creates a final git checkpoint
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const { execSync, spawnSync } = require('child_process');

// ── Helpers ────────────────────────────────────────────────────────────────────

function today() {
  return new Date().toISOString().slice(0, 10);
}

function tryExec(cmd, cwd) {
  try {
    return execSync(cmd, { cwd, stdio: 'pipe' }).toString().trim();
  } catch { return ''; }
}

function parseCLI() {
  const args = process.argv.slice(2);
  const opts = { projectDir: null, dryRun: false };
  for (const arg of args) {
    if (arg === '--dry-run') opts.dryRun = true;
    else if (!opts.projectDir) opts.projectDir = path.resolve(arg);
  }
  return opts;
}

// ── Diff Summary ───────────────────────────────────────────────────────────────

function generateDiffSummary(projectDir) {
  const log  = tryExec('git log --oneline --no-decorate -20', projectDir);
  const stat = tryExec('git diff --stat HEAD~5 HEAD', projectDir) ||
               tryExec('git show --stat --no-patch', projectDir);
  return { log, stat };
}

// ── Dockerfile Scaffold ────────────────────────────────────────────────────────

function scaffoldDockerfile(projectDir) {
  const dockerfilePath = path.join(projectDir, 'Dockerfile');
  if (fs.existsSync(dockerfilePath)) return null; // already exists

  const pkgPath = path.join(projectDir, 'package.json');
  const isNode  = fs.existsSync(pkgPath);

  let content;
  if (isNode) {
    let pkg = {};
    try { pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8')); } catch { /* malformed — use defaults */ }
    const startCmd = (pkg.scripts && pkg.scripts.start) ? 'npm start' : 'node index.js';
    content = [
      `FROM node:20-alpine`,
      ``,
      `WORKDIR /app`,
      ``,
      `# Install dependencies`,
      `COPY package*.json ./`,
      `RUN npm ci --only=production`,
      ``,
      `# Copy source`,
      `COPY . .`,
      ``,
      `# Expose port (update if different)`,
      `EXPOSE 3000`,
      ``,
      `CMD ["sh", "-c", "${startCmd}"]`,
      ``,
    ].join('\n');
  } else {
    content = [
      `FROM alpine:3.19`,
      ``,
      `WORKDIR /app`,
      ``,
      `COPY . .`,
      ``,
      `# TODO: Add build and run instructions for your stack`,
      `# RUN ...`,
      `# CMD [...]`,
      ``,
    ].join('\n');
  }

  fs.writeFileSync(dockerfilePath, content, 'utf8');
  return dockerfilePath;
}

function scaffoldDockerignore(projectDir) {
  const p = path.join(projectDir, '.dockerignore');
  if (fs.existsSync(p)) return null;

  fs.writeFileSync(p, [
    `node_modules`,
    `.git`,
    `.claude`,
    `*.log`,
    `.env`,
    `.env.*`,
    ``,
  ].join('\n'), 'utf8');
  return p;
}

// ── GitHub Actions CI Scaffold ─────────────────────────────────────────────────

function scaffoldCI(projectDir) {
  const ciDir    = path.join(projectDir, '.github', 'workflows');
  const ciPath   = path.join(ciDir, 'ci.yml');
  if (fs.existsSync(ciPath)) return null; // already exists

  const pkgPath  = path.join(projectDir, 'package.json');
  const isNode   = fs.existsSync(pkgPath);

  let content;
  if (isNode) {
    content = [
      `name: CI`,
      ``,
      `on:`,
      `  push:`,
      `    branches: [main]`,
      `  pull_request:`,
      `    branches: [main]`,
      ``,
      `jobs:`,
      `  test:`,
      `    runs-on: ubuntu-latest`,
      `    steps:`,
      `      - uses: actions/checkout@v4`,
      `      - uses: actions/setup-node@v4`,
      `        with:`,
      `          node-version: '20'`,
      `          cache: 'npm'`,
      `      - run: npm ci`,
      `      - run: npm test`,
      ``,
    ].join('\n');
  } else {
    content = [
      `name: CI`,
      ``,
      `on:`,
      `  push:`,
      `    branches: [main]`,
      `  pull_request:`,
      `    branches: [main]`,
      ``,
      `jobs:`,
      `  test:`,
      `    runs-on: ubuntu-latest`,
      `    steps:`,
      `      - uses: actions/checkout@v4`,
      `      # TODO: Add language-specific setup and test steps`,
      ``,
    ].join('\n');
  }

  fs.mkdirSync(ciDir, { recursive: true });
  fs.writeFileSync(ciPath, content, 'utf8');
  return ciPath;
}

// ── Post-Build Vault Record ────────────────────────────────────────────────────

function writeVaultRecord(projectDir, diffSummary) {
  const projectName = path.basename(projectDir);
  const vaultDir    = path.join(projectDir, 'Vault', '03-Projects', projectName);
  const recordPath  = path.join(vaultDir, 'Build-Record.md');

  fs.mkdirSync(vaultDir, { recursive: true });

  const gitLog  = diffSummary.log;
  const gitStat = diffSummary.stat;

  const content = [
    `---`,
    `type: project`,
    `status: shipped`,
    `authority: facts`,
    `last_updated: ${today()}`,
    `---`,
    ``,
    `# ${projectName} — Build Record`,
    ``,
    `**Shipped:** ${today()}`,
    `**Status:** shipped`,
    ``,
    `## Summary`,
    ``,
    `_Fill in project summary here._`,
    ``,
    `## Deliverables`,
    ``,
    `_List what was built._`,
    ``,
    `## Architecture`,
    ``,
    `_Describe the final architecture._`,
    ``,
    `## Technology Stack`,
    ``,
    `_List the technologies used._`,
    ``,
    `## Recent Git Activity`,
    ``,
    `\`\`\``,
    gitLog || '(no git history)',
    `\`\`\``,
    ``,
    `## Known Issues`,
    ``,
    `_Any known limitations or deferred work._`,
    ``,
    `## Lessons Learned`,
    ``,
    `_What worked well, what didn't._`,
    ``,
  ].join('\n');

  fs.writeFileSync(recordPath, content, 'utf8');
  return recordPath;
}

// ── Session Summary ────────────────────────────────────────────────────────────

function writeSessionSummary(projectDir) {
  const projectName = path.basename(projectDir);
  const retroDir    = path.join(projectDir, 'Vault', '08-Retrospectives');
  const summaryPath = path.join(retroDir, `Session-Summary-${today()}-ship.md`);

  fs.mkdirSync(retroDir, { recursive: true });

  const content = [
    `---`,
    `type: retrospective`,
    `status: active`,
    `authority: sessions`,
    `last_updated: ${today()}`,
    `---`,
    ``,
    `# Session Summary — ${projectName} Ship`,
    ``,
    `**Date:** ${today()}`,
    `**Event:** Project shipped`,
    ``,
    `## What Was Built`,
    ``,
    `_Summarize the delivered project._`,
    ``,
    `## Decisions Made`,
    ``,
    `_Key decisions made during the build._`,
    ``,
    `## What Worked`,
    ``,
    `_Approaches that worked well._`,
    ``,
    `## What Didn't Work`,
    ``,
    `_Approaches that failed or caused friction._`,
    ``,
    `## Next Steps`,
    ``,
    `_Future work, known issues, deferred features._`,
    ``,
  ].join('\n');

  fs.writeFileSync(summaryPath, content, 'utf8');
  return summaryPath;
}

// ── Registry Update ────────────────────────────────────────────────────────────

function updateRegistry(projectName) {
  const registryPath = path.join(__dirname, '..', '..', 'Vault', '03-Projects', 'Registry.md');
  if (!fs.existsSync(registryPath)) return false;

  const slug = projectName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  if (!slug || slug === '-') return false; // degenerate slug would match every row

  // Escape any regex metacharacters that survived the slug normalisation
  const escapedSlug = slug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  let content = fs.readFileSync(registryPath, 'utf8');

  // Replace the status cell on the matching project row
  const rowRegex = new RegExp(`(\\|[^|]*${escapedSlug}[^|]*\\|[^|]*\\|[^|]*\\|[^|]*\\|)\\s*(scaffolded|discovery|planning|building|review)\\s*(\\|)`, 'i');
  if (!rowRegex.test(content)) return false;

  content = content.replace(rowRegex, `$1 shipped $3`);

  // Update last_updated only in the YAML front-matter block (before the first table row)
  const fmEnd = content.indexOf('\n|');
  if (fmEnd !== -1) {
    const fm   = content.slice(0, fmEnd);
    const rest = content.slice(fmEnd);
    content = fm.replace(/last_updated: \d{4}-\d{2}-\d{2}/, `last_updated: ${today()}`) + rest;
  }

  fs.writeFileSync(registryPath, content, 'utf8');
  return true;
}

// ── Review Report ──────────────────────────────────────────────────────────────

function writeReviewReport(projectDir, artifacts, dryRun, diffSummary) {
  const reviewDir  = path.join(projectDir, '.claude', 'reviews');
  const reportPath = path.join(reviewDir, `ship-review-${today()}.md`);

  fs.mkdirSync(reviewDir, { recursive: true });

  const { log, stat } = diffSummary;

  const content = [
    `# Ship Review — ${path.basename(projectDir)}`,
    `**Date:** ${today()}`,
    `**Mode:** ${dryRun ? 'DRY RUN' : 'SHIP'}`,
    ``,
    `## Artifacts Generated`,
    ``,
    ...artifacts.map(a => `- ${a}`),
    ``,
    `## Recent Commits`,
    ``,
    `\`\`\``,
    log || '(no git history)',
    `\`\`\``,
    ``,
    `## Change Summary`,
    ``,
    `\`\`\``,
    stat || '(no diff available)',
    `\`\`\``,
    ``,
    `## Decision Log`,
    ``,
    `_Update this section with key decisions made during the build._`,
    ``,
    `| Decision | Rationale | Alternative Considered |`,
    `|----------|-----------|----------------------|`,
    `| | | |`,
    ``,
  ].join('\n');

  fs.writeFileSync(reportPath, content, 'utf8');
  return reportPath;
}

// ── Main ───────────────────────────────────────────────────────────────────────

async function main() {
  const opts = parseCLI();

  if (!opts.projectDir) {
    console.error('Usage: ship-project.js <projectDir> [--dry-run]');
    process.exit(1);
  }

  if (!fs.existsSync(opts.projectDir)) {
    console.error(`Project directory not found: ${opts.projectDir}`);
    process.exit(1);
  }

  const projectName = path.basename(opts.projectDir);

  console.log(`\n🚀 Ship Review — ${projectName}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  if (opts.dryRun) console.log(`Mode: DRY RUN\n`);

  const artifacts    = [];
  const diffSummary  = generateDiffSummary(opts.projectDir);

  // 1. Dockerfile
  const dockerfile = scaffoldDockerfile(opts.projectDir);
  if (dockerfile) {
    artifacts.push(`Dockerfile created: ${dockerfile}`);
    console.log(`   ✓ Dockerfile scaffolded`);
  } else {
    console.log(`   ✓ Dockerfile already exists`);
  }

  const dockerignore = scaffoldDockerignore(opts.projectDir);
  if (dockerignore) artifacts.push(`.dockerignore created: ${dockerignore}`);

  // 2. GitHub Actions CI
  const ci = scaffoldCI(opts.projectDir);
  if (ci) {
    artifacts.push(`CI workflow created: ${ci}`);
    console.log(`   ✓ GitHub Actions CI scaffolded`);
  } else {
    console.log(`   ✓ CI workflow already exists`);
  }

  // 3. Post-build Vault record
  if (!opts.dryRun) {
    const record = writeVaultRecord(opts.projectDir, diffSummary);
    artifacts.push(`Vault build record: ${record}`);
    console.log(`   ✓ Vault build record written`);

    // 4. Session summary
    const summary = writeSessionSummary(opts.projectDir);
    artifacts.push(`Session summary: ${summary}`);
    console.log(`   ✓ Session summary written`);

    // 5. Registry update
    const updated = updateRegistry(projectName);
    if (updated) {
      artifacts.push(`Registry.md → status: shipped`);
      console.log(`   ✓ Registry.md updated to "shipped"`);
    } else {
      console.log(`   ⚠ Registry.md not updated (project not found — update manually)`);
    }
  }

  // 6. Review report
  const report = writeReviewReport(opts.projectDir, artifacts, opts.dryRun, diffSummary);
  console.log(`\n📋 Ship review report: ${report}`);

  if (!opts.dryRun) {
    // 7. Final git checkpoint — stage only files this script created, use spawnSync
    // to pass the commit message as an array arg and avoid shell quoting issues.
    const shipFiles = ['Dockerfile', '.dockerignore', '.github', 'Vault', '.claude/reviews'];
    const addResult = spawnSync('git', ['add', '--', ...shipFiles], {
      cwd: opts.projectDir, stdio: 'pipe',
    });
    const commitResult = spawnSync('git', [
      'commit', '-m', `[ship] ${projectName}: add Dockerfile, CI, Vault record`,
    ], { cwd: opts.projectDir, stdio: 'pipe' });

    if (commitResult.status === 0) {
      console.log(`\n   ✅ Final ship checkpoint committed`);
    } else {
      console.log(`\n   ✓ Nothing new to commit for ship checkpoint`);
    }
  }

  console.log(`\n✅ ${opts.dryRun ? 'Ship review complete (dry run)' : `${projectName} shipped!`}`);
  console.log(`\nFill in the decision log in: ${report}\n`);
}

main().catch(err => {
  console.error(`❌ Ship failed: ${err.message}`);
  process.exit(1);
});
