// rn-story example — https://github.com/AbdullahAnsarii/rn-story
//
// An avatar rail that opens each profile's stories, with a custom header
// (gradient, avatar, mute and close buttons), a See More link, viewed
// indicators, and playback that moves on to the next profile by itself.
import * as React from 'react';
import { useCallback, useMemo, useState } from 'react';
import {
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Stories from 'rn-story';
import type { Story } from 'rn-story';
import Close from '../assets/Close';
import Mute from '../assets/Mute';
import Unmute from '../assets/Unmute';

const { width } = Dimensions.get('window');

export type Profile = {
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
  {
    id: 3,
    profileName: 'Big Buck Bunny',
    profileImage: 'https://picsum.photos/id/1011/200/200',
    stories: [
      {
        // A longer clip, played in full: the story ends when the video does.
        media:
          'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_2MB.mp4',
        mediaType: 'video',
        seeMoreUrl: 'https://github.com/AbdullahAnsarii/rn-story',
      },
      {
        media: 'https://picsum.photos/id/1011/1080/1920',
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
      const id = PROFILES[index]!.id;
      setViewed((seen) => ({ ...seen, [id]: true }));
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
        <LinearGradient
          colors={['rgba(0,0,0,0.45)', 'transparent']}
          style={styles.headerGradient}
        />
        <View style={styles.headerProfile}>
          <Image
            style={styles.headerAvatar}
            source={{ uri: profile.profileImage }}
          />
          <Text numberOfLines={1} style={styles.headerName}>
            {profile.profileName}
          </Text>
        </View>
        <View style={styles.headerButtons}>
          <Pressable
            onPress={toggleMute}
            hitSlop={8}
            style={styles.headerButton}
          >
            {muted ? (
              <Mute height={24} width={24} fill="#fff" stroke="#fff" />
            ) : (
              <Unmute height={24} width={24} fill="#fff" stroke="#fff" />
            )}
          </Pressable>
          <Pressable onPress={close} hitSlop={8} style={styles.headerButton}>
            <Close height={28} width={28} fill="#fff" stroke="#fff" />
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
        <Text style={styles.title}>rn-story</Text>
        <Text style={styles.subtitle}>Tap an avatar to open its stories</Text>
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
                <Image
                  style={styles.avatar}
                  resizeMode="cover"
                  source={{ uri: item.profileImage }}
                />
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
            onStoryStart={(index, story) =>
              console.log(`story ${index} started`, story.media)
            }
          />
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    marginTop: 24,
    marginHorizontal: 16,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  rail: {
    paddingHorizontal: 12,
  },
  railItem: {
    alignItems: 'center',
    marginHorizontal: 6,
    width: 76,
  },
  ring: {
    borderWidth: 2,
    borderRadius: 40,
    padding: 3,
  },
  ringNew: {
    borderColor: '#25D366',
  },
  ringViewed: {
    borderColor: '#D3D3D3',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  railName: {
    fontSize: 12,
    marginTop: 4,
    width: 76,
    textAlign: 'center',
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  headerGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: -64,
    height: 120,
  },
  headerProfile: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAvatar: {
    height: 36,
    width: 36,
    borderRadius: 18,
  },
  headerName: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 10,
    maxWidth: width / 1.75,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowRadius: 4,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    marginLeft: 16,
  },
});
