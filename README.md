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
  <img height="600" src="https://firebasestorage.googleapis.com/v0/b/fir-demo-48533.appspot.com/o/rn-story-preview.png?alt=media&token=5a0aada6-f69f-4a06-8f6f-cf7ffef79ded" alt="rn-story demo — a full screen story with progress bars, avatar header and See More button" />
</p>

## Features

- 📸 **Image and video stories** with an animated progress bar per story
- 👆 **Familiar gestures** — tap right for next, tap left for previous, long-press to pause
- 🔗 **"See More" link** support per story, opened via `Linking`
- 🧩 **Custom header** (avatar, close button, gradient) and custom loading component
- 🔊 **Video volume and mute** controls
- 📞 **Navigation callbacks** for building multi-profile story flows
- 🛡️ **TypeScript-first** — all props and the `Story` object are fully typed
- 🪶 **Lightweight** — one component, no native code of its own, works with Expo out of the box

## Installation

[`expo-av`](https://docs.expo.dev/versions/latest/sdk/av/) is a peer dependency. Install it alongside the package so the version matches your Expo SDK:

```sh
npx expo install rn-story expo-av
```

<details>
<summary>Bare React Native (without Expo)</summary>

Install both packages with your package manager, and make sure [Expo modules are configured](https://docs.expo.dev/bare/installing-expo-modules/) in your project:

```sh
npm install rn-story expo-av
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

See the [full example](#full-example) below for a complete multi-profile setup with avatars, headers, and viewed indicators.

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
| `isMuted` | `boolean` | `false` | Mute video stories. |
| `videoVolume` | `number` | `1.0` | Volume of video stories, `0.0`–`1.0`. |
| `isAnimationBarRounded` | `boolean` | `true` | Rounded ends on the progress bars. |
| `animationBarHeight` | `number` | `2` | Height of the progress bars. |
| `animationBarColor` | `string` | `"#fff"` | Fill color of the progress bars. |
| `seeMoreText` | `string` | `"View Details"` | Label of the **See More** button (shown when the story has a `seeMoreUrl`). |
| `seeMoreStyles` | `ViewStyle` | — | Style overrides for the **See More** button container. |
| `seeMoreTextStyles` | `TextStyle` | — | Style overrides for the **See More** button text. |
| `loadingComponent` | `ReactNode` | `<ActivityIndicator />` | Rendered while the current story's media is loading. |

> **Note:** an empty `stories` array renders nothing, so it is safe to render `<Stories />` while your data is still loading.

### Story object

| Property | Type | Description |
| --- | --- | --- |
| `media` | `string` | URL of the image or video. |
| `mediaType` | `'image' \| 'video'` | Type of the story. |
| `duration?` | `number` | How long the story stays on screen, in milliseconds. Defaults to `3000` for images and to the video's own length for videos. |
| `header?` | `ReactNode` | Rendered just below the progress bars — ideal for an avatar, username, close button, or gradient. |
| `seeMoreUrl?` | `string` | Shows a **See More** button at the bottom that opens this URL. |

### TypeScript

All types are exported:

```ts
import type { Story, StoriesProps, StoryMediaType } from 'rn-story';
```

## Full example

A complete multi-profile setup — an avatar rail, per-profile stories, a header with a close button, and viewed indicators.

<details>
<summary>Show the full example</summary>

```tsx
import { LinearGradient } from 'expo-linear-gradient';
import * as React from 'react';
import { useCallback, useMemo, useState } from 'react';
import {
  StyleSheet,
  SafeAreaView,
  Pressable,
  View,
  Image,
  Text,
  Dimensions,
  StatusBar,
  ScrollView,
  Platform,
} from 'react-native';
import Stories from 'rn-story';
import type { Story } from 'rn-story';

const { width } = Dimensions.get('window');

type Profile = {
  profileName: string;
  profileImage: string;
  id: string | number;
  stories: Story[];
};

const PROFILES: Profile[] = [
  {
    profileImage: 'https://shorturl.at/fhUV1',
    profileName: 'Abdullah Ansari',
    id: 1,
    stories: [
      {
        media: 'https://shorturl.at/mpwQ1',
        mediaType: 'image',
        seeMoreUrl: 'https://abdullahansari.me',
      },
      {
        media: 'https://shorturl.at/jpJ58',
        mediaType: 'image',
        duration: 12000,
      },
      {
        media: 'https://shorturl.at/ckvyT',
        mediaType: 'image',
      },
    ],
  },
  {
    profileImage: 'https://shorturl.at/fhUV1',
    profileName: 'Abdullah Ansari 2',
    id: 2,
    stories: [
      {
        media: 'https://shorturl.at/DEKP1',
        mediaType: 'video',
      },
      {
        media: 'https://shorturl.at/pJZ28',
        mediaType: 'image',
      },
    ],
  },
];

export default function App() {
  // Setting this state to null closes the story view.
  const [currentProfile, setCurrentProfile] = useState<number | null>(null);
  const [viewed, setViewed] = useState<Record<string | number, boolean>>({});

  const close = useCallback(() => setCurrentProfile(null), []);

  // Move on to the next profile, or close when there are none left.
  const showNextProfile = useCallback(() => {
    if (currentProfile === null) {
      return;
    }
    const id = PROFILES[currentProfile].id;
    setViewed((seen) => ({ ...seen, [id]: true }));
    setCurrentProfile(
      currentProfile < PROFILES.length - 1 ? currentProfile + 1 : null
    );
  }, [currentProfile]);

  const showPreviousProfile = useCallback(() => {
    if (currentProfile === null) {
      return;
    }
    setCurrentProfile(currentProfile === 0 ? null : currentProfile - 1);
  }, [currentProfile]);

  const profile = currentProfile === null ? null : PROFILES[currentProfile];

  // Build the header per story at render time, so it always reflects the
  // profile that is actually showing.
  const stories = useMemo<Story[]>(() => {
    if (!profile) {
      return [];
    }
    const header = (
      <View style={[styles.avatarAndIconsContainer]}>
        <View style={[styles.avatarAndIconsContainer]}>
          <LinearGradient
            colors={['rgba(0,0,0,0.25)', 'transparent']}
            style={[styles.linearGradient]}
          />
          <View style={styles.avatarAndProfileContainer}>
            <Image
              style={[styles.profileImage]}
              source={{ uri: profile.profileImage }}
            />
            <View>
              <Text
                numberOfLines={1}
                style={[{ width: width / 1.75 }, styles.profileName]}
              >
                {profile.profileName}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.iconContainer}>
          <Pressable style={styles.closeButton} onPress={close}>
            {/* You can replace this with a close icon */}
            <Text style={{ color: '#fff' }}>Close</Text>
          </Pressable>
        </View>
      </View>
    );

    return profile.stories.map((story) => ({ ...story, header }));
  }, [profile, close]);

  return (
    <SafeAreaView>
      <StatusBar />
      {/* You can also use a FlatList here */}
      <ScrollView horizontal>
        {PROFILES.map((item, index) => (
          <Pressable
            key={'story-' + item.id}
            onPress={() => setCurrentProfile(index)}
            style={[styles.storyContainer]}
          >
            <View
              style={[
                styles.imageContainer,
                viewed[item.id] ? styles.viewedStory : styles.newStory,
              ]}
            >
              <Image
                style={[styles.storyImage]}
                resizeMode={'cover'}
                source={{ uri: item.profileImage }}
              />
            </View>
            <Text numberOfLines={1} style={[styles.profileNameHorizontal]}>
              {item.profileName}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
      {profile && (
        <Stories
          stories={stories}
          // Called when the user taps to the next story
          onNext={() => console.log('next')}
          // Called when the user taps back to the previous story
          onPrevious={() => console.log('previous')}
          // No more stories for this profile, so move on to the next one
          onAllStoriesEnd={showNextProfile}
          // No more stories to go back to, so go back a profile
          onPreviousFirstStory={showPreviousProfile}
          // Android hardware back button
          onClose={close}
          // Custom loading component
          loadingComponent={<Text style={styles.loading}>Loading…</Text>}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  storyContainer: {
    alignItems: 'center',
  },
  imageContainer: {
    borderWidth: 2,
    borderRadius: 50,
    padding: 3,
  },
  newStory: {
    borderColor: '#25D366',
  },
  viewedStory: {
    borderColor: '#D3D3D3',
  },
  storyImage: {
    height: 64,
    width: 64,
    borderRadius: 50,
  },
  profileNameHorizontal: {
    width: Dimensions?.get('window')?.width / 5,
    textAlign: 'center',
  },
  avatarAndIconsContainer: {
    height: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  linearGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: Platform.OS === 'ios' ? -64 : 0,
    height: 60,
  },
  avatarAndProfileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  profileImage: {
    height: 36,
    width: 36,
    borderRadius: 25,
  },
  profileName: {
    color: '#fff',
    marginLeft: 12,
  },
  iconContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginRight: 12,
  },
  closeButton: {
    marginLeft: 12,
  },
  loading: {
    color: '#fff',
  },
});
```

</details>

The runnable version lives in [`example/`](https://github.com/AbdullahAnsarii/rn-story/tree/master/example).

## Upgrading from 1.x

Version 2.0 fixed the published build (it previously crashed with `ReferenceError: React is not defined` outside Metro) and a number of playback bugs. A few behaviors changed along the way:

| Change | What to do |
| --- | --- |
| `expo-av` is now a **peer dependency** | Install it yourself: `npx expo install expo-av`. Previously the package pinned its own copy, which clashed with newer Expo SDKs. |
| `onNext` / `onPrevious` no longer fire at the ends of the list | On the last story only `onAllStoriesEnd` fires; on the first story only `onPreviousFirstStory` fires. Move any end-of-list logic into those callbacks. |
| Default loader is an `ActivityIndicator` | It was the text "Loading...". Pass `loadingComponent` to customize it. |
| Empty `stories` renders nothing | It used to render a full-screen loader with no way out. Render your own placeholder while fetching. |
| `header` / `loadingComponent` are typed as `ReactNode` | Strings and arrays are accepted too; existing `JSX.Element` values keep working. |

New in 2.0: `stories` and `currentIndex` are reactive after mount (swap in the next profile's stories without remounting), an `onClose` prop for the Android back button, and exported `Story` / `StoriesProps` / `StoryMediaType` types.

## Roadmap

- Custom **See More** component
- SafeAreaView toggle

## Contributing

Contributions are welcome! See the [contributing guide](CONTRIBUTING.md) for the development workflow. Found a bug? [Open an issue](https://github.com/AbdullahAnsarii/rn-story/issues).

## License

[MIT](./LICENSE) © [Abdullah Ansari](https://github.com/AbdullahAnsarii)

---

<p align="center">Check out more projects at <a href="https://abdullahansari.me">abdullahansari.me</a></p>
