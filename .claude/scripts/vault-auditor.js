#!/usr/bin/env node
/**
 * Vault Auditor — Phase 17.6
 *
 * Three deterministic health checks:
 *   1. Stale docs — last_updated frontmatter > 30 days ago
 *   2. Known-Problems missing status field
 *   3. ADRs not referenced by any Fact in Vault/11-Facts/
 *
 * CLI:
 *   node vault-auditor.js [--no-write] [--stale-days 60]
 */

const fs   = require('fs');
const path = require('path');

const DEFAULT_VAULT_DIR  = path.resolve(__dirname, '..', '..', 'Vault');
const DEFAULT_LOG_DIR    = path.resolve(__dirname, '..', '..', 'Vault', 'Logs');
const STALE_DAYS_DEFAULT = 30;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  const result = {};
  for (const line of match[1].split('\n')) {
    const m = line.match(/^(\w+):\s*(.+)/);
    if (m) result[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
  }
  return result;
}

function walkMd(dir, results = []) {
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkMd(full, results);
    else if (entry.name.endsWith('.md')) results.push(full);
  }
  return results;
}

// ---------------------------------------------------------------------------
// VaultAuditor class
// ---------------------------------------------------------------------------

class VaultAuditor {
  constructor(vaultDir = DEFAULT_VAULT_DIR, staleDays = STALE_DAYS_DEFAULT) {
    this.vaultDir  = vaultDir;
    this.staleDays = staleDays;
  }

  checkStaleDocs(now = new Date()) {
    const cutoff = new Date(now - this.staleDays * 24 * 60 * 60 * 1000);
    const stale  = [];

    for (const file of walkMd(this.vaultDir)) {
      try {
        const fm = parseFrontmatter(fs.readFileSync(file, 'utf8'));
        if (!fm.last_updated) continue;
        const updated = new Date(fm.last_updated);
        if (isNaN(updated.getTime())) continue;
        if (updated < cutoff) stale.push(path.relative(this.vaultDir, file).replace(/\\/g, '/'));
      } catch { /* skip unreadable */ }
    }
    return stale;
  }

  checkMissingStatus() {
    const problemsDir = path.join(this.vaultDir, '10-Known-Problems');
    const missing = [];
    if (!fs.existsSync(problemsDir)) return missing;

    for (const file of fs.readdirSync(problemsDir).filter(f => f.endsWith('.md'))) {
      try {
        const fm = parseFrontmatter(fs.readFileSync(path.join(problemsDir, file), 'utf8'));
        if (!fm.status) missing.push(`10-Known-Problems/${file}`);
      } catch { /* skip */ }
    }
    return missing;
  }

  checkUnreferencedAdrs() {
    const adrDir   = path.join(this.vaultDir, '07-Decisions');
    const factsDir = path.join(this.vaultDir, '11-Facts');
    if (!fs.existsSync(adrDir)) return [];

    let factsContent = '';
    if (fs.existsSync(factsDir)) {
      for (const f of walkMd(factsDir)) {
        try { factsContent += fs.readFileSync(f, 'utf8') + '\n'; } catch {}
      }
    }

    const unreferenced = [];
    for (const file of fs.readdirSync(adrDir).filter(f => f.endsWith('.md'))) {
      const basename = file.replace(/\.md$/, '');
      if (!factsContent.includes(basename)) unreferenced.push(basename);
    }
    return unreferenced;
  }

  run(now = new Date()) {
    return {
      staleDocs:        this.checkStaleDocs(now),
      missingStatus:    this.checkMissingStatus(),
      unreferencedAdrs: this.checkUnreferencedAdrs(),
    };
  }

  formatReport(report, date) {
    const d     = date.toISOString().slice(0, 10);
    const icon  = n => n === 0 ? '✅' : '⚠️';
    const lines = [`# Vault Health Report — ${d}\n`];

    lines.push(`## Summary`);
    lines.push(`${icon(report.staleDocs.length)}        Check 1: Stale Docs (>${this.staleDays} days) — ${report.staleDocs.length} flagged`);
    lines.push(`${icon(report.missingStatus.length)}        Check 2: Known-Problems missing status — ${report.missingStatus.length} flagged`);
    lines.push(`${icon(report.unreferencedAdrs.length)}        Check 3: Unreferenced ADRs — ${report.unreferencedAdrs.length} flagged\n`);

    lines.push(`## Check 1: Stale Documents`);
    if (report.staleDocs.length === 0) {
      lines.push('No stale documents found.\n');
    } else {
      lines.push(`The following documents have not been updated in >${this.staleDays} days:\n`);
      report.staleDocs.forEach(f => lines.push(`- ${f}`));
      lines.push('');
    }

    lines.push(`## Check 2: Known-Problems Missing Status`);
    if (report.missingStatus.length === 0) {
      lines.push('All Known-Problem files have a status field.\n');
    } else {
      lines.push('The following files are missing a `status:` frontmatter field:\n');
      report.missingStatus.forEach(f => lines.push(`- ${f}`));
      lines.push('');
    }

    lines.push(`## Check 3: Unreferenced ADRs`);
    if (report.unreferencedAdrs.length === 0) {
      lines.push('All ADRs are referenced by at least one Fact.\n');
    } else {
      lines.push('The following ADRs are not referenced by any file in `Vault/11-Facts/`:\n');
      report.unreferencedAdrs.forEach(f => lines.push(`- ${f}`));
      lines.push('');
    }

    return lines.join('\n');
  }

  audit({ write = true, logDir = DEFAULT_LOG_DIR } = {}) {
    const now    = new Date();
    const report = this.run(now);
    const md     = this.formatReport(report, now);

    if (write) {
      if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
      const outPath = path.join(logDir, `vault-health-${now.toISOString().slice(0, 10)}.md`);
      fs.writeFileSync(outPath, md, 'utf8');
      console.log(`✅ Vault health report written to ${outPath}`);
    } else {
      console.log(md);
    }

    return report;
  }
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

if (require.main === module) {
  const args      = process.argv.slice(2);
  const noWrite   = args.includes('--no-write');
  const staleDays = parseInt(
    (args.find(a => a.startsWith('--stale-days=')) || '').replace('--stale-days=', '') ||
    (args.includes('--stale-days') ? args[args.indexOf('--stale-days') + 1] : '') ||
    String(STALE_DAYS_DEFAULT)
  );

  new VaultAuditor(DEFAULT_VAULT_DIR, staleDays).audit({ write: !noWrite });
}

module.exports = { VaultAuditor };
