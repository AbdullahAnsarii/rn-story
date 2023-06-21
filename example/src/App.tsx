import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { StyleSheet, SafeAreaView, Pressable, View, Image, Text, Dimensions, StatusBar, ScrollView, Platform } from 'react-native';
import Stories from 'rn-story';
const { width } = Dimensions.get('window');

export default function App() {
  const [data, setData] = useState<Data[]>([
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
      profileName: 'Abdullah Ansari 2',
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
  ]);
  //setting this state to null will close the story view
  const [currentStoryIndex, setCurrentStoryIndex] = useState<number | null>(null);

  useEffect(() => {
    //we are adding header to each story item
    const _tempData = [...data];
    _tempData.forEach((story) => {
      story.stories.forEach((storyItem) => {
        storyItem.header = <View style={[styles.avatarAndIconsContainer]}>
          {/* THE AVATAR AND USERNAME  */}
          <View style={[styles.avatarAndIconsContainer]}>
            <LinearGradient
              colors={[`rgba(0,0,0,0.25)`, 'transparent']}
              style={[styles.linearGradient]}
            />
            <View style={styles.avatarAndProfileContainer}>
              <Image
                style={[styles.profileImage]}
                source={{
                  uri: story?.profileImage
                }} />
              <View>
                <Text
                  numberOfLines={1}
                  style={[{ width: width / 1.75 }, styles.profileName]}>
                  {story?.profileName}
                </Text>
              </View>
            </View>
            {/* END OF THE AVATAR AND USERNAME */}
          </View>
          <View style={styles.iconContainer}>
            {/* THE CLOSE BUTTON */}
            <Pressable style={{ marginLeft: 12 }} onPress={() => setCurrentStoryIndex(null)}>
              {/* You can replace it with a close icon */}
              <Text style={{ color: "#fff" }}>Close</Text>
            </Pressable>
            {/* END OF CLOSE BUTTON */}
          </View>
        </View>
      });
    });
    setData(_tempData);
  }, []);

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
          onNext={() => console.log("next")}
          //called when user taps on previous
          onPrevious={() => console.log("previous")}
          // close story view if there are no more stories to go next to
          onAllStoriesEnd={() => setCurrentStoryIndex(null)}
          //close story view if there are no more stories to go back to
          onPreviousFirstStory={() => setCurrentStoryIndex(null)}
          //custom loading component
          loadingComponent={<Text style={{
            position: 'absolute',
            color: '#fff',
            bottom: Dimensions.get("window").height / 2,
            left: Dimensions.get("window").width / 2, transform: [{ translateX: -50 }]
          }}>Custom Loading...</Text>}
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
  },
  avatarAndIconsContainer: {
    height: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  linearGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: Platform.OS === "ios" ? -64 : 0,
    height: 60,
    width: Dimensions?.get('window')?.width,
  },
  avatarAndProfileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12
  },
  profileImage: {
    height: 36,
    width: 36,
    borderRadius: 25
  },
  profileName: {
    color: "#fff",
    marginLeft: 12
  },
  uploadedAt: {
    color: "#fff",
    marginLeft: 12
  },
  iconContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginRight: 12
  },
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
  header?: JSX.Element;
  seeMoreUrl?: string
}


