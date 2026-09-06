import { useEffect, useRef, useState } from 'react';
import { createVideoPlayer } from 'expo-video';
import type { VideoPlayer, VideoSource } from 'expo-video';
import type { Story } from './types';

export type ConfigurePlayer = (player: VideoPlayer, story: Story) => void;

/** The player to show for the story identified by `storyKey`. */
export type ActivePlayer = {
  storyKey: string;
  player: VideoPlayer;
};

type Options = {
  stories: Story[];
  current: number;
  /** Identifies the story on screen, including replays of the same index. */
  storyKey: string;
  storiesKey: string;
  preloadNext: boolean;
  muted: boolean;
  volume: number;
  configurePlayer?: ConfigurePlayer;
};

// Players we have released. React runs some effect cleanups after the pool
// has already let go of a player (unmounting the whole viewer, StrictMode's
// double effects), and a released native object must not be touched again.
const released = new WeakSet<VideoPlayer>();

export const isReleased = (player: VideoPlayer) => released.has(player);

const releasePlayer = (player: VideoPlayer) => {
  released.add(player);
  player.release();
};

const videoSource = (story: Story): VideoSource =>
  story.headers
    ? { uri: story.media, headers: story.headers }
    : { uri: story.media };

/**
 * Owns the expo-video players for the story on screen and, when enabled, for
 * the story after it. Players live in a small pool keyed by media url: the
 * next video's player is created while the current story plays so it buffers
 * ahead of time (the video counterpart of the image prefetch), and when the
 * viewer advances that same player is handed to the view, so playback starts
 * without waiting on the network. Players no longer needed are released.
 */
export default function usePlayers({
  stories,
  current,
  storyKey,
  storiesKey,
  preloadNext,
  muted,
  volume,
  configurePlayer,
}: Options): ActivePlayer | null {
  const pool = useRef(new Map<string, VideoPlayer>());
  // Players that have been on screen. A player is shown once: reusing one
  // that already played (a repeated url, a replay of the same story) would
  // mean picking it up at the end of the clip in whatever state the platform
  // left it, so such a story gets a fresh player instead.
  const shown = useRef(new WeakSet<VideoPlayer>());
  const lastStoryKey = useRef<string | null>(null);
  const [active, setActive] = useState<ActivePlayer | null>(null);

  // Read through refs so that a new stories array identity, or a change of
  // mute or volume, does not tear players down.
  const latest = useRef({ stories, muted, volume, configurePlayer });
  latest.current = { stories, muted, volume, configurePlayer };

  // A passive effect on purpose: React runs the cleanups of unmounting
  // children before it, so a video view has always let go of its player by
  // the time the player is released here.
  useEffect(() => {
    const players = pool.current;
    const items = latest.current.stories;
    const story = items[current];
    const next = items[current + 1];

    const wanted = new Map<string, Story>();
    if (story?.mediaType === 'video' && story.media) {
      wanted.set(story.media, story);
      const existing = players.get(story.media);
      if (
        existing &&
        shown.current.has(existing) &&
        lastStoryKey.current !== storyKey
      ) {
        releasePlayer(existing);
        players.delete(story.media);
      }
    }
    lastStoryKey.current = storyKey;
    if (preloadNext && next?.mediaType === 'video' && next.media) {
      if (!wanted.has(next.media)) {
        wanted.set(next.media, next);
      }
    }

    players.forEach((player, media) => {
      if (!wanted.has(media)) {
        releasePlayer(player);
        players.delete(media);
      }
    });
    wanted.forEach((wantedStory, media) => {
      if (players.has(media)) {
        return;
      }
      const player = createVideoPlayer(videoSource(wantedStory));
      player.muted = latest.current.muted;
      player.volume = latest.current.volume;
      latest.current.configurePlayer?.(player, wantedStory);
      players.set(media, player);
    });

    const player =
      story?.mediaType === 'video' ? players.get(story.media) : undefined;
    if (player) {
      shown.current.add(player);
    }
    setActive((previous) => {
      if (!player) {
        return previous === null ? previous : null;
      }
      return previous?.storyKey === storyKey && previous.player === player
        ? previous
        : { storyKey, player };
    });
  }, [current, storyKey, storiesKey, preloadNext]);

  useEffect(() => {
    pool.current.forEach((player) => {
      player.muted = muted;
      player.volume = volume;
    });
  }, [muted, volume]);

  useEffect(() => {
    const players = pool.current;
    return () => {
      players.forEach(releasePlayer);
      players.clear();
    };
  }, []);

  return active;
}
