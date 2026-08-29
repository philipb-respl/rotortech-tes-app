// Metro config for an npm-workspaces monorepo (apps/mobile inside the
// rotortech-tes repo root) — Metro only looks at node_modules between the
// project root and the filesystem root by default, so it needs pointing
// at the workspace root explicitly to resolve @rotortech-tes/shared and
// the hoisted dependencies there. Standard Expo monorepo setup.
const { getDefaultConfig } = require('expo/metro-config');
const path = require('node:path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];
// Force Metro to use the root copy of a package instead of resolving a
// second nested copy — avoids duplicate-React-instance style bugs when a
// dependency is hoisted to the workspace root.
config.resolver.disableHierarchicalLookup = true;

module.exports = config;
