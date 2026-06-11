#!/usr/bin/env node
'use strict';

/**
 * fix-requirements
 *
 * Validates that all deps in a requirements.txt are installable under the
 * current Python version, then auto-resolves any incompatible pinned versions
 * to the latest compatible version.
 *
 * Usage:
 *   node fix-requirements.js [path/to/requirements.txt]
 *   npm run fix-requirements [-- path/to/requirements.txt]
 *
 * Requires: pip >= 22.1 (ships with Python 3.11+)
 */

const { spawnSync } = require('child_process');
const fs   = require('fs');
const path = require('path');

// ── Resolve requirements file ──────────────────────────────────────────────────

const reqFile = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.resolve('requirements.txt');

if (!fs.existsSync(reqFile)) {
  console.error(`❌ File not found: ${reqFile}`);
  console.error(`   Usage: node fix-requirements.js path/to/requirements.txt`);
  process.exit(1);
}

// ── pip helpers ────────────────────────────────────────────────────────────────

function findPython() {
  for (const bin of ['python', 'python3', 'python3.11', 'python3.12', 'python3.13']) {
    const r = spawnSync(bin, ['--version'], { encoding: 'utf8' });
    if (r.status === 0) return bin;
  }
  throw new Error('Python not found in PATH. Ensure Python is installed and on PATH.');
}

const PYTHON = findPython();

function pip(args) {
  return spawnSync(PYTHON, ['-m', 'pip', ...args], { encoding: 'utf8' });
}

function getPythonVersion() {
  const r = spawnSync(PYTHON, ['--version'], { encoding: 'utf8' });
  return (r.stdout || r.stderr || '').trim();
}

// ── Dry-run validation ─────────────────────────────────────────────────────────

function validateRequirements(file) {
  const r = pip(['install', '--dry-run', '-r', file]);
  return {
    ok:     r.status === 0,
    stdout: r.stdout || '',
    stderr: r.stderr || '',
  };
}

// ── Parse failures from pip stderr ────────────────────────────────────────────

