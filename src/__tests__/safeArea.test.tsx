import * as React from 'react';
import { render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import Stories from '../index';

// The library picks up react-native-safe-area-context when the app has it.
// It is not installed here, so stand in a virtual module; the mock is hoisted
// above the imports and therefore in place when Stories first requires it.
jest.mock(
  'react-native-safe-area-context',
  () => {
    const ReactModule = require('react');
    const { View } = require('react-native');
    const insets = { top: 59, bottom: 34, left: 0, right: 0 };
    const SafeAreaInsetsContext = ReactModule.createContext(null);
    return {
      SafeAreaInsetsContext,
      initialWindowMetrics: {
        insets,
        frame: { x: 0, y: 0, width: 0, height: 0 },
      },
      SafeAreaProvider: (props: { children?: React.ReactNode }) =>
        ReactModule.createElement(
          SafeAreaInsetsContext.Provider,
          { value: insets },
          ReactModule.createElement(
            View,
            { testID: 'provider' },
            props.children
          )
        ),
    };
  },
  { virtual: true }
);

const paddingOf = (testID: string) =>
  StyleSheet.flatten(screen.getByTestId(testID).props.style);

describe('with react-native-safe-area-context installed', () => {
  it('pads the top and bottom edges with the insets of its own provider', () => {
    render(
      <Stories
        stories={[
          {
            media: 'https://example.com/1.jpg',
            mediaType: 'image',
            seeMoreUrl: 'https://example.com',
          },
        ]}
      />
    );
    expect(screen.getByTestId('provider')).toBeTruthy();
    expect(paddingOf('rn-story-top').paddingTop).toBe(59);
    expect(paddingOf('rn-story-bottom').paddingBottom).toBe(34);
  });

  it('prefers explicit insets when they are given', () => {
    render(
      <Stories
        stories={[{ media: 'https://example.com/1.jpg', mediaType: 'image' }]}
        safeAreaInsets={{ top: 10 }}
      />
    );
    expect(paddingOf('rn-story-top').paddingTop).toBe(10);
  });
});
