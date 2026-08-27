// rn-story live demo — https://github.com/AbdullahAnsarii/rn-story
// Tap an avatar to open its stories. Tap right/left to navigate,
// long-press to pause, and watch the See More button on the first story.
import * as React from 'react';
import { useCallback, useMemo, useState } from 'react';
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
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
    profileName: 'Abdullah',
    profileImage: 'https://picsum.photos/id/64/200/200',
    stories: [
      {
        media: 'https://picsum.photos/id/1015/1080/1920',
        mediaType: 'image',
        seeMoreUrl: 'https://github.com/AbdullahAnsarii/rn-story',
      },
      {
        media: 'https://picsum.photos/id/1016/1080/1920',
        mediaType: 'image',
        duration: 6000,
      },
      {
        media: 'https://picsum.photos/id/1018/1080/1920',
        mediaType: 'image',
      },
    ],
  },
  {
    id: 2,
    profileName: 'Pug life',
    profileImage: 'https://picsum.photos/id/1025/200/200',
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
  // null means the story viewer is closed
  const [current, setCurrent] = useState<number | null>(null);
  const [viewed, setViewed] = useState<Record<number, boolean>>({});

  const close = useCallback(() => setCurrent(null), []);

  const nextProfile = useCallback(() => {
    setCurrent((i) => {
      if (i === null) {
        return null;
      }
      const id = PROFILES[i].id;
      setViewed((seen) => ({ ...seen, [id]: true }));
      return i < PROFILES.length - 1 ? i + 1 : null;
    });
  }, []);

  const previousProfile = useCallback(() => {
    setCurrent((i) => (i === null || i === 0 ? null : i - 1));
  }, []);

  const profile = current === null ? null : PROFILES[current];

  // Attach a header (avatar, name, close button) to every story.
  const stories = useMemo<Story[]>(() => {
    if (!profile) {
      return [];
    }
    const header = (
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image
            source={{ uri: profile.profileImage }}
            style={styles.headerAvatar}
          />
          <Text style={styles.headerName}>{profile.profileName}</Text>
        </View>
        <Pressable onPress={close} hitSlop={12}>
          <Text style={styles.headerClose}>✕</Text>
        </Pressable>
      </View>
    );
    return profile.stories.map((story) => ({ ...story, header }));
  }, [profile, close]);

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" />
      <Text style={styles.title}>rn-story</Text>
      <Text style={styles.subtitle}>Tap an avatar to open its stories</Text>
      <ScrollView horizontal contentContainerStyle={styles.rail}>
        {PROFILES.map((item, index) => (
          <Pressable
            key={item.id}
            onPress={() => setCurrent(index)}
            style={styles.railItem}
          >
            <View
              style={[
                styles.ring,
                viewed[item.id] ? styles.ringViewed : styles.ringNew,
              ]}
            >
              <Image
                source={{ uri: item.profileImage }}
                style={styles.avatar}
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
          onAllStoriesEnd={nextProfile}
          onPreviousFirstStory={previousProfile}
          onClose={close}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 44,
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    height: 48,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  headerName: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 10,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowRadius: 4,
  },
  headerClose: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowRadius: 4,
  },
});
