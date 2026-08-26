<h1 style="margin: 0" align="center">rn-story</h1>

### Lightweight React Native component for stories like Instagram, Whatsapp and Snapchat.
<br>

<img  height="600"  src="https://firebasestorage.googleapis.com/v0/b/fir-demo-48533.appspot.com/o/rn-story-preview.png?alt=media&token=5a0aada6-f69f-4a06-8f6f-cf7ffef79ded"  alt="Demo screenshot"/>

---

  

## Installation

`expo-av` is a peer dependency, so install it alongside the package with the
version that matches your Expo SDK:

```sh
npx expo install rn-story expo-av
```

Not using Expo? Install both with your package manager and make sure `expo-av`
is [configured for bare React Native](https://docs.expo.dev/bare/installing-expo-modules/):

```sh
npm install rn-story expo-av
```

## Features
- Typescript support.
- Expo support. 
- Video stories support.
- Next and previous callbacks.
- mute/unmute support.
- Video volume modification support.
- See more url support.
- Custom header support.
- Support for custom loading component.
  

## Usage

  

  

```jsx
import  Stories  from  'rn-story';

//minimal usage

<Stories  stories={stories}  />
```
[Full example](#example)

The `Story` and `StoriesProps` types are exported for Typescript users:

```ts
import type { Story, StoriesProps } from 'rn-story';
```


  
  


## Props

| Property               | Type            | Default                   | Description                                                                                                                                                         |
| ---------------------- | --------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `stories`              | Story[] | `required`                | An array of story objects [Story object](#story-object) 
| **Optional props**          | ⭐️             | ⭐️                 | ⭐️                                                                                                                                                                 |                                                                                   
| `currentIndex`         | number        | `0`                      | Set the current story index. Updating it after mount jumps to that story.                                                                                             |
| `isMuted`      | boolean          | `false`                      | Switch to mute video story                                                                                                                    |
| `videoVolume`   | number         | `1.0`                     | Control the volume of video       |
| `isAnimationBarRounded`               | boolean       | `true`                                                                                                     | Switch to changed the shape from rectangular animation bar to rounded
| `animationBarHeight`               | number       | `2` | Modify the height of animation bar |
| `animationBarColor` | string          | `#fff`         | Modify the color of animation bar                                                                                                                |
| `seeMoreText`                | string   | "View Details"                      | Change the text of **See More** button, *required `seeMoreUrl` to be set is Story Object.*                                                                                                         |
| `seeMoreStyles`               | ViewStyle   | `{}`    | Override the styles of **See More** button container, *required `seeMoreUrl` to be set is Story Object.*                                                                                                          |
| `seeMoreTextStyles`          | TextStyle          | `{}`                  | Override the styles of **See More** button text, *required `seeMoreUrl` to be set is Story Object.*                                                                                                                 |
| `onPrevious`         | () => void        | -                         | Callback when the user taps/press to go back to the previous story. Not called on the first story — see `onPreviousFirstStory`.                                       |
| `onPreviousFirstStory`          | () => void        | -                         | Callback when the user taps/press to go back to the previous story but you are on the first story, i.e there are no more stories to go back (suitable for closing story view or update index to show previous profile story)                                                                                                                                        |
| `onNext`               | () => void        | -                         | Callback when the user taps/press to proceed to the next story. Not called on the last story — see `onAllStoriesEnd`.                                                 |
| `onAllStoriesEnd`           | () => void        | -                         | Callback when the user taps/press to proceed to next story but you are on the last story, i.e there are no more stories to go forward (suitable for closing story view or update index to show next story) |
| `onClose`           | () => void        | -                         | Callback for the Android hardware back button. Without it the back button does nothing while the story view is open. |
| `loadingComponent`           | ReactNode        | `<ActivityIndicator />`                         |  Override default loading component with custom loading component |


### Story object

A simple 'story object' needs to be passed in the `stories` array.

| Property           | Type | Description                                                                                                              |
| ------------------ | ---- | ------------------------------------------------------------------------------------------------------------------------ |
| `media`              | string | The url of the resource, be it image or video.                                                                         |
| `mediaType`             | `'image'` \| `'video'` | Type of the story. `'video'` is necessary for a video story.                                    |
| `duration?`         | number | Optional. How long the story stays on screen, in milliseconds. Defaults to `3000` for images, and to the video's own duration for videos. |
| `header?`         | ReactNode | Optional. Header component which will be displayed just below animation bars, ideal for avatar, close button and linear gradient. |
| `seeMoreUrl?`          | string | Optional. Shows the See More button at the bottom and adds the url for that button as well.                            |

  
## Example

### Just copy and paste the following code.

 ```jsx
import { LinearGradient } from 'expo-linear-gradient';
import * as React from 'react';
import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, SafeAreaView, Pressable, View, Image, Text, Dimensions, StatusBar, ScrollView, Platform } from 'react-native';
import Stories from 'rn-story';
import type { Story } from 'rn-story';
const { width } = Dimensions.get('window');

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
        {/* THE AVATAR AND USERNAME  */}
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
          {/* END OF THE AVATAR AND USERNAME */}
        </View>
        <View style={styles.iconContainer}>
          {/* THE CLOSE BUTTON */}
          <Pressable style={styles.closeButton} onPress={close}>
            {/* You can replace it with a close icon */}
            <Text style={{ color: '#fff' }}>Close</Text>
          </Pressable>
          {/* END OF CLOSE BUTTON */}
        </View>
      </View>
    );

    return profile.stories.map((story) => ({ ...story, header }));
  }, [profile, close]);

  return (
    <SafeAreaView>
      <StatusBar />
      {/* you can also use FlatList here */}
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
          //called when user taps on next
          onNext={() => console.log('next')}
          //called when user taps on previous
          onPrevious={() => console.log('previous')}
          // no more stories for this profile, so move on to the next one
          onAllStoriesEnd={showNextProfile}
          // no more stories to go back to, so go back a profile
          onPreviousFirstStory={showPreviousProfile}
          // android hardware back button
          onClose={close}
          //custom loading component
          loadingComponent={<Text style={styles.loading}>Custom Loading...</Text>}
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

export type Profile = {
  profileName: string;
  profileImage: string;
  id: string | number;
  stories: Story[];
};
 ```
[Full soure code for the example available here](https://github.com/AbdullahAnsarii/rn-story/tree/master/example)
 

## Upgrading to 2.0

- **`expo-av` is now a peer dependency.** Install it yourself, ideally with
  `npx expo install expo-av` so the version matches your Expo SDK. Previously
  the package pinned its own copy, which clashed with newer SDKs.
- **`onNext` and `onPrevious` no longer fire at the ends of the list.** On the
  last story only `onAllStoriesEnd` fires, and on the first story only
  `onPreviousFirstStory` fires. If you relied on both firing together, move that
  logic into the end callbacks.
- **The default loading component is now an `ActivityIndicator`** instead of the
  text "Loading...". Pass `loadingComponent` to restore your own.
- **An empty `stories` array now renders nothing** instead of a full screen
  loader. With no story there is no header to close from, so the modal had no
  way out. Render your own placeholder while you are still fetching.
- `header` and `loadingComponent` are typed as `ReactNode` rather than
  `JSX.Element`, so strings and arrays are accepted too.

## Upcoming Features
- Support for custom see more component.
- SafeAreaView toggle

## Contributing
See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## License
MIT © [AbdullahAnsarii](https://github.com/AbdullahAnsarii)

  

Check out more projects at https://abdullahansari.me
