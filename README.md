# <center>rn story</center>

### <center>React Native component for stories like instagram, whatsapp and snapchat</center>
  
<center>
<img  height="600"  src="https://firebasestorage.googleapis.com/v0/b/fir-demo-48533.appspot.com/o/rn-story-preview.png?alt=media&token=5a0aada6-f69f-4a06-8f6f-cf7ffef79ded"  alt="Demo screenshot"/>
</center>

---

## Installation

```sh
npm install rn-story
```

## Usage

```jsx
import  Stories  from  'rn-story';


//minimal usage

<Stories  stories={stories}  />
```
[Full example](#full-example)

## Props

| Property                | Type        | Default        | Description                                                                                                                                 |
| ----------------------- | ----------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `stories`               | StoryType[] | `required`     | An array of story objects [StoryType object](#story-object)                                                                                 |
| **Optional props**      | ⭐️           | ⭐️              | ⭐️                                                                                                                                           |
| `currentIndex`          | number      | `0`            | Set the current story index                                                                                                                 |
| `isMuted`               | boolean     | `false`        | Switch to mute video story                                                                                                                  |
| `videoVolume`           | number      | `1.0`          | Control the volume of video                                                                                                                 |
| `isAnimationBarRounded` | boolean     | `true`         | Switch to changed the shape from rectangular animation bar to rounded                                                                       |
| `animationBarHeight`    | number      | `2`            | Modify the height of animation bar                                                                                                          |
| `animationBarColor`     | string      | `#fff`         | Modify the color of animation bar                                                                                                           |
| `seeMoreText`           | string      | "View Details" | Change the text of **See More** button, *required `seeMoreUrl` to be set is Story Object.*                                                  |
| `seeMoreStyles`         | ViewStyle   | `{}`           | Override the styles of **See More** button container, *required `seeMoreUrl` to be set is Story Object.*                                    |
| `seeMoreTextStyles`     | TextStyle   | `{}`           | Override the styles of **See More** button text, *required `seeMoreUrl` to be set is Story Object.*                                         |
| `onPrevious`            | Function    | -              | Callback when the user taps/press to proceed to the previous story                                                                          |
| `onPreviousEnd`         | Function    | -              | Callback when the user taps/press to proceed to the previous story but you are on the first story, i.e there are no more stories to go back |
| `onNext`                | Function    | -              | Callback when the user taps/press to proceed to the next story                                                                              |
| `onNextEnd`             | Function    | -              | Callback when the user taps/press to go back to the previous story but you are on the first story, i.e there are no more stories to go back |


### Story object

A simple 'story object' needs to be passed in the `stories` array.

| Property     | Description                                                                                 |
| ------------ | ------------------------------------------------------------------------------------------- |
| `media`      | The url of the resource, be it image or video.                                              |
| `mediaType`  | Type of the story. `type: 'video'                                                           | 'image'`. Type `video` is necessary for a video story. |
| `duration?`  | Optional. Duration for which a story should persist.                                        |
| `seeMoreUrl` | Optional. Shows the See More button at the bottom and adds the url for that button as well. |

  
  ## Full Example
[Full soure code for the example available here](https://github.com/AbdullahAnsarii/rn-story/tree/master/example)

```typescript
import { useState } from 'react';
import { StyleSheet, SafeAreaView, FlatList, Pressable, View, Image, Text, Dimensions, StatusBar } from 'react-native';
import Stories from 'rn-story';

const data = [
  {
    profileImage: 'https://firebasestorage.googleapis.com/v0/b/fir-demo-48533.appspot.com/o/IMG_1339.png?alt=media&token=46318228-a75d-4ea5-8beb-e37978d520a9&_gl=1*1339f4z*_ga*Nzc2MTE5NjIzLjE2ODYzMTE4Mzc.*_ga_CW55HF8NVT*MTY4NjMxMTgzNy4xLjEuMTY4NjMxMTk3Ni4wLjAuMA',
    profileName: 'Abdullah Ansari',
    viewed: false,
    id: 1,
    stories: [
      {
        media: 'https://firebasestorage.googleapis.com/v0/b/fir-demo-48533.appspot.com/o/1-1.jpg?alt=media&token=91d1f0f4-cf45-41ee-9a51-08b348093b92&_gl=1*87eejn*_ga*MTYwNzQ2OTU4Mi4xNjgxNjQ2NDk5*_ga_CW55HF8NVT*MTY4NTQ1MDE3NC4xMi4xLjE2ODU0NTIxMTYuMC4wLjA',
        mediaType: 'image',
        seeMoreUrl: 'https://abdullahansari.me',
        duration: 12000
      },
      {
        media: 'https://firebasestorage.googleapis.com/v0/b/fir-demo-48533.appspot.com/o/1-2.jpg?alt=media&token=213211d6-d1e6-4b41-bb58-0f23ecaf071e&_gl=1*17ngmn8*_ga*MTYwNzQ2OTU4Mi4xNjgxNjQ2NDk5*_ga_CW55HF8NVT*MTY4NTQ1MDE3NC4xMi4xLjE2ODU0NTIxNDEuMC4wLjA',
        mediaType: 'image',
      },
      {
        media: 'https://firebasestorage.googleapis.com/v0/b/fir-demo-48533.appspot.com/o/1-3.jpeg?alt=media&token=4707dc6f-4a76-4a9d-8a6f-25018bd39ca3&_gl=1*1js6o8c*_ga*MTYwNzQ2OTU4Mi4xNjgxNjQ2NDk5*_ga_CW55HF8NVT*MTY4NTQ1MDE3NC4xMi4xLjE2ODU0NTIxNzQuMC4wLjA',
        mediaType: 'image',
      },
    ]
  },
  {
    profileImage: 'https://firebasestorage.googleapis.com/v0/b/fir-demo-48533.appspot.com/o/IMG_1339.png?alt=media&token=46318228-a75d-4ea5-8beb-e37978d520a9&_gl=1*1339f4z*_ga*Nzc2MTE5NjIzLjE2ODYzMTE4Mzc.*_ga_CW55HF8NVT*MTY4NjMxMTgzNy4xLjEuMTY4NjMxMTk3Ni4wLjAuMA',
    profileName: 'Abdullah Ansari',
    viewed: false,
    id: 2,
    stories: [
      {
        media: 'https://firebasestorage.googleapis.com/v0/b/fir-demo-48533.appspot.com/o/2-1.mp4?alt=media&token=11343c81-7f87-4e5b-ab30-39c044896ed2&_gl=1*1stfme0*_ga*MTYwNzQ2OTU4Mi4xNjgxNjQ2NDk5*_ga_CW55HF8NVT*MTY4NTQ1MDE3NC4xMi4xLjE2ODU0NTIyMDguMC4wLjA',
        mediaType: 'video',
      },
      {
        media: 'https://firebasestorage.googleapis.com/v0/b/fir-demo-48533.appspot.com/o/2-2.jpeg?alt=media&token=9267a48c-75be-4705-8c4c-5aa65c4a4a48&_gl=1*8mcrey*_ga*MTYwNzQ2OTU4Mi4xNjgxNjQ2NDk5*_ga_CW55HF8NVT*MTY4NTQ1MDE3NC4xMi4xLjE2ODU0NTIyMTMuMC4wLjA',
        mediaType: 'image',
      },
      {
        media: 'https://firebasestorage.googleapis.com/v0/b/fir-demo-48533.appspot.com/o/2-3.mp4?alt=media&token=952913cd-f51d-4b14-8edc-7e733fb6007c&_gl=1*lscv55*_ga*MTYwNzQ2OTU4Mi4xNjgxNjQ2NDk5*_ga_CW55HF8NVT*MTY4NTQ1MDE3NC4xMi4xLjE2ODU0NTIyMTcuMC4wLjA',
        mediaType: 'video',
      },
    ]
  },
  {
    profileImage: 'https://firebasestorage.googleapis.com/v0/b/fir-demo-48533.appspot.com/o/IMG_1339.png?alt=media&token=46318228-a75d-4ea5-8beb-e37978d520a9&_gl=1*1339f4z*_ga*Nzc2MTE5NjIzLjE2ODYzMTE4Mzc.*_ga_CW55HF8NVT*MTY4NjMxMTgzNy4xLjEuMTY4NjMxMTk3Ni4wLjAuMA',
    profileName: 'Abdullah Ansari',
    viewed: false,
    id: 3,
    stories: [
      {
        media: 'https://firebasestorage.googleapis.com/v0/b/fir-demo-48533.appspot.com/o/3-3.jpeg?alt=media&token=364a85b9-97d6-4761-a25d-91e4e493e198&_gl=1*1kh5br9*_ga*MTYwNzQ2OTU4Mi4xNjgxNjQ2NDk5*_ga_CW55HF8NVT*MTY4NTQ1MDE3NC4xMi4xLjE2ODU0NTIyNzEuMC4wLjA',
        mediaType: 'image',
      },
      {
        media: 'https://firebasestorage.googleapis.com/v0/b/fir-demo-48533.appspot.com/o/3-1.mp4?alt=media&token=a99ff8d7-022d-43d1-bb31-dc85de7da75f&_gl=1*nm8mzg*_ga*MTYwNzQ2OTU4Mi4xNjgxNjQ2NDk5*_ga_CW55HF8NVT*MTY4NTQ1MDE3NC4xMi4xLjE2ODU0NTIyNTQuMC4wLjA',
        mediaType: 'video',
      },
    ]
  },
];

export default function App() {
  const [currentStoryIndex, setCurrentStoryIndex] = useState<number | null>(null);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar />
      <FlatList
        horizontal
        data={data}
        keyExtractor={(item) => "story-" + item.id.toString()}
        renderItem={({ item, index }) => (
          <Pressable
            onPress={() => setCurrentStoryIndex(index)}
            style={[styles.storyContainer]}
          >
            <View
              style={[styles.imageContainer,
              item.viewed ? styles.viewedStory : styles.newStory]}>
              <Image
                style={[styles.storyImage]}
                resizeMode={"cover"}
                source={{ uri: item?.profileImage }}
              />
            </View>
            <Text
              numberOfLines={1}
              style={[styles.profileNameHorizontal]}
            >
              {item?.profileName}
            </Text>
          </Pressable>
        )}
        ItemSeparatorComponent={() => <View style={{ width: 12, height: 12 }} />}
      />

      {currentStoryIndex !== null && (
        <Stories
          stories={data[currentStoryIndex].stories}
          onNextEnd={() => setCurrentStoryIndex(null)}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  storyContainer: {
    alignItems: 'center',
  },
  verticalContainer: {
    flexDirection: 'row'
  },
  imageContainer: {
    borderWidth: 2,
    borderRadius: 50,
    padding: 3
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
  profileNameVertical: {
    width: Dimensions?.get('window')?.width / 1.5,
    marginLeft: 12
  }
});
```

 - Types
 ```ts
 export  type  Data = {

	profileName: string;

	profileImage: string;

	id: string | number;

	stories: Story[];

	viewed: boolean;

}

export  type  Story = {

	media: string;

	mediaType: "image" | "video";

	duration?: number;

	seeMoreUrl?: string

}
 ```

## Contributing

  

  

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

  

  

## License

  

  

MIT © [AbdullahAnsarii](https://github.com/AbdullahAnsarii)

  

Check out more projects at https://abdullahansari.me