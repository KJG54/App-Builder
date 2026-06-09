#!/usr/bin/env node

/**
 * Vault Document Validator
 *
 * Enforces YAML frontmatter on all Vault documents.
 * Required fields: type, status, last_updated
 * Optional fields: component, tags, author
 *
 * Auto-migrates old docs by prepending default frontmatter.
 */

const fs = require('fs');
const path = require('path');

// Simple YAML frontmatter parser (no dependencies)
function parseYaml(yamlStr) {
  const obj = {};
  const lines = yamlStr.trim().split('\n');
  for (const line of lines) {
    const match = line.match(/^(\w+):\s*(.+)$/);
    if (match) {
      let value = match[2].trim();
      // Remove quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      // Parse arrays [a, b, c]
      if (value.startsWith('[') && value.endsWith(']')) {
        value = value.slice(1, -1).split(',').map(v => v.trim());
      }
      obj[match[1]] = value;
    }
  }
  return obj;
}

// ============================================================================
// Validation Rules
// ============================================================================

const REQUIRED_FIELDS = ['type', 'status', 'last_updated'];
const OPTIONAL_FIELDS = ['component', 'tags', 'author'];

const VALID_TYPES = ['spec', 'log', 'architecture', 'guide', 'decision', 'retrospective'];
const VALID_STATUSES = ['draft', 'active', 'deprecated', 'review'];

const DEFAULT_FRONTMATTER = {
  type: 'guide',
  status: 'active',
  last_updated: new Date().toISOString().split('T')[0],
  author: 'Claude-Builder-Agent'
};

// ============================================================================
// Frontmatter Parser & Validator
// ============================================================================

class VaultValidator {
  constructor(vaultPath) {
    this.vaultPath = vaultPath;
    this.validationErrors = [];
  }

  /**
   * Parse YAML frontmatter from markdown content
   * @param {string} content - Markdown file content
   * @returns {object} { frontmatter, body, hasFrontmatter }
   */
  parseFrontmatter(content) {
    const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
    const match = content.match(frontmatterRegex);

    if (!match) {
      return {
        frontmatter: null,
        body: content,
        hasFrontmatter: false
      };
    }

    try {
      const fm = parseYaml(match[1]) || {};
      return {
        frontmatter: fm,
        body: match[2],
        hasFrontmatter: true
      };
    } catch (error) {
      throw new Error(`[Validator] Failed to parse YAML frontmatter: ${error.message}`);
    }
  }

