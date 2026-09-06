const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const root = path.resolve(__dirname, '..');

const config = getDefaultConfig(__dirname);

// The library source lives one directory up and is aliased to `rn-story` by
// babel.config.js, so Metro has to watch the whole repository.
config.watchFolders = [root];

// Every import — including those made by the library source — must resolve
// to the example's own node_modules, never to the copies the repository root
// installs for the library's tests, otherwise two React or expo-modules-core
// instances end up in one bundle.
config.resolver.nodeModulesPaths = [path.join(__dirname, 'node_modules')];
config.resolver.disableHierarchicalLookup = true;

module.exports = config;
