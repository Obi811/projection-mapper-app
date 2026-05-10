#!/usr/bin/env node

/**
 * Extract changelog section for a specific version from CHANGELOG.md
 * Usage: node scripts/extract-changelog.js <version>
 * Example: node scripts/extract-changelog.js 0.1.0
 */

const fs = require('fs');
const path = require('path');

const version = process.argv[2];
if (!version) {
  console.error('Usage: node scripts/extract-changelog.js <version>');
  process.exit(1);
}

const changelogPath = path.join(__dirname, '..', 'CHANGELOG.md');

if (!fs.existsSync(changelogPath)) {
  console.log(`Release ${version}`);
  process.exit(0);
}

const content = fs.readFileSync(changelogPath, 'utf-8');
const lines = content.split('\n');

let capturing = false;
let result = [];

for (const line of lines) {
  // Match version header: ## [0.1.0] or ## [0.1.0] - 2026-05-10
  if (line.match(/^## \[/)) {
    if (capturing) {
      // We hit the next version section — stop
      break;
    }
    if (line.includes(`[${version}]`)) {
      capturing = true;
      continue; // skip the header itself
    }
  } else if (capturing) {
    result.push(line);
  }
}

const output = result.join('\n').trim();
console.log(output || `Release ${version}`);