  /**
   * Validate frontmatter structure and required fields
   * @param {object} frontmatter - Parsed frontmatter
   * @returns {object} { isValid, errors }
   */
  validateFrontmatter(frontmatter) {
    const errors = [];

    if (!frontmatter) {
      return { isValid: false, errors: ['No frontmatter found'] };
    }

    // Check required fields
    REQUIRED_FIELDS.forEach(field => {
      if (!frontmatter[field]) {
        errors.push(`Missing required field: ${field}`);
      }
    });

    // Validate type
    if (frontmatter.type && !VALID_TYPES.includes(frontmatter.type)) {
      errors.push(`Invalid type: "${frontmatter.type}". Must be one of: ${VALID_TYPES.join(', ')}`);
    }

    // Validate status
    if (frontmatter.status && !VALID_STATUSES.includes(frontmatter.status)) {
      errors.push(`Invalid status: "${frontmatter.status}". Must be one of: ${VALID_STATUSES.join(', ')}`);
    }

    // Validate last_updated format (YYYY-MM-DD)
    if (frontmatter.last_updated) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(frontmatter.last_updated)) {
        errors.push(`Invalid last_updated format: "${frontmatter.last_updated}". Must be YYYY-MM-DD`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Generate default frontmatter
   * @param {object} overrides - Override default fields
   * @returns {string} YAML frontmatter string
   */
  generateFrontmatter(overrides = {}) {
    const fm = { ...DEFAULT_FRONTMATTER, ...overrides };
    const yamlLines = Object.entries(fm).map(([key, value]) => {
      if (typeof value === 'string') {
        return `${key}: ${value}`;
      } else if (Array.isArray(value)) {
        return `${key}: [${value.join(', ')}]`;
      } else {
        return `${key}: ${value}`;
      }
    });
    return `---\n${yamlLines.join('\n')}\n---`;
  }

  /**
   * Auto-migrate document by prepending frontmatter
   * @param {string} content - Markdown content without frontmatter
   * @param {object} guessedFrontmatter - Try to guess type/status from filename
   * @returns {string} Content with prepended frontmatter
   */
  autoMigrate(content, guessedFrontmatter = {}) {
    const fm = { ...DEFAULT_FRONTMATTER, ...guessedFrontmatter };
    const frontmatterStr = this.generateFrontmatter(fm);
    return `${frontmatterStr}\n\n${content}`;
  }

  /**
   * Validate a single markdown file
   * @param {string} filePath - Path to markdown file
   * @param {boolean} autoMigrate - If true, auto-prepend frontmatter if missing
   * @returns {object} { isValid, hasFrontmatter, errors, migratedContent }
   */
  validateFile(filePath, autoMigrate = true) {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const parsed = this.parseFrontmatter(content);

    if (!parsed.hasFrontmatter) {
      if (autoMigrate) {
        const migratedContent = this.autoMigrate(content);
        return {
          isValid: true,
          hasFrontmatter: false,
          migrated: true,
          migratedContent,
          errors: ['No frontmatter found; auto-migrated with defaults']
        };
      } else {
        return {
          isValid: false,
          hasFrontmatter: false,
          errors: ['No frontmatter found. Add manually or use autoMigrate=true']
        };
      }
    }

    const validation = this.validateFrontmatter(parsed.frontmatter);
    return {
      isValid: validation.isValid,
      hasFrontmatter: true,
      migrated: false,
      errors: validation.errors
    };
  }

  /**
   * Validate all markdown files in Vault directory
   * @param {boolean} autoMigrate - Auto-migrate files without frontmatter
   * @returns {object} { totalFiles, validFiles, migratedFiles, invalidFiles, summary }
   */
  validateVault(autoMigrate = true) {
    const results = {
      totalFiles: 0,
      validFiles: 0,
      migratedFiles: 0,
      invalidFiles: 0,
      errors: [],
      summary: {}
    };

    // Recursively find all .md files
    const walkDir = (dir) => {
      const files = fs.readdirSync(dir);
      files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
          // Skip hidden directories and node_modules
          if (!file.startsWith('.') && file !== 'node_modules') {
            walkDir(filePath);
          }
        } else if (file.endsWith('.md')) {
          results.totalFiles++;
          try {
            const validation = this.validateFile(filePath, autoMigrate);

            if (validation.isValid) {
              results.validFiles++;
              if (validation.migrated) {
                results.migratedFiles++;
                fs.writeFileSync(filePath, validation.migratedContent, 'utf8');
                console.log(`[Validator] ✓ Auto-migrated: ${filePath}`);
              }
            } else {
              results.invalidFiles++;
              results.errors.push({
                file: filePath,
                errors: validation.errors
              });
              console.warn(`[Validator] ✗ Invalid: ${filePath}`);
              validation.errors.forEach(e => console.warn(`   - ${e}`));
            }
          } catch (error) {
            results.invalidFiles++;
            results.errors.push({
              file: filePath,
              error: error.message
            });
            console.error(`[Validator] ✗ Error validating ${filePath}:`, error.message);
          }
        }
      });
    };

    walkDir(this.vaultPath);

    results.summary = {
      valid: results.validFiles,
      migrated: results.migratedFiles,
      invalid: results.invalidFiles,
      successRate: ((results.validFiles / results.totalFiles) * 100).toFixed(2) + '%'
    };

    return results;
  }

  /**
   * Print validation summary
   */
  printSummary(results) {
    console.log('\n========== VAULT VALIDATION SUMMARY ==========');
    console.log(`Total Files: ${results.totalFiles}`);
    console.log(`✓ Valid: ${results.validFiles}`);
    console.log(`✓ Migrated: ${results.migratedFiles}`);
    console.log(`✗ Invalid: ${results.invalidFiles}`);
    console.log(`Success Rate: ${results.summary.successRate}`);

    if (results.errors.length > 0) {
      console.log('\nErrors:');
      results.errors.forEach(err => {
        console.log(`  ${err.file}:`);
        if (err.errors) {
          err.errors.forEach(e => console.log(`    - ${e}`));
        } else {
          console.log(`    - ${err.error}`);
        }
      });
    }
    console.log('============================================\n');
  }
}

// ============================================================================
// Exports
// ============================================================================

module.exports = {
  VaultValidator,
  REQUIRED_FIELDS,
  OPTIONAL_FIELDS,
  VALID_TYPES,
  VALID_STATUSES,
  DEFAULT_FRONTMATTER
};

// ============================================================================
// CLI Usage (for testing)
// ============================================================================

if (require.main === module) {
  const vaultPath = process.argv[2] || path.join(process.cwd(), 'Vault');
  const validator = new VaultValidator(vaultPath);

  console.log(`[Validator] Scanning Vault: ${vaultPath}`);
  const results = validator.validateVault(true); // autoMigrate=true
  validator.printSummary(results);
}
