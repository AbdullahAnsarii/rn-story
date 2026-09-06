import * as React from 'react';
import { useEffect, useLayoutEffect, useRef } from 'react';
import { Platform, StyleSheet } from 'react-native';
import { VideoView } from 'expo-video';
import type {
  VideoPlayer,
  VideoPlayerStatus,
  VideoViewProps,
} from 'expo-video';
import { isReleased } from './usePlayers';

/** Props forwarded to expo-video's `VideoView`. */
export type StoryVideoProps = Partial<Omit<VideoViewProps, 'player'>>;

type VideoStoryProps = {
  /** Identifies the story so late events for a previous one can be ignored. */
  storyKey: string;
  player: VideoPlayer;
  paused: boolean;
  videoProps?: StoryVideoProps;
  /** The video can play; `durationMs` is undefined while its length is unknown. */
  onReady: (storyKey: string, durationMs: number | undefined) => void;
  onError: (storyKey: string) => void;
  onBufferingChange: (storyKey: string, buffering: boolean) => void;
  onEnd: (storyKey: string) => void;
};

/**
 * How often, in seconds, to hear from a video that has not yet said it is
 * ready or how long it is. Playback progress is proof of readiness on its
 * own, which matters on web where a fast `canplay` can slip by unobserved.
 */
const PROGRESS_POLL_INTERVAL = 0.5;

// Inside a Modal, and remounted for every story, a SurfaceView is known to
// come up black on some Android devices; a TextureView behaves like any other
// view. The prop only exists from SDK 53 on and is ignored before that, which
// is why it is not typed against VideoViewProps.
const platformVideoProps: Record<string, unknown> =
  Platform.OS === 'android' ? { surfaceType: 'textureView' } : {};

/** expo-video reports durations in seconds, with 0 or NaN for "unknown". */
const durationMillis = (player: VideoPlayer) => {
  const seconds = player.duration;
  return typeof seconds === 'number' && Number.isFinite(seconds) && seconds > 0
    ? Math.round(seconds * 1000)
    : undefined;
};

/**
 * Shows one video story with a player owned by `usePlayers`, and turns the
 * player's events into the few facts the viewer needs: ready (with a
 * duration once known), failed, buffering, and played to the end.
 */
export default function VideoStory({
  storyKey,
  player,
  paused,
  videoProps,
  onReady,
  onError,
  onBufferingChange,
  onEnd,
}: VideoStoryProps) {
  // The callbacks change identity with the parent's renders; reading them
  // through a ref keeps the subscriptions below to one set per player.
  const callbacks = useRef({ onReady, onError, onBufferingChange, onEnd });
  useLayoutEffect(() => {
    callbacks.current = { onReady, onError, onBufferingChange, onEnd };
  });

  useEffect(() => {
    if (isReleased(player)) {
      return;
    }
    let ready = false;
    let durationKnown = false;

    // Keep the clock ticking until the story is ready and its length is known.
    const updatePolling = () => {
      player.timeUpdateEventInterval =
        ready && durationKnown ? 0 : PROGRESS_POLL_INTERVAL;
    };

    const reportDuration = () => {
      const durationMs = durationMillis(player);
      durationKnown = durationMs != null;
      callbacks.current.onReady(storyKey, durationMs);
    };

    // The video can play: the loader can go, and so can any buffering hold.
    const becomeReady = () => {
      const firstTime = !ready;
      ready = true;
      if (firstTime || !durationKnown) {
        reportDuration();
      }
      callbacks.current.onBufferingChange(storyKey, false);
      updatePolling();
    };

    const handleStatus = (status: VideoPlayerStatus) => {
      if (status === 'readyToPlay') {
        becomeReady();
      } else if (status === 'loading') {
        // Loading again after having been ready means the buffer ran dry.
        if (ready) {
          callbacks.current.onBufferingChange(storyKey, true);
        }
      } else if (status === 'error') {
        callbacks.current.onError(storyKey);
      }
    };

    const subscriptions = [
      player.addListener('statusChange', ({ status }) => handleStatus(status)),
      // Frames are being shown, whatever the status says.
      player.addListener('playingChange', ({ isPlaying }) => {
        if (isPlaying && !ready) {
          becomeReady();
        }
      }),
      player.addListener('timeUpdate', ({ currentTime }) => {
        if (!ready && currentTime > 0) {
          becomeReady();
        } else if (ready && !durationKnown && durationMillis(player) != null) {
          reportDuration();
          updatePolling();
        }
      }),
      player.addListener('playToEnd', () => callbacks.current.onEnd(storyKey)),
    ];

    // A preloaded player may have loaded, or failed, before this view existed.
    handleStatus(player.status);
    updatePolling();

    return () => {
      if (isReleased(player)) {
        return;
      }
      subscriptions.forEach((subscription) => subscription.remove());
      player.timeUpdateEventInterval = 0;
    };
  }, [player, storyKey]);

  useEffect(() => {
    if (isReleased(player)) {
      return;
    }
    if (paused) {
      player.pause();
    } else {
      player.play();
    }
  }, [player, paused]);

  return (
    <VideoView
      nativeControls={false}
      contentFit="cover"
      {...platformVideoProps}
      {...videoProps}
      player={player}
      style={[StyleSheet.absoluteFill, videoProps?.style]}
      testID="rn-story-video"
    />
  );
}
