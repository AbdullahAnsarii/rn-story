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
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type {
  ImageProps,
  ModalProps,
  StatusBarStyle,
  TextStyle,
  ViewStyle,
} from 'react-native';
import SafeAreaSlot, { SafeAreaRoot, hasSafeAreaContext } from './SafeAreaSlot';
import usePlayers from './usePlayers';
import type { ConfigurePlayer } from './usePlayers';
import VideoStory from './VideoStory';
import type { StoryVideoProps } from './VideoStory';
import type { RenderImageProps, SafeAreaInsets, Story } from './types';

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

// On Android the viewer draws behind the status bar, which the top slot pads
// for, and behind the navigation bar when react-native-safe-area-context is
// there to report its height. Typed loosely: `navigationBarTranslucent` is
// newer than the oldest React Native this compiles against.
const platformModalProps: Record<string, unknown> =
  Platform.OS === 'android'
    ? {
        statusBarTranslucent: true,
        navigationBarTranslucent: hasSafeAreaContext,
      }
    : {};

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
   * Called with the index and story whenever a story starts showing: on
   * mount, on every navigation, and when a new set of stories arrives. Handy
   * for "viewed" tracking and analytics.
   */
  onStoryStart?: (index: number, story: Story) => void;
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
   * Color of the unfilled part of the progress bars.
   * @default "rgba(117, 117, 117, 0.5)"
   */
  animationBarBackgroundColor?: string;
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
   * Called when the built-in **See More** button is pressed, instead of
   * opening `seeMoreUrl` with `Linking` — use it for in-app browsers, bottom
   * sheets, or analytics. Receives the story being viewed.
   */
  onSeeMorePress?: (story: Story) => void;
  /**
   * Replaces the built-in **See More** button entirely. Rendered at the bottom
   * of every story with the story being viewed; return `null` to render
   * nothing for a given story. The returned node owns its own press handling.
   */
  renderSeeMore?: (story: Story) => ReactNode;
  /**
   * Load the next story while the current one plays, so advancing does not
   * flash the loader: the next image is prefetched into React Native's image
   * cache, and the next video gets its own player that buffers ahead of time.
   * @default true
   */
  preloadNext?: boolean;
  /**
   * Override default LoadingComponent with custom loading component
   */
  loadingComponent?: ReactNode;
  /**
   * How long to wait, in milliseconds, for a video to report its duration
   * before falling back to the default story duration, so playback can still
   * auto-advance. Sources that never report one (e.g. live streams) can also
   * set an explicit `duration` on the story instead. The same timeout caps
   * how long the loader can stay up for any story.
   * @default 10000
   */
  videoDurationTimeout?: number;
  /**
   * Extra props for the built-in `Image`, e.g. `blurRadius`, `fadeDuration`
   * or `accessibilityLabel`. The source and load handlers are managed for you.
   */
  imageProps?: Partial<Omit<ImageProps, 'source'>>;
  /**
   * Extra props for expo-video's `VideoView`, e.g. `contentFit: 'contain'`
   * for landscape clips, or `allowsPictureInPicture`. Native controls are off
   * and the video covers the screen unless you say otherwise.
   */
  videoProps?: StoryVideoProps;
  /**
   * Renders image stories with your own component (expo-image,
   * react-native-fast-image, a blurhash placeholder…) instead of the built-in
   * `Image`. Spread the given props onto it so the story fills the screen and
   * the loader and progress bar follow its loading.
   */
  renderImage?: (story: Story, props: RenderImageProps) => ReactNode;
  /**
   * Called with every video player right after it is created — for the story
   * on screen and, when `preloadNext` is on, for the one after it — to set
   * anything expo-video exposes on the player, e.g. `audioMixingMode` or
   * `staysActiveInBackground`. Mute and volume are already applied.
   */
  configurePlayer?: ConfigurePlayer;
  /**
   * Distances to keep the progress bars and header clear of the top of the
   * screen and the See More button clear of the bottom. When not given they
   * come from react-native-safe-area-context if the app has it, and from
   * React Native's SafeAreaView otherwise.
   */
  safeAreaInsets?: SafeAreaInsets;
  /**
   * Extra props for the full screen `Modal` the stories are shown in, e.g.
   * `animationType` or `statusBarTranslucent`.
   */
  modalProps?: Partial<Omit<ModalProps, 'visible' | 'onRequestClose'>>;
  /**
   * Status bar icon style while the viewer is open, restored when it closes.
   * Pass `null` to leave the status bar alone.
   * @default "light-content"
   */
  statusBarStyle?: StatusBarStyle | null;
};

