<h1 align="center">rn-story</h1>

<p align="center">
  Instagram-style stories for React Native and Expo — images, videos, progress bars, and tap gestures in one lightweight component.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/rn-story"><img src="https://img.shields.io/npm/v/rn-story" alt="npm version" /></a>
  <a href="https://www.npmjs.com/package/rn-story"><img src="https://img.shields.io/npm/dm/rn-story" alt="npm downloads" /></a>
  <a href="https://github.com/AbdullahAnsarii/rn-story/actions/workflows/ci.yml"><img src="https://github.com/AbdullahAnsarii/rn-story/actions/workflows/ci.yml/badge.svg?branch=master" alt="CI status" /></a>
  <a href="https://www.npmjs.com/package/rn-story"><img src="https://img.shields.io/npm/types/rn-story" alt="TypeScript types" /></a>
  <a href="./LICENSE"><img src="https://img.shields.io/npm/l/rn-story" alt="license" /></a>
</p>

<p align="center">
  <img height="600" src="docs/demo.jpg" alt="rn-story demo — a full screen story with progress bars, avatar header and See More button" />
</p>

## Try it

▶️ **[Open the live demo on Expo Snack](https://snack.expo.dev/@abdullahansari/rn-story-demo)** — tap through image and video stories in the browser, or scan the QR code with **Expo Go** to run it on your phone. The demo source lives in [`snack/`](snack/App.tsx).

## Features

- 📸 **Image and video stories** with an animated progress bar per story
- 🎬 **Built on [`expo-video`](https://docs.expo.dev/versions/latest/sdk/video/)** — the modern, maintained player, with a dedicated player per story so playback starts the moment a story appears
- ⚡ **Preloads the next story** — the next image is prefetched and the next video buffers ahead of time, so advancing never flashes a loader
- 🎯 **Progress that tells the truth** — the bar pauses while a video buffers and the story ends exactly when the video does
- 👆 **Familiar gestures** — tap right for next, tap left for previous, long-press to pause
- 🔗 **"See More" built in** — one `seeMoreUrl` per story gets a working button, or take over with `onSeeMorePress` / `renderSeeMore`
- ⏱ **Never wedges** — failed media is skipped and a watchdog keeps playback advancing even when a video never reports its length
- 📐 **Safe-area and edge-to-edge aware** — bars, header and See More stay clear of notches, the Android status bar and the home indicator
- 🎨 **Customize anything** — pass props straight to the image, the video view, the player and the modal, or render images with your own component (expo-image, blurhash placeholders…)
- 📊 **`onStoryStart` for analytics** and navigation callbacks for multi-profile flows
- 🔐 **Protected media** — per-story HTTP headers for images and videos
- 🛡️ **TypeScript-first** — every prop and the `Story` object are fully typed
- 🪶 **Lightweight** — a few small files, zero runtime dependencies and no native code of its own

## Requirements

- Expo SDK 52 or newer (`expo-video` ≥ 2.0), or a bare React Native 0.76+ app with [Expo modules installed](https://docs.expo.dev/bare/installing-expo-modules/)
- React 18 or newer

Still on `expo-av`? [rn-story 2.x](https://www.npmjs.com/package/rn-story/v/2.1.1) supports it; see [Upgrading to 3.0](#upgrading-to-30) for what changed.

## Installation

```sh
npx expo install rn-story expo-video react-native-safe-area-context
```

[`expo-video`](https://docs.expo.dev/versions/latest/sdk/video/) plays the videos and is a peer dependency, so `expo install` picks the version that matches your SDK. [`react-native-safe-area-context`](https://docs.expo.dev/versions/latest/sdk/safe-area-context/) is optional: when it is installed (React Navigation and Expo Router apps already have it), the progress bars, header and See More button are kept clear of notches and of Android's edge-to-edge status and navigation bars. Without it, rn-story falls back to what React Native offers on its own.

<details>
<summary>Bare React Native (without Expo)</summary>

Make sure [Expo modules are configured](https://docs.expo.dev/bare/installing-expo-modules/) in your project, then install the packages and rebuild your app (`expo-video` has native code):

```sh
npm install rn-story expo-video react-native-safe-area-context
npx pod-install
```

</details>

## Quick start

```tsx
import Stories from 'rn-story';
import type { Story } from 'rn-story';

const stories: Story[] = [
  { media: 'https://example.com/photo.jpg', mediaType: 'image' },
  { media: 'https://example.com/clip.mp4', mediaType: 'video' },
];

export default function MyStories() {
  return <Stories stories={stories} />;
}
```

In a real app you will usually open the viewer from a pressable avatar and close it from a callback:

```tsx
import { useState } from 'react';
import Stories from 'rn-story';

export default function App() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* ...your avatar rail that calls setOpen(true)... */}
      {open && (
        <Stories
          stories={stories}
          onAllStoriesEnd={() => setOpen(false)}
          onPreviousFirstStory={() => setOpen(false)}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
```

See the [full example](#full-example) below for a complete multi-profile setup with avatars, headers, a mute button and viewed indicators.

## Gestures

| Gesture | Action |
| --- | --- |
| Tap right half | Next story (`onNext`), or `onAllStoriesEnd` on the last story |
| Tap left half | Previous story (`onPrevious`), or `onPreviousFirstStory` on the first story |
| Long-press | Pause the story and its progress bar |
| Release | Resume from where it left off |
| Android back button | Calls `onClose` |

## API

### `<Stories />` props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `stories` | `Story[]` | **required** | The [story objects](#story-object) to play, in order. |
| `currentIndex` | `number` | `0` | Story to start from. Updating it after mount jumps to that story. |
| `onNext` | `() => void` | — | Called when the user moves to the next story. Not called on the last story. |
| `onPrevious` | `() => void` | — | Called when the user moves to the previous story. Not called on the first story. |
| `onAllStoriesEnd` | `() => void` | — | Called on the last story when the user tries to go forward (or the story finishes). Close the viewer or show the next profile here. |
| `onPreviousFirstStory` | `() => void` | — | Called on the first story when the user tries to go back. Close the viewer or show the previous profile here. |
| `onClose` | `() => void` | — | Called by the Android hardware back button. Without it the back button does nothing while the viewer is open. |
| `onStoryStart` | `(index: number, story: Story) => void` | — | Called whenever a story starts showing — on mount, on every navigation and when a new set of stories arrives. Ideal for "viewed" tracking and analytics. |
| `isMuted` | `boolean` | `false` | Mute video stories. Applies immediately, also to the video buffering next. |
| `videoVolume` | `number` | `1.0` | Volume of video stories, `0.0`–`1.0`. |
| `preloadNext` | `boolean` | `true` | Load the next story while the current one plays: the next image is prefetched into the image cache and the next video gets its own player that buffers ahead of time. |
| `videoDurationTimeout` | `number` | `10000` | How long to wait, in milliseconds, for a video to report its duration before falling back to the default story duration. Also caps how long the loader can stay up for any story. |
| `loadingComponent` | `ReactNode` | `<ActivityIndicator />` | Rendered while the current story's media is loading. |
| `isAnimationBarRounded` | `boolean` | `true` | Rounded ends on the progress bars. |
| `animationBarHeight` | `number` | `2` | Height of the progress bars. |
| `animationBarColor` | `string` | `"#fff"` | Fill color of the progress bars. |
| `animationBarBackgroundColor` | `string` | `"rgba(117, 117, 117, 0.5)"` | Color of the unfilled part of the progress bars. |
| `seeMoreText` | `string` | `"View Details"` | Label of the **See More** button (shown when the story has a `seeMoreUrl`). |
| `seeMoreStyles` | `ViewStyle` | — | Style overrides for the **See More** button container. |
| `seeMoreTextStyles` | `TextStyle` | — | Style overrides for the **See More** button text. |
| `onSeeMorePress` | `(story: Story) => void` | — | Called when the built-in **See More** button is pressed, instead of opening `seeMoreUrl` with `Linking` — use it for in-app browsers, bottom sheets, or analytics. |
| `renderSeeMore` | `(story: Story) => ReactNode` | — | Replaces the built-in **See More** button entirely. Rendered at the bottom of every story; return `null` to render nothing. The returned node owns its own press handling. |
| `imageProps` | `ImageProps` | — | Extra props for the built-in `Image`, e.g. `blurRadius`, `fadeDuration` or `accessibilityLabel`. The source and load handlers are managed for you. |
| `videoProps` | `VideoViewProps` | — | Extra props for expo-video's `VideoView`, e.g. `contentFit: 'contain'` for landscape clips or `allowsPictureInPicture`. Native controls are off and the video covers the screen unless you say otherwise. |
| `renderImage` | `(story: Story, props: RenderImageProps) => ReactNode` | — | Render image stories with your own component instead of the built-in `Image` — see [Using your own image component](#using-your-own-image-component). |
| `configurePlayer` | `(player: VideoPlayer, story: Story) => void` | — | Called with every video player right after it is created (including the one buffering the next story), to set anything expo-video exposes on the player, e.g. `audioMixingMode` or `staysActiveInBackground`. |
| `safeAreaInsets` | `{ top?: number; bottom?: number }` | auto | Distances to keep the bars and header clear of the top of the screen and the See More button clear of the bottom. Defaults to `react-native-safe-area-context` when installed, otherwise to React Native's own SafeAreaView on iOS and the status bar height on Android. |
| `modalProps` | `ModalProps` | — | Extra props for the full screen `Modal` the stories are shown in, e.g. `animationType: 'slide'`. |
| `statusBarStyle` | `StatusBarStyle \| null` | `"light-content"` | Status bar icon style while the viewer is open, restored when it closes. Pass `null` to leave the status bar alone. |

> **Note:** an empty `stories` array renders nothing, so it is safe to render `<Stories />` while your data is still loading.

### Story object

| Property | Type | Description |
| --- | --- | --- |
| `media` | `string` | URL of the image or video. |
| `mediaType` | `'image' \| 'video'` | Type of the story. |
| `duration?` | `number` | How long the story stays on screen, in milliseconds. Defaults to `3000` for images and to the video's own length for videos. A video with an explicit duration is cut short, or holds its last frame, to match it. |
| `header?` | `ReactNode` | Rendered just below the progress bars — ideal for an avatar, username, close button, or gradient. |
| `seeMoreUrl?` | `string` | Shows a **See More** button at the bottom that opens this URL. |
| `headers?` | `Record<string, string>` | HTTP headers sent with the request for `media`, e.g. an `Authorization` header for protected content. |

### TypeScript

All types are exported:

```ts
import type {
  Story,
  StoriesProps,
  StoryMediaType,
  StoryVideoProps,
  RenderImageProps,
  SafeAreaInsets,
  ConfigurePlayer,
} from 'rn-story';
```

## Customizing

### Using your own image component

`renderImage` swaps the built-in `Image` for anything that can load a URL. Spread the props it gives you so the story fills the screen and the loader and progress bar follow your component's loading:

```tsx
import { Image } from 'expo-image';

<Stories
  stories={stories}
  renderImage={(story, props) => (
    <Image
      {...props}
      contentFit="cover"
      placeholder={{ blurhash: story.blurhash }}
      transition={200}
    />
  )}
/>
```

For small tweaks to the built-in image — a blur, a fade, an accessibility label — `imageProps` is enough.

### Video

Videos play through [`expo-video`](https://docs.expo.dev/versions/latest/sdk/video/). `videoProps` reaches the `VideoView` and `configurePlayer` reaches the `VideoPlayer`:

```tsx
<Stories
  stories={stories}
  // Letterbox landscape clips instead of cropping them
  videoProps={{ contentFit: 'contain' }}
  // Anything expo-video's player exposes
  configurePlayer={(player) => {
    player.audioMixingMode = 'duckOthers';
  }}
/>
```

While the current story plays, the next video already has a player buffering in the background (turn this off with `preloadNext={false}`). Players are released as soon as they are no longer needed.

### Safe areas, status bar and modal

The viewer is a full screen modal that draws behind the status bar. With `react-native-safe-area-context` installed nothing else is needed; otherwise pass `safeAreaInsets` (for example from your own layout code) to position the bars and See More button yourself. `statusBarStyle` sets the status bar icons while the viewer is open (light, for the black background, by default) and `modalProps` reaches the `Modal` for things like `animationType`.

### Progress bars and See More

`animationBarColor`, `animationBarBackgroundColor`, `animationBarHeight` and `isAnimationBarRounded` shape the bars. For the See More button there is a ladder: `seeMoreText` / `seeMoreStyles` / `seeMoreTextStyles` restyle it, `onSeeMorePress` decides what a press does, and `renderSeeMore` replaces it altogether.

### A note on video hosting

iOS plays videos with AVPlayer, which **requires the server to support HTTP range requests** (`206 Partial Content`) for progressive MP4 playback. Web and Android players are more forgiving, so a video that works everywhere except iOS is almost always hosted on a server that ignores `Range` headers — test with `curl -I -H "Range: bytes=0-1" <url>` and look for a `206`. MP4s encoded with `+faststart` (the `moov` atom up front) also start noticeably faster.

## Full example

A complete multi-profile setup — an avatar rail, per-profile stories, a header with mute and close buttons, and viewed indicators.

<details>
<summary>Show the full example</summary>

```tsx
import * as React from 'react';
import { useCallback, useMemo, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import Stories from 'rn-story';
import type { Story } from 'rn-story';

type Profile = {
  id: number;
  profileName: string;
  profileImage: string;
  stories: Story[];
};

const PROFILES: Profile[] = [
  {
    id: 1,
    profileName: 'Abdullah Ansari',
    profileImage: 'https://picsum.photos/id/64/200/200',
    stories: [
      {
        media: 'https://picsum.photos/id/1015/1080/1920',
        mediaType: 'image',
        seeMoreUrl: 'https://abdullahansari.me',
      },
      {
        media: 'https://picsum.photos/id/1016/1080/1920',
        mediaType: 'image',
        duration: 6000,
      },
      {
        media:
          'https://raw.githubusercontent.com/AbdullahAnsarii/rn-story/master/docs/demo.mp4',
        mediaType: 'video',
      },
    ],
  },
  {
    id: 2,
    profileName: 'Pug life',
    profileImage: 'https://picsum.photos/id/1025/200/200',
    stories: [
      {
        media:
          'https://raw.githubusercontent.com/AbdullahAnsarii/rn-story/master/docs/demo.mp4',
        mediaType: 'video',
      },
      {
        media: 'https://picsum.photos/id/1025/1080/1920',
        mediaType: 'image',
      },
    ],
  },
];

export default function App() {
  // Setting this state to null closes the story view.
  const [currentProfile, setCurrentProfile] = useState<number | null>(null);
  const [viewed, setViewed] = useState<Record<number, boolean>>({});
  const [muted, setMuted] = useState(false);

  const close = useCallback(() => setCurrentProfile(null), []);
  const toggleMute = useCallback(() => setMuted((value) => !value), []);

  // Move on to the next profile, or close when there are none left.
  const showNextProfile = useCallback(() => {
    setCurrentProfile((index) => {
      if (index === null) {
        return null;
      }
      setViewed((seen) => ({ ...seen, [PROFILES[index].id]: true }));
      return index < PROFILES.length - 1 ? index + 1 : null;
    });
  }, []);

  const showPreviousProfile = useCallback(() => {
    setCurrentProfile((index) =>
      index === null || index === 0 ? null : index - 1
    );
  }, []);

  const profile = currentProfile === null ? null : PROFILES[currentProfile];

  // Build the header per story at render time, so it always reflects the
  // profile that is actually showing.
  const stories = useMemo<Story[]>(() => {
    if (!profile) {
      return [];
    }
    const header = (
      <View style={styles.header}>
        <View style={styles.headerProfile}>
          <Image
            style={styles.headerAvatar}
            source={{ uri: profile.profileImage }}
          />
          <Text style={styles.headerName}>{profile.profileName}</Text>
        </View>
        <View style={styles.headerButtons}>
          <Pressable onPress={toggleMute} hitSlop={8}>
            <Text style={styles.headerButton}>{muted ? '🔇' : '🔊'}</Text>
          </Pressable>
          <Pressable onPress={close} hitSlop={8}>
            <Text style={styles.headerButton}>✕</Text>
          </Pressable>
        </View>
      </View>
    );
    return profile.stories.map((story) => ({ ...story, header }));
  }, [profile, muted, toggleMute, close]);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.screen} edges={['top']}>
        <StatusBar barStyle="dark-content" />
        {/* You can also use a FlatList here */}
        <ScrollView horizontal contentContainerStyle={styles.rail}>
          {PROFILES.map((item, index) => (
            <Pressable
              key={item.id}
              onPress={() => setCurrentProfile(index)}
              style={styles.railItem}
            >
              <View
                style={[
                  styles.ring,
                  viewed[item.id] ? styles.ringViewed : styles.ringNew,
                ]}
              >
                <Image style={styles.avatar} source={{ uri: item.profileImage }} />
              </View>
              <Text numberOfLines={1} style={styles.railName}>
                {item.profileName}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
        {profile && (
          <Stories
            stories={stories}
            isMuted={muted}
            // No more stories for this profile, so move on to the next one
            onAllStoriesEnd={showNextProfile}
            // No more stories to go back to, so go back a profile
            onPreviousFirstStory={showPreviousProfile}
            // Android hardware back button
            onClose={close}
            // Fired for every story shown: ideal for "viewed" tracking
            onStoryStart={(index, story) => console.log('viewing', index, story.media)}
          />
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fff' },
  rail: { paddingHorizontal: 12, paddingVertical: 16 },
  railItem: { alignItems: 'center', marginHorizontal: 6, width: 76 },
  ring: { borderWidth: 2, borderRadius: 40, padding: 3 },
  ringNew: { borderColor: '#25D366' },
  ringViewed: { borderColor: '#D3D3D3' },
  avatar: { width: 64, height: 64, borderRadius: 32 },
  railName: { fontSize: 12, marginTop: 4 },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  headerProfile: { flexDirection: 'row', alignItems: 'center' },
  headerAvatar: { height: 36, width: 36, borderRadius: 18 },
  headerName: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 10,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowRadius: 4,
  },
  headerButtons: { flexDirection: 'row', alignItems: 'center' },
  headerButton: { color: '#fff', fontSize: 22, marginLeft: 16 },
});
```

</details>

The runnable version, with SVG icons and a gradient header, lives in [`example/`](https://github.com/AbdullahAnsarii/rn-story/tree/master/example) (Expo SDK 57).

## Upgrading to 3.0

Version 3.0 moves video playback from the deprecated `expo-av` to `expo-video`, which is also what makes the demo run in today's Expo Go. Most apps only need to swap the dependency:

```sh
npx expo uninstall expo-av   # if nothing else in your app uses it
npx expo install expo-video react-native-safe-area-context
```

| Change | What to do |
| --- | --- |
| Peer dependency is `expo-video` instead of `expo-av` | Install `expo-video` (SDK 52+, or `expo-video` ≥ 2.0 in a bare app) and rebuild native code. `expo-av` can go if nothing else uses it. |
| Minimum versions: Expo SDK 52, React Native 0.76, React 18 | Older apps can stay on `rn-story@2`. |
| Safe areas come from `react-native-safe-area-context` when installed | Install it (most apps have it) or pass `safeAreaInsets`. React Native's deprecated `SafeAreaView` is only used as a fallback on iOS. On Android the viewer now draws behind the status bar, Instagram-style. |
| The status bar turns light while the viewer is open | Pass `statusBarStyle={null}` to keep your own. |
| A video story ends when the video does | Previously the bar could finish a little before or after the picture. A story with an explicit `duration` still follows that duration. |
| The next video is preloaded, not just the next image | Nothing to do; `preloadNext={false}` turns both off. |
| The loader gives up after `videoDurationTimeout` for images too | An image whose load never finishes no longer holds the viewer forever. |

New in 3.0: `onStoryStart`, `imageProps`, `videoProps`, `renderImage`, `configurePlayer`, `safeAreaInsets`, `modalProps`, `statusBarStyle`, `animationBarBackgroundColor`, and `headers` on the `Story` object. The `Story` shape and every 2.x prop otherwise work unchanged.

<details>
<summary>Upgrading from 1.x</summary>

Version 2.0 fixed the published build (it previously crashed with `ReferenceError: React is not defined` outside Metro) and a number of playback bugs. A few behaviors changed along the way:

| Change | What to do |
| --- | --- |
| `onNext` / `onPrevious` no longer fire at the ends of the list | On the last story only `onAllStoriesEnd` fires; on the first story only `onPreviousFirstStory` fires. Move any end-of-list logic into those callbacks. |
| Default loader is an `ActivityIndicator` | It was the text "Loading...". Pass `loadingComponent` to customize it. |
| Empty `stories` renders nothing | It used to render a full-screen loader with no way out. Render your own placeholder while fetching. |
| `header` / `loadingComponent` are typed as `ReactNode` | Strings and arrays are accepted too; existing `JSX.Element` values keep working. |

</details>

## Roadmap

- Swipe down to close
- Cube transition between profiles

## Contributing

Contributions are welcome! See the [contributing guide](CONTRIBUTING.md) for the development workflow. Found a bug? [Open an issue](https://github.com/AbdullahAnsarii/rn-story/issues).

## License

[MIT](./LICENSE) © [Abdullah Ansari](https://github.com/AbdullahAnsarii)

---

<p align="center">Check out more projects at <a href="https://abdullahansari.me">abdullahansari.me</a></p>
