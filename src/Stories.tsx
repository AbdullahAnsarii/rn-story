// `react-native-builder-bob` compiles JSX with the classic runtime, so the
// published bundle calls `React.createElement` and needs React in scope.
// Importing it explicitly keeps the build working under either JSX runtime.
import * as React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Image,
  Linking,
  Modal,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import type { TextStyle, ViewStyle } from 'react-native';
import { ResizeMode, Video } from 'expo-av';
import type { AVPlaybackStatus } from 'expo-av';
import type { Story } from './types';

/** How long an image story stays on screen when it has no explicit `duration`. */
const DEFAULT_IMAGE_DURATION = 3000;

/**
 * Keeps `index` inside `[0, length - 1]`, falling back to 0 for an empty list
 * or a nonsensical index.
 */
const clampIndex = (index: number, length: number) => {
  if (length <= 0 || !Number.isFinite(index)) {
    return 0;
  }
  return Math.min(Math.max(Math.trunc(index), 0), length - 1);
};

/** Identifies the media a story points at, for comparing two story lists. */
const mediaSignature = (story: Story | undefined) =>
  story ? `${story.mediaType}:${story.media}` : '';

/** A story `duration` is only usable if it is a positive, finite number. */
const usableDuration = (duration: number | undefined) =>
  typeof duration === 'number' && Number.isFinite(duration) && duration > 0
    ? duration
    : undefined;

export type StoriesProps = {
  /**
   * An array of story objects
   * @see https://www.npmjs.com/package/rn-story#story-object
   */
  stories: Story[];
  /**
   * Set the current story index. Updating this after mount jumps to that story.
   * @default 0
   */
  currentIndex?: number;
  /**
   * Callback when the user taps/press to go back to the previous story.
   * Not called when there is no previous story — see `onPreviousFirstStory`.
   */
  onPrevious?: () => void;
  /**
   * Callback when the user taps/press to go back to the previous story but you are on the first story,
   * i.e there are no more stories to go back (suitable for closing story view or update index to show previous profile story)
   */
  onPreviousFirstStory?: () => void;
  /**
   * Callback when the user taps/press to proceed to the next story.
   * Not called when there is no next story — see `onAllStoriesEnd`.
   */
  onNext?: () => void;
  /**
   * Callback when the user taps/press to proceed to next story but you are on the last story,
   *  i.e there are no more stories to go forward (suitable for closing story view or update index to show next story)
   */
  onAllStoriesEnd?: () => void;
  /**
   * Callback for the Android hardware back button. Without it the back button
   * does nothing while the story view is open.
   */
  onClose?: () => void;
  /**
   * Control the volume of video.
   * @default 1.0
   */
  videoVolume?: number;
  /**
   * Switch to mute video.
   * @default false
   */
  isMuted?: boolean;
  /**
   * Switch to changed the shape from rectangular animation bar to rounded.
   * @default true
   */
  isAnimationBarRounded?: boolean;
  /**
   * Modify the height of animation bar @default 2
   */
  animationBarHeight?: number;
  /**
   * Modify the color of animation @default "#fff"
   */
  animationBarColor?: string;
  /**
   * Change the text of **See More** button, *required `seeMoreUrl` to be set is Story Object.
   * @default "View Details"
   */
  seeMoreText?: string;
  /**
   * Override the styles of **See More** button container, *required `seeMoreUrl` to be set is Story Object.
   * @default {}
   */
  seeMoreStyles?: ViewStyle;
  /**
   * Override the styles of **See More** button text, *required `seeMoreUrl` to be set is Story Object.
   * @default {}
   */
  seeMoreTextStyles?: TextStyle;
  /**
   * Override default LoadingComponent with custom loading component
   */
  loadingComponent?: ReactNode;
};

