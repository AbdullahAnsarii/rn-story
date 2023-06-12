import { useState } from 'react';
import { StyleSheet, SafeAreaView, Pressable, View, Image, Text, Dimensions, StatusBar, ScrollView } from 'react-native';
import Stories from 'rn-story';

export default function App() {
  const data: Data[] = [
    {
      profileImage:
        'https://shorturl.at/fhUV1',
      profileName: 'Abdullah Ansari',
      viewed: false,
      id: 1,
      stories: [
        {
          media: 'https://shorturl.at/mpwQ1',
          mediaType: 'image',
          seeMoreUrl: 'https://abdullahansari.me'
        },
        {
          media: 'https://shorturl.at/jpJ58',
          mediaType: 'image',
          duration: 12000
        },
        {
          media: 'https://shorturl.at/ckvyT',
          mediaType: 'image',
        },
      ]
    },
    {
      profileImage:
        'https://shorturl.at/fhUV1',
      profileName: 'Abdullah Ansari',
      viewed: false,
      id: 2,
      stories: [
        {
          media: 'https://shorturl.at/DEKP1',
          mediaType: 'video',
        },
        {
          media: 'https://shorturl.at/pJZ28',
          mediaType: 'image',
        }
      ]
    }
  ];
  //setting this state to null will close the story view
  const [currentStoryIndex, setCurrentStoryIndex] = useState<number | null>(null);

  return (
    <SafeAreaView >
      <StatusBar />
      {/* you can also use FlatList here */}
      <ScrollView horizontal>
        {data.map((story, index) => (
          <Pressable
            key={"story-" + story.id}
            onPress={() => setCurrentStoryIndex(index)}
            style={[styles.storyContainer]}>
            <View
              style={[styles.imageContainer,
              story.viewed ? styles.viewedStory : styles.newStory]}>
              <Image
                style={[styles.storyImage]}
                resizeMode={"cover"}
                source={{ uri: story?.profileImage }}
              />
            </View>
            <Text
              numberOfLines={1}
              style={[styles.profileNameHorizontal]}>
              {story?.profileName}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
      {currentStoryIndex !== null &&
        <Stories
          stories={data[currentStoryIndex].stories}
          //called when user taps on next
          onNext={() => console.log('next pressed')}
          //called when user taps on previous
          onPrevious={() => console.log('previous pressed')}
          // close story view if there are no more stories to go next to
          onAllStoriesEnd={() => setCurrentStoryIndex(null)}
          //close story view if there are no more stories to go back to
          onPreviousFirstStory={() => setCurrentStoryIndex(null)}
        />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  storyContainer: {
    alignItems: 'center'
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
  }
});

export type Data = {
  profileName: string;
  profileImage: string;
  id: string | number;
  stories: Story[];
  viewed: boolean;
}
export type Story = {
  media: string;
  mediaType: "image" | "video";
  duration?: number;
  seeMoreUrl?: string
}


