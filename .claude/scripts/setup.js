#!/usr/bin/env node

/**
 * First-time setup bootstrap for App Builder Framework.
 *
 * Run once after cloning:
 *   cp .env.example .env   # fill in GITHUB_PERSONAL_ACCESS_TOKEN
 *   npm run setup
 *
 * What this does (in order):
 *   1. Validates Node ≥ 20
 *   2. Confirms Docker is running
 *   3. Creates local directories that aren't tracked in git
 *   4. Copies .env.example → .env if .env is missing
 *   5. Runs npm install if node_modules is absent
 *   6. Starts the Chroma container via docker-compose
 *   7. Waits for Chroma to become healthy
 *   8. Indexes the Vault into Chroma (npm run ingest)
 */

const { execSync, spawnSync } = require('child_process');
const fs   = require('fs');
const path = require('path');
const http = require('http');

const ROOT = path.resolve(__dirname, '..', '..');

// ── Helpers ───────────────────────────────────────────────────────────────────

function ok(msg)   { console.log(`  ✓ ${msg}`); }
function fail(msg) { console.error(`  ✗ ${msg}`); process.exit(1); }
function info(msg) { console.log(`  → ${msg}`); }
function header(msg) { console.log(`\n${msg}`); }

function run(cmd, opts = {}) {
  return execSync(cmd, { cwd: ROOT, stdio: 'inherit', ...opts });
}

function runSilent(cmd) {
  return spawnSync(cmd, { shell: true, cwd: ROOT, encoding: 'utf8' });
}

function ensureDir(rel) {
  const abs = path.join(ROOT, rel);
  if (!fs.existsSync(abs)) {
    fs.mkdirSync(abs, { recursive: true });
    info(`Created ${rel}/`);
  }
}

function checkChromaHealth(host, port, retries, delayMs) {
  return new Promise((resolve) => {
    let attempts = 0;
    function attempt() {
      attempts++;
      const req = http.get(`http://${host}:${port}/api/v1/heartbeat`, (res) => {
        if (res.statusCode === 200) return resolve(true);
        retry();
      });
      req.on('error', retry);
      req.setTimeout(2000, () => { req.destroy(); retry(); });
    }
    function retry() {
      if (attempts >= retries) return resolve(false);
      setTimeout(attempt, delayMs);
    }
    attempt();
  });
}

// ── Step 1: Node version ──────────────────────────────────────────────────────

header('Step 1: Checking Node.js version');
const [major] = process.versions.node.split('.').map(Number);
if (major < 20) {
  fail(`Node.js 20+ required. You have v${process.versions.node}. Install from https://nodejs.org`);
} else {
  ok(`Node.js v${process.versions.node}`);
}

// ── Step 2: Docker running ────────────────────────────────────────────────────

header('Step 2: Checking Docker');
const dockerCheck = runSilent('docker info');
if (dockerCheck.status !== 0) {
  fail('Docker is not running. Start Docker Desktop and re-run npm run setup.');
} else {
  ok('Docker is running');
}

// ── Step 3: Local directories ─────────────────────────────────────────────────

header('Step 3: Creating local directories (gitignored)');
ensureDir('docker/volumes/chroma');
ensureDir('Projects');
ok('Local directories ready');

// ── Step 4: .env file ─────────────────────────────────────────────────────────

header('Step 4: Environment file');
const envPath        = path.join(ROOT, '.env');
const envExamplePath = path.join(ROOT, '.env.example');

if (fs.existsSync(envPath)) {
  ok('.env already exists');
} else if (fs.existsSync(envExamplePath)) {
  fs.copyFileSync(envExamplePath, envPath);
  info('.env created from .env.example');
  console.log('');
  console.log('  ⚠  Open .env and fill in GITHUB_PERSONAL_ACCESS_TOKEN before continuing.');
  console.log('     Get a token at: https://github.com/settings/tokens');
  console.log('     Then re-run: npm run setup');
  console.log('');
  process.exit(0);
} else {
  fail('.env.example not found — cannot create .env. Check your clone is complete.');
}

// ── Step 5: npm install ───────────────────────────────────────────────────────

header('Step 5: Installing dependencies');
const nodeModules = path.join(ROOT, 'node_modules');
if (fs.existsSync(nodeModules)) {
  ok('node_modules already present');
} else {
  info('Running npm install...');
  run('npm install');
  ok('Dependencies installed');
}

// ── Step 6: Start Chroma ──────────────────────────────────────────────────────

header('Step 6: Starting Chroma (Docker)');
info('Running docker-compose up -d chroma...');
run('docker-compose up -d chroma');
ok('Chroma container started');

// ── Step 7: Wait for Chroma health ────────────────────────────────────────────

header('Step 7: Waiting for Chroma to become healthy');
info('Checking http://localhost:8000/api/v1/heartbeat (up to 15s)...');

const CHROMA_HOST = process.env.CHROMA_SERVER_HOST || 'localhost';
const CHROMA_PORT = parseInt(process.env.CHROMA_SERVER_HTTP_PORT || '8000');

checkChromaHealth(CHROMA_HOST, CHROMA_PORT, 15, 1000).then((healthy) => {
  if (!healthy) {
    fail('Chroma did not become healthy in 15s. Check: docker-compose logs chroma');
  }
  ok('Chroma is healthy');

  // ── Step 8: Ingest Vault ─────────────────────────────────────────────────────

  header('Step 8: Indexing Vault into Chroma');
  info('Running npm run ingest (this may take a minute on first run)...');
  run('npm run ingest');
  ok('Vault indexed');

  // ── Done ──────────────────────────────────────────────────────────────────────

  console.log('');
  console.log('━'.repeat(60));
  console.log('  Setup complete!');
  console.log('');
  console.log('  Next steps:');
  console.log('    1. Run: claude          (open Claude Code)');
  console.log('    2. Run: /discover       (start your project interview)');
  console.log('');
  console.log('  To verify your setup at any time:');
  console.log('    npm run doctor');
  console.log('━'.repeat(60));
  console.log('');
});
