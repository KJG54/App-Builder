#!/usr/bin/env node

/**
 * Test Runner Wrapper
 *
 * Works around Node.js Windows path resolution issue
 * by requiring modules using relative paths instead of absolute paths
 */

const path = require('path');

// Import validators using relative requires (not absolute paths)
const Phase9Validator = require('./validate-phase-9.js');

try {
  console.log('Starting Phase 9 validation...\n');
  const validator = new Phase9Validator();
  const exitCode = validator.runAll();
  process.exit(exitCode);
} catch (error) {
  console.error('\n❌ FATAL ERROR:', error.message);
  console.error('\nError Details:');
  console.error(error.stack);
  process.exit(1);
}
