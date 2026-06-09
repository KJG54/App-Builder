#!/usr/bin/env node

/**
 * /wrap-up skill implementation
 * Executes the wrap-up workflow: create session summary, stage files, commit, and push
 */

const { execSync } = require('child_process');
const path = require('path');

const projectRoot = process.cwd();
const scriptPath = path.join(projectRoot, '.claude', 'scripts', 'wrap-up.js');

try {
  console.log('🎬 Executing wrap-up workflow...\n');

  // Execute the wrap-up script
  const output = execSync(`node "${scriptPath}"`, {
    cwd: projectRoot,
    encoding: 'utf-8',
    stdio: 'inherit' // Pass through all output directly
  });

  process.exit(0);
} catch (error) {
  console.error('\n❌ Wrap-up failed:', error.message);
  process.exit(1);
}
