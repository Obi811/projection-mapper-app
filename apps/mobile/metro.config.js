// Metro configuration for the Expo app inside the npm-workspaces monorepo.
// It teaches Metro to watch the repo root so the shared package can be bundled.
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// 1. Watch all files in the monorepo so changes in packages/shared hot-reload.
config.watchFolders = [monorepoRoot];

// 2. Resolve modules from both the app and the hoisted root node_modules.
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// 3. Map the shared workspace package directly to its TypeScript source so the
//    app and the type-checker consume exactly the same code.
config.resolver.extraNodeModules = {
  '@projection-mapper/shared': path.resolve(monorepoRoot, 'packages/shared/src'),
};

// 4. Allow Metro to follow symlinked workspace packages.
config.resolver.disableHierarchicalLookup = false;

module.exports = config;
