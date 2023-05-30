import * as React from 'react';

import { StyleSheet, View, Text } from 'react-native';
import StoryView from 'rn-story';

export default function App() {
  const [result, setResult] = React.useState<number | undefined>();



  return (
    <StoryView />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  box: {
    width: 60,
    height: 60,
    marginVertical: 20,
  },
});
