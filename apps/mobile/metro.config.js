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
// Deliberately NOT setting resolver.disableHierarchicalLookup: it restricts
// resolution to exactly nodeModulesPaths above, which breaks any package
// npm nested inside another package's own node_modules to resolve a
// version conflict (e.g. apps/mobile/node_modules/expo/node_modules/
// expo-modules-core) — a real, working install layout, not a bug to route
// around. Standard Node hierarchical lookup already finds those; the
// nodeModulesPaths addition above only needs to extend that search up to
// the workspace root for @rotortech-tes/shared, not replace it.

module.exports = config;
