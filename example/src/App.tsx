import { useState } from 'react';
import { StyleSheet, SafeAreaView, FlatList, Pressable, View, Image, Text, Dimensions, StatusBar } from 'react-native';
import Stories from 'rn-story';
import type { Data } from 'src/types';

export default function App() {
  const data: Data[] = [
    {
      profileImage:
        'https://firebasestorage.googleapis.com/v0/b/fir-demo-48533.appspot.com/o/IMG_1339.png?alt=media&token=46318228-a75d-4ea5-8beb-e37978d520a9&_gl=1*1339f4z*_ga*Nzc2MTE5NjIzLjE2ODYzMTE4Mzc.*_ga_CW55HF8NVT*MTY4NjMxMTgzNy4xLjEuMTY4NjMxMTk3Ni4wLjAuMA',
      profileName: 'Abdullah Ansari',
      viewed: false,
      id: 1,
      stories: [
        {
          media: 'https://firebasestorage.googleapis.com/v0/b/fir-demo-48533.appspot.com/o/1-1.jpg?alt=media&token=91d1f0f4-cf45-41ee-9a51-08b348093b92&_gl=1*87eejn*_ga*MTYwNzQ2OTU4Mi4xNjgxNjQ2NDk5*_ga_CW55HF8NVT*MTY4NTQ1MDE3NC4xMi4xLjE2ODU0NTIxMTYuMC4wLjA',
          mediaType: 'image',
          date: '2023-05-31',
          seeMoreUrl: 'https://abdullahansari.me'
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
      profileImage:
        'https://firebasestorage.googleapis.com/v0/b/fir-demo-48533.appspot.com/o/IMG_1339.png?alt=media&token=46318228-a75d-4ea5-8beb-e37978d520a9&_gl=1*1339f4z*_ga*Nzc2MTE5NjIzLjE2ODYzMTE4Mzc.*_ga_CW55HF8NVT*MTY4NjMxMTgzNy4xLjEuMTY4NjMxMTk3Ni4wLjAuMA',
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
      profileImage:
        'https://firebasestorage.googleapis.com/v0/b/fir-demo-48533.appspot.com/o/IMG_1339.png?alt=media&token=46318228-a75d-4ea5-8beb-e37978d520a9&_gl=1*1339f4z*_ga*Nzc2MTE5NjIzLjE2ODYzMTE4Mzc.*_ga_CW55HF8NVT*MTY4NjMxMTgzNy4xLjEuMTY4NjMxMTk3Ni4wLjAuMA',
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
            style={[styles.storyContainer]}>
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
              style={[styles.profileNameHorizontal]}>
              {item?.profileName}
            </Text>
          </Pressable>
        )}
        ItemSeparatorComponent={() => <View
          style={{
            width: 12,
            height: 12
          }} />}
      />
      {currentStoryIndex !== null &&
        <Stories
          stories={data[currentStoryIndex].stories}
          // currentIndex={currentStoryIndex}
          onNext={() =>console.log('hooray')}
          onNextEnd={() =>console.log('jooray')}
          />}
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
    borderColor: '#D3D3D3'
  },
  storyImage: {
    height: 64,
    width: 64,
    borderRadius: 50
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
