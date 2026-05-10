#!/usr/bin/env node

/**
 * Automated CHANGELOG.md updater based on Conventional Commits.
 *
 * Reads git log since the last tag and groups commits by type:
 *   feat:     → Added
 *   fix:      → Fixed
 *   perf:     → Performance
 *   docs:     → Documentation
 *   refactor: → Changed
 *   BREAKING CHANGE / ! → Breaking Changes
 *   other     → Other
 *
 * Usage:
 *   node scripts/update-changelog.js              # auto-detect version from package.json
 *   node scripts/update-changelog.js --version 0.2.0
 *   node scripts/update-changelog.js --dry-run    # preview without writing
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ── CLI args ────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const versionIdx = args.indexOf('--version');
const explicitVersion = versionIdx !== -1 ? args[versionIdx + 1] : null;

// ── Resolve version ─────────────────────────────────────────────────────
const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf-8'));
const version = explicitVersion || pkg.version;
const today = new Date().toISOString().split('T')[0];

// ── Find last tag ───────────────────────────────────────────────────────
let lastTag = '';
try {
  lastTag = execSync('git describe --tags --abbrev=0 2>/dev/null', { encoding: 'utf-8' }).trim();
} catch {
  // No tags yet — use all commits
}

const range = lastTag ? `${lastTag}..HEAD` : 'HEAD';
console.log(`📋 Generating changelog for v${version} (commits: ${range})`);

// ── Read commits ────────────────────────────────────────────────────────
let rawLog = '';
try {
  rawLog = execSync(`git log ${range} --pretty=format:"%s|||%h|||%an" --no-merges`, {
    encoding: 'utf-8',
  }).trim();
} catch {
  console.log('⚠️  No commits found');
  process.exit(0);
}

if (!rawLog) {
  console.log('⚠️  No new commits since last tag');
  process.exit(0);
}

// ── Parse & group ───────────────────────────────────────────────────────
const TYPES = {
  feat: 'Added',
  fix: 'Fixed',
  perf: 'Performance',
  docs: 'Documentation',
  refactor: 'Changed',
  style: 'Changed',
  test: 'Testing',
  build: 'Build',
  ci: 'CI/CD',
  chore: 'Maintenance',
};

const groups = {};
const breaking = [];

for (const line of rawLog.split('\n')) {
  const [message, hash, author] = line.split('|||');
  if (!message) continue;

  // Check for breaking change indicator
  if (message.includes('BREAKING CHANGE') || message.match(/^[a-z]+(\(.+\))?!:/)) {
    breaking.push({ message: message.replace(/^[a-z]+(\(.+\))?!:\s*/, ''), hash, author });
  }

  // Parse conventional commit: type(scope): description
  const match = message.match(/^([a-z]+)(\(.+?\))?!?:\s*(.+)/);
  if (match) {
    const [, type, , desc] = match;
    const category = TYPES[type] || 'Other';
    if (!groups[category]) groups[category] = [];
    groups[category].push({ message: desc, hash, author });
  } else {
    if (!groups['Other']) groups['Other'] = [];
    groups['Other'].push({ message, hash, author });
  }
}

// ── Generate markdown ───────────────────────────────────────────────────
const repoUrl = 'https://github.com/Obi811/projection-mapper-app';
let section = `## [${version}] - ${today}\n`;

if (breaking.length > 0) {
  section += '\n### ⚠️ Breaking Changes\n';
  for (const { message, hash } of breaking) {
    section += `- ${message} ([${hash}](${repoUrl}/commit/${hash}))\n`;
  }
}

// Order: Added, Fixed, Changed, Performance, then the rest
const order = ['Added', 'Fixed', 'Changed', 'Performance', 'Documentation', 'Testing', 'CI/CD', 'Build', 'Maintenance', 'Other'];

for (const category of order) {
  if (!groups[category]) continue;
  section += `\n### ${category}\n`;
  for (const { message, hash } of groups[category]) {
    section += `- ${message} ([${hash}](${repoUrl}/commit/${hash}))\n`;
  }
}

// ── Output ──────────────────────────────────────────────────────────────
if (dryRun) {
  console.log('\n--- DRY RUN ---\n');
  console.log(section);
  process.exit(0);
}

// ── Write to CHANGELOG.md ───────────────────────────────────────────────
const changelogPath = path.join(__dirname, '..', 'CHANGELOG.md');
let existing = '';

if (fs.existsSync(changelogPath)) {
  existing = fs.readFileSync(changelogPath, 'utf-8');
}

// Insert new section after the header
const header = '# Changelog\n\nAll notable changes to this project will be documented in this file.\n\nThe format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),\nand this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).';

let updated;
if (existing.includes('## [')) {
  // Insert before the first version section
  updated = existing.replace(/^(## \[)/, `${section}\n$1`);
} else {
  updated = `${header}\n\n${section}\n`;
}

// Add version link at the bottom
const linkLine = `[${version}]: ${repoUrl}/releases/tag/v${version}`;
if (!updated.includes(linkLine)) {
  updated = updated.trimEnd() + '\n' + linkLine + '\n';
}

fs.writeFileSync(changelogPath, updated);
console.log(`✅ CHANGELOG.md updated with v${version}`);
