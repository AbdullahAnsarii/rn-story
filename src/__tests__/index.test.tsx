import * as React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Linking, Text } from 'react-native';
import Stories from '../index';
import type { Story } from '../index';

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

  it('shows the loader until the media reports it is ready', () => {
    render(<Stories stories={IMAGE_STORIES} />);
    expect(screen.queryByTestId('rn-story-loading')).toBeTruthy();
    finishImageLoad();
    expect(screen.queryByTestId('rn-story-loading')).toBeNull();
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

    const reportStatus = (status: Record<string, unknown>) => {
      act(() => {
        screen
          .getByTestId('rn-story-video')
          .props.onPlaybackStatusUpdate(status);
      });
    };

    it('waits for the reported duration before advancing', () => {
      const onNext = jest.fn();
      render(<Stories stories={VIDEO_STORIES} onNext={onNext} />);

      reportStatus({ isLoaded: true, durationMillis: 5000 });

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

      // A loaded status with no duration used to set the timer to undefined,
      // which Animated turned into a 500ms default and skipped the story.
      reportStatus({ isLoaded: true, durationMillis: undefined });

      act(() => {
        jest.advanceTimersByTime(4000);
      });
      expect(onNext).not.toHaveBeenCalled();
    });

    it('moves past a video that fails to load', () => {
      const onNext = jest.fn();
      render(<Stories stories={VIDEO_STORIES} onNext={onNext} />);

      reportStatus({ isLoaded: false, error: 'could not decode' });

      act(() => {
        jest.advanceTimersByTime(3500);
      });
      expect(onNext).toHaveBeenCalledTimes(1);
    });

    it('pauses on long press and resumes on release', () => {
      const onNext = jest.fn();
      render(<Stories stories={VIDEO_STORIES} onNext={onNext} />);
      reportStatus({ isLoaded: true, durationMillis: 4000 });

      expect(screen.getByTestId('rn-story-video').props.shouldPlay).toBe(true);

      act(() => {
        fireEvent(screen.getByTestId('rn-story-next'), 'longPress');
      });
      expect(screen.getByTestId('rn-story-video').props.shouldPlay).toBe(false);

      act(() => {
        jest.advanceTimersByTime(6000);
      });
      expect(onNext).not.toHaveBeenCalled();

      act(() => {
        fireEvent(screen.getByTestId('rn-story-next'), 'pressOut');
      });
      expect(screen.getByTestId('rn-story-video').props.shouldPlay).toBe(true);
    });

    it('resumes with the time that was left, not the full duration', () => {
      const onNext = jest.fn();
      render(<Stories stories={VIDEO_STORIES} onNext={onNext} />);
      reportStatus({ isLoaded: true, durationMillis: 4000 });

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
      reportStatus({ isLoaded: true, durationMillis: 4000 });

      act(() => {
        fireEvent(screen.getByTestId('rn-story-next'), 'longPress');
      });
      expect(screen.getByTestId('rn-story-video').props.shouldPlay).toBe(false);

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
      expect(screen.getByTestId('rn-story-video').props.shouldPlay).toBe(false);

      act(() => {
        fireEvent(screen.getByTestId('rn-story-next'), 'pressOut');
      });
      expect(screen.getByTestId('rn-story-video').props.shouldPlay).toBe(true);
    });

    it('does not re-report the end after a late duration update', () => {
      const onAllStoriesEnd = jest.fn();
      render(
        <Stories
          stories={[{ media: 'https://example.com/1.mp4', mediaType: 'video' }]}
          onAllStoriesEnd={onAllStoriesEnd}
        />
      );
      reportStatus({ isLoaded: true, durationMillis: 2000 });
      act(() => {
        jest.advanceTimersByTime(2500);
      });
      expect(onAllStoriesEnd).toHaveBeenCalledTimes(1);

      // Players routinely revise the duration by a millisecond or two.
      reportStatus({ isLoaded: true, durationMillis: 2001 });
      act(() => {
        jest.advanceTimersByTime(2500);
      });
      expect(onAllStoriesEnd).toHaveBeenCalledTimes(1);
    });

    it('passes mute and volume through to the video', () => {
      render(<Stories stories={VIDEO_STORIES} isMuted videoVolume={0.25} />);
      const video = screen.getByTestId('rn-story-video');
      expect(video.props.isMuted).toBe(true);
      expect(video.props.volume).toBe(0.25);
    });
  });
});