function parseFailingSpecs(stderr) {
  const specs = new Set();

  // "Could not find a version that satisfies the requirement foo==1.2.3"
  const re = /satisfies the requirement ([^\s(]+)/g;
  let m;
  while ((m = re.exec(stderr)) !== null) {
    specs.add(m[1]); // e.g. "pyinstaller==6.11.1"
  }

  // "No matching distribution found for foo==1.2.3"
  const re2 = /No matching distribution found for ([^\s]+)/g;
  while ((m = re2.exec(stderr)) !== null) {
    specs.add(m[1]);
  }

  return [...specs];
}

// ── Resolve latest installable version for a package name ────────────────────

function resolveLatestVersion(pkgName) {
  // Strategy 1: dry-run install with no version constraint → pip picks latest compatible
  const r = pip(['install', '--dry-run', '--quiet', pkgName]);
  const out = (r.stdout || '') + (r.stderr || '');

  // "Would install pyinstaller-6.15.0"
  const norm = pkgName.toLowerCase().replace(/[_.-]+/g, '[_.-]');
  const re   = new RegExp(`would install (?:[^\\s]*?[-/ ])?${norm}[^\\s]*?-(\\d[\\d.]*)`, 'i');
  const m    = out.match(re);
  if (m) return m[1];

  // "Requirement already satisfied: pyinstaller in ..."  → show what's installed
  if (/requirement already satisfied/i.test(out)) {
    const r2 = pip(['show', pkgName]);
    const m2 = (r2.stdout || '').match(/Version:\s*([^\n]+)/);
    if (m2) return m2[1].trim();
  }

  // Strategy 2: pip index versions (lists versions compatible with current Python)
  const r3  = pip(['index', 'versions', pkgName]);
  const out3 = (r3.stdout || '') + (r3.stderr || '');
  const m3   = out3.match(/Available versions:\s*([^\n]+)/);
  if (m3) {
    const versions = m3[1].split(',').map(v => v.trim()).filter(Boolean);
    if (versions.length) return versions[0]; // first entry is latest
  }

  return null;
}

// ── requirements.txt line parser / patcher ────────────────────────────────────

// Returns { name, specifier } or null for blank/comment/option lines
function parseLine(line) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('-')) return null;
  const m = trimmed.match(/^([A-Za-z0-9._-]+)(\[.*?\])?\s*([=<>!~][^\s;#]*)?/);
  if (!m) return null;
  return { name: m[1], extras: m[2] || '', specifier: m[3] || '' };
}

// Patch a single line to use the new version, preserving comments/whitespace
function patchLine(line, newVersion) {
  return line.replace(
    /^([A-Za-z0-9._-]+(?:\[.*?\])?)\s*[=<>!~][^\s;#]*/,
    `$1==${newVersion}`
  );
}

// Normalize package name for comparison (PEP 503)
function normalizeName(name) {
  return name.toLowerCase().replace(/[-_.]+/g, '-');
}

// ── Main ───────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\nfix-requirements`);
  console.log(`  File:   ${reqFile}`);
  console.log(`  Python: ${getPythonVersion()}\n`);

  // First: validate as-is
  const { ok, stderr } = validateRequirements(reqFile);

  if (ok) {
    console.log('✅ All dependencies are compatible with the current Python version.\n');
    return;
  }

  console.log('⚠  Incompatibilities detected. Resolving...\n');

  const failingSpecs = parseFailingSpecs(stderr);

  if (failingSpecs.length === 0) {
    console.error('❌ pip reported an error but no failing packages could be identified.\n');
    console.error('   Raw pip output:\n');
    console.error(stderr);
    process.exit(1);
  }

  // Resolve a latest version for each failing spec
  const fixes = {}; // normalizedName → newVersion

  for (const spec of failingSpecs) {
    const nameMatch = spec.match(/^([A-Za-z0-9._-]+)/);
    if (!nameMatch) continue;
    const name = nameMatch[1];
    const key  = normalizeName(name);

    process.stdout.write(`  ${name} → `);
    const latest = resolveLatestVersion(name);

    if (latest) {
      console.log(latest);
      fixes[key] = latest;
    } else {
      console.log('could not resolve (manual fix required)');
    }
  }

  if (Object.keys(fixes).length === 0) {
    console.error('\n❌ No packages could be auto-resolved. Manual fixes required.');
    process.exit(1);
  }

  // Apply fixes to file lines
  const rawLines = fs.readFileSync(reqFile, 'utf8').split('\n');

  const updatedLines = rawLines.map(line => {
    const parsed = parseLine(line);
    if (!parsed) return line;
    const key     = normalizeName(parsed.name);
    const version = fixes[key];
    if (!version) return line;
    return patchLine(line, version);
  });

  // Back up original, write patched file
  const bakPath = reqFile + '.bak';
  fs.writeFileSync(bakPath, rawLines.join('\n'));
  fs.writeFileSync(reqFile, updatedLines.join('\n'));

  console.log(`\n✅ Patched ${Object.keys(fixes).length} package(s).`);
  console.log(`   Original backed up to: ${bakPath}\n`);

  // Re-validate
  console.log('Verifying patched requirements...\n');
  const { ok: ok2, stderr: stderr2 } = validateRequirements(reqFile);

  if (ok2) {
    console.log('✅ All dependencies are now compatible.\n');
  } else {
    const remaining = parseFailingSpecs(stderr2);
    if (remaining.length > 0) {
      console.log(`⚠  ${remaining.length} package(s) still unresolved (manual fix required):\n`);
      remaining.forEach(s => console.log(`   - ${s}`));
      console.log('');
    } else {
      console.log('⚠  pip still reports an issue (may be a transitive dependency):\n');
      console.log(stderr2);
    }
  }
}

main().catch(err => {
  console.error(`\n❌ fix-requirements failed: ${err.message}`);
  process.exit(1);
});
