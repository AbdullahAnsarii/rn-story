/* eslint-env jest */

// expo-av pulls in native modules that do not exist under jest, so stand in a
// plain View that still forwards the props the component drives it with.
jest.mock('expo-av', () => {
  const React = require('react');
  const { View } = require('react-native');

  return {
    ResizeMode: {
      CONTAIN: 'contain',
      COVER: 'cover',
      STRETCH: 'stretch',
    },
    Video: (props) => React.createElement(View, props),
  };
});
