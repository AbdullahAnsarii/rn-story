import * as React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import {
  Image,
  Linking,
  Modal,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Stories from '../index';
import type { Story } from '../index';

/** The stand-in for an expo-video player, see jest.setup.js. */
type FakePlayer = {
  source: { uri: string; headers?: Record<string, string> };
  status: string;
  duration: number;
  currentTime: number;
  playing: boolean;
  muted: boolean;
  volume: number;
  timeUpdateEventInterval: number;
  released: boolean;
  calls: string[];
  emit: (name: string, payload?: unknown) => void;
  setStatus: (status: string, error?: unknown) => void;
};

const expoVideo = jest.requireMock('expo-video') as {
  __players: FakePlayer[];
  __reset: () => void;
};

/** Every player created so far, oldest first. */
const players = () => expoVideo.__players;

/** The player attached to the video view on screen. */
const currentPlayer = () =>
  screen.getByTestId('rn-story-video').props.player as FakePlayer;

/** Have a player report that it can play, optionally with its length. */
const ready = (player: FakePlayer, seconds?: number) => {
  act(() => {
    if (seconds != null) {
      player.duration = seconds;
    }
    player.setStatus('readyToPlay');
  });
};

const IMAGE_STORIES: Story[] = [
  { media: 'https://example.com/1.jpg', mediaType: 'image' },
  { media: 'https://example.com/2.jpg', mediaType: 'image' },
  { media: 'https://example.com/3.jpg', mediaType: 'image' },
];

/** Images only report readiness through native events, which jest never fires. */
const finishImageLoad = () => {
  act(() => {
    fireEvent(screen.getByTestId('rn-story-image'), 'loadEnd');
  });
};

const tapNext = () => fireEvent.press(screen.getByTestId('rn-story-next'));
const tapPrevious = () =>
  fireEvent.press(screen.getByTestId('rn-story-previous'));

describe('Stories', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
    expoVideo.__reset();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('renders one animation bar per story', () => {
    render(<Stories stories={IMAGE_STORIES} />);
    expect(screen.getAllByTestId('rn-story-bar')).toHaveLength(
      IMAGE_STORIES.length
    );
    expect(screen.getByTestId('rn-story-image')).toBeTruthy();
    expect(screen.getByTestId('rn-story-next')).toBeTruthy();
  });

  // Rendering a modal with no media, no bars and no header would trap the user
  // behind a permanent loader with nothing to tap.
  it('renders nothing at all for an empty list', () => {
    render(<Stories stories={[]} />);
    expect(screen.queryAllByTestId('rn-story-bar')).toHaveLength(0);
    expect(screen.queryByTestId('rn-story-image')).toBeNull();
    expect(screen.queryByTestId('rn-story-video')).toBeNull();
    expect(screen.queryByTestId('rn-story-loading')).toBeNull();
  });

  it('starts playing once stories arrive after an empty render', () => {
    const onNext = jest.fn();
    const { rerender } = render(<Stories stories={[]} onNext={onNext} />);

    rerender(<Stories stories={IMAGE_STORIES} onNext={onNext} />);
    expect(screen.getByTestId('rn-story-image').props.source.uri).toBe(
      IMAGE_STORIES[0]!.media
    );

    finishImageLoad();
    act(() => {
      jest.advanceTimersByTime(3500);
    });
    expect(onNext).toHaveBeenCalledTimes(1);
  });

  // react-native-web restarts the image load whenever these handlers change
  // identity, which used to loop the loader forever on web.
  it('keeps media load callbacks referentially stable across re-renders', () => {
    const { rerender } = render(<Stories stories={IMAGE_STORIES} />);
    const before = screen.getByTestId('rn-story-image').props;

    rerender(<Stories stories={IMAGE_STORIES} />);
    const after = screen.getByTestId('rn-story-image').props;

    expect(after.onLoadStart).toBe(before.onLoadStart);
    expect(after.onLoadEnd).toBe(before.onLoadEnd);
  });

  it('shows the loader until the media reports it is ready', () => {
    render(<Stories stories={IMAGE_STORIES} />);
    expect(screen.queryByTestId('rn-story-loading')).toBeTruthy();
    finishImageLoad();
    expect(screen.queryByTestId('rn-story-loading')).toBeNull();
  });

  it('gives up on an image whose load never ends', () => {
    const onNext = jest.fn();
    render(<Stories stories={IMAGE_STORIES} onNext={onNext} />);

    act(() => {
      jest.advanceTimersByTime(9500);
    });
    expect(screen.queryByTestId('rn-story-loading')).toBeTruthy();

    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(screen.queryByTestId('rn-story-loading')).toBeNull();
    act(() => {
      jest.advanceTimersByTime(3200);
    });
    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it('advances to the next story on a tap of the right half', () => {
    const onNext = jest.fn();
    render(<Stories stories={IMAGE_STORIES} onNext={onNext} />);

    expect(screen.getByTestId('rn-story-image').props.source.uri).toBe(
      IMAGE_STORIES[0]!.media
    );
    act(() => {
      tapNext();
    });
    expect(onNext).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('rn-story-image').props.source.uri).toBe(
      IMAGE_STORIES[1]!.media
    );
  });

  it('calls onAllStoriesEnd instead of onNext on the last story', () => {
    const onNext = jest.fn();
    const onAllStoriesEnd = jest.fn();
    render(
      <Stories
        stories={IMAGE_STORIES}
        currentIndex={2}
        onNext={onNext}
        onAllStoriesEnd={onAllStoriesEnd}
      />
    );

    act(() => {
      tapNext();
    });
    expect(onAllStoriesEnd).toHaveBeenCalledTimes(1);
    expect(onNext).not.toHaveBeenCalled();
  });

  it('calls onPreviousFirstStory instead of onPrevious on the first story', () => {
    const onPrevious = jest.fn();
    const onPreviousFirstStory = jest.fn();
    render(
      <Stories
        stories={IMAGE_STORIES}
        onPrevious={onPrevious}
        onPreviousFirstStory={onPreviousFirstStory}
      />
    );

    act(() => {
      tapPrevious();
    });
    expect(onPreviousFirstStory).toHaveBeenCalledTimes(1);
    expect(onPrevious).not.toHaveBeenCalled();
  });

  it('goes back to the previous story', () => {
    const onPrevious = jest.fn();
    render(
      <Stories
        stories={IMAGE_STORIES}
        currentIndex={1}
        onPrevious={onPrevious}
      />
    );

    act(() => {
      tapPrevious();
    });
    expect(onPrevious).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('rn-story-image').props.source.uri).toBe(
      IMAGE_STORIES[0]!.media
    );
  });

  it('auto-advances once the story duration elapses', () => {
    const onNext = jest.fn();
    render(
      <Stories
        stories={[
          {
            media: 'https://example.com/1.jpg',
            mediaType: 'image',
            duration: 1000,
          },
          {
            media: 'https://example.com/2.jpg',
            mediaType: 'image',
            duration: 1000,
          },
        ]}
        onNext={onNext}
      />
    );

    finishImageLoad();
    act(() => {
      jest.advanceTimersByTime(1200);
    });

    expect(onNext).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('rn-story-image').props.source.uri).toBe(
      'https://example.com/2.jpg'
    );
  });

  // Regression test for https://github.com/AbdullahAnsarii/rn-story/issues/4
  it('restarts when the caller swaps in a different set of stories', () => {
    const first: Story[] = [
      { media: 'https://example.com/a.jpg', mediaType: 'image' },
    ];
    const second: Story[] = [
      { media: 'https://example.com/b.jpg', mediaType: 'image' },
    ];

    const { rerender } = render(<Stories stories={first} />);
    expect(screen.getByTestId('rn-story-image').props.source.uri).toBe(
      'https://example.com/a.jpg'
    );

    rerender(<Stories stories={second} />);
    expect(screen.getByTestId('rn-story-image').props.source.uri).toBe(
      'https://example.com/b.jpg'
    );
  });

  it('does not reset when the parent re-creates an identical stories array', () => {
    const onNext = jest.fn();
    const { rerender } = render(
      <Stories stories={[...IMAGE_STORIES]} onNext={onNext} />
    );

    act(() => {
      tapNext();
    });
    expect(screen.getByTestId('rn-story-image').props.source.uri).toBe(
      IMAGE_STORIES[1]!.media
    );

    rerender(<Stories stories={[...IMAGE_STORIES]} onNext={onNext} />);
    expect(screen.getByTestId('rn-story-image').props.source.uri).toBe(
      IMAGE_STORIES[1]!.media
    );
  });

  it('follows the currentIndex prop after mount', () => {
    const { rerender } = render(
      <Stories stories={IMAGE_STORIES} currentIndex={0} />
    );
    expect(screen.getByTestId('rn-story-image').props.source.uri).toBe(
      IMAGE_STORIES[0]!.media
    );

    rerender(<Stories stories={IMAGE_STORIES} currentIndex={2} />);
    expect(screen.getByTestId('rn-story-image').props.source.uri).toBe(
      IMAGE_STORIES[2]!.media
    );
  });

  it('clamps an out-of-range currentIndex instead of rendering nothing', () => {
    render(<Stories stories={IMAGE_STORIES} currentIndex={99} />);
    expect(screen.getByTestId('rn-story-image').props.source.uri).toBe(
      IMAGE_STORIES[2]!.media
    );
  });

  it('survives an empty stories array', () => {
    const onNext = jest.fn();
    const onAllStoriesEnd = jest.fn();
    expect(() =>
      render(
        <Stories
          stories={[]}
          onNext={onNext}
          onAllStoriesEnd={onAllStoriesEnd}
        />
      )
    ).not.toThrow();

    act(() => {
      jest.advanceTimersByTime(10000);
    });
    expect(onNext).not.toHaveBeenCalled();
    expect(onAllStoriesEnd).not.toHaveBeenCalled();
  });

  it('keeps the current story when more stories are appended', () => {
    const { rerender } = render(<Stories stories={IMAGE_STORIES} />);
    act(() => {
      tapNext();
    });
    expect(screen.getByTestId('rn-story-image').props.source.uri).toBe(
      IMAGE_STORIES[1]!.media
    );

    rerender(
      <Stories
        stories={[
          ...IMAGE_STORIES,
          { media: 'https://example.com/4.jpg', mediaType: 'image' },
        ]}
      />
    );
    expect(screen.getByTestId('rn-story-image').props.source.uri).toBe(
      IMAGE_STORIES[1]!.media
    );
    expect(screen.getAllByTestId('rn-story-bar')).toHaveLength(4);
  });

  it('falls back to the default duration for an unusable one', () => {
    const onNext = jest.fn();
    render(
      <Stories
        stories={[
          {
            media: 'https://example.com/1.jpg',
            mediaType: 'image',
            duration: 0,
          },
          { media: 'https://example.com/2.jpg', mediaType: 'image' },
        ]}
        onNext={onNext}
      />
    );

    finishImageLoad();
    act(() => {
      jest.advanceTimersByTime(3500);
    });
    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it('reports the end of the list only once', () => {
    const onAllStoriesEnd = jest.fn();
    render(
      <Stories
        stories={[
          {
            media: 'https://example.com/1.jpg',
            mediaType: 'image',
            duration: 500,
          },
        ]}
        onAllStoriesEnd={onAllStoriesEnd}
      />
    );

    finishImageLoad();
    act(() => {
      jest.advanceTimersByTime(800);
    });
    expect(onAllStoriesEnd).toHaveBeenCalledTimes(1);

    // Pausing and releasing re-runs the progress effect; it must not report the
    // end of the list all over again.
    for (let i = 0; i < 3; i++) {
      act(() => {
        fireEvent(screen.getByTestId('rn-story-next'), 'longPress');
      });
      act(() => {
        fireEvent(screen.getByTestId('rn-story-next'), 'pressOut');
      });
      act(() => {
        jest.advanceTimersByTime(800);
      });
    }
    expect(onAllStoriesEnd).toHaveBeenCalledTimes(1);
  });

  it('replays a story whose media url repeats', () => {
    const onNext = jest.fn();
    const repeated: Story[] = [
      {
        media: 'https://example.com/same.jpg',
        mediaType: 'image',
        duration: 500,
      },
      {
        media: 'https://example.com/same.jpg',
        mediaType: 'image',
        duration: 500,
      },
    ];
    render(<Stories stories={repeated} onNext={onNext} />);

    finishImageLoad();
    act(() => {
      jest.advanceTimersByTime(700);
    });
    expect(onNext).toHaveBeenCalledTimes(1);

    // The second story must load and play again even though the url is the same.
    expect(screen.queryByTestId('rn-story-loading')).toBeTruthy();
    finishImageLoad();
    expect(screen.queryByTestId('rn-story-loading')).toBeNull();
  });

  it('renders the story header and see more button', () => {
    render(
      <Stories
        stories={[
          {
            media: 'https://example.com/1.jpg',
            mediaType: 'image',
            header: <Text>Jane Doe</Text>,
            seeMoreUrl: 'https://example.com',
          },
        ]}
        seeMoreText="Read more"
      />
    );

    expect(screen.getByText('Jane Doe')).toBeTruthy();
    fireEvent.press(screen.getByText('Read more'));
    expect(Linking.openURL).toHaveBeenCalledWith('https://example.com');
  });

  it('does not blow up when the see more url cannot be opened', () => {
    (Linking.openURL as jest.Mock).mockRejectedValue(new Error('no handler'));
    render(
      <Stories
        stories={[
          {
            media: 'https://example.com/1.jpg',
            mediaType: 'image',
            seeMoreUrl: 'weird-scheme://nope',
          },
        ]}
      />
    );

    expect(() =>
      fireEvent.press(screen.getByText('View Details'))
    ).not.toThrow();
  });

  it('renders a custom loading component', () => {
    render(
      <Stories
        stories={IMAGE_STORIES}
        loadingComponent={<Text>Please wait</Text>}
      />
    );
    expect(screen.getByText('Please wait')).toBeTruthy();
  });

  describe('video stories', () => {
    const VIDEO_STORIES: Story[] = [
      { media: 'https://example.com/1.mp4', mediaType: 'video' },
      { media: 'https://example.com/2.mp4', mediaType: 'video' },
    ];

    it('plays the current video through an expo-video player', () => {
      render(<Stories stories={VIDEO_STORIES} />);

      const video = screen.getByTestId('rn-story-video');
      const player = players()[0]!;
      expect(video.props.player).toBe(player);
      expect(player.source).toEqual({ uri: VIDEO_STORIES[0]!.media });
      expect(player.playing).toBe(true);
      // Stories never show the platform's own controls or letterboxing.
      expect(video.props.nativeControls).toBe(false);
      expect(video.props.contentFit).toBe('cover');
    });

    it('shows the loader until the player is ready, then runs its duration', () => {
      const onNext = jest.fn();
      render(<Stories stories={VIDEO_STORIES} onNext={onNext} />);
      expect(screen.queryByTestId('rn-story-loading')).toBeTruthy();

      ready(currentPlayer(), 5);
      expect(screen.queryByTestId('rn-story-loading')).toBeNull();

      act(() => {
        jest.advanceTimersByTime(3000);
      });
      expect(onNext).not.toHaveBeenCalled();

      act(() => {
        jest.advanceTimersByTime(2500);
      });
      expect(onNext).toHaveBeenCalledTimes(1);
    });

    it('does not advance while the duration is still unknown', () => {
      const onNext = jest.fn();
      render(<Stories stories={VIDEO_STORIES} onNext={onNext} />);

      // Ready, but with no length yet: the bar must wait rather than run on
      // some default and skip the story.
      ready(currentPlayer(), 0);
      expect(screen.queryByTestId('rn-story-loading')).toBeNull();

      act(() => {
        jest.advanceTimersByTime(4000);
      });
      expect(onNext).not.toHaveBeenCalled();
      // Meanwhile it keeps asking the player for one.
      expect(currentPlayer().timeUpdateEventInterval).toBeGreaterThan(0);
    });

    it('treats playback progress as readiness when no status arrives', () => {
      const onNext = jest.fn();
      render(<Stories stories={VIDEO_STORIES} onNext={onNext} />);
      const player = currentPlayer();
      // Polling is on from the start, so a missed `canplay` cannot wedge us.
      expect(player.timeUpdateEventInterval).toBeGreaterThan(0);

      act(() => {
        player.duration = 3;
        player.emit('timeUpdate', { currentTime: 0.4 });
      });
      expect(screen.queryByTestId('rn-story-loading')).toBeNull();
      expect(player.timeUpdateEventInterval).toBe(0);

      act(() => {
        jest.advanceTimersByTime(3500);
      });
      expect(onNext).toHaveBeenCalledTimes(1);
    });

    it('treats the player starting to play as readiness', () => {
      render(<Stories stories={VIDEO_STORIES} />);
      const player = currentPlayer();
      act(() => {
        player.duration = 3;
        player.emit('playingChange', { isPlaying: true });
      });
      expect(screen.queryByTestId('rn-story-loading')).toBeNull();
    });

    it('picks up a duration that only arrives once playback is under way', () => {
      const onNext = jest.fn();
      render(<Stories stories={VIDEO_STORIES} onNext={onNext} />);
      const player = currentPlayer();
      ready(player, 0);

      act(() => {
        player.duration = 4;
        player.emit('timeUpdate', { currentTime: 0.5 });
      });
      expect(player.timeUpdateEventInterval).toBe(0);

      act(() => {
        jest.advanceTimersByTime(4500);
      });
      expect(onNext).toHaveBeenCalledTimes(1);
    });

    it('moves past a video that fails to load', () => {
      const onNext = jest.fn();
      render(<Stories stories={VIDEO_STORIES} onNext={onNext} />);

      act(() => {
        currentPlayer().setStatus('error', { message: 'could not decode' });
      });
      expect(screen.queryByTestId('rn-story-loading')).toBeNull();

      act(() => {
        jest.advanceTimersByTime(3500);
      });
      expect(onNext).toHaveBeenCalledTimes(1);
    });

    it('pauses on long press and resumes on release', () => {
      const onNext = jest.fn();
      render(<Stories stories={VIDEO_STORIES} onNext={onNext} />);
      const player = currentPlayer();
      ready(player, 4);
      expect(player.playing).toBe(true);

      act(() => {
        fireEvent(screen.getByTestId('rn-story-next'), 'longPress');
      });
      expect(player.playing).toBe(false);

      act(() => {
        jest.advanceTimersByTime(6000);
      });
      expect(onNext).not.toHaveBeenCalled();

      act(() => {
        fireEvent(screen.getByTestId('rn-story-next'), 'pressOut');
      });
      expect(player.playing).toBe(true);
    });

    it('resumes with the time that was left, not the full duration', () => {
      const onNext = jest.fn();
      render(<Stories stories={VIDEO_STORIES} onNext={onNext} />);
      ready(currentPlayer(), 4);

      // Watch three quarters of the story, then pause.
      act(() => {
        jest.advanceTimersByTime(3000);
      });
      act(() => {
        fireEvent(screen.getByTestId('rn-story-next'), 'longPress');
      });
      act(() => {
        jest.advanceTimersByTime(5000);
      });
      expect(onNext).not.toHaveBeenCalled();

      act(() => {
        fireEvent(screen.getByTestId('rn-story-next'), 'pressOut');
      });
      // Only ~1000ms of the story is left, so it must not need another 4000ms.
      act(() => {
        jest.advanceTimersByTime(1500);
      });
      expect(onNext).toHaveBeenCalledTimes(1);
    });

    it('stays paused when stories change while the finger is down', () => {
      const onNext = jest.fn();
      const { rerender } = render(
        <Stories stories={VIDEO_STORIES} onNext={onNext} />
      );
      ready(currentPlayer(), 4);

      act(() => {
        fireEvent(screen.getByTestId('rn-story-next'), 'longPress');
      });
      expect(currentPlayer().playing).toBe(false);

      rerender(
        <Stories
          stories={[
            { media: 'https://example.com/9.mp4', mediaType: 'video' },
            ...VIDEO_STORIES,
          ]}
          onNext={onNext}
        />
      );
      // Still held down, so the replacement story must not start playing.
      const replacement = currentPlayer();
      expect(replacement.source.uri).toBe('https://example.com/9.mp4');
      expect(replacement.playing).toBe(false);

      act(() => {
        fireEvent(screen.getByTestId('rn-story-next'), 'pressOut');
      });
      expect(replacement.playing).toBe(true);
    });

    it('does not re-report the end after a late duration update', () => {
      const onAllStoriesEnd = jest.fn();
      render(
        <Stories
          stories={[{ media: 'https://example.com/1.mp4', mediaType: 'video' }]}
          onAllStoriesEnd={onAllStoriesEnd}
        />
      );
      const player = currentPlayer();
      ready(player, 2);
      act(() => {
        jest.advanceTimersByTime(2500);
      });
      expect(onAllStoriesEnd).toHaveBeenCalledTimes(1);

      // Players routinely revise the duration by a millisecond or two.
      act(() => {
        player.setStatus('loading');
      });
      ready(player, 2.001);
      act(() => {
        jest.advanceTimersByTime(2500);
      });
      expect(onAllStoriesEnd).toHaveBeenCalledTimes(1);
    });

    it('ends the story as soon as the video plays to the end', () => {
      const onNext = jest.fn();
      render(<Stories stories={VIDEO_STORIES} onNext={onNext} />);
      const first = currentPlayer();
      ready(first, 5);

      act(() => {
        jest.advanceTimersByTime(1000);
      });
      act(() => {
        first.emit('playToEnd');
      });
      expect(onNext).toHaveBeenCalledTimes(1);
      expect(currentPlayer().source.uri).toBe(VIDEO_STORIES[1]!.media);

      // The timer that was running for the first story must not fire as well.
      act(() => {
        jest.advanceTimersByTime(5000);
      });
      expect(onNext).toHaveBeenCalledTimes(1);
    });

    it('lets an explicit duration outlast a video that ended early', () => {
      const onNext = jest.fn();
      render(
        <Stories
          stories={[
            {
              media: 'https://example.com/1.mp4',
              mediaType: 'video',
              duration: 4000,
            },
            ...VIDEO_STORIES,
          ]}
          onNext={onNext}
        />
      );
      const player = currentPlayer();
      ready(player, 2);

      act(() => {
        jest.advanceTimersByTime(2000);
      });
      act(() => {
        player.emit('playToEnd');
      });
      expect(onNext).not.toHaveBeenCalled();

      act(() => {
        jest.advanceTimersByTime(2500);
      });
      expect(onNext).toHaveBeenCalledTimes(1);
    });

    it('reports the end of the list once when the timer and video end together', () => {
      const onAllStoriesEnd = jest.fn();
      render(
        <Stories
          stories={[{ media: 'https://example.com/1.mp4', mediaType: 'video' }]}
          onAllStoriesEnd={onAllStoriesEnd}
        />
      );
      const player = currentPlayer();
      ready(player, 2);

      act(() => {
        jest.advanceTimersByTime(2500);
      });
      act(() => {
        player.emit('playToEnd');
      });
      expect(onAllStoriesEnd).toHaveBeenCalledTimes(1);
    });

    it('holds the bar while the video is buffering', () => {
      const onNext = jest.fn();
      render(<Stories stories={VIDEO_STORIES} onNext={onNext} />);
      const player = currentPlayer();
      ready(player, 4);

      act(() => {
        jest.advanceTimersByTime(2000);
      });
      // The buffer ran dry: the picture stops, so the bar must stop too.
      act(() => {
        player.setStatus('loading');
      });
      act(() => {
        jest.advanceTimersByTime(5000);
      });
      expect(onNext).not.toHaveBeenCalled();

      ready(player);
      act(() => {
        jest.advanceTimersByTime(2500);
      });
      expect(onNext).toHaveBeenCalledTimes(1);
    });

    it('applies mute and volume to every player, including later changes', () => {
      const { rerender } = render(
        <Stories stories={VIDEO_STORIES} isMuted videoVolume={0.25} />
      );
      expect(players()).toHaveLength(2);
      players().forEach((player) => {
        expect(player.muted).toBe(true);
        expect(player.volume).toBe(0.25);
      });

      rerender(
        <Stories stories={VIDEO_STORIES} isMuted={false} videoVolume={1} />
      );
      players().forEach((player) => {
        expect(player.muted).toBe(false);
        expect(player.volume).toBe(1);
      });
    });

    it('forwards videoProps to the video view', () => {
      render(
        <Stories
          stories={VIDEO_STORIES}
          videoProps={{ contentFit: 'contain', allowsPictureInPicture: true }}
        />
      );
      const video = screen.getByTestId('rn-story-video');
      expect(video.props.contentFit).toBe('contain');
      expect(video.props.allowsPictureInPicture).toBe(true);
      expect(video.props.nativeControls).toBe(false);
    });

    it('sends the story headers with the video request', () => {
      render(
        <Stories
          stories={[
            {
              media: 'https://example.com/private.mp4',
              mediaType: 'video',
              headers: { Authorization: 'Bearer token' },
            },
          ]}
        />
      );
      expect(currentPlayer().source).toEqual({
        uri: 'https://example.com/private.mp4',
        headers: { Authorization: 'Bearer token' },
      });
    });

    it('lets configurePlayer set up every player, the preloaded one included', () => {
      const configurePlayer = jest.fn();
      render(
        <Stories stories={VIDEO_STORIES} configurePlayer={configurePlayer} />
      );
      expect(configurePlayer).toHaveBeenCalledTimes(2);
      expect(configurePlayer).toHaveBeenNthCalledWith(
        1,
        players()[0],
        VIDEO_STORIES[0]
      );
      expect(configurePlayer).toHaveBeenNthCalledWith(
        2,
        players()[1],
        VIDEO_STORIES[1]
      );
    });

    it('releases every player when the viewer unmounts', () => {
      const { unmount } = render(<Stories stories={VIDEO_STORIES} />);
      expect(players()).toHaveLength(2);
      unmount();
      players().forEach((player) => expect(player.released).toBe(true));
    });

    it('survives StrictMode running its effects twice', () => {
      // React Native's own Animated components still use legacy lifecycles,
      // which StrictMode reports; that noise is not what this test is about.
      jest.spyOn(console, 'error').mockImplementation((message) => {
        if (!String(message).includes('UNSAFE_')) {
          throw new Error(String(message));
        }
      });
      const onAllStoriesEnd = jest.fn();
      render(
        <React.StrictMode>
          <Stories
            stories={[VIDEO_STORIES[0]!]}
            onAllStoriesEnd={onAllStoriesEnd}
          />
        </React.StrictMode>
      );
      const player = currentPlayer();
      expect(player.released).toBe(false);
      expect(player.playing).toBe(true);
      expect(players().filter((p) => !p.released)).toHaveLength(1);

      ready(player, 2);
      act(() => {
        jest.advanceTimersByTime(2500);
      });
      expect(onAllStoriesEnd).toHaveBeenCalledTimes(1);
    });
  });

  // https://github.com/AbdullahAnsarii/rn-story/issues/7
  describe('video preloading', () => {
    const VIDEO_MIXED_FIRST: Story = {
      media: 'https://example.com/only.mp4',
      mediaType: 'video',
    };
    const MIXED: Story[] = [
      { media: 'https://example.com/1.jpg', mediaType: 'image' },
      { media: 'https://example.com/2.mp4', mediaType: 'video' },
      { media: 'https://example.com/3.mp4', mediaType: 'video' },
    ];

    it('gives the next video a player while an image is showing', () => {
      render(<Stories stories={MIXED} />);
      expect(players()).toHaveLength(1);
      expect(players()[0]!.source.uri).toBe(MIXED[1]!.media);
      // Preloading only: nothing has been asked to play.
      expect(players()[0]!.calls).not.toContain('play');
    });

    it('hands the preloaded player over when the viewer advances', () => {
      render(<Stories stories={MIXED} />);
      const preloaded = players()[0]!;
      finishImageLoad();

      act(() => {
        tapNext();
      });
      expect(currentPlayer()).toBe(preloaded);
      expect(preloaded.playing).toBe(true);
      // And the one after it is now buffering ahead.
      expect(players()).toHaveLength(2);
      expect(players()[1]!.source.uri).toBe(MIXED[2]!.media);
    });

    it('shows a preloaded video that is already ready without a loader', () => {
      const onAllStoriesEnd = jest.fn();
      render(
        <Stories
          stories={MIXED.slice(0, 2)}
          onAllStoriesEnd={onAllStoriesEnd}
        />
      );
      const preloaded = players()[0]!;
      preloaded.status = 'readyToPlay';
      preloaded.duration = 2;
      finishImageLoad();

      act(() => {
        tapNext();
      });
      expect(currentPlayer()).toBe(preloaded);
      expect(screen.queryByTestId('rn-story-loading')).toBeNull();

      act(() => {
        jest.advanceTimersByTime(2500);
      });
      expect(onAllStoriesEnd).toHaveBeenCalledTimes(1);
    });

    it('releases a player that is neither current nor next any more', () => {
      render(<Stories stories={MIXED} />);
      const second = players()[0]!;
      finishImageLoad();

      act(() => {
        tapNext();
      });
      act(() => {
        tapNext();
      });
      expect(currentPlayer().source.uri).toBe(MIXED[2]!.media);
      expect(second.released).toBe(true);
      expect(currentPlayer().released).toBe(false);
    });

    it('gives a repeated url a fresh player rather than one that already played', () => {
      const onNext = jest.fn();
      const repeated: Story[] = [
        { media: 'https://example.com/same.mp4', mediaType: 'video' },
        { media: 'https://example.com/same.mp4', mediaType: 'video' },
      ];
      render(<Stories stories={repeated} onNext={onNext} />);
      expect(players()).toHaveLength(1);
      const first = currentPlayer();
      ready(first, 2);

      act(() => {
        first.emit('playToEnd');
      });
      expect(onNext).toHaveBeenCalledTimes(1);
      // The player that just finished is not picked up at its end position.
      expect(players()).toHaveLength(2);
      expect(first.released).toBe(true);
      expect(currentPlayer()).toBe(players()[1]);
      expect(currentPlayer().playing).toBe(true);
    });

    it('starts over with a fresh player when the same story is replayed', () => {
      const onPreviousFirstStory = jest.fn();
      render(
        <Stories
          stories={[VIDEO_MIXED_FIRST]}
          onPreviousFirstStory={onPreviousFirstStory}
        />
      );
      const first = currentPlayer();
      ready(first, 2);
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      act(() => {
        tapPrevious();
      });
      expect(onPreviousFirstStory).toHaveBeenCalledTimes(1);
      expect(first.released).toBe(true);
      expect(currentPlayer()).not.toBe(first);
      expect(currentPlayer().source.uri).toBe(VIDEO_MIXED_FIRST.media);
    });

    it('does not create a player for the next video when preloadNext is off', () => {
      render(<Stories stories={MIXED} preloadNext={false} />);
      expect(players()).toHaveLength(0);
      finishImageLoad();

      act(() => {
        tapNext();
      });
      expect(players()).toHaveLength(1);
      expect(currentPlayer()).toBe(players()[0]);
    });
  });

  // https://github.com/AbdullahAnsarii/rn-story/issues/8
  describe('video duration watchdog', () => {
    const SILENT_VIDEO: Story[] = [
      { media: 'https://example.com/silent.mp4', mediaType: 'video' },
      { media: 'https://example.com/after.jpg', mediaType: 'image' },
    ];

    it('advances a video that never reports a duration', () => {
      const onNext = jest.fn();
      render(<Stories stories={SILENT_VIDEO} onNext={onNext} />);

      // Nothing has been reported: before the watchdog fires, nothing moves.
      act(() => {
        jest.advanceTimersByTime(9000);
      });
      expect(onNext).not.toHaveBeenCalled();
      expect(screen.queryByTestId('rn-story-loading')).toBeTruthy();

      // Watchdog at 10s hides the loader and runs the default duration.
      act(() => {
        jest.advanceTimersByTime(1200);
      });
      expect(screen.queryByTestId('rn-story-loading')).toBeNull();
      act(() => {
        jest.advanceTimersByTime(3200);
      });
      expect(onNext).toHaveBeenCalledTimes(1);
    });

    it('respects a custom videoDurationTimeout', () => {
      const onNext = jest.fn();
      render(
        <Stories
          stories={SILENT_VIDEO}
          onNext={onNext}
          videoDurationTimeout={2000}
        />
      );
      act(() => {
        jest.advanceTimersByTime(2100);
      });
      act(() => {
        jest.advanceTimersByTime(3300);
      });
      expect(onNext).toHaveBeenCalledTimes(1);
    });

    it('is cancelled when the real duration arrives in time', () => {
      const onNext = jest.fn();
      render(
        <Stories
          stories={SILENT_VIDEO}
          onNext={onNext}
          videoDurationTimeout={2000}
        />
      );
      ready(currentPlayer(), 8);

      // Well past timeout + default duration: the fallback must not have run.
      act(() => {
        jest.advanceTimersByTime(6000);
      });
      expect(onNext).not.toHaveBeenCalled();

      // The real 8s duration elapses.
      act(() => {
        jest.advanceTimersByTime(2500);
      });
      expect(onNext).toHaveBeenCalledTimes(1);
    });
  });

  // https://github.com/AbdullahAnsarii/rn-story/issues/9
  describe('custom see more', () => {
    const SEE_MORE_STORY: Story[] = [
      {
        media: 'https://example.com/1.jpg',
        mediaType: 'image',
        seeMoreUrl: 'https://example.com/details',
      },
    ];

    it('onSeeMorePress overrides opening the url', () => {
      const onSeeMorePress = jest.fn();
      render(
        <Stories stories={SEE_MORE_STORY} onSeeMorePress={onSeeMorePress} />
      );
      fireEvent.press(screen.getByText('View Details'));
      expect(onSeeMorePress).toHaveBeenCalledTimes(1);
      expect(onSeeMorePress.mock.calls[0][0].seeMoreUrl).toBe(
        'https://example.com/details'
      );
      expect(Linking.openURL).not.toHaveBeenCalled();
    });

    it('renderSeeMore replaces the built-in button', () => {
      render(
        <Stories
          stories={SEE_MORE_STORY}
          renderSeeMore={(story) => <Text>Custom {story.mediaType}</Text>}
        />
      );
      expect(screen.getByText('Custom image')).toBeTruthy();
      expect(screen.queryByText('View Details')).toBeNull();
    });

    it('renderSeeMore shows even for stories without a seeMoreUrl', () => {
      render(
        <Stories
          stories={[{ media: 'https://example.com/1.jpg', mediaType: 'image' }]}
          renderSeeMore={() => <Text>Swipe up</Text>}
        />
      );
      expect(screen.getByText('Swipe up')).toBeTruthy();
    });

    it('renderSeeMore returning null renders nothing', () => {
      render(<Stories stories={SEE_MORE_STORY} renderSeeMore={() => null} />);
      expect(screen.queryByText('View Details')).toBeNull();
      expect(screen.queryByTestId('rn-story-bottom')).toBeNull();
    });
  });

  // https://github.com/AbdullahAnsarii/rn-story/issues/7
  describe('image preloading', () => {
    beforeEach(() => {
      if (typeof Image.prefetch !== 'function') {
        (Image as unknown as { prefetch: unknown }).prefetch = () =>
          Promise.resolve(true);
      }
      jest.spyOn(Image, 'prefetch').mockResolvedValue(true);
    });

    it('prefetches the next image while the current story plays', () => {
      render(<Stories stories={IMAGE_STORIES} />);
      expect(Image.prefetch).toHaveBeenCalledWith(IMAGE_STORIES[1]!.media);
      expect(Image.prefetch).not.toHaveBeenCalledWith(IMAGE_STORIES[2]!.media);
    });

    it('prefetches the following image after advancing', () => {
      render(<Stories stories={IMAGE_STORIES} />);
      act(() => {
        tapNext();
      });
      expect(Image.prefetch).toHaveBeenCalledWith(IMAGE_STORIES[2]!.media);
    });

    it('leaves videos to their players', () => {
      render(
        <Stories
          stories={[
            { media: 'https://example.com/1.jpg', mediaType: 'image' },
            { media: 'https://example.com/2.mp4', mediaType: 'video' },
          ]}
        />
      );
      expect(Image.prefetch).not.toHaveBeenCalled();
    });

    it('can be turned off with preloadNext', () => {
      render(<Stories stories={IMAGE_STORIES} preloadNext={false} />);
      expect(Image.prefetch).not.toHaveBeenCalled();
    });
  });

  describe('custom images', () => {
    it('forwards imageProps to the built-in image', () => {
      render(
        <Stories
          stories={IMAGE_STORIES}
          imageProps={{ blurRadius: 4, accessibilityLabel: 'Story photo' }}
        />
      );
      const image = screen.getByTestId('rn-story-image');
      expect(image.props.blurRadius).toBe(4);
      expect(image.props.accessibilityLabel).toBe('Story photo');
      expect(image.props.source.uri).toBe(IMAGE_STORIES[0]!.media);
    });

    it('sends the story headers with the image request', () => {
      render(
        <Stories
          stories={[
            {
              media: 'https://example.com/private.jpg',
              mediaType: 'image',
              headers: { Authorization: 'Bearer token' },
            },
          ]}
        />
      );
      expect(screen.getByTestId('rn-story-image').props.source).toEqual({
        uri: 'https://example.com/private.jpg',
        headers: { Authorization: 'Bearer token' },
      });
    });

    it('renderImage replaces the built-in image and drives the loader', () => {
      const onNext = jest.fn();
      const renderImage = jest.fn(
        (
          _story: Story,
          props: {
            source: { uri: string };
            onLoadStart: () => void;
            onLoadEnd: () => void;
          }
        ) => <View testID="custom-image" {...props} />
      );
      render(
        <Stories
          stories={IMAGE_STORIES}
          renderImage={renderImage}
          onNext={onNext}
        />
      );

      expect(screen.queryByTestId('rn-story-image')).toBeNull();
      expect(renderImage.mock.calls[0]![0]).toBe(IMAGE_STORIES[0]);
      const custom = screen.getByTestId('custom-image');
      expect(custom.props.source.uri).toBe(IMAGE_STORIES[0]!.media);
      expect(screen.queryByTestId('rn-story-loading')).toBeTruthy();

      act(() => {
        custom.props.onLoadEnd();
      });
      expect(screen.queryByTestId('rn-story-loading')).toBeNull();

      act(() => {
        jest.advanceTimersByTime(3500);
      });
      expect(onNext).toHaveBeenCalledTimes(1);
    });
  });

  describe('onStoryStart', () => {
    it('reports the first story on mount and every story after that', () => {
      const onStoryStart = jest.fn();
      render(<Stories stories={IMAGE_STORIES} onStoryStart={onStoryStart} />);
      expect(onStoryStart).toHaveBeenCalledTimes(1);
      expect(onStoryStart).toHaveBeenLastCalledWith(0, IMAGE_STORIES[0]);

      act(() => {
        tapNext();
      });
      expect(onStoryStart).toHaveBeenCalledTimes(2);
      expect(onStoryStart).toHaveBeenLastCalledWith(1, IMAGE_STORIES[1]);

      finishImageLoad();
      act(() => {
        jest.advanceTimersByTime(3500);
      });
      expect(onStoryStart).toHaveBeenCalledTimes(3);
      expect(onStoryStart).toHaveBeenLastCalledWith(2, IMAGE_STORIES[2]);
    });

    it('reports a replacement set of stories, but not an appended one', () => {
      const onStoryStart = jest.fn();
      const { rerender } = render(
        <Stories stories={IMAGE_STORIES} onStoryStart={onStoryStart} />
      );
      expect(onStoryStart).toHaveBeenCalledTimes(1);

      rerender(
        <Stories
          stories={[
            ...IMAGE_STORIES,
            { media: 'https://example.com/4.jpg', mediaType: 'image' },
          ]}
          onStoryStart={onStoryStart}
        />
      );
      expect(onStoryStart).toHaveBeenCalledTimes(1);

      const replacement: Story[] = [
        { media: 'https://example.com/z.jpg', mediaType: 'image' },
      ];
      rerender(<Stories stories={replacement} onStoryStart={onStoryStart} />);
      expect(onStoryStart).toHaveBeenCalledTimes(2);
      expect(onStoryStart).toHaveBeenLastCalledWith(0, replacement[0]);
    });
  });

  describe('layout customization', () => {
    it('applies explicit safe area insets around the bars and See More', () => {
      render(
        <Stories
          stories={[
            {
              media: 'https://example.com/1.jpg',
              mediaType: 'image',
              seeMoreUrl: 'https://example.com',
            },
          ]}
          safeAreaInsets={{ top: 44, bottom: 20 }}
        />
      );
      expect(
        StyleSheet.flatten(screen.getByTestId('rn-story-top').props.style)
          .paddingTop
      ).toBe(44);
      expect(
        StyleSheet.flatten(screen.getByTestId('rn-story-bottom').props.style)
          .paddingBottom
      ).toBe(20);
    });

    it('colors the progress bar track', () => {
      render(
        <Stories
          stories={IMAGE_STORIES}
          animationBarBackgroundColor="rgba(255, 0, 0, 0.5)"
        />
      );
      const bar = screen.getAllByTestId('rn-story-bar')[0]!;
      expect(StyleSheet.flatten(bar.props.style).backgroundColor).toBe(
        'rgba(255, 0, 0, 0.5)'
      );
    });

    it('sets a light status bar while open, unless told not to', () => {
      const { rerender } = render(<Stories stories={IMAGE_STORIES} />);
      expect(screen.UNSAFE_getByType(StatusBar).props.barStyle).toBe(
        'light-content'
      );

      rerender(<Stories stories={IMAGE_STORIES} statusBarStyle={null} />);
      expect(screen.UNSAFE_queryByType(StatusBar)).toBeNull();
    });

    it('forwards modalProps to the modal', () => {
      render(
        <Stories
          stories={IMAGE_STORIES}
          modalProps={{ animationType: 'slide' }}
        />
      );
      expect(screen.UNSAFE_getByType(Modal).props.animationType).toBe('slide');
    });
  });
});
