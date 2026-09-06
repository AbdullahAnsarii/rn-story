import * as React from 'react';
import { createContext, useContext } from 'react';
import type { ComponentType, Context, ReactNode } from 'react';
import { Platform, SafeAreaView, StatusBar, View } from 'react-native';
import type { StyleProp, ViewProps, ViewStyle } from 'react-native';

type Edge = 'top' | 'bottom';

type Insets = { top: number; bottom: number; left: number; right: number };

type SafeAreaContextModule = {
  SafeAreaProvider: ComponentType<
    ViewProps & { initialMetrics?: unknown; children?: ReactNode }
  >;
  SafeAreaInsetsContext: Context<Insets | null>;
  initialWindowMetrics: unknown;
};

// `react-native-safe-area-context` is an optional peer dependency. When the
// app has it (nearly every Expo and React Navigation app does) it keeps the
// bars, header and See More button clear of notches and of Android's
// edge-to-edge status and navigation bars, which React Native's own
// SafeAreaView — iOS only, and deprecated since 0.81 — cannot do. The require
// sits in a try/catch so bundlers treat the module as optional and apps
// without it still get the built-in fallback.
let safeAreaContext: SafeAreaContextModule | null = null;
try {
  const candidate = require('react-native-safe-area-context');
  if (candidate?.SafeAreaProvider && candidate.SafeAreaInsetsContext) {
    safeAreaContext = candidate;
  }
} catch {
  safeAreaContext = null;
}

/** Whether react-native-safe-area-context is installed in the app. */
export const hasSafeAreaContext = safeAreaContext != null;

// Insets are read from a provider of our own inside the modal: a full screen
// modal is a new window, so the app's provider (if any) cannot describe it,
// and a bare SafeAreaView does not always pick up the insets of a modal that
// is still being presented when it mounts. `initialWindowMetrics` gives the
// first frame the right values before the native side has reported them.
const InsetsContext: Context<Insets | null> =
  safeAreaContext?.SafeAreaInsetsContext ?? createContext<Insets | null>(null);

/** Wraps the viewer's content so that `SafeAreaSlot`s can find their insets. */
export function SafeAreaRoot({ children }: { children: ReactNode }) {
  if (!safeAreaContext) {
    return <>{children}</>;
  }
  const { SafeAreaProvider, initialWindowMetrics } = safeAreaContext;
  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      {children}
    </SafeAreaProvider>
  );
}

type SafeAreaSlotProps = {
  edge: Edge;
  /** An inset given by the caller wins over any automatic detection. */
  inset?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  children?: ReactNode;
};

/**
 * A container pinned to one edge of the screen that keeps its children out of
 * the system's way: by an explicit inset, by react-native-safe-area-context
 * when installed, or by what React Native offers on its own — SafeAreaView on
 * iOS, the status bar height on Android. Touches pass through wherever there
 * is no child to catch them.
 */
export default function SafeAreaSlot({
  edge,
  inset,
  style,
  testID,
  children,
}: SafeAreaSlotProps) {
  const insets = useContext(InsetsContext);

  if (typeof inset !== 'number' && !hasSafeAreaContext) {
    if (Platform.OS !== 'android') {
      return (
        <SafeAreaView style={style} pointerEvents="box-none" testID={testID}>
          {children}
        </SafeAreaView>
      );
    }
  }

  // On Android without react-native-safe-area-context the modal still draws
  // behind the status bar, whose height React Native does report; the
  // navigation bar is left alone in that case.
  const padding =
    inset ??
    (hasSafeAreaContext
      ? insets?.[edge] ?? 0
      : edge === 'top'
      ? StatusBar.currentHeight ?? 0
      : 0);
  return (
    <View
      style={[
        style,
        edge === 'top' ? { paddingTop: padding } : { paddingBottom: padding },
      ]}
      pointerEvents="box-none"
      testID={testID}
    >
      {children}
    </View>
  );
}
