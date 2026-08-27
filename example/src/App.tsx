import * as React from 'react';
import Close from '../assets/Close';
import { LinearGradient } from 'expo-linear-gradient';
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

const PROFILES: Profile[] = [
  {
    profileImage: 'https://picsum.photos/id/64/200/200',
    profileName: 'Abdullah Ansari',
    id: 1,
    stories: [
      {
        media: 'https://picsum.photos/id/1015/1080/1920',
        mediaType: 'image',
        seeMoreUrl: 'https://abdullahansari.me',
      },
      {
        media: 'https://picsum.photos/id/1016/1080/1920',
        mediaType: 'image',
        duration: 12000,
      },
      {
        media: 'https://picsum.photos/id/1018/1080/1920',
        mediaType: 'image',
      },
    ],
  },
  {
    profileImage: 'https://picsum.photos/id/1025/200/200',
    profileName: 'Abdullah Ansari 2',
    id: 2,
    stories: [
      {
        media: 'https://raw.githubusercontent.com/AbdullahAnsarii/rn-story/master/docs/demo.mp4',
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

  // Build the header per story at render time. Keeping JSX out of state means
  // the header always reflects the profile that is actually showing.
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
            <Close height={28} width={28} fill={'#fff'} stroke={'#fff'} />
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
          loadingComponent={
            <Text style={styles.loading}>Custom Loading...</Text>
          }
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