export default function Stories({
  stories,
  currentIndex = 0,
  onPrevious,
  onPreviousFirstStory,
  onNext,
  onAllStoriesEnd,
  onClose,
  onStoryStart,
  videoVolume = 1.0,
  isMuted = false,
  isAnimationBarRounded = true,
  animationBarHeight = 2,
  animationBarColor = '#fff',
  animationBarBackgroundColor = 'rgba(117, 117, 117, 0.5)',
  seeMoreText = 'View Details',
  seeMoreStyles,
  seeMoreTextStyles,
  onSeeMorePress,
  renderSeeMore,
  loadingComponent,
  videoDurationTimeout = 10000,
  preloadNext = true,
  imageProps,
  videoProps,
  renderImage,
  configurePlayer,
  safeAreaInsets,
  modalProps,
  statusBarStyle = 'light-content',
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
  // Set while a playing video has run out of buffer, which holds the bar so
  // it does not run ahead of the picture.
  const [isBuffering, setIsBuffering] = useState(false);
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
  // Mirrors of `current` and `restartToken` so navigation stays correct across
  // rapid taps, where several handlers can run before React re-renders, and
  // so late media events can be matched against the story now on screen.
  const currentRef = useRef(current);
  const restartTokenRef = useRef(restartToken);
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
      restartTokenRef.current += 1;
      progressValue.current = 0;
      progress.setValue(0);
      setVideoDuration(undefined);
      setIsLoading(true);
      setIsBuffering(false);
      setCurrent(index);
      setRestartToken(restartTokenRef.current);
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

  const onStoryStartRef = useRef(onStoryStart);
  useEffect(() => {
    onStoryStartRef.current = onStoryStart;
  }, [onStoryStart]);

  // Every navigation bumps `restartToken`, and so does a swap of the stories,
  // so this fires exactly once per story shown. Appending stories does not
  // bump it and therefore does not report the current story a second time.
  useEffect(() => {
    const story = items[current];
    if (story) {
      onStoryStartRef.current?.(current, story);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, restartToken]);

  const activeStory: Story | undefined = items[current];
  const isVideo = activeStory?.mediaType === 'video';
  // A zero or otherwise unusable `duration` falls back rather than stalling the
  // story forever. For video, `undefined` means "wait, the video has not
  // reported its length yet".
  const explicitDuration = usableDuration(activeStory?.duration);
  const storyDuration = isVideo
    ? explicitDuration ?? videoDuration
    : explicitDuration ?? DEFAULT_IMAGE_DURATION;

  // Identifies the story on screen, including replays of the same index.
  const storyKey = `${current}-${restartToken}`;

  // A video that loads without erroring but never reports a duration (or
  // silently stalls), or an image whose load never ends, would otherwise wait
  // forever. After the timeout, stop waiting: hide the loader and run the bar
  // on the default duration so the story always auto-advances. A real duration
  // arriving later replaces the fallback, and navigating away re-arms the
  // watchdog for the next story.
  const durationPending = isVideo && storyDuration == null;
  useEffect(() => {
    if (!isLoading && !durationPending) {
      return;
    }
    const watchdog = setTimeout(() => {
      setIsLoading(false);
      if (durationPending) {
        setVideoDuration((duration) => duration ?? DEFAULT_IMAGE_DURATION);
      }
    }, videoDurationTimeout);
    return () => clearTimeout(watchdog);
  }, [isLoading, durationPending, videoDurationTimeout, storyKey, storiesKey]);

  // Warm React Native's shared image cache with the next story's image while
  // the current story plays, so advancing does not flash the loader. The next
  // video is handled by `usePlayers`, which gives it a player ahead of time.
  useEffect(() => {
    if (!preloadNext) {
      return;
    }
    const next = items[current + 1];
    if (
      next?.mediaType === 'image' &&
      next.media &&
      typeof Image.prefetch === 'function'
    ) {
      // Best effort: a failed prefetch just means the loader shows as before.
      Image.prefetch(next.media)?.catch?.(() => {});
    }
  }, [preloadNext, items, current, storiesKey]);

  const activePlayer = usePlayers({
    stories: items,
    current,
    storyKey,
    storiesKey,
    preloadNext,
    muted: isMuted,
    volume: videoVolume,
    configurePlayer,
  });
  // The pool catches up with the story on screen one render after a
  // navigation; until then there is no player to show, only the loader.
  const player =
    activePlayer?.storyKey === storyKey ? activePlayer.player : null;

  // Drive the progress bar from state rather than from one-shot media
  // callbacks, so it also restarts for a repeated media url and picks back up
  // at the right place after a pause.
  useEffect(() => {
    if (total === 0 || isLoading || isPaused || isBuffering) {
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
    isBuffering,
    storyDuration,
    progress,
  ]);

  // Video events can arrive after the viewer has already moved on (React
  // commits navigation asynchronously), so each one names the story it is
  // about and anything not about the story on screen is dropped.
  const isCurrentStory = useCallback(
    (key: string) => key === `${currentRef.current}-${restartTokenRef.current}`,
    []
  );

  const handleVideoReady = useCallback(
    (key: string, durationMs: number | undefined) => {
      if (!isCurrentStory(key)) {
        return;
      }
      setIsLoading(false);
      if (durationMs) {
        // Only touch state on a real change: players revise the duration by
        // a millisecond or two, and each change re-runs the progress effect.
        setVideoDuration((duration) =>
          duration === durationMs ? duration : durationMs
        );
      }
    },
    [isCurrentStory]
  );

  const handleVideoError = useCallback(
    (key: string) => {
      if (!isCurrentStory(key)) {
        return;
      }
      // A story that cannot play must not freeze the whole viewer, so fall
      // back to the image duration and move on.
      setIsLoading(false);
      setVideoDuration((duration) => duration ?? DEFAULT_IMAGE_DURATION);
    },
    [isCurrentStory]
  );

  const handleVideoBuffering = useCallback(
    (key: string, buffering: boolean) => {
      if (isCurrentStory(key)) {
        setIsBuffering(buffering);
      }
    },
    [isCurrentStory]
  );

  const handleVideoEnd = useCallback(
    (key: string) => {
      if (!isCurrentStory(key)) {
        return;
      }
      // An explicit `duration` is the caller's decision, so the bar keeps
      // running: a shorter one already cut the clip, a longer one holds its
      // last frame until time is up.
      if (usableDuration(items[currentRef.current]?.duration)) {
        return;
      }
      if (progressValue.current >= 1) {
        return;
      }
      // Filling the bar stops the running timer without letting it finish, so
      // the story ends exactly once, right as the video does.
      progressValue.current = 1;
      progress.setValue(1);
      goNextRef.current();
    },
    [isCurrentStory, items, progress]
  );

  const openSeeMore = useCallback(() => {
    const story = items[currentRef.current];
    if (!story) {
      return;
    }
    if (onSeeMorePress) {
      onSeeMorePress(story);
      return;
    }
    if (!story.seeMoreUrl) {
      return;
    }
    // Rejects for urls no installed app can handle; swallow it rather than
    // surfacing an unhandled rejection to the app.
    Linking.openURL(story.seeMoreUrl).catch(() => {});
  }, [items, onSeeMorePress]);

  // react-native-web restarts the whole image load when these handlers change
  // identity (they are effect dependencies there), so inline arrows would put
  // the loader into an endless start/end loop on web. Keep them stable.
  const handleMediaLoadStart = useCallback(() => setIsLoading(true), []);
  const handleMediaLoadEnd = useCallback(() => setIsLoading(false), []);

  const handleLongPress = useCallback(() => setIsPaused(true), []);
  // `onPressOut` also fires for an ordinary tap. Setting the same value is a
  // no-op in React, so a tap does not disturb the running animation.
  const handlePressOut = useCallback(() => setIsPaused(false), []);
  const handleRequestClose = useCallback(() => onClose?.(), [onClose]);

  const barRadius = isAnimationBarRounded ? animationBarHeight / 2 : 0;

  // With nothing to show there is no media to load, no bar to fill and no
  // header to close from, so a full screen modal here would simply trap the
  // user. Render the stories once the caller actually has some.
  if (total === 0 || !activeStory) {
    return null;
  }

  const imageSource = activeStory.headers
    ? { uri: activeStory.media, headers: activeStory.headers }
    : { uri: activeStory.media };

  const seeMore = renderSeeMore ? (
    renderSeeMore(activeStory)
  ) : activeStory.seeMoreUrl ? (
    <Pressable
      onPress={openSeeMore}
      style={[styles.seeMore, seeMoreStyles]}
      accessibilityRole="link"
    >
      <Text style={[styles.seeMoreText, seeMoreTextStyles]}>{seeMoreText}</Text>
    </Pressable>
  ) : null;

  return (
    <Modal
      animationType="fade"
      transparent={false}
      supportedOrientations={['portrait', 'landscape']}
      {...platformModalProps}
      {...modalProps}
      visible={true}
      onRequestClose={handleRequestClose}
    >
      <SafeAreaRoot>
        <View style={styles.container}>
          {statusBarStyle ? <StatusBar barStyle={statusBarStyle} /> : null}
          {/* Remounted on every navigation so the load events fire again, even
            when two consecutive stories point at the same url. */}
          <View style={StyleSheet.absoluteFill} key={storyKey}>
            {isVideo && player ? (
              <VideoStory
                storyKey={storyKey}
                player={player}
                paused={isPaused}
                videoProps={videoProps}
                onReady={handleVideoReady}
                onError={handleVideoError}
                onBufferingChange={handleVideoBuffering}
                onEnd={handleVideoEnd}
              />
            ) : null}
            {!isVideo && renderImage
              ? renderImage(activeStory, {
                  source: imageSource,
                  style: StyleSheet.absoluteFill,
                  onLoadStart: handleMediaLoadStart,
                  onLoadEnd: handleMediaLoadEnd,
                })
              : null}
            {!isVideo && !renderImage ? (
              <Image
                resizeMode="cover"
                {...imageProps}
                onLoadStart={handleMediaLoadStart}
                onLoadEnd={handleMediaLoadEnd}
                source={imageSource}
                style={[StyleSheet.absoluteFill, imageProps?.style]}
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
            <Pressable
              onLongPress={handleLongPress}
              delayLongPress={150}
              onPressOut={handlePressOut}
              onPress={goPrevious}
              accessibilityRole="button"
              accessibilityLabel="Previous story"
              style={styles.pressZone}
              testID="rn-story-previous"
            />
            <Pressable
              onLongPress={handleLongPress}
              delayLongPress={150}
              onPressOut={handlePressOut}
              onPress={goNext}
              accessibilityRole="button"
              accessibilityLabel="Next story"
              style={styles.pressZone}
              testID="rn-story-next"
            />
          </View>

          {/* ANIMATION BARS AND HEADER, rendered after the press zones so a
            header button stays tappable above them */}
          <SafeAreaSlot
            edge="top"
            inset={safeAreaInsets?.top}
            style={styles.topContainer}
            testID="rn-story-top"
          >
            <View
              style={styles.animationBarsContainer}
              pointerEvents="box-none"
            >
              {items.map((item, index) => (
                // THE BACKGROUND
                <View
                  key={`${index}-${item?.media ?? ''}`}
                  testID="rn-story-bar"
                  style={[
                    styles.animationBarBackground,
                    {
                      height: animationBarHeight,
                      borderRadius: barRadius,
                      backgroundColor: animationBarBackgroundColor,
                    },
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
            {activeStory.header}
          </SafeAreaSlot>

          {/* SEE MORE COMPONENT */}
          {seeMore ? (
            <SafeAreaSlot
              edge="bottom"
              inset={safeAreaInsets?.bottom}
              style={styles.bottomContainer}
              testID="rn-story-bottom"
            >
              <View style={styles.seeMoreContainer} pointerEvents="box-none">
                {seeMore}
              </View>
            </SafeAreaSlot>
          ) : null}
        </View>
      </SafeAreaRoot>
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
    marginHorizontal: 2,
  },
  bottomContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  seeMoreContainer: {
    alignItems: 'center',
    marginBottom: 32,
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
