#!/usr/bin/env node

/**
 * Health check for App Builder Framework.
 *
 * Run at any time to verify your local setup is working:
 *   npm run doctor
 *
 * Checks:
 *   - Node.js version ≥ 20
 *   - Docker is running
 *   - Chroma is reachable
 *   - Vault is indexed in Chroma (doc count > 0)
 *   - node_modules are installed
 *   - .env file exists (does NOT print its contents)
 */

const { spawnSync } = require('child_process');
const fs   = require('fs');
const path = require('path');
const http = require('http');

const ROOT = path.resolve(__dirname, '..', '..');

// ── Helpers ───────────────────────────────────────────────────────────────────

function pass(label) { console.log(`  ✓  ${label}`); }
function warn(label, hint) {
  console.log(`  ✗  ${label}`);
  if (hint) console.log(`     ${hint}`);
}

function httpGet(url) {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      let body = '';
      res.on('data', (d) => { body += d; });
      res.on('end', () => resolve({ status: res.statusCode, body }));
    });
    req.on('error', () => resolve({ status: 0, body: '' }));
    req.setTimeout(3000, () => { req.destroy(); resolve({ status: 0, body: '' }); });
  });
}

function runSilent(cmd) {
  return spawnSync(cmd, { shell: true, cwd: ROOT, encoding: 'utf8' });
}

// ── Run checks ────────────────────────────────────────────────────────────────

console.log('\nApp Builder — Health Check\n');

let allGood = true;

// 1. Node version
const [major] = process.versions.node.split('.').map(Number);
if (major >= 20) {
  pass(`Node.js v${process.versions.node} (≥ 20 required)`);
} else {
  warn(`Node.js v${process.versions.node} — need 20+`, 'Install from https://nodejs.org');
  allGood = false;
}

// 2. Docker running
const dockerInfo = runSilent('docker info');
if (dockerInfo.status === 0) {
  pass('Docker is running');
} else {
  warn('Docker is not running', 'Start Docker Desktop then re-run npm run doctor');
  allGood = false;
}

// 3. node_modules
const nodeModules = path.join(ROOT, 'node_modules');
if (fs.existsSync(nodeModules)) {
  pass('node_modules installed');
} else {
  warn('node_modules missing', 'Run: npm install');
  allGood = false;
}

// 4. .env file
const envPath = path.join(ROOT, '.env');
if (fs.existsSync(envPath)) {
  pass('.env file exists');
} else {
  warn('.env file missing', 'Run: cp .env.example .env  then fill in your tokens');
  allGood = false;
}

// Async checks (Chroma requires HTTP)
const CHROMA_HOST = process.env.CHROMA_SERVER_HOST || 'localhost';
const CHROMA_PORT = process.env.CHROMA_SERVER_HTTP_PORT || '8000';
const CHROMA_BASE = `http://${CHROMA_HOST}:${CHROMA_PORT}`;

Promise.all([
  httpGet(`${CHROMA_BASE}/api/v2/heartbeat`),
  httpGet(`${CHROMA_BASE}/api/v2/tenants/default_tenant/databases/default_database/collections`),
]).then(([heartbeat, collections]) => {
  // 5. Chroma reachable
  if (heartbeat.status === 200) {
    pass('Chroma is reachable');
  } else {
    warn('Chroma is not reachable', 'Run: docker-compose up -d chroma');
    allGood = false;
  }

  // 6. Vault indexed
  if (collections.status === 200) {
    let totalDocs = 0;
    try {
      const cols = JSON.parse(collections.body);
      totalDocs = Array.isArray(cols) ? cols.length : 0;
    } catch (_) {}

    if (totalDocs > 0) {
      pass(`Vault indexed in Chroma (${totalDocs} collection(s))`);
    } else {
      warn('Vault not indexed — no Chroma collections found', 'Run: npm run ingest');
      allGood = false;
    }
  } else {
    warn('Could not query Chroma collections', 'Chroma may still be starting up; try again in a moment');
    allGood = false;
  }

  // ── Summary ──────────────────────────────────────────────────────────────────

  console.log('');
  if (allGood) {
    console.log('  All checks passed. Ready to build!');
    console.log('  Run: claude  then  /discover');
  } else {
    console.log('  Some checks failed. Fix the issues above then re-run npm run doctor.');
    console.log('  For a full reset: npm run setup');
    process.exitCode = 1;
  }
  console.log('');
});
