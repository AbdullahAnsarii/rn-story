// `react-native-builder-bob` compiles the published bundle with the classic
// JSX runtime, so tests run against the classic runtime too. That way a missing
// `React` import fails here instead of only in consumers' apps.
module.exports = {
  presets: [
    [
      'module:metro-react-native-babel-preset',
      { useTransformReactJSXExperimental: true },
    ],
  ],
  plugins: [
    [
      '@babel/plugin-transform-react-jsx',
      {
        runtime: 'classic',
      },
    ],
  ],
};