export default function Stories({
  stories,
  currentIndex = 0,
  onPrevious,
  onPreviousFirstStory,
  onNext,
  onAllStoriesEnd,
  onClose,
  videoVolume = 1.0,
  isMuted = false,
  isAnimationBarRounded = true,
  animationBarHeight = 2,
  animationBarColor = '#fff',
  seeMoreText = 'View Details',
  seeMoreStyles,
  seeMoreTextStyles,
  loadingComponent,
}: StoriesProps) {
  const items = useMemo(
    () => (Array.isArray(stories) ? stories : []),
    [stories]
  );
  const total = items.length;

  // A signature of the stories' contents. Parents very often build the array
  // inline, so its identity changes on every render — keying effects off this
  // string means we only reset when the stories themselves actually change.
  const storiesKey = useMemo(
    () => items.map((story) => `${story?.mediaType}:${story?.media}`).join('|'),
    [items]
  );

  // The story that is currently on screen.
  const [current, setCurrent] = useState(() => clampIndex(currentIndex, total));
  // Whether the image/video is still loading, so we can show a loader.
  const [isLoading, setIsLoading] = useState(true);
  // Set while the user long-presses, which pauses both video and progress bar.
  const [isPaused, setIsPaused] = useState(false);
  // Duration reported by the video itself; unknown until it has loaded.
  const [videoDuration, setVideoDuration] = useState<number | undefined>(
    undefined
  );
  // Bumped on every navigation so the progress animation and the media
  // element restart even when the index itself does not change.
  const [restartToken, setRestartToken] = useState(0);

  // Fill of the bar for the story that is playing, animated from 0 to 1.
  const progress = useRef(new Animated.Value(0)).current;
  // Mirror of `progress` so we can resume from where a pause left off.
  const progressValue = useRef(0);
  // Mirror of `current` so navigation stays correct across rapid taps, where
  // several handlers can run before React re-renders.
  const currentRef = useRef(current);
  const hasMounted = useRef(false);
  // The media on screen as of the last committed render, used to tell a real
  // story swap apart from an unrelated edit elsewhere in the list.
  const shownMedia = useRef(mediaSignature(items[current]));

  useEffect(() => {
    const id = progress.addListener(({ value }) => {
      progressValue.current = value;
    });
    return () => progress.removeListener(id);
  }, [progress]);

  const goTo = useCallback(
    (index: number) => {
      currentRef.current = index;
      progressValue.current = 0;
      progress.setValue(0);
      setVideoDuration(undefined);
      setCurrent(index);
      setRestartToken((token) => token + 1);
    },
    [progress]
  );

  // Restart when the caller swaps in a different set of stories, e.g. moving on
  // to the next profile. Without this the component would keep playing the
  // stories it was first given.
  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      return;
    }
    // Appending or editing stories elsewhere in the list must not yank the
    // viewer off whatever is currently playing, so only restart when the story
    // on screen was actually replaced. `shownMedia` still holds the previous
    // render's value here, because the effect that updates it is declared below.
    const nowShowing = mediaSignature(items[currentRef.current]);
    if (nowShowing === shownMedia.current) {
      return;
    }
    goTo(clampIndex(currentIndex, total));
    // `currentIndex` and `total` are read from the render in which the stories
    // changed, which is exactly the pair we want here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storiesKey, goTo]);

  // Let the caller drive the story index from outside.
  useEffect(() => {
    const next = clampIndex(currentIndex, total);
    if (next === currentRef.current) {
      return;
    }
    goTo(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, goTo]);

  const goNext = useCallback(() => {
    if (total === 0) {
      return;
    }
    if (currentRef.current < total - 1) {
      onNext?.();
      goTo(currentRef.current + 1);
    } else {
      onAllStoriesEnd?.();
    }
  }, [total, onNext, onAllStoriesEnd, goTo]);

  const goPrevious = useCallback(() => {
    if (total === 0) {
      return;
    }
    if (currentRef.current > 0) {
      onPrevious?.();
      goTo(currentRef.current - 1);
    } else {
      onPreviousFirstStory?.();
      goTo(0);
    }
  }, [total, onPrevious, onPreviousFirstStory, goTo]);

  // The animation callback fires long after the render that scheduled it, so it
  // reads the handler through a ref instead of capturing a stale copy.
  const goNextRef = useRef(goNext);
  useEffect(() => {
    goNextRef.current = goNext;
  }, [goNext]);

  // Keep the record of what is on screen current. Declared after the effect
  // that reads it, so that one still sees the previous render's value.
  useEffect(() => {
    shownMedia.current = mediaSignature(items[currentRef.current]);
  });

  const activeStory: Story | undefined = items[current];
  const isVideo = activeStory?.mediaType === 'video';
  // A zero or otherwise unusable `duration` falls back rather than stalling the
  // story forever. For video, `undefined` means "wait, the video has not
  // reported its length yet".
  const explicitDuration = usableDuration(activeStory?.duration);
  const storyDuration = isVideo
    ? explicitDuration ?? videoDuration
    : explicitDuration ?? DEFAULT_IMAGE_DURATION;

  // Drive the progress bar from state rather than from one-shot media
  // callbacks, so it also restarts for a repeated media url and picks back up
  // at the right place after a pause.
  useEffect(() => {
    if (total === 0 || isLoading || isPaused) {
      return;
    }
    if (!storyDuration || storyDuration <= 0) {
      return;
    }

    // The bar is already full, so this story has run its course and its
    // completion was dispatched. Re-running the effect (a pause, a late video
    // status update) must not fire `onAllStoriesEnd` a second time.
    if (progressValue.current >= 1) {
      return;
    }

    const remaining = storyDuration * (1 - progressValue.current);
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: remaining,
      easing: Easing.linear,
      useNativeDriver: false,
    });
    animation.start(({ finished }) => {
      if (finished) {
        goNextRef.current();
      }
    });

    return () => animation.stop();
  }, [
    storiesKey,
    current,
    restartToken,
    total,
    isLoading,
    isPaused,
    storyDuration,
    progress,
  ]);

  const handlePlaybackStatusUpdate = useCallback((status: AVPlaybackStatus) => {
    if (!status.isLoaded) {
      if (status.error) {
        // A story that cannot play must not freeze the whole viewer, so fall
        // back to the image duration and move on.
        setIsLoading(false);
        setVideoDuration((duration) => duration ?? DEFAULT_IMAGE_DURATION);
      }
      return;
    }
    // This fires several times a second, so only touch state on real changes.
    setIsLoading((loading) => (loading ? false : loading));
    const reported = status.durationMillis;
    if (typeof reported === 'number' && reported > 0) {
      setVideoDuration((duration) =>
        duration === reported ? duration : reported
      );
    }
  }, []);

  const openSeeMore = useCallback(() => {
    const url = items[currentRef.current]?.seeMoreUrl;
    if (!url) {
      return;
    }
    // Rejects for urls no installed app can handle; swallow it rather than
    // surfacing an unhandled rejection to the app.
    Linking.openURL(url).catch(() => {});
  }, [items]);

  const handleLongPress = useCallback(() => setIsPaused(true), []);
  // `onPressOut` also fires for an ordinary tap. Setting the same value is a
  // no-op in React, so a tap does not disturb the running animation.
  const handlePressOut = useCallback(() => setIsPaused(false), []);
  const handleRequestClose = useCallback(() => onClose?.(), [onClose]);

  const barRadius = isAnimationBarRounded ? animationBarHeight / 2 : 0;
  // Remount the media on every navigation so the load events fire again, even
  // when two consecutive stories point at the same url.
  const mediaKey = `${current}-${restartToken}`;

  // With nothing to show there is no media to load, no bar to fill and no
  // header to close from, so a full screen modal here would simply trap the
  // user. Render the stories once the caller actually has some.
  if (total === 0) {
    return null;
  }

  return (
    <Modal
      animationType="fade"
      transparent={false}
      visible={true}
      onRequestClose={handleRequestClose}
      supportedOrientations={['portrait', 'landscape']}
    >
      <View style={styles.container}>
        <View style={StyleSheet.absoluteFill}>
          {activeStory && isVideo ? (
            <Video
              key={mediaKey}
              source={{ uri: activeStory.media }}
              rate={1.0}
              volume={videoVolume}
              resizeMode={ResizeMode.COVER}
              shouldPlay={!isPaused}
              isMuted={isMuted}
              onReadyForDisplay={() => setIsLoading(false)}
              onLoadStart={() => setIsLoading(true)}
              onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
              style={StyleSheet.absoluteFill}
              testID="rn-story-video"
            />
          ) : null}
          {activeStory && !isVideo ? (
            <Image
              key={mediaKey}
              onLoadStart={() => setIsLoading(true)}
              onLoadEnd={() => setIsLoading(false)}
              source={{ uri: activeStory.media }}
              resizeMode="cover"
              style={StyleSheet.absoluteFill}
              testID="rn-story-image"
            />
          ) : null}
        </View>

        {/* LOADER — sits under the header so the close button stays reachable */}
        {isLoading ? (
          <View style={styles.loadingContainer} testID="rn-story-loading">
            {loadingComponent ?? (
              <ActivityIndicator color="#fff" size="large" />
            )}
          </View>
        ) : null}

        {/* HANDLES FOR PREVIOUS AND NEXT PRESS */}
        <View style={styles.pressRow}>
          <TouchableWithoutFeedback
            onLongPress={handleLongPress}
            delayLongPress={150}
            onPressOut={handlePressOut}
            onPress={goPrevious}
            accessibilityRole="button"
            accessibilityLabel="Previous story"
          >
            <View style={styles.pressZone} testID="rn-story-previous" />
          </TouchableWithoutFeedback>
          <TouchableWithoutFeedback
            onLongPress={handleLongPress}
            delayLongPress={150}
            onPressOut={handlePressOut}
            onPress={goNext}
            accessibilityRole="button"
            accessibilityLabel="Next story"
          >
            <View style={styles.pressZone} testID="rn-story-next" />
          </TouchableWithoutFeedback>
        </View>

        {/* ANIMATION BARS AND HEADER, rendered after the press zones so a
            header button stays tappable above them */}
        <SafeAreaView style={styles.topContainer} pointerEvents="box-none">
          <View style={styles.animationBarsContainer} pointerEvents="box-none">
            {items.map((item, index) => (
              // THE BACKGROUND
              <View
                key={`${index}-${item?.media ?? ''}`}
                testID="rn-story-bar"
                style={[
                  styles.animationBarBackground,
                  { height: animationBarHeight, borderRadius: barRadius },
                ]}
              >
                {/* THE ANIMATION OF THE BAR */}
                <Animated.View
                  style={{
                    flex:
                      index === current ? progress : index < current ? 1 : 0,
                    height: animationBarHeight,
                    backgroundColor: animationBarColor,
                    borderRadius: barRadius,
                  }}
                />
              </View>
            ))}
          </View>
          {activeStory?.header}
        </SafeAreaView>

        {/* SEE MORE COMPONENT */}
        {activeStory?.seeMoreUrl ? (
          <View style={styles.seeMoreContainer} pointerEvents="box-none">
            <Pressable
              onPress={openSeeMore}
              style={[styles.seeMore, seeMoreStyles]}
              accessibilityRole="link"
            >
              <Text style={[styles.seeMoreText, seeMoreTextStyles]}>
                {seeMoreText}
              </Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressRow: {
    flex: 1,
    flexDirection: 'row',
  },
  pressZone: {
    flex: 1,
  },
  topContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
  },
  animationBarsContainer: {
    flexDirection: 'row',
    paddingTop: 8,
    paddingHorizontal: 12,
  },
  animationBarBackground: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(117, 117, 117, 0.5)',
    marginHorizontal: 2,
  },
  seeMoreContainer: {
    position: 'absolute',
    alignItems: 'center',
    left: 0,
    right: 0,
    bottom: 32,
  },
  seeMore: {
    backgroundColor: '#000',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 50,
  },
  seeMoreText: {
    color: '#fff',
  },
});
