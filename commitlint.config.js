module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Enforce conventional commit types
    'type-enum': [
      2,
      'always',
      [
        'feat',     // New feature
        'fix',      // Bug fix
        'docs',     // Documentation only
        'style',    // Code style (formatting, semicolons, etc.)
        'refactor', // Code refactoring (no feature/fix)
        'perf',     // Performance improvement
        'test',     // Adding/updating tests
        'build',    // Build system or dependencies
        'ci',       // CI/CD configuration
        'chore',    // Maintenance tasks
        'revert',   // Revert a previous commit
      ],
    ],
    // Subject must not be empty
    'subject-empty': [2, 'never'],
    // Type must not be empty
    'type-empty': [2, 'never'],
    // Subject max length
    'subject-max-length': [2, 'always', 100],
    // Header max length
    'header-max-length': [2, 'always', 120],
  },
};
