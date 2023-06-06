import { useState } from 'react';
import {
    StyleSheet,
    View,
    Image,
    Text,
    Pressable
} from 'react-native';
import type { Data } from './types';
import StoryView from './StoryView';
import { FlatList } from 'react-native';
import { Dimensions } from 'react-native';
import type { ViewStyle } from 'react-native';
import type { TextStyle } from 'react-native';
import type { ImageStyle } from 'react-native';

type PropTypes = {
    data: Data[]
    verticalOrientation?: boolean,
    storySeparation?: number,
    newStoryBorderColor?: string,
    viewedStoryBorderColor?: string,
    storyContainerStyles?: ViewStyle,
    profileImageStyles?: ImageStyle,
    profileNameStyles?: TextStyle,
    imageStoryDuration?: number,
    videoVolume?: number,
    isAnimationBarRounded?: boolean,
    animationBarHeight?: number,
    animationBarColor?: string,
    headerGradientTransparency?: number,
    iconSize?: number,
    iconColor?: string,
    storyViewProfileImageStyles?: ImageStyle,
    storyViewProfileNameStyles?: TextStyle,
    seeMoreLink?: string,
    seeMoreText?: string,
    seeMoreContainerStyles?: ViewStyle,
    seeMoreStyles?: ViewStyle,
    seeMoreTextStyles?: TextStyle,
    seeMoreIconSize?: number,
    seeMoreIconColor?: string,
}

export default function Stories({
    data,
    verticalOrientation,
    storySeparation,
    newStoryBorderColor,
    viewedStoryBorderColor,
    storyContainerStyles,
    profileImageStyles,
    profileNameStyles,
    imageStoryDuration,
    videoVolume,
    isAnimationBarRounded,
    animationBarHeight,
    animationBarColor,
    headerGradientTransparency,
    iconSize,
    iconColor,
    storyViewProfileImageStyles,
    storyViewProfileNameStyles,
    seeMoreText,
    seeMoreContainerStyles,
    seeMoreStyles,
    seeMoreTextStyles,
    seeMoreIconSize,
    seeMoreIconColor,
}: PropTypes) {
    
    const [stories, setStories] = useState<Data[]>(data);
    const [currentStoryIndex, setCurrentStoryIndex] = useState<number | null>(null);
    return (
        <>
            <FlatList
                horizontal={verticalOrientation ? false : true}
                data={stories}
                keyExtractor={(item) => "story-" + item.id.toString()}
                renderItem={({ item, index }) => (
                    <Pressable
                        onPress={() => setCurrentStoryIndex(index)}
                        style={[styles.storyContainer, verticalOrientation ? styles.verticalContainer : undefined, storyContainerStyles]}>
                        <View
                            style={[styles.imageContainer,
                            item.viewed ?
                                (viewedStoryBorderColor ? { borderColor: 'red' } : styles.viewedStory)
                                : (newStoryBorderColor ? { borderColor: newStoryBorderColor } : styles.newStory)]}>
                            <Image
                                style={[styles.storyImage, profileImageStyles]}
                                resizeMode={"cover"}
                                source={{ uri: item?.profileImage }}
                            />
                        </View>
                        <Text
                            numberOfLines={1}
                            style={[verticalOrientation ? styles.profileNameVertical : styles.profileNameHorizontal, profileNameStyles]}>
                            {item?.profileName}
                        </Text>
                    </Pressable>
                )}
                ItemSeparatorComponent={() => <View
                    style={{
                        width: storySeparation ? storySeparation : 12,
                        height: storySeparation ? storySeparation : 12
                    }} />}
            />

            {currentStoryIndex !== null &&
                <StoryView
                    stories={stories}
                    currentStoryIndex={currentStoryIndex}
                    setCurrentStoryIndex={setCurrentStoryIndex}
                    setStories={setStories}
                    imageStoryDuration={imageStoryDuration}
                    videoVolume={videoVolume}
                    isAnimationBarRounded={isAnimationBarRounded}
                    animationBarHeight={animationBarHeight}
                    animationBarColor={animationBarColor}
                    headerGradientTransparency={headerGradientTransparency}
                    iconSize={iconSize}
                    iconColor={iconColor}
                    storyViewProfileImageStyles={storyViewProfileImageStyles}
                    storyViewProfileNameStyles={storyViewProfileNameStyles}
                    seeMoreText={seeMoreText}
                    seeMoreContainerStyles={seeMoreContainerStyles}
                    seeMoreStyles={seeMoreStyles}
                    seeMoreTextStyles={seeMoreTextStyles}
                    seeMoreIconSize={seeMoreIconSize}
                    seeMoreIconColor={seeMoreIconColor}
                />}
        </>
    );
}

const styles = StyleSheet.create({
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

